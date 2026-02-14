/**
 * ERG (EMERGENCY RESPONSE GUIDEBOOK) PAGE
 * Full ERG 2024 with UN Lookup, Guide Viewer, ESANG AI Integration
 * Powered by real ERG database + ESANG AI + SPECTRA-MATCH
 */

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, Search, Phone, Flame, Droplets,
  Shield, Skull, ChevronRight,
  BookOpen, FileText, Info, MapPin, Activity,
  ArrowRight, Loader2, Zap, Database, Navigation
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

export default function Erg() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("lookup");
  const [selectedGuideNumber, setSelectedGuideNumber] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");

  // tRPC queries
  const searchQuery = (trpc as any).esang.searchERG.useQuery(
    { query: searchTerm },
    { enabled: searchTerm.length >= 2 }
  );

  const guideQuery = (trpc as any).esang.getERGGuide.useQuery(
    { guideNumber: selectedGuideNumber || "128" },
    { enabled: !!selectedGuideNumber }
  );

  const recentLookupsQuery = (trpc as any).esang.getRecentERGLookups.useQuery({});

  // ERG lookup mutation (for UN number / material)
  const ergLookupMutation = (trpc as any).esang.ergLookup.useMutation();

  // ESANG AI chat mutation
  const aiChatMutation = (trpc as any).esang.chat.useMutation();

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    // Check if it's a UN number pattern
    const unMatch = searchTerm.match(/^(?:un)?(\d{4})$/i);
    if (unMatch) {
      ergLookupMutation.mutate({ unNumber: unMatch[1] });
    } else if (/^\d+$/.test(searchTerm) && parseInt(searchTerm) >= 111 && parseInt(searchTerm) <= 175) {
      ergLookupMutation.mutate({ guideNumber: parseInt(searchTerm) });
    } else {
      ergLookupMutation.mutate({ materialName: searchTerm });
    }
  }, [searchTerm, ergLookupMutation]);

  const handleAskAI = useCallback(() => {
    if (!aiQuestion.trim()) return;
    aiChatMutation.mutate({
      message: aiQuestion,
      context: { currentPage: "erg" },
    });
  }, [aiQuestion, aiChatMutation]);

  const handleViewGuide = useCallback((guideNum: string) => {
    setSelectedGuideNumber(guideNum);
    setActiveTab("guide");
  }, []);

  const ergResult = ergLookupMutation.data as any;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Emergency Response Guidebook</h1>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">ERG 2024</Badge>
            <Badge className="bg-blue-500/20 text-blue-400 text-xs">
              <EsangIcon className="w-3 h-3 mr-1" />
              ESANG AI Powered
            </Badge>
          </div>
          <p className="text-slate-400 mt-1">DOT/PHMSA Emergency Response Guidebook - Full database with UN lookup, guides, and AI intelligence</p>
        </div>
      </div>

      {/* Emergency Contacts Banner */}
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Emergency:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">CHEMTREC:</span>
              <span className="text-red-400 font-mono">1-800-424-9300</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">NRC:</span>
              <span className="text-red-400 font-mono">1-800-424-8802</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">Poison Control:</span>
              <span className="text-red-400 font-mono">1-800-222-1222</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">CANUTEC:</span>
              <span className="text-red-400 font-mono">1-888-226-8832</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Search UN number (e.g. 1203), guide (e.g. 128), or material name..."
            className="pl-9 bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={ergLookupMutation.isPending}>
          {ergLookupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="ml-2">Lookup</span>
        </Button>
      </form>

      {/* Live Search Results */}
      {searchTerm.length >= 2 && searchQuery.data && (searchQuery.data as any[]).length > 0 && !ergResult && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700/50 max-h-64 overflow-y-auto">
              {(searchQuery.data as any[]).slice(0, 10).map((item: any) => (
                <div
                  key={item.unNumber}
                  className="p-3 hover:bg-slate-700/30 cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    ergLookupMutation.mutate({ unNumber: item.unNumber.replace("UN", "") });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-500/20 text-orange-400 font-mono">{item.unNumber}</Badge>
                    <span className="text-white text-sm">{item.product}</span>
                    <Badge className="bg-slate-600/50 text-slate-300 text-xs">Class {item.hazardClass}</Badge>
                    {item.isTIH && <Badge className="bg-red-500/20 text-red-400 text-xs">TIH</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Guide {item.guideNumber}</Badge>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="lookup" className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5" />
            UN Lookup
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Guide Viewer
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1">
            <EsangIcon className="w-3.5 h-3.5" />
            Ask ESANG AI
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            Contacts
          </TabsTrigger>
        </TabsList>

        {/* UN Lookup Tab */}
        <TabsContent value="lookup" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {ergLookupMutation.isPending ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ) : ergResult?.found ? (
                <div className="space-y-4">
                  {/* Material Info */}
                  {ergResult.material && (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl text-white flex items-center gap-3">
                              <Badge className="bg-orange-500/20 text-orange-400 font-mono text-lg px-3 py-1">UN{ergResult.material.unNumber}</Badge>
                              {ergResult.material.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-blue-500/20 text-blue-400">Class {ergResult.material.hazardClass}</Badge>
                              <Badge className="bg-yellow-500/20 text-yellow-400" onClick={() => handleViewGuide(String(ergResult.material.guide))} style={{ cursor: "pointer" }}>
                                <FileText className="w-3 h-3 mr-1" />
                                Guide {ergResult.material.guide}
                              </Badge>
                              {ergResult.material.packingGroup && <Badge className="bg-slate-600/50 text-slate-300">PG {ergResult.material.packingGroup}</Badge>}
                              {ergResult.material.isTIH && <Badge className="bg-red-500/20 text-red-400 font-bold">TIH - TOXIC INHALATION HAZARD</Badge>}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )}

                  {/* Guide Details */}
                  {ergResult.guide && (
                    <>
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            Isolation Distances
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                              <p className="text-xs text-blue-400 uppercase font-medium">Initial Isolation</p>
                              <p className="text-2xl font-bold text-white mt-1">{ergResult.guide.publicSafety.isolationDistance.meters}m</p>
                              <p className="text-sm text-slate-400">{ergResult.guide.publicSafety.isolationDistance.feet} feet</p>
                            </div>
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                              <p className="text-xs text-red-400 uppercase font-medium">Fire Isolation</p>
                              <p className="text-2xl font-bold text-white mt-1">{ergResult.guide.publicSafety.fireIsolationDistance.meters}m</p>
                              <p className="text-sm text-slate-400">{ergResult.guide.publicSafety.fireIsolationDistance.feet} feet</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* TIH Protective Distances */}
                      {ergResult.protectiveDistance && (
                        <Card className="bg-red-500/5 border-red-500/30">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              TIH Protective Action Distances (Table 1)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-slate-400 font-medium mb-2">SMALL SPILL</p>
                                <div className="space-y-1 text-sm">
                                  <p className="text-slate-300">Day: Isolate {ergResult.protectiveDistance.smallSpill.day.isolateMeters}m, Protect {ergResult.protectiveDistance.smallSpill.day.protectKm}km</p>
                                  <p className="text-slate-300">Night: Isolate {ergResult.protectiveDistance.smallSpill.night.isolateMeters}m, Protect {ergResult.protectiveDistance.smallSpill.night.protectKm}km</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-medium mb-2">LARGE SPILL</p>
                                <div className="space-y-1 text-sm">
                                  <p className="text-slate-300">Day: Isolate {ergResult.protectiveDistance.largeSpill.day.isolateMeters}m, Protect {ergResult.protectiveDistance.largeSpill.day.protectKm}km</p>
                                  <p className="text-slate-300">Night: Isolate {ergResult.protectiveDistance.largeSpill.night.isolateMeters}m, Protect {ergResult.protectiveDistance.largeSpill.night.protectKm}km</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Hazards */}
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Potential Hazards
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {ergResult.guide.potentialHazards.fireExplosion.map((h: string, i: number) => (
                            <div key={`f${i}`} className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                              <Flame className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-slate-300">{h}</span>
                            </div>
                          ))}
                          {ergResult.guide.potentialHazards.health.map((h: string, i: number) => (
                            <div key={`h${i}`} className="flex items-start gap-2 p-2 rounded bg-purple-500/10 border border-purple-500/20">
                              <Skull className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-slate-300">{h}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Emergency Response */}
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-green-400 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Emergency Response
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-xs text-orange-400 font-medium mb-2 flex items-center gap-1"><Flame className="w-3 h-3" /> FIRE</p>
                            <div className="space-y-1">
                              {ergResult.guide.emergencyResponse.fire.small.map((a: string, i: number) => (
                                <p key={i} className="text-sm text-slate-300 pl-4">Small: {a}</p>
                              ))}
                              {ergResult.guide.emergencyResponse.fire.large.map((a: string, i: number) => (
                                <p key={i} className="text-sm text-slate-300 pl-4">Large: {a}</p>
                              ))}
                              {ergResult.guide.emergencyResponse.fire.tank.map((a: string, i: number) => (
                                <p key={i} className="text-sm text-slate-300 pl-4">Tank: {a}</p>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-blue-400 font-medium mb-2 flex items-center gap-1"><Droplets className="w-3 h-3" /> SPILL/LEAK</p>
                            <div className="space-y-1">
                              {ergResult.guide.emergencyResponse.spillLeak.general.map((a: string, i: number) => (
                                <p key={i} className="text-sm text-slate-300 pl-4">- {a}</p>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-green-400 font-medium mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> FIRST AID</p>
                            <p className="text-sm text-slate-300 pl-4">{ergResult.guide.emergencyResponse.firstAid}</p>
                          </div>
                          <div>
                            <p className="text-xs text-cyan-400 font-medium mb-2 flex items-center gap-1"><Shield className="w-3 h-3" /> PPE</p>
                            <p className="text-sm text-slate-300 pl-4">{ergResult.guide.publicSafety.protectiveClothing}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              ) : ergResult && !ergResult.found ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                    <p className="text-white font-medium">Material Not Found</p>
                    <p className="text-sm text-slate-400 mt-1">Use Guide 111 for unidentified cargo. Call CHEMTREC: 1-800-424-9300</p>
                    <Button className="mt-4 bg-yellow-600 hover:bg-yellow-700" onClick={() => handleViewGuide("111")}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Guide 111 - Unidentified Cargo
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-12 text-center">
                    <Search className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-white font-medium">Search for a hazardous material</p>
                    <p className="text-sm text-slate-400 mt-1">Enter a UN number (e.g. 1203), guide number (e.g. 128), or material name (e.g. Gasoline)</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {["1203", "1267", "1053", "1017", "1978"].map(un => (
                        <Button key={un} variant="outline" size="sm" className="border-slate-600 text-slate-300" onClick={() => { setSearchTerm(un); ergLookupMutation.mutate({ unNumber: un }); }}>
                          UN{un}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Recent & Quick Access */}
            <div className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Common Petroleum Products</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-700/50">
                    {[
                      { un: "1267", name: "Crude Oil", guide: "128" },
                      { un: "1203", name: "Gasoline", guide: "128" },
                      { un: "1202", name: "Diesel", guide: "128" },
                      { un: "1223", name: "Kerosene/Jet Fuel", guide: "128" },
                      { un: "1978", name: "Propane", guide: "115" },
                      { un: "1075", name: "LPG", guide: "115" },
                      { un: "1053", name: "H2S", guide: "117" },
                      { un: "1170", name: "Ethanol", guide: "127" },
                      { un: "1230", name: "Methanol", guide: "131" },
                      { un: "3494", name: "Sour Crude", guide: "131" },
                    ].map(item => (
                      <div key={item.un} className="p-3 hover:bg-slate-700/30 cursor-pointer flex items-center justify-between"
                        onClick={() => { setSearchTerm(item.un); ergLookupMutation.mutate({ unNumber: item.un }); }}>
                        <div>
                          <span className="text-orange-400 font-mono text-xs">UN{item.un}</span>
                          <p className="text-sm text-white">{item.name}</p>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">G{item.guide}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Lookups */}
              {recentLookupsQuery.data && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white">Recent Lookups</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-700/50">
                      {(recentLookupsQuery.data as any[]).map((item: any, idx: number) => (
                        <div key={idx} className="p-3 hover:bg-slate-700/30 cursor-pointer"
                          onClick={() => { setSearchTerm(item.unNumber.replace("UN", "")); ergLookupMutation.mutate({ unNumber: item.unNumber.replace("UN", "") }); }}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white">{item.product}</span>
                            <span className="text-xs text-slate-400">{item.unNumber}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Guide Viewer Tab */}
        <TabsContent value="guide" className="mt-6">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {[111, 112, 115, 117, 120, 124, 125, 127, 128, 130, 131, 137, 140, 147, 153, 154, 158, 163, 171].map(num => (
                <Button key={num} variant={selectedGuideNumber === String(num) ? "default" : "outline"} size="sm"
                  className={selectedGuideNumber === String(num) ? "bg-blue-600" : "border-slate-600 text-slate-300"}
                  onClick={() => setSelectedGuideNumber(String(num))}>
                  {num}
                </Button>
              ))}
            </div>

            {guideQuery.isLoading ? (
              <Card className="bg-slate-800/50 border-slate-700"><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
            ) : guideQuery.data ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: (guideQuery.data as any).color || "#6B7280" }}>
                      {(guideQuery.data as any).guideNumber}
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">{(guideQuery.data as any).title}</CardTitle>
                      {(guideQuery.data as any).isolationDistance && (
                        <p className="text-sm text-slate-400 mt-1">
                          Isolate {(guideQuery.data as any).isolationDistance.meters}m ({(guideQuery.data as any).isolationDistance.feet} ft)
                          {(guideQuery.data as any).fireIsolationDistance && ` | Fire: ${(guideQuery.data as any).fireIsolationDistance.meters}m`}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(guideQuery.data as any).potentialHazards?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Potential Hazards
                      </h4>
                      <div className="space-y-2">
                        {(guideQuery.data as any).potentialHazards.map((h: any, i: number) => (
                          <div key={i} className={cn("flex items-start gap-2 p-2 rounded border", h.type === "fire" ? "bg-red-500/10 border-red-500/20" : "bg-purple-500/10 border-purple-500/20")}>
                            {h.type === "fire" ? <Flame className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" /> : <Skull className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />}
                            <span className="text-sm text-slate-300">{h.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(guideQuery.data as any).publicSafety?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Public Safety
                      </h4>
                      <div className="space-y-2">
                        {(guideQuery.data as any).publicSafety.map((s: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                            <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-300">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(guideQuery.data as any).emergencyResponse && (
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Emergency Response
                      </h4>
                      <div className="space-y-3">
                        {(guideQuery.data as any).emergencyResponse.fire?.length > 0 && (
                          <div>
                            <p className="text-xs text-orange-400 font-medium mb-1">Fire Response:</p>
                            {(guideQuery.data as any).emergencyResponse.fire.map((a: string, i: number) => (
                              <p key={i} className="text-sm text-slate-300 pl-4">- {a}</p>
                            ))}
                          </div>
                        )}
                        {(guideQuery.data as any).emergencyResponse.spill?.length > 0 && (
                          <div>
                            <p className="text-xs text-blue-400 font-medium mb-1">Spill Response:</p>
                            {(guideQuery.data as any).emergencyResponse.spill.map((a: string, i: number) => (
                              <p key={i} className="text-sm text-slate-300 pl-4">- {a}</p>
                            ))}
                          </div>
                        )}
                        {(guideQuery.data as any).emergencyResponse.firstAid?.length > 0 && (
                          <div>
                            <p className="text-xs text-green-400 font-medium mb-1">First Aid:</p>
                            {(guideQuery.data as any).emergencyResponse.firstAid.map((a: string, i: number) => (
                              <p key={i} className="text-sm text-slate-300 pl-4">{a}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">Select a guide number above to view response procedures</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Ask ESANG AI Tab */}
        <TabsContent value="ai" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <EsangIcon className="w-5 h-5 text-blue-400" />
                    Ask ESANG AI About Hazmat / ERG
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={aiQuestion}
                      onChange={(e: any) => setAiQuestion(e.target.value)}
                      placeholder="e.g. What are the emergency procedures for a crude oil spill?"
                      className="bg-slate-700/50 border-slate-600 text-white"
                      onKeyDown={(e: any) => e.key === "Enter" && handleAskAI()}
                    />
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={handleAskAI} disabled={aiChatMutation.isPending}>
                      {aiChatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </div>

                  {aiChatMutation.isPending && (
                    <div className="flex items-center gap-2 text-blue-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      ESANG AI is analyzing...
                    </div>
                  )}

                  {aiChatMutation.data && (
                    <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                      <div className="flex items-center gap-2 mb-2">
                        <EsangIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">ESANG AI Response</span>
                      </div>
                      <div className="text-sm text-slate-300 whitespace-pre-wrap">
                        {(aiChatMutation.data as any).message || (aiChatMutation.data as any).response}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {[
                      "What is the ERG guide for crude oil?",
                      "H2S emergency response procedures",
                      "Isolation distance for chlorine spill",
                      "Difference between Guide 127 and 128",
                      "TIH materials in petroleum transport",
                    ].map(q => (
                      <Button key={q} variant="outline" size="sm" className="border-slate-600 text-slate-400 text-xs"
                        onClick={() => { setAiQuestion(q); aiChatMutation.mutate({ message: q, context: { currentPage: "erg" } }); }}>
                        {q}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <EsangIcon className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-white">ESANG AI ERG Intelligence</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    ESANG AI has full access to the ERG 2024 database with 100+ materials, 35+ response guides, 
                    TIH protective distances, and integrates with SPECTRA-MATCH for product identification to 
                    emergency response linkage.
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Database className="w-3 h-3" /> ERG 2024</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Gemini AI</span>
                    <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> SPECTRA-MATCH</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Emergency Contacts Tab */}
        <TabsContent value="contacts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "CHEMTREC", phone: "1-800-424-9300", desc: "Chemical Transportation Emergency Center", country: "USA" },
              { name: "National Response Center", phone: "1-800-424-8802", desc: "Federal spill reporting (Coast Guard)", country: "USA" },
              { name: "Poison Control", phone: "1-800-222-1222", desc: "Human exposure emergencies", country: "USA" },
              { name: "CANUTEC", phone: "1-888-226-8832", desc: "Canadian Transport Emergency Centre", country: "Canada" },
              { name: "CANUTEC (cellular)", phone: "*666", desc: "Cell phone access to CANUTEC", country: "Canada" },
              { name: "CENACOM", phone: "800-00-413-00", desc: "Centro Nacional de Comunicaciones", country: "Mexico" },
              { name: "SETIQ", phone: "800-002-8800", desc: "Sistema de Emergencias en Transporte", country: "Mexico" },
              { name: "Military Shipments", phone: "703-697-0218", desc: "Incidents involving military materials", country: "USA" },
            ].map(contact => (
              <Card key={contact.name} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{contact.name}</h3>
                      <p className="text-2xl font-mono text-red-400 my-2">{contact.phone}</p>
                      <p className="text-sm text-slate-400">{contact.desc}</p>
                      <Badge className="mt-2 bg-green-500/20 text-green-400">{contact.country} - 24/7</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium">Important Notice</p>
              <p className="text-xs text-slate-400 mt-1">
                This information is based on the ERG 2024 published by DOT/PHMSA, Transport Canada, and SCT Mexico. 
                For reference only. Always consult the full guidebook and contact CHEMTREC (1-800-424-9300) or appropriate 
                authorities for actual emergencies. Response actions may vary based on specific materials and conditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
