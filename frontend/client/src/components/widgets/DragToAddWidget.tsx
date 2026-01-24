import React, { useState } from 'react';
import { WidgetDefinition } from '@/lib/widgetLibrary';
import { GripHorizontal, Plus } from 'lucide-react';

interface DragToAddWidgetProps {
  widget: WidgetDefinition;
  isActive: boolean;
  onDragStart: (e: React.DragEvent, widget: WidgetDefinition) => void;
  onAddClick: () => void;
}

/**
 * Draggable widget card for marketplace sidebar
 * Supports both drag-to-add and click-to-add
 */
export const DragToAddWidget: React.FC<DragToAddWidgetProps> = ({
  widget,
  isActive,
  onDragStart,
  onAddClick,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const Icon = widget.icon;

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('widget', JSON.stringify(widget));
    onDragStart(e, widget);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'bg-purple-600/40 border-purple-400 shadow-lg shadow-purple-500/50 scale-105'
          : isActive
          ? 'bg-gray-700 border-gray-600'
          : 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-gray-700 hover:border-purple-500/50 hover:bg-purple-500/15'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div className="flex-shrink-0 pt-0.5 opacity-50 hover:opacity-100 transition-opacity">
          <GripHorizontal className="w-4 h-4 text-gray-400" />
        </div>

        {/* Icon and content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-white truncate">{widget.name}</p>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2">{widget.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">
              {widget.category}
            </span>
            {widget.premium && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-900/40 text-amber-300 border border-amber-500/30">
                Premium
              </span>
            )}
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={onAddClick}
          className={`flex-shrink-0 p-2 rounded-lg transition-all ${
            isActive
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-gray-800 text-gray-400 hover:bg-purple-600 hover:text-white border border-gray-700 hover:border-purple-500'
          }`}
          title={isActive ? 'Widget already added' : 'Click to add widget'}
          disabled={isActive}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Drag hint */}
      {!isActive && (
        <div className="mt-2 text-xs text-gray-500 text-center italic">
          Drag to add to dashboard
        </div>
      )}
    </div>
  );
};

export default DragToAddWidget;
