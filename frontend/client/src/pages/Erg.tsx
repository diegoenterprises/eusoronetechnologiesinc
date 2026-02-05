/**
 * ERG (EMERGENCY RESPONSE GUIDEBOOK) PAGE
 * Hazmat emergency response information based on ERG 2024
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, Search, Phone, Flame, Droplets, Wind,
  Shield, Skull, Radiation, ChevronRight, ExternalLink,
  BookOpen, FileText, Sparkles, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HazardClass {
  id: string;
  class: string;
  division?: string;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  guideNumber: string;
  hazards: string[];
  actions: string[];
}

interface EmergencyContact {
  name: string;
  phone: string;
  description: string;
  available: string;
}

const HAZARD_CLASSES: HazardClass[] = [
  {
    id: "c1", class: "1", name: "Explosives",
    description: "Substances capable of rapid chemical reaction producing gas and heat",
    color: "bg-orange-500", icon: <AlertTriangle className="w-5 h-5" />,
    guideNumber: "112", 
    hazards: ["Mass explosion hazard", "Projection hazard", "Fire hazard"],
    actions: ["Evacuate area immediately", "Do not fight fire if it reaches cargo", "Call for specialized response"]
  },
  {
    id: "c2", class: "2", division: "1", name: "Flammable Gas",
    description: "Gases which ignite on contact with ignition source",
    color: "bg-red-500", icon: <Flame className="w-5 h-5" />,
    guideNumber: "115",
    hazards: ["Extremely flammable", "May form explosive mixtures with air", "Vapors may travel to ignition source"],
    actions: ["Eliminate ignition sources", "Use water spray to cool containers", "Evacuate if tank is exposed to fire"]
  },
  {
    id: "c3", class: "3", name: "Flammable Liquids",
    description: "Liquids with flash point below 100°F (37.8°C)",
    color: "bg-red-600", icon: <Droplets className="w-5 h-5" />,
    guideNumber: "128",
    hazards: ["Highly flammable", "Vapors heavier than air", "May accumulate in low areas"],
    actions: ["Eliminate ignition sources", "Use foam or dry chemical", "Prevent runoff into waterways"]
  },
  {
    id: "c4", class: "4", name: "Flammable Solids",
    description: "Solids that are readily combustible or may cause fire through friction",
    color: "bg-red-400", icon: <Flame className="w-5 h-5" />,
    guideNumber: "134",
    hazards: ["May ignite from friction or heat", "May burn rapidly", "Some react with water"],
    actions: ["Do not use water on reactive materials", "Use dry sand or special powder", "Avoid breathing dust"]
  },
  {
    id: "c5", class: "5", name: "Oxidizers",
    description: "Substances that yield oxygen and can intensify fire",
    color: "bg-yellow-500", icon: <Wind className="w-5 h-5" />,
    guideNumber: "143",
    hazards: ["Increases fire intensity", "May cause spontaneous combustion", "Contact with fuels may cause fire"],
    actions: ["Keep away from combustibles", "Use flooding amounts of water", "Do not use dry chemicals"]
  },
  {
    id: "c6", class: "6", name: "Toxic Substances",
    description: "Substances that pose health hazards through inhalation, ingestion, or skin contact",
    color: "bg-purple-500", icon: <Skull className="w-5 h-5" />,
    guideNumber: "153",
    hazards: ["Toxic by inhalation", "May be fatal if swallowed", "Contact causes burns"],
    actions: ["Wear full protective equipment", "Evacuate and isolate area", "Call poison control"]
  },
  {
    id: "c7", class: "7", name: "Radioactive Materials",
    description: "Materials that emit ionizing radiation",
    color: "bg-yellow-400", icon: <Radiation className="w-5 h-5" />,
    guideNumber: "163",
    hazards: ["Radiation exposure hazard", "Contamination risk", "Long-term health effects"],
    actions: ["Limit exposure time", "Maintain maximum distance", "Use shielding when possible"]
  },
  {
    id: "c8", class: "8", name: "Corrosives",
    description: "Substances that cause destruction of living tissue or materials",
    color: "bg-slate-600", icon: <Droplets className="w-5 h-5" />,
    guideNumber: "154",
    hazards: ["Causes severe burns", "Reacts with metals", "Vapors may be corrosive"],
    actions: ["Wear full protective gear", "Flush with large amounts of water", "Neutralize only if trained"]
  },
];

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: "CHEMTREC", phone: "1-800-424-9300", description: "Chemical Transportation Emergency Center", available: "24/7" },
  { name: "National Response Center", phone: "1-800-424-8802", description: "Federal reporting for oil & hazmat spills", available: "24/7" },
  { name: "Poison Control", phone: "1-800-222-1222", description: "Human exposure emergencies", available: "24/7" },
  { name: "INFOTRAC", phone: "1-800-535-5053", description: "Emergency response information", available: "24/7" },
];

export default function Erg() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<HazardClass | null>(null);
  const [activeTab, setActiveTab] = useState("classes");

  const filteredClasses = HAZARD_CLASSES.filter(hc =>
    hc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hc.class.includes(searchTerm) ||
    hc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Emergency Response Guide</h1>
          <p className="text-slate-400">ERG 2024 - Hazmat emergency response information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600">
            <BookOpen className="w-4 h-4 mr-2" />
            Full ERG PDF
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Ask ESANG AI
          </Button>
        </div>
      </div>

      {/* Emergency Contacts Banner */}
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Emergency Hotlines:</span>
            </div>
            {EMERGENCY_CONTACTS.slice(0, 2).map((contact: any) => (
              <div key={contact.name} className="flex items-center gap-2">
                <span className="text-white font-bold">{contact.name}:</span>
                <span className="text-red-400 font-mono">{contact.phone}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search by class, UN number, or material name..."
          className="pl-9 bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="classes">Hazard Classes</TabsTrigger>
          <TabsTrigger value="contacts">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="guides">Quick Guides</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Class List */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">DOT Hazard Classes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-700/50">
                    {filteredClasses.map((hc: any) => (
                      <div
                        key={hc.id}
                        onClick={() => setSelectedClass(hc)}
                        className={cn(
                          "p-4 cursor-pointer transition-colors",
                          selectedClass?.id === hc.id ? "bg-blue-500/20" : "hover:bg-slate-700/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded flex items-center justify-center text-white", hc.color)}>
                            {hc.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">Class {hc.class}</span>
                              {hc.division && <span className="text-slate-400">.{hc.division}</span>}
                            </div>
                            <p className="text-xs text-slate-400">{hc.name}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Class Details */}
            <div className="lg:col-span-2">
              {selectedClass ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className={cn("text-white", selectedClass.color)}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-slate-800/20 flex items-center justify-center">
                        {selectedClass.icon}
                      </div>
                      <div>
                        <CardTitle className="text-2xl">
                          Class {selectedClass.class}{selectedClass.division && `.${selectedClass.division}`}: {selectedClass.name}
                        </CardTitle>
                        <p className="text-white/80 mt-1">{selectedClass.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400">
                        <FileText className="w-3 h-3 mr-1" />
                        Guide {selectedClass.guideNumber}
                      </Badge>
                    </div>

                    {/* Hazards */}
                    <div>
                      <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Potential Hazards
                      </h4>
                      <div className="space-y-2">
                        {selectedClass.hazards.map((hazard: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-300">{hazard}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Emergency Actions */}
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Emergency Response Actions
                      </h4>
                      <div className="space-y-2">
                        {selectedClass.actions.map((action: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-300">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Full Guide {selectedClass.guideNumber}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-slate-800/50 border-slate-700 h-full">
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">Select a hazard class to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EMERGENCY_CONTACTS.map((contact: any) => (
              <Card key={contact.name} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{contact.name}</h3>
                      <p className="text-2xl font-mono text-red-400 my-2">{contact.phone}</p>
                      <p className="text-sm text-slate-400">{contact.description}</p>
                      <Badge className="mt-2 bg-green-500/20 text-green-400">{contact.available}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="guides" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-slate-400">Quick reference guides for common scenarios</p>
              <p className="text-sm text-slate-500 mt-1">Spill response, fire fighting, evacuation distances</p>
            </CardContent>
          </Card>
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
                This information is for reference only. Always consult the full ERG 2024 guidebook and contact 
                CHEMTREC or appropriate authorities for actual emergencies. Response actions may vary based on 
                specific materials and conditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
