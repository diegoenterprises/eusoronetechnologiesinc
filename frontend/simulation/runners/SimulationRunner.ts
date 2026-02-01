/**
 * EUSOTRIP SIMULATION - Main Simulation Runner
 * Orchestrates execution of 1,000+ scenarios
 */

import { ScenarioExecutor, Scenario, ScenarioResult } from './ScenarioExecutor';
import { ResultCollector } from './ResultCollector';

export interface SimulationConfig {
  categories?: string[];
  verbose?: boolean;
  parallel?: boolean;
  stopOnFailure?: boolean;
  reportFormat?: 'console' | 'json' | 'html';
}

export interface SimulationReport {
  startTime: Date;
  endTime: Date;
  duration: number;
  totalScenarios: number;
  results: {
    passed: number;
    failed: number;
    partial: number;
    skipped: number;
    errors: number;
  };
  passRate: number;
  scenarios: ScenarioResult[];
  criticalFailures: string[];
  recommendations: string[];
  categoryBreakdown: Record<string, { passed: number; failed: number; total: number }>;
}

export class SimulationRunner {
  private executor: ScenarioExecutor;
  private collector: ResultCollector;
  private config: SimulationConfig;
  private scenarios: Map<string, Scenario[]> = new Map();

  constructor(config: SimulationConfig = {}) {
    this.config = {
      verbose: false,
      parallel: false,
      stopOnFailure: false,
      reportFormat: 'console',
      ...config
    };
    this.executor = new ScenarioExecutor(this.config.verbose || false);
    this.collector = new ResultCollector();
  }

  registerCategory(name: string, scenarios: Scenario[]): void {
    this.scenarios.set(name, scenarios);
    if (this.config.verbose) {
      console.log(`[SimulationRunner] Registered ${scenarios.length} scenarios for ${name}`);
    }
  }

  async runAllScenarios(): Promise<SimulationReport> {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  EUSOTRIP PLATFORM - 1,000 SCENARIO SIMULATION');
    console.log('  Production Readiness Validation');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Started: ${new Date().toISOString()}`);
    console.log('');

    const startTime = new Date();
    const results: ScenarioResult[] = [];

    // Filter categories if specified
    const categoriesToRun = this.config.categories 
      ? Array.from(this.scenarios.entries()).filter(([name]) => this.config.categories!.includes(name))
      : Array.from(this.scenarios.entries());

    let totalScenarios = 0;
    categoriesToRun.forEach(([, scenarios]) => totalScenarios += scenarios.length);

    console.log(`  Total Categories: ${categoriesToRun.length}`);
    console.log(`  Total Scenarios: ${totalScenarios}`);
    console.log('═══════════════════════════════════════════════════════════════');

    let scenarioIndex = 0;

    for (const [categoryName, categoryScenarios] of categoriesToRun) {
      console.log(`\n▶ Running ${categoryName} (${categoryScenarios.length} scenarios)...`);
      
      for (const scenario of categoryScenarios) {
        scenarioIndex++;
        const progress = `[${scenarioIndex}/${totalScenarios}]`;
        
        try {
          const result = await this.executor.execute(scenario);
          results.push(result);
          this.collector.add(result);

          // Log progress
          const symbol = this.getStatusSymbol(result.status);
          const duration = `${result.duration}ms`;
          
          if (this.config.verbose || result.status !== 'PASS') {
            console.log(`  ${symbol} ${progress} ${scenario.id}: ${scenario.name} (${duration})`);
            if (result.status === 'FAIL' && result.errors.length > 0) {
              console.log(`     └─ Error: ${result.errors[0]}`);
            }
          } else {
            // Compact output for passing tests
            process.stdout.write(symbol);
          }

          // Stop on failure if configured
          if (this.config.stopOnFailure && result.status === 'FAIL') {
            console.log('\n\n⛔ Stopping simulation due to failure (stopOnFailure=true)');
            break;
          }
        } catch (error) {
          const errorResult: ScenarioResult = {
            id: scenario.id,
            name: scenario.name,
            category: categoryName,
            status: 'ERROR',
            duration: 0,
            steps: [],
            errors: [`Execution error: ${(error as Error).message}`],
            warnings: []
          };
          results.push(errorResult);
          this.collector.add(errorResult);
          console.log(`  ✗ ${progress} ${scenario.id}: EXECUTION ERROR - ${(error as Error).message}`);
        }
      }

      if (!this.config.verbose) {
        console.log(''); // New line after compact output
      }
    }

    const endTime = new Date();
    const report = this.generateReport(startTime, endTime, results);
    
    this.printReport(report);
    
    return report;
  }

  async runCategory(categoryName: string): Promise<SimulationReport> {
    const originalCategories = this.config.categories;
    this.config.categories = [categoryName];
    const report = await this.runAllScenarios();
    this.config.categories = originalCategories;
    return report;
  }

  async runSingle(scenarioId: string): Promise<ScenarioResult | null> {
    for (const [categoryName, scenarios] of this.scenarios) {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (scenario) {
        console.log(`Running single scenario: ${scenarioId}`);
        return await this.executor.execute(scenario);
      }
    }
    console.log(`Scenario not found: ${scenarioId}`);
    return null;
  }

  private getStatusSymbol(status: string): string {
    switch (status) {
      case 'PASS': return '✓';
      case 'FAIL': return '✗';
      case 'PARTIAL': return '⚠';
      case 'SKIP': return '○';
      case 'ERROR': return '!';
      default: return '?';
    }
  }

  private generateReport(startTime: Date, endTime: Date, results: ScenarioResult[]): SimulationReport {
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const partial = results.filter(r => r.status === 'PARTIAL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    const errors = results.filter(r => r.status === 'ERROR').length;

    const criticalFailures = results
      .filter(r => r.status === 'FAIL' || r.status === 'ERROR')
      .filter(r => !r.category.includes('EDGE_CASE'))
      .map(r => `${r.id}: ${r.name}`);

    const categoryBreakdown: Record<string, { passed: number; failed: number; total: number }> = {};
    for (const result of results) {
      if (!categoryBreakdown[result.category]) {
        categoryBreakdown[result.category] = { passed: 0, failed: 0, total: 0 };
      }
      categoryBreakdown[result.category].total++;
      if (result.status === 'PASS') {
        categoryBreakdown[result.category].passed++;
      } else {
        categoryBreakdown[result.category].failed++;
      }
    }

    const recommendations = this.generateRecommendations(results);

    return {
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      totalScenarios: results.length,
      results: { passed, failed, partial, skipped, errors },
      passRate: results.length > 0 ? (passed / results.length) * 100 : 0,
      scenarios: results,
      criticalFailures,
      recommendations,
      categoryBreakdown
    };
  }

  private generateRecommendations(results: ScenarioResult[]): string[] {
    const recommendations: string[] = [];
    const failedByCategory: Record<string, number> = {};

    for (const result of results.filter(r => r.status === 'FAIL')) {
      failedByCategory[result.category] = (failedByCategory[result.category] || 0) + 1;
    }

    // Category-specific recommendations
    for (const [category, count] of Object.entries(failedByCategory)) {
      if (count > 5) {
        recommendations.push(`High failure rate in ${category} (${count} failures) - Review ${category.toLowerCase()} implementation`);
      }
    }

    // General recommendations based on patterns
    const errorResults = results.filter(r => r.status === 'ERROR');
    if (errorResults.length > 0) {
      recommendations.push(`${errorResults.length} scenarios had execution errors - Check test infrastructure`);
    }

    const slowScenarios = results.filter(r => r.duration > 5000);
    if (slowScenarios.length > 10) {
      recommendations.push(`${slowScenarios.length} scenarios took >5 seconds - Consider performance optimization`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems performing within expected parameters');
    }

    return recommendations;
  }

  private printReport(report: SimulationReport): void {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  SIMULATION COMPLETE - SUMMARY REPORT');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Duration: ${(report.duration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`  Total Scenarios: ${report.totalScenarios}`);
    console.log('');
    console.log(`  ✓ Passed:  ${report.results.passed} (${report.passRate.toFixed(1)}%)`);
    console.log(`  ✗ Failed:  ${report.results.failed}`);
    console.log(`  ⚠ Partial: ${report.results.partial}`);
    console.log(`  ○ Skipped: ${report.results.skipped}`);
    console.log(`  ! Errors:  ${report.results.errors}`);
    console.log('');

    // Category breakdown
    console.log('  Category Breakdown:');
    for (const [category, stats] of Object.entries(report.categoryBreakdown)) {
      const rate = ((stats.passed / stats.total) * 100).toFixed(0);
      console.log(`    ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
    }

    // Production readiness status
    console.log('');
    const isReady = report.passRate >= 100 && report.criticalFailures.length === 0;
    if (isReady) {
      console.log('  ✅ PRODUCTION READINESS: APPROVED');
    } else {
      console.log('  ❌ PRODUCTION READINESS: NOT READY');
      console.log(`     Blocking Issues: ${report.criticalFailures.length}`);
    }

    // Critical failures
    if (report.criticalFailures.length > 0) {
      console.log('');
      console.log('  ⚠️  CRITICAL FAILURES:');
      report.criticalFailures.slice(0, 10).forEach(f => {
        console.log(`    - ${f}`);
      });
      if (report.criticalFailures.length > 10) {
        console.log(`    ... and ${report.criticalFailures.length - 10} more`);
      }
    }

    // Recommendations
    console.log('');
    console.log('  📋 RECOMMENDATIONS:');
    report.recommendations.forEach((r, i) => {
      console.log(`    ${i + 1}. ${r}`);
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
  }
}

export default SimulationRunner;
