import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ShipmentPage from "./pages/Shipment";
import JobsPage from "./pages/Jobs";
import MessagesPage from "./pages/Messages";
import ChannelsPage from "./pages/Channels";
import ProfilePage from "./pages/Profile";
import CompanyPage from "./pages/Company";
import FacilityPage from "./pages/Facility";
import ProceduresPage from "./pages/Procedures";
import DiagnosticsPage from "./pages/Diagnostics";
import WalletPage from "./pages/Wallet";
import SettingsPage from "./pages/Settings";
import NewsFeedPage from "./pages/NewsFeed";
import SupportPage from "./pages/Support";
import CommissionPage from "./pages/Commission";
import ShippersPage from "./pages/Shippers";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import CompanyChannels from "./pages/CompanyChannels";
import Analytics from "./pages/Analytics";
import DocumentsPage from "./pages/Documents";
import DashboardLayout from "./components/DashboardLayout";
import ZeunBreakdownReport from "./pages/ZeunBreakdownReport";
import ZeunMaintenanceTracker from "./pages/ZeunMaintenanceTracker";
import ZeunProviderNetwork from "./pages/ZeunProviderNetwork";
import MyLoadsPage from "./pages/MyLoads";
import LoadCreatePage from "./pages/LoadCreate";
import FindLoadsPage from "./pages/FindLoads";
import ActiveLoadsPage from "./pages/ActiveLoads";
import TrackShipmentsPage from "./pages/TrackShipments";
import CarriersPage from "./pages/Carriers";
import PaymentsPage from "./pages/Payments";
import AssignedLoadsPage from "./pages/AssignedLoads";
import InTransitPage from "./pages/InTransit";
import CarrierAnalyticsPage from "./pages/CarrierAnalytics";
import FleetPage from "./pages/Fleet";
import DriversPage from "./pages/Drivers";
import EarningsPage from "./pages/Earnings";

function Router() {
  // All routes are protected by DashboardLayout which checks authentication
  return (
    <Switch>
      <Route path={"/"} component={() => (
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      )} />
      <Route path={"/home"} component={Home} />
      <Route path={"/shipments"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/jobs"} component={() => (
        <DashboardLayout>
          <JobsPage />
        </DashboardLayout>
      )} />
      <Route path={"/messages"} component={() => (
        <DashboardLayout>
          <MessagesPage />
        </DashboardLayout>
      )} />
      <Route path={"/channels"} component={() => (
        <DashboardLayout>
          <ChannelsPage />
        </DashboardLayout>
      )} />
      <Route path={"/profile"} component={() => (
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      )} />
      <Route path={"/company"} component={() => (
        <DashboardLayout>
          <CompanyPage />
        </DashboardLayout>
      )} />
      <Route path={"/facility"} component={() => (
        <DashboardLayout>
          <FacilityPage />
        </DashboardLayout>
      )} />
      <Route path={"/procedures"} component={() => (
        <DashboardLayout>
          <ProceduresPage />
        </DashboardLayout>
      )} />
      <Route path={"/diagnostics"} component={() => (
        <DashboardLayout>
          <DiagnosticsPage />
        </DashboardLayout>
      )} />
      <Route path={"/wallet"} component={() => (
        <DashboardLayout>
          <WalletPage />
        </DashboardLayout>
      )} />
      <Route path={"/settings"} component={() => (
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      )} />
      <Route path={"/news"} component={() => (
        <DashboardLayout>
          <NewsFeedPage />
        </DashboardLayout>
      )} />
      <Route path={"/support"} component={() => (
        <DashboardLayout>
          <SupportPage />
        </DashboardLayout>
      )} />
      <Route path={"/support"} component={() => (
        <DashboardLayout>
          <SupportPage />
        </DashboardLayout>
      )} />
      
      {/* Role-specific dashboard routes */}
      <Route path={"/admin"} component={() => (
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      )} />
      <Route path={"/super-admin"} component={() => (
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      )} />
      
      {/* Shipper-specific routes */}
      <Route path={"/loads"} component={() => (
        <DashboardLayout>
          <MyLoadsPage />
        </DashboardLayout>
      )} />
      <Route path={"/loads/create"} component={() => (
        <DashboardLayout>
          <LoadCreatePage />
        </DashboardLayout>
      )} />
      <Route path={"/loads/active"} component={() => (
        <DashboardLayout>
          <ActiveLoadsPage />
        </DashboardLayout>
      )} />
      <Route path={"/tracking"} component={() => (
        <DashboardLayout>
          <TrackShipmentsPage />
        </DashboardLayout>
      )} />
      <Route path={"/carriers"} component={() => (
        <DashboardLayout>
          <CarriersPage />
        </DashboardLayout>
      )} />
      <Route path={"/payments"} component={() => (
        <DashboardLayout>
          <PaymentsPage />
        </DashboardLayout>
      )} />
            {/* Broker-specific routes */}
      <Route path={"/commission"} component={() => (
        <DashboardLayout>
          <CommissionPage />
        </DashboardLayout>
      )} />
      <Route path={"/shippers"} component={() => (
        <DashboardLayout>
          <ShippersPage />
        </DashboardLayout>
      )} />
      
      {/* Carrier-specific routes */}
      <Route path={"/marketplace"} component={() => (
        <DashboardLayout>
          <FindLoadsPage />
        </DashboardLayout>
      )} />
      <Route path={"/loads/assigned"} component={() => (
        <DashboardLayout>
          <AssignedLoadsPage />
        </DashboardLayout>
      )} />
      <Route path={"/loads/transit"} component={() => (
        <DashboardLayout>
          <InTransitPage />
        </DashboardLayout>
      )} />
      <Route path={"/carrier/analytics"} component={() => (
        <DashboardLayout>
          <CarrierAnalyticsPage />
        </DashboardLayout>
      )} />
      <Route path={"/fleet"} component={() => (
        <DashboardLayout>
          <FleetPage />
        </DashboardLayout>
      )} />
      <Route path={"/drivers"} component={() => (
        <DashboardLayout>
          <DriversPage />
        </DashboardLayout>
      )} />
      <Route path={"/earnings"} component={() => (
        <DashboardLayout>
          <EarningsPage />
        </DashboardLayout>
      )} />
      
      {/* Driver-specific routes */}
      <Route path={"/jobs/current"} component={() => (
        <DashboardLayout>
          <JobsPage />
        </DashboardLayout>
      )} />
      <Route path={"/navigation"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/vehicle"} component={() => (
        <DashboardLayout>
          <DiagnosticsPage />
        </DashboardLayout>
      )} />
      <Route path={"/documents"} component={() => (
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      )} />
      
      {/* Catalyst-specific routes */}
      <Route path={"/specializations"} component={() => (
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      )} />
      <Route path={"/matched-loads"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/opportunities"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/performance"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/ai-assistant"} component={() => (
        <DashboardLayout>
          <MessagesPage />
        </DashboardLayout>
      )} />
      
      {/* Escort-specific routes */}
      <Route path={"/convoys"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/team"} component={() => (
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      )} />
      <Route path={"/incidents"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/reports"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      
      {/* Terminal Manager-specific routes */}
      <Route path={"/incoming"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/outgoing"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/staff"} component={() => (
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      )} />
      <Route path={"/operations"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/compliance"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      
      {/* Admin-specific routes */}
      <Route path={"/admin/users"} component={() => (
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/companies"} component={() => (
        <DashboardLayout>
          <CompanyPage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/loads"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/payments"} component={() => (
        <DashboardLayout>
          <WalletPage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/disputes"} component={() => (
        <DashboardLayout>
          <MessagesPage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/documents"} component={() => (
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/analytics"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/settings"} component={() => (
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      )} />
      
      {/* Super Admin-specific routes */}
      <Route path={"/super-admin/users"} component={() => (
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      )} />
      <Route path={"/super-admin/companies"} component={() => (
        <DashboardLayout>
          <CompanyPage />
        </DashboardLayout>
      )} />
      <Route path={"/super-admin/loads"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/super-admin/config"} component={() => (
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      )} />
      <Route path={"/super-admin/database"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/super-admin/security"} component={() => (
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      )} />
      <Route path={"/super-admin/logs"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/super-admin/monitoring"} component={() => (
        <DashboardLayout>
          <ShipmentPage />
        </DashboardLayout>
      )} />
      <Route path={"/super-admin/settings"} component={() => (
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      )} />
      
      {/* Company Channels route */}
      <Route path={"/company-channels"} component={() => (
        <DashboardLayout>
          <CompanyChannels />
        </DashboardLayout>
      )} />
      
      {/* Analytics routes */}
      <Route path={"/analytics"} component={() => (
        <DashboardLayout>
          <Analytics />
        </DashboardLayout>
      )} />
      <Route path={"/admin/analytics"} component={() => (
        <DashboardLayout>
          <Analytics />
        </DashboardLayout>
      )} />
      
      {/* Documents routes */}
      <Route path={"/documents"} component={() => (
        <DashboardLayout>
          <DocumentsPage />
        </DashboardLayout>
      )} />
      <Route path={"/admin/documents"} component={() => (
        <DashboardLayout>
          <DocumentsPage />
        </DashboardLayout>
      )} />
      
      {/* ZEUN Mechanics™ Routes */}
      <Route path={"/zeun/breakdown"} component={() => (
        <DashboardLayout>
          <ZeunBreakdownReport />
        </DashboardLayout>
      )} />
      <Route path={"/zeun/maintenance"} component={() => (
        <DashboardLayout>
          <ZeunMaintenanceTracker />
        </DashboardLayout>
      )} />
      <Route path={"/zeun/providers"} component={() => (
        <DashboardLayout>
          <ZeunProviderNetwork />
        </DashboardLayout>
      )} />
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
