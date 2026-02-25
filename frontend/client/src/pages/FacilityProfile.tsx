import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import {
  Building2, Factory, MapPin, Phone, Clock, Shield, Star, Fuel,
  Truck, Ship, TrainFront, Cylinder, ChevronLeft, Loader2, Database,
  CheckCircle, AlertTriangle, BarChart3, Users, Timer, Award,
  MessageSquare, Send, Navigation, Warehouse, ExternalLink, FileText,
  ArrowRight, Droplets, ScrollText,
} from "lucide-react";

function typeIcon(t: string) {
  switch (t) {
    case "TERMINAL": return <Building2 className="w-5 h-5" />;
    case "REFINERY": return <Factory className="w-5 h-5" />;
    case "RACK": return <Fuel className="w-5 h-5" />;
    case "BULK_PLANT": return <Warehouse className="w-5 h-5" />;
    default: return <Database className="w-5 h-5" />;
  }
}

export default function FacilityProfile() {
  const params = useParams<{ id: string }>();
  const facilityId = parseInt(params.id || "0", 10);
  const [activeTab, setActiveTab] = useState<"overview" | "pipelines" | "ratings" | "stats">("overview");
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");

  const { data: facility, isLoading } = trpc.facilityIntelligence.getById.useQuery(
    { facilityId },
    { enabled: facilityId > 0 },
  );

  const { data: ratingsData } = trpc.facilityIntelligence.getRatings.useQuery(
    { facilityId, limit: 20 },
    { enabled: facilityId > 0 && activeTab === "ratings" },
  );

  const { data: requirements } = trpc.facilityIntelligence.getRequirements.useQuery(
    { facilityId },
    { enabled: facilityId > 0 },
  );

  const { data: pipelineData } = trpc.facilityIntelligence.getPipelineTariffs.useQuery(
    { facilityId },
    { enabled: facilityId > 0 },
  );

  const rateMutation = trpc.facilityIntelligence.rate.useMutation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen text-slate-800 dark:text-white flex flex-col items-center justify-center">
        <Database className="w-10 h-10 text-slate-700 mb-3" />
        <p className="text-sm text-slate-500">Facility not found</p>
        <a href="/facility-search" className="text-xs text-blue-400 hover:underline mt-2">Back to search</a>
      </div>
    );
  }

  const fac = facility as any;
  const stats = fac.stats;
  const avgRating = fac.ratingSummary?.avgRating ? Number(fac.ratingSummary.avgRating).toFixed(1) : "N/A";
  const totalRatings = fac.ratingSummary?.totalRatings || 0;

  const connectivity = [
    fac.receivesTruck && { icon: <Truck className="w-3.5 h-3.5" />, label: "Truck" },
    fac.receivesPipeline && { icon: <Cylinder className="w-3.5 h-3.5" />, label: "Pipeline" },
    fac.receivesBarge && { icon: <Ship className="w-3.5 h-3.5" />, label: "Barge" },
    fac.receivesRail && { icon: <TrainFront className="w-3.5 h-3.5" />, label: "Rail" },
    fac.receivesTanker && { icon: <Ship className="w-3.5 h-3.5" />, label: "Tanker" },
  ].filter(Boolean);

  const pipe = pipelineData as any;
  const hasPipelineData = pipe?.pipelineOperator || pipe?.receivesPipeline;

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "pipelines" as const, label: "Pipelines & Tariffs" },
    { key: "ratings" as const, label: `Ratings (${totalRatings})` },
    { key: "stats" as const, label: "Performance" },
  ];

  async function submitRating() {
    if (!facilityId) return;
    try {
      await rateMutation.mutateAsync({ facilityId, rating: ratingInput, comment: commentInput || undefined });
      setCommentInput("");
    } catch {}
  }

  return (
    <div className="min-h-screen text-slate-800 dark:text-white px-4 py-6 max-w-5xl mx-auto">
      {/* Back */}
      <a href="/facility-search" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400 mb-6 transition-colors">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to search
      </a>

      {/* Hero */}
      <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            {typeIcon(fac.facilityType)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {fac.facilityType}
              </span>
              {fac.facilitySubtype && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {(fac.facilitySubtype as string).replace(/_/g, " ")}
                </span>
              )}
              {fac.isEusotripVerified && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              )}
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${fac.status === "OPERATING" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                {fac.status}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-white">{fac.facilityName}</h1>
            {fac.operatorName && <p className="text-xs text-slate-500 mt-0.5">Operator: {fac.operatorName}</p>}

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium text-slate-800 dark:text-white">{avgRating}</span>
              </div>
              <span className="text-xs text-slate-500">({totalRatings} ratings)</span>
              {stats?.totalLoadsAllTime && (
                <>
                  <span className="text-slate-700">|</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> {stats.totalLoadsAllTime.toLocaleString()} loads through EusoTrip
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Location + Contact */}
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-slate-200/60 dark:border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{[fac.address, fac.city, fac.state, fac.zip].filter(Boolean).join(", ")}</span>
          </div>
          {fac.gatePhone && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Phone className="w-3.5 h-3.5 text-slate-500" /> Gate: {fac.gatePhone}
            </div>
          )}
          {fac.officePhone && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Phone className="w-3.5 h-3.5 text-slate-500" /> Office: {fac.officePhone}
            </div>
          )}
          {fac.loadingHours && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> {fac.loadingHours}
            </div>
          )}
        </div>

        {/* Connectivity */}
        {connectivity.length > 0 && (
          <div className="flex gap-2 mt-3">
            {connectivity.map((c: any, i: number) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 dark:bg-white/[0.04] px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-white/[0.04]">
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-5">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-300 hover:bg-white/[0.10] transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" /> Get Directions
          </a>
          {fac.gatePhone && (
            <a
              href={`tel:${fac.gatePhone}`}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-300 hover:bg-white/[0.10] transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Contact Terminal
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === tab.key ? "bg-slate-200 dark:bg-white/[0.08] text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-300"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Products */}
          {fac.products && (fac.products as string[]).length > 0 && (
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Products</h3>
              <div className="space-y-2">
                {(fac.products as string[]).map((p: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-800 dark:text-white">
                    <Fuel className="w-3.5 h-3.5 text-blue-400" /> {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {requirements && requirements.length > 0 && (
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Requirements</h3>
              <div className="space-y-2">
                {(requirements as any[]).map((r: any) => (
                  <div key={r.id} className="flex items-center gap-2 text-sm text-slate-800 dark:text-white">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {r.requirementType}: {r.requirementValue || "Required"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facility Details */}
          <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-4">
            <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Details</h3>
            <div className="space-y-2 text-sm">
              {fac.storageCapacityBbl && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Storage Capacity</span>
                  <span className="text-slate-800 dark:text-white">{Number(fac.storageCapacityBbl).toLocaleString()} bbl</span>
                </div>
              )}
              {fac.processingCapacityBpd && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Processing Capacity</span>
                  <span className="text-slate-800 dark:text-white">{Number(fac.processingCapacityBpd).toLocaleString()} bpd</span>
                </div>
              )}
              {fac.loadingBays && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Loading Bays</span>
                  <span className="text-slate-800 dark:text-white">{fac.loadingBays}</span>
                </div>
              )}
              {fac.unloadingBays && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Unloading Bays</span>
                  <span className="text-slate-800 dark:text-white">{fac.unloadingBays}</span>
                </div>
              )}
              {fac.appointmentRequired !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Appointment Required</span>
                  <span className="text-slate-800 dark:text-white">{fac.appointmentRequired ? "Yes" : "No"}</span>
                </div>
              )}
              {fac.twicRequired !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">TWIC Required</span>
                  <span className="text-slate-800 dark:text-white">{fac.twicRequired ? "Yes" : "No"}</span>
                </div>
              )}
              {fac.terminalAutomationSystem && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Automation System</span>
                  <span className="text-slate-800 dark:text-white">{fac.terminalAutomationSystem}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Data Source</span>
                <span className="text-slate-800 dark:text-white text-[10px] bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded">{fac.dataSource}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Performance (90 Days)</h3>
              <div className="space-y-3">
                {stats.avgWaitMinutes && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Avg Wait</span>
                      <span className="text-slate-800 dark:text-white">{stats.avgWaitMinutes} min</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(Number(stats.avgWaitMinutes) / 90 * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
                {stats.avgLoadingMinutes && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Avg Loading</span>
                      <span className="text-slate-800 dark:text-white">{stats.avgLoadingMinutes} min</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(Number(stats.avgLoadingMinutes) / 90 * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
                {stats.onTimeStartPercentage && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">On-Time Starts</span>
                      <span className="text-slate-800 dark:text-white">{stats.onTimeStartPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Number(stats.onTimeStartPercentage)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pipelines & Tariffs Tab */}
      {activeTab === "pipelines" && (
        <div className="space-y-4">
          {pipe?.pipelineOperator ? (
            <>
              {/* Operator Header */}
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/10 border border-[#1473FF]/20 flex items-center justify-center">
                      <Cylinder className="w-5 h-5 text-[#1473FF]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{pipe.pipelineOperator.company}</h3>
                      <p className="text-[10px] text-slate-500">Pipeline Operator &middot; FERC Regulated</p>
                    </div>
                  </div>
                  {pipe.pipelineOperator.website && (
                    <a href={pipe.pipelineOperator.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-400 hover:text-blue-400 transition-colors">
                      <ExternalLink className="w-3 h-3" /> Operator Website
                    </a>
                  )}
                </div>
              </div>

              {/* Pipeline Systems */}
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-5">
                <h3 className="text-xs font-medium text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-[#1473FF]" /> Pipeline Systems
                </h3>
                <div className="space-y-3">
                  {pipe.pipelineOperator.systems.map((sys: any, i: number) => (
                    <div key={i} className="bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{sys.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{sys.type} &middot; {sys.states.join(", ")}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">
                          {sys.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {sys.ferc.map((f: string, j: number) => (
                          <a key={j} href={pipe.fercInfoUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06] hover:text-blue-400 hover:border-blue-500/30 transition-colors">
                            <FileText className="w-2.5 h-2.5" /> {f}
                            <ArrowRight className="w-2 h-2" />
                          </a>
                        ))}
                      </div>
                      {sys.products.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {sys.products.map((p: string, k: number) => (
                            <span key={k} className="text-[9px] text-slate-500 bg-slate-50 dark:bg-white/[0.03] px-1.5 py-0.5 rounded">{p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tariff Indices */}
              {pipe.pipelineOperator.tariffIndices?.length > 0 && (
                <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-5">
                  <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <ScrollText className="w-3.5 h-3.5 text-amber-400" /> Tariff Indices
                  </h3>
                  <div className="space-y-2">
                    {pipe.pipelineOperator.tariffIndices.map((ti: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs text-slate-800 dark:text-white font-medium">{ti.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{ti.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proration Policy */}
              {pipe.pipelineOperator.prorationPolicy && (
                <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-5">
                  <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Proration Policy</h3>
                  <div className="flex items-center justify-between py-2.5 px-3 bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs text-slate-800 dark:text-white font-medium">{pipe.pipelineOperator.prorationPolicy.name}</span>
                    </div>
                    {pipe.pipelineOperator.prorationPolicy.date && (
                      <span className="text-[10px] text-slate-500">{pipe.pipelineOperator.prorationPolicy.date}</span>
                    )}
                  </div>
                </div>
              )}

              {/* FERC Reference */}
              <div className="flex items-center gap-2 px-3 py-2">
                <a href={pipe.fercInfoUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] text-blue-400 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> View all oil pipeline tariffs on FERC.gov
                </a>
              </div>
            </>
          ) : pipe?.receivesPipeline ? (
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-6 text-center">
              <Cylinder className="w-8 h-8 text-blue-400/30 mx-auto mb-3" />
              <p className="text-sm text-slate-800 dark:text-white font-medium">Pipeline Connected Facility</p>
              <p className="text-xs text-slate-500 mt-1">This facility receives product via pipeline, but specific tariff data is not yet indexed.</p>
              <a href={pipe?.fercInfoUrl || "https://www.ferc.gov/industries-data/oil/tariffs-oil-pipeline-tariffs"} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg text-blue-400 hover:bg-white/[0.10] transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Search FERC Oil Pipeline Tariffs
              </a>
            </div>
          ) : (
            <div className="text-center py-16">
              <Cylinder className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No pipeline tariff data available for this facility</p>
              <p className="text-xs text-slate-600 mt-1">Pipeline &amp; FERC tariff data is indexed for major US petroleum pipeline operators</p>
              <a href="https://www.ferc.gov/industries-data/oil/tariffs-oil-pipeline-tariffs" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-xs text-blue-400 hover:underline">
                <ExternalLink className="w-3 h-3" /> Browse FERC Oil Pipeline Tariffs
              </a>
            </div>
          )}
        </div>
      )}

      {/* Ratings Tab */}
      {activeTab === "ratings" && (
        <div className="space-y-4">
          {/* Submit rating */}
          <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-4">
            <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Rate this Facility</h3>
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRatingInput(n)}>
                  <Star className={`w-5 h-5 transition-colors ${n <= ratingInput ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Share your experience at this facility..."
              rows={2}
              className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 resize-none"
            />
            <button
              onClick={submitRating}
              disabled={rateMutation.isPending}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-gradient-to-r from-[#1473FF] to-[#0A5FE0] text-slate-800 dark:text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {rateMutation.isPending ? "Submitting..." : "Submit Rating"}
            </button>
            {rateMutation.isSuccess && (
              <p className="text-xs text-emerald-400 mt-2">Rating submitted</p>
            )}
          </div>

          {/* Existing ratings */}
          {ratingsData?.ratings?.map((r: any) => (
            <div key={r.id} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
                  ))}
                </div>
                <span className="text-[10px] text-slate-600">{r.userRole}</span>
                <span className="text-[10px] text-slate-700">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="text-sm text-slate-300">{r.comment}</p>}
              {r.waitTimeMinutes && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Timer className="w-3 h-3" /> Wait: {r.waitTimeMinutes} min
                </p>
              )}
              {r.terminalResponse && (
                <div className="mt-2 pl-3 border-l-2 border-blue-500/30">
                  <p className="text-xs text-blue-400 mb-0.5">Terminal Response:</p>
                  <p className="text-xs text-slate-400">{r.terminalResponse}</p>
                </div>
              )}
            </div>
          ))}

          {(!ratingsData?.ratings || ratingsData.ratings.length === 0) && (
            <div className="text-center py-12">
              <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No ratings yet. Be the first to review this facility.</p>
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === "stats" && (
        <div className="space-y-4">
          {stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Avg Wait", value: stats.avgWaitMinutes ? `${stats.avgWaitMinutes} min` : "N/A", icon: <Timer className="w-4 h-4 text-blue-400" /> },
                  { label: "Avg Loading", value: stats.avgLoadingMinutes ? `${stats.avgLoadingMinutes} min` : "N/A", icon: <Fuel className="w-4 h-4 text-emerald-400" /> },
                  { label: "Turnaround", value: stats.avgTurnaroundMinutes ? `${stats.avgTurnaroundMinutes} min` : "N/A", icon: <Clock className="w-4 h-4 text-amber-400" /> },
                  { label: "Loads (90d)", value: stats.totalLoadsLast90Days?.toLocaleString() || "0", icon: <Truck className="w-4 h-4 text-purple-400" /> },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[10px] text-slate-500">{s.label}</span></div>
                    <p className="text-lg font-semibold text-slate-800 dark:text-white">{s.value}</p>
                  </div>
                ))}
              </div>
              {stats.onTimeStartPercentage && (
                <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-4">
                  <h3 className="text-xs font-medium text-slate-400 mb-2">On-Time Start Rate</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#1473FF] to-[#0A5FE0] rounded-full" style={{ width: `${Number(stats.onTimeStartPercentage)}%` }} />
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">{stats.onTimeStartPercentage}%</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No performance data available yet.</p>
              <p className="text-xs text-slate-600 mt-1">Stats populate after loads are processed through this facility.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
