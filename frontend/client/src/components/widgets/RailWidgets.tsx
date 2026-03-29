/**
 * RAIL WIDGETS
 * Dashboard widgets for all rail operations — shipper, catalyst, dispatcher,
 * engineer, conductor, broker, and crew roles.
 * Each widget uses tRPC queries with safe fallback for missing endpoints.
 */

import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { WidgetLoader, MiniStats, StatRow, WidgetList } from "./WidgetHelpers";
import {
  Train, Package, Clock, Users, DollarSign, AlertCircle,
  Shield, TrendingUp, MapPin, Wrench, CheckCircle, Gauge,
  FileText, Activity, BarChart3, Box, Award, CloudSun,
  ArrowRight, Warehouse, Store, Route, Radio
} from "lucide-react";

// ============================================================================
// HELPER — safe tRPC query with fallback
// ============================================================================
const useRailQuery = (path: string) => {
  try {
    const parts = path.split(".");
    let ref: any = trpc;
    for (const p of parts) ref = ref?.[p];
    return ref?.useQuery?.() ?? { data: null, isLoading: false };
  } catch {
    return { data: null, isLoading: false };
  }
};

// ============================================================================
// RAIL SHIPPER / GENERAL OPERATIONS WIDGETS
// ============================================================================

export const RailActiveShipmentsWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getRailDashboardStats");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Active", value: data?.activeShipments ?? 0, color: "bg-blue-500/20" },
          { label: "In Transit", value: data?.inTransit ?? 0, color: "bg-green-500/20" },
          { label: "Delivered", value: data?.delivered ?? 0, color: "bg-emerald-500/20" },
        ]} />
        {exp && <StatRow label="Pending Pickup" value={data?.pendingPickup ?? 0} color="text-yellow-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailYardOpsWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getYardOperations");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Tracks Occupied", value: data?.tracksOccupied ?? 0, color: "bg-orange-500/20" },
          { label: "Cars in Yard", value: data?.carsInYard ?? 0, color: "bg-blue-500/20" },
          { label: "Departures", value: data?.scheduledDepartures ?? 0, color: "bg-green-500/20" },
        ]} />
        {exp && <StatRow label="Avg Dwell (hrs)" value={data?.avgDwellHours ?? "—"} color="text-cyan-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailCrewStatusWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getCrewStatus");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "On Duty", value: data?.onDuty ?? 0, color: "bg-green-500/20" },
          { label: "Off Duty", value: data?.offDuty ?? 0, color: "bg-slate-500/20" },
          { label: "Resting", value: data?.resting ?? 0, color: "bg-blue-500/20" },
        ]} />
        {exp && <StatRow label="Available Next 4h" value={data?.availableSoon ?? 0} color="text-emerald-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailConsistStatusWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getConsistStatus");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Active Consists", value: data?.active ?? 0, color: "bg-purple-500/20" },
          { label: "Cars Loaded", value: data?.carsLoaded ?? 0, color: "bg-blue-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Avg Length" value={`${data?.avgLength ?? 0} cars`} color="text-cyan-400" />
            <StatRow label="Total Tonnage" value={`${data?.totalTonnage ?? 0} t`} color="text-orange-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailDemurrageWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getDemurrageStats");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Active Charges", value: data?.activeCharges ?? 0, color: "bg-red-500/20" },
          { label: "Total Owed", value: `$${(data?.totalOwed ?? 0).toLocaleString()}`, color: "bg-orange-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Cars at Risk" value={data?.carsAtRisk ?? 0} color="text-yellow-400" />
            <StatRow label="Free Time Left (avg)" value={`${data?.avgFreeTimeHrs ?? 0}h`} color="text-green-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailComplianceWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getComplianceStatus");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Compliant", value: data?.compliant ?? 0, color: "bg-green-500/20" },
          { label: "Warnings", value: data?.warnings ?? 0, color: "bg-yellow-500/20" },
          { label: "Violations", value: data?.violations ?? 0, color: "bg-red-500/20" },
        ]} />
        {exp && <StatRow label="FRA Score" value={`${data?.fraScore ?? 0}%`} color="text-emerald-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailSafetyWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getSafetyStats");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Days w/o Incident", value: data?.daysWithout ?? 0, color: "bg-green-500/20" },
          { label: "Open Reports", value: data?.openReports ?? 0, color: "bg-orange-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Near Misses (30d)" value={data?.nearMisses ?? 0} color="text-yellow-400" />
            <StatRow label="Safety Score" value={`${data?.safetyScore ?? 0}%`} color="text-emerald-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailWeatherWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getRouteWeather");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Alerts", value: data?.activeAlerts ?? 0, color: "bg-yellow-500/20" },
          { label: "Routes Affected", value: data?.routesAffected ?? 0, color: "bg-orange-500/20" },
        ]} />
        {exp && (
          <WidgetList
            items={data?.alerts ?? []}
            empty="No weather alerts"
            renderItem={(a: any, i: number) => (
              <StatRow key={i} label={a.route ?? "Route"} value={a.condition ?? "Clear"} color="text-yellow-400" />
            )}
          />
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// RAIL MARKETPLACE / RATES / ANALYTICS WIDGETS
// ============================================================================

export const RailMarketplaceWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getMarketplace");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Listings", value: data?.totalListings ?? 0, color: "bg-blue-500/20" },
          { label: "Bids Open", value: data?.openBids ?? 0, color: "bg-purple-500/20" },
          { label: "Booked Today", value: data?.bookedToday ?? 0, color: "bg-green-500/20" },
        ]} />
        {exp && <StatRow label="Avg Rate/Car" value={`$${data?.avgRatePerCar ?? 0}`} color="text-cyan-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailRatesWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getRateQuotes");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Avg Rate/Mile", value: `$${data?.avgPerMile ?? "—"}`, color: "bg-green-500/20" },
          { label: "Quotes Pending", value: data?.pending ?? 0, color: "bg-yellow-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Rate Trend" value={data?.trend ?? "Stable"} color="text-blue-400" />
            <StatRow label="Active Tariffs" value={data?.activeTariffs ?? 0} color="text-purple-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailScheduleAdherenceWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getScheduleAdherence");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "On Time", value: `${data?.onTimePercent ?? 0}%`, color: "bg-green-500/20" },
          { label: "Late", value: data?.late ?? 0, color: "bg-red-500/20" },
          { label: "Early", value: data?.early ?? 0, color: "bg-blue-500/20" },
        ]} />
        {exp && <StatRow label="Avg Delay" value={`${data?.avgDelayMins ?? 0} min`} color="text-orange-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailUtilizationWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getUtilization");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Fleet Util.", value: `${data?.fleetPercent ?? 0}%`, color: "bg-cyan-500/20" },
          { label: "Loaded Cars", value: data?.loadedCars ?? 0, color: "bg-green-500/20" },
          { label: "Empty Cars", value: data?.emptyCars ?? 0, color: "bg-slate-500/20" },
        ]} />
        {exp && <StatRow label="Revenue/Car/Day" value={`$${data?.revenuePerCarDay ?? 0}`} color="text-emerald-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// RAIL INFRASTRUCTURE WIDGETS
// ============================================================================

export const RailIntermodalWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getIntermodal");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Containers", value: data?.activeContainers ?? 0, color: "bg-blue-500/20" },
          { label: "In Transfer", value: data?.inTransfer ?? 0, color: "bg-orange-500/20" },
          { label: "Awaiting Pickup", value: data?.awaitingPickup ?? 0, color: "bg-yellow-500/20" },
        ]} />
        {exp && <StatRow label="Avg Transfer Time" value={`${data?.avgTransferHrs ?? 0}h`} color="text-cyan-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailInterchangeWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getInterchangeStatus");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Pending", value: data?.pending ?? 0, color: "bg-yellow-500/20" },
          { label: "Completed", value: data?.completed ?? 0, color: "bg-green-500/20" },
          { label: "Rejected", value: data?.rejected ?? 0, color: "bg-red-500/20" },
        ]} />
        {exp && <StatRow label="Interchange Partners" value={data?.partners ?? 0} color="text-blue-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailSwitchingWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getSwitchingOrders");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Active Orders", value: data?.activeOrders ?? 0, color: "bg-purple-500/20" },
          { label: "Cars to Switch", value: data?.carsToSwitch ?? 0, color: "bg-blue-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Completed Today" value={data?.completedToday ?? 0} color="text-green-400" />
            <StatRow label="Avg Switch Time" value={`${data?.avgSwitchMins ?? 0} min`} color="text-cyan-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailTerminalsWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getTerminalStatus");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Terminals", value: data?.totalTerminals ?? 0, color: "bg-blue-500/20" },
          { label: "Active", value: data?.activeTerminals ?? 0, color: "bg-green-500/20" },
          { label: "Congested", value: data?.congested ?? 0, color: "bg-red-500/20" },
        ]} />
        {exp && <StatRow label="Avg Capacity" value={`${data?.avgCapacity ?? 0}%`} color="text-cyan-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailTrackAllocationWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getTrackAllocation");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Tracks Assigned", value: data?.assigned ?? 0, color: "bg-blue-500/20" },
          { label: "Available", value: data?.available ?? 0, color: "bg-green-500/20" },
          { label: "Maintenance", value: data?.maintenance ?? 0, color: "bg-orange-500/20" },
        ]} />
        {exp && <StatRow label="Utilization" value={`${data?.utilization ?? 0}%`} color="text-purple-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailTrainManifestWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getTrainManifest");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Cars", value: data?.totalCars ?? 0, color: "bg-blue-500/20" },
          { label: "Hazmat", value: data?.hazmatCars ?? 0, color: "bg-red-500/20" },
          { label: "Tonnage", value: `${data?.totalTons ?? 0}t`, color: "bg-purple-500/20" },
        ]} />
        {exp && (
          <WidgetList
            items={data?.cars?.slice(0, 4) ?? []}
            empty="No manifest data"
            renderItem={(c: any, i: number) => (
              <StatRow key={i} label={c.carNumber ?? `Car ${i+1}`} value={c.commodity ?? "Empty"} color="text-cyan-400" />
            )}
          />
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailLocomotivesWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getLocomotiveStatus");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Active", value: data?.active ?? 0, color: "bg-green-500/20" },
          { label: "In Shop", value: data?.inShop ?? 0, color: "bg-orange-500/20" },
          { label: "Available", value: data?.available ?? 0, color: "bg-blue-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Total Fleet" value={data?.totalFleet ?? 0} color="text-white" />
            <StatRow label="Avg Fuel Level" value={`${data?.avgFuelLevel ?? 0}%`} color="text-cyan-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// RAIL BROKER WIDGETS
// ============================================================================

export const RailBrkShipmentsWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getBrokeredShipments");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Active", value: data?.active ?? 0, color: "bg-blue-500/20" },
          { label: "In Transit", value: data?.inTransit ?? 0, color: "bg-green-500/20" },
          { label: "Delivered", value: data?.delivered ?? 0, color: "bg-emerald-500/20" },
        ]} />
        {exp && <StatRow label="Pending Booking" value={data?.pendingBooking ?? 0} color="text-yellow-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailBrkRatesWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getBrokerRateAnalysis");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Avg Rate", value: `$${data?.avgRate ?? 0}`, color: "bg-green-500/20" },
          { label: "Trend", value: data?.trend ?? "Stable", color: "bg-blue-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Best Lane" value={data?.bestLane ?? "—"} color="text-emerald-400" />
            <StatRow label="Quotes Sent" value={data?.quotesSent ?? 0} color="text-purple-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailBrkCommissionWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getBrokerCommission");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "This Month", value: `$${(data?.thisMonth ?? 0).toLocaleString()}`, color: "bg-green-500/20" },
          { label: "Loads", value: data?.loads ?? 0, color: "bg-blue-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Avg Margin" value={`${data?.avgMargin ?? 0}%`} color="text-purple-400" />
            <StatRow label="YTD Total" value={`$${(data?.ytdTotal ?? 0).toLocaleString()}`} color="text-emerald-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailBrkCapacityWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getBrokerCapacity");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Available Cars", value: data?.availableCars ?? 0, color: "bg-green-500/20" },
          { label: "Carriers", value: data?.carriers ?? 0, color: "bg-blue-500/20" },
          { label: "Lanes Covered", value: data?.lanes ?? 0, color: "bg-purple-500/20" },
        ]} />
        {exp && <StatRow label="Capacity Utilization" value={`${data?.utilization ?? 0}%`} color="text-cyan-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailBrkMarketWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getBrokerMarketRates");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Market Avg", value: `$${data?.marketAvg ?? 0}`, color: "bg-blue-500/20" },
          { label: "Your Avg", value: `$${data?.yourAvg ?? 0}`, color: "bg-green-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Spread" value={`${data?.spread ?? 0}%`} color="text-yellow-400" />
            <StatRow label="Volume Trend" value={data?.volumeTrend ?? "Stable"} color="text-cyan-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailBrkPerformanceWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getBrokerPerformance");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Win Rate", value: `${data?.winRate ?? 0}%`, color: "bg-green-500/20" },
          { label: "Avg Response", value: `${data?.avgResponseHrs ?? 0}h`, color: "bg-blue-500/20" },
          { label: "Rating", value: data?.rating ?? "—", color: "bg-purple-500/20" },
        ]} />
        {exp && <StatRow label="Repeat Shippers" value={`${data?.repeatShipperPercent ?? 0}%`} color="text-emerald-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailBrkNetworkWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getBrokerNetwork");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Carriers", value: data?.totalCarriers ?? 0, color: "bg-blue-500/20" },
          { label: "Shippers", value: data?.totalShippers ?? 0, color: "bg-green-500/20" },
          { label: "Active Lanes", value: data?.activeLanes ?? 0, color: "bg-purple-500/20" },
        ]} />
        {exp && <StatRow label="New This Month" value={data?.newThisMonth ?? 0} color="text-cyan-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// RAIL ENGINEER WIDGETS
// ============================================================================

export const RailEngAssignmentsWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getEngineerAssignment");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Train #", value: data?.trainNumber ?? "—", color: "bg-blue-500/20" },
          { label: "Status", value: data?.status ?? "Off Duty", color: "bg-green-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Origin" value={data?.origin ?? "—"} color="text-cyan-400" />
            <StatRow label="Destination" value={data?.destination ?? "—"} color="text-purple-400" />
            <StatRow label="ETA" value={data?.eta ?? "—"} color="text-orange-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailEngHosWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getEngineerHOS");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "On Duty", value: `${data?.onDutyHrs ?? 0}h`, color: "bg-blue-500/20" },
          { label: "Remaining", value: `${data?.remainingHrs ?? 0}h`, color: "bg-green-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Status" value={data?.status ?? "Off Duty"} color="text-cyan-400" />
            <StatRow label="Mandatory Rest In" value={`${data?.restInHrs ?? 0}h`} color="text-yellow-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailEngSafetyWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getEngineerSafetyAlerts");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Active Alerts", value: data?.activeAlerts ?? 0, color: "bg-red-500/20" },
          { label: "Speed Limits", value: data?.speedRestrictions ?? 0, color: "bg-yellow-500/20" },
        ]} />
        {exp && (
          <WidgetList
            items={data?.alerts?.slice(0, 3) ?? []}
            empty="No active alerts"
            renderItem={(a: any, i: number) => (
              <StatRow key={i} label={a.type ?? "Alert"} value={a.detail ?? "—"} color="text-red-400" />
            )}
          />
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailEngRouteWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getEngineerRoute");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Miles Left", value: data?.milesRemaining ?? 0, color: "bg-blue-500/20" },
          { label: "Next Stop", value: data?.nextStop ?? "—", color: "bg-green-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Current Speed" value={`${data?.currentSpeed ?? 0} mph`} color="text-cyan-400" />
            <StatRow label="Track Class" value={data?.trackClass ?? "—"} color="text-purple-400" />
            <StatRow label="Grade Ahead" value={data?.gradeAhead ?? "—"} color="text-orange-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// RAIL CONDUCTOR WIDGETS
// ============================================================================

export const RailConAssignmentsWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getConductorAssignment");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Train #", value: data?.trainNumber ?? "—", color: "bg-blue-500/20" },
          { label: "Cars", value: data?.totalCars ?? 0, color: "bg-purple-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Origin" value={data?.origin ?? "—"} color="text-cyan-400" />
            <StatRow label="Destination" value={data?.destination ?? "—"} color="text-purple-400" />
            <StatRow label="Role" value={data?.role ?? "Conductor"} color="text-green-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailConYardWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getConductorYard");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Current Yard", value: data?.yardName ?? "—", color: "bg-blue-500/20" },
          { label: "Tracks Active", value: data?.tracksActive ?? 0, color: "bg-green-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Cars to Move" value={data?.carsToMove ?? 0} color="text-orange-400" />
            <StatRow label="Switch Orders" value={data?.switchOrders ?? 0} color="text-purple-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailConDocsWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getConductorDocs");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Pending", value: data?.pending ?? 0, color: "bg-yellow-500/20" },
          { label: "Completed", value: data?.completed ?? 0, color: "bg-green-500/20" },
          { label: "Overdue", value: data?.overdue ?? 0, color: "bg-red-500/20" },
        ]} />
        {exp && <StatRow label="Inspection Reports" value={data?.inspectionReports ?? 0} color="text-blue-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailConSafetyWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getConductorSafety");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Safety Score", value: `${data?.safetyScore ?? 0}%`, color: "bg-green-500/20" },
          { label: "Alerts", value: data?.activeAlerts ?? 0, color: "bg-red-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Last Briefing" value={data?.lastBriefing ?? "—"} color="text-blue-400" />
            <StatRow label="Hazmat Cars" value={data?.hazmatCars ?? 0} color="text-orange-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

// ============================================================================
// RAIL CREW WIDGETS
// ============================================================================

export const RailCrewHosWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getCrewHOS");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "On Duty", value: `${data?.onDutyHrs ?? 0}h`, color: "bg-blue-500/20" },
          { label: "Remaining", value: `${data?.remainingHrs ?? 0}h`, color: "bg-green-500/20" },
          { label: "Status", value: data?.status ?? "Off", color: "bg-slate-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Monthly Hours" value={`${data?.monthlyHrs ?? 0}h`} color="text-purple-400" />
            <StatRow label="Rest Required In" value={`${data?.restInHrs ?? 0}h`} color="text-yellow-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailCrewCertsWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getCrewCertifications");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Active Certs", value: data?.activeCerts ?? 0, color: "bg-green-500/20" },
          { label: "Expiring Soon", value: data?.expiringSoon ?? 0, color: "bg-yellow-500/20" },
          { label: "Expired", value: data?.expired ?? 0, color: "bg-red-500/20" },
        ]} />
        {exp && (
          <WidgetList
            items={data?.certs?.slice(0, 3) ?? []}
            empty="No certifications"
            renderItem={(c: any, i: number) => (
              <StatRow key={i} label={c.name ?? "Cert"} value={c.expiresAt ?? "—"} color="text-blue-400" />
            )}
          />
        )}
      </div>
    )}</ResponsiveWidget>
  );
};

export const RailCrewTrainingWidget: React.FC = () => {
  const { data, isLoading } = useRailQuery("railShipments.getCrewTraining");
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <div className="space-y-2">
        <MiniStats items={[
          { label: "Completed", value: data?.completed ?? 0, color: "bg-green-500/20" },
          { label: "In Progress", value: data?.inProgress ?? 0, color: "bg-blue-500/20" },
          { label: "Overdue", value: data?.overdue ?? 0, color: "bg-red-500/20" },
        ]} />
        {exp && (
          <>
            <StatRow label="Next Due" value={data?.nextDue ?? "—"} color="text-yellow-400" />
            <StatRow label="Compliance Rate" value={`${data?.complianceRate ?? 0}%`} color="text-emerald-400" />
          </>
        )}
      </div>
    )}</ResponsiveWidget>
  );
};
