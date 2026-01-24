import React from 'react';

interface KPI {
  label: string;
  value: string;
  color?: string;
}

interface KPIWidgetProps {
  kpis?: KPI[];
  compact?: boolean;
}

const KPIWidget: React.FC<KPIWidgetProps> = ({ 
  kpis = [
    { label: "Avg Response", value: "2.3s", color: "text-white" },
    { label: "Uptime", value: "99.9%", color: "text-green-400" },
    { label: "Users Online", value: "1,234", color: "text-blue-400" },
    { label: "Transactions", value: "5.2K", color: "text-purple-400" }
  ],
  compact = false
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {kpis.map((kpi, index) => (
        <div key={index} className="space-y-1">
          <p className={`text-xs text-gray-400 ${compact ? 'text-[10px]' : ''}`}>{kpi.label}</p>
          <p className={`font-bold ${compact ? 'text-lg' : 'text-2xl'} ${kpi.color || 'text-white'}`}>
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default KPIWidget;
