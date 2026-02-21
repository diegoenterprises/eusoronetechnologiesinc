import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Search, MapPin, Building2, Fuel, Factory, Warehouse, Filter,
  Star, Phone, Clock, Shield, ChevronRight, Loader2, Database,
  Truck, Ship, TrainFront, Cylinder, X,
} from "lucide-react";

const FACILITY_TYPES = [
  { value: "", label: "All Types" },
  { value: "TERMINAL", label: "Terminal" },
  { value: "REFINERY", label: "Refinery" },
  { value: "RACK", label: "Loading Rack" },
  { value: "BULK_PLANT", label: "Bulk Plant" },
  { value: "TRANSLOAD", label: "Transload" },
  { value: "WELL", label: "Well" },
  { value: "TANK_BATTERY", label: "Tank Battery" },
];

const US_STATES = [
  "", "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM",
  "NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

function typeIcon(t: string) {
  switch (t) {
    case "TERMINAL": return <Building2 className="w-4 h-4" />;
    case "REFINERY": return <Factory className="w-4 h-4" />;
    case "RACK": return <Fuel className="w-4 h-4" />;
    case "BULK_PLANT": return <Warehouse className="w-4 h-4" />;
    default: return <Database className="w-4 h-4" />;
  }
}

function connectivityBadges(fac: any) {
  const badges = [];
  if (fac.receivesTruck) badges.push({ icon: <Truck className="w-3 h-3" />, label: "Truck" });
  if (fac.receivesPipeline) badges.push({ icon: <Cylinder className="w-3 h-3" />, label: "Pipeline" });
  if (fac.receivesBarge) badges.push({ icon: <Ship className="w-3 h-3" />, label: "Barge" });
  if (fac.receivesRail) badges.push({ icon: <TrainFront className="w-3 h-3" />, label: "Rail" });
  if (fac.receivesTanker) badges.push({ icon: <Ship className="w-3 h-3" />, label: "Tanker" });
  return badges;
}

export default function FacilitySearch() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: results, isLoading } = trpc.facilityIntelligence.search.useQuery(
    { query: searchTerm, facilityType: typeFilter || undefined, state: stateFilter || undefined, limit: 30 },
    { enabled: searchTerm.length >= 2 },
  );

  const { data: totals } = trpc.facilityIntelligence.getTotalCount.useQuery();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchTerm(query);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Facility Intelligence</h1>
        <p className="text-sm text-slate-400 mt-1">
          Search {totals?.total?.toLocaleString() || "1,400+"} petroleum facilities across the United States
        </p>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{totals?.terminals?.toLocaleString() || "---"} Terminals</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Factory className="w-3.5 h-3.5 text-amber-400" />
            <span>{totals?.refineries?.toLocaleString() || "---"} Refineries</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-xl overflow-hidden focus-within:border-blue-500/40 transition-colors">
          <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by facility name, operator, or city..."
            className="flex-1 bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setSearchTerm(""); }} className="p-2 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 border-l border-white/[0.06] ${showFilters ? "text-blue-400" : "text-slate-500"} hover:text-blue-400 transition-colors`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            type="submit"
            className="px-5 py-3.5 bg-gradient-to-r from-[#1473FF] to-[#0A5FE0] text-white text-sm font-medium hover:brightness-110 transition-all"
          >
            Search
          </button>
        </div>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white/[0.06] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/40"
          >
            {FACILITY_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>
            ))}
          </select>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-white/[0.06] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/40"
          >
            <option value="" className="bg-slate-900">All States</option>
            {US_STATES.filter(Boolean).map((s) => (
              <option key={s} value={s} className="bg-slate-900">{s}</option>
            ))}
          </select>
          {(typeFilter || stateFilter) && (
            <button
              onClick={() => { setTypeFilter(""); setStateFilter(""); }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && searchTerm && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="ml-3 text-sm text-slate-400">Searching facilities...</span>
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 mb-2">{results.length} results</p>
          {(results as any[]).map((fac: any) => (
            <a
              key={fac.id}
              href={`/facility/${fac.id}`}
              className="block bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/[0.08] transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {typeIcon(fac.facilityType)}
                      {fac.facilityType}
                    </span>
                    {fac.isEusotripVerified && (
                      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Shield className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {fac.status !== "OPERATING" && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {fac.status}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                    {fac.facilityName}
                  </h3>

                  {fac.operatorName && (
                    <p className="text-xs text-slate-500 mt-0.5">Operator: {fac.operatorName}</p>
                  )}

                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{[fac.city, fac.state].filter(Boolean).join(", ")}</span>
                    {fac.padd && <span className="text-slate-600">| PADD {fac.padd}</span>}
                  </div>

                  {/* Connectivity */}
                  {connectivityBadges(fac).length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {connectivityBadges(fac).map((b, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded">
                          {b.icon} {b.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
                    {fac.loadingBays && (
                      <span className="flex items-center gap-1"><Fuel className="w-3 h-3" /> {fac.loadingBays} bays</span>
                    )}
                    {fac.loadingHours && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fac.loadingHours}</span>
                    )}
                    {fac.twicRequired && (
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> TWIC</span>
                    )}
                    {fac.gatePhone && (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {fac.gatePhone}</span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 mt-2 shrink-0 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Empty state */}
      {results && results.length === 0 && searchTerm && !isLoading && (
        <div className="text-center py-20">
          <Database className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No facilities found for "{searchTerm}"</p>
          <p className="text-xs text-slate-600 mt-1">Try a different name, city, or operator</p>
        </div>
      )}

      {/* Initial state */}
      {!searchTerm && !isLoading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">Search the Facility Database</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Government-seeded from EIA, HIFLD, and state petroleum commissions. Search terminals, refineries, racks, and more.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {["Houston", "Enterprise Products", "Phillips 66", "Pasadena TX", "Galveston Bay"].map((term) => (
              <button
                key={term}
                onClick={() => { setQuery(term); setSearchTerm(term); }}
                className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
