/**
 * Data Event Emitter — Event-driven cache invalidation and notifications
 * Triggers immediate refresh when critical conditions are detected
 */
import { EventEmitter } from "events";
import { smartInvalidateByType, smartForceRefresh } from "../cache/smartCache";

export type DataEventType =
  | "SEVERE_WEATHER"
  | "HAZMAT_SPILL"
  | "FUEL_PRICE_SPIKE"
  | "NEW_REGULATION"
  | "SEISMIC_EVENT"
  | "WILDFIRE_ALERT"
  | "ROAD_CLOSURE"
  | "FEMA_DISASTER";

export interface DataEvent {
  type: DataEventType;
  severity: "INFO" | "WARNING" | "CRITICAL";
  affectedStates: string[];
  affectedZoneIds: string[];
  summary: string;
  timestamp: Date;
  source: string;
  data?: Record<string, unknown>;
}

class HotZonesEventEmitter extends EventEmitter {
  private eventLog: DataEvent[] = [];
  private maxLogSize = 500;

  emitDataEvent(event: DataEvent): void {
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    console.log(`[DataEvent] ${event.type} (${event.severity}): ${event.summary}`);
    this.emit("data_event", event);
    this.emit(event.type, event);

    // Auto-invalidate relevant caches based on event type
    this.handleCacheInvalidation(event);
  }

  private handleCacheInvalidation(event: DataEvent): void {
    switch (event.type) {
      case "SEVERE_WEATHER":
        smartInvalidateByType("WEATHER_ALERTS");
        smartInvalidateByType("ZONE_INTELLIGENCE");
        if (event.severity === "CRITICAL") {
          smartForceRefresh("WEATHER_ALERTS").catch(() => {});
        }
        break;

      case "HAZMAT_SPILL":
        smartInvalidateByType("HAZMAT_INCIDENTS");
        smartInvalidateByType("SPILL_REPORTS");
        smartInvalidateByType("ZONE_INTELLIGENCE");
        break;

      case "FUEL_PRICE_SPIKE":
        smartInvalidateByType("FUEL_PRICES");
        smartInvalidateByType("CRUDE_PRICES");
        smartForceRefresh("FUEL_PRICES").catch(() => {});
        break;

      case "NEW_REGULATION":
        smartInvalidateByType("REGULATIONS");
        break;

      case "SEISMIC_EVENT":
        smartInvalidateByType("SEISMIC_EVENTS");
        smartInvalidateByType("ZONE_INTELLIGENCE");
        break;

      case "WILDFIRE_ALERT":
        smartInvalidateByType("WILDFIRES");
        smartInvalidateByType("ZONE_INTELLIGENCE");
        break;

      case "ROAD_CLOSURE":
        smartInvalidateByType("ROAD_CONDITIONS");
        smartInvalidateByType("ZONE_INTELLIGENCE");
        break;

      case "FEMA_DISASTER":
        smartInvalidateByType("FEMA_DISASTERS");
        smartInvalidateByType("ZONE_INTELLIGENCE");
        break;
    }
  }

  getRecentEvents(limit = 50): DataEvent[] {
    return this.eventLog.slice(-limit).reverse();
  }

  getEventsByType(type: DataEventType, limit = 20): DataEvent[] {
    return this.eventLog.filter((e) => e.type === type).slice(-limit).reverse();
  }

  getEventsByState(state: string, limit = 20): DataEvent[] {
    return this.eventLog
      .filter((e) => e.affectedStates.includes(state))
      .slice(-limit)
      .reverse();
  }

  getCriticalEvents(): DataEvent[] {
    const oneHourAgo = Date.now() - 3600000;
    return this.eventLog
      .filter((e) => e.severity === "CRITICAL" && e.timestamp.getTime() > oneHourAgo)
      .reverse();
  }
}

// Singleton
export const dataEvents = new HotZonesEventEmitter();

// ── Convenience functions for integration services to emit events ──

export function emitSevereWeather(states: string[], zoneIds: string[], summary: string, severity: "WARNING" | "CRITICAL" = "WARNING"): void {
  dataEvents.emitDataEvent({
    type: "SEVERE_WEATHER",
    severity,
    affectedStates: states,
    affectedZoneIds: zoneIds,
    summary,
    timestamp: new Date(),
    source: "NWS",
  });
}

export function emitHazmatSpill(state: string, zoneIds: string[], summary: string): void {
  dataEvents.emitDataEvent({
    type: "HAZMAT_SPILL",
    severity: "CRITICAL",
    affectedStates: [state],
    affectedZoneIds: zoneIds,
    summary,
    timestamp: new Date(),
    source: "NRC",
  });
}

export function emitFuelPriceSpike(states: string[], changePct: number): void {
  dataEvents.emitDataEvent({
    type: "FUEL_PRICE_SPIKE",
    severity: changePct > 10 ? "CRITICAL" : "WARNING",
    affectedStates: states,
    affectedZoneIds: [],
    summary: `Fuel price change of ${changePct.toFixed(1)}% detected`,
    timestamp: new Date(),
    source: "EIA",
    data: { changePct },
  });
}

export function emitNewRegulation(agencyName: string, title: string): void {
  dataEvents.emitDataEvent({
    type: "NEW_REGULATION",
    severity: "INFO",
    affectedStates: [],
    affectedZoneIds: [],
    summary: `${agencyName}: ${title}`,
    timestamp: new Date(),
    source: "FEDERAL_REGISTER",
  });
}
