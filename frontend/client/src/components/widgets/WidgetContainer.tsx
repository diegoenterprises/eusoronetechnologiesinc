import React from 'react';
import './WidgetSystem.css';

interface WidgetContainerProps {
  children: React.ReactNode;
  layout?: 'grid' | 'masonry';
  className?: string;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({ 
  children, 
  layout = 'grid',
  className = '' 
}) => {
  return (
    <div className={`widget-container ${layout} ${className}`}>
      {children}
    </div>
  );
};

export default WidgetContainer;
