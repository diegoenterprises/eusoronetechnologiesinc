/**
 * Broker Scenarios (50)
 */
import { Scenario } from '../../runners/ScenarioExecutor';

const b = (id: number, n: string, s: string[], v: string[]): Scenario => ({
  id: `BRK-${String(id).padStart(3, '0')}`, category: 'BROKER', name: n, actor: 'BROKER', steps: s, expectedOutcome: n, validations: v
});

export const BROKER_SCENARIOS: Scenario[] = [
  b(1, 'Broker views dashboard', ['Login', 'Stats'], ['ok']),
  b(2, 'Broker posts load', ['Form', 'Submit'], ['ok']),
  b(3, 'Broker edits load', ['Modify', 'Save'], ['ok']),
  b(4, 'Broker views bids', ['List', 'Compare'], ['ok']),
  b(5, 'Broker awards load', ['Select', 'Award'], ['ok']),
  b(6, 'Broker tracks load', ['Map', 'Status'], ['ok']),
  b(7, 'Broker views catalyst list', ['Approved', 'Stats'], ['ok']),
  b(8, 'Broker vets catalyst', ['SAFER', 'Insurance'], ['ok']),
  b(9, 'Broker approves catalyst', ['Review', 'Approve'], ['ok']),
  b(10, 'Broker views analytics', ['Volume', 'Margin'], ['ok']),
  b(11, 'Broker views commissions', ['Earned', 'Pending'], ['ok']),
  b(12, 'Broker processes payment', ['Invoice', 'Pay'], ['ok']),
  b(13, 'Broker views wallet', ['Balance', 'History'], ['ok']),
  b(14, 'Broker views shipper list', ['Active', 'Credit'], ['ok']),
  b(15, 'Broker adds shipper', ['Form', 'Credit check'], ['ok']),
  b(16, 'Broker views contracts', ['Terms', 'Active'], ['ok']),
  b(17, 'Broker creates contract', ['Terms', 'Submit'], ['ok']),
  b(18, 'Broker views rate cons', ['Pending', 'Signed'], ['ok']),
  b(19, 'Broker sends rate con', ['Generate', 'Email'], ['ok']),
  b(20, 'Broker views documents', ['BOL', 'POD'], ['ok']),
  b(21, 'Broker views messages', ['Inbox', 'Reply'], ['ok']),
  b(22, 'Broker contacts catalyst', ['Message', 'Call'], ['ok']),
  b(23, 'Broker views lane rates', ['History', 'Market'], ['ok']),
  b(24, 'Broker sets lane alert', ['Route', 'Price'], ['ok']),
  b(25, 'Broker views market intel', ['Trends', 'Capacity'], ['ok']),
  b(26, 'Broker manages team', ['Users', 'Commission'], ['ok']),
  b(27, 'Broker views compliance', ['Docs', 'Status'], ['ok']),
  b(28, 'Broker uploads docs', ['Type', 'File'], ['ok']),
  b(29, 'Broker views claims', ['Open', 'History'], ['ok']),
  b(30, 'Broker files claim', ['Details', 'Submit'], ['ok']),
  b(31, 'Broker views load history', ['Past', 'Filter'], ['ok']),
  b(32, 'Broker exports data', ['Report', 'Download'], ['ok']),
  b(33, 'Broker views notifications', ['Alerts', 'Settings'], ['ok']),
  b(34, 'Broker updates profile', ['Company', 'Save'], ['ok']),
  b(35, 'Broker manages API', ['Keys', 'Webhooks'], ['ok']),
  b(36, 'Broker views support', ['Tickets', 'Create'], ['ok']),
  b(37, 'Broker manages TMS', ['Connect', 'Sync'], ['ok']),
  b(38, 'Broker views capacity board', ['Available', 'Match'], ['ok']),
  b(39, 'Broker bulk post loads', ['CSV', 'Process'], ['ok']),
  b(40, 'Broker views detention', ['Claims', 'Track'], ['ok']),
  b(41, 'Broker manages quickpay', ['Requests', 'Approve'], ['ok']),
  b(42, 'Broker views factoring', ['Invoices', 'Status'], ['ok']),
  b(43, 'Broker views catalyst ratings', ['Score', 'History'], ['ok']),
  b(44, 'Broker rates catalyst', ['Stars', 'Comment'], ['ok']),
  b(45, 'Broker views shipper ratings', ['Score', 'Feedback'], ['ok']),
  b(46, 'Broker manages templates', ['Email', 'Docs'], ['ok']),
  b(47, 'Broker views calendar', ['Pickups', 'Deliveries'], ['ok']),
  b(48, 'Broker manages alerts', ['Configure', 'Save'], ['ok']),
  b(49, 'Broker views gamification', ['Points', 'Rank'], ['ok']),
  b(50, 'Broker manages preferences', ['Settings', 'Save'], ['ok']),
];

export default BROKER_SCENARIOS;
