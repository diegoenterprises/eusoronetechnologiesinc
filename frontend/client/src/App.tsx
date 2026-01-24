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
import ErgPage from "./pages/Erg";
import TestLogin from "./pages/TestLogin";
import Register from "./pages/Register";
import RegisterShipper from "./pages/RegisterShipper";
import RegisterCarrier from "./pages/RegisterCarrier";
import RegisterDriver from "./pages/RegisterDriver";
import LoadBids from "./pages/LoadBids";
import RegisterEscort from "./pages/RegisterEscort";
import RegisterBroker from "./pages/RegisterBroker";
import RegisterCatalyst from "./pages/RegisterCatalyst";
import RegisterTerminal from "./pages/RegisterTerminal";
import RegisterCompliance from "./pages/RegisterCompliance";
import RegisterSafety from "./pages/RegisterSafety";
import DispatchDashboard from "./pages/DispatchDashboard";
import LoadBoard from "./pages/LoadBoard";
import SafetyDashboard from "./pages/SafetyDashboard";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import TerminalDashboard from "./pages/TerminalDashboard";
import BrokerDashboard from "./pages/BrokerDashboard";
import EscortDashboard from "./pages/EscortDashboard";
import FleetManagement from "./pages/FleetManagement";
import ShipperLoads from "./pages/ShipperLoads";
import Billing from "./pages/Billing";
import LoadTracking from "./pages/LoadTracking";
import IncidentReport from "./pages/IncidentReport";
import AuditLog from "./pages/AuditLog";
import IndustryDirectory from "./pages/IndustryDirectory";
import LiveNewsFeed from "./pages/LiveNewsFeed";
import ESANGChat from "./pages/ESANGChat";
import DriverDashboard from "./pages/DriverDashboard";
import LoadCreationWizard from "./pages/LoadCreationWizard";
import BidManagement from "./pages/BidManagement";
import CarrierBidSubmission from "./pages/CarrierBidSubmission";
import PreTripInspection from "./pages/PreTripInspection";
import DVIR from "./pages/DVIR";
import DispatchBoard from "./pages/DispatchBoard";
import CarrierVetting from "./pages/CarrierVetting";
import EscortJobMarketplace from "./pages/EscortJobMarketplace";
import TerminalScheduling from "./pages/TerminalScheduling";
import DQFileManagement from "./pages/DQFileManagement";
import CSAScoresDashboard from "./pages/CSAScoresDashboard";
import UserVerification from "./pages/UserVerification";
import HOSTracker from "./pages/HOSTracker";
import NotificationsCenter from "./pages/NotificationsCenter";
import DocumentCenter from "./pages/DocumentCenter";
import AuditLogs from "./pages/AuditLogs";
import RateCalculator from "./pages/RateCalculator";
import DriverEarnings from "./pages/DriverEarnings";
import TrainingManagement from "./pages/TrainingManagement";
import FuelManagement from "./pages/FuelManagement";
import DriverScorecard from "./pages/DriverScorecard";
import Rewards from "./pages/Rewards";
import ClearinghouseDashboard from "./pages/ClearinghouseDashboard";
import TerminalSCADA from "./pages/TerminalSCADA";
import Leaderboard from "./pages/Leaderboard";
import DriverOnboarding from "./pages/DriverOnboarding";
import AccidentReport from "./pages/AccidentReport";
import CarrierVettingDetails from "./pages/CarrierVettingDetails";
import MessagingCenter from "./pages/MessagingCenter";
import LoadDetails from "./pages/LoadDetails";

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
      <Route path={"/login"} component={TestLogin} />
      <Route path={"/register"} component={Register} />
      <Route path={"/register/shipper"} component={RegisterShipper} />
      <Route path={"/register/carrier"} component={RegisterCarrier} />
      <Route path={"/register/driver"} component={RegisterDriver} />
      <Route path={"/loads/:loadId/bids"} component={LoadBids} />
      <Route path={"/register/escort"} component={RegisterEscort} />
      <Route path={"/register/broker"} component={RegisterBroker} />
      <Route path={"/register/catalyst"} component={RegisterCatalyst} />
      <Route path={"/register/terminal"} component={RegisterTerminal} />
      <Route path={"/register/compliance"} component={RegisterCompliance} />
      <Route path={"/register/safety"} component={RegisterSafety} />
      <Route path={"/dispatch"} component={() => (
        <DashboardLayout>
          <DispatchDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/load-board"} component={() => (
        <DashboardLayout>
          <LoadBoard />
        </DashboardLayout>
      )} />
      <Route path={"/safety"} component={() => (
        <DashboardLayout>
          <SafetyDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/compliance"} component={() => (
        <DashboardLayout>
          <ComplianceDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/terminal"} component={() => (
        <DashboardLayout>
          <TerminalDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/broker"} component={() => (
        <DashboardLayout>
          <BrokerDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/escort"} component={() => (
        <DashboardLayout>
          <EscortDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/fleet"} component={() => (
        <DashboardLayout>
          <FleetManagement />
        </DashboardLayout>
      )} />
      <Route path={"/my-loads"} component={() => (
        <DashboardLayout>
          <ShipperLoads />
        </DashboardLayout>
      )} />
      <Route path={"/billing"} component={() => (
        <DashboardLayout>
          <Billing />
        </DashboardLayout>
      )} />
      <Route path={"/tracking"} component={() => (
        <DashboardLayout>
          <LoadTracking />
        </DashboardLayout>
      )} />
      <Route path={"/incidents"} component={() => (
        <DashboardLayout>
          <IncidentReport />
        </DashboardLayout>
      )} />
      <Route path={"/audit-log"} component={() => (
        <DashboardLayout>
          <AuditLog />
        </DashboardLayout>
      )} />
      <Route path={"/directory"} component={() => (
        <DashboardLayout>
          <IndustryDirectory />
        </DashboardLayout>
      )} />
      <Route path={"/live-news"} component={() => (
        <DashboardLayout>
          <LiveNewsFeed />
        </DashboardLayout>
      )} />
      <Route path={"/esang"} component={() => (
        <DashboardLayout>
          <ESANGChat />
        </DashboardLayout>
      )} />
      <Route path={"/driver"} component={() => (
        <DashboardLayout>
          <DriverDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/loads/create"} component={() => (
        <DashboardLayout>
          <LoadCreationWizard />
        </DashboardLayout>
      )} />
      <Route path={"/bids"} component={() => (
        <DashboardLayout>
          <BidManagement />
        </DashboardLayout>
      )} />
      <Route path={"/bids/submit/:loadId"} component={() => (
        <DashboardLayout>
          <CarrierBidSubmission />
        </DashboardLayout>
      )} />
      <Route path={"/inspection/pre-trip"} component={() => (
        <DashboardLayout>
          <PreTripInspection />
        </DashboardLayout>
      )} />
      <Route path={"/inspection/dvir"} component={() => (
        <DashboardLayout>
          <DVIR />
        </DashboardLayout>
      )} />
      <Route path={"/dispatch"} component={() => (
        <DashboardLayout>
          <DispatchBoard />
        </DashboardLayout>
      )} />
      <Route path={"/carrier-vetting"} component={() => (
        <DashboardLayout>
          <CarrierVetting />
        </DashboardLayout>
      )} />
      <Route path={"/escort-jobs"} component={() => (
        <DashboardLayout>
          <EscortJobMarketplace />
        </DashboardLayout>
      )} />
      <Route path={"/terminal"} component={() => (
        <DashboardLayout>
          <TerminalScheduling />
        </DashboardLayout>
      )} />
      <Route path={"/compliance/dq-files"} component={() => (
        <DashboardLayout>
          <DQFileManagement />
        </DashboardLayout>
      )} />
      <Route path={"/safety/csa-scores"} component={() => (
        <DashboardLayout>
          <CSAScoresDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/admin/verification"} component={() => (
        <DashboardLayout>
          <UserVerification />
        </DashboardLayout>
      )} />
      <Route path={"/driver/hos"} component={() => (
        <DashboardLayout>
          <HOSTracker />
        </DashboardLayout>
      )} />
      <Route path={"/notifications"} component={() => (
        <DashboardLayout>
          <NotificationsCenter />
        </DashboardLayout>
      )} />
      <Route path={"/documents"} component={() => (
        <DashboardLayout>
          <DocumentCenter />
        </DashboardLayout>
      )} />
      <Route path={"/admin/audit-logs"} component={() => (
        <DashboardLayout>
          <AuditLogs />
        </DashboardLayout>
      )} />
      <Route path={"/tools/rate-calculator"} component={() => (
        <DashboardLayout>
          <RateCalculator />
        </DashboardLayout>
      )} />
      <Route path={"/earnings"} component={() => (
        <DashboardLayout>
          <DriverEarnings />
        </DashboardLayout>
      )} />
      <Route path={"/training"} component={() => (
        <DashboardLayout>
          <TrainingManagement />
        </DashboardLayout>
      )} />
      <Route path={"/fuel"} component={() => (
        <DashboardLayout>
          <FuelManagement />
        </DashboardLayout>
      )} />
      <Route path={"/driver-scorecard"} component={() => (
        <DashboardLayout>
          <DriverScorecard />
        </DashboardLayout>
      )} />
      <Route path={"/driver-scorecard/:driverId"} component={() => (
        <DashboardLayout>
          <DriverScorecard />
        </DashboardLayout>
      )} />
      <Route path={"/rewards"} component={() => (
        <DashboardLayout>
          <Rewards />
        </DashboardLayout>
      )} />
      <Route path={"/clearinghouse"} component={() => (
        <DashboardLayout>
          <ClearinghouseDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/compliance/clearinghouse"} component={() => (
        <DashboardLayout>
          <ClearinghouseDashboard />
        </DashboardLayout>
      )} />
      <Route path={"/terminal/scada"} component={() => (
        <DashboardLayout>
          <TerminalSCADA />
        </DashboardLayout>
      )} />
      <Route path={"/scada"} component={() => (
        <DashboardLayout>
          <TerminalSCADA />
        </DashboardLayout>
      )} />
      <Route path={"/leaderboard"} component={() => (
        <DashboardLayout>
          <Leaderboard />
        </DashboardLayout>
      )} />
      <Route path={"/onboarding"} component={() => (
        <DashboardLayout>
          <DriverOnboarding />
        </DashboardLayout>
      )} />
      <Route path={"/driver/onboarding"} component={() => (
        <DashboardLayout>
          <DriverOnboarding />
        </DashboardLayout>
      )} />
      <Route path={"/accident-report"} component={() => (
        <DashboardLayout>
          <AccidentReport />
        </DashboardLayout>
      )} />
      <Route path={"/safety/incident"} component={() => (
        <DashboardLayout>
          <AccidentReport />
        </DashboardLayout>
      )} />
      <Route path={"/carrier/:carrierId"} component={() => (
        <DashboardLayout>
          <CarrierVettingDetails />
        </DashboardLayout>
      )} />
      <Route path={"/broker/carrier-vetting"} component={() => (
        <DashboardLayout>
          <CarrierVettingDetails />
        </DashboardLayout>
      )} />
      <Route path={"/messaging"} component={() => (
        <DashboardLayout>
          <MessagingCenter />
        </DashboardLayout>
      )} />
      <Route path={"/chat"} component={() => (
        <DashboardLayout>
          <MessagingCenter />
        </DashboardLayout>
      )} />
      <Route path={"/load/:loadId"} component={() => (
        <DashboardLayout>
          <LoadDetails />
        </DashboardLayout>
      )} />
      <Route path={"/loads/:loadId/details"} component={() => (
        <DashboardLayout>
          <LoadDetails />
        </DashboardLayout>
      )} />
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

      <Route path={"/erg"} component={() => (
        <DashboardLayout>
          <ErgPage />
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
