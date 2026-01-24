import React, { useState } from 'react';
import { WidgetDefinition } from '@/lib/widgetLibrary';
import { Upload, AlertCircle } from 'lucide-react';

interface WidgetDropZoneProps {
  onWidgetDrop: (widget: WidgetDefinition) => void;
  isEditMode: boolean;
  children?: React.ReactNode;
}

/**
 * Drop Zone for drag-and-drop widget functionality
 * Provides visual feedback when dragging widgets over the grid
 */
export const WidgetDropZone: React.FC<WidgetDropZoneProps> = ({
  onWidgetDrop,
  isEditMode,
  children,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;

    e.preventDefault();
    e.stopPropagation();

    const hasWidgetData = e.dataTransfer.types.includes('widget');
    if (hasWidgetData) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
      setDragError(null);
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDragError('Only widgets can be dropped here');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;

    // Only set to false if leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
      setDragError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const widgetData = e.dataTransfer.getData('widget');
      if (!widgetData) {
        setDragError('No widget data found');
        return;
      }

      const widget: WidgetDefinition = JSON.parse(widgetData);
      onWidgetDrop(widget);
      setDragError(null);
    } catch (error) {
      setDragError('Failed to add widget. Please try again.');
      console.error('Drop error:', error);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-full transition-all ${
        isDragOver ? 'ring-2 ring-purple-500 ring-inset' : ''
      }`}
    >
      {/* Main content */}
      {children}

      {/* Drag overlay */}
      {isEditMode && isDragOver && (
        <div className="absolute inset-0 bg-purple-500/10 border-2 border-dashed border-purple-500 rounded-lg flex items-center justify-center pointer-events-none z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-purple-500/20 border border-purple-500/50">
              <Upload className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-purple-300">Drop widget here</p>
              <p className="text-sm text-purple-200/70">Release to add to dashboard</p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {dragError && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 pointer-events-none z-40">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{dragError}</p>
        </div>
      )}
    </div>
  );
};

export default WidgetDropZone;
