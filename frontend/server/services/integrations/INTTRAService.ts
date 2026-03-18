/**
 * INTTRA / E2OPEN OCEAN BOOKING NETWORK INTEGRATION
 * Ocean carrier booking, schedule search, and shipment tracking
 *
 * Provides booking creation, schedule search, shipping instructions, and tracking
 * API Documentation: https://developer.e2open.com/inttra
 */

import { logger } from "../../_core/logger";

// Environment configuration
const INTTRA_API_KEY = process.env.INTTRA_API_KEY || "";
const INTTRA_API_SECRET = process.env.INTTRA_API_SECRET || "";
const INTTRA_BASE_URL = "https://api.inttra.com/v1";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BookingRequest {
  shipper: string;
  carrier: string;
  originPort: string;
  destPort: string;
  cargo: {
    description: string;
    weight: number;
    weightUnit: string;
    volume: number;
    volumeUnit: string;
    hazardous: boolean;
    hsCode?: string;
  };
  containers: {
    type: string;
    size: string;
    quantity: number;
    weight?: number;
  }[];
  incoterms: string;
}

export interface BookingResponse {
  bookingId: string;
  status: string;
  confirmationNumber: string | null;
  carrierReference: string | null;
  createdAt: string;
  vessel: string | null;
  voyage: string | null;
}

export interface BookingStatus {
  bookingId: string;
  status: string;
  carrierResponse: string | null;
  containerAssignments: {
    containerNumber: string;
    sealNumber: string | null;
    type: string;
    size: string;
  }[];
  vessel: string | null;
  voyage: string | null;
  etd: string | null;
  eta: string | null;
  updatedAt: string;
}

export interface CarrierSchedule {
  carrier: string;
  carrierCode: string;
  vessel: string;
  voyage: string;
  originPort: string;
  destPort: string;
  etd: string;
  eta: string;
  transitDays: number;
  transshipments: number;
  rates: {
    containerSize: string;
    amount: number;
    currency: string;
  }[] | null;
  service: string;
}

export interface ShippingInstructions {
  consignee: string;
  notifyParty: string;
  cargoDescription: string;
  marks: string;
  paymentTerms?: string;
  freightCharges?: string;
}

export interface SIResponse {
  siReferenceNumber: string;
  bookingId: string;
  status: string;
  blNumber: string | null;
  submittedAt: string;
}

export interface CarrierRate {
  carrier: string;
  carrierCode: string;
  containerSize: string;
  amount: number;
  currency: string;
  validFrom: string;
  validTo: string;
  surcharges: {
    type: string;
    amount: number;
    currency: string;
  }[];
  totalAmount: number;
}

export interface TrackingEvent {
  eventType: string;
  eventDescription: string;
  location: string;
  timestamp: string;
  vessel: string | null;
  voyage: string | null;
  containerNumber: string | null;
  status: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

class INTTRAService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = INTTRA_API_KEY;
    this.apiSecret = INTTRA_API_SECRET;
    this.baseUrl = INTTRA_BASE_URL;
  }

  /**
   * Check if the API is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0 && this.apiSecret.length > 0;
  }

  /**
   * Build authorization headers for INTTRA API
   */
  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": this.apiKey,
      "X-API-Secret": this.apiSecret,
    };
  }

  /**
   * Create a new ocean booking request
   */
  async createBookingRequest(booking: BookingRequest): Promise<BookingResponse | null> {
    if (!this.isConfigured()) {
      logger.warn("[INTTRA] API credentials not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/bookings`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          shipper: booking.shipper,
          carrier: booking.carrier,
          origin_port: booking.originPort,
          destination_port: booking.destPort,
          cargo: booking.cargo,
          containers: booking.containers,
          incoterms: booking.incoterms,
        }),
      });

      if (!response.ok) {
        logger.error(`[INTTRA] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        bookingId: data.booking_id || data.bookingId || "",
        status: data.status || "Submitted",
        confirmationNumber: data.confirmation_number || data.confirmationNumber || null,
        carrierReference: data.carrier_reference || null,
        createdAt: data.created_at || new Date().toISOString(),
        vessel: data.vessel || null,
        voyage: data.voyage || null,
      };
    } catch (error) {
      logger.error("[INTTRA] createBookingRequest error:", error);
      return null;
    }
  }

  /**
   * Get current booking status
   */
  async getBookingStatus(bookingId: string): Promise<BookingStatus | null> {
    if (!this.isConfigured()) {
      logger.warn("[INTTRA] API credentials not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/bookings/${bookingId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        logger.error(`[INTTRA] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        bookingId: data.booking_id || bookingId,
        status: data.status || "Unknown",
        carrierResponse: data.carrier_response || null,
        containerAssignments: (data.container_assignments || []).map((c: any) => ({
          containerNumber: c.container_number || "",
          sealNumber: c.seal_number || null,
          type: c.type || "",
          size: c.size || "",
        })),
        vessel: data.vessel || null,
        voyage: data.voyage || null,
        etd: data.etd || null,
        eta: data.eta || null,
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      logger.error("[INTTRA] getBookingStatus error:", error);
      return null;
    }
  }

  /**
   * Search carrier schedules between ports
   */
  async searchSchedules(
    originPort: string,
    destPort: string,
    departureDate: string
  ): Promise<CarrierSchedule[]> {
    if (!this.isConfigured()) {
      logger.warn("[INTTRA] API credentials not configured");
      return [];
    }

    try {
      const params = new URLSearchParams({
        origin: originPort,
        destination: destPort,
        departure_date: departureDate,
      });

      const response = await fetch(`${this.baseUrl}/schedules?${params.toString()}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const schedules = data.schedules || data.results || [];

      return schedules.map((s: any) => ({
        carrier: s.carrier_name || s.carrier || "",
        carrierCode: s.carrier_code || s.scac || "",
        vessel: s.vessel_name || s.vessel || "",
        voyage: s.voyage_number || s.voyage || "",
        originPort: s.origin_port || originPort,
        destPort: s.destination_port || destPort,
        etd: s.etd || s.departure_date || "",
        eta: s.eta || s.arrival_date || "",
        transitDays: parseInt(s.transit_days, 10) || 0,
        transshipments: parseInt(s.transshipments, 10) || 0,
        rates: s.rates || null,
        service: s.service_name || s.service || "",
      }));
    } catch (error) {
      logger.error("[INTTRA] searchSchedules error:", error);
      return [];
    }
  }

  /**
   * Submit shipping instructions for a booking
   */
  async submitShippingInstructions(
    bookingId: string,
    instructions: ShippingInstructions
  ): Promise<SIResponse | null> {
    if (!this.isConfigured()) {
      logger.warn("[INTTRA] API credentials not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/bookings/${bookingId}/shipping-instructions`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            consignee: instructions.consignee,
            notify_party: instructions.notifyParty,
            cargo_description: instructions.cargoDescription,
            marks: instructions.marks,
            payment_terms: instructions.paymentTerms,
            freight_charges: instructions.freightCharges,
          }),
        }
      );

      if (!response.ok) {
        logger.error(`[INTTRA] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        siReferenceNumber: data.si_reference || data.reference_number || "",
        bookingId: data.booking_id || bookingId,
        status: data.status || "Submitted",
        blNumber: data.bl_number || null,
        submittedAt: data.submitted_at || new Date().toISOString(),
      };
    } catch (error) {
      logger.error("[INTTRA] submitShippingInstructions error:", error);
      return null;
    }
  }

  /**
   * Get carrier rate quotes for a lane
   */
  async getCarrierRates(
    originPort: string,
    destPort: string,
    containerSize: string
  ): Promise<CarrierRate[]> {
    if (!this.isConfigured()) {
      logger.warn("[INTTRA] API credentials not configured");
      return [];
    }

    try {
      const params = new URLSearchParams({
        origin: originPort,
        destination: destPort,
        container_size: containerSize,
      });

      const response = await fetch(`${this.baseUrl}/rates?${params.toString()}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const rates = data.rates || data.results || [];

      return rates.map((r: any) => ({
        carrier: r.carrier_name || r.carrier || "",
        carrierCode: r.carrier_code || r.scac || "",
        containerSize: r.container_size || containerSize,
        amount: parseFloat(r.amount) || 0,
        currency: r.currency || "USD",
        validFrom: r.valid_from || "",
        validTo: r.valid_to || "",
        surcharges: (r.surcharges || []).map((s: any) => ({
          type: s.type || "",
          amount: parseFloat(s.amount) || 0,
          currency: s.currency || "USD",
        })),
        totalAmount: parseFloat(r.total_amount || r.amount) || 0,
      }));
    } catch (error) {
      logger.error("[INTTRA] getCarrierRates error:", error);
      return [];
    }
  }

  /**
   * Track a shipment by reference number
   */
  async trackShipment(referenceNumber: string): Promise<TrackingEvent[]> {
    if (!this.isConfigured()) {
      logger.warn("[INTTRA] API credentials not configured");
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/tracking/${encodeURIComponent(referenceNumber)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const events = data.events || data.tracking_events || [];

      return events.map((e: any) => ({
        eventType: e.event_type || e.type || "",
        eventDescription: e.description || e.event_description || "",
        location: e.location || e.port || "",
        timestamp: e.timestamp || e.event_date || "",
        vessel: e.vessel || null,
        voyage: e.voyage || null,
        containerNumber: e.container_number || null,
        status: e.status || "",
      }));
    } catch (error) {
      logger.error("[INTTRA] trackShipment error:", error);
      return [];
    }
  }
}

// Export singleton instance
export const inttraService = new INTTRAService();
