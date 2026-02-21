import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Wifi, WifiOff, RefreshCw, ArrowUpRight, ArrowDownLeft, AlertCircle,
  CheckCircle, Clock, Settings, FileText, Loader2, Database,
  BarChart3, Zap, Shield, Activity, Radio, XCircle, ChevronDown,
} from "lucide-react";

const DATA_FLOWS = [
  { label: "Truck ETA / GPS Position", direction: "TO_DTN", frequency: "Real-time" },
  { label: "Driver Compliance Pre-Clearance", direction: "TO_DTN", frequency: "Per appointment" },
  { label: "Appointment Requests", direction: "TO_DTN", frequency: "On creation" },
  { label: "Delivery Confirmations", direction: "TO_DTN", frequency: "On delivery" },
  { label: "Detention Records (GPS-verified)", direction: "TO_DTN", frequency: "On departure" },
  { label: "BOL Data", direction: "FROM_DTN", frequency: "On generation" },
  { label: "Allocation Status", direction: "FROM_DTN", frequency: "Real-time" },
  { label: "Rack Pricing", direction: "FROM_DTN", frequency: "Every 15 min" },
  { label: "Inventory Levels", direction: "FROM_DTN", frequency: "On load event" },
  { label: "Credit Authorizations", direction: "FROM_DTN", frequency: "Per request" },
  { label: "Loading Progress", direction: "FROM_DTN", frequency: "Real-time" },
];

export default function DTNSyncDashboard() {
  const [facilityId, setFacilityId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"status" | "log" | "inventory" | "pricing">("status");

  const { data: myFacilities } = trpc.facilityIntelligence.listMyFacilities.useQuery();
  const activeFacilityId = facilityId || (myFacilities && myFacilities.length > 0 ? (myFacilities[0] as any).id : 0);

  const { data: connectionStatus } = trpc.facilityIntelligence.dtnGetConnectionStatus.useQuery(
    { facilityId: activeFacilityId },
    { enabled: activeFacilityId > 0 },
  );

  const { data: syncStats } = trpc.facilityIntelligence.dtnGetSyncStats.useQuery(
    { facilityId: activeFacilityId, period: "today" },
    { enabled: activeFacilityId > 0 },
  );

  const { data: syncLog } = trpc.facilityIntelligence.dtnGetSyncLog.useQuery(
    { facilityId: activeFacilityId, limit: 30 },
    { enabled: activeFacilityId > 0 && activeTab === "log" },
  );

  const { data: inventory } = trpc.facilityIntelligence.dtnGetInventory.useQuery(
    { facilityId: activeFacilityId },
    { enabled: activeFacilityId > 0 && activeTab === "inventory" },
  );

  const { data: pricing } = trpc.facilityIntelligence.dtnGetRackPricing.useQuery(
    { facilityId: activeFacilityId },
    { enabled: activeFacilityId > 0 && activeTab === "pricing" },
  );

  const testMutation = trpc.facilityIntelligence.dtnTestConnection.useMutation();

  const isConnected = connectionStatus?.connected;
  const activeFacility = myFacilities?.find((f: any) => f.id === activeFacilityId) as any;

  const tabs = [
    { key: "status" as const, label: "Connection", icon: <Wifi className="w-3 h-3" /> },
    { key: "log" as const, label: "Sync Log", icon: <FileText className="w-3 h-3" /> },
    { key: "inventory" as const, label: "Inventory", icon: <Database className="w-3 h-3" /> },
    { key: "pricing" as const, label: "Rack Pricing", icon: <BarChart3 className="w-3 h-3" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-400" />
            DTN Integration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {activeFacility ? activeFacility.facilityName : "Terminal automation sync"}
          </p>
        </div>
        {myFacilities && (myFacilities as any[]).length > 1 && (
          <select
            value={activeFacilityId}
            onChange={(e) => setFacilityId(parseInt(e.target.value))}
            className="bg-white/[0.06] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white outline-none"
          >
            {(myFacilities as any[]).map((f: any) => (
              <option key={f.id} value={f.id} className="bg-slate-900">{f.facilityName}</option>
            ))}
          </select>
        )}
      </div>

      {/* Connection Banner */}
      <div className={`rounded-xl p-4 mb-6 border ${isConnected ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/[0.02] border-white/[0.05]"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? "bg-emerald-500/10" : "bg-white/[0.06]"}`}>
              {isConnected ? <Wifi className="w-5 h-5 text-emerald-400" /> : <WifiOff className="w-5 h-5 text-slate-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-white flex items-center gap-2">
                CONNECTION STATUS:
                {isConnected ? (
                  <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Connected</span>
                ) : (
                  <span className="text-slate-500">Not Connected</span>
                )}
              </p>
              {connectionStatus?.dtnTerminalId && (
                <p className="text-xs text-slate-500">
                  DTN Terminal ID: <span className="text-slate-300">{connectionStatus.dtnTerminalId}</span>
                  {connectionStatus.lastSyncAt && (
                    <> | Last sync: {new Date(connectionStatus.lastSyncAt).toLocaleTimeString()}</>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => activeFacilityId && testMutation.mutate({ facilityId: activeFacilityId })}
              disabled={testMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/[0.06] border border-white/[0.06] rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              {testMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
              Test Connection
            </button>
          </div>
        </div>
        {testMutation.isSuccess && (
          <p className="text-xs mt-2 text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Connection test passed
          </p>
        )}
      </div>

      {/* Today's Stats */}
      {syncStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] text-slate-500">Sent to DTN</span>
            </div>
            <p className="text-xl font-semibold text-white">{(syncStats as any).sentToDtn || 0}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-slate-500">Received</span>
            </div>
            <p className="text-xl font-semibold text-white">{(syncStats as any).receivedFromDtn || 0}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-slate-500">BOLs Synced</span>
            </div>
            <p className="text-xl font-semibold text-white">{(syncStats as any).bolsSynced || 0}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] text-slate-500">Errors</span>
            </div>
            <p className="text-xl font-semibold text-white">{(syncStats as any).errors || 0}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/[0.02] border border-white/[0.04] rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === tab.key ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Connection Status Tab */}
      {activeTab === "status" && (
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.04]">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Data Flow Configuration</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {DATA_FLOWS.map((flow, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    flow.direction === "TO_DTN" ? "bg-blue-500/10" : "bg-emerald-500/10"
                  }`}>
                    {flow.direction === "TO_DTN" ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <span className="text-sm text-white">{flow.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-slate-500">{flow.direction === "TO_DTN" ? "EusoTrip -> DTN" : "DTN -> EusoTrip"}</span>
                  <span className={`flex items-center gap-1 text-xs ${isConnected ? "text-emerald-400" : "text-slate-600"}`}>
                    {isConnected ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {isConnected ? "Live" : "Off"}
                  </span>
                  <span className="text-[10px] text-slate-600 w-24 text-right">{flow.frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Log Tab */}
      {activeTab === "log" && (
        <div className="space-y-2">
          {syncLog && (syncLog as any[]).length > 0 ? (
            (syncLog as any[]).map((entry: any) => (
              <div key={entry.id} className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    entry.direction === "TO_DTN" ? "bg-blue-500/10" : "bg-emerald-500/10"
                  }`}>
                    {entry.direction === "TO_DTN" ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{entry.eventType}</p>
                    <p className="text-[10px] text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {entry.durationMs && <span className="text-[10px] text-slate-500">{entry.durationMs}ms</span>}
                  {entry.errorMessage ? (
                    <span className="text-xs text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> Error</span>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> OK</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No sync events yet</p>
              <p className="text-xs text-slate-600 mt-1">Events will appear here as data flows between EusoTrip and DTN</p>
            </div>
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === "inventory" && (
        <div className="space-y-3">
          {inventory && (inventory as any[]).length > 0 ? (
            (inventory as any[]).map((item: any, i: number) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{item.product}</span>
                  <span className="text-xs text-slate-400">{item.percentFull}% full</span>
                </div>
                <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.percentFull > 80 ? "bg-emerald-500" : item.percentFull > 40 ? "bg-blue-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${item.percentFull}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{item.currentLevel.toLocaleString()} {item.unit}</span>
                  <span>Max: {item.maxCapacity.toLocaleString()} {item.unit}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <Database className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No inventory data</p>
              <p className="text-xs text-slate-600 mt-1">Connect DTN TIMS to see real-time inventory levels</p>
            </div>
          )}
        </div>
      )}

      {/* Rack Pricing Tab */}
      {activeTab === "pricing" && (
        <div className="space-y-3">
          {pricing && (pricing as any[]).length > 0 ? (
            <>
              {/* Group by product */}
              {Object.entries(
                (pricing as any[]).reduce((acc: any, p: any) => {
                  if (!acc[p.product]) acc[p.product] = [];
                  acc[p.product].push(p);
                  return acc;
                }, {} as Record<string, any[]>)
              ).map(([product, prices]) => (
                <div key={product} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
                  <h3 className="text-sm font-medium text-white mb-3">{product}</h3>
                  <div className="space-y-2">
                    {(prices as any[]).map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                        <span className="text-xs text-slate-400">{p.supplierName}</span>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">${p.grossPrice.toFixed(3)}</p>
                            <p className="text-[10px] text-slate-600">Net: ${p.netPrice.toFixed(3)} | Tax: ${p.taxes.toFixed(3)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-16">
              <BarChart3 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No pricing data</p>
              <p className="text-xs text-slate-600 mt-1">Connect DTN Fuel Buyer to see real-time rack pricing</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
