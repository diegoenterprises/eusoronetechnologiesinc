/**
 * Widget Analytics Service
 * Manages real-time analytics data collection, aggregation, and recommendations
 * 
 * This service collects widget usage data and provides insights for:
 * - Most used widgets
 * - Widget usage trends
 * - User behavior patterns
 * - AI-powered recommendations
 */

export interface WidgetUsageData {
  widgetId: string;
  totalOpens: number;
  totalCloses: number;
  totalCustomizations: number;
  totalResizes: number;
  totalRefreshes: number;
  averageSessionDuration: number;
  lastUsed: Date;
}

export interface WidgetAnalyticsMetrics {
  totalWidgets: number;
  totalUsage: number;
  averageSessionTime: number;
  topWidgets: WidgetUsageData[];
  usageByCategory: Record<string, number>;
  usageTrend: Array<{ date: string; usage: number }>;
}

export interface WidgetRecommendation {
  widgetId: string;
  reason: string;
  score: number;
  category: string;
}

class WidgetAnalyticsService {
  private usageData: Map<string, WidgetUsageData> = new Map();
  private dailyUsageLog: Array<{ date: string; widgetId: string; count: number }> = [];

  /**
   * Update widget usage data
   */
  updateUsageData(data: WidgetUsageData) {
    this.usageData.set(data.widgetId, data);
    
    // Log daily usage
    const today = new Date().toISOString().split("T")[0];
    const existingLog = this.dailyUsageLog.find(
      (log) => log.date === today && log.widgetId === data.widgetId
    );
    
    if (existingLog) {
      existingLog.count += data.totalOpens;
    } else {
      this.dailyUsageLog.push({
        date: today,
        widgetId: data.widgetId,
        count: data.totalOpens,
      });
    }
  }

  /**
   * Get all usage data
   */
  getAllUsageData(): WidgetUsageData[] {
    return Array.from(this.usageData.values());
  }

  /**
   * Get usage data for specific widget
   */
  getWidgetUsageData(widgetId: string): WidgetUsageData | undefined {
    return this.usageData.get(widgetId);
  }

  /**
   * Calculate analytics metrics
   */
  calculateMetrics(): WidgetAnalyticsMetrics {
    const allData = this.getAllUsageData();
    
    const totalWidgets = allData.length;
    const totalUsage = allData.reduce(
      (sum, data) =>
        sum +
        data.totalOpens +
        data.totalCloses +
        data.totalCustomizations +
        data.totalResizes +
        data.totalRefreshes,
      0
    );
    
    const averageSessionTime = Math.round(
      allData.reduce((sum, data) => sum + data.averageSessionDuration, 0) /
        (allData.length || 1)
    );

    const topWidgets = allData
      .sort((a, b) => b.totalOpens - a.totalOpens)
      .slice(0, 5);

    // Calculate usage by category (placeholder - would need widget metadata)
    const usageByCategory: Record<string, number> = {};
    allData.forEach((data) => {
      const category = this.getWidgetCategory(data.widgetId);
      usageByCategory[category] = (usageByCategory[category] || 0) + data.totalOpens;
    });

    // Calculate usage trend (last 7 days)
    const usageTrend = this.calculateUsageTrend();

    return {
      totalWidgets,
      totalUsage,
      averageSessionTime,
      topWidgets,
      usageByCategory,
      usageTrend,
    };
  }

  /**
   * Calculate usage trend for last 7 days
   */
  private calculateUsageTrend(): Array<{ date: string; usage: number }> {
    const trend: Record<string, number> = {};
    const today = new Date();

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      trend[dateStr] = 0;
    }

    // Aggregate daily usage
    this.dailyUsageLog.forEach((log) => {
      if (trend[log.date] !== undefined) {
        trend[log.date] += log.count;
      }
    });

    return Object.entries(trend).map(([date, usage]) => ({
      date,
      usage,
    }));
  }

  /**
   * Get widget category (placeholder - would fetch from widget metadata)
   */
  private getWidgetCategory(widgetId: string): string {
    const categoryMap: Record<string, string> = {
      "revenue-forecasting": "Analytics",
      "route-optimization": "Optimization",
      "predictive-maintenance": "Maintenance",
      "demand-heatmap": "Analytics",
      "driver-performance": "Performance",
      "fuel-efficiency": "Efficiency",
      "load-utilization": "Optimization",
      "compliance-score": "Compliance",
      "market-rates": "Analytics",
      "bid-win-rate": "Performance",
      "real-time-tracking": "Tracking",
      "cost-breakdown": "Analytics",
      "customer-satisfaction": "Performance",
    };

    return categoryMap[widgetId] || "Other";
  }

  /**
   * Generate AI-powered recommendations
   */
  generateRecommendations(): WidgetRecommendation[] {
    const allData = this.getAllUsageData();
    const recommendations: WidgetRecommendation[] = [];

    // Recommendation 1: Most used widgets
    const topWidgets = allData
      .sort((a, b) => b.totalOpens - a.totalOpens)
      .slice(0, 3);

    topWidgets.forEach((widget) => {
      recommendations.push({
        widgetId: widget.widgetId,
        reason: "Frequently used widget",
        score: widget.totalOpens * 0.5 + widget.totalCustomizations * 0.3,
        category: this.getWidgetCategory(widget.widgetId),
      });
    });

    // Recommendation 2: Recently used widgets
    const recentWidgets = allData
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
      .slice(0, 2);

    recentWidgets.forEach((widget) => {
      if (!recommendations.find((r) => r.widgetId === widget.widgetId)) {
        recommendations.push({
          widgetId: widget.widgetId,
          reason: "Recently used widget",
          score: 50,
          category: this.getWidgetCategory(widget.widgetId),
        });
      }
    });

    // Recommendation 3: High engagement widgets
    const engagedWidgets = allData
      .filter((w) => w.totalCustomizations > 0)
      .sort((a, b) => b.totalCustomizations - a.totalCustomizations)
      .slice(0, 2);

    engagedWidgets.forEach((widget) => {
      if (!recommendations.find((r) => r.widgetId === widget.widgetId)) {
        recommendations.push({
          widgetId: widget.widgetId,
          reason: "High engagement widget",
          score: widget.totalCustomizations * 0.8,
          category: this.getWidgetCategory(widget.widgetId),
        });
      }
    });

    // Sort by score and return top 5
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * Export analytics data as CSV
   */
  exportAsCSV(): string {
    const headers = [
      "Widget ID",
      "Total Opens",
      "Total Closes",
      "Total Customizations",
      "Total Resizes",
      "Total Refreshes",
      "Average Session Duration (s)",
      "Last Used",
    ];

    const rows = this.getAllUsageData().map((data) => [
      data.widgetId,
      data.totalOpens,
      data.totalCloses,
      data.totalCustomizations,
      data.totalResizes,
      data.totalRefreshes,
      data.averageSessionDuration,
      data.lastUsed.toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csv;
  }

  /**
   * Export analytics data as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        metrics: this.calculateMetrics(),
        usageData: this.getAllUsageData(),
        recommendations: this.generateRecommendations(),
      },
      null,
      2
    );
  }

  /**
   * Clear all analytics data
   */
  clearData() {
    this.usageData.clear();
    this.dailyUsageLog = [];
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    const metrics = this.calculateMetrics();
    const recommendations = this.generateRecommendations();

    return {
      metrics,
      recommendations,
      exportDate: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const widgetAnalyticsService = new WidgetAnalyticsService();
