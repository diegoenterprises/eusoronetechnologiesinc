import { useState, useEffect } from 'react';

export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetConfig {
  id: string;
  title: string;
  size: WidgetSize;
  visible: boolean;
  order: number;
}

interface UseWidgetStateReturn {
  widgets: WidgetConfig[];
  updateWidgetSize: (id: string, size: WidgetSize) => void;
  toggleWidgetVisibility: (id: string) => void;
  removeWidget: (id: string) => void;
  addWidget: (widget: WidgetConfig) => void;
  reorderWidgets: (newOrder: WidgetConfig[]) => void;
  resetToDefault: () => void;
}

export function useWidgetState(
  role: string,
  defaultWidgets: WidgetConfig[]
): UseWidgetStateReturn {
  const storageKey = `eusotrip-widgets-${role}`;

  // Initialize state from localStorage or defaults
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new widgets
        const storedIds = new Set(parsed.map((w: WidgetConfig) => w.id));
        const newWidgets = defaultWidgets.filter(w => !storedIds.has(w.id));
        return [...parsed, ...newWidgets].sort((a, b) => a.order - b.order);
      }
    } catch (error) {
      console.error('Failed to load widget state from localStorage:', error);
    }
    return defaultWidgets;
  });

  // Persist to localStorage whenever widgets change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widgets));
    } catch (error) {
      console.error('Failed to save widget state to localStorage:', error);
    }
  }, [widgets, storageKey]);

  const updateWidgetSize = (id: string, size: WidgetSize) => {
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, size } : w))
    );
  };

  const toggleWidgetVisibility = (id: string) => {
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const removeWidget = (id: string) => {
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, visible: false } : w))
    );
  };

  const addWidget = (widget: WidgetConfig) => {
    setWidgets(prev => {
      const exists = prev.find(w => w.id === widget.id);
      if (exists) {
        // Widget exists, just make it visible
        return prev.map(w => (w.id === widget.id ? { ...w, visible: true } : w));
      }
      // New widget, add to end
      return [...prev, { ...widget, order: prev.length }];
    });
  };

  const reorderWidgets = (newOrder: WidgetConfig[]) => {
    setWidgets(newOrder.map((w, index) => ({ ...w, order: index })));
  };

  const resetToDefault = () => {
    setWidgets(defaultWidgets);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear widget state from localStorage:', error);
    }
  };

  return {
    widgets,
    updateWidgetSize,
    toggleWidgetVisibility,
    removeWidget,
    addWidget,
    reorderWidgets,
    resetToDefault
  };
}
