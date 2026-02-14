/**
 * Catalyst/Fleet Scenarios (50)
 */
import { Scenario } from '../../runners/ScenarioExecutor';

const c = (id: number, n: string, s: string[], v: string[]): Scenario => ({
  id: `CAR-${String(id).padStart(3, '0')}`, category: 'CATALYST', name: n, actor: 'CATALYST', steps: s, expectedOutcome: n, validations: v
});

export const CATALYST_SCENARIOS: Scenario[] = [
  c(1, 'Catalyst views dashboard', ['Login', 'Fleet stats'], ['ok']),
  c(2, 'Catalyst views fleet map', ['Real-time', 'All trucks'], ['ok']),
  c(3, 'Catalyst adds driver', ['Form', 'DQ file'], ['ok']),
  c(4, 'Catalyst assigns load', ['Driver', 'Load'], ['ok']),
  c(5, 'Catalyst views driver HOS', ['Status', 'Remaining'], ['ok']),
  c(6, 'Catalyst views analytics', ['Revenue', 'Costs'], ['ok']),
  c(7, 'Catalyst manages bids', ['Submit', 'Track'], ['ok']),
  c(8, 'Catalyst views settlements', ['Weekly', 'Driver'], ['ok']),
  c(9, 'Catalyst processes payroll', ['Calculate', 'Pay'], ['ok']),
  c(10, 'Catalyst views compliance', ['Docs', 'Expiring'], ['ok']),
  c(11, 'Catalyst manages vehicles', ['Add', 'Maintenance'], ['ok']),
  c(12, 'Catalyst views inspections', ['Due', 'History'], ['ok']),
  c(13, 'Catalyst views IFTA', ['Report', 'Submit'], ['ok']),
  c(14, 'Catalyst manages insurance', ['COI', 'Upload'], ['ok']),
  c(15, 'Catalyst views safety score', ['CSA', 'Events'], ['ok']),
  c(16, 'Catalyst views accidents', ['Reports', 'Claims'], ['ok']),
  c(17, 'Catalyst manages fuel cards', ['Issue', 'Limits'], ['ok']),
  c(18, 'Catalyst views fuel usage', ['By driver', 'Cost'], ['ok']),
  c(19, 'Catalyst views dispatching', ['Loads', 'Assign'], ['ok']),
  c(20, 'Catalyst views load board', ['Available', 'Match'], ['ok']),
  c(21, 'Catalyst negotiates rate', ['Counter', 'Accept'], ['ok']),
  c(22, 'Catalyst views contracts', ['Active', 'Terms'], ['ok']),
  c(23, 'Catalyst views messages', ['Inbox', 'Reply'], ['ok']),
  c(24, 'Catalyst manages channels', ['Create', 'Assign'], ['ok']),
  c(25, 'Catalyst views wallet', ['Balance', 'Transactions'], ['ok']),
  c(26, 'Catalyst requests factoring', ['Invoice', 'Submit'], ['ok']),
  c(27, 'Catalyst views earnings', ['Revenue', 'Expenses'], ['ok']),
  c(28, 'Catalyst exports reports', ['Type', 'Download'], ['ok']),
  c(29, 'Catalyst manages team', ['Users', 'Roles'], ['ok']),
  c(30, 'Catalyst views ZEUN', ['Breakdowns', 'Maintenance'], ['ok']),
  c(31, 'Catalyst schedules maintenance', ['Vehicle', 'Date'], ['ok']),
  c(32, 'Catalyst views provider network', ['Near', 'Ratings'], ['ok']),
  c(33, 'Catalyst tracks breakdown', ['Status', 'ETA'], ['ok']),
  c(34, 'Catalyst views gamification', ['Fleet rank', 'Points'], ['ok']),
  c(35, 'Catalyst views driver ranks', ['Leaderboard', 'Rewards'], ['ok']),
  c(36, 'Catalyst manages rewards', ['Issue', 'Track'], ['ok']),
  c(37, 'Catalyst views support', ['Tickets', 'Create'], ['ok']),
  c(38, 'Catalyst manages settings', ['Configure', 'Save'], ['ok']),
  c(39, 'Catalyst views audit logs', ['Activity', 'Filter'], ['ok']),
  c(40, 'Catalyst manages integrations', ['ELD', 'TMS'], ['ok']),
  c(41, 'Catalyst views API usage', ['Calls', 'Limits'], ['ok']),
  c(42, 'Catalyst bulk upload', ['Drivers', 'Vehicles'], ['ok']),
  c(43, 'Catalyst views permits', ['Active', 'Expiring'], ['ok']),
  c(44, 'Catalyst manages authority', ['MC', 'DOT'], ['ok']),
  c(45, 'Catalyst views broker list', ['Approved', 'Blacklist'], ['ok']),
  c(46, 'Catalyst rates broker', ['Stars', 'Comment'], ['ok']),
  c(47, 'Catalyst views lane rates', ['History', 'Market'], ['ok']),
  c(48, 'Catalyst views utilization', ['By truck', 'Empty'], ['ok']),
  c(49, 'Catalyst views detention', ['Claims', 'Revenue'], ['ok']),
  c(50, 'Catalyst manages preferences', ['Alerts', 'Save'], ['ok']),
];

export default CATALYST_SCENARIOS;
