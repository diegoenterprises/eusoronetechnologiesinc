/**
 * EUSOTRIP PLATFORM - 1,000 SCENARIO SIMULATION
 * Main Entry Point
 */

import { SimulationRunner } from './runners/SimulationRunner';
import { DASHBOARD_WIDGET_SCENARIOS } from './scenarios/dashboard/widgetScenarios';
import { WALLET_FINANCIAL_SCENARIOS } from './scenarios/wallet/financialScenarios';
import { LOAD_MANAGEMENT_SCENARIOS } from './scenarios/loads/loadScenarios';
import { GAMIFICATION_SCENARIOS } from './scenarios/gamification/gamificationScenarios';
import { ZEUN_SCENARIOS } from './scenarios/zeun/zeunScenarios';
import { MESSAGING_SCENARIOS } from './scenarios/messaging/messagingScenarios';
import { TELEMETRY_SCENARIOS } from './scenarios/telemetry/telemetryScenarios';
import { TERMINAL_SCENARIOS } from './scenarios/terminal/terminalScenarios';
import { COMPLIANCE_SCENARIOS } from './scenarios/compliance/complianceScenarios';
import { INTEGRATION_SCENARIOS } from './scenarios/integration/integrationScenarios';
import { DOCUMENT_COMPLIANCE_SCENARIOS } from './scenarios/compliance/documentScenarios';
import { BIDDING_NEGOTIATION_SCENARIOS } from './scenarios/loads/biddingNegotiationScenarios';
import { ALL_USER_COMPLIANCE_SCENARIOS } from './scenarios/compliance/allUserComplianceScenarios';
import { ADMIN_SCENARIOS } from './scenarios/admin/adminScenarios';
import { ESCORT_SCENARIOS } from './scenarios/escort/escortScenarios';
import { FACTORING_SCENARIOS } from './scenarios/factoring/factoringScenarios';
import { LUMPER_SCENARIOS } from './scenarios/lumper/lumperScenarios';
import { SHIPPER_SCENARIOS } from './scenarios/shipper/shipperScenarios';
import { AGENT_SCENARIOS } from './scenarios/agent/agentScenarios';
import { DRIVER_SCENARIOS } from './scenarios/driver/driverScenarios';
import { CARRIER_SCENARIOS } from './scenarios/carrier/carrierScenarios';
import { BROKER_SCENARIOS } from './scenarios/broker/brokerScenarios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// SIMULATION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SIMULATION_CONFIG = {
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  parallel: false,
  stopOnFailure: process.argv.includes('--stop-on-failure'),
  reportFormat: 'console' as const,
  categories: parseCategories()
};

function parseCategories(): string[] | undefined {
  const catIndex = process.argv.findIndex(arg => arg === '--category' || arg === '-c');
  if (catIndex !== -1 && process.argv[catIndex + 1]) {
    return process.argv[catIndex + 1].split(',').map(c => c.trim().toUpperCase());
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║   EUSOTRIP PLATFORM - PRODUCTION READINESS SIMULATION        ║');
  console.log('║   1,000+ Scenario Validation Suite                           ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  const runner = new SimulationRunner(SIMULATION_CONFIG);

  // Register all scenario categories
  runner.registerCategory('DASHBOARD', DASHBOARD_WIDGET_SCENARIOS);
  runner.registerCategory('WALLET', WALLET_FINANCIAL_SCENARIOS);
  runner.registerCategory('LOADS', LOAD_MANAGEMENT_SCENARIOS);
  runner.registerCategory('GAMIFICATION', GAMIFICATION_SCENARIOS);
  runner.registerCategory('ZEUN', ZEUN_SCENARIOS);
  runner.registerCategory('MESSAGING', MESSAGING_SCENARIOS);
  runner.registerCategory('TELEMETRY', TELEMETRY_SCENARIOS);
  runner.registerCategory('TERMINAL', TERMINAL_SCENARIOS);
  runner.registerCategory('COMPLIANCE', COMPLIANCE_SCENARIOS);
  runner.registerCategory('INTEGRATION', INTEGRATION_SCENARIOS);
  runner.registerCategory('DOCUMENTS', DOCUMENT_COMPLIANCE_SCENARIOS);
  runner.registerCategory('BIDDING', BIDDING_NEGOTIATION_SCENARIOS);
  runner.registerCategory('USER_COMPLIANCE', ALL_USER_COMPLIANCE_SCENARIOS);
  runner.registerCategory('ADMIN', ADMIN_SCENARIOS);
  runner.registerCategory('ESCORT', ESCORT_SCENARIOS);
  runner.registerCategory('FACTORING', FACTORING_SCENARIOS);
  runner.registerCategory('LUMPER', LUMPER_SCENARIOS);
  runner.registerCategory('SHIPPER', SHIPPER_SCENARIOS);
  runner.registerCategory('AGENT', AGENT_SCENARIOS);
  runner.registerCategory('DRIVER', DRIVER_SCENARIOS);
  runner.registerCategory('CARRIER', CARRIER_SCENARIOS);
  runner.registerCategory('BROKER', BROKER_SCENARIOS);

  // Display scenario counts
  const totalScenarios = 
    DASHBOARD_WIDGET_SCENARIOS.length +
    WALLET_FINANCIAL_SCENARIOS.length +
    LOAD_MANAGEMENT_SCENARIOS.length +
    GAMIFICATION_SCENARIOS.length +
    ZEUN_SCENARIOS.length +
    MESSAGING_SCENARIOS.length +
    TELEMETRY_SCENARIOS.length +
    TERMINAL_SCENARIOS.length +
    COMPLIANCE_SCENARIOS.length +
    INTEGRATION_SCENARIOS.length +
    DOCUMENT_COMPLIANCE_SCENARIOS.length +
    BIDDING_NEGOTIATION_SCENARIOS.length +
    ALL_USER_COMPLIANCE_SCENARIOS.length +
    ADMIN_SCENARIOS.length +
    ESCORT_SCENARIOS.length +
    FACTORING_SCENARIOS.length +
    LUMPER_SCENARIOS.length +
    SHIPPER_SCENARIOS.length +
    AGENT_SCENARIOS.length +
    DRIVER_SCENARIOS.length +
    CARRIER_SCENARIOS.length +
    BROKER_SCENARIOS.length;

  console.log('  Scenario Distribution:');
  console.log(`    Dashboard:    ${DASHBOARD_WIDGET_SCENARIOS.length} scenarios`);
  console.log(`    Wallet:       ${WALLET_FINANCIAL_SCENARIOS.length} scenarios`);
  console.log(`    Loads:        ${LOAD_MANAGEMENT_SCENARIOS.length} scenarios`);
  console.log(`    Gamification: ${GAMIFICATION_SCENARIOS.length} scenarios`);
  console.log(`    ZEUN:         ${ZEUN_SCENARIOS.length} scenarios`);
  console.log(`    Messaging:    ${MESSAGING_SCENARIOS.length} scenarios`);
  console.log(`    Telemetry:    ${TELEMETRY_SCENARIOS.length} scenarios`);
  console.log(`    Terminal:     ${TERMINAL_SCENARIOS.length} scenarios`);
  console.log(`    Compliance:   ${COMPLIANCE_SCENARIOS.length} scenarios`);
  console.log(`    Integration:  ${INTEGRATION_SCENARIOS.length} scenarios`);
  console.log(`    Documents:    ${DOCUMENT_COMPLIANCE_SCENARIOS.length} scenarios`);
  console.log(`    Bidding:      ${BIDDING_NEGOTIATION_SCENARIOS.length} scenarios`);
  console.log(`    User Compliance: ${ALL_USER_COMPLIANCE_SCENARIOS.length} scenarios`);
  console.log(`    Admin:        ${ADMIN_SCENARIOS.length} scenarios`);
  console.log(`    Escort:       ${ESCORT_SCENARIOS.length} scenarios`);
  console.log(`    Factoring:    ${FACTORING_SCENARIOS.length} scenarios`);
  console.log(`    Lumper:       ${LUMPER_SCENARIOS.length} scenarios`);
  console.log(`    Shipper:      ${SHIPPER_SCENARIOS.length} scenarios`);
  console.log(`    Agent:        ${AGENT_SCENARIOS.length} scenarios`);
  console.log(`    Driver:       ${DRIVER_SCENARIOS.length} scenarios`);
  console.log(`    Carrier:      ${CARRIER_SCENARIOS.length} scenarios`);
  console.log(`    Broker:       ${BROKER_SCENARIOS.length} scenarios`);
  console.log(`    ─────────────────────────────`);
  console.log(`    TOTAL:        ${totalScenarios} scenarios`);
  console.log('');

  // Run simulation
  const report = await runner.runAllScenarios();

  // Save report to file
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportsDir, `simulation-report-${timestamp}.json`);
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n  📄 Report saved to: ${reportPath}`);

  // Generate markdown report
  const mdReport = generateMarkdownReport(report);
  const mdReportPath = path.join(reportsDir, `simulation-report-${timestamp}.md`);
  fs.writeFileSync(mdReportPath, mdReport);
  console.log(`  📄 Markdown report: ${mdReportPath}`);

  // Exit with appropriate code
  const exitCode = report.passRate >= 100 ? 0 : 1;
  console.log(`\n  Exit code: ${exitCode}`);
  process.exit(exitCode);
}

function generateMarkdownReport(report: any): string {
  let md = `# EUSOTRIP Simulation Report\n\n`;
  md += `**Generated:** ${report.endTime}\n\n`;
  md += `**Duration:** ${(report.duration / 1000 / 60).toFixed(2)} minutes\n\n`;
  
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Total Scenarios | ${report.totalScenarios} |\n`;
  md += `| Passed | ${report.results.passed} |\n`;
  md += `| Failed | ${report.results.failed} |\n`;
  md += `| Pass Rate | ${report.passRate.toFixed(1)}% |\n\n`;

  const status = report.passRate >= 100 ? '✅ PRODUCTION READY' : '❌ NOT READY';
  md += `## Production Readiness: ${status}\n\n`;

  md += `## Category Breakdown\n\n`;
  md += `| Category | Passed | Failed | Pass Rate |\n`;
  md += `|----------|--------|--------|----------|\n`;
  
  for (const [category, stats] of Object.entries(report.categoryBreakdown) as any) {
    const rate = ((stats.passed / stats.total) * 100).toFixed(0);
    md += `| ${category} | ${stats.passed} | ${stats.failed} | ${rate}% |\n`;
  }

  if (report.criticalFailures.length > 0) {
    md += `\n## Critical Failures\n\n`;
    report.criticalFailures.slice(0, 20).forEach((f: string) => {
      md += `- ${f}\n`;
    });
  }

  md += `\n## Recommendations\n\n`;
  report.recommendations.forEach((r: string, i: number) => {
    md += `${i + 1}. ${r}\n`;
  });

  return md;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI HELP
// ═══════════════════════════════════════════════════════════════════════════

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
EUSOTRIP Simulation Runner

Usage: npx ts-node simulation/index.ts [options]

Options:
  -v, --verbose         Show detailed output for each scenario
  -c, --category <cat>  Run only specific categories (comma-separated)
                        Example: -c dashboard,wallet
  --stop-on-failure     Stop execution on first failure
  -h, --help            Show this help message

Categories:
  dashboard, wallet, loads, gamification, zeun,
  messaging, telemetry, terminal, compliance, integration

Examples:
  npx ts-node simulation/index.ts
  npx ts-node simulation/index.ts --verbose
  npx ts-node simulation/index.ts -c dashboard,wallet
  npx ts-node simulation/index.ts -c loads --verbose
`);
  process.exit(0);
}

// Run
main().catch(error => {
  console.error('Simulation failed with error:', error);
  process.exit(1);
});
