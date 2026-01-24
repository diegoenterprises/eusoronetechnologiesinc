import React, { useState } from 'react';
import './WidgetSystem.css';

type WidgetSize = 'small' | 'medium' | 'large';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  initialSize?: WidgetSize;
  customizable?: boolean;
  onSizeChange?: (newSize: WidgetSize) => void;
  onClose?: () => void;
  showSettings?: boolean;
  onSettings?: () => void;
  className?: string;
  id?: string;
}

const Widget: React.FC<WidgetProps> = ({ 
  title,
  children,
  initialSize = 'medium',
  customizable = true,
  onSizeChange,
  onClose,
  showSettings = false,
  onSettings,
  className = '',
  id
}) => {
  const [size, setSize] = useState<WidgetSize>(initialSize);
  
  const sizes: WidgetSize[] = ['small', 'medium', 'large'];
  
  const handleResize = () => {
    const currentIndex = sizes.indexOf(size);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];
    setSize(nextSize);
    onSizeChange?.(nextSize);
  };

  return (
    <div 
      className={`widget-glass ${size} ${className}`}
      data-widget-id={id}
    >
      <div className="widget-header">
        <h3>{title}</h3>
        <div className="widget-controls">
          {customizable && (
            <button 
              className="widget-btn resize-btn"
              onClick={handleResize}
              aria-label="Resize widget"
              title="Resize"
            />
          )}
          {showSettings && (
            <button 
              className="widget-btn settings-btn"
              onClick={onSettings}
              aria-label="Widget settings"
              title="Settings"
            />
          )}
          {onClose && (
            <button 
              className="widget-btn close-btn"
              onClick={onClose}
              aria-label="Close widget"
              title="Close"
            />
          )}
        </div>
      </div>
      <div className="widget-content">
        {children}
      </div>
    </div>
  );
};

export default Widget;
