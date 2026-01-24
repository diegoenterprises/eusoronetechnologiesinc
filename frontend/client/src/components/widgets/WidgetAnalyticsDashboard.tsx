import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Clock, Lightbulb, Download } from 'lucide-react';

export interface WidgetUsageData {
  widgetId: string;
  widgetName: string;
  usageCount: number;
  averageSessionTime: number; // in seconds
  lastUsed: Date;
  userCount: number;
  category: string;
}

interface WidgetAnalyticsDashboardProps {
  usageData: WidgetUsageData[];
  onExportData?: () => void;
}

/**
 * Widget Analytics Dashboard
 * Displays widget usage patterns, recommendations, and performance metrics
 */
export const WidgetAnalyticsDashboard: React.FC<WidgetAnalyticsDashboardProps> = ({
  usageData,
  onExportData,
}) => {
  // Top widgets by usage
  const topWidgets = useMemo(() => {
    return [...usageData]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map((w) => ({
        name: w.widgetName,
        usage: w.usageCount,
      }));
  }, [usageData]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const categories: Record<string, number> = {};
    usageData.forEach((w) => {
      categories[w.category] = (categories[w.category] || 0) + w.usageCount;
    });
    return Object.entries(categories).map(([category, count]) => ({
      name: category,
      value: count,
    }));
  }, [usageData]);

  // Session time trends
  const sessionTimeTrends = useMemo(() => {
    return usageData
      .sort((a, b) => b.averageSessionTime - a.averageSessionTime)
      .slice(0, 8)
      .map((w) => ({
        name: w.widgetName.substring(0, 12),
        time: Math.round(w.averageSessionTime),
      }));
  }, [usageData]);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs = [];

    // Most used widgets
    const mostUsed = topWidgets[0];
    if (mostUsed) {
      recs.push({
        icon: TrendingUp,
        title: 'Top Performer',
        description: `"${mostUsed.name}" is your most-used widget. Consider adding it to your default template.`,
        color: 'text-green-400',
      });
    }

    // Underutilized widgets
    const underutilized = usageData.filter((w) => w.usageCount < 2);
    if (underutilized.length > 0) {
      recs.push({
        icon: Lightbulb,
        title: 'Unused Widgets',
        description: `You have ${underutilized.length} widgets with low usage. Consider removing them to declutter your dashboard.`,
        color: 'text-yellow-400',
      });
    }

    // High engagement widgets
    const highEngagement = usageData.filter((w) => w.averageSessionTime > 60);
    if (highEngagement.length > 0) {
      recs.push({
        icon: Clock,
        title: 'High Engagement',
        description: `${highEngagement.length} widgets keep users engaged for over 1 minute. These are valuable for your workflow.`,
        color: 'text-blue-400',
      });
    }

    // Team insights
    const avgUsers = Math.round(usageData.reduce((sum, w) => sum + w.userCount, 0) / usageData.length);
    recs.push({
      icon: Users,
      title: 'Team Usage',
      description: `On average, ${avgUsers} team members use each widget. Share popular templates with your team.`,
      color: 'text-purple-400',
    });

    return recs;
  }, [usageData, topWidgets]);

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Widget Analytics</h2>
          <p className="text-gray-400 text-sm mt-1">Track usage patterns and get personalized recommendations</p>
        </div>
        {onExportData && (
          <Button onClick={onExportData} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Widgets</p>
              <p className="text-2xl font-bold text-white mt-1">{usageData.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 border-cyan-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Usage</p>
              <p className="text-2xl font-bold text-white mt-1">
                {usageData.reduce((sum, w) => sum + w.usageCount, 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/20">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Session Time</p>
              <p className="text-2xl font-bold text-white mt-1">
                {Math.round(usageData.reduce((sum, w) => sum + w.averageSessionTime, 0) / usageData.length)}s
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20">
              <Clock className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900/20 to-amber-800/20 border-amber-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Team Members</p>
              <p className="text-2xl font-bold text-white mt-1">
                {Math.max(...usageData.map((w) => w.userCount), 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/20">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Widgets */}
        <Card className="bg-gray-900/50 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Widgets</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topWidgets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
              <Bar dataKey="usage" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Distribution */}
        <Card className="bg-gray-900/50 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8b5cf6"
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Session Time Trends */}
      <Card className="bg-gray-900/50 border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Average Session Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sessionTimeTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
            <Line type="monotone" dataKey="time" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Recommendations */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Personalized Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, idx) => {
            const Icon = rec.icon;
            return (
              <Card key={idx} className="bg-gray-900/50 border-gray-800 p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gray-800 ${rec.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{rec.title}</p>
                    <p className="text-sm text-gray-400 mt-1">{rec.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WidgetAnalyticsDashboard;
