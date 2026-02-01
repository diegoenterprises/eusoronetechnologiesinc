/**
 * EUSOTRIP SIMULATION - Result Collector
 * Aggregates and analyzes simulation results
 */

import { ScenarioResult } from './ScenarioExecutor';

export interface CategoryStats {
  category: string;
  total: number;
  passed: number;
  failed: number;
  partial: number;
  skipped: number;
  errors: number;
  avgDuration: number;
  passRate: number;
}

export interface FailurePattern {
  pattern: string;
  count: number;
  scenarios: string[];
}

export class ResultCollector {
  private results: ScenarioResult[] = [];

  add(result: ScenarioResult): void {
    this.results.push(result);
  }

  addMany(results: ScenarioResult[]): void {
    this.results.push(...results);
  }

  clear(): void {
    this.results = [];
  }

  getAll(): ScenarioResult[] {
    return [...this.results];
  }

  getByStatus(status: ScenarioResult['status']): ScenarioResult[] {
    return this.results.filter(r => r.status === status);
  }

  getByCategory(category: string): ScenarioResult[] {
    return this.results.filter(r => r.category === category);
  }

  getPassed(): ScenarioResult[] {
    return this.getByStatus('PASS');
  }

  getFailed(): ScenarioResult[] {
    return this.getByStatus('FAIL');
  }

  getErrors(): ScenarioResult[] {
    return this.getByStatus('ERROR');
  }

  getCategories(): string[] {
    return [...new Set(this.results.map(r => r.category))];
  }

  getCategoryStats(): CategoryStats[] {
    const categories = this.getCategories();
    return categories.map(category => {
      const categoryResults = this.getByCategory(category);
      const passed = categoryResults.filter(r => r.status === 'PASS').length;
      const failed = categoryResults.filter(r => r.status === 'FAIL').length;
      const partial = categoryResults.filter(r => r.status === 'PARTIAL').length;
      const skipped = categoryResults.filter(r => r.status === 'SKIP').length;
      const errors = categoryResults.filter(r => r.status === 'ERROR').length;
      const totalDuration = categoryResults.reduce((sum, r) => sum + r.duration, 0);
      
      return {
        category,
        total: categoryResults.length,
        passed,
        failed,
        partial,
        skipped,
        errors,
        avgDuration: categoryResults.length > 0 ? Math.round(totalDuration / categoryResults.length) : 0,
        passRate: categoryResults.length > 0 ? (passed / categoryResults.length) * 100 : 0
      };
    });
  }

  getTotalStats(): {
    total: number;
    passed: number;
    failed: number;
    partial: number;
    skipped: number;
    errors: number;
    passRate: number;
    avgDuration: number;
    totalDuration: number;
  } {
    const passed = this.getPassed().length;
    const failed = this.getFailed().length;
    const partial = this.getByStatus('PARTIAL').length;
    const skipped = this.getByStatus('SKIP').length;
    const errors = this.getErrors().length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      total: this.results.length,
      passed,
      failed,
      partial,
      skipped,
      errors,
      passRate: this.results.length > 0 ? (passed / this.results.length) * 100 : 0,
      avgDuration: this.results.length > 0 ? Math.round(totalDuration / this.results.length) : 0,
      totalDuration
    };
  }

  getFailurePatterns(): FailurePattern[] {
    const patterns: Map<string, string[]> = new Map();
    
    for (const result of this.getFailed()) {
      for (const error of result.errors) {
        // Extract pattern from error message
        const pattern = this.extractPattern(error);
        if (!patterns.has(pattern)) {
          patterns.set(pattern, []);
        }
        patterns.get(pattern)!.push(result.id);
      }
    }

    return Array.from(patterns.entries())
      .map(([pattern, scenarios]) => ({
        pattern,
        count: scenarios.length,
        scenarios
      }))
      .sort((a, b) => b.count - a.count);
  }

  private extractPattern(error: string): string {
    // Remove specific IDs, numbers, and timestamps to find common patterns
    return error
      .replace(/\d+/g, 'N')
      .replace(/[a-f0-9]{8,}/gi, 'ID')
      .replace(/\d{4}-\d{2}-\d{2}/g, 'DATE')
      .substring(0, 100);
  }

  getSlowestScenarios(limit: number = 10): ScenarioResult[] {
    return [...this.results]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getFastestScenarios(limit: number = 10): ScenarioResult[] {
    return [...this.results]
      .sort((a, b) => a.duration - b.duration)
      .slice(0, limit);
  }

  getCriticalFailures(): ScenarioResult[] {
    // Critical failures are failures in non-edge-case categories
    return this.getFailed().filter(r => 
      !r.category.toLowerCase().includes('edge') &&
      !r.category.toLowerCase().includes('stress')
    );
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getTotalStats();
    const categoryStats = this.getCategoryStats();

    // Overall pass rate
    if (stats.passRate < 90) {
      recommendations.push(`Overall pass rate is ${stats.passRate.toFixed(1)}% - Target 100% before production`);
    }

    // Category-specific issues
    for (const cat of categoryStats) {
      if (cat.passRate < 80 && cat.total >= 5) {
        recommendations.push(`${cat.category} has low pass rate (${cat.passRate.toFixed(0)}%) - Review implementation`);
      }
      if (cat.avgDuration > 3000) {
        recommendations.push(`${cat.category} scenarios are slow (avg ${cat.avgDuration}ms) - Consider optimization`);
      }
    }

    // Error patterns
    const patterns = this.getFailurePatterns();
    for (const pattern of patterns.slice(0, 3)) {
      if (pattern.count >= 3) {
        recommendations.push(`Common failure pattern affecting ${pattern.count} scenarios: "${pattern.pattern.substring(0, 50)}..."`);
      }
    }

    // Execution errors
    if (stats.errors > 0) {
      recommendations.push(`${stats.errors} scenarios had execution errors - Check test infrastructure`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems performing within expected parameters');
    }

    return recommendations;
  }

  exportToJSON(): string {
    return JSON.stringify({
      summary: this.getTotalStats(),
      categories: this.getCategoryStats(),
      failures: this.getFailed().map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        errors: r.errors
      })),
      recommendations: this.getRecommendations()
    }, null, 2);
  }

  exportToMarkdown(): string {
    const stats = this.getTotalStats();
    const categories = this.getCategoryStats();
    const failures = this.getCriticalFailures();
    const recommendations = this.getRecommendations();

    let md = `# EUSOTRIP Simulation Report\n\n`;
    md += `**Generated:** ${new Date().toISOString()}\n\n`;
    
    md += `## Summary\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Total Scenarios | ${stats.total} |\n`;
    md += `| Passed | ${stats.passed} (${stats.passRate.toFixed(1)}%) |\n`;
    md += `| Failed | ${stats.failed} |\n`;
    md += `| Partial | ${stats.partial} |\n`;
    md += `| Errors | ${stats.errors} |\n`;
    md += `| Duration | ${(stats.totalDuration / 1000).toFixed(1)}s |\n\n`;

    md += `## Production Readiness: ${stats.passRate >= 100 ? '✅ READY' : '❌ NOT READY'}\n\n`;

    md += `## Category Breakdown\n\n`;
    md += `| Category | Pass Rate | Passed | Failed | Avg Duration |\n`;
    md += `|----------|-----------|--------|--------|-------------|\n`;
    for (const cat of categories) {
      md += `| ${cat.category} | ${cat.passRate.toFixed(0)}% | ${cat.passed}/${cat.total} | ${cat.failed} | ${cat.avgDuration}ms |\n`;
    }
    md += '\n';

    if (failures.length > 0) {
      md += `## Critical Failures\n\n`;
      for (const f of failures.slice(0, 20)) {
        md += `### ${f.id}: ${f.name}\n`;
        md += `- **Category:** ${f.category}\n`;
        md += `- **Errors:**\n`;
        for (const e of f.errors) {
          md += `  - ${e}\n`;
        }
        md += '\n';
      }
    }

    md += `## Recommendations\n\n`;
    for (let i = 0; i < recommendations.length; i++) {
      md += `${i + 1}. ${recommendations[i]}\n`;
    }

    return md;
  }
}

export default ResultCollector;
