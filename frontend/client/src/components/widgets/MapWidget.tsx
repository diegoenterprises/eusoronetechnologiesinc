import React from 'react';
import RoleBasedMap from '../RoleBasedMap';

interface MapWidgetProps {
  role?: string;
  compact?: boolean;
  expanded?: boolean;
}

const MapWidget: React.FC<MapWidgetProps> = ({ role, compact = false, expanded = false }) => {
  return (
    <div className={`h-full ${compact ? 'min-h-[200px]' : 'min-h-[400px]'}`}>
      <RoleBasedMap />
    </div>
  );
};

export default MapWidget;
