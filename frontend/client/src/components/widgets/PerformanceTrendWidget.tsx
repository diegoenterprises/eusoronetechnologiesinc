import React from 'react';

interface TrendData {
  week: string;
  value: number;
}

interface PerformanceTrendWidgetProps {
  data?: TrendData[];
  compact?: boolean;
}

const PerformanceTrendWidget: React.FC<PerformanceTrendWidgetProps> = ({ 
  data = [
    { week: "Week 1", value: 65 },
    { week: "Week 2", value: 78 },
    { week: "Week 3", value: 82 },
    { week: "Week 4", value: 91 }
  ],
  compact = false
}) => {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.week}>
          <div className="flex justify-between mb-2">
            <span className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>{item.week}</span>
            <span className={`font-semibold text-white ${compact ? 'text-xs' : 'text-sm'}`}>{item.value}%</span>
          </div>
          <div className={`w-full bg-gray-800 rounded-full ${compact ? 'h-2' : 'h-3'}`}>
            <div 
              className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 h-3 rounded-full transition-all shadow-lg shadow-purple-500/50"
              style={{ width: `${item.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PerformanceTrendWidget;
