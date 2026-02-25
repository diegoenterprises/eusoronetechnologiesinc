/**
 * BILL OF LADING (BOL) AUTO-GENERATION SERVICE
 * Addresses GAP-001: BOL auto-generation
 * 
 * Generates compliant Bills of Lading for shipments including:
 * - Standard BOL for general freight
 * - Hazmat BOL with required fields
 * - Straight BOL and Order BOL variants
 * - PDF generation for printing/signing
 */

import { z } from "zod";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type BOLType = "straight" | "order" | "hazmat" | "tanker" | "food_grade" | "crude_oil";
export type BOLStatus = "draft" | "pending_signature" | "signed" | "completed" | "void";

// ── REAL-WORLD CRUDE OIL GAUGE DATA (from actual BOL/Run Ticket documents) ──

export interface GaugeReading {
  feet: number;
  inches: number;
  fraction: number; // 1/4 inch fractions (0, 1, 2, 3)
}

export interface TankGaugeData {
  tankNumber: string;
  tankCapacity?: string; // e.g., "16FT/500BBLS" or "500 Barrels"
  tankSize?: number; // barrels
  // Open/Close or High/Low gauge readings
  openGauge?: GaugeReading;
  closeGauge?: GaugeReading;
  highGauge?: GaugeReading;
  lowGauge?: GaugeReading;
  // Bottom measurement
  bottomFeet?: number;
  bottomInches?: number;
  // Temperatures at each reading
  openTemp?: number;
  closeTemp?: number;
  highTemp?: number;
  lowTemp?: number;
  obsTemp?: number;
  // Gravity
  obsGravity?: number;
  gravityAt60F?: number;
  // BS&W (Basic Sediment & Water)
  bswPercent?: number;
  bswFeet?: number;
  bswInches?: number;
  bswFraction?: number;
  // Volumes (Government Standard)
  openGOV?: number; // Government Observed Volume
  closeGOV?: number;
  estGOV?: number; // Estimated GOV
  estGSV?: number; // Estimated Gross Standard Volume
  estNSV?: number; // Estimated Net Standard Volume
  // Meter readings
  meterOn?: number;
  meterOff?: number;
  meterFactor?: number;
  avgLineTemp?: number;
  // Quality
  qualityNote?: string; // e.g., "Good Oil"
}

export interface CrudeOilOrigin {
  locationName: string;
  operatorName?: string;
  producerName?: string;
  shipperName?: string;
  leaseNumber?: string;
  stateProvince?: string;
  county?: string;
  station?: string;
  legalDescription?: string;
  plantLeaseNumber?: string;
}

export interface CrudeOilDestination {
  facilityName: string;
  station?: string;
  stateProvince?: string;
  bolNumber?: string;
  arriveTime?: string;
  departTime?: string;
  estGOV?: number;
  estNSV?: number;
  destinationDriverName?: string;
}

export interface CarrierIdentity {
  name: string;
  dotNumber?: string;
  mcNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  fax?: string;
  emergencyContact?: string;
}

export interface CrudeOilBOLData {
  carrierOrderNumber?: string;
  shipperPO?: string;
  jobNumber?: string;
  // Product
  product: string; // e.g., "UN1267, Petroleum Crude Oil, 3, PG I"
  unNumber?: string;
  hazmatClass?: string;
  packingGroup?: string;
  // Driver/Equipment
  driverName: string;
  driverNumber?: string;
  truckNumber?: string;
  trailerNumber?: string;
  // Origin
  origin: CrudeOilOrigin;
  // Gauge/Run Ticket data
  gaugeData?: TankGaugeData;
  // Destination
  destination: CrudeOilDestination;
  // Seals
  sealOff?: string;
  sealOn?: string;
  originSealOff?: string;
  originSealOn?: string;
  destSealOff?: string;
  destSealOn?: string;
  // Notes
  rejectNotes?: string;
  waitNotes?: string; // e.g., "2: Slow loading"
  waitTimeHours?: number;
  driverNotes?: string;
  // Origin/Destination drivers (can differ)
  originDriverName?: string;
  destinationDriverName?: string;
  // Carrier identity
  carrier?: CarrierIdentity;
  // Times
  arriveOriginTime?: string;
  departOriginTime?: string;
  arriveDestTime?: string;
  departDestTime?: string;
  // Driver ON/OFF times (Papa Trucklines style)
  driverOnTime?: string;
  driverOffTime?: string;
}

export interface BOLParty {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  contact?: string;
}

export interface BOLItem {
  quantity: number;
  quantityUnit: string;
  description: string;
  weight: number;
  weightUnit: string;
  class?: string;
  nmfcNumber?: string;
  hazmatClass?: string;
  unNumber?: string;
  packingGroup?: string;
  properShippingName?: string;
}

export interface TankerInfo {
  productType: string;
  productName: string;
  quantityGallons: number;
  specificGravity?: number;
  temperature?: number;
  temperatureUnit?: "F" | "C";
  isFoodGrade: boolean;
  sanitationCertRequired: boolean;
  kosherCertRequired?: boolean;
  organicCertRequired?: boolean;
  previousLoad?: string;
  washoutRequired: boolean;
  washoutType?: "rinse" | "chemical" | "kosher" | "full_sanitation";
  sealNumber?: string;
}

export interface HazmatInfo {
  hazardClass: string;
  unNumber: string;
  packingGroup: string;
  properShippingName: string;
  technicalName?: string;
  placard: string;
  emergencyPhone: string;
  ergGuideNumber: string;
  quantity: number;
  quantityUnit: string;
  containerType: string;
  reportableQuantity: boolean;
}

export interface BOLDocument {
  bolNumber: string;
  loadId: string;
  loadNumber: string;
  type: BOLType;
  status: BOLStatus;
  
  // Dates
  createdAt: string;
  shipDate: string;
  deliveryDate?: string;
  
  // Parties
  shipper: BOLParty;
  consignee: BOLParty;
  catalyst: BOLParty;
  thirdParty?: BOLParty;
  
  // Shipment details
  items: BOLItem[];
  totalWeight: number;
  totalPieces: number;
  
  // Hazmat info (if applicable)
  hazmat?: HazmatInfo[];
  
  // Tanker info (non-hazmat liquid loads: food-grade, water, etc.)
  tankerInfo?: TankerInfo;
  
  // ── CRUDE OIL SPECIFIC (real-world BOL data) ──
  crudeOilData?: CrudeOilBOLData;
  
  // Charges
  freightCharges: "prepaid" | "collect" | "third_party";
  declaredValue?: number;
  codAmount?: number;
  
  // Special instructions
  specialInstructions?: string;
  deliveryInstructions?: string;
  
  // References
  poNumber?: string;
  proNumber?: string;
  orderNumber?: string;
  referenceNumber?: string; // R Number from reconciliation
  
  // Signatures
  shipperSignature?: SignatureInfo;
  catalystSignature?: SignatureInfo;
  consigneeSignature?: SignatureInfo;
  operatorWitnessSignature?: SignatureInfo; // Lease operator witness
  
  // Tracking
  pickupConfirmed: boolean;
  deliveryConfirmed: boolean;
  
  // Seal tracking
  sealNumbers?: string[];
  sealOff?: string;
  sealOn?: string;
}

export interface SignatureInfo {
  name: string;
  title?: string;
  signedAt: string;
  signatureData?: string; // Base64 encoded signature image
  ipAddress?: string;
}

export interface BOLGenerationInput {
  loadId: string;
  loadNumber: string;
  type?: BOLType;
  
  shipper: BOLParty;
  consignee: BOLParty;
  catalyst: BOLParty;
  
  items: BOLItem[];
  hazmat?: HazmatInfo[];
  tankerInfo?: TankerInfo;
  trailerType?: string;
  
  shipDate: string;
  freightCharges: "prepaid" | "collect" | "third_party";
  
  poNumber?: string;
  specialInstructions?: string;
  deliveryInstructions?: string;
}

// ============================================================================
// BOL SERVICE
// ============================================================================

class BOLService {
  private bolCounter: number = 1000;

  /**
   * Generate a new BOL number
   */
  generateBOLNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const seq = (++this.bolCounter).toString().padStart(6, "0");
    return `BOL-${year}${month}${day}-${seq}`;
  }

  /**
   * Create a new Bill of Lading
   */
  async createBOL(input: BOLGenerationInput): Promise<BOLDocument> {
    const bolNumber = this.generateBOLNumber();
    const hasHazmat = input.hazmat && input.hazmat.length > 0;
    const isTankerLoad = ["food_grade_tank", "water_tank", "liquid_tank", "gas_tank", "cryogenic"].includes(input.trailerType || "");
    const isFoodGrade = input.trailerType === "food_grade_tank";
    const type = input.type || (hasHazmat ? "hazmat" : isFoodGrade ? "food_grade" : isTankerLoad && !hasHazmat ? "tanker" : "straight");

    // Calculate totals
    const totalWeight = input.items.reduce((sum, item) => sum + item.weight, 0);
    const totalPieces = input.items.reduce((sum, item) => sum + item.quantity, 0);

    const bol: BOLDocument = {
      bolNumber,
      loadId: input.loadId,
      loadNumber: input.loadNumber,
      type,
      status: "draft",
      createdAt: new Date().toISOString(),
      shipDate: input.shipDate,
      shipper: input.shipper,
      consignee: input.consignee,
      catalyst: input.catalyst,
      items: input.items,
      totalWeight,
      totalPieces,
      hazmat: input.hazmat,
      tankerInfo: input.tankerInfo,
      freightCharges: input.freightCharges,
      poNumber: input.poNumber,
      specialInstructions: input.specialInstructions,
      deliveryInstructions: input.deliveryInstructions,
      pickupConfirmed: false,
      deliveryConfirmed: false,
    };

    // Validate hazmat BOL has required fields
    if (type === "hazmat" && hasHazmat) {
      this.validateHazmatBOL(bol);
    }

    // Validate tanker/food-grade BOL has required fields
    if ((type === "tanker" || type === "food_grade") && bol.tankerInfo) {
      this.validateTankerBOL(bol);
    }

    return bol;
  }

  /**
   * Validate hazmat BOL has all required fields
   */
  private validateHazmatBOL(bol: BOLDocument): void {
    if (!bol.hazmat || bol.hazmat.length === 0) {
      throw new Error("Hazmat BOL requires hazmat information");
    }

    for (const haz of bol.hazmat) {
      if (!haz.hazardClass) throw new Error("Hazard class is required");
      if (!haz.unNumber) throw new Error("UN number is required");
      if (!haz.packingGroup) throw new Error("Packing group is required");
      if (!haz.properShippingName) throw new Error("Proper shipping name is required");
      if (!haz.emergencyPhone) throw new Error("24-hour emergency phone is required");
    }
  }

  /**
   * Validate tanker/food-grade BOL has all required fields
   */
  private validateTankerBOL(bol: BOLDocument): void {
    if (!bol.tankerInfo) {
      throw new Error("Tanker BOL requires tanker information");
    }
    if (!bol.tankerInfo.productName) throw new Error("Product name is required for tanker loads");
    if (!bol.tankerInfo.quantityGallons || bol.tankerInfo.quantityGallons <= 0) throw new Error("Quantity in gallons is required");
    if (bol.tankerInfo.isFoodGrade && bol.tankerInfo.washoutRequired && !bol.tankerInfo.washoutType) {
      throw new Error("Washout type is required for food-grade loads requiring washout");
    }
  }

  /**
   * Add signature to BOL
   */
  async addSignature(
    bol: BOLDocument,
    party: "shipper" | "catalyst" | "consignee",
    signature: SignatureInfo
  ): Promise<BOLDocument> {
    const updatedBOL = { ...bol };

    switch (party) {
      case "shipper":
        updatedBOL.shipperSignature = signature;
        break;
      case "catalyst":
        updatedBOL.catalystSignature = signature;
        break;
      case "consignee":
        updatedBOL.consigneeSignature = signature;
        updatedBOL.deliveryConfirmed = true;
        updatedBOL.deliveryDate = new Date().toISOString();
        break;
    }

    // Update status based on signatures
    if (updatedBOL.shipperSignature && updatedBOL.catalystSignature) {
      updatedBOL.status = "signed";
      updatedBOL.pickupConfirmed = true;
    }

    if (updatedBOL.consigneeSignature) {
      updatedBOL.status = "completed";
    }

    return updatedBOL;
  }

  /**
   * Generate BOL PDF content (returns HTML for PDF generation)
   */
  generateBOLHTML(bol: BOLDocument): string {
    const hazmatSection = bol.hazmat && bol.hazmat.length > 0 
      ? this.generateHazmatSection(bol.hazmat)
      : "";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bill of Lading - ${bol.bolNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 10pt; margin: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .title { font-size: 18pt; font-weight: bold; }
    .bol-number { font-size: 14pt; margin-top: 10px; }
    .section { border: 1px solid #000; margin-bottom: 10px; padding: 10px; }
    .section-title { font-weight: bold; background: #f0f0f0; padding: 5px; margin: -10px -10px 10px -10px; }
    .row { display: flex; margin-bottom: 5px; }
    .col { flex: 1; }
    .label { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 5px; text-align: left; }
    th { background: #f0f0f0; }
    .signature-box { height: 60px; border: 1px solid #000; margin-top: 5px; }
    .hazmat-warning { background: #ffff00; padding: 10px; font-weight: bold; text-align: center; }
    .footer { margin-top: 20px; font-size: 8pt; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${bol.type === "hazmat" ? "HAZARDOUS MATERIALS " : ""}BILL OF LADING</div>
    <div class="bol-number">BOL #: ${bol.bolNumber}</div>
    <div>Load #: ${bol.loadNumber} | Date: ${new Date(bol.shipDate).toLocaleDateString()}</div>
  </div>

  ${bol.type === "hazmat" ? '<div class="hazmat-warning">⚠️ HAZARDOUS MATERIALS SHIPMENT - HANDLE WITH CARE</div>' : ""}

  <div class="row">
    <div class="col section">
      <div class="section-title">SHIPPER (FROM)</div>
      <div><span class="label">Name:</span> ${bol.shipper.name}</div>
      <div><span class="label">Address:</span> ${bol.shipper.address}</div>
      <div>${bol.shipper.city}, ${bol.shipper.state} ${bol.shipper.zipCode}</div>
      ${bol.shipper.phone ? `<div><span class="label">Phone:</span> ${bol.shipper.phone}</div>` : ""}
    </div>
    <div class="col section">
      <div class="section-title">CONSIGNEE (TO)</div>
      <div><span class="label">Name:</span> ${bol.consignee.name}</div>
      <div><span class="label">Address:</span> ${bol.consignee.address}</div>
      <div>${bol.consignee.city}, ${bol.consignee.state} ${bol.consignee.zipCode}</div>
      ${bol.consignee.phone ? `<div><span class="label">Phone:</span> ${bol.consignee.phone}</div>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">CATALYST</div>
    <div class="row">
      <div class="col"><span class="label">Name:</span> ${bol.catalyst.name}</div>
      <div class="col"><span class="label">Phone:</span> ${bol.catalyst.phone || "N/A"}</div>
    </div>
    <div>${bol.catalyst.address}, ${bol.catalyst.city}, ${bol.catalyst.state} ${bol.catalyst.zipCode}</div>
  </div>

  <div class="section">
    <div class="section-title">SHIPMENT DETAILS</div>
    <table>
      <thead>
        <tr>
          <th>Qty</th>
          <th>Unit</th>
          <th>Description</th>
          <th>Weight</th>
          <th>Class</th>
          ${bol.type === "hazmat" ? "<th>UN#</th><th>Hazard</th>" : ""}
        </tr>
      </thead>
      <tbody>
        ${bol.items.map(item => `
          <tr>
            <td>${item.quantity}</td>
            <td>${item.quantityUnit}</td>
            <td>${item.description}${item.nmfcNumber ? ` (NMFC: ${item.nmfcNumber})` : ""}</td>
            <td>${item.weight} ${item.weightUnit}</td>
            <td>${item.class || "N/A"}</td>
            ${bol.type === "hazmat" ? `<td>${item.unNumber || ""}</td><td>${item.hazmatClass || ""}</td>` : ""}
          </tr>
        `).join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="${bol.type === "hazmat" ? 3 : 3}"><strong>TOTAL</strong></td>
          <td><strong>${bol.totalWeight} lbs</strong></td>
          <td colspan="${bol.type === "hazmat" ? 3 : 1}"><strong>${bol.totalPieces} pieces</strong></td>
        </tr>
      </tfoot>
    </table>
  </div>

  ${hazmatSection}

  <div class="row">
    <div class="col section">
      <div class="section-title">FREIGHT CHARGES</div>
      <div><strong>${bol.freightCharges.toUpperCase()}</strong></div>
      ${bol.declaredValue ? `<div>Declared Value: $${bol.declaredValue.toLocaleString()}</div>` : ""}
      ${bol.codAmount ? `<div>C.O.D. Amount: $${bol.codAmount.toLocaleString()}</div>` : ""}
    </div>
    <div class="col section">
      <div class="section-title">REFERENCES</div>
      ${bol.poNumber ? `<div><span class="label">PO #:</span> ${bol.poNumber}</div>` : ""}
      ${bol.proNumber ? `<div><span class="label">PRO #:</span> ${bol.proNumber}</div>` : ""}
      ${bol.orderNumber ? `<div><span class="label">Order #:</span> ${bol.orderNumber}</div>` : ""}
    </div>
  </div>

  ${bol.specialInstructions ? `
    <div class="section">
      <div class="section-title">SPECIAL INSTRUCTIONS</div>
      <div>${bol.specialInstructions}</div>
    </div>
  ` : ""}

  <div class="row">
    <div class="col section">
      <div class="section-title">SHIPPER SIGNATURE</div>
      <div class="signature-box">${bol.shipperSignature?.name || ""}</div>
      <div>Date: ${bol.shipperSignature?.signedAt ? new Date(bol.shipperSignature.signedAt).toLocaleDateString() : "____________"}</div>
    </div>
    <div class="col section">
      <div class="section-title">CATALYST SIGNATURE</div>
      <div class="signature-box">${bol.catalystSignature?.name || ""}</div>
      <div>Date: ${bol.catalystSignature?.signedAt ? new Date(bol.catalystSignature.signedAt).toLocaleDateString() : "____________"}</div>
    </div>
    <div class="col section">
      <div class="section-title">CONSIGNEE SIGNATURE</div>
      <div class="signature-box">${bol.consigneeSignature?.name || ""}</div>
      <div>Date: ${bol.consigneeSignature?.signedAt ? new Date(bol.consigneeSignature.signedAt).toLocaleDateString() : "____________"}</div>
    </div>
  </div>

  <div class="footer">
    <p>This is to certify that the above named materials are properly classified, described, packaged, marked, and labeled, and are in proper condition for transportation according to the applicable regulations of the DOT.</p>
    <p>Generated by EusoTrip Platform | ${new Date().toISOString()}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate hazmat section HTML
   */
  private generateHazmatSection(hazmat: HazmatInfo[]): string {
    return `
      <div class="section" style="background: #fffde7;">
        <div class="section-title" style="background: #ffeb3b;">⚠️ HAZARDOUS MATERIALS INFORMATION</div>
        <table>
          <thead>
            <tr>
              <th>UN #</th>
              <th>Proper Shipping Name</th>
              <th>Hazard Class</th>
              <th>Packing Group</th>
              <th>Qty</th>
              <th>Container</th>
              <th>RQ</th>
            </tr>
          </thead>
          <tbody>
            ${hazmat.map(haz => `
              <tr>
                <td><strong>${haz.unNumber}</strong></td>
                <td>${haz.properShippingName}${haz.technicalName ? ` (${haz.technicalName})` : ""}</td>
                <td>${haz.hazardClass}</td>
                <td>${haz.packingGroup}</td>
                <td>${haz.quantity} ${haz.quantityUnit}</td>
                <td>${haz.containerType}</td>
                <td>${haz.reportableQuantity ? "YES" : "NO"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div style="margin-top: 10px;">
          <strong>24-Hour Emergency Phone:</strong> ${hazmat[0]?.emergencyPhone || "N/A"}<br>
          <strong>ERG Guide #:</strong> ${hazmat[0]?.ergGuideNumber || "N/A"}<br>
          <strong>Placard Required:</strong> ${hazmat[0]?.placard || "N/A"}
        </div>
      </div>
    `;
  }

  /**
   * Create BOL from load data
   */
  async createBOLFromLoad(load: {
    id: string;
    loadNumber: string;
    pickupLocation: any;
    deliveryLocation: any;
    cargoType: string;
    weight?: string;
    hazmatClass?: string;
    unNumber?: string;
    specialInstructions?: string;
    pickupDate?: Date;
  }, catalyst: BOLParty, shipper: BOLParty): Promise<BOLDocument> {
    const items: BOLItem[] = [{
      quantity: 1,
      quantityUnit: "load",
      description: load.cargoType || "General Freight",
      weight: load.weight ? parseFloat(load.weight) : 0,
      weightUnit: "lbs",
      hazmatClass: load.hazmatClass,
      unNumber: load.unNumber,
    }];

    const hasHazmat = !!load.hazmatClass;
    const hazmat: HazmatInfo[] = hasHazmat ? [{
      hazardClass: load.hazmatClass!,
      unNumber: load.unNumber || "",
      packingGroup: "II",
      properShippingName: load.cargoType || "Hazardous Material",
      placard: load.hazmatClass!,
      emergencyPhone: "1-800-424-9300",
      ergGuideNumber: "128",
      quantity: load.weight ? parseFloat(load.weight) : 0,
      quantityUnit: "lbs",
      containerType: "Tank",
      reportableQuantity: false,
    }] : [];

    const pickup = load.pickupLocation || {};
    const delivery = load.deliveryLocation || {};

    return this.createBOL({
      loadId: load.id,
      loadNumber: load.loadNumber,
      type: hasHazmat ? "hazmat" : "straight",
      shipper: {
        ...shipper,
        address: pickup.address || shipper.address,
        city: pickup.city || shipper.city,
        state: pickup.state || shipper.state,
        zipCode: pickup.zipCode || shipper.zipCode,
      },
      consignee: {
        name: "Consignee",
        address: delivery.address || "",
        city: delivery.city || "",
        state: delivery.state || "",
        zipCode: delivery.zipCode || "",
      },
      catalyst,
      items,
      hazmat: hasHazmat ? hazmat : undefined,
      shipDate: load.pickupDate?.toISOString() || new Date().toISOString(),
      freightCharges: "prepaid",
      specialInstructions: load.specialInstructions,
    });
  }
}

// Export singleton instance
export const bolService = new BOLService();
