import React from 'react';
import { Package, Clock, CheckCircle2, DollarSign, TrendingUp, LucideIcon } from 'lucide-react';

interface Metric {
  label: string;
  value: number | string;
  icon: LucideIcon;
  gradient: string;
  trend?: string;
}

interface MetricsWidgetProps {
  metrics: Metric[];
  compact?: boolean;
}

const MetricsWidget: React.FC<MetricsWidgetProps> = ({ metrics, compact = false }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={index}
            className="relative p-4 rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm overflow-hidden group"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.gradient}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {metric.trend && (
                  <span className="text-xs text-gray-400">{metric.trend}</span>
                )}
              </div>
              <p className={`text-xs text-gray-400 mb-1 ${compact ? 'text-[10px]' : ''}`}>{metric.label}</p>
              <p className={`font-bold text-white ${compact ? 'text-lg' : 'text-2xl'}`}>{metric.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsWidget;
