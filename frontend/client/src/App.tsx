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
import Login from "./pages/Login";
// TestLogin removed from production - SOC II: no dev backdoors in prod
import Register from "./pages/Register";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
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
import ELDLogs from "./pages/ELDLogs";
import InvoiceDetails from "./pages/InvoiceDetails";
import EscortJobs from "./pages/EscortJobs";
import BidDetails from "./pages/BidDetails";
import ContractSigning from "./pages/ContractSigning";
import ShipperAgreementWizard from "./pages/ShipperAgreementWizard";
import AgreementsLibrary from "./pages/AgreementsLibrary";
import RecurringLoadScheduler from "./pages/RecurringLoadScheduler";
import BrokerContractWizard from "./pages/BrokerContractWizard";
import FleetOverview from "./pages/FleetOverview";
import ComplianceCalendar from "./pages/ComplianceCalendar";
import DriverPerformance from "./pages/DriverPerformance";
import SettlementDetails from "./pages/SettlementDetails";
import AppointmentScheduler from "./pages/AppointmentScheduler";
import NotificationCenter from "./pages/NotificationCenter";
import UserManagement from "./pages/UserManagement";
import CompanyProfile from "./pages/CompanyProfile";
import ActiveConvoys from "./pages/ActiveConvoys";
import EscortReports from "./pages/EscortReports";
import EscortIncidents from "./pages/EscortIncidents";
import Specializations from "./pages/Specializations";
import MatchedLoads from "./pages/MatchedLoads";
import Opportunities from "./pages/Opportunities";
import CatalystPerformance from "./pages/CatalystPerformance";
import IncomingShipments from "./pages/IncomingShipments";
import OutgoingShipments from "./pages/OutgoingShipments";
import TerminalStaff from "./pages/TerminalStaff";
import TerminalOperations from "./pages/TerminalOperations";
import Violations from "./pages/Violations";
import Audits from "./pages/Audits";
import SafetyMetrics from "./pages/SafetyMetrics";
import SafetyIncidents from "./pages/SafetyIncidents";
import BrokerMarketplace from "./pages/BrokerMarketplace";
import BrokerCarriers from "./pages/BrokerCarriers";
import BrokerAnalytics from "./pages/BrokerAnalytics";
import LoadingBays from "./pages/LoadingBays";
import TerminalInventory from "./pages/TerminalInventory";
import BOLGeneration from "./pages/BOLGeneration";
import DriverCurrentJob from "./pages/DriverCurrentJob";
import DriverVehicle from "./pages/DriverVehicle";
import CatalystFleetMap from "./pages/CatalystFleetMap";
import CatalystExceptions from "./pages/CatalystExceptions";
import EscortPermits from "./pages/EscortPermits";
import EscortSchedule from "./pages/EscortSchedule";
import SpectraMatch from "./pages/SpectraMatch";
import EusoTicket from "./pages/EusoTicket";
import AdminRSSFeeds from "./pages/AdminRSSFeeds";
import AdminPlatformFees from "./pages/AdminPlatformFees";
import Missions from "./pages/Missions";
import DriverTracking from "./pages/DriverTracking";
import FleetTracking from "./pages/FleetTracking";
import AdminTelemetry from "./pages/AdminTelemetry";
import ZeunBreakdown from "./pages/ZeunBreakdown";
import ZeunFleetDashboard from "./pages/ZeunFleetDashboard";
import ZeunAdminDashboard from "./pages/ZeunAdminDashboard";
import HotZones from "./pages/HotZones";
import MarketPricing from "./pages/MarketPricing";
import CarrierCompliance from "./pages/CarrierCompliance";
import FuelPrices from "./pages/FuelPrices";
import WeatherAlerts from "./pages/WeatherAlerts";

function Router() {
  // CLEAN ROUTING - NO DUPLICATES
  // All routes mapped to menuConfig paths for each user role
  return (
    <Switch>
      {/* ============================================ */}
      {/* PUBLIC ROUTES (No Auth Required) */}
      {/* ============================================ */}
      <Route path={"/home"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/register/shipper"} component={RegisterShipper} />
      <Route path={"/register/carrier"} component={RegisterCarrier} />
      <Route path={"/register/driver"} component={RegisterDriver} />
      <Route path={"/register/escort"} component={RegisterEscort} />
      <Route path={"/register/broker"} component={RegisterBroker} />
      <Route path={"/register/catalyst"} component={RegisterCatalyst} />
      <Route path={"/register/terminal"} component={RegisterTerminal} />
      <Route path={"/register/compliance"} component={RegisterCompliance} />
      <Route path={"/register/safety"} component={RegisterSafety} />
      <Route path={"/terms-of-service"} component={TermsOfService} />
      <Route path={"/privacy-policy"} component={PrivacyPolicy} />

      {/* ============================================ */}
      {/* SHARED ROUTES (All Authenticated Users) */}
      {/* ============================================ */}
      <Route path={"/"} component={() => (<DashboardLayout><Dashboard /></DashboardLayout>)} />
      <Route path={"/profile"} component={() => (<DashboardLayout><ProfilePage /></DashboardLayout>)} />
      <Route path={"/settings"} component={() => (<DashboardLayout><SettingsPage /></DashboardLayout>)} />
      <Route path={"/messages"} component={() => (<DashboardLayout><MessagesPage /></DashboardLayout>)} />
      <Route path={"/wallet"} component={() => (<DashboardLayout><WalletPage /></DashboardLayout>)} />
      <Route path={"/news"} component={() => (<DashboardLayout><NewsFeedPage /></DashboardLayout>)} />
      <Route path={"/support"} component={() => (<DashboardLayout><SupportPage /></DashboardLayout>)} />
      <Route path={"/company-channels"} component={() => (<DashboardLayout><CompanyChannels /></DashboardLayout>)} />
      <Route path={"/notifications"} component={() => (<DashboardLayout><NotificationsCenter /></DashboardLayout>)} />
      <Route path={"/esang"} component={() => (<DashboardLayout><ESANGChat /></DashboardLayout>)} />
      <Route path={"/ai-assistant"} component={() => (<DashboardLayout><ESANGChat /></DashboardLayout>)} />
      <Route path={"/erg"} component={() => (<DashboardLayout><ErgPage /></DashboardLayout>)} />
      <Route path={"/missions"} component={() => (<DashboardLayout><Missions /></DashboardLayout>)} />
      <Route path={"/live-tracking"} component={() => (<DashboardLayout><DriverTracking /></DashboardLayout>)} />
      <Route path={"/fleet-tracking"} component={() => (<DashboardLayout><FleetTracking /></DashboardLayout>)} />
      <Route path={"/admin/telemetry"} component={() => (<DashboardLayout><AdminTelemetry /></DashboardLayout>)} />
      <Route path={"/zeun-breakdown"} component={() => (<DashboardLayout><ZeunBreakdown /></DashboardLayout>)} />
      <Route path={"/zeun-fleet"} component={() => (<DashboardLayout><ZeunFleetDashboard /></DashboardLayout>)} />
      <Route path={"/admin/zeun"} component={() => (<DashboardLayout><ZeunAdminDashboard /></DashboardLayout>)} />
      <Route path={"/hot-zones"} component={() => (<DashboardLayout><HotZones /></DashboardLayout>)} />
      <Route path={"/market-pricing"} component={() => (<DashboardLayout><MarketPricing /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* SHIPPER ROUTES */}
      {/* ============================================ */}
      <Route path={"/loads"} component={() => (<DashboardLayout><MyLoadsPage /></DashboardLayout>)} />
      <Route path={"/loads/create"} component={() => (<DashboardLayout><LoadCreationWizard /></DashboardLayout>)} />
      <Route path={"/loads/active"} component={() => (<DashboardLayout><ActiveLoadsPage /></DashboardLayout>)} />
      <Route path={"/tracking"} component={() => (<DashboardLayout><LoadTracking /></DashboardLayout>)} />
      <Route path={"/carriers"} component={() => (<DashboardLayout><CarriersPage /></DashboardLayout>)} />
      <Route path={"/payments"} component={() => (<DashboardLayout><PaymentsPage /></DashboardLayout>)} />
      <Route path={"/company"} component={() => (<DashboardLayout><CompanyProfile /></DashboardLayout>)} />
      <Route path={"/agreements"} component={() => (<DashboardLayout><AgreementsLibrary /></DashboardLayout>)} />
      <Route path={"/agreements/create"} component={() => (<DashboardLayout><ShipperAgreementWizard /></DashboardLayout>)} />
      <Route path={"/agreements/broker"} component={() => (<DashboardLayout><BrokerContractWizard /></DashboardLayout>)} />
      <Route path={"/loads/recurring"} component={() => (<DashboardLayout><RecurringLoadScheduler /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* CARRIER ROUTES */}
      {/* ============================================ */}
      <Route path={"/marketplace"} component={() => (<DashboardLayout><FindLoadsPage /></DashboardLayout>)} />
      <Route path={"/bids"} component={() => (<DashboardLayout><BidManagement /></DashboardLayout>)} />
      <Route path={"/bids/submit/:loadId"} component={() => (<DashboardLayout><CarrierBidSubmission /></DashboardLayout>)} />
      <Route path={"/bids/:bidId"} component={() => (<DashboardLayout><BidDetails /></DashboardLayout>)} />
      <Route path={"/contract/sign/:loadId"} component={() => (<DashboardLayout><ContractSigning /></DashboardLayout>)} />
      <Route path={"/loads/transit"} component={() => (<DashboardLayout><InTransitPage /></DashboardLayout>)} />
      <Route path={"/loads/:loadId/bids"} component={() => (<DashboardLayout><LoadBids /></DashboardLayout>)} />
      <Route path={"/load/:loadId"} component={() => (<DashboardLayout><LoadDetails /></DashboardLayout>)} />
      <Route path={"/fleet"} component={() => (<DashboardLayout><FleetManagement /></DashboardLayout>)} />
      <Route path={"/drivers"} component={() => (<DashboardLayout><DriversPage /></DashboardLayout>)} />
      <Route path={"/earnings"} component={() => (<DashboardLayout><EarningsPage /></DashboardLayout>)} />
      <Route path={"/analytics"} component={() => (<DashboardLayout><Analytics /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* BROKER ROUTES */}
      {/* ============================================ */}
      <Route path={"/shippers"} component={() => (<DashboardLayout><ShippersPage /></DashboardLayout>)} />
      <Route path={"/commission"} component={() => (<DashboardLayout><CommissionPage /></DashboardLayout>)} />
      <Route path={"/carrier-vetting"} component={() => (<DashboardLayout><CarrierVetting /></DashboardLayout>)} />
      <Route path={"/carrier/:carrierId"} component={() => (<DashboardLayout><CarrierVettingDetails /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* DRIVER ROUTES */}
      {/* ============================================ */}
      <Route path={"/jobs"} component={() => (<DashboardLayout><JobsPage /></DashboardLayout>)} />
      <Route path={"/jobs/current"} component={() => (<DashboardLayout><DriverCurrentJob /></DashboardLayout>)} />
      <Route path={"/navigation"} component={() => (<DashboardLayout><LoadTracking /></DashboardLayout>)} />
      <Route path={"/vehicle"} component={() => (<DashboardLayout><DriverVehicle /></DashboardLayout>)} />
      <Route path={"/diagnostics"} component={() => (<DashboardLayout><DiagnosticsPage /></DashboardLayout>)} />
      <Route path={"/documents"} component={() => (<DashboardLayout><DocumentCenter /></DashboardLayout>)} />
      <Route path={"/driver/hos"} component={() => (<DashboardLayout><HOSTracker /></DashboardLayout>)} />
      <Route path={"/driver/current-job"} component={() => (<DashboardLayout><DriverCurrentJob /></DashboardLayout>)} />
      <Route path={"/driver/vehicle"} component={() => (<DashboardLayout><DriverVehicle /></DashboardLayout>)} />
      <Route path={"/driver/onboarding"} component={() => (<DashboardLayout><DriverOnboarding /></DashboardLayout>)} />
      <Route path={"/inspection/pre-trip"} component={() => (<DashboardLayout><PreTripInspection /></DashboardLayout>)} />
      <Route path={"/inspection/dvir"} component={() => (<DashboardLayout><DVIR /></DashboardLayout>)} />
      <Route path={"/eld"} component={() => (<DashboardLayout><ELDLogs /></DashboardLayout>)} />
      <Route path={"/driver-scorecard"} component={() => (<DashboardLayout><DriverScorecard /></DashboardLayout>)} />
      <Route path={"/driver-scorecard/:driverId"} component={() => (<DashboardLayout><DriverScorecard /></DashboardLayout>)} />
      <Route path={"/rewards"} component={() => (<DashboardLayout><Rewards /></DashboardLayout>)} />
      <Route path={"/leaderboard"} component={() => (<DashboardLayout><Leaderboard /></DashboardLayout>)} />
      <Route path={"/fuel"} component={() => (<DashboardLayout><FuelManagement /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* CATALYST (DISPATCHER) ROUTES */}
      {/* ============================================ */}
      <Route path={"/dispatch"} component={() => (<DashboardLayout><DispatchDashboard /></DashboardLayout>)} />
      <Route path={"/dispatch/board"} component={() => (<DashboardLayout><DispatchBoard /></DashboardLayout>)} />
      <Route path={"/specializations"} component={() => (<DashboardLayout><Specializations /></DashboardLayout>)} />
      <Route path={"/matched-loads"} component={() => (<DashboardLayout><MatchedLoads /></DashboardLayout>)} />
      <Route path={"/opportunities"} component={() => (<DashboardLayout><Opportunities /></DashboardLayout>)} />
      <Route path={"/performance"} component={() => (<DashboardLayout><CatalystPerformance /></DashboardLayout>)} />
      <Route path={"/catalyst/fleet-map"} component={() => (<DashboardLayout><CatalystFleetMap /></DashboardLayout>)} />
      <Route path={"/catalyst/exceptions"} component={() => (<DashboardLayout><CatalystExceptions /></DashboardLayout>)} />
      <Route path={"/load-board"} component={() => (<DashboardLayout><LoadBoard /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* ESCORT ROUTES */}
      {/* ============================================ */}
      <Route path={"/escort"} component={() => (<DashboardLayout><EscortDashboard /></DashboardLayout>)} />
      <Route path={"/convoys"} component={() => (<DashboardLayout><ActiveConvoys /></DashboardLayout>)} />
      <Route path={"/team"} component={() => (<DashboardLayout><ProfilePage /></DashboardLayout>)} />
      <Route path={"/escort/incidents"} component={() => (<DashboardLayout><EscortIncidents /></DashboardLayout>)} />
      <Route path={"/escort/reports"} component={() => (<DashboardLayout><EscortReports /></DashboardLayout>)} />
      <Route path={"/escort/jobs"} component={() => (<DashboardLayout><EscortJobs /></DashboardLayout>)} />
      <Route path={"/escort/marketplace"} component={() => (<DashboardLayout><EscortJobMarketplace /></DashboardLayout>)} />
      <Route path={"/escort/permits"} component={() => (<DashboardLayout><EscortPermits /></DashboardLayout>)} />
      <Route path={"/escort/schedule"} component={() => (<DashboardLayout><EscortSchedule /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* TERMINAL MANAGER ROUTES */}
      {/* ============================================ */}
      <Route path={"/terminal"} component={() => (<DashboardLayout><TerminalDashboard /></DashboardLayout>)} />
      <Route path={"/facility"} component={() => (<DashboardLayout><FacilityPage /></DashboardLayout>)} />
      <Route path={"/incoming"} component={() => (<DashboardLayout><IncomingShipments /></DashboardLayout>)} />
      <Route path={"/outgoing"} component={() => (<DashboardLayout><OutgoingShipments /></DashboardLayout>)} />
      <Route path={"/staff"} component={() => (<DashboardLayout><TerminalStaff /></DashboardLayout>)} />
      <Route path={"/operations"} component={() => (<DashboardLayout><TerminalOperations /></DashboardLayout>)} />
      <Route path={"/terminal/scheduling"} component={() => (<DashboardLayout><TerminalScheduling /></DashboardLayout>)} />
      <Route path={"/terminal/scada"} component={() => (<DashboardLayout><TerminalSCADA /></DashboardLayout>)} />
      <Route path={"/terminal/appointments"} component={() => (<DashboardLayout><AppointmentScheduler /></DashboardLayout>)} />
      <Route path={"/terminal/reports"} component={() => (<DashboardLayout><EscortReports /></DashboardLayout>)} />
      <Route path={"/loading-bays"} component={() => (<DashboardLayout><LoadingBays /></DashboardLayout>)} />
      <Route path={"/terminal-inventory"} component={() => (<DashboardLayout><TerminalInventory /></DashboardLayout>)} />
      <Route path={"/bol"} component={() => (<DashboardLayout><BOLGeneration /></DashboardLayout>)} />
      <Route path={"/spectra-match"} component={() => (<DashboardLayout><SpectraMatch /></DashboardLayout>)} />
      <Route path={"/euso-ticket"} component={() => (<DashboardLayout><EusoTicket /></DashboardLayout>)} />
      <Route path={"/run-tickets"} component={() => (<DashboardLayout><EusoTicket /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* COMPLIANCE OFFICER ROUTES */}
      {/* ============================================ */}
      <Route path={"/compliance"} component={() => (<DashboardLayout><ComplianceDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/dq-files"} component={() => (<DashboardLayout><DQFileManagement /></DashboardLayout>)} />
      <Route path={"/compliance/calendar"} component={() => (<DashboardLayout><ComplianceCalendar /></DashboardLayout>)} />
      <Route path={"/compliance/clearinghouse"} component={() => (<DashboardLayout><ClearinghouseDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/eld"} component={() => (<DashboardLayout><ELDLogs /></DashboardLayout>)} />
      <Route path={"/violations"} component={() => (<DashboardLayout><Violations /></DashboardLayout>)} />
      <Route path={"/audits"} component={() => (<DashboardLayout><Audits /></DashboardLayout>)} />
      <Route path={"/fleet-compliance"} component={() => (<DashboardLayout><FleetOverview /></DashboardLayout>)} />
      <Route path={"/driver-compliance"} component={() => (<DashboardLayout><DriverPerformance /></DashboardLayout>)} />
      <Route path={"/compliance/reports"} component={() => (<DashboardLayout><EscortReports /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* SAFETY MANAGER ROUTES */}
      {/* ============================================ */}
      <Route path={"/safety"} component={() => (<DashboardLayout><SafetyDashboard /></DashboardLayout>)} />
      <Route path={"/safety-metrics"} component={() => (<DashboardLayout><SafetyMetrics /></DashboardLayout>)} />
      <Route path={"/safety/incidents"} component={() => (<DashboardLayout><SafetyIncidents /></DashboardLayout>)} />
      <Route path={"/safety/csa-scores"} component={() => (<DashboardLayout><CSAScoresDashboard /></DashboardLayout>)} />
      <Route path={"/safety/driver-performance"} component={() => (<DashboardLayout><DriverPerformance /></DashboardLayout>)} />
      <Route path={"/driver-health"} component={() => (<DashboardLayout><DriverPerformance /></DashboardLayout>)} />
      <Route path={"/vehicle-safety"} component={() => (<DashboardLayout><FleetOverview /></DashboardLayout>)} />
      <Route path={"/training"} component={() => (<DashboardLayout><TrainingManagement /></DashboardLayout>)} />
      <Route path={"/hazmat"} component={() => (<DashboardLayout><ErgPage /></DashboardLayout>)} />
      <Route path={"/incidents"} component={() => (<DashboardLayout><IncidentReport /></DashboardLayout>)} />
      <Route path={"/accident-report"} component={() => (<DashboardLayout><AccidentReport /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* ADMIN ROUTES */}
      {/* ============================================ */}
      <Route path={"/admin"} component={() => (<DashboardLayout><AdminDashboard /></DashboardLayout>)} />
      <Route path={"/admin/users"} component={() => (<DashboardLayout><UserManagement /></DashboardLayout>)} />
      <Route path={"/admin/companies"} component={() => (<DashboardLayout><CompanyPage /></DashboardLayout>)} />
      <Route path={"/admin/loads"} component={() => (<DashboardLayout><MyLoadsPage /></DashboardLayout>)} />
      <Route path={"/admin/payments"} component={() => (<DashboardLayout><WalletPage /></DashboardLayout>)} />
      <Route path={"/admin/disputes"} component={() => (<DashboardLayout><MessagingCenter /></DashboardLayout>)} />
      <Route path={"/admin/documents"} component={() => (<DashboardLayout><DocumentCenter /></DashboardLayout>)} />
      <Route path={"/admin/analytics"} component={() => (<DashboardLayout><Analytics /></DashboardLayout>)} />
      <Route path={"/admin/settings"} component={() => (<DashboardLayout><SettingsPage /></DashboardLayout>)} />
      <Route path={"/admin/verification"} component={() => (<DashboardLayout><UserVerification /></DashboardLayout>)} />
      <Route path={"/admin/audit-logs"} component={() => (<DashboardLayout><AuditLogs /></DashboardLayout>)} />
      <Route path={"/admin/rss-feeds"} component={() => (<DashboardLayout><AdminRSSFeeds /></DashboardLayout>)} />
      <Route path={"/admin/platform-fees"} component={() => (<DashboardLayout><AdminPlatformFees /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* SUPER ADMIN ROUTES */}
      {/* ============================================ */}
      <Route path={"/super-admin"} component={() => (<DashboardLayout><AdminDashboard /></DashboardLayout>)} />
      <Route path={"/super-admin/users"} component={() => (<DashboardLayout><UserManagement /></DashboardLayout>)} />
      <Route path={"/super-admin/companies"} component={() => (<DashboardLayout><CompanyPage /></DashboardLayout>)} />
      <Route path={"/super-admin/loads"} component={() => (<DashboardLayout><MyLoadsPage /></DashboardLayout>)} />
      <Route path={"/super-admin/config"} component={() => (<DashboardLayout><SettingsPage /></DashboardLayout>)} />
      <Route path={"/super-admin/database"} component={() => (<DashboardLayout><Analytics /></DashboardLayout>)} />
      <Route path={"/super-admin/security"} component={() => (<DashboardLayout><SettingsPage /></DashboardLayout>)} />
      <Route path={"/super-admin/logs"} component={() => (<DashboardLayout><AuditLogs /></DashboardLayout>)} />
      <Route path={"/super-admin/monitoring"} component={() => (<DashboardLayout><Analytics /></DashboardLayout>)} />
      <Route path={"/super-admin/settings"} component={() => (<DashboardLayout><SettingsPage /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* UTILITY & DETAIL ROUTES */}
      {/* ============================================ */}
      <Route path={"/billing"} component={() => (<DashboardLayout><Billing /></DashboardLayout>)} />
      <Route path={"/messaging"} component={() => (<DashboardLayout><MessagingCenter /></DashboardLayout>)} />
      <Route path={"/invoice/:invoiceId"} component={() => (<DashboardLayout><InvoiceDetails /></DashboardLayout>)} />
      <Route path={"/settlement/:settlementId"} component={() => (<DashboardLayout><SettlementDetails /></DashboardLayout>)} />
      <Route path={"/tools/rate-calculator"} component={() => (<DashboardLayout><RateCalculator /></DashboardLayout>)} />
      <Route path={"/directory"} component={() => (<DashboardLayout><IndustryDirectory /></DashboardLayout>)} />
      <Route path={"/live-news"} component={() => (<DashboardLayout><LiveNewsFeed /></DashboardLayout>)} />
      <Route path={"/carrier-compliance"} component={() => (<DashboardLayout><CarrierCompliance /></DashboardLayout>)} />
      <Route path={"/fuel-prices"} component={() => (<DashboardLayout><FuelPrices /></DashboardLayout>)} />
      <Route path={"/weather-alerts"} component={() => (<DashboardLayout><WeatherAlerts /></DashboardLayout>)} />
      <Route path={"/audit-log"} component={() => (<DashboardLayout><AuditLog /></DashboardLayout>)} />
      <Route path={"/procedures"} component={() => (<DashboardLayout><ProceduresPage /></DashboardLayout>)} />
      <Route path={"/shipments"} component={() => (<DashboardLayout><ShipmentPage /></DashboardLayout>)} />
      <Route path={"/channels"} component={() => (<DashboardLayout><ChannelsPage /></DashboardLayout>)} />
      <Route path={"/reports"} component={() => (<DashboardLayout><EscortReports /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* ZEUN MECHANICS ROUTES */}
      {/* ============================================ */}
      <Route path={"/zeun/breakdown"} component={() => (<DashboardLayout><ZeunBreakdownReport /></DashboardLayout>)} />
      <Route path={"/zeun/maintenance"} component={() => (<DashboardLayout><ZeunMaintenanceTracker /></DashboardLayout>)} />
      <Route path={"/zeun/providers"} component={() => (<DashboardLayout><ZeunProviderNetwork /></DashboardLayout>)} />

      {/* ============================================ */}
      {/* FALLBACK */}
      {/* ============================================ */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// OLD DUPLICATE ROUTES REMOVED - DO NOT RE-ADD
// The following routes were duplicates and have been consolidated:
// - /dispatch (was duplicated)
// - /terminal (was duplicated)
// - /fleet (was triplicated)
// - /support (was duplicated)
// - /notifications (was duplicated)
// - /company (was duplicated)
// - /tracking (was duplicated)
// - /loads/create (was duplicated)
// - /earnings (was duplicated)
// - /documents (was triplicated)
// - /admin/analytics (was duplicated)
// - /admin/documents (was duplicated)
// - /incidents (was duplicated - now role-specific)
// - /reports (was shared - now role-specific)

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
