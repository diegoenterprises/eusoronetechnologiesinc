/**
 * PROFILE PAGE
 * Comprehensive role-specific profile with database integration
 * Shows different data based on user role (Driver, Shipper, Broker, Carrier, etc.)
 */

import { useAuth } from "@/_core/hooks/useAuth";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Truck,
  Package,
  Building2,
  Upload,
  Check,
  AlertCircle,
  Shield,
  Award,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Clock,
  Star,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function ProfilePage() {
  const { user } = useAuth();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get role-specific stats from database
  const { data: stats } = trpc.loads.getStats.useQuery(undefined, {
    enabled: !!user,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB for high quality)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Role-specific profile sections
  const getRoleSpecificSections = () => {
    const role = user?.role || "USER";

    switch (role) {
      case "DRIVER":
      case "CATALYST":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Driver Certifications */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Certifications & Licenses</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">CDL Class A</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Valid
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">HazMat Endorsement</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Valid
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tanker Endorsement</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Valid
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medical Certificate</span>
                  <span className="text-xs text-yellow-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Expires in 45 days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">TWIC Card</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Valid
                  </span>
                </div>
              </div>
            </Card>

            {/* Driver Stats */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Performance Stats</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Completed Trips</span>
                    <span className="text-sm font-semibold">2,847</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{ width: "95%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">On-Time Delivery</span>
                    <span className="text-sm font-semibold">98.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{ width: "98.5%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Safety Rating</span>
                    <span className="text-sm font-semibold flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      4.9/5.0
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{ width: "98%" }}></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Vehicle Assignment */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Current Vehicle</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><strong>Unit:</strong> Truck #4523</p>
                <p className="text-sm"><strong>Type:</strong> 2022 Freightliner Cascadia</p>
                <p className="text-sm"><strong>VIN:</strong> 1FUJGLDR6NLBXXXXX</p>
                <p className="text-sm"><strong>Status:</strong> <span className="text-green-500">Active</span></p>
                <p className="text-sm"><strong>Next Maintenance:</strong> 1,200 miles</p>
              </div>
            </Card>

            {/* Earnings */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">Earnings</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">This Month</span>
                  <span className="text-lg font-bold text-green-500">$12,450</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Last Month</span>
                  <span className="text-sm">$11,890</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Year to Date</span>
                  <span className="text-sm">$98,340</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Lifetime</span>
                  <span className="text-sm">$456,780</span>
                </div>
              </div>
            </Card>
          </div>
        );

      case "SHIPPER":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Info */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Company Information</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><strong>Company:</strong> ABC Logistics Inc</p>
                <p className="text-sm"><strong>DOT Number:</strong> DOT-9876543</p>
                <p className="text-sm"><strong>MC Number:</strong> MC-654321</p>
                <p className="text-sm"><strong>Industry:</strong> Oil & Gas Transportation</p>
                <p className="text-sm"><strong>Member Since:</strong> January 2020</p>
              </div>
            </Card>

            {/* Shipment Stats */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Shipment Statistics</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Active Shipments</span>
                  <span className="text-lg font-bold">{stats?.activeLoads || 12}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Shipments</span>
                  <span className="text-sm">{stats?.totalLoads || 1234}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">On-Time Delivery</span>
                  <span className="text-sm text-green-500">98.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Spent</span>
                  <span className="text-sm">${(stats?.totalRevenue || 0).toLocaleString()}</span>
                </div>
              </div>
            </Card>

            {/* Payment Methods */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">Payment Methods</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Visa •••• 4242</span>
                  </div>
                  <span className="text-xs text-green-500">Default</span>
                </div>
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </div>
            </Card>

            {/* Compliance */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Compliance Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Insurance Policy</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Valid
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">W-9 Form</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> On File
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shipper Agreement</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Signed
                  </span>
                </div>
              </div>
            </Card>
          </div>
        );

      case "BROKER":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Broker License */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Broker License</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><strong>MC Authority:</strong> MC-111111</p>
                <p className="text-sm"><strong>DOT Number:</strong> DOT-1234567</p>
                <p className="text-sm"><strong>License Status:</strong> <span className="text-green-500">Active</span></p>
                <p className="text-sm"><strong>Bond Amount:</strong> $75,000</p>
                <p className="text-sm"><strong>Renewal Date:</strong> Dec 31, 2025</p>
              </div>
            </Card>

            {/* Broker Stats */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Brokerage Statistics</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Active Loads</span>
                  <span className="text-lg font-bold">45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Loads Brokered</span>
                  <span className="text-sm">5,678</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="text-sm text-green-500">99.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Commission Earned (YTD)</span>
                  <span className="text-sm text-green-500">$234,560</span>
                </div>
              </div>
            </Card>

            {/* Carrier Network */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Carrier Network</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Approved Carriers</span>
                  <span className="text-lg font-bold">287</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Preferred Carriers</span>
                  <span className="text-sm">45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average Rating</span>
                  <span className="text-sm flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    4.7/5.0
                  </span>
                </div>
              </div>
            </Card>

            {/* Commission Structure */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">Commission Structure</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><strong>Standard Rate:</strong> 15%</p>
                <p className="text-sm"><strong>Volume Discount:</strong> 12% (100+ loads/month)</p>
                <p className="text-sm"><strong>Payment Terms:</strong> Net 30</p>
                <p className="text-sm"><strong>This Month:</strong> <span className="text-green-500">$18,450</span></p>
              </div>
            </Card>
          </div>
        );

      case "CARRIER":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fleet Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Fleet Information</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><strong>Total Vehicles:</strong> 45</p>
                <p className="text-sm"><strong>Active Vehicles:</strong> 38</p>
                <p className="text-sm"><strong>In Maintenance:</strong> 5</p>
                <p className="text-sm"><strong>Out of Service:</strong> 2</p>
                <p className="text-sm"><strong>Average Age:</strong> 3.2 years</p>
              </div>
            </Card>

            {/* Driver Roster */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Driver Roster</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><strong>Total Drivers:</strong> 52</p>
                <p className="text-sm"><strong>Active Drivers:</strong> 45</p>
                <p className="text-sm"><strong>On Leave:</strong> 4</p>
                <p className="text-sm"><strong>In Training:</strong> 3</p>
                <p className="text-sm"><strong>Average Experience:</strong> 7.5 years</p>
              </div>
            </Card>

            {/* Insurance & Compliance */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Insurance & Compliance</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Liability Insurance</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> $1M Coverage
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cargo Insurance</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> $100K Coverage
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">DOT Compliance</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Compliant
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Safety Rating</span>
                  <span className="text-xs text-green-500">Satisfactory</span>
                </div>
              </div>
            </Card>

            {/* Revenue */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">Revenue</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">This Month</span>
                  <span className="text-lg font-bold text-green-500">$287,450</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Last Month</span>
                  <span className="text-sm">$265,890</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Year to Date</span>
                  <span className="text-sm">$2,456,780</span>
                </div>
              </div>
            </Card>
          </div>
        );

      case "ADMIN":
      case "SUPER_ADMIN":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Access */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">System Access</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><strong>Role:</strong> {user?.role}</p>
                <p className="text-sm"><strong>Permissions:</strong> Full Access</p>
                <p className="text-sm"><strong>Last Login:</strong> Today at 9:30 AM</p>
                <p className="text-sm"><strong>2FA Status:</strong> <span className="text-green-500">Enabled</span></p>
              </div>
            </Card>

            {/* Platform Stats */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Platform Statistics</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Users</span>
                  <span className="text-lg font-bold">12,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Loads</span>
                  <span className="text-sm">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Revenue</span>
                  <span className="text-sm text-green-500">$4.5M</span>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return (
          <Card className="p-6">
            <p className="text-sm text-gray-500">No role-specific data available. Please contact support to set up your profile.</p>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-gray-500">Manage your account and preferences</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          {/* Avatar with Upload */}
          <div className="relative">
            <Avatar className="h-24 w-24">
              {uploadedImage ? (
                <img src={uploadedImage} alt="Profile" className="object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-lg cursor-pointer hover:bg-gray-50">
              <Upload className="h-4 w-4 text-gray-600" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <span className="text-white text-xs">{uploadProgress}%</span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user?.name || "User"}</h2>
            <p className="text-gray-500 mb-4">{user?.role || "USER"}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{user?.email || "user@example.com"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{user?.phone || "+1 (555) 123-4567"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>Houston, TX</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Member since Jan 2020</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Role-Specific Sections */}
      {getRoleSpecificSections()}
    </div>
  );
}

