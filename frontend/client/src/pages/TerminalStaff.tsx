/**
 * ACCESS CONTROLLERS PAGE — Role-Aware
 * Terminal Managers: oil terminal gate/rack/bay staff
 * Shippers/Marketers: warehouse, dock, yard, cold storage, distribution center staff
 * Each controller gets a 24-hour access link + 6-digit code + geofence (no login needed).
 * 100% Dynamic — No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users, Search, CheckCircle, Clock, Plus, Phone, Mail,
  Link2, Copy, Shield, ShieldCheck, X, Trash2, ChevronDown,
  MapPin, KeyRound, Fuel, Building2, Warehouse, Pencil, Send
} from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  gate_controller: "Gate Controller",
  rack_supervisor: "Rack Supervisor",
  bay_operator: "Bay Operator",
  safety_officer: "Safety Officer",
  shift_lead: "Shift Lead",
  dock_manager: "Dock Manager",
  warehouse_lead: "Warehouse Lead",
  receiving_clerk: "Receiving Clerk",
  yard_marshal: "Yard Marshal",
};

const ROLE_COLORS: Record<string, string> = {
  gate_controller: "bg-orange-500/20 text-orange-400",
  rack_supervisor: "bg-purple-500/20 text-purple-400",
  bay_operator: "bg-blue-500/20 text-blue-400",
  safety_officer: "bg-red-500/20 text-red-400",
  shift_lead: "bg-emerald-500/20 text-emerald-400",
  dock_manager: "bg-cyan-500/20 text-cyan-400",
  warehouse_lead: "bg-amber-500/20 text-amber-400",
  receiving_clerk: "bg-teal-500/20 text-teal-400",
  yard_marshal: "bg-indigo-500/20 text-indigo-400",
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  terminal: "Terminal",
  warehouse: "Warehouse",
  dock: "Dock",
  yard: "Yard",
  cold_storage: "Cold Storage",
  distribution_center: "Distribution Center",
  port: "Port",
  rail_yard: "Rail Yard",
  pickup_point: "Pickup Point",
};

export default function TerminalStaff() {
  const { user: authUser } = useAuth();
  const userRole = (authUser?.role || "").toUpperCase();
  const isShipper = ["SHIPPER", "BROKER"].includes(userRole);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [copiedToken, setCopiedToken] = useState<number | null>(null);
  const [newCode, setNewCode] = useState<{ staffId: number; code: string } | null>(null);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [sentToStaff, setSentToStaff] = useState<number | null>(null);
  const [sendingStaffId, setSendingStaffId] = useState<number | null>(null);

  // Form state — includes location fields for shipper/marketer
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    staffRole: (isShipper ? "dock_manager" : "gate_controller") as string,
    assignedZone: "", shift: "day" as string,
    canApproveAccess: true, canDispenseProduct: false,
    locationType: (isShipper ? "warehouse" : "terminal") as string,
    locationName: "", locationAddress: "",
    locationLat: "", locationLng: "",
  });

  const staffQuery = (trpc as any).terminals.getStaff.useQuery({ search });
  const statsQuery = (trpc as any).terminals.getStaffStats.useQuery();
  const linksQuery = (trpc as any).terminals.getStaffAccessLinks.useQuery();
  const utils = (trpc as any).useUtils();

  const addMutation = (trpc as any).terminals.addStaff.useMutation({
    onSuccess: () => {
      utils.terminals.getStaff.invalidate();
      utils.terminals.getStaffStats.invalidate();
      setShowAdd(false);
      setForm({ name: "", phone: "", email: "", staffRole: isShipper ? "dock_manager" : "gate_controller", assignedZone: "", shift: "day", canApproveAccess: true, canDispenseProduct: false, locationType: isShipper ? "warehouse" : "terminal", locationName: "", locationAddress: "", locationLat: "", locationLng: "" });
    },
  });

  const removeMutation = (trpc as any).terminals.removeStaff.useMutation({
    onSuccess: () => { utils.terminals.getStaff.invalidate(); utils.terminals.getStaffStats.invalidate(); },
  });

  const updateMutation = (trpc as any).terminals.updateStaff.useMutation({
    onSuccess: () => {
      utils.terminals.getStaff.invalidate(); utils.terminals.getStaffStats.invalidate();
      if (editingStaff) { setEditingStaff(null); setEditForm(null); }
    },
  });

  const genLinkMutation = (trpc as any).terminals.generateAccessLink.useMutation({
    onSuccess: (data: any) => {
      utils.terminals.getStaffAccessLinks.invalidate();
      if (data?.accessCode) setNewCode({ staffId: data.staffId || 0, code: data.accessCode });
    },
  });

  const revokeLinkMutation = (trpc as any).terminals.revokeAccessLink.useMutation({
    onSuccess: () => { utils.terminals.getStaffAccessLinks.invalidate(); },
  });

  const sendLinkMutation = (trpc as any).terminals.sendAccessLink.useMutation({
    onSuccess: (data: any, variables: any) => {
      setSendingStaffId(null);
      setSentToStaff(variables.staffId);
      setTimeout(() => setSentToStaff(null), 3000);
      const parts: string[] = [];
      if (data?.emailSent) parts.push("email");
      if (data?.smsSent) parts.push("SMS");
      if (parts.length > 0) {
        toast.success(`Access link sent via ${parts.join(" & ")} to ${data?.staffName || "staff"}`);
      } else {
        toast.warning(`Access link could not be delivered. Check staff contact info.`);
      }
    },
    onError: (err: any) => {
      setSendingStaffId(null);
      toast.error(err?.message || "Failed to send access link");
    },
  });

  const stats = statsQuery.data;
  const staffList = Array.isArray(staffQuery.data) ? staffQuery.data : [];
  const activeLinks = Array.isArray(linksQuery.data) ? linksQuery.data : [];

  const openEdit = (staff: any) => {
    setEditingStaff(staff);
    setEditForm({
      name: staff.name || "",
      phone: staff.phone || "",
      email: staff.email || "",
      staffRole: staff.staffRole || "gate_controller",
      assignedZone: staff.assignedZone || "",
      shift: staff.shift || "day",
      canApproveAccess: staff.canApproveAccess ?? true,
      canDispenseProduct: staff.canDispenseProduct ?? false,
      locationType: staff.locationType || "terminal",
      locationName: staff.locationName || "",
      locationAddress: staff.locationAddress || "",
      locationLat: staff.locationLat != null ? String(staff.locationLat) : "",
      locationLng: staff.locationLng != null ? String(staff.locationLng) : "",
    });
  };

  const handleEdit = () => {
    if (!editingStaff || !editForm) return;
    const payload: any = { id: editingStaff.id };
    if (editForm.name !== editingStaff.name) payload.name = editForm.name;
    if (editForm.phone !== (editingStaff.phone || "")) payload.phone = editForm.phone;
    if (editForm.email !== (editingStaff.email || "")) payload.email = editForm.email;
    if (editForm.staffRole !== editingStaff.staffRole) payload.staffRole = editForm.staffRole;
    if (editForm.assignedZone !== (editingStaff.assignedZone || "")) payload.assignedZone = editForm.assignedZone;
    if (editForm.shift !== (editingStaff.shift || "day")) payload.shift = editForm.shift;
    if (editForm.canApproveAccess !== editingStaff.canApproveAccess) payload.canApproveAccess = editForm.canApproveAccess;
    if (editForm.canDispenseProduct !== editingStaff.canDispenseProduct) payload.canDispenseProduct = editForm.canDispenseProduct;
    if (editForm.locationType !== (editingStaff.locationType || "terminal")) payload.locationType = editForm.locationType;
    if (editForm.locationName !== (editingStaff.locationName || "")) payload.locationName = editForm.locationName;
    if (editForm.locationAddress !== (editingStaff.locationAddress || "")) payload.locationAddress = editForm.locationAddress;
    const newLat = editForm.locationLat ? parseFloat(editForm.locationLat) : null;
    const oldLat = editingStaff.locationLat != null ? Number(editingStaff.locationLat) : null;
    if (newLat !== oldLat) payload.locationLat = newLat;
    const newLng = editForm.locationLng ? parseFloat(editForm.locationLng) : null;
    const oldLng = editingStaff.locationLng != null ? Number(editingStaff.locationLng) : null;
    if (newLng !== oldLng) payload.locationLng = newLng;
    if (Object.keys(payload).length > 1) updateMutation.mutate(payload);
    else { setEditingStaff(null); setEditForm(null); }
  };

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const payload: any = { ...form };
    if (payload.locationLat) payload.locationLat = parseFloat(payload.locationLat);
    else delete payload.locationLat;
    if (payload.locationLng) payload.locationLng = parseFloat(payload.locationLng);
    else delete payload.locationLng;
    if (!payload.locationName) delete payload.locationName;
    if (!payload.locationAddress) delete payload.locationAddress;
    addMutation.mutate(payload);
  };

  const copyLink = (token: string, staffId: number) => {
    const url = `${window.location.origin}/validate/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(staffId);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const cycleStatus = (staff: any) => {
    const order = ["off_duty", "on_duty", "break"];
    const next = order[(order.indexOf(staff.status) + 1) % order.length];
    updateMutation.mutate({ id: staff.id, status: next });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on_duty": return <Badge className="bg-green-500/20 text-green-400 border-0 cursor-pointer"><CheckCircle className="w-3 h-3 mr-1" />On Duty</Badge>;
      case "off_duty": return <Badge className="bg-slate-500/20 text-slate-400 border-0 cursor-pointer">Off Duty</Badge>;
      case "break": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0 cursor-pointer"><Clock className="w-3 h-3 mr-1" />Break</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getStaffLink = (staffId: number) => activeLinks.find((l: any) => l.staffId === staffId);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            {isShipper ? "Pickup Location Staff" : "Access Controllers"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isShipper ? "Dock, warehouse, and yard staff who validate arriving drivers at your locations" : "Gate, rack, and bay staff who validate arriving drivers"}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Staff
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats?.total || 0, color: "cyan", icon: Users },
          { label: "On Duty", value: stats?.onDuty || 0, color: "green", icon: CheckCircle },
          { label: "On Break", value: stats?.onBreak || 0, color: "yellow", icon: Clock },
          { label: "Shift Leads", value: stats?.supervisors || 0, color: "purple", icon: ShieldCheck },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-${color}-500/20`}><Icon className={`w-6 h-6 text-${color}-400`} /></div>
                <div>
                  {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>}
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search staff..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl" style={{ background: 'linear-gradient(180deg, #161d35 0%, #0d1224 100%)' }} onClick={(e: any) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="text-white text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />Add Access Controller</div>
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></Button>
              </div>
              <p className="text-slate-400 text-xs mt-2">{isShipper ? "This person will validate arriving drivers at your warehouse, dock, or pickup location" : "This person will validate arriving drivers at your terminal"}</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              {/* Location section — Shipper/Marketer only */}
              {isShipper && (
                <div className="bg-slate-800/30 rounded-xl p-4 space-y-3 border border-slate-700/30">
                  <p className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />Pickup Location</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Location Type</label>
                      <select value={form.locationType} onChange={(e: any) => setForm({ ...form, locationType: e.target.value })} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white">
                        <option value="warehouse">Warehouse</option>
                        <option value="dock">Dock</option>
                        <option value="yard">Yard</option>
                        <option value="cold_storage">Cold Storage</option>
                        <option value="distribution_center">Distribution Center</option>
                        <option value="port">Port</option>
                        <option value="rail_yard">Rail Yard</option>
                        <option value="pickup_point">Pickup Point</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Location Name</label>
                      <Input value={form.locationName} onChange={(e: any) => setForm({ ...form, locationName: e.target.value })} placeholder="Main Warehouse, Dock B..." className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-400 mb-1 block">Address</label>
                      <Input value={form.locationAddress} onChange={(e: any) => setForm({ ...form, locationAddress: e.target.value })} placeholder="123 Industrial Blvd, Houston, TX 77001" className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Latitude (for geofence)</label>
                      <Input type="number" step="any" value={form.locationLat} onChange={(e: any) => setForm({ ...form, locationLat: e.target.value })} placeholder="29.7604" className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Longitude (for geofence)</label>
                      <Input type="number" step="any" value={form.locationLng} onChange={(e: any) => setForm({ ...form, locationLng: e.target.value })} placeholder="-95.3698" className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600">Lat/Lng enables geofence verification — staff must be within 500m of this location to validate arrivals</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Full Name *</label>
                  <Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                  <Input value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email</label>
                  <Input value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Role</label>
                  <select value={form.staffRole} onChange={(e: any) => setForm({ ...form, staffRole: e.target.value })} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white">
                    {isShipper ? (
                      <>
                        <option value="dock_manager">Dock Manager</option>
                        <option value="warehouse_lead">Warehouse Lead</option>
                        <option value="receiving_clerk">Receiving Clerk</option>
                        <option value="yard_marshal">Yard Marshal</option>
                        <option value="gate_controller">Gate Controller</option>
                        <option value="safety_officer">Safety Officer</option>
                        <option value="shift_lead">Shift Lead</option>
                      </>
                    ) : (
                      <>
                        <option value="gate_controller">Gate Controller</option>
                        <option value="rack_supervisor">Rack Supervisor</option>
                        <option value="bay_operator">Bay Operator</option>
                        <option value="safety_officer">Safety Officer</option>
                        <option value="shift_lead">Shift Lead</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{isShipper ? "Assigned Area" : "Assigned Zone"}</label>
                  <Input value={form.assignedZone} onChange={(e: any) => setForm({ ...form, assignedZone: e.target.value })} placeholder={isShipper ? "Dock A, Receiving Bay 2..." : "Gate A, Rack 3, Bay 1-4..."} className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Shift</label>
                  <select value={form.shift} onChange={(e: any) => setForm({ ...form, shift: e.target.value })} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white">
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                    <option value="swing">Swing</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.canApproveAccess} onChange={(e: any) => setForm({ ...form, canApproveAccess: e.target.checked })} className="rounded border-slate-600 bg-slate-800" />
                  Can approve geofence access
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.canDispenseProduct} onChange={(e: any) => setForm({ ...form, canDispenseProduct: e.target.checked })} className="rounded border-slate-600 bg-slate-800" />
                  {isShipper ? "Can authorize release" : "Can authorize dispensing"}
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowAdd(false)} className="bg-slate-800/50 border-slate-700/50 rounded-lg">Cancel</Button>
                <Button onClick={handleAdd} disabled={!form.name.trim() || addMutation.isPending}
                  className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
                  {addMutation.isPending ? "Adding..." : "Add Controller"}
                </Button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && editForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={() => { setEditingStaff(null); setEditForm(null); }}>
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl" style={{ background: 'linear-gradient(180deg, #161d35 0%, #0d1224 100%)' }} onClick={(e: any) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="text-white text-lg font-semibold flex items-center gap-2"><Pencil className="w-5 h-5 text-cyan-400" />Edit Staff</div>
                <Button size="sm" variant="ghost" onClick={() => { setEditingStaff(null); setEditForm(null); }} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></Button>
              </div>
              <p className="text-slate-400 text-xs mt-2">Update details for {editingStaff.name}</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              {/* Location section — Shipper/Marketer only */}
              {isShipper && (
                <div className="bg-slate-800/30 rounded-xl p-4 space-y-3 border border-slate-700/30">
                  <p className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />Pickup Location</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Location Type</label>
                      <select value={editForm.locationType} onChange={(e: any) => setEditForm({ ...editForm, locationType: e.target.value })} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white">
                        <option value="warehouse">Warehouse</option>
                        <option value="dock">Dock</option>
                        <option value="yard">Yard</option>
                        <option value="cold_storage">Cold Storage</option>
                        <option value="distribution_center">Distribution Center</option>
                        <option value="port">Port</option>
                        <option value="rail_yard">Rail Yard</option>
                        <option value="pickup_point">Pickup Point</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Location Name</label>
                      <Input value={editForm.locationName} onChange={(e: any) => setEditForm({ ...editForm, locationName: e.target.value })} placeholder="Main Warehouse, Dock B..." className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-400 mb-1 block">Address</label>
                      <Input value={editForm.locationAddress} onChange={(e: any) => setEditForm({ ...editForm, locationAddress: e.target.value })} placeholder="123 Industrial Blvd, Houston, TX 77001" className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Latitude (for geofence)</label>
                      <Input type="number" step="any" value={editForm.locationLat} onChange={(e: any) => setEditForm({ ...editForm, locationLat: e.target.value })} placeholder="29.7604" className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Longitude (for geofence)</label>
                      <Input type="number" step="any" value={editForm.locationLng} onChange={(e: any) => setEditForm({ ...editForm, locationLng: e.target.value })} placeholder="-95.3698" className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600">Lat/Lng enables geofence verification — staff must be within 500m of this location</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Full Name *</label>
                  <Input value={editForm.name} onChange={(e: any) => setEditForm({ ...editForm, name: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                  <Input value={editForm.phone} onChange={(e: any) => setEditForm({ ...editForm, phone: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email</label>
                  <Input value={editForm.email} onChange={(e: any) => setEditForm({ ...editForm, email: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Role</label>
                  <select value={editForm.staffRole} onChange={(e: any) => setEditForm({ ...editForm, staffRole: e.target.value })} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white">
                    {isShipper ? (
                      <>
                        <option value="dock_manager">Dock Manager</option>
                        <option value="warehouse_lead">Warehouse Lead</option>
                        <option value="receiving_clerk">Receiving Clerk</option>
                        <option value="yard_marshal">Yard Marshal</option>
                        <option value="gate_controller">Gate Controller</option>
                        <option value="safety_officer">Safety Officer</option>
                        <option value="shift_lead">Shift Lead</option>
                      </>
                    ) : (
                      <>
                        <option value="gate_controller">Gate Controller</option>
                        <option value="rack_supervisor">Rack Supervisor</option>
                        <option value="bay_operator">Bay Operator</option>
                        <option value="safety_officer">Safety Officer</option>
                        <option value="shift_lead">Shift Lead</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{isShipper ? "Assigned Area" : "Assigned Zone"}</label>
                  <Input value={editForm.assignedZone} onChange={(e: any) => setEditForm({ ...editForm, assignedZone: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Shift</label>
                  <select value={editForm.shift} onChange={(e: any) => setEditForm({ ...editForm, shift: e.target.value })} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white">
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                    <option value="swing">Swing</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={editForm.canApproveAccess} onChange={(e: any) => setEditForm({ ...editForm, canApproveAccess: e.target.checked })} className="rounded border-slate-600 bg-slate-800" />
                  Can approve geofence access
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={editForm.canDispenseProduct} onChange={(e: any) => setEditForm({ ...editForm, canDispenseProduct: e.target.checked })} className="rounded border-slate-600 bg-slate-800" />
                  {isShipper ? "Can authorize release" : "Can authorize dispensing"}
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setEditingStaff(null); setEditForm(null); }} className="bg-slate-800/50 border-slate-700/50 rounded-lg">Cancel</Button>
                <Button onClick={handleEdit} disabled={!editForm.name?.trim() || updateMutation.isPending}
                  className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Staff List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />Access Controllers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {staffQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: number) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No access controllers yet</p>
              <p className="text-slate-500 text-xs mt-1">Add staff to manage who validates arriving drivers</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {staffList.map((staff: any) => {
                const link = getStaffLink(staff.id);
                return (
                  <div key={staff.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-lg">
                          {staff.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-bold">{staff.name}</p>
                            <Badge className={`${ROLE_COLORS[staff.staffRole] || "bg-slate-500/20 text-slate-400"} border-0 text-xs`}>
                              {ROLE_LABELS[staff.staffRole] || staff.staffRole}
                            </Badge>
                            <span onClick={() => cycleStatus(staff)}>{getStatusBadge(staff.status)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            {staff.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{staff.phone}</span>}
                            {staff.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{staff.email}</span>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span>Shift: {staff.shift}</span>
                            {staff.assignedZone && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{staff.assignedZone}</span>}
                            {staff.canApproveAccess && <span className="flex items-center gap-1 text-green-500"><KeyRound className="w-3 h-3" />Access</span>}
                            {staff.canDispenseProduct && <span className="flex items-center gap-1 text-blue-500"><Fuel className="w-3 h-3" />{isShipper ? "Release" : "Dispense"}</span>}
                            {staff.locationType && staff.locationType !== "terminal" && (
                              <span className="flex items-center gap-1 text-cyan-500"><Building2 className="w-3 h-3" />{LOCATION_TYPE_LABELS[staff.locationType] || staff.locationType}</span>
                            )}
                            {staff.locationName && <span className="text-slate-600">{staff.locationName}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {link ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => copyLink(link.token, staff.id)}
                              className={`rounded-lg text-xs ${copiedToken === staff.id ? "bg-green-600/20 border-green-600/50 text-green-400" : "bg-cyan-600/10 border-cyan-600/30 text-cyan-400"}`}>
                              {copiedToken === staff.id ? <><CheckCircle className="w-3 h-3 mr-1" />Copied</> : <><Copy className="w-3 h-3 mr-1" />Copy Link</>}
                            </Button>
                            <Button size="sm" variant="outline"
                              onClick={() => { setSendingStaffId(staff.id); sendLinkMutation.mutate({ staffId: staff.id }); }}
                              disabled={sendingStaffId === staff.id || sentToStaff === staff.id}
                              className={`rounded-lg text-xs ${sentToStaff === staff.id ? "bg-green-600/20 border-green-600/50 text-green-400" : "bg-emerald-600/10 border-emerald-600/30 text-emerald-400"}`}>
                              {sentToStaff === staff.id ? <><CheckCircle className="w-3 h-3 mr-1" />Sent</> : sendingStaffId === staff.id ? <><Send className="w-3 h-3 mr-1 animate-pulse" />Sending...</> : <><Send className="w-3 h-3 mr-1" />Send</>}
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => genLinkMutation.mutate({ staffId: staff.id })}
                            disabled={genLinkMutation.isPending}
                            className="bg-cyan-600/10 border-cyan-600/30 text-cyan-400 rounded-lg text-xs">
                            <Link2 className="w-3 h-3 mr-1" />{genLinkMutation.isPending ? "..." : "Generate Link"}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openEdit(staff)}
                          className="text-slate-500 hover:text-cyan-400">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Remove ${staff.name}?`)) removeMutation.mutate({ id: staff.id }); }}
                          className="text-slate-500 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {link && (
                      <div className="mt-2 ml-16 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-600 font-mono truncate max-w-[300px]">{window.location.origin}/validate/{link.token.slice(0, 12)}...</span>
                          <Badge className="bg-green-500/10 text-green-500 border-0 text-[10px]">Active 24h</Badge>
                          <button onClick={() => revokeLinkMutation.mutate({ tokenId: link.tokenId })} className="text-[10px] text-red-500 hover:underline ml-1">Revoke</button>
                        </div>
                        {link.accessCode && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">Access Code:</span>
                            <span className="text-sm font-mono font-bold text-cyan-400 tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded">{link.accessCode}</span>
                            <span className="text-[10px] text-slate-600">Share this code with the staff member</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
