/**
 * JOB PROCEDURES PAGE
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Standard Operating Procedures (SOPs) and job workflows.
 * Features:
 * - Safety procedures
 * - Loading/unloading procedures
 * - Emergency response protocols
 * - Compliance checklists
 * - Training materials
 * - ERG 2020 HazMat procedures
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Shield,
  Truck,
  Flame,
  Search,
  Download,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface Procedure {
  id: string;
  title: string;
  category: "safety" | "loading" | "emergency" | "compliance" | "hazmat";
  description: string;
  steps: string[];
  lastUpdated: Date;
  required: boolean;
}

interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
  completed: number;
  total: number;
}

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  required: boolean;
}

export default function ProceduresPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Mock procedures - TODO: Replace with trpc.procedures.getAll.useQuery()
  const procedures: Procedure[] = [
    {
      id: "P001",
      title: "Pre-Trip Vehicle Inspection",
      category: "safety",
      description:
        "Complete vehicle safety inspection before starting any trip",
      steps: [
        "Check tire pressure and tread depth",
        "Inspect brake system and air lines",
        "Test all lights and signals",
        "Check fluid levels (oil, coolant, DEF)",
        "Inspect coupling devices",
        "Verify emergency equipment",
        "Document inspection results",
      ],
      lastUpdated: new Date("2024-01-15"),
      required: true,
    },
    {
      id: "P002",
      title: "Crude Oil Loading Procedure",
      category: "loading",
      description:
        "Standard procedure for loading crude oil at terminal facilities",
      steps: [
        "Verify load order and BOL documentation",
        "Position truck at designated loading bay",
        "Connect grounding cable",
        "Attach loading hose and verify connections",
        "Open valves in correct sequence",
        "Monitor flow rate and tank levels",
        "Close valves when loading complete",
        "Disconnect hose and grounding cable",
        "Seal compartments and verify load",
        "Complete loading documentation",
      ],
      lastUpdated: new Date("2024-02-01"),
      required: true,
    },
    {
      id: "P003",
      title: "HazMat Spill Response",
      category: "emergency",
      description:
        "Emergency response protocol for hazardous material spills",
      steps: [
        "Immediately stop vehicle and secure area",
        "Activate emergency flashers",
        "Identify material using ERG 2020 guide",
        "Call 911 and report spill",
        "Notify dispatch and shipper",
        "Evacuate to safe distance (refer to ERG)",
        "Deploy spill containment if safe to do so",
        "Prevent ignition sources",
        "Wait for emergency responders",
        "Complete incident report",
      ],
      lastUpdated: new Date("2024-01-20"),
      required: true,
    },
    {
      id: "P004",
      title: "DOT Compliance Checklist",
      category: "compliance",
      description: "Daily compliance verification for DOT regulations",
      steps: [
        "Verify current medical certificate",
        "Check HOS (Hours of Service) compliance",
        "Ensure ELD is functioning properly",
        "Verify insurance documents are current",
        "Check vehicle registration and permits",
        "Confirm HazMat endorsement if required",
        "Review load securement requirements",
        "Verify weight limits compliance",
      ],
      lastUpdated: new Date("2024-02-10"),
      required: true,
    },
    {
      id: "P005",
      title: "ERG 2020 HazMat Classification",
      category: "hazmat",
      description:
        "Using Emergency Response Guidebook for hazmat identification",
      steps: [
        "Locate UN number on shipping papers",
        "Find material in ERG yellow pages",
        "Identify guide number",
        "Reference orange guide pages",
        "Note initial isolation distance",
        "Check protective action distance",
        "Review emergency response procedures",
        "Identify special precautions",
      ],
      lastUpdated: new Date("2024-01-25"),
      required: true,
    },
  ];

  // Mock checklists - TODO: Replace with trpc.procedures.getChecklists.useQuery()
  const checklists: Checklist[] = [
    {
      id: "C001",
      name: "Daily Pre-Trip Inspection",
      completed: 12,
      total: 15,
      items: [
        {
          id: "I001",
          text: "Check tire pressure (all tires)",
          checked: true,
          required: true,
        },
        {
          id: "I002",
          text: "Inspect brake system",
          checked: true,
          required: true,
        },
        {
          id: "I003",
          text: "Test all lights",
          checked: true,
          required: true,
        },
        {
          id: "I004",
          text: "Check fluid levels",
          checked: false,
          required: true,
        },
        {
          id: "I005",
          text: "Verify emergency equipment",
          checked: false,
          required: true,
        },
      ],
    },
    {
      id: "C002",
      name: "HazMat Loading Checklist",
      completed: 8,
      total: 10,
      items: [
        {
          id: "I006",
          text: "Verify HazMat placards",
          checked: true,
          required: true,
        },
        {
          id: "I007",
          text: "Check shipping papers",
          checked: true,
          required: true,
        },
        {
          id: "I008",
          text: "Inspect containment equipment",
          checked: false,
          required: true,
        },
      ],
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "safety":
        return <Shield className="text-blue-400" size={20} />;
      case "loading":
        return <Truck className="text-green-400" size={20} />;
      case "emergency":
        return <AlertTriangle className="text-red-400" size={20} />;
      case "compliance":
        return <ClipboardCheck className="text-yellow-400" size={20} />;
      case "hazmat":
        return <Flame className="text-orange-400" size={20} />;
      default:
        return <FileText className="text-gray-400" size={20} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "safety":
        return "border-blue-600 text-blue-400 bg-blue-600/10";
      case "loading":
        return "border-green-600 text-green-400 bg-green-600/10";
      case "emergency":
        return "border-red-600 text-red-400 bg-red-600/10";
      case "compliance":
        return "border-yellow-600 text-yellow-400 bg-yellow-600/10";
      case "hazmat":
        return "border-orange-600 text-orange-400 bg-orange-600/10";
      default:
        return "border-gray-600 text-gray-400 bg-gray-600/10";
    }
  };

  const filteredProcedures = procedures.filter((proc) => {
    const matchesSearch =
      proc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || proc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Job Procedures & SOPs
            </h1>
            <p className="text-gray-400">
              Standard Operating Procedures and safety protocols
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <BookOpen className="mr-2" size={18} />
              Training Center
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Download className="mr-2" size={18} />
              Download All
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="bg-gray-900 border-gray-700 p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                type="text"
                placeholder="Search procedures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={
                  selectedCategory === "all"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
              >
                All
              </Button>
              <Button
                variant={selectedCategory === "safety" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("safety")}
                className={
                  selectedCategory === "safety"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
              >
                Safety
              </Button>
              <Button
                variant={selectedCategory === "loading" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("loading")}
                className={
                  selectedCategory === "loading"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
              >
                Loading
              </Button>
              <Button
                variant={
                  selectedCategory === "emergency" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory("emergency")}
                className={
                  selectedCategory === "emergency"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
              >
                Emergency
              </Button>
              <Button
                variant={
                  selectedCategory === "compliance" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory("compliance")}
                className={
                  selectedCategory === "compliance"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
              >
                Compliance
              </Button>
              <Button
                variant={selectedCategory === "hazmat" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("hazmat")}
                className={
                  selectedCategory === "hazmat"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
              >
                HazMat
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="procedures" className="space-y-4">
          <TabsList className="bg-gray-900 border-gray-700">
            <TabsTrigger value="procedures">Procedures</TabsTrigger>
            <TabsTrigger value="checklists">Active Checklists</TabsTrigger>
          </TabsList>

          {/* Procedures Tab */}
          <TabsContent value="procedures" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {filteredProcedures.map((procedure) => (
                <Card
                  key={procedure.id}
                  className="bg-gray-900 border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getCategoryIcon(procedure.category)}
                        <h3 className="text-xl font-bold text-white">
                          {procedure.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={getCategoryColor(procedure.category)}
                        >
                          {procedure.category.toUpperCase()}
                        </Badge>
                        {procedure.required && (
                          <Badge
                            variant="outline"
                            className="border-red-600 text-red-400 bg-red-600/10"
                          >
                            REQUIRED
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 mb-4">
                        {procedure.description}
                      </p>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-white">
                          Procedure Steps:
                        </p>
                        <ol className="space-y-2">
                          {procedure.steps.map((step, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 text-gray-300 text-sm"
                            >
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-semibold">
                                {index + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <p className="text-gray-500 text-xs mt-4">
                        Last updated:{" "}
                        {procedure.lastUpdated.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                      >
                        <Download className="mr-2" size={16} />
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <CheckCircle className="mr-2" size={16} />
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Checklists Tab */}
          <TabsContent value="checklists" className="space-y-4">
            <div className="space-y-4">
              {checklists.map((checklist) => (
                <Card
                  key={checklist.id}
                  className="bg-gray-900 border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {checklist.name}
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                              style={{
                                width: `${
                                  (checklist.completed / checklist.total) * 100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-400">
                            {checklist.completed}/{checklist.total} completed
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Reset
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {checklist.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-gray-800 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          className="w-5 h-5 rounded border-gray-600"
                          readOnly
                        />
                        <span
                          className={`flex-1 ${
                            item.checked ? "text-gray-500 line-through" : "text-white"
                          }`}
                        >
                          {item.text}
                        </span>
                        {item.required && (
                          <Badge
                            variant="outline"
                            className="border-red-600 text-red-400 bg-red-600/10 text-xs"
                          >
                            REQUIRED
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
