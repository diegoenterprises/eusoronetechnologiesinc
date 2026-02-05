import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

// ============================================
// ALL PAGE IMPORTS (520 PAGES)
// ============================================
import APIDocumentation from "./pages/APIDocumentation";
import APIKeys from "./pages/APIKeys";
import APIManagement from "./pages/APIManagement";
import AccessorialCharges from "./pages/AccessorialCharges";
import AccidentInvestigation from "./pages/AccidentInvestigation";
import AccidentReport from "./pages/AccidentReport";
import AccidentReporting from "./pages/AccidentReporting";
import AccountDeletion from "./pages/AccountDeletion";
import AccountPreferences from "./pages/AccountPreferences";
import AccountSettings from "./pages/AccountSettings";
import AchievementsBadges from "./pages/AchievementsBadges";
import ActiveConvoys from "./pages/ActiveConvoys";
import ActiveLoads from "./pages/ActiveLoads";
import ActivityFeed from "./pages/ActivityFeed";
import ActivityTimeline from "./pages/ActivityTimeline";
import AdminApiManagement from "./pages/AdminApiManagement";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminAuditTrail from "./pages/AdminAuditTrail";
import AdminBilling from "./pages/AdminBilling";
import AdminDashboard from "./pages/AdminDashboard";
import AdminFeatureFlags from "./pages/AdminFeatureFlags";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminPlatformFees from "./pages/AdminPlatformFees";
import AdminRSSFeeds from "./pages/AdminRSSFeeds";
import AdminReporting from "./pages/AdminReporting";
import AdminSystemLogs from "./pages/AdminSystemLogs";
import AdminSystemSettings from "./pages/AdminSystemSettings";
import AdminTelemetry from "./pages/AdminTelemetry";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminUserOnboarding from "./pages/AdminUserOnboarding";
import AdminUserVerification from "./pages/AdminUserVerification";
import AlertManagement from "./pages/AlertManagement";
import Analytics from "./pages/Analytics";
import Announcements from "./pages/Announcements";
import AppointmentScheduler from "./pages/AppointmentScheduler";
import AppointmentScheduling from "./pages/AppointmentScheduling";
import AssignedLoads from "./pages/AssignedLoads";
import AuditLog from "./pages/AuditLog";
import AuditLogs from "./pages/AuditLogs";
import Audits from "./pages/Audits";
import BOLGeneration from "./pages/BOLGeneration";
import BOLManagement from "./pages/BOLManagement";
import BackgroundChecks from "./pages/BackgroundChecks";
import BackupManagement from "./pages/BackupManagement";
import BenefitsManagement from "./pages/BenefitsManagement";
import BidAnalysis from "./pages/BidAnalysis";
import BidDetails from "./pages/BidDetails";
import BidHistory from "./pages/BidHistory";
import BidManagement from "./pages/BidManagement";
import Billing from "./pages/Billing";
import BillingHistory from "./pages/BillingHistory";
import BillingSettings from "./pages/BillingSettings";
import Bookmarks from "./pages/Bookmarks";
import BroadcastMessages from "./pages/BroadcastMessages";
import BrokerAnalytics from "./pages/BrokerAnalytics";
import BrokerCarrierCapacity from "./pages/BrokerCarrierCapacity";
import BrokerCarrierNetwork from "./pages/BrokerCarrierNetwork";
import BrokerCarrierOnboarding from "./pages/BrokerCarrierOnboarding";
import BrokerCarrierPrequalification from "./pages/BrokerCarrierPrequalification";
import BrokerCarrierVetting from "./pages/BrokerCarrierVetting";
import BrokerCarriers from "./pages/BrokerCarriers";
import BrokerCommissionDetail from "./pages/BrokerCommissionDetail";
import BrokerCompliance from "./pages/BrokerCompliance";
import BrokerCustomerManagement from "./pages/BrokerCustomerManagement";
import BrokerDashboard from "./pages/BrokerDashboard";
import BrokerLaneRates from "./pages/BrokerLaneRates";
import BrokerLoadBoard from "./pages/BrokerLoadBoard";
import BrokerLoadMatching from "./pages/BrokerLoadMatching";
import BrokerLoadProfitability from "./pages/BrokerLoadProfitability";
import BrokerMarginAnalysis from "./pages/BrokerMarginAnalysis";
import BrokerMarketplace from "./pages/BrokerMarketplace";
import BrokerPayments from "./pages/BrokerPayments";
import BrokerQuoteBuilder from "./pages/BrokerQuoteBuilder";
import BrokerShipperManagement from "./pages/BrokerShipperManagement";
import CSAScores from "./pages/CSAScores";
import CSAScoresDashboard from "./pages/CSAScoresDashboard";
import CacheManagement from "./pages/CacheManagement";
import CapacityBoard from "./pages/CapacityBoard";
import CarrierAnalytics from "./pages/CarrierAnalytics";
import CarrierBidSubmission from "./pages/CarrierBidSubmission";
import CarrierBidSubmit from "./pages/CarrierBidSubmit";
import CarrierCapacityBoard from "./pages/CarrierCapacityBoard";
import CarrierCompliance from "./pages/CarrierCompliance";
import CarrierDashboard from "./pages/CarrierDashboard";
import CarrierDetails from "./pages/CarrierDetails";
import CarrierDirectory from "./pages/CarrierDirectory";
import CarrierDispatchBoard from "./pages/CarrierDispatchBoard";
import CarrierDriverAssignments from "./pages/CarrierDriverAssignments";
import CarrierDriverManagement from "./pages/CarrierDriverManagement";
import CarrierFleetManagement from "./pages/CarrierFleetManagement";
import CarrierFleetOverview from "./pages/CarrierFleetOverview";
import CarrierInsurance from "./pages/CarrierInsurance";
import CarrierInvoicing from "./pages/CarrierInvoicing";
import CarrierLoadHistory from "./pages/CarrierLoadHistory";
import CarrierLoadSearch from "./pages/CarrierLoadSearch";
import CarrierPackets from "./pages/CarrierPackets";
import CarrierProfile from "./pages/CarrierProfile";
import CarrierProfitabilityAnalysis from "./pages/CarrierProfitabilityAnalysis";
import CarrierSafetyScores from "./pages/CarrierSafetyScores";
import CarrierScorecard from "./pages/CarrierScorecard";
import CarrierSettlements from "./pages/CarrierSettlements";
import CarrierVetting from "./pages/CarrierVetting";
import CarrierVettingDetails from "./pages/CarrierVettingDetails";
import Carriers from "./pages/Carriers";
import CatalystBreakdownResponse from "./pages/CatalystBreakdownResponse";
import CatalystCarrierCapacity from "./pages/CatalystCarrierCapacity";
import CatalystDashboard from "./pages/CatalystDashboard";
import CatalystDriverAssignment from "./pages/CatalystDriverAssignment";
import CatalystDriverPerformance from "./pages/CatalystDriverPerformance";
import CatalystDriverScheduling from "./pages/CatalystDriverScheduling";
import CatalystExceptionManagement from "./pages/CatalystExceptionManagement";
import CatalystExceptions from "./pages/CatalystExceptions";
import CatalystFleetMap from "./pages/CatalystFleetMap";
import CatalystLoadBoard from "./pages/CatalystLoadBoard";
import CatalystLoadMatching from "./pages/CatalystLoadMatching";
import CatalystLoadOptimization from "./pages/CatalystLoadOptimization";
import CatalystPerformance from "./pages/CatalystPerformance";
import CatalystReliefDriver from "./pages/CatalystReliefDriver";
import ChangePassword from "./pages/ChangePassword";
import Channels from "./pages/Channels";
import ClaimsManagement from "./pages/ClaimsManagement";
import Clearinghouse from "./pages/Clearinghouse";
import ClearinghouseDashboard from "./pages/ClearinghouseDashboard";
import ClearinghouseQueries from "./pages/ClearinghouseQueries";
import Commission from "./pages/Commission";
import CommissionTracking from "./pages/CommissionTracking";
import Companies from "./pages/Companies";
import Company from "./pages/Company";
import CompanyBilling from "./pages/CompanyBilling";
import CompanyChannels from "./pages/CompanyChannels";
import CompanyDocuments from "./pages/CompanyDocuments";
import CompanyManagement from "./pages/CompanyManagement";
import CompanyProfile from "./pages/CompanyProfile";
import CompanyVerification from "./pages/CompanyVerification";
import CompetitorAnalysis from "./pages/CompetitorAnalysis";
import ComplianceAudits from "./pages/ComplianceAudits";
import ComplianceCalendar from "./pages/ComplianceCalendar";
import ComplianceClearinghouse from "./pages/ComplianceClearinghouse";
import ComplianceDQFile from "./pages/ComplianceDQFile";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import ComplianceDriverQualification from "./pages/ComplianceDriverQualification";
import ComplianceDrugTesting from "./pages/ComplianceDrugTesting";
import ComplianceHOSReview from "./pages/ComplianceHOSReview";
import ComplianceLogAudits from "./pages/ComplianceLogAudits";
import ComplianceMedicalCertificates from "./pages/ComplianceMedicalCertificates";
import ComplianceOfficerDashboard from "./pages/ComplianceOfficerDashboard";
import ComplianceTrainingRecords from "./pages/ComplianceTrainingRecords";
import ComponentShowcase from "./pages/ComponentShowcase";
import ConnectedApps from "./pages/ConnectedApps";
import ContentModeration from "./pages/ContentModeration";
import ContractManagement from "./pages/ContractManagement";
import CookiePolicy from "./pages/CookiePolicy";
import CreateLoad from "./pages/CreateLoad";
import CurrentJob from "./pages/CurrentJob";
import CustomerDirectory from "./pages/CustomerDirectory";
import CustomerFeedback from "./pages/CustomerFeedback";
import CustomerManagement from "./pages/CustomerManagement";
import DQFileManagement from "./pages/DQFileManagement";
import DVIR from "./pages/DVIR";
import DVIRManagement from "./pages/DVIRManagement";
import Dashboard from "./pages/Dashboard";
import DashboardCustomizer from "./pages/DashboardCustomizer";
import DataExport from "./pages/DataExport";
import DataExports from "./pages/DataExports";
import DataImport from "./pages/DataImport";
import DataRetention from "./pages/DataRetention";
import DatabaseHealth from "./pages/DatabaseHealth";
import DeadheadAnalysis from "./pages/DeadheadAnalysis";
import DetentionTracking from "./pages/DetentionTracking";
import Diagnostics from "./pages/Diagnostics";
import DigitalSignatures from "./pages/DigitalSignatures";
import DispatchAssignment from "./pages/DispatchAssignment";
import DispatchBoard from "./pages/DispatchBoard";
import DispatchDashboard from "./pages/DispatchDashboard";
import DisputeResolution from "./pages/DisputeResolution";
import DocumentCenter from "./pages/DocumentCenter";
import Documents from "./pages/Documents";
import DriverApplications from "./pages/DriverApplications";
import DriverBOLSign from "./pages/DriverBOLSign";
import DriverCheckIn from "./pages/DriverCheckIn";
import DriverCompensation from "./pages/DriverCompensation";
import DriverCompliance from "./pages/DriverCompliance";
import DriverCurrentJob from "./pages/DriverCurrentJob";
import DriverDashboard from "./pages/DriverDashboard";
import DriverDetails from "./pages/DriverDetails";
import DriverDirectory from "./pages/DriverDirectory";
import DriverDocuments from "./pages/DriverDocuments";
import DriverEarnings from "./pages/DriverEarnings";
import DriverExpenseReport from "./pages/DriverExpenseReport";
import DriverFuelLocator from "./pages/DriverFuelLocator";
import DriverFuelPurchase from "./pages/DriverFuelPurchase";
import DriverHOS from "./pages/DriverHOS";
import DriverHOSDashboard from "./pages/DriverHOSDashboard";
import DriverIssueReport from "./pages/DriverIssueReport";
import DriverLoadHistory from "./pages/DriverLoadHistory";
import DriverManagement from "./pages/DriverManagement";
import DriverMessages from "./pages/DriverMessages";
import DriverMobileApp from "./pages/DriverMobileApp";
import DriverNavigation from "./pages/DriverNavigation";
import DriverOnboarding from "./pages/DriverOnboarding";
import DriverPODCapture from "./pages/DriverPODCapture";
import DriverPayStatements from "./pages/DriverPayStatements";
import DriverPayroll from "./pages/DriverPayroll";
import DriverPerformance from "./pages/DriverPerformance";
import DriverPreTrip from "./pages/DriverPreTrip";
import DriverPreTripInspection from "./pages/DriverPreTripInspection";
import DriverRestStops from "./pages/DriverRestStops";
import DriverSafetyScorecard from "./pages/DriverSafetyScorecard";
import DriverScorecard from "./pages/DriverScorecard";
import DriverScorecards from "./pages/DriverScorecards";
import DriverSettlement from "./pages/DriverSettlement";
import DriverStatus from "./pages/DriverStatus";
import DriverTerminations from "./pages/DriverTerminations";
import DriverTimeOff from "./pages/DriverTimeOff";
import DriverTracking from "./pages/DriverTracking";
import DriverTraining from "./pages/DriverTraining";
import DriverVehicle from "./pages/DriverVehicle";
import DriverWeatherAlerts from "./pages/DriverWeatherAlerts";
import Drivers from "./pages/Drivers";
import DrugAlcoholTesting from "./pages/DrugAlcoholTesting";
import EIAReporting from "./pages/EIAReporting";
import ELDIntegration from "./pages/ELDIntegration";
import ELDLogs from "./pages/ELDLogs";
import ERGGuide from "./pages/ERGGuide";
import ERGLookup from "./pages/ERGLookup";
import ESANGChat from "./pages/ESANGChat";
import Earnings from "./pages/Earnings";
import EmailLogs from "./pages/EmailLogs";
import EmailTemplates from "./pages/EmailTemplates";
import EmploymentHistory from "./pages/EmploymentHistory";
import EquipmentManagement from "./pages/EquipmentManagement";
import EquipmentTracking from "./pages/EquipmentTracking";
import Erg from "./pages/Erg";
import ErrorLogs from "./pages/ErrorLogs";
import EscortCertificationRenewal from "./pages/EscortCertificationRenewal";
import EscortCertifications from "./pages/EscortCertifications";
import EscortClientManagement from "./pages/EscortClientManagement";
import EscortCommunications from "./pages/EscortCommunications";
import EscortConvoyComm from "./pages/EscortConvoyComm";
import EscortDashboard from "./pages/EscortDashboard";
import EscortEarnings from "./pages/EscortEarnings";
import EscortEquipmentManagement from "./pages/EscortEquipmentManagement";
import EscortHeightPole from "./pages/EscortHeightPole";
import EscortIncidents from "./pages/EscortIncidents";
import EscortJobAcceptance from "./pages/EscortJobAcceptance";
import EscortJobMarketplace from "./pages/EscortJobMarketplace";
import EscortJobs from "./pages/EscortJobs";
import EscortPayHistory from "./pages/EscortPayHistory";
import EscortPermits from "./pages/EscortPermits";
import EscortReports from "./pages/EscortReports";
import EscortRouteHistory from "./pages/EscortRouteHistory";
import EscortRoutePlanning from "./pages/EscortRoutePlanning";
import EscortSchedule from "./pages/EscortSchedule";
import EscortTraining from "./pages/EscortTraining";
import EscortVehicleInspection from "./pages/EscortVehicleInspection";
import EusoTicket from "./pages/EusoTicket";
import ExceptionManagement from "./pages/ExceptionManagement";
import ExpenseReports from "./pages/ExpenseReports";
import Facility from "./pages/Facility";
import FactoringDashboard from "./pages/FactoringDashboard";
import FactoringIntegration from "./pages/FactoringIntegration";
import FactoringServices from "./pages/FactoringServices";
import FeatureFlags from "./pages/FeatureFlags";
import FeatureRequests from "./pages/FeatureRequests";
import FeedbackSurveys from "./pages/FeedbackSurveys";
import FindLoads from "./pages/FindLoads";
import Fleet from "./pages/Fleet";
import FleetCompliance from "./pages/FleetCompliance";
import FleetInsurance from "./pages/FleetInsurance";
import FleetManagement from "./pages/FleetManagement";
import FleetMap from "./pages/FleetMap";
import FleetOverview from "./pages/FleetOverview";
import FleetTracking from "./pages/FleetTracking";
import FuelCardManagement from "./pages/FuelCardManagement";
import FuelManagement from "./pages/FuelManagement";
import FuelPrices from "./pages/FuelPrices";
import FuelTracking from "./pages/FuelTracking";
import GPSTracking from "./pages/GPSTracking";
import GeofenceManagement from "./pages/GeofenceManagement";
import GlobalSearch from "./pages/GlobalSearch";
import HOSCompliance from "./pages/HOSCompliance";
import HOSTracker from "./pages/HOSTracker";
import HazmatCertifications from "./pages/HazmatCertifications";
import HazmatShipments from "./pages/HazmatShipments";
import HelpCenter from "./pages/HelpCenter";
import Home from "./pages/Home";
import IFTAReporting from "./pages/IFTAReporting";
import InTransit from "./pages/InTransit";
import IncidentReport from "./pages/IncidentReport";
import IncidentReporting from "./pages/IncidentReporting";
import IncomingShipments from "./pages/IncomingShipments";
import IndustryDirectory from "./pages/IndustryDirectory";
import InsuranceCertificates from "./pages/InsuranceCertificates";
import InsuranceDashboard from "./pages/InsuranceDashboard";
import InsuranceManagement from "./pages/InsuranceManagement";
import IntegrationSettings from "./pages/IntegrationSettings";
import InvoiceDetails from "./pages/InvoiceDetails";
import InvoiceManagement from "./pages/InvoiceManagement";
import Jobs from "./pages/Jobs";
import KnowledgeBase from "./pages/KnowledgeBase";
import LaneAnalysis from "./pages/LaneAnalysis";
import LaneRates from "./pages/LaneRates";
import Leaderboard from "./pages/Leaderboard";
import LicenseManagement from "./pages/LicenseManagement";
import LiveChat from "./pages/LiveChat";
import LiveNewsFeed from "./pages/LiveNewsFeed";
import LoadAcceptance from "./pages/LoadAcceptance";
import LoadBids from "./pages/LoadBids";
import LoadBoard from "./pages/LoadBoard";
import LoadCreate from "./pages/LoadCreate";
import LoadCreationWizard from "./pages/LoadCreationWizard";
import LoadDetails from "./pages/LoadDetails";
import LoadHistory from "./pages/LoadHistory";
import LoadNegotiation from "./pages/LoadNegotiation";
import LoadTracking from "./pages/LoadTracking";
import LoadWizard from "./pages/LoadWizard";
import LoadingBays from "./pages/LoadingBays";
import Login from "./pages/Login";
import LoginHistory from "./pages/LoginHistory";
import MVRReports from "./pages/MVRReports";
import Maintenance from "./pages/Maintenance";
import MaintenanceSchedule from "./pages/MaintenanceSchedule";
import MarketIntelligence from "./pages/MarketIntelligence";
import Marketplace from "./pages/Marketplace";
import MatchedLoads from "./pages/MatchedLoads";
import MedicalCertifications from "./pages/MedicalCertifications";
import Messages from "./pages/Messages";
import MessagingCenter from "./pages/MessagingCenter";
import MileageCalculator from "./pages/MileageCalculator";
import Missions from "./pages/Missions";
import MyLoads from "./pages/MyLoads";
import NewsFeed from "./pages/NewsFeed";
import NotificationCenter from "./pages/NotificationCenter";
import NotificationSettings from "./pages/NotificationSettings";
import Notifications from "./pages/Notifications";
import NotificationsCenter from "./pages/NotificationsCenter";
import OnTimePerformance from "./pages/OnTimePerformance";
import Onboarding from "./pages/Onboarding";
import OnboardingCompanySetup from "./pages/OnboardingCompanySetup";
import OnboardingDocuments from "./pages/OnboardingDocuments";
import Opportunities from "./pages/Opportunities";
import OutgoingShipments from "./pages/OutgoingShipments";
import PODManagement from "./pages/PODManagement";
import PSPReports from "./pages/PSPReports";
import PasswordChange from "./pages/PasswordChange";
import PaymentHistory from "./pages/PaymentHistory";
import PaymentMethods from "./pages/PaymentMethods";
import PaymentProcessing from "./pages/PaymentProcessing";
import Payments from "./pages/Payments";
import PayrollManagement from "./pages/PayrollManagement";
import PerformanceMonitor from "./pages/PerformanceMonitor";
import PerformanceReports from "./pages/PerformanceReports";
import PerformanceReviews from "./pages/PerformanceReviews";
import PermitManagement from "./pages/PermitManagement";
import PermitRequirements from "./pages/PermitRequirements";
import Permits from "./pages/Permits";
import PlatformAnalytics from "./pages/PlatformAnalytics";
import PlatformHealth from "./pages/PlatformHealth";
import PreTripChecklist from "./pages/PreTripChecklist";
import PreTripInspection from "./pages/PreTripInspection";
import Preferences from "./pages/Preferences";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Procedures from "./pages/Procedures";
import Profile from "./pages/Profile";
import PushNotifications from "./pages/PushNotifications";
import QueueMonitor from "./pages/QueueMonitor";
import QuickActions from "./pages/QuickActions";
import QuoteManagement from "./pages/QuoteManagement";
import QuoteRequests from "./pages/QuoteRequests";
import RackStatus from "./pages/RackStatus";
import RateCalculator from "./pages/RateCalculator";
import RateConfirmationSign from "./pages/RateConfirmationSign";
import RateConfirmations from "./pages/RateConfirmations";
import RateLimiting from "./pages/RateLimiting";
import RateManagement from "./pages/RateManagement";
import ReferralProgram from "./pages/ReferralProgram";
import Register from "./pages/Register";
import RegisterBroker from "./pages/RegisterBroker";
import RegisterCarrier from "./pages/RegisterCarrier";
import RegisterCatalyst from "./pages/RegisterCatalyst";
import RegisterCompliance from "./pages/RegisterCompliance";
import RegisterDriver from "./pages/RegisterDriver";
import RegisterEscort from "./pages/RegisterEscort";
import RegisterSafety from "./pages/RegisterSafety";
import RegisterShipper from "./pages/RegisterShipper";
import RegisterTerminal from "./pages/RegisterTerminal";
import ReleaseNotes from "./pages/ReleaseNotes";
import ReportBuilder from "./pages/ReportBuilder";
import ReportingDashboard from "./pages/ReportingDashboard";
import RestStops from "./pages/RestStops";
import RevenueAnalytics from "./pages/RevenueAnalytics";
import Rewards from "./pages/Rewards";
import RewardsCenter from "./pages/RewardsCenter";
import RoadTestRecords from "./pages/RoadTestRecords";
import RolePermissions from "./pages/RolePermissions";
import RoutePlanning from "./pages/RoutePlanning";
import RunTickets from "./pages/RunTickets";
import SAFERLookup from "./pages/SAFERLookup";
import SCADA from "./pages/SCADA";
import SCADAMonitor from "./pages/SCADAMonitor";
import SMSNotifications from "./pages/SMSNotifications";
import SafetyAccidentReports from "./pages/SafetyAccidentReports";
import SafetyCSAScores from "./pages/SafetyCSAScores";
import SafetyDashboard from "./pages/SafetyDashboard";
import SafetyDriverBehavior from "./pages/SafetyDriverBehavior";
import SafetyEquipmentInspections from "./pages/SafetyEquipmentInspections";
import SafetyIncidentInvestigation from "./pages/SafetyIncidentInvestigation";
import SafetyIncidentReporting from "./pages/SafetyIncidentReporting";
import SafetyIncidentTracking from "./pages/SafetyIncidentTracking";
import SafetyIncidents from "./pages/SafetyIncidents";
import SafetyInspectionReports from "./pages/SafetyInspectionReports";
import SafetyManagerDashboard from "./pages/SafetyManagerDashboard";
import SafetyMeetings from "./pages/SafetyMeetings";
import SafetyMetrics from "./pages/SafetyMetrics";
import SafetyTrainingPrograms from "./pages/SafetyTrainingPrograms";
import SafetyTrainingRecords from "./pages/SafetyTrainingRecords";
import ScaleLocations from "./pages/ScaleLocations";
import ScheduledTasks from "./pages/ScheduledTasks";
import SecuritySettings from "./pages/SecuritySettings";
import ServiceAlerts from "./pages/ServiceAlerts";
import SessionManagement from "./pages/SessionManagement";
import Settings from "./pages/Settings";
import SettingsIntegrations from "./pages/SettingsIntegrations";
import SettlementDetails from "./pages/SettlementDetails";
import SettlementStatements from "./pages/SettlementStatements";
import Shipment from "./pages/Shipment";
import ShipperAccessorials from "./pages/ShipperAccessorials";
import ShipperBidEvaluation from "./pages/ShipperBidEvaluation";
import ShipperBidManagement from "./pages/ShipperBidManagement";
import ShipperCarrierPerformance from "./pages/ShipperCarrierPerformance";
import ShipperCarrierScorecard from "./pages/ShipperCarrierScorecard";
import ShipperCompliance from "./pages/ShipperCompliance";
import ShipperContracts from "./pages/ShipperContracts";
import ShipperDashboard from "./pages/ShipperDashboard";
import ShipperDocumentExport from "./pages/ShipperDocumentExport";
import ShipperInvoiceReview from "./pages/ShipperInvoiceReview";
import ShipperLaneAnalysis from "./pages/ShipperLaneAnalysis";
import ShipperLoadCreate from "./pages/ShipperLoadCreate";
import ShipperLoadTracking from "./pages/ShipperLoadTracking";
import ShipperLoads from "./pages/ShipperLoads";
import ShipperPODReview from "./pages/ShipperPODReview";
import ShipperProfile from "./pages/ShipperProfile";
import ShipperQuoteRequests from "./pages/ShipperQuoteRequests";
import ShipperRateCarrier from "./pages/ShipperRateCarrier";
import ShipperSpendAnalytics from "./pages/ShipperSpendAnalytics";
import ShipperVendorManagement from "./pages/ShipperVendorManagement";
import Shippers from "./pages/Shippers";
import Specializations from "./pages/Specializations";
import SpectraMatch from "./pages/SpectraMatch";
import SubscriptionPlan from "./pages/SubscriptionPlan";
import Support from "./pages/Support";
import SupportTickets from "./pages/SupportTickets";
import SystemConfiguration from "./pages/SystemConfiguration";
import SystemHealth from "./pages/SystemHealth";
import SystemSettings from "./pages/SystemSettings";
import SystemStatus from "./pages/SystemStatus";
import TankInventory from "./pages/TankInventory";
import TaxDocuments from "./pages/TaxDocuments";
import TeamManagement from "./pages/TeamManagement";
import TerminalAppointmentSchedule from "./pages/TerminalAppointmentSchedule";
import TerminalAppointments from "./pages/TerminalAppointments";
import TerminalCarrierAccess from "./pages/TerminalCarrierAccess";
import TerminalDashboard from "./pages/TerminalDashboard";
import TerminalDirectory from "./pages/TerminalDirectory";
import TerminalEIAReporting from "./pages/TerminalEIAReporting";
import TerminalGateManagement from "./pages/TerminalGateManagement";
import TerminalInventory from "./pages/TerminalInventory";
import TerminalInventoryAlerts from "./pages/TerminalInventoryAlerts";
import TerminalLoadingSchedule from "./pages/TerminalLoadingSchedule";
import TerminalManagerDashboard from "./pages/TerminalManagerDashboard";
import TerminalOperations from "./pages/TerminalOperations";
import TerminalProductInventory from "./pages/TerminalProductInventory";
import TerminalProductManagement from "./pages/TerminalProductManagement";
import TerminalRackAssignment from "./pages/TerminalRackAssignment";
import TerminalRackSchedule from "./pages/TerminalRackSchedule";
import TerminalSCADA from "./pages/TerminalSCADA";
import TerminalSafetyInspections from "./pages/TerminalSafetyInspections";
import TerminalScheduling from "./pages/TerminalScheduling";
import TerminalStaff from "./pages/TerminalStaff";
import TerminalTankInventory from "./pages/TerminalTankInventory";
import TerminalWeighScales from "./pages/TerminalWeighScales";
import TerminalYardManagement from "./pages/TerminalYardManagement";
import TermsOfService from "./pages/TermsOfService";
import TestLogin from "./pages/TestLogin";
import TheHaul from "./pages/TheHaul";
import TheHaulAchievements from "./pages/TheHaulAchievements";
import TheHaulLeaderboard from "./pages/TheHaulLeaderboard";
import TheHaulMissions from "./pages/TheHaulMissions";
import TheHaulRewards from "./pages/TheHaulRewards";
import TimeOffRequests from "./pages/TimeOffRequests";
import TollCalculator from "./pages/TollCalculator";
import TrackShipments from "./pages/TrackShipments";
import TrafficConditions from "./pages/TrafficConditions";
import TrainingManagement from "./pages/TrainingManagement";
import TwoFactorAuth from "./pages/TwoFactorAuth";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import UserManagement from "./pages/UserManagement";
import UserVerification from "./pages/UserVerification";
import Users from "./pages/Users";
import UtilizationReport from "./pages/UtilizationReport";
import Vehicle from "./pages/Vehicle";
import VehicleDetails from "./pages/VehicleDetails";
import VehicleInspections from "./pages/VehicleInspections";
import VerificationQueue from "./pages/VerificationQueue";
import Violations from "./pages/Violations";
import Wallet from "./pages/Wallet";
import WalletAddFunds from "./pages/WalletAddFunds";
import WalletInstantPay from "./pages/WalletInstantPay";
import WalletPayoutMethods from "./pages/WalletPayoutMethods";
import WalletTransactions from "./pages/WalletTransactions";
import WeatherAlerts from "./pages/WeatherAlerts";
import WebhookLogs from "./pages/WebhookLogs";
import WebhookManagement from "./pages/WebhookManagement";
import ZeunAdminDashboard from "./pages/ZeunAdminDashboard";
import ZeunBreakdown from "./pages/ZeunBreakdown";
import ZeunBreakdownReport from "./pages/ZeunBreakdownReport";
import ZeunFleetDashboard from "./pages/ZeunFleetDashboard";
import ZeunMaintenanceTracker from "./pages/ZeunMaintenanceTracker";
import ZeunProviderNetwork from "./pages/ZeunProviderNetwork";

function Router() {
  return (
    <Switch>
      {/* ============================================ */}
      {/* ALL ROUTES - 519 PAGES */}
      {/* ============================================ */}
      <Route path={"/api-docs"} component={() => (<DashboardLayout><APIDocumentation /></DashboardLayout>)} />
      <Route path={"/api-keys"} component={() => (<DashboardLayout><APIKeys /></DashboardLayout>)} />
      <Route path={"/api-management"} component={() => (<DashboardLayout><APIManagement /></DashboardLayout>)} />
      <Route path={"/accessorial-charges"} component={() => (<DashboardLayout><AccessorialCharges /></DashboardLayout>)} />
      <Route path={"/accident-investigation"} component={() => (<DashboardLayout><AccidentInvestigation /></DashboardLayout>)} />
      <Route path={"/accident-report"} component={() => (<DashboardLayout><AccidentReport /></DashboardLayout>)} />
      <Route path={"/accident-reporting"} component={() => (<DashboardLayout><AccidentReporting /></DashboardLayout>)} />
      <Route path={"/account-deletion"} component={() => (<DashboardLayout><AccountDeletion /></DashboardLayout>)} />
      <Route path={"/account-preferences"} component={() => (<DashboardLayout><AccountPreferences /></DashboardLayout>)} />
      <Route path={"/account-settings"} component={() => (<DashboardLayout><AccountSettings /></DashboardLayout>)} />
      <Route path={"/achievements-badges"} component={() => (<DashboardLayout><AchievementsBadges /></DashboardLayout>)} />
      <Route path={"/active-convoys"} component={() => (<DashboardLayout><ActiveConvoys /></DashboardLayout>)} />
      <Route path={"/active-loads"} component={() => (<DashboardLayout><ActiveLoads /></DashboardLayout>)} />
      <Route path={"/activity-feed"} component={() => (<DashboardLayout><ActivityFeed /></DashboardLayout>)} />
      <Route path={"/activity-timeline"} component={() => (<DashboardLayout><ActivityTimeline /></DashboardLayout>)} />
      <Route path={"/admin/api-management"} component={() => (<DashboardLayout><AdminApiManagement /></DashboardLayout>)} />
      <Route path={"/admin/audit-logs"} component={() => (<DashboardLayout><AdminAuditLogs /></DashboardLayout>)} />
      <Route path={"/admin/audit-trail"} component={() => (<DashboardLayout><AdminAuditTrail /></DashboardLayout>)} />
      <Route path={"/admin/billing"} component={() => (<DashboardLayout><AdminBilling /></DashboardLayout>)} />
      <Route path={"/admin/dashboard"} component={() => (<DashboardLayout><AdminDashboard /></DashboardLayout>)} />
      <Route path={"/admin/feature-flags"} component={() => (<DashboardLayout><AdminFeatureFlags /></DashboardLayout>)} />
      <Route path={"/admin/integrations"} component={() => (<DashboardLayout><AdminIntegrations /></DashboardLayout>)} />
      <Route path={"/admin/platform-fees"} component={() => (<DashboardLayout><AdminPlatformFees /></DashboardLayout>)} />
      <Route path={"/admin/rss-feeds"} component={() => (<DashboardLayout><AdminRSSFeeds /></DashboardLayout>)} />
      <Route path={"/admin/reporting"} component={() => (<DashboardLayout><AdminReporting /></DashboardLayout>)} />
      <Route path={"/admin/system-logs"} component={() => (<DashboardLayout><AdminSystemLogs /></DashboardLayout>)} />
      <Route path={"/admin/system-settings"} component={() => (<DashboardLayout><AdminSystemSettings /></DashboardLayout>)} />
      <Route path={"/admin/telemetry"} component={() => (<DashboardLayout><AdminTelemetry /></DashboardLayout>)} />
      <Route path={"/admin/user-management"} component={() => (<DashboardLayout><AdminUserManagement /></DashboardLayout>)} />
      <Route path={"/admin/user-onboarding"} component={() => (<DashboardLayout><AdminUserOnboarding /></DashboardLayout>)} />
      <Route path={"/admin/user-verification"} component={() => (<DashboardLayout><AdminUserVerification /></DashboardLayout>)} />
      <Route path={"/alert-management"} component={() => (<DashboardLayout><AlertManagement /></DashboardLayout>)} />
      <Route path={"/analytics"} component={() => (<DashboardLayout><Analytics /></DashboardLayout>)} />
      <Route path={"/announcements"} component={() => (<DashboardLayout><Announcements /></DashboardLayout>)} />
      <Route path={"/appointment-scheduler"} component={() => (<DashboardLayout><AppointmentScheduler /></DashboardLayout>)} />
      <Route path={"/appointment-scheduling"} component={() => (<DashboardLayout><AppointmentScheduling /></DashboardLayout>)} />
      <Route path={"/assigned-loads"} component={() => (<DashboardLayout><AssignedLoads /></DashboardLayout>)} />
      <Route path={"/audit-log"} component={() => (<DashboardLayout><AuditLog /></DashboardLayout>)} />
      <Route path={"/audit-logs"} component={() => (<DashboardLayout><AuditLogs /></DashboardLayout>)} />
      <Route path={"/audits"} component={() => (<DashboardLayout><Audits /></DashboardLayout>)} />
      <Route path={"/bol-generation"} component={() => (<DashboardLayout><BOLGeneration /></DashboardLayout>)} />
      <Route path={"/bol-management"} component={() => (<DashboardLayout><BOLManagement /></DashboardLayout>)} />
      <Route path={"/background-checks"} component={() => (<DashboardLayout><BackgroundChecks /></DashboardLayout>)} />
      <Route path={"/backup-management"} component={() => (<DashboardLayout><BackupManagement /></DashboardLayout>)} />
      <Route path={"/benefits-management"} component={() => (<DashboardLayout><BenefitsManagement /></DashboardLayout>)} />
      <Route path={"/bid-analysis"} component={() => (<DashboardLayout><BidAnalysis /></DashboardLayout>)} />
      <Route path={"/bid-details"} component={() => (<DashboardLayout><BidDetails /></DashboardLayout>)} />
      <Route path={"/bid-history"} component={() => (<DashboardLayout><BidHistory /></DashboardLayout>)} />
      <Route path={"/bid-management"} component={() => (<DashboardLayout><BidManagement /></DashboardLayout>)} />
      <Route path={"/billing"} component={() => (<DashboardLayout><Billing /></DashboardLayout>)} />
      <Route path={"/billing-history"} component={() => (<DashboardLayout><BillingHistory /></DashboardLayout>)} />
      <Route path={"/billing-settings"} component={() => (<DashboardLayout><BillingSettings /></DashboardLayout>)} />
      <Route path={"/bookmarks"} component={() => (<DashboardLayout><Bookmarks /></DashboardLayout>)} />
      <Route path={"/broadcast-messages"} component={() => (<DashboardLayout><BroadcastMessages /></DashboardLayout>)} />
      <Route path={"/broker/analytics"} component={() => (<DashboardLayout><BrokerAnalytics /></DashboardLayout>)} />
      <Route path={"/broker/carrier-capacity"} component={() => (<DashboardLayout><BrokerCarrierCapacity /></DashboardLayout>)} />
      <Route path={"/broker/carrier-network"} component={() => (<DashboardLayout><BrokerCarrierNetwork /></DashboardLayout>)} />
      <Route path={"/broker/carrier-onboarding"} component={() => (<DashboardLayout><BrokerCarrierOnboarding /></DashboardLayout>)} />
      <Route path={"/broker/carrier-prequalification"} component={() => (<DashboardLayout><BrokerCarrierPrequalification /></DashboardLayout>)} />
      <Route path={"/broker/carrier-vetting"} component={() => (<DashboardLayout><BrokerCarrierVetting /></DashboardLayout>)} />
      <Route path={"/broker/carriers"} component={() => (<DashboardLayout><BrokerCarriers /></DashboardLayout>)} />
      <Route path={"/broker/commission-detail"} component={() => (<DashboardLayout><BrokerCommissionDetail /></DashboardLayout>)} />
      <Route path={"/broker/compliance"} component={() => (<DashboardLayout><BrokerCompliance /></DashboardLayout>)} />
      <Route path={"/broker/customer-management"} component={() => (<DashboardLayout><BrokerCustomerManagement /></DashboardLayout>)} />
      <Route path={"/broker/dashboard"} component={() => (<DashboardLayout><BrokerDashboard /></DashboardLayout>)} />
      <Route path={"/broker/lane-rates"} component={() => (<DashboardLayout><BrokerLaneRates /></DashboardLayout>)} />
      <Route path={"/broker/load-board"} component={() => (<DashboardLayout><BrokerLoadBoard /></DashboardLayout>)} />
      <Route path={"/broker/load-matching"} component={() => (<DashboardLayout><BrokerLoadMatching /></DashboardLayout>)} />
      <Route path={"/broker/load-profitability"} component={() => (<DashboardLayout><BrokerLoadProfitability /></DashboardLayout>)} />
      <Route path={"/broker/margin-analysis"} component={() => (<DashboardLayout><BrokerMarginAnalysis /></DashboardLayout>)} />
      <Route path={"/broker/marketplace"} component={() => (<DashboardLayout><BrokerMarketplace /></DashboardLayout>)} />
      <Route path={"/broker/payments"} component={() => (<DashboardLayout><BrokerPayments /></DashboardLayout>)} />
      <Route path={"/broker/quote-builder"} component={() => (<DashboardLayout><BrokerQuoteBuilder /></DashboardLayout>)} />
      <Route path={"/broker/shipper-management"} component={() => (<DashboardLayout><BrokerShipperManagement /></DashboardLayout>)} />
      <Route path={"/csa-scores"} component={() => (<DashboardLayout><CSAScores /></DashboardLayout>)} />
      <Route path={"/csa-scores-dashboard"} component={() => (<DashboardLayout><CSAScoresDashboard /></DashboardLayout>)} />
      <Route path={"/cache-management"} component={() => (<DashboardLayout><CacheManagement /></DashboardLayout>)} />
      <Route path={"/capacity-board"} component={() => (<DashboardLayout><CapacityBoard /></DashboardLayout>)} />
      <Route path={"/carrier/analytics"} component={() => (<DashboardLayout><CarrierAnalytics /></DashboardLayout>)} />
      <Route path={"/carrier/bid-submission"} component={() => (<DashboardLayout><CarrierBidSubmission /></DashboardLayout>)} />
      <Route path={"/carrier/bid-submit"} component={() => (<DashboardLayout><CarrierBidSubmit /></DashboardLayout>)} />
      <Route path={"/carrier/capacity-board"} component={() => (<DashboardLayout><CarrierCapacityBoard /></DashboardLayout>)} />
      <Route path={"/carrier/compliance"} component={() => (<DashboardLayout><CarrierCompliance /></DashboardLayout>)} />
      <Route path={"/carrier/dashboard"} component={() => (<DashboardLayout><CarrierDashboard /></DashboardLayout>)} />
      <Route path={"/carrier/details"} component={() => (<DashboardLayout><CarrierDetails /></DashboardLayout>)} />
      <Route path={"/carrier/directory"} component={() => (<DashboardLayout><CarrierDirectory /></DashboardLayout>)} />
      <Route path={"/carrier/dispatch-board"} component={() => (<DashboardLayout><CarrierDispatchBoard /></DashboardLayout>)} />
      <Route path={"/carrier/driver-assignments"} component={() => (<DashboardLayout><CarrierDriverAssignments /></DashboardLayout>)} />
      <Route path={"/carrier/driver-management"} component={() => (<DashboardLayout><CarrierDriverManagement /></DashboardLayout>)} />
      <Route path={"/carrier/fleet-management"} component={() => (<DashboardLayout><CarrierFleetManagement /></DashboardLayout>)} />
      <Route path={"/carrier/fleet-overview"} component={() => (<DashboardLayout><CarrierFleetOverview /></DashboardLayout>)} />
      <Route path={"/carrier/insurance"} component={() => (<DashboardLayout><CarrierInsurance /></DashboardLayout>)} />
      <Route path={"/carrier/invoicing"} component={() => (<DashboardLayout><CarrierInvoicing /></DashboardLayout>)} />
      <Route path={"/carrier/load-history"} component={() => (<DashboardLayout><CarrierLoadHistory /></DashboardLayout>)} />
      <Route path={"/carrier/load-search"} component={() => (<DashboardLayout><CarrierLoadSearch /></DashboardLayout>)} />
      <Route path={"/carrier/packets"} component={() => (<DashboardLayout><CarrierPackets /></DashboardLayout>)} />
      <Route path={"/carrier/profile"} component={() => (<DashboardLayout><CarrierProfile /></DashboardLayout>)} />
      <Route path={"/carrier/profitability-analysis"} component={() => (<DashboardLayout><CarrierProfitabilityAnalysis /></DashboardLayout>)} />
      <Route path={"/carrier/safety-scores"} component={() => (<DashboardLayout><CarrierSafetyScores /></DashboardLayout>)} />
      <Route path={"/carrier/scorecard"} component={() => (<DashboardLayout><CarrierScorecard /></DashboardLayout>)} />
      <Route path={"/carrier/settlements"} component={() => (<DashboardLayout><CarrierSettlements /></DashboardLayout>)} />
      <Route path={"/carrier/vetting"} component={() => (<DashboardLayout><CarrierVetting /></DashboardLayout>)} />
      <Route path={"/carrier/vetting-details"} component={() => (<DashboardLayout><CarrierVettingDetails /></DashboardLayout>)} />
      <Route path={"/carrier/s"} component={() => (<DashboardLayout><Carriers /></DashboardLayout>)} />
      <Route path={"/catalyst/breakdown-response"} component={() => (<DashboardLayout><CatalystBreakdownResponse /></DashboardLayout>)} />
      <Route path={"/catalyst/carrier-capacity"} component={() => (<DashboardLayout><CatalystCarrierCapacity /></DashboardLayout>)} />
      <Route path={"/catalyst/dashboard"} component={() => (<DashboardLayout><CatalystDashboard /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-assignment"} component={() => (<DashboardLayout><CatalystDriverAssignment /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-performance"} component={() => (<DashboardLayout><CatalystDriverPerformance /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-scheduling"} component={() => (<DashboardLayout><CatalystDriverScheduling /></DashboardLayout>)} />
      <Route path={"/catalyst/exception-management"} component={() => (<DashboardLayout><CatalystExceptionManagement /></DashboardLayout>)} />
      <Route path={"/catalyst/exceptions"} component={() => (<DashboardLayout><CatalystExceptions /></DashboardLayout>)} />
      <Route path={"/catalyst/fleet-map"} component={() => (<DashboardLayout><CatalystFleetMap /></DashboardLayout>)} />
      <Route path={"/catalyst/load-board"} component={() => (<DashboardLayout><CatalystLoadBoard /></DashboardLayout>)} />
      <Route path={"/catalyst/load-matching"} component={() => (<DashboardLayout><CatalystLoadMatching /></DashboardLayout>)} />
      <Route path={"/catalyst/load-optimization"} component={() => (<DashboardLayout><CatalystLoadOptimization /></DashboardLayout>)} />
      <Route path={"/catalyst/performance"} component={() => (<DashboardLayout><CatalystPerformance /></DashboardLayout>)} />
      <Route path={"/catalyst/relief-driver"} component={() => (<DashboardLayout><CatalystReliefDriver /></DashboardLayout>)} />
      <Route path={"/change-password"} component={() => (<DashboardLayout><ChangePassword /></DashboardLayout>)} />
      <Route path={"/channels"} component={() => (<DashboardLayout><Channels /></DashboardLayout>)} />
      <Route path={"/claims-management"} component={() => (<DashboardLayout><ClaimsManagement /></DashboardLayout>)} />
      <Route path={"/clearinghouse"} component={() => (<DashboardLayout><Clearinghouse /></DashboardLayout>)} />
      <Route path={"/clearinghouse-dashboard"} component={() => (<DashboardLayout><ClearinghouseDashboard /></DashboardLayout>)} />
      <Route path={"/clearinghouse-queries"} component={() => (<DashboardLayout><ClearinghouseQueries /></DashboardLayout>)} />
      <Route path={"/commission"} component={() => (<DashboardLayout><Commission /></DashboardLayout>)} />
      <Route path={"/commission-tracking"} component={() => (<DashboardLayout><CommissionTracking /></DashboardLayout>)} />
      <Route path={"/companies"} component={() => (<DashboardLayout><Companies /></DashboardLayout>)} />
      <Route path={"/company"} component={() => (<DashboardLayout><Company /></DashboardLayout>)} />
      <Route path={"/company-billing"} component={() => (<DashboardLayout><CompanyBilling /></DashboardLayout>)} />
      <Route path={"/company-channels"} component={() => (<DashboardLayout><CompanyChannels /></DashboardLayout>)} />
      <Route path={"/company-documents"} component={() => (<DashboardLayout><CompanyDocuments /></DashboardLayout>)} />
      <Route path={"/company-management"} component={() => (<DashboardLayout><CompanyManagement /></DashboardLayout>)} />
      <Route path={"/company-profile"} component={() => (<DashboardLayout><CompanyProfile /></DashboardLayout>)} />
      <Route path={"/company-verification"} component={() => (<DashboardLayout><CompanyVerification /></DashboardLayout>)} />
      <Route path={"/competitor-analysis"} component={() => (<DashboardLayout><CompetitorAnalysis /></DashboardLayout>)} />
      <Route path={"/compliance/audits"} component={() => (<DashboardLayout><ComplianceAudits /></DashboardLayout>)} />
      <Route path={"/compliance/calendar"} component={() => (<DashboardLayout><ComplianceCalendar /></DashboardLayout>)} />
      <Route path={"/compliance/clearinghouse"} component={() => (<DashboardLayout><ComplianceClearinghouse /></DashboardLayout>)} />
      <Route path={"/compliance/dq-file"} component={() => (<DashboardLayout><ComplianceDQFile /></DashboardLayout>)} />
      <Route path={"/compliance/dashboard"} component={() => (<DashboardLayout><ComplianceDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/driver-qualification"} component={() => (<DashboardLayout><ComplianceDriverQualification /></DashboardLayout>)} />
      <Route path={"/compliance/drug-testing"} component={() => (<DashboardLayout><ComplianceDrugTesting /></DashboardLayout>)} />
      <Route path={"/compliance/hos-review"} component={() => (<DashboardLayout><ComplianceHOSReview /></DashboardLayout>)} />
      <Route path={"/compliance/log-audits"} component={() => (<DashboardLayout><ComplianceLogAudits /></DashboardLayout>)} />
      <Route path={"/compliance/medical-certificates"} component={() => (<DashboardLayout><ComplianceMedicalCertificates /></DashboardLayout>)} />
      <Route path={"/compliance/officer-dashboard"} component={() => (<DashboardLayout><ComplianceOfficerDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/training-records"} component={() => (<DashboardLayout><ComplianceTrainingRecords /></DashboardLayout>)} />
      <Route path={"/component-showcase"} component={() => (<DashboardLayout><ComponentShowcase /></DashboardLayout>)} />
      <Route path={"/connected-apps"} component={() => (<DashboardLayout><ConnectedApps /></DashboardLayout>)} />
      <Route path={"/content-moderation"} component={() => (<DashboardLayout><ContentModeration /></DashboardLayout>)} />
      <Route path={"/contract-management"} component={() => (<DashboardLayout><ContractManagement /></DashboardLayout>)} />
      <Route path={"/cookie-policy"} component={() => (<DashboardLayout><CookiePolicy /></DashboardLayout>)} />
      <Route path={"/create-load"} component={() => (<DashboardLayout><CreateLoad /></DashboardLayout>)} />
      <Route path={"/current-job"} component={() => (<DashboardLayout><CurrentJob /></DashboardLayout>)} />
      <Route path={"/customer-directory"} component={() => (<DashboardLayout><CustomerDirectory /></DashboardLayout>)} />
      <Route path={"/customer-feedback"} component={() => (<DashboardLayout><CustomerFeedback /></DashboardLayout>)} />
      <Route path={"/customer-management"} component={() => (<DashboardLayout><CustomerManagement /></DashboardLayout>)} />
      <Route path={"/dq-file-management"} component={() => (<DashboardLayout><DQFileManagement /></DashboardLayout>)} />
      <Route path={"/dvir"} component={() => (<DashboardLayout><DVIR /></DashboardLayout>)} />
      <Route path={"/dvir-management"} component={() => (<DashboardLayout><DVIRManagement /></DashboardLayout>)} />
      <Route path={"/dashboard"} component={() => (<DashboardLayout><Dashboard /></DashboardLayout>)} />
      <Route path={"/dashboard-customizer"} component={() => (<DashboardLayout><DashboardCustomizer /></DashboardLayout>)} />
      <Route path={"/data-export"} component={() => (<DashboardLayout><DataExport /></DashboardLayout>)} />
      <Route path={"/data-exports"} component={() => (<DashboardLayout><DataExports /></DashboardLayout>)} />
      <Route path={"/data-import"} component={() => (<DashboardLayout><DataImport /></DashboardLayout>)} />
      <Route path={"/data-retention"} component={() => (<DashboardLayout><DataRetention /></DashboardLayout>)} />
      <Route path={"/database-health"} component={() => (<DashboardLayout><DatabaseHealth /></DashboardLayout>)} />
      <Route path={"/deadhead-analysis"} component={() => (<DashboardLayout><DeadheadAnalysis /></DashboardLayout>)} />
      <Route path={"/detention-tracking"} component={() => (<DashboardLayout><DetentionTracking /></DashboardLayout>)} />
      <Route path={"/diagnostics"} component={() => (<DashboardLayout><Diagnostics /></DashboardLayout>)} />
      <Route path={"/digital-signatures"} component={() => (<DashboardLayout><DigitalSignatures /></DashboardLayout>)} />
      <Route path={"/dispatch-assignment"} component={() => (<DashboardLayout><DispatchAssignment /></DashboardLayout>)} />
      <Route path={"/dispatch-board"} component={() => (<DashboardLayout><DispatchBoard /></DashboardLayout>)} />
      <Route path={"/dispatch-dashboard"} component={() => (<DashboardLayout><DispatchDashboard /></DashboardLayout>)} />
      <Route path={"/dispute-resolution"} component={() => (<DashboardLayout><DisputeResolution /></DashboardLayout>)} />
      <Route path={"/document-center"} component={() => (<DashboardLayout><DocumentCenter /></DashboardLayout>)} />
      <Route path={"/documents"} component={() => (<DashboardLayout><Documents /></DashboardLayout>)} />
      <Route path={"/driver/applications"} component={() => (<DashboardLayout><DriverApplications /></DashboardLayout>)} />
      <Route path={"/driver/bol-sign"} component={() => (<DashboardLayout><DriverBOLSign /></DashboardLayout>)} />
      <Route path={"/driver/check-in"} component={() => (<DashboardLayout><DriverCheckIn /></DashboardLayout>)} />
      <Route path={"/driver/compensation"} component={() => (<DashboardLayout><DriverCompensation /></DashboardLayout>)} />
      <Route path={"/driver/compliance"} component={() => (<DashboardLayout><DriverCompliance /></DashboardLayout>)} />
      <Route path={"/driver/current-job"} component={() => (<DashboardLayout><DriverCurrentJob /></DashboardLayout>)} />
      <Route path={"/driver/dashboard"} component={() => (<DashboardLayout><DriverDashboard /></DashboardLayout>)} />
      <Route path={"/driver/details"} component={() => (<DashboardLayout><DriverDetails /></DashboardLayout>)} />
      <Route path={"/driver/directory"} component={() => (<DashboardLayout><DriverDirectory /></DashboardLayout>)} />
      <Route path={"/driver/documents"} component={() => (<DashboardLayout><DriverDocuments /></DashboardLayout>)} />
      <Route path={"/driver/earnings"} component={() => (<DashboardLayout><DriverEarnings /></DashboardLayout>)} />
      <Route path={"/driver/expense-report"} component={() => (<DashboardLayout><DriverExpenseReport /></DashboardLayout>)} />
      <Route path={"/driver/fuel-locator"} component={() => (<DashboardLayout><DriverFuelLocator /></DashboardLayout>)} />
      <Route path={"/driver/fuel-purchase"} component={() => (<DashboardLayout><DriverFuelPurchase /></DashboardLayout>)} />
      <Route path={"/driver/hos"} component={() => (<DashboardLayout><DriverHOS /></DashboardLayout>)} />
      <Route path={"/driver/hos-dashboard"} component={() => (<DashboardLayout><DriverHOSDashboard /></DashboardLayout>)} />
      <Route path={"/driver/issue-report"} component={() => (<DashboardLayout><DriverIssueReport /></DashboardLayout>)} />
      <Route path={"/driver/load-history"} component={() => (<DashboardLayout><DriverLoadHistory /></DashboardLayout>)} />
      <Route path={"/driver/management"} component={() => (<DashboardLayout><DriverManagement /></DashboardLayout>)} />
      <Route path={"/driver/messages"} component={() => (<DashboardLayout><DriverMessages /></DashboardLayout>)} />
      <Route path={"/driver/mobile-app"} component={() => (<DashboardLayout><DriverMobileApp /></DashboardLayout>)} />
      <Route path={"/driver/navigation"} component={() => (<DashboardLayout><DriverNavigation /></DashboardLayout>)} />
      <Route path={"/driver/onboarding"} component={() => (<DashboardLayout><DriverOnboarding /></DashboardLayout>)} />
      <Route path={"/driver/pod-capture"} component={() => (<DashboardLayout><DriverPODCapture /></DashboardLayout>)} />
      <Route path={"/driver/pay-statements"} component={() => (<DashboardLayout><DriverPayStatements /></DashboardLayout>)} />
      <Route path={"/driver/payroll"} component={() => (<DashboardLayout><DriverPayroll /></DashboardLayout>)} />
      <Route path={"/driver/performance"} component={() => (<DashboardLayout><DriverPerformance /></DashboardLayout>)} />
      <Route path={"/driver/pre-trip"} component={() => (<DashboardLayout><DriverPreTrip /></DashboardLayout>)} />
      <Route path={"/driver/pre-trip-inspection"} component={() => (<DashboardLayout><DriverPreTripInspection /></DashboardLayout>)} />
      <Route path={"/driver/rest-stops"} component={() => (<DashboardLayout><DriverRestStops /></DashboardLayout>)} />
      <Route path={"/driver/safety-scorecard"} component={() => (<DashboardLayout><DriverSafetyScorecard /></DashboardLayout>)} />
      <Route path={"/driver/scorecard"} component={() => (<DashboardLayout><DriverScorecard /></DashboardLayout>)} />
      <Route path={"/driver/scorecards"} component={() => (<DashboardLayout><DriverScorecards /></DashboardLayout>)} />
      <Route path={"/driver/settlement"} component={() => (<DashboardLayout><DriverSettlement /></DashboardLayout>)} />
      <Route path={"/driver/status"} component={() => (<DashboardLayout><DriverStatus /></DashboardLayout>)} />
      <Route path={"/driver/terminations"} component={() => (<DashboardLayout><DriverTerminations /></DashboardLayout>)} />
      <Route path={"/driver/time-off"} component={() => (<DashboardLayout><DriverTimeOff /></DashboardLayout>)} />
      <Route path={"/driver/tracking"} component={() => (<DashboardLayout><DriverTracking /></DashboardLayout>)} />
      <Route path={"/driver/training"} component={() => (<DashboardLayout><DriverTraining /></DashboardLayout>)} />
      <Route path={"/driver/vehicle"} component={() => (<DashboardLayout><DriverVehicle /></DashboardLayout>)} />
      <Route path={"/driver/weather-alerts"} component={() => (<DashboardLayout><DriverWeatherAlerts /></DashboardLayout>)} />
      <Route path={"/driver/s"} component={() => (<DashboardLayout><Drivers /></DashboardLayout>)} />
      <Route path={"/drug-alcohol-testing"} component={() => (<DashboardLayout><DrugAlcoholTesting /></DashboardLayout>)} />
      <Route path={"/eia-reporting"} component={() => (<DashboardLayout><EIAReporting /></DashboardLayout>)} />
      <Route path={"/eld-integration"} component={() => (<DashboardLayout><ELDIntegration /></DashboardLayout>)} />
      <Route path={"/eld-logs"} component={() => (<DashboardLayout><ELDLogs /></DashboardLayout>)} />
      <Route path={"/erg-guide"} component={() => (<DashboardLayout><ERGGuide /></DashboardLayout>)} />
      <Route path={"/erg-lookup"} component={() => (<DashboardLayout><ERGLookup /></DashboardLayout>)} />
      <Route path={"/esang-chat"} component={() => (<DashboardLayout><ESANGChat /></DashboardLayout>)} />
      <Route path={"/earnings"} component={() => (<DashboardLayout><Earnings /></DashboardLayout>)} />
      <Route path={"/email-logs"} component={() => (<DashboardLayout><EmailLogs /></DashboardLayout>)} />
      <Route path={"/email-templates"} component={() => (<DashboardLayout><EmailTemplates /></DashboardLayout>)} />
      <Route path={"/employment-history"} component={() => (<DashboardLayout><EmploymentHistory /></DashboardLayout>)} />
      <Route path={"/equipment-management"} component={() => (<DashboardLayout><EquipmentManagement /></DashboardLayout>)} />
      <Route path={"/equipment-tracking"} component={() => (<DashboardLayout><EquipmentTracking /></DashboardLayout>)} />
      <Route path={"/erg"} component={() => (<DashboardLayout><Erg /></DashboardLayout>)} />
      <Route path={"/error-logs"} component={() => (<DashboardLayout><ErrorLogs /></DashboardLayout>)} />
      <Route path={"/escort/certification-renewal"} component={() => (<DashboardLayout><EscortCertificationRenewal /></DashboardLayout>)} />
      <Route path={"/escort/certifications"} component={() => (<DashboardLayout><EscortCertifications /></DashboardLayout>)} />
      <Route path={"/escort/client-management"} component={() => (<DashboardLayout><EscortClientManagement /></DashboardLayout>)} />
      <Route path={"/escort/communications"} component={() => (<DashboardLayout><EscortCommunications /></DashboardLayout>)} />
      <Route path={"/escort/convoy-comm"} component={() => (<DashboardLayout><EscortConvoyComm /></DashboardLayout>)} />
      <Route path={"/escort/dashboard"} component={() => (<DashboardLayout><EscortDashboard /></DashboardLayout>)} />
      <Route path={"/escort/earnings"} component={() => (<DashboardLayout><EscortEarnings /></DashboardLayout>)} />
      <Route path={"/escort/equipment-management"} component={() => (<DashboardLayout><EscortEquipmentManagement /></DashboardLayout>)} />
      <Route path={"/escort/height-pole"} component={() => (<DashboardLayout><EscortHeightPole /></DashboardLayout>)} />
      <Route path={"/escort/incidents"} component={() => (<DashboardLayout><EscortIncidents /></DashboardLayout>)} />
      <Route path={"/escort/job-acceptance"} component={() => (<DashboardLayout><EscortJobAcceptance /></DashboardLayout>)} />
      <Route path={"/escort/job-marketplace"} component={() => (<DashboardLayout><EscortJobMarketplace /></DashboardLayout>)} />
      <Route path={"/escort/jobs"} component={() => (<DashboardLayout><EscortJobs /></DashboardLayout>)} />
      <Route path={"/escort/pay-history"} component={() => (<DashboardLayout><EscortPayHistory /></DashboardLayout>)} />
      <Route path={"/escort/permits"} component={() => (<DashboardLayout><EscortPermits /></DashboardLayout>)} />
      <Route path={"/escort/reports"} component={() => (<DashboardLayout><EscortReports /></DashboardLayout>)} />
      <Route path={"/escort/route-history"} component={() => (<DashboardLayout><EscortRouteHistory /></DashboardLayout>)} />
      <Route path={"/escort/route-planning"} component={() => (<DashboardLayout><EscortRoutePlanning /></DashboardLayout>)} />
      <Route path={"/escort/schedule"} component={() => (<DashboardLayout><EscortSchedule /></DashboardLayout>)} />
      <Route path={"/escort/training"} component={() => (<DashboardLayout><EscortTraining /></DashboardLayout>)} />
      <Route path={"/escort/vehicle-inspection"} component={() => (<DashboardLayout><EscortVehicleInspection /></DashboardLayout>)} />
      <Route path={"/euso-ticket"} component={() => (<DashboardLayout><EusoTicket /></DashboardLayout>)} />
      <Route path={"/exception-management"} component={() => (<DashboardLayout><ExceptionManagement /></DashboardLayout>)} />
      <Route path={"/expense-reports"} component={() => (<DashboardLayout><ExpenseReports /></DashboardLayout>)} />
      <Route path={"/facility"} component={() => (<DashboardLayout><Facility /></DashboardLayout>)} />
      <Route path={"/factoring-dashboard"} component={() => (<DashboardLayout><FactoringDashboard /></DashboardLayout>)} />
      <Route path={"/factoring-integration"} component={() => (<DashboardLayout><FactoringIntegration /></DashboardLayout>)} />
      <Route path={"/factoring-services"} component={() => (<DashboardLayout><FactoringServices /></DashboardLayout>)} />
      <Route path={"/feature-flags"} component={() => (<DashboardLayout><FeatureFlags /></DashboardLayout>)} />
      <Route path={"/feature-requests"} component={() => (<DashboardLayout><FeatureRequests /></DashboardLayout>)} />
      <Route path={"/feedback-surveys"} component={() => (<DashboardLayout><FeedbackSurveys /></DashboardLayout>)} />
      <Route path={"/find-loads"} component={() => (<DashboardLayout><FindLoads /></DashboardLayout>)} />
      <Route path={"/fleet"} component={() => (<DashboardLayout><Fleet /></DashboardLayout>)} />
      <Route path={"/fleet-compliance"} component={() => (<DashboardLayout><FleetCompliance /></DashboardLayout>)} />
      <Route path={"/fleet-insurance"} component={() => (<DashboardLayout><FleetInsurance /></DashboardLayout>)} />
      <Route path={"/fleet-management"} component={() => (<DashboardLayout><FleetManagement /></DashboardLayout>)} />
      <Route path={"/fleet-map"} component={() => (<DashboardLayout><FleetMap /></DashboardLayout>)} />
      <Route path={"/fleet-overview"} component={() => (<DashboardLayout><FleetOverview /></DashboardLayout>)} />
      <Route path={"/fleet-tracking"} component={() => (<DashboardLayout><FleetTracking /></DashboardLayout>)} />
      <Route path={"/fuel-card-management"} component={() => (<DashboardLayout><FuelCardManagement /></DashboardLayout>)} />
      <Route path={"/fuel-management"} component={() => (<DashboardLayout><FuelManagement /></DashboardLayout>)} />
      <Route path={"/fuel-prices"} component={() => (<DashboardLayout><FuelPrices /></DashboardLayout>)} />
      <Route path={"/fuel-tracking"} component={() => (<DashboardLayout><FuelTracking /></DashboardLayout>)} />
      <Route path={"/gps-tracking"} component={() => (<DashboardLayout><GPSTracking /></DashboardLayout>)} />
      <Route path={"/geofence-management"} component={() => (<DashboardLayout><GeofenceManagement /></DashboardLayout>)} />
      <Route path={"/global-search"} component={() => (<DashboardLayout><GlobalSearch /></DashboardLayout>)} />
      <Route path={"/hos-compliance"} component={() => (<DashboardLayout><HOSCompliance /></DashboardLayout>)} />
      <Route path={"/hos-tracker"} component={() => (<DashboardLayout><HOSTracker /></DashboardLayout>)} />
      <Route path={"/hazmat-certifications"} component={() => (<DashboardLayout><HazmatCertifications /></DashboardLayout>)} />
      <Route path={"/hazmat-shipments"} component={() => (<DashboardLayout><HazmatShipments /></DashboardLayout>)} />
      <Route path={"/help-center"} component={() => (<DashboardLayout><HelpCenter /></DashboardLayout>)} />
      <Route path={"/home"} component={() => (<DashboardLayout><Home /></DashboardLayout>)} />
      <Route path={"/ifta-reporting"} component={() => (<DashboardLayout><IFTAReporting /></DashboardLayout>)} />
      <Route path={"/in-transit"} component={() => (<DashboardLayout><InTransit /></DashboardLayout>)} />
      <Route path={"/incident-report"} component={() => (<DashboardLayout><IncidentReport /></DashboardLayout>)} />
      <Route path={"/incident-reporting"} component={() => (<DashboardLayout><IncidentReporting /></DashboardLayout>)} />
      <Route path={"/incoming-shipments"} component={() => (<DashboardLayout><IncomingShipments /></DashboardLayout>)} />
      <Route path={"/industry-directory"} component={() => (<DashboardLayout><IndustryDirectory /></DashboardLayout>)} />
      <Route path={"/insurance-certificates"} component={() => (<DashboardLayout><InsuranceCertificates /></DashboardLayout>)} />
      <Route path={"/insurance-dashboard"} component={() => (<DashboardLayout><InsuranceDashboard /></DashboardLayout>)} />
      <Route path={"/insurance-management"} component={() => (<DashboardLayout><InsuranceManagement /></DashboardLayout>)} />
      <Route path={"/integration-settings"} component={() => (<DashboardLayout><IntegrationSettings /></DashboardLayout>)} />
      <Route path={"/invoice-details"} component={() => (<DashboardLayout><InvoiceDetails /></DashboardLayout>)} />
      <Route path={"/invoice-management"} component={() => (<DashboardLayout><InvoiceManagement /></DashboardLayout>)} />
      <Route path={"/jobs"} component={() => (<DashboardLayout><Jobs /></DashboardLayout>)} />
      <Route path={"/knowledge-base"} component={() => (<DashboardLayout><KnowledgeBase /></DashboardLayout>)} />
      <Route path={"/lane-analysis"} component={() => (<DashboardLayout><LaneAnalysis /></DashboardLayout>)} />
      <Route path={"/lane-rates"} component={() => (<DashboardLayout><LaneRates /></DashboardLayout>)} />
      <Route path={"/leaderboard"} component={() => (<DashboardLayout><Leaderboard /></DashboardLayout>)} />
      <Route path={"/license-management"} component={() => (<DashboardLayout><LicenseManagement /></DashboardLayout>)} />
      <Route path={"/live-chat"} component={() => (<DashboardLayout><LiveChat /></DashboardLayout>)} />
      <Route path={"/live-news-feed"} component={() => (<DashboardLayout><LiveNewsFeed /></DashboardLayout>)} />
      <Route path={"/load-acceptance"} component={() => (<DashboardLayout><LoadAcceptance /></DashboardLayout>)} />
      <Route path={"/load-bids"} component={() => (<DashboardLayout><LoadBids /></DashboardLayout>)} />
      <Route path={"/load-board"} component={() => (<DashboardLayout><LoadBoard /></DashboardLayout>)} />
      <Route path={"/load-create"} component={() => (<DashboardLayout><LoadCreate /></DashboardLayout>)} />
      <Route path={"/load-creation-wizard"} component={() => (<DashboardLayout><LoadCreationWizard /></DashboardLayout>)} />
      <Route path={"/load-details"} component={() => (<DashboardLayout><LoadDetails /></DashboardLayout>)} />
      <Route path={"/load-history"} component={() => (<DashboardLayout><LoadHistory /></DashboardLayout>)} />
      <Route path={"/load-negotiation"} component={() => (<DashboardLayout><LoadNegotiation /></DashboardLayout>)} />
      <Route path={"/load-tracking"} component={() => (<DashboardLayout><LoadTracking /></DashboardLayout>)} />
      <Route path={"/load-wizard"} component={() => (<DashboardLayout><LoadWizard /></DashboardLayout>)} />
      <Route path={"/loading-bays"} component={() => (<DashboardLayout><LoadingBays /></DashboardLayout>)} />
      <Route path={"/login"} component={() => (<DashboardLayout><Login /></DashboardLayout>)} />
      <Route path={"/login-history"} component={() => (<DashboardLayout><LoginHistory /></DashboardLayout>)} />
      <Route path={"/mvr-reports"} component={() => (<DashboardLayout><MVRReports /></DashboardLayout>)} />
      <Route path={"/maintenance"} component={() => (<DashboardLayout><Maintenance /></DashboardLayout>)} />
      <Route path={"/maintenance-schedule"} component={() => (<DashboardLayout><MaintenanceSchedule /></DashboardLayout>)} />
      <Route path={"/market-intelligence"} component={() => (<DashboardLayout><MarketIntelligence /></DashboardLayout>)} />
      <Route path={"/marketplace"} component={() => (<DashboardLayout><Marketplace /></DashboardLayout>)} />
      <Route path={"/matched-loads"} component={() => (<DashboardLayout><MatchedLoads /></DashboardLayout>)} />
      <Route path={"/medical-certifications"} component={() => (<DashboardLayout><MedicalCertifications /></DashboardLayout>)} />
      <Route path={"/messages"} component={() => (<DashboardLayout><Messages /></DashboardLayout>)} />
      <Route path={"/messaging-center"} component={() => (<DashboardLayout><MessagingCenter /></DashboardLayout>)} />
      <Route path={"/mileage-calculator"} component={() => (<DashboardLayout><MileageCalculator /></DashboardLayout>)} />
      <Route path={"/missions"} component={() => (<DashboardLayout><Missions /></DashboardLayout>)} />
      <Route path={"/my-loads"} component={() => (<DashboardLayout><MyLoads /></DashboardLayout>)} />
      <Route path={"/news-feed"} component={() => (<DashboardLayout><NewsFeed /></DashboardLayout>)} />
      <Route path={"/notification-center"} component={() => (<DashboardLayout><NotificationCenter /></DashboardLayout>)} />
      <Route path={"/notification-settings"} component={() => (<DashboardLayout><NotificationSettings /></DashboardLayout>)} />
      <Route path={"/notifications"} component={() => (<DashboardLayout><Notifications /></DashboardLayout>)} />
      <Route path={"/notifications-center"} component={() => (<DashboardLayout><NotificationsCenter /></DashboardLayout>)} />
      <Route path={"/on-time-performance"} component={() => (<DashboardLayout><OnTimePerformance /></DashboardLayout>)} />
      <Route path={"/onboarding"} component={() => (<DashboardLayout><Onboarding /></DashboardLayout>)} />
      <Route path={"/onboarding-company-setup"} component={() => (<DashboardLayout><OnboardingCompanySetup /></DashboardLayout>)} />
      <Route path={"/onboarding-documents"} component={() => (<DashboardLayout><OnboardingDocuments /></DashboardLayout>)} />
      <Route path={"/opportunities"} component={() => (<DashboardLayout><Opportunities /></DashboardLayout>)} />
      <Route path={"/outgoing-shipments"} component={() => (<DashboardLayout><OutgoingShipments /></DashboardLayout>)} />
      <Route path={"/pod-management"} component={() => (<DashboardLayout><PODManagement /></DashboardLayout>)} />
      <Route path={"/psp-reports"} component={() => (<DashboardLayout><PSPReports /></DashboardLayout>)} />
      <Route path={"/password-change"} component={() => (<DashboardLayout><PasswordChange /></DashboardLayout>)} />
      <Route path={"/payment-history"} component={() => (<DashboardLayout><PaymentHistory /></DashboardLayout>)} />
      <Route path={"/payment-methods"} component={() => (<DashboardLayout><PaymentMethods /></DashboardLayout>)} />
      <Route path={"/payment-processing"} component={() => (<DashboardLayout><PaymentProcessing /></DashboardLayout>)} />
      <Route path={"/payments"} component={() => (<DashboardLayout><Payments /></DashboardLayout>)} />
      <Route path={"/payroll-management"} component={() => (<DashboardLayout><PayrollManagement /></DashboardLayout>)} />
      <Route path={"/performance-monitor"} component={() => (<DashboardLayout><PerformanceMonitor /></DashboardLayout>)} />
      <Route path={"/performance-reports"} component={() => (<DashboardLayout><PerformanceReports /></DashboardLayout>)} />
      <Route path={"/performance-reviews"} component={() => (<DashboardLayout><PerformanceReviews /></DashboardLayout>)} />
      <Route path={"/permit-management"} component={() => (<DashboardLayout><PermitManagement /></DashboardLayout>)} />
      <Route path={"/permit-requirements"} component={() => (<DashboardLayout><PermitRequirements /></DashboardLayout>)} />
      <Route path={"/permits"} component={() => (<DashboardLayout><Permits /></DashboardLayout>)} />
      <Route path={"/platform-analytics"} component={() => (<DashboardLayout><PlatformAnalytics /></DashboardLayout>)} />
      <Route path={"/platform-health"} component={() => (<DashboardLayout><PlatformHealth /></DashboardLayout>)} />
      <Route path={"/pre-trip-checklist"} component={() => (<DashboardLayout><PreTripChecklist /></DashboardLayout>)} />
      <Route path={"/pre-trip-inspection"} component={() => (<DashboardLayout><PreTripInspection /></DashboardLayout>)} />
      <Route path={"/preferences"} component={() => (<DashboardLayout><Preferences /></DashboardLayout>)} />
      <Route path={"/privacy-policy"} component={() => (<DashboardLayout><PrivacyPolicy /></DashboardLayout>)} />
      <Route path={"/procedures"} component={() => (<DashboardLayout><Procedures /></DashboardLayout>)} />
      <Route path={"/profile"} component={() => (<DashboardLayout><Profile /></DashboardLayout>)} />
      <Route path={"/push-notifications"} component={() => (<DashboardLayout><PushNotifications /></DashboardLayout>)} />
      <Route path={"/queue-monitor"} component={() => (<DashboardLayout><QueueMonitor /></DashboardLayout>)} />
      <Route path={"/quick-actions"} component={() => (<DashboardLayout><QuickActions /></DashboardLayout>)} />
      <Route path={"/quote-management"} component={() => (<DashboardLayout><QuoteManagement /></DashboardLayout>)} />
      <Route path={"/quote-requests"} component={() => (<DashboardLayout><QuoteRequests /></DashboardLayout>)} />
      <Route path={"/rack-status"} component={() => (<DashboardLayout><RackStatus /></DashboardLayout>)} />
      <Route path={"/rate-calculator"} component={() => (<DashboardLayout><RateCalculator /></DashboardLayout>)} />
      <Route path={"/rate-confirmation-sign"} component={() => (<DashboardLayout><RateConfirmationSign /></DashboardLayout>)} />
      <Route path={"/rate-confirmations"} component={() => (<DashboardLayout><RateConfirmations /></DashboardLayout>)} />
      <Route path={"/rate-limiting"} component={() => (<DashboardLayout><RateLimiting /></DashboardLayout>)} />
      <Route path={"/rate-management"} component={() => (<DashboardLayout><RateManagement /></DashboardLayout>)} />
      <Route path={"/referral-program"} component={() => (<DashboardLayout><ReferralProgram /></DashboardLayout>)} />
      <Route path={"/register"} component={() => (<DashboardLayout><Register /></DashboardLayout>)} />
      <Route path={"/register-broker"} component={() => (<DashboardLayout><RegisterBroker /></DashboardLayout>)} />
      <Route path={"/register-carrier"} component={() => (<DashboardLayout><RegisterCarrier /></DashboardLayout>)} />
      <Route path={"/register-catalyst"} component={() => (<DashboardLayout><RegisterCatalyst /></DashboardLayout>)} />
      <Route path={"/register-compliance"} component={() => (<DashboardLayout><RegisterCompliance /></DashboardLayout>)} />
      <Route path={"/register-driver"} component={() => (<DashboardLayout><RegisterDriver /></DashboardLayout>)} />
      <Route path={"/register-escort"} component={() => (<DashboardLayout><RegisterEscort /></DashboardLayout>)} />
      <Route path={"/register-safety"} component={() => (<DashboardLayout><RegisterSafety /></DashboardLayout>)} />
      <Route path={"/register-shipper"} component={() => (<DashboardLayout><RegisterShipper /></DashboardLayout>)} />
      <Route path={"/register-terminal"} component={() => (<DashboardLayout><RegisterTerminal /></DashboardLayout>)} />
      <Route path={"/release-notes"} component={() => (<DashboardLayout><ReleaseNotes /></DashboardLayout>)} />
      <Route path={"/report-builder"} component={() => (<DashboardLayout><ReportBuilder /></DashboardLayout>)} />
      <Route path={"/reporting-dashboard"} component={() => (<DashboardLayout><ReportingDashboard /></DashboardLayout>)} />
      <Route path={"/rest-stops"} component={() => (<DashboardLayout><RestStops /></DashboardLayout>)} />
      <Route path={"/revenue-analytics"} component={() => (<DashboardLayout><RevenueAnalytics /></DashboardLayout>)} />
      <Route path={"/rewards"} component={() => (<DashboardLayout><Rewards /></DashboardLayout>)} />
      <Route path={"/rewards-center"} component={() => (<DashboardLayout><RewardsCenter /></DashboardLayout>)} />
      <Route path={"/road-test-records"} component={() => (<DashboardLayout><RoadTestRecords /></DashboardLayout>)} />
      <Route path={"/role-permissions"} component={() => (<DashboardLayout><RolePermissions /></DashboardLayout>)} />
      <Route path={"/route-planning"} component={() => (<DashboardLayout><RoutePlanning /></DashboardLayout>)} />
      <Route path={"/run-tickets"} component={() => (<DashboardLayout><RunTickets /></DashboardLayout>)} />
      <Route path={"/safer-lookup"} component={() => (<DashboardLayout><SAFERLookup /></DashboardLayout>)} />
      <Route path={"/scada"} component={() => (<DashboardLayout><SCADA /></DashboardLayout>)} />
      <Route path={"/scada-monitor"} component={() => (<DashboardLayout><SCADAMonitor /></DashboardLayout>)} />
      <Route path={"/sms-notifications"} component={() => (<DashboardLayout><SMSNotifications /></DashboardLayout>)} />
      <Route path={"/safety/accident-reports"} component={() => (<DashboardLayout><SafetyAccidentReports /></DashboardLayout>)} />
      <Route path={"/safety/csa-scores"} component={() => (<DashboardLayout><SafetyCSAScores /></DashboardLayout>)} />
      <Route path={"/safety/dashboard"} component={() => (<DashboardLayout><SafetyDashboard /></DashboardLayout>)} />
      <Route path={"/safety/driver-behavior"} component={() => (<DashboardLayout><SafetyDriverBehavior /></DashboardLayout>)} />
      <Route path={"/safety/equipment-inspections"} component={() => (<DashboardLayout><SafetyEquipmentInspections /></DashboardLayout>)} />
      <Route path={"/safety/incident-investigation"} component={() => (<DashboardLayout><SafetyIncidentInvestigation /></DashboardLayout>)} />
      <Route path={"/safety/incident-reporting"} component={() => (<DashboardLayout><SafetyIncidentReporting /></DashboardLayout>)} />
      <Route path={"/safety/incident-tracking"} component={() => (<DashboardLayout><SafetyIncidentTracking /></DashboardLayout>)} />
      <Route path={"/safety/incidents"} component={() => (<DashboardLayout><SafetyIncidents /></DashboardLayout>)} />
      <Route path={"/safety/inspection-reports"} component={() => (<DashboardLayout><SafetyInspectionReports /></DashboardLayout>)} />
      <Route path={"/safety/manager-dashboard"} component={() => (<DashboardLayout><SafetyManagerDashboard /></DashboardLayout>)} />
      <Route path={"/safety/meetings"} component={() => (<DashboardLayout><SafetyMeetings /></DashboardLayout>)} />
      <Route path={"/safety/metrics"} component={() => (<DashboardLayout><SafetyMetrics /></DashboardLayout>)} />
      <Route path={"/safety/training-programs"} component={() => (<DashboardLayout><SafetyTrainingPrograms /></DashboardLayout>)} />
      <Route path={"/safety/training-records"} component={() => (<DashboardLayout><SafetyTrainingRecords /></DashboardLayout>)} />
      <Route path={"/scale-locations"} component={() => (<DashboardLayout><ScaleLocations /></DashboardLayout>)} />
      <Route path={"/scheduled-tasks"} component={() => (<DashboardLayout><ScheduledTasks /></DashboardLayout>)} />
      <Route path={"/security-settings"} component={() => (<DashboardLayout><SecuritySettings /></DashboardLayout>)} />
      <Route path={"/service-alerts"} component={() => (<DashboardLayout><ServiceAlerts /></DashboardLayout>)} />
      <Route path={"/session-management"} component={() => (<DashboardLayout><SessionManagement /></DashboardLayout>)} />
      <Route path={"/settings"} component={() => (<DashboardLayout><Settings /></DashboardLayout>)} />
      <Route path={"/settings/integrations"} component={() => (<DashboardLayout><SettingsIntegrations /></DashboardLayout>)} />
      <Route path={"/settlement-details"} component={() => (<DashboardLayout><SettlementDetails /></DashboardLayout>)} />
      <Route path={"/settlement-statements"} component={() => (<DashboardLayout><SettlementStatements /></DashboardLayout>)} />
      <Route path={"/shipment"} component={() => (<DashboardLayout><Shipment /></DashboardLayout>)} />
      <Route path={"/shipper/accessorials"} component={() => (<DashboardLayout><ShipperAccessorials /></DashboardLayout>)} />
      <Route path={"/shipper/bid-evaluation"} component={() => (<DashboardLayout><ShipperBidEvaluation /></DashboardLayout>)} />
      <Route path={"/shipper/bid-management"} component={() => (<DashboardLayout><ShipperBidManagement /></DashboardLayout>)} />
      <Route path={"/shipper/carrier-performance"} component={() => (<DashboardLayout><ShipperCarrierPerformance /></DashboardLayout>)} />
      <Route path={"/shipper/carrier-scorecard"} component={() => (<DashboardLayout><ShipperCarrierScorecard /></DashboardLayout>)} />
      <Route path={"/shipper/compliance"} component={() => (<DashboardLayout><ShipperCompliance /></DashboardLayout>)} />
      <Route path={"/shipper/contracts"} component={() => (<DashboardLayout><ShipperContracts /></DashboardLayout>)} />
      <Route path={"/shipper/dashboard"} component={() => (<DashboardLayout><ShipperDashboard /></DashboardLayout>)} />
      <Route path={"/shipper/document-export"} component={() => (<DashboardLayout><ShipperDocumentExport /></DashboardLayout>)} />
      <Route path={"/shipper/invoice-review"} component={() => (<DashboardLayout><ShipperInvoiceReview /></DashboardLayout>)} />
      <Route path={"/shipper/lane-analysis"} component={() => (<DashboardLayout><ShipperLaneAnalysis /></DashboardLayout>)} />
      <Route path={"/shipper/load-create"} component={() => (<DashboardLayout><ShipperLoadCreate /></DashboardLayout>)} />
      <Route path={"/shipper/load-tracking"} component={() => (<DashboardLayout><ShipperLoadTracking /></DashboardLayout>)} />
      <Route path={"/shipper/loads"} component={() => (<DashboardLayout><ShipperLoads /></DashboardLayout>)} />
      <Route path={"/shipper/pod-review"} component={() => (<DashboardLayout><ShipperPODReview /></DashboardLayout>)} />
      <Route path={"/shipper/profile"} component={() => (<DashboardLayout><ShipperProfile /></DashboardLayout>)} />
      <Route path={"/shipper/quote-requests"} component={() => (<DashboardLayout><ShipperQuoteRequests /></DashboardLayout>)} />
      <Route path={"/shipper/rate-carrier"} component={() => (<DashboardLayout><ShipperRateCarrier /></DashboardLayout>)} />
      <Route path={"/shipper/spend-analytics"} component={() => (<DashboardLayout><ShipperSpendAnalytics /></DashboardLayout>)} />
      <Route path={"/shipper/vendor-management"} component={() => (<DashboardLayout><ShipperVendorManagement /></DashboardLayout>)} />
      <Route path={"/shipper/s"} component={() => (<DashboardLayout><Shippers /></DashboardLayout>)} />
      <Route path={"/specializations"} component={() => (<DashboardLayout><Specializations /></DashboardLayout>)} />
      <Route path={"/spectra-match"} component={() => (<DashboardLayout><SpectraMatch /></DashboardLayout>)} />
      <Route path={"/subscription-plan"} component={() => (<DashboardLayout><SubscriptionPlan /></DashboardLayout>)} />
      <Route path={"/support"} component={() => (<DashboardLayout><Support /></DashboardLayout>)} />
      <Route path={"/support-tickets"} component={() => (<DashboardLayout><SupportTickets /></DashboardLayout>)} />
      <Route path={"/system-configuration"} component={() => (<DashboardLayout><SystemConfiguration /></DashboardLayout>)} />
      <Route path={"/system-health"} component={() => (<DashboardLayout><SystemHealth /></DashboardLayout>)} />
      <Route path={"/system-settings"} component={() => (<DashboardLayout><SystemSettings /></DashboardLayout>)} />
      <Route path={"/system-status"} component={() => (<DashboardLayout><SystemStatus /></DashboardLayout>)} />
      <Route path={"/tank-inventory"} component={() => (<DashboardLayout><TankInventory /></DashboardLayout>)} />
      <Route path={"/tax-documents"} component={() => (<DashboardLayout><TaxDocuments /></DashboardLayout>)} />
      <Route path={"/team-management"} component={() => (<DashboardLayout><TeamManagement /></DashboardLayout>)} />
      <Route path={"/terminal/appointment-schedule"} component={() => (<DashboardLayout><TerminalAppointmentSchedule /></DashboardLayout>)} />
      <Route path={"/terminal/appointments"} component={() => (<DashboardLayout><TerminalAppointments /></DashboardLayout>)} />
      <Route path={"/terminal/carrier-access"} component={() => (<DashboardLayout><TerminalCarrierAccess /></DashboardLayout>)} />
      <Route path={"/terminal/dashboard"} component={() => (<DashboardLayout><TerminalDashboard /></DashboardLayout>)} />
      <Route path={"/terminal/directory"} component={() => (<DashboardLayout><TerminalDirectory /></DashboardLayout>)} />
      <Route path={"/terminal/eia-reporting"} component={() => (<DashboardLayout><TerminalEIAReporting /></DashboardLayout>)} />
      <Route path={"/terminal/gate-management"} component={() => (<DashboardLayout><TerminalGateManagement /></DashboardLayout>)} />
      <Route path={"/terminal/inventory"} component={() => (<DashboardLayout><TerminalInventory /></DashboardLayout>)} />
      <Route path={"/terminal/inventory-alerts"} component={() => (<DashboardLayout><TerminalInventoryAlerts /></DashboardLayout>)} />
      <Route path={"/terminal/loading-schedule"} component={() => (<DashboardLayout><TerminalLoadingSchedule /></DashboardLayout>)} />
      <Route path={"/terminal/manager-dashboard"} component={() => (<DashboardLayout><TerminalManagerDashboard /></DashboardLayout>)} />
      <Route path={"/terminal/operations"} component={() => (<DashboardLayout><TerminalOperations /></DashboardLayout>)} />
      <Route path={"/terminal/product-inventory"} component={() => (<DashboardLayout><TerminalProductInventory /></DashboardLayout>)} />
      <Route path={"/terminal/product-management"} component={() => (<DashboardLayout><TerminalProductManagement /></DashboardLayout>)} />
      <Route path={"/terminal/rack-assignment"} component={() => (<DashboardLayout><TerminalRackAssignment /></DashboardLayout>)} />
      <Route path={"/terminal/rack-schedule"} component={() => (<DashboardLayout><TerminalRackSchedule /></DashboardLayout>)} />
      <Route path={"/terminal/scada"} component={() => (<DashboardLayout><TerminalSCADA /></DashboardLayout>)} />
      <Route path={"/terminal/safety-inspections"} component={() => (<DashboardLayout><TerminalSafetyInspections /></DashboardLayout>)} />
      <Route path={"/terminal/scheduling"} component={() => (<DashboardLayout><TerminalScheduling /></DashboardLayout>)} />
      <Route path={"/terminal/staff"} component={() => (<DashboardLayout><TerminalStaff /></DashboardLayout>)} />
      <Route path={"/terminal/tank-inventory"} component={() => (<DashboardLayout><TerminalTankInventory /></DashboardLayout>)} />
      <Route path={"/terminal/weigh-scales"} component={() => (<DashboardLayout><TerminalWeighScales /></DashboardLayout>)} />
      <Route path={"/terminal/yard-management"} component={() => (<DashboardLayout><TerminalYardManagement /></DashboardLayout>)} />
      <Route path={"/terms-of-service"} component={() => (<DashboardLayout><TermsOfService /></DashboardLayout>)} />
      <Route path={"/test-login"} component={() => (<DashboardLayout><TestLogin /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul"} component={() => (<DashboardLayout><TheHaul /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-achievements"} component={() => (<DashboardLayout><TheHaulAchievements /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-leaderboard"} component={() => (<DashboardLayout><TheHaulLeaderboard /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-missions"} component={() => (<DashboardLayout><TheHaulMissions /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-rewards"} component={() => (<DashboardLayout><TheHaulRewards /></DashboardLayout>)} />
      <Route path={"/time-off-requests"} component={() => (<DashboardLayout><TimeOffRequests /></DashboardLayout>)} />
      <Route path={"/toll-calculator"} component={() => (<DashboardLayout><TollCalculator /></DashboardLayout>)} />
      <Route path={"/track-shipments"} component={() => (<DashboardLayout><TrackShipments /></DashboardLayout>)} />
      <Route path={"/traffic-conditions"} component={() => (<DashboardLayout><TrafficConditions /></DashboardLayout>)} />
      <Route path={"/training-management"} component={() => (<DashboardLayout><TrainingManagement /></DashboardLayout>)} />
      <Route path={"/two-factor-auth"} component={() => (<DashboardLayout><TwoFactorAuth /></DashboardLayout>)} />
      <Route path={"/two-factor-setup"} component={() => (<DashboardLayout><TwoFactorSetup /></DashboardLayout>)} />
      <Route path={"/user-management"} component={() => (<DashboardLayout><UserManagement /></DashboardLayout>)} />
      <Route path={"/user-verification"} component={() => (<DashboardLayout><UserVerification /></DashboardLayout>)} />
      <Route path={"/users"} component={() => (<DashboardLayout><Users /></DashboardLayout>)} />
      <Route path={"/utilization-report"} component={() => (<DashboardLayout><UtilizationReport /></DashboardLayout>)} />
      <Route path={"/vehicle"} component={() => (<DashboardLayout><Vehicle /></DashboardLayout>)} />
      <Route path={"/vehicle-details"} component={() => (<DashboardLayout><VehicleDetails /></DashboardLayout>)} />
      <Route path={"/vehicle-inspections"} component={() => (<DashboardLayout><VehicleInspections /></DashboardLayout>)} />
      <Route path={"/verification-queue"} component={() => (<DashboardLayout><VerificationQueue /></DashboardLayout>)} />
      <Route path={"/violations"} component={() => (<DashboardLayout><Violations /></DashboardLayout>)} />
      <Route path={"/wallet"} component={() => (<DashboardLayout><Wallet /></DashboardLayout>)} />
      <Route path={"/wallet/add-funds"} component={() => (<DashboardLayout><WalletAddFunds /></DashboardLayout>)} />
      <Route path={"/wallet/instant-pay"} component={() => (<DashboardLayout><WalletInstantPay /></DashboardLayout>)} />
      <Route path={"/wallet/payout-methods"} component={() => (<DashboardLayout><WalletPayoutMethods /></DashboardLayout>)} />
      <Route path={"/wallet/transactions"} component={() => (<DashboardLayout><WalletTransactions /></DashboardLayout>)} />
      <Route path={"/weather-alerts"} component={() => (<DashboardLayout><WeatherAlerts /></DashboardLayout>)} />
      <Route path={"/webhook-logs"} component={() => (<DashboardLayout><WebhookLogs /></DashboardLayout>)} />
      <Route path={"/webhook-management"} component={() => (<DashboardLayout><WebhookManagement /></DashboardLayout>)} />
      <Route path={"/zeun/admin-dashboard"} component={() => (<DashboardLayout><ZeunAdminDashboard /></DashboardLayout>)} />
      <Route path={"/zeun/breakdown"} component={() => (<DashboardLayout><ZeunBreakdown /></DashboardLayout>)} />
      <Route path={"/zeun/breakdown-report"} component={() => (<DashboardLayout><ZeunBreakdownReport /></DashboardLayout>)} />
      <Route path={"/zeun/fleet-dashboard"} component={() => (<DashboardLayout><ZeunFleetDashboard /></DashboardLayout>)} />
      <Route path={"/zeun/maintenance-tracker"} component={() => (<DashboardLayout><ZeunMaintenanceTracker /></DashboardLayout>)} />
      <Route path={"/zeun/provider-network"} component={() => (<DashboardLayout><ZeunProviderNetwork /></DashboardLayout>)} />

      {/* FALLBACK */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
