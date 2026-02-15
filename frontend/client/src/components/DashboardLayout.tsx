import { useAuth } from "@/_core/hooks/useAuth";
import { useDisplayUser } from "@/hooks/useDisplayUser";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { getMenuForRole, getMenuForRoleWithApproval } from "@/config/menuConfig";
import { getApprovalStatus } from "@/lib/approvalGating";
import { ApprovalBanner, ApprovalGateInline } from "@/components/ApprovalGate";
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
  Moon,
  Monitor,
  Wind,
  Bell,
  Clock,
  ClipboardCheck,
  Calendar,
  Calculator,
  GraduationCap,
  Activity,
  Fuel,
  Award,
  Flame,
  Gift,
  Target,
  Navigation,
  Trophy,
  PenTool,
  Repeat,
  Scale,
  ChevronLeft,
  ChevronRight,
  Menu,
  Lock,
  X,
  Percent,
  Banknote,
  UserCheck,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { AmbientGlow, DominoPage } from "./animations";
import { trpc } from "@/lib/trpc";
import EsangFloatingButton from "./EsangFloatingButton";

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
  Bell: <Bell size={20} />,
  Clock: <Clock size={20} />,
  ClipboardCheck: <ClipboardCheck size={20} />,
  Calendar: <Calendar size={20} />,
  Calculator: <Calculator size={20} />,
  GraduationCap: <GraduationCap size={20} />,
  Activity: <Activity size={20} />,
  Fuel: <Fuel size={20} />,
  Award: <Award size={20} />,
  Flame: <Flame size={20} />,
  Gift: <Gift size={20} />,
  Target: <Target size={20} />,
  Navigation: <Navigation size={20} />,
  Trophy: <Trophy size={20} />,
  PenTool: <PenTool size={20} />,
  Repeat: <Repeat size={20} />,
  Scale: <Scale size={20} />,
  Banknote: <Banknote size={20} />,
  UserCheck: <UserCheck size={20} />,
};

// --- Notification Bell Component ---
function NotificationBell({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const summaryQuery = (trpc as any).notifications.getSummary.useQuery(undefined, { refetchInterval: 30000 });
  const listQuery = (trpc as any).notifications.list.useQuery({ limit: 5 }, { enabled: open });
  const markReadMutation = (trpc as any).notifications.markAsRead.useMutation({ onSuccess: () => { summaryQuery.refetch(); listQuery.refetch(); } });
  const markAllReadMutation = (trpc as any).notifications.markAllAsRead.useMutation({ onSuccess: () => { summaryQuery.refetch(); listQuery.refetch(); } });

  const unread = summaryQuery.data?.unread || 0;
  const items = listQuery.data?.notifications || [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-2 hover:bg-gray-800/50 rounded-xl transition-colors"
        >
          <Bell size={18} className="text-gray-400" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto rounded-2xl border-0 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-purple-500/20 shadow-xl p-1.5">
        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
          {unread > 0 && (
            <button onClick={() => markAllReadMutation.mutate({})} className="text-[10px] font-semibold bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent hover:opacity-80">
              Mark all read
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500">No notifications yet</div>
        ) : (
          items.map((n: any) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${!n.isRead ? "bg-gradient-to-r from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
              onClick={() => { if (!n.isRead) markReadMutation.mutate({ id: n.id }); }}
            >
              <div className="flex items-center gap-2 w-full">
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#BE01FF] to-[#1473FF] flex-shrink-0" />}
                <span className="text-sm text-slate-900 dark:text-white font-medium truncate flex-1">{n.title}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">{n.timeAgo || ""}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-full">{n.message}</p>
            </DropdownMenuItem>
          ))
        )}
        <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => { setOpen(false); onNavigate("/notifications"); }} className="text-xs font-semibold bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent hover:opacity-80 w-full text-center">
            View all notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
  const { theme, mode, setMode, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const prevLocation = useRef(location);

  // Debounce search query (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // tRPC global search query
  const searchResults = (trpc as any).search?.global?.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2, staleTime: 10000, retry: false }
  );
  const results: { id: string; type: string; title: string; subtitle: string; match: number }[] = searchResults?.data?.results || [];
  const isSearching = searchResults?.isLoading && debouncedQuery.length >= 2;

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, [location]);

  // Navigate to search result
  const navigateToResult = useCallback((result: { id: string; type: string; title: string }) => {
    setSearchOpen(false);
    setSearchQuery("");
    searchInputRef.current?.blur();
    switch (result.type) {
      case "load": navigate(`/loads/${result.id}`); break;
      case "driver": navigate(`/catalysts`); break;
      case "catalyst": navigate(`/catalysts`); break;
      case "invoice": navigate(`/documents`); break;
      case "document": navigate(`/documents`); break;
      case "user": navigate(`/profile`); break;
      default: navigate(`/`);
    }
  }, [navigate]);

  // Keyboard navigation for search results
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setSearchOpen(false); searchInputRef.current?.blur(); return; }
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && selectedIdx >= 0 && results[selectedIdx]) { e.preventDefault(); navigateToResult(results[selectedIdx]); }
  }, [results, selectedIdx, navigateToResult]);

  // Reset selection when results change
  useEffect(() => { setSelectedIdx(-1); }, [results]);

  // ⌘K keyboard shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Centralized display user — real DB profile name, not stale auth fallback
  const { displayName, displayInitials, displayRole, displayAvatar } = useDisplayUser();

  // Track route changes for page transition key
  useEffect(() => {
    prevLocation.current = location;
  }, [location]);

  // Get menu items based on user role (with approval gating flags)
  const userRole = user?.role || "default";
  const approvalStatus = getApprovalStatus(user);
  const isApproved = approvalStatus === "approved";
  const staticMenuItems = getMenuForRoleWithApproval(userRole);

  // Fetch dynamic badge counts from DB (polls every 30s)
  const badgeQuery = (trpc as any).sidebar?.getBadgeCounts?.useQuery?.(undefined, {
    refetchInterval: 30000,
    retry: false,
    staleTime: 15000,
  });
  const badgeCounts: Record<string, number> = badgeQuery?.data || {};

  // Merge dynamic badge counts into menu items
  const menuItems = staticMenuItems.map((item) => ({
    ...item,
    badge: badgeCounts[item.path] || 0,
  }));

  // Determine active menu item based on current location
  const activeMenuItem = menuItems.find((item) => item.path === location);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  // FORT KNOX AUTH GUARD: Redirect unauthenticated users to login
  if (!user) {
    window.location.href = "/login";
    return <DashboardLayoutSkeleton />;
  }

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close sidebar on mobile when navigating
  const handleMobileNavigate = (path: string) => {
    if (window.innerWidth < 768) setSidebarOpen(false);
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <AmbientGlow />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 72 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`bg-gray-900/80 backdrop-blur-xl border-r border-gray-800/50 flex flex-col overflow-hidden relative z-30 flex-shrink-0 ${
          sidebarOpen ? "fixed inset-y-0 left-0 md:relative" : "hidden md:flex"
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800/50 flex items-center gap-3">
          <motion.img
            src="/eusotrip-logo.png"
            alt="EusoTrip"
            className="w-10 h-10 object-contain flex-shrink-0"
            whileHover={{ scale: 1.08, rotate: 3 }}
            transition={{ duration: 0.2 }}
          />
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent whitespace-nowrap"
              >
                EusoTrip
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto smooth-scroll p-3 space-y-1">
          {menuItems.map((item, index) => {
            const isActive = activeMenuItem?.path === item.path;
            const isLocked = !isApproved && item.requiresApproval;
            return (
              <motion.button
                key={item.path}
                onClick={() => {
                  if (isLocked) {
                    // Navigate to a gated page — ApprovalGate will show the overlay
                    handleMobileNavigate(item.path);
                  } else {
                    handleMobileNavigate(item.path);
                  }
                }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.3 }}
                whileHover={{ x: isLocked ? 0 : 4 }}
                whileTap={{ scale: isLocked ? 1 : 0.97 }}
                className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg relative ${
                  isLocked
                    ? "text-gray-600 cursor-default"
                    : isActive
                    ? "active text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <motion.div
                  className="flex-shrink-0 relative"
                  animate={isActive && !isLocked ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {iconMap[item.icon] || item.icon}
                  {isLocked && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-800 flex items-center justify-center">
                      <Lock className="w-2 h-2 text-gray-500" />
                    </div>
                  )}
                </motion.div>
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 flex-1 overflow-hidden"
                    >
                      <span className={`flex-1 text-left text-sm whitespace-nowrap ${isLocked ? "text-gray-600" : ""}`}>{item.label}</span>
                      {isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                      ) : item.badge ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center"
                        >
                          {item.badge}
                        </motion.span>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active indicator glow */}
                {isActive && !isLocked && (
                  <motion.div
                    layoutId="sidebar-active-glow"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600/10 to-purple-600/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Sidebar Toggle */}
        <div className="p-2 border-t border-gray-800/50">
          <motion.button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <ChevronLeft size={18} />
            </motion.div>
          </motion.button>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-gray-800/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors"
              >
                <motion.div whileHover={{ scale: 1.08 }} transition={{ duration: 0.2 }}>
                  <Avatar className="w-9 h-9">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-sm">
                        {displayInitials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </motion.div>
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 text-left text-sm overflow-hidden"
                    >
                      <p className="font-semibold truncate text-gray-200">{displayName}</p>
                      <p className="text-gray-500 text-xs truncate">{displayRole}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
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
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Navigation */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`backdrop-blur-xl px-3 sm:px-6 py-3 flex items-center justify-between relative z-20 ${theme === "light" ? "bg-white/80 border-b border-slate-200/80" : "bg-gray-900/60 border-b border-gray-800/50"}`}
        >
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-1.5 rounded-lg ${theme === "light" ? "text-slate-500 hover:text-slate-800 hover:bg-slate-100" : "text-gray-400 hover:text-white hover:bg-gray-800/50"}`}
            >
              <Menu size={20} />
            </motion.button>

            {/* Breadcrumb / Active page */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMenuItem?.label || "Dashboard"}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="hidden md:flex items-center gap-2"
              >
                <span className={`text-sm font-medium ${theme === "light" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" : "text-white"}`}>
                  {activeMenuItem?.label || "Dashboard"}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center flex-1 justify-end gap-6">
            {/* Global Search Bar — left group */}
            <div className="relative hidden md:block flex-shrink-0" ref={searchDropdownRef}>
              <motion.div
                animate={{
                  width: searchFocused ? 240 : 170,
                  backgroundColor: theme === "light"
                    ? (searchFocused ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.02)")
                    : (searchFocused ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"),
                }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center rounded-xl px-3 py-2 gap-2 border border-transparent overflow-hidden"
                style={{
                  borderColor: theme === "light"
                    ? (searchFocused ? "rgba(20, 115, 255, 0.3)" : "rgba(0,0,0,0.08)")
                    : (searchFocused ? "rgba(20, 115, 255, 0.3)" : "rgba(255,255,255,0.06)"),
                }}
              >
                <Search size={16} className={`flex-shrink-0 transition-colors duration-200 ${searchFocused ? "text-blue-400" : theme === "light" ? "text-slate-400" : "text-gray-500"}`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => { setSearchFocused(true); if (searchQuery.length >= 2) setSearchOpen(true); }}
                  onBlur={() => setSearchFocused(false)}
                  onKeyDown={handleSearchKeyDown}
                  className={`bg-transparent text-sm outline-none flex-1 min-w-0 truncate ${theme === "light" ? "text-slate-800 placeholder-slate-400" : "text-white placeholder-gray-500"}`}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchOpen(false); }} className="text-gray-500 hover:text-white p-0.5">
                    <X size={14} />
                  </button>
                )}
                {!searchFocused && (
                  <kbd className={`hidden lg:inline-flex text-[10px] rounded px-1.5 py-0.5 font-mono ${theme === "light" ? "text-slate-400 border border-slate-300 bg-slate-50" : "text-gray-500 border border-gray-700"}`}>⌘K</kbd>
                )}
              </motion.div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {searchOpen && searchQuery.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-700/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                  >
                    <div className="h-0.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
                    <div className="p-2 max-h-[360px] overflow-y-auto">
                      {isSearching ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          Searching...
                        </div>
                      ) : results.length === 0 ? (
                        <div className="py-6 text-center">
                          <Search size={24} className="mx-auto text-gray-600 mb-2" />
                          <p className="text-gray-400 text-sm">No results for "{searchQuery}"</p>
                          <p className="text-gray-600 text-xs mt-1">Try loads, cities, catalysts, or driver names</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider px-2 py-1">
                            {results.length} result{results.length !== 1 ? "s" : ""}
                          </p>
                          {results.map((r, i) => (
                            <button
                              key={`${r.type}-${r.id}`}
                              onMouseDown={(e) => { e.preventDefault(); navigateToResult(r); }}
                              onMouseEnter={() => setSelectedIdx(i)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                i === selectedIdx
                                  ? "bg-gradient-to-r from-[#1473FF]/15 to-[#BE01FF]/15 border border-[#1473FF]/20"
                                  : "hover:bg-white/5 border border-transparent"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                r.type === "load" ? "bg-blue-500/15 text-blue-400" :
                                r.type === "driver" ? "bg-cyan-500/15 text-cyan-400" :
                                r.type === "catalyst" ? "bg-purple-500/15 text-purple-400" :
                                "bg-gray-500/15 text-gray-400"
                              }`}>
                                {r.type === "load" ? <Package size={16} /> :
                                 r.type === "driver" ? <User size={16} /> :
                                 r.type === "catalyst" ? <Truck size={16} /> :
                                 <FileText size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{r.title}</p>
                                <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                r.type === "load" ? "bg-blue-500/10 text-blue-400" :
                                r.type === "driver" ? "bg-cyan-500/10 text-cyan-400" :
                                r.type === "catalyst" ? "bg-purple-500/10 text-purple-400" :
                                "bg-gray-500/10 text-gray-400"
                              }`}>
                                {r.type.toUpperCase()}
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Spacer between search and action icons */}
            <div className={`hidden md:block w-px h-5 ${theme === "light" ? "bg-slate-200" : "bg-gray-700/50"}`} />

            {/* Right action icons group */}
            <div className="flex items-center gap-3">

            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`relative p-2 rounded-xl transition-colors flex-shrink-0 ${theme === "light" ? "hover:bg-slate-100" : "hover:bg-gray-800/50"}`}
                  title={`Theme: ${mode}`}
                >
                  {theme === "dark" ? (
                    <Moon size={18} className="text-gray-400" />
                  ) : (
                    <Sun size={18} className="text-amber-500" />
                  )}
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setMode("light")}>
                  <Sun className="w-4 h-4 mr-2" />
                  Light
                  {mode === "light" && <span className="ml-auto text-xs text-blue-400">Active</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode("dark")}>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark
                  {mode === "dark" && <span className="ml-auto text-xs text-blue-400">Active</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode("system")}>
                  <Monitor className="w-4 h-4 mr-2" />
                  System
                  {mode === "system" && <span className="ml-auto text-xs text-blue-400">Active</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification Bell with Dropdown */}
            <NotificationBell onNavigate={handleNavigate} />

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1 hover:bg-gray-800/50 rounded-xl transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm font-bold">
                        {displayInitials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </motion.button>
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
            </div>{/* end right action icons group */}
          </div>
        </motion.header>

        {/* Main Content Area — Domino Cascade Page Transition */}
        <main className="flex-1 overflow-y-auto smooth-scroll bg-gray-950/50">
          {/* Approval status banner for pending/suspended users */}
          <ApprovalBanner />

          <AnimatePresence mode="wait">
            <DominoPage key={location} className="p-3 sm:p-4 md:p-6">
              {!isApproved && menuItems.find(m => m.path === location)?.requiresApproval ? (
                <ApprovalGateInline />
              ) : (
                children
              )}
            </DominoPage>
          </AnimatePresence>

          {/* ESANG AI Floating Button — all dashboard screens */}
          <EsangFloatingButton />

          {/* Security Compliance Footer */}
          <footer className="border-t border-gray-800/50 bg-gray-900/40 backdrop-blur-sm px-4 py-4 mt-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20">
                  <Lock className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-green-400">TLS 1.3</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                  <Shield className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-blue-400">AES-256</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-purple-400">RBAC</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                  <CheckCircle className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-cyan-400">SOC 2</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                  <CreditCard className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-amber-400">PCI-DSS</span>
                </div>
              </div>
              <p className="text-center text-[10px] sm:text-xs text-gray-500">
                Eusorone Technologies Inc. All rights reserved. Secured with enterprise-grade encryption.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
