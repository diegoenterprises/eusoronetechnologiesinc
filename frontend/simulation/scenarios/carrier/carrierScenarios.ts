/**
 * Carrier/Fleet Scenarios (50)
 */
import { Scenario } from '../../runners/ScenarioExecutor';

const c = (id: number, n: string, s: string[], v: string[]): Scenario => ({
  id: `CAR-${String(id).padStart(3, '0')}`, category: 'CARRIER', name: n, actor: 'CARRIER', steps: s, expectedOutcome: n, validations: v
});

export const CARRIER_SCENARIOS: Scenario[] = [
  c(1, 'Carrier views dashboard', ['Login', 'Fleet stats'], ['ok']),
  c(2, 'Carrier views fleet map', ['Real-time', 'All trucks'], ['ok']),
  c(3, 'Carrier adds driver', ['Form', 'DQ file'], ['ok']),
  c(4, 'Carrier assigns load', ['Driver', 'Load'], ['ok']),
  c(5, 'Carrier views driver HOS', ['Status', 'Remaining'], ['ok']),
  c(6, 'Carrier views analytics', ['Revenue', 'Costs'], ['ok']),
  c(7, 'Carrier manages bids', ['Submit', 'Track'], ['ok']),
  c(8, 'Carrier views settlements', ['Weekly', 'Driver'], ['ok']),
  c(9, 'Carrier processes payroll', ['Calculate', 'Pay'], ['ok']),
  c(10, 'Carrier views compliance', ['Docs', 'Expiring'], ['ok']),
  c(11, 'Carrier manages vehicles', ['Add', 'Maintenance'], ['ok']),
  c(12, 'Carrier views inspections', ['Due', 'History'], ['ok']),
  c(13, 'Carrier views IFTA', ['Report', 'Submit'], ['ok']),
  c(14, 'Carrier manages insurance', ['COI', 'Upload'], ['ok']),
  c(15, 'Carrier views safety score', ['CSA', 'Events'], ['ok']),
  c(16, 'Carrier views accidents', ['Reports', 'Claims'], ['ok']),
  c(17, 'Carrier manages fuel cards', ['Issue', 'Limits'], ['ok']),
  c(18, 'Carrier views fuel usage', ['By driver', 'Cost'], ['ok']),
  c(19, 'Carrier views dispatching', ['Loads', 'Assign'], ['ok']),
  c(20, 'Carrier views load board', ['Available', 'Match'], ['ok']),
  c(21, 'Carrier negotiates rate', ['Counter', 'Accept'], ['ok']),
  c(22, 'Carrier views contracts', ['Active', 'Terms'], ['ok']),
  c(23, 'Carrier views messages', ['Inbox', 'Reply'], ['ok']),
  c(24, 'Carrier manages channels', ['Create', 'Assign'], ['ok']),
  c(25, 'Carrier views wallet', ['Balance', 'Transactions'], ['ok']),
  c(26, 'Carrier requests factoring', ['Invoice', 'Submit'], ['ok']),
  c(27, 'Carrier views earnings', ['Revenue', 'Expenses'], ['ok']),
  c(28, 'Carrier exports reports', ['Type', 'Download'], ['ok']),
  c(29, 'Carrier manages team', ['Users', 'Roles'], ['ok']),
  c(30, 'Carrier views ZEUN', ['Breakdowns', 'Maintenance'], ['ok']),
  c(31, 'Carrier schedules maintenance', ['Vehicle', 'Date'], ['ok']),
  c(32, 'Carrier views provider network', ['Near', 'Ratings'], ['ok']),
  c(33, 'Carrier tracks breakdown', ['Status', 'ETA'], ['ok']),
  c(34, 'Carrier views gamification', ['Fleet rank', 'Points'], ['ok']),
  c(35, 'Carrier views driver ranks', ['Leaderboard', 'Rewards'], ['ok']),
  c(36, 'Carrier manages rewards', ['Issue', 'Track'], ['ok']),
  c(37, 'Carrier views support', ['Tickets', 'Create'], ['ok']),
  c(38, 'Carrier manages settings', ['Configure', 'Save'], ['ok']),
  c(39, 'Carrier views audit logs', ['Activity', 'Filter'], ['ok']),
  c(40, 'Carrier manages integrations', ['ELD', 'TMS'], ['ok']),
  c(41, 'Carrier views API usage', ['Calls', 'Limits'], ['ok']),
  c(42, 'Carrier bulk upload', ['Drivers', 'Vehicles'], ['ok']),
  c(43, 'Carrier views permits', ['Active', 'Expiring'], ['ok']),
  c(44, 'Carrier manages authority', ['MC', 'DOT'], ['ok']),
  c(45, 'Carrier views broker list', ['Approved', 'Blacklist'], ['ok']),
  c(46, 'Carrier rates broker', ['Stars', 'Comment'], ['ok']),
  c(47, 'Carrier views lane rates', ['History', 'Market'], ['ok']),
  c(48, 'Carrier views utilization', ['By truck', 'Empty'], ['ok']),
  c(49, 'Carrier views detention', ['Claims', 'Revenue'], ['ok']),
  c(50, 'Carrier manages preferences', ['Alerts', 'Save'], ['ok']),
];

export default CARRIER_SCENARIOS;
