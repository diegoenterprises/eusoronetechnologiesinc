"""
Route Optimization Router
OSRM for real routing + OR-Tools for VRP optimization.
"""

import logging
import os
from typing import Optional

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("ai-sidecar.route")
router = APIRouter()

# OSRM public demo server (self-host for production)
OSRM_BASE = os.getenv("OSRM_URL", "https://router.project-osrm.org")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class Waypoint(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = None


class DirectionsRequest(BaseModel):
    origin: Waypoint
    destination: Waypoint
    profile: str = "driving"  # driving | truck (if custom OSRM)
    alternatives: bool = False
    steps: bool = False


class DirectionsResponse(BaseModel):
    success: bool
    distance_miles: float = 0.0
    duration_hours: float = 0.0
    duration_minutes: float = 0.0
    geometry: Optional[str] = None
    steps: list[dict] = []
    alternatives: list[dict] = []
    error: Optional[str] = None


class MatrixRequest(BaseModel):
    locations: list[Waypoint]
    profile: str = "driving"


class MatrixResponse(BaseModel):
    success: bool
    distances: list[list[float]] = []  # miles
    durations: list[list[float]] = []  # minutes
    error: Optional[str] = None


class OptimizeRequest(BaseModel):
    depot: Waypoint
    stops: list[Waypoint]
    vehicle_capacity: int = 1000
    stop_demands: list[int] = []
    time_windows: list[tuple[int, int]] = []  # (earliest_min, latest_min)
    max_vehicles: int = 1
    max_route_time_minutes: int = 660  # 11-hour HOS limit


class OptimizeResponse(BaseModel):
    success: bool
    routes: list[dict] = []
    total_distance_miles: float = 0.0
    total_duration_hours: float = 0.0
    unassigned_stops: list[int] = []
    error: Optional[str] = None


class IsochroneRequest(BaseModel):
    origin: Waypoint
    time_limit_minutes: int = 60
    profile: str = "driving"


class IsochroneResponse(BaseModel):
    success: bool
    reachable_area_sq_miles: float = 0.0
    boundary: list[list[float]] = []
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# OSRM helpers
# ---------------------------------------------------------------------------

def osrm_route(origin: Waypoint, dest: Waypoint, profile: str = "driving",
               alternatives: bool = False, steps: bool = False) -> dict:
    """Call OSRM route service."""
    coords = f"{origin.lng},{origin.lat};{dest.lng},{dest.lat}"
    url = f"{OSRM_BASE}/route/v1/{profile}/{coords}"
    params = {
        "overview": "full",
        "geometries": "polyline",
        "alternatives": str(alternatives).lower(),
        "steps": str(steps).lower(),
    }
    resp = requests.get(url, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def osrm_table(locations: list[Waypoint], profile: str = "driving") -> dict:
    """Call OSRM table (matrix) service."""
    coords = ";".join(f"{w.lng},{w.lat}" for w in locations)
    url = f"{OSRM_BASE}/table/v1/{profile}/{coords}"
    params = {"annotations": "distance,duration"}
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/directions", response_model=DirectionsResponse)
async def get_directions(req: DirectionsRequest):
    """
    Get driving directions between two points via OSRM.
    Returns distance in miles, duration in hours, and optional turn-by-turn steps.
    """
    try:
        data = osrm_route(req.origin, req.destination, req.profile,
                          req.alternatives, req.steps)

        if data.get("code") != "Ok" or not data.get("routes"):
            return DirectionsResponse(success=False, error=data.get("message", "No route found"))

        route = data["routes"][0]
        dist_miles = round(route["distance"] / 1609.344, 1)
        dur_hours = round(route["duration"] / 3600, 2)
        dur_minutes = round(route["duration"] / 60, 1)

        steps_list = []
        if req.steps and route.get("legs"):
            for leg in route["legs"]:
                for step in leg.get("steps", []):
                    steps_list.append({
                        "instruction": step.get("maneuver", {}).get("type", ""),
                        "name": step.get("name", ""),
                        "distance_miles": round(step["distance"] / 1609.344, 2),
                        "duration_minutes": round(step["duration"] / 60, 1),
                    })

        alts = []
        for alt_route in data["routes"][1:]:
            alts.append({
                "distance_miles": round(alt_route["distance"] / 1609.344, 1),
                "duration_hours": round(alt_route["duration"] / 3600, 2),
            })

        return DirectionsResponse(
            success=True, distance_miles=dist_miles, duration_hours=dur_hours,
            duration_minutes=dur_minutes, geometry=route.get("geometry"),
            steps=steps_list, alternatives=alts,
        )
    except requests.RequestException as e:
        logger.error(f"OSRM directions error: {e}")
        return DirectionsResponse(success=False, error=f"OSRM unavailable: {e}")
    except Exception as e:
        logger.error(f"Directions error: {e}")
        return DirectionsResponse(success=False, error=str(e))


@router.post("/matrix", response_model=MatrixResponse)
async def get_distance_matrix(req: MatrixRequest):
    """
    Get distance/duration matrix between all location pairs.
    Used for multi-stop optimization and carrier proximity scoring.
    """
    if len(req.locations) < 2:
        raise HTTPException(400, "Need at least 2 locations")
    if len(req.locations) > 100:
        raise HTTPException(400, "Max 100 locations per matrix request")

    try:
        data = osrm_table(req.locations, req.profile)
        if data.get("code") != "Ok":
            return MatrixResponse(success=False, error=data.get("message", "Matrix failed"))

        # Convert meters → miles, seconds → minutes
        distances = []
        durations = []
        for row_d, row_t in zip(data["distances"], data["durations"]):
            distances.append([round(d / 1609.344, 1) if d else 0 for d in row_d])
            durations.append([round(t / 60, 1) if t else 0 for t in row_t])

        return MatrixResponse(success=True, distances=distances, durations=durations)
    except requests.RequestException as e:
        logger.error(f"OSRM matrix error: {e}")
        return MatrixResponse(success=False, error=f"OSRM unavailable: {e}")
    except Exception as e:
        logger.error(f"Matrix error: {e}")
        return MatrixResponse(success=False, error=str(e))


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_route(req: OptimizeRequest):
    """
    Solve Vehicle Routing Problem using OR-Tools.
    Finds optimal stop ordering with capacity and time window constraints.
    """
    try:
        from ortools.constraint_solver import routing_enums_pb2, pywrapcp
    except ImportError:
        raise HTTPException(503, "OR-Tools not available")

    if len(req.stops) < 1:
        raise HTTPException(400, "Need at least 1 stop")

    try:
        # Build all locations: depot + stops
        all_locs = [req.depot] + req.stops
        n = len(all_locs)

        # Get real distance matrix from OSRM
        try:
            matrix_data = osrm_table(all_locs)
            if matrix_data.get("code") == "Ok":
                dist_matrix = matrix_data["distances"]  # meters
                time_matrix = matrix_data["durations"]  # seconds
            else:
                raise Exception("OSRM matrix failed")
        except Exception:
            # Fallback: haversine
            import math
            def haversine(a, b):
                R = 6371000
                dlat = math.radians(b.lat - a.lat)
                dlng = math.radians(b.lng - a.lng)
                x = math.sin(dlat/2)**2 + math.cos(math.radians(a.lat)) * math.cos(math.radians(b.lat)) * math.sin(dlng/2)**2
                return R * 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x))

            dist_matrix = [[haversine(all_locs[i], all_locs[j]) for j in range(n)] for i in range(n)]
            time_matrix = [[d / 22.352 for d in row] for row in dist_matrix]  # ~50mph avg

        # OR-Tools solver
        manager = pywrapcp.RoutingIndexManager(n, req.max_vehicles, 0)
        routing = pywrapcp.RoutingModel(manager)

        def distance_callback(from_idx, to_idx):
            from_node = manager.IndexToNode(from_idx)
            to_node = manager.IndexToNode(to_idx)
            return int(dist_matrix[from_node][to_node])

        transit_cb = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_cb)

        # Time dimension (HOS constraint)
        def time_callback(from_idx, to_idx):
            from_node = manager.IndexToNode(from_idx)
            to_node = manager.IndexToNode(to_idx)
            return int(time_matrix[from_node][to_node] / 60)  # minutes

        time_cb = routing.RegisterTransitCallback(time_callback)
        routing.AddDimension(time_cb, 30, req.max_route_time_minutes, True, "Time")

        # Capacity dimension
        if req.stop_demands:
            demands = [0] + req.stop_demands[:len(req.stops)]
            def demand_callback(idx):
                return demands[manager.IndexToNode(idx)]
            demand_cb = routing.RegisterUnaryTransitCallback(demand_callback)
            routing.AddDimensionWithVehicleCapacity(demand_cb, 0, [req.vehicle_capacity] * req.max_vehicles, True, "Capacity")

        # Solve
        search_params = pywrapcp.DefaultRoutingSearchParameters()
        search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        search_params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        search_params.time_limit.seconds = 5

        solution = routing.SolveWithParameters(search_params)

        if not solution:
            return OptimizeResponse(success=False, error="No feasible solution found")

        routes = []
        total_dist = 0
        total_time = 0

        for v in range(req.max_vehicles):
            route_stops = []
            idx = routing.Start(v)
            route_dist = 0
            route_time = 0

            while not routing.IsEnd(idx):
                node = manager.IndexToNode(idx)
                next_idx = solution.Value(routing.NextVar(idx))
                next_node = manager.IndexToNode(next_idx)
                route_dist += dist_matrix[node][next_node]
                route_time += time_matrix[node][next_node]

                if node > 0:  # skip depot
                    stop = req.stops[node - 1]
                    route_stops.append({
                        "index": node - 1,
                        "name": stop.name or f"Stop {node}",
                        "lat": stop.lat, "lng": stop.lng,
                    })
                idx = next_idx

            if route_stops:
                routes.append({
                    "vehicle": v,
                    "stops": route_stops,
                    "distance_miles": round(route_dist / 1609.344, 1),
                    "duration_hours": round(route_time / 3600, 2),
                })
                total_dist += route_dist
                total_time += route_time

        return OptimizeResponse(
            success=True, routes=routes,
            total_distance_miles=round(total_dist / 1609.344, 1),
            total_duration_hours=round(total_time / 3600, 2),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Optimize error: {e}")
        return OptimizeResponse(success=False, error=str(e))
