/**
 * OFFLINE HAZMAT INSPECTION — Pre-trip/post-trip inspection checklists
 *
 * 49 CFR 397 + FMCSA DVIR compliance, fully offline.
 * Includes hazmat-specific items (placards, shipping papers, emergency equipment).
 * All inspections stored locally, synced when online.
 */

import { database, collections } from '@/database';
import { syncEngine } from './sync-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type InspectionType = 'PRE_TRIP' | 'POST_TRIP' | 'EN_ROUTE' | 'HAZMAT_COMPLIANCE';
export type ItemStatus = 'PASS' | 'FAIL' | 'NA' | 'PENDING';
export type InspectionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  description?: string;
  status: ItemStatus;
  notes?: string;
  photoRequired: boolean;
  photoTaken: boolean;
  isCritical: boolean;
  isHazmat: boolean;
  regulation?: string;
}

export interface InspectionState {
  inspectionId: string;
  type: InspectionType;
  status: InspectionStatus;
  vehicleId: string;
  trailerId?: string;
  loadId?: string;
  startedAt: number;
  completedAt?: number;
  items: ChecklistItem[];
  defectCount: number;
  criticalDefectCount: number;
  hazmatDefectCount: number;
  latitude?: number;
  longitude?: number;
  driverSignature?: string;
  syncStatus: 'PENDING' | 'SYNCED';
}

type InspectionListener = (state: InspectionState) => void;

// ═══════════════════════════════════════════════════════════════════════════════
// HAZMAT-SPECIFIC CHECKLIST ITEMS (49 CFR 397)
// ═══════════════════════════════════════════════════════════════════════════════

const HAZMAT_ITEMS: Omit<ChecklistItem, 'status' | 'photoTaken'>[] = [
  { id: 'hm_placards', category: 'Hazmat', label: 'Placards properly displayed', description: 'All 4 sides, correct UN number, Class 3 flammable', photoRequired: true, isCritical: true, isHazmat: true, regulation: '49 CFR 172.504' },
  { id: 'hm_shipping_papers', category: 'Hazmat', label: 'Shipping papers accessible', description: 'Within driver reach or driver door pocket', photoRequired: false, isCritical: true, isHazmat: true, regulation: '49 CFR 177.817' },
  { id: 'hm_emergency_info', category: 'Hazmat', label: 'Emergency response info present', description: 'ERG guide or equivalent for UN1267', photoRequired: false, isCritical: true, isHazmat: true, regulation: '49 CFR 172.602' },
  { id: 'hm_fire_extinguisher', category: 'Hazmat', label: 'Fire extinguisher (10BC+)', description: 'Rated 10BC minimum, fully charged, accessible', photoRequired: true, isCritical: true, isHazmat: true, regulation: '49 CFR 393.95' },
  { id: 'hm_spill_kit', category: 'Hazmat', label: 'Spill containment kit', description: 'Absorbent pads, containment boom, PPE', photoRequired: true, isCritical: true, isHazmat: true, regulation: '49 CFR 173.29' },
  { id: 'hm_ppe', category: 'Hazmat', label: 'Personal protective equipment', description: 'Gloves, safety glasses, FR clothing, hard hat', photoRequired: false, isCritical: true, isHazmat: true },
  { id: 'hm_valves', category: 'Hazmat', label: 'Tank valves secure', description: 'All valves closed, caps tight, no leaks', photoRequired: true, isCritical: true, isHazmat: true, regulation: '49 CFR 180.407' },
  { id: 'hm_grounding', category: 'Hazmat', label: 'Grounding/bonding equipment', description: 'Grounding cable present and functional', photoRequired: false, isCritical: true, isHazmat: true },
  { id: 'hm_no_smoking', category: 'Hazmat', label: 'No smoking signs visible', description: 'Posted on vehicle', photoRequired: false, isCritical: false, isHazmat: true },
  { id: 'hm_tank_integrity', category: 'Hazmat', label: 'Tank shell integrity', description: 'No dents, cracks, bulges, or corrosion', photoRequired: true, isCritical: true, isHazmat: true, regulation: '49 CFR 180.407' },
  { id: 'hm_manhole_cover', category: 'Hazmat', label: 'Manhole cover sealed', description: 'Gasket intact, bolts tight', photoRequired: true, isCritical: true, isHazmat: true },
  { id: 'hm_vapor_recovery', category: 'Hazmat', label: 'Vapor recovery system', description: 'Functional if required by facility', photoRequired: false, isCritical: false, isHazmat: true },
  { id: 'hm_cdl_hazmat', category: 'Hazmat', label: 'CDL-H endorsement current', description: 'Hazmat endorsement valid and not expired', photoRequired: false, isCritical: true, isHazmat: true },
  { id: 'hm_training_current', category: 'Hazmat', label: 'Hazmat training current', description: 'Within 3-year recertification window', photoRequired: false, isCritical: true, isHazmat: true, regulation: '49 CFR 172.704' },
];

const VEHICLE_ITEMS: Omit<ChecklistItem, 'status' | 'photoTaken'>[] = [
  { id: 'v_brakes', category: 'Vehicle', label: 'Brakes functional', description: 'Service and parking brakes', photoRequired: false, isCritical: true, isHazmat: false },
  { id: 'v_tires', category: 'Vehicle', label: 'Tires condition', description: 'Tread depth, inflation, no damage', photoRequired: false, isCritical: true, isHazmat: false },
  { id: 'v_lights', category: 'Vehicle', label: 'All lights operational', description: 'Headlights, brake, turn signals, markers', photoRequired: false, isCritical: true, isHazmat: false },
  { id: 'v_mirrors', category: 'Vehicle', label: 'Mirrors clean and adjusted', photoRequired: false, isCritical: false, isHazmat: false },
  { id: 'v_horn', category: 'Vehicle', label: 'Horn functional', photoRequired: false, isCritical: false, isHazmat: false },
  { id: 'v_windshield', category: 'Vehicle', label: 'Windshield/wipers', description: 'No cracks, wipers functional', photoRequired: false, isCritical: false, isHazmat: false },
  { id: 'v_steering', category: 'Vehicle', label: 'Steering responsive', photoRequired: false, isCritical: true, isHazmat: false },
  { id: 'v_coupling', category: 'Vehicle', label: 'Coupling devices secure', description: 'Fifth wheel, kingpin, safety chains', photoRequired: false, isCritical: true, isHazmat: false },
  { id: 'v_exhaust', category: 'Vehicle', label: 'Exhaust system', description: 'No leaks near tank', photoRequired: false, isCritical: true, isHazmat: false },
  { id: 'v_frame', category: 'Vehicle', label: 'Frame/body condition', photoRequired: false, isCritical: false, isHazmat: false },
  { id: 'v_fluids', category: 'Vehicle', label: 'Fluid levels', description: 'Oil, coolant, DEF, washer fluid', photoRequired: false, isCritical: false, isHazmat: false },
  { id: 'v_triangles', category: 'Vehicle', label: 'Warning triangles present', description: '3 reflective triangles', photoRequired: false, isCritical: false, isHazmat: false },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class HazmatInspectionService {
  private currentInspection: InspectionState | null = null;
  private listeners = new Set<InspectionListener>();

  subscribe(fn: InspectionListener): () => void {
    this.listeners.add(fn);
    if (this.currentInspection) fn(this.currentInspection);
    return () => this.listeners.delete(fn);
  }

  /**
   * Start a new inspection
   */
  startInspection(params: {
    type: InspectionType;
    vehicleId: string;
    trailerId?: string;
    loadId?: string;
    latitude?: number;
    longitude?: number;
  }): InspectionState {
    const allItems = [...HAZMAT_ITEMS, ...VEHICLE_ITEMS].map(item => ({
      ...item,
      status: 'PENDING' as ItemStatus,
      photoTaken: false,
    }));

    this.currentInspection = {
      inspectionId: `insp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: params.type,
      status: 'IN_PROGRESS',
      vehicleId: params.vehicleId,
      trailerId: params.trailerId,
      loadId: params.loadId,
      startedAt: Date.now(),
      items: allItems,
      defectCount: 0,
      criticalDefectCount: 0,
      hazmatDefectCount: 0,
      latitude: params.latitude,
      longitude: params.longitude,
      syncStatus: 'PENDING',
    };

    this.emit();
    return this.currentInspection;
  }

  /**
   * Update a checklist item
   */
  updateItem(itemId: string, update: { status?: ItemStatus; notes?: string; photoTaken?: boolean }) {
    if (!this.currentInspection) return;

    const item = this.currentInspection.items.find(i => i.id === itemId);
    if (!item) return;

    if (update.status !== undefined) item.status = update.status;
    if (update.notes !== undefined) item.notes = update.notes;
    if (update.photoTaken !== undefined) item.photoTaken = update.photoTaken;

    // Recalculate defects
    const fails = this.currentInspection.items.filter(i => i.status === 'FAIL');
    this.currentInspection.defectCount = fails.length;
    this.currentInspection.criticalDefectCount = fails.filter(i => i.isCritical).length;
    this.currentInspection.hazmatDefectCount = fails.filter(i => i.isHazmat).length;

    this.emit();
  }

  /**
   * Complete the inspection — stores locally and queues for sync
   */
  async completeInspection(driverSignatureBase64?: string): Promise<{
    success: boolean;
    canOperate: boolean;
    defects: ChecklistItem[];
  }> {
    if (!this.currentInspection) {
      return { success: false, canOperate: false, defects: [] };
    }

    // Check for items still pending
    const pending = this.currentInspection.items.filter(i => i.status === 'PENDING');
    if (pending.length > 0) {
      return { success: false, canOperate: false, defects: pending };
    }

    // Check for photo-required items without photos
    const missingPhotos = this.currentInspection.items.filter(i => i.photoRequired && !i.photoTaken && i.status === 'FAIL');
    if (missingPhotos.length > 0) {
      return { success: false, canOperate: false, defects: missingPhotos };
    }

    const fails = this.currentInspection.items.filter(i => i.status === 'FAIL');
    const criticalFails = fails.filter(i => i.isCritical);
    const canOperate = criticalFails.length === 0;

    this.currentInspection.status = canOperate ? 'COMPLETED' : 'FAILED';
    this.currentInspection.completedAt = Date.now();
    this.currentInspection.driverSignature = driverSignatureBase64;

    // Queue for sync
    await syncEngine.queueAction({
      actionType: 'INSPECTION',
      payload: {
        inspectionId: this.currentInspection.inspectionId,
        type: this.currentInspection.type,
        status: this.currentInspection.status,
        vehicleId: this.currentInspection.vehicleId,
        trailerId: this.currentInspection.trailerId,
        loadId: this.currentInspection.loadId,
        startedAt: this.currentInspection.startedAt,
        completedAt: this.currentInspection.completedAt,
        latitude: this.currentInspection.latitude,
        longitude: this.currentInspection.longitude,
        items: this.currentInspection.items.map(i => ({
          id: i.id, category: i.category, label: i.label,
          status: i.status, notes: i.notes, photoTaken: i.photoTaken,
          isCritical: i.isCritical, isHazmat: i.isHazmat,
        })),
        defectCount: this.currentInspection.defectCount,
        criticalDefectCount: this.currentInspection.criticalDefectCount,
        hazmatDefectCount: this.currentInspection.hazmatDefectCount,
        canOperate,
        driverSignature: driverSignatureBase64 ? '[ATTACHED]' : undefined,
      },
      priority: 'HIGH',
      requiresOrder: true,
    });

    this.emit();
    const result = { success: true, canOperate, defects: fails };
    this.currentInspection = null;
    return result;
  }

  /**
   * Get current inspection state
   */
  getCurrent(): InspectionState | null {
    return this.currentInspection ? { ...this.currentInspection } : null;
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    if (!this.currentInspection) return 0;
    const total = this.currentInspection.items.length;
    const completed = this.currentInspection.items.filter(i => i.status !== 'PENDING').length;
    return Math.round((completed / total) * 100);
  }

  /**
   * Get items by category
   */
  getItemsByCategory(): Record<string, ChecklistItem[]> {
    if (!this.currentInspection) return {};
    const cats: Record<string, ChecklistItem[]> = {};
    for (const item of this.currentInspection.items) {
      if (!cats[item.category]) cats[item.category] = [];
      cats[item.category].push(item);
    }
    return cats;
  }

  private emit() {
    if (this.currentInspection) {
      this.listeners.forEach(fn => fn({ ...this.currentInspection! }));
    }
  }
}

export const hazmatInspection = new HazmatInspectionService();
