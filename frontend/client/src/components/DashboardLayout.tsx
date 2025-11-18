import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { getMenuForRole } from "@/config/menuConfig";
import {
  LayoutDashboard,
  LogOut,
  Package,
  Briefcase,
  MessageSquare,
  Users,
  User,
  Building2,
  MapPin,
  Wrench,
  Truck,
  Wallet,
  Settings,
  Newspaper,
  HelpCircle,
  Search,
  Plus,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Database,
  DollarSign,
  FileText,
  Shield,
  TrendingUp,
  Zap,
  CreditCard,
  Construction,
  Droplet,
  Heart,
  Maximize2,
  Snowflake,
  ShieldCheck,
  Cloud,
  CloudRain,
  Sun,
  Wind,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { RoleSwitcher } from "./RoleSwitcher";

// Icon map for rendering icons from string names
const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={20} />,
  Package: <Package size={20} />,
  Briefcase: <Briefcase size={20} />,
  MessageSquare: <MessageSquare size={20} />,
  Users: <Users size={20} />,
  Building2: <Building2 size={20} />,
  MapPin: <MapPin size={20} />,
  Wrench: <Wrench size={20} />,
  Truck: <Truck size={20} />,
  Wallet: <Wallet size={20} />,
  Settings: <Settings size={20} />,
  Newspaper: <Newspaper size={20} />,
  HelpCircle: <HelpCircle size={20} />,
  User: <User size={20} />,
  AlertCircle: <AlertCircle size={20} />,
  AlertTriangle: <AlertTriangle size={20} />,
  BarChart3: <BarChart3 size={20} />,
  Brain: <Brain size={20} />,
  CheckCircle: <CheckCircle size={20} />,
  Database: <Database size={20} />,
  DollarSign: <DollarSign size={20} />,
  FileText: <FileText size={20} />,
  Plus: <Plus size={20} />,
  Search: <Search size={20} />,
  Shield: <Shield size={20} />,
  TrendingUp: <TrendingUp size={20} />,
  Zap: <Zap size={20} />,
  CreditCard: <CreditCard size={20} />,
  Construction: <Construction size={20} />,
  Droplet: <Droplet size={20} />,
  Heart: <Heart size={20} />,
  Maximize2: <Maximize2 size={20} />,
  Snowflake: <Snowflake size={20} />,
  ShieldCheck: <ShieldCheck size={20} />,
  Cloud: <Cloud size={20} />,
  CloudRain: <CloudRain size={20} />,
  Sun: <Sun size={20} />,
  Wind: <Wind size={20} />,
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export default function DashboardLayout({
  children,
  activeSection = "dashboard",
  onSectionChange,
}: DashboardLayoutProps) {
  const { user, loading, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get menu items based on user role
  const userRole = user?.role || "default";
  console.log("[DashboardLayout] user:", user);
  console.log("[DashboardLayout] userRole:", userRole);
  const menuItems = getMenuForRole(userRole);
  console.log("[DashboardLayout] menuItems count:", menuItems.length);

  // Determine active menu item based on current location
  const activeMenuItem = menuItems.find((item) => item.path === location);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-center">
          <img src="/eusotrip-logo.png" alt="EusoTrip" className="w-12 h-12" />
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = activeMenuItem?.path === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <div className="flex-shrink-0">{iconMap[item.icon] || item.icon}</div>
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-600 text-white font-bold">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex-1 text-left text-sm">
                    <p className="font-semibold truncate">{user?.name || "User"}</p>
                    <p className="text-gray-500 text-xs truncate">{user?.email || "user@example.com"}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleNavigate("/profile")}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate("/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              {sidebarOpen ? "←" : "→"}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => handleNavigate("/shipments")}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Plus size={18} />
              Create Shipment
            </Button>

            <Button
              onClick={() => handleNavigate("/jobs")}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              My Jobs
            </Button>

            <div className="hidden md:flex items-center bg-gray-800 rounded-lg px-4 py-2 gap-2">
              <Search size={18} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search shipments, contacts..."
                className="bg-transparent text-sm outline-none w-48 text-white placeholder-gray-500"
              />
            </div>

            <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></div>
            </button>

            {/* Role Switcher for Testing */}
            <RoleSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleNavigate("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
