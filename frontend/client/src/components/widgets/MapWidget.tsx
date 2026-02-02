import React from 'react';
import RoleBasedMap from '../RoleBasedMap';

interface MapWidgetProps {
  role?: string;
  compact?: boolean;
  expanded?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const MapWidget: React.FC<MapWidgetProps> = ({ 
  role, 
  compact = false, 
  expanded = false,
  autoRefresh = true,
  refreshInterval = 30000,
}) => {
  const height = compact ? 'h-[200px]' : expanded ? 'h-[600px]' : 'h-[400px]';
  
  return (
    <div className="h-full w-full">
      <RoleBasedMap 
        height={height}
        autoRefresh={autoRefresh}
        refreshInterval={refreshInterval}
      />
    </div>
  );
};

export default MapWidget;
