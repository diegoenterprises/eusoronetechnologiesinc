import React, { useState } from 'react';
import { WidgetDefinition } from '@/lib/widgetLibrary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Settings, Palette, RotateCcw, Database } from 'lucide-react';

export interface WidgetCustomization {
  widgetId: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  refreshRate?: number; // in seconds
  dataSource?: string;
  compactMode?: boolean;
  opacity?: number;
}

interface WidgetCustomizationPanelProps {
  widget: WidgetDefinition;
  onCustomizationChange: (customization: WidgetCustomization) => void;
  currentCustomization?: WidgetCustomization;
}

const COLOR_PRESETS = [
  { name: 'Purple', bg: 'from-purple-900/20 to-purple-800/20', border: 'border-purple-500/30' },
  { name: 'Blue', bg: 'from-blue-900/20 to-blue-800/20', border: 'border-blue-500/30' },
  { name: 'Cyan', bg: 'from-cyan-900/20 to-cyan-800/20', border: 'border-cyan-500/30' },
  { name: 'Green', bg: 'from-green-900/20 to-green-800/20', border: 'border-green-500/30' },
  { name: 'Red', bg: 'from-red-900/20 to-red-800/20', border: 'border-red-500/30' },
  { name: 'Pink', bg: 'from-pink-900/20 to-pink-800/20', border: 'border-pink-500/30' },
];

const REFRESH_RATES = [
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
  { label: 'Manual', value: 0 },
];

const DATA_SOURCES = [
  { label: 'Live', value: 'live' },
  { label: 'Cached', value: 'cached' },
  { label: 'Historical', value: 'historical' },
  { label: 'Simulated', value: 'simulated' },
];

/**
 * Widget Customization Panel
 * Allows users to customize widget appearance, refresh rates, and data sources
 */
export const WidgetCustomizationPanel: React.FC<WidgetCustomizationPanelProps> = ({
  widget,
  onCustomizationChange,
  currentCustomization,
}) => {
  const [customization, setCustomization] = useState<WidgetCustomization>(
    currentCustomization || { widgetId: widget.id }
  );

  const handleColorPresetChange = (preset: typeof COLOR_PRESETS[0]) => {
    const updated = { ...customization, backgroundColor: preset.bg, borderColor: preset.border };
    setCustomization(updated);
    onCustomizationChange(updated);
  };

  const handleRefreshRateChange = (rate: number) => {
    const updated = { ...customization, refreshRate: rate };
    setCustomization(updated);
    onCustomizationChange(updated);
  };

  const handleDataSourceChange = (source: string) => {
    const updated = { ...customization, dataSource: source };
    setCustomization(updated);
    onCustomizationChange(updated);
  };

  const handleOpacityChange = (value: number[]) => {
    const updated = { ...customization, opacity: value[0] };
    setCustomization(updated);
    onCustomizationChange(updated);
  };

  const handleReset = () => {
    const reset = { widgetId: widget.id };
    setCustomization(reset);
    onCustomizationChange(reset);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-700"
          title="Customize widget"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Customize {widget.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Personalize this widget's appearance and behavior
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Color Presets */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-white">
              <Palette className="w-4 h-4 text-purple-400" />
              Theme
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleColorPresetChange(preset)}
                  className={`p-3 rounded-lg border-2 transition-all ${preset.bg} ${preset.border} ${
                    customization.backgroundColor === preset.bg
                      ? 'border-purple-400 ring-2 ring-purple-500/50'
                      : 'border-gray-700'
                  }`}
                  title={preset.name}
                >
                  <span className="text-xs text-gray-300">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Refresh Rate */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-white">
              <RotateCcw className="w-4 h-4 text-purple-400" />
              Refresh Rate
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {REFRESH_RATES.map((rate) => (
                <button
                  key={rate.value}
                  onClick={() => handleRefreshRateChange(rate.value)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    customization.refreshRate === rate.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {rate.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Source */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-white">
              <Database className="w-4 h-4 text-purple-400" />
              Data Source
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {DATA_SOURCES.map((source) => (
                <button
                  key={source.value}
                  onClick={() => handleDataSourceChange(source.value)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    customization.dataSource === source.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {source.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity */}
          <div className="space-y-3">
            <Label className="text-white">
              Opacity: {Math.round((customization.opacity || 100) * 100) / 100}%
            </Label>
            <Slider
              value={[customization.opacity || 100]}
              onValueChange={handleOpacityChange}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Compact Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <Label className="text-white cursor-pointer">Compact Mode</Label>
            <button
              onClick={() => {
                const updated = { ...customization, compactMode: !customization.compactMode };
                setCustomization(updated);
                onCustomizationChange(updated);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                customization.compactMode ? 'bg-purple-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  customization.compactMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            className="flex-1 border-gray-700 hover:bg-gray-800"
            onClick={handleReset}
          >
            Reset to Default
          </Button>
          <DialogTrigger asChild>
            <Button className="flex-1 bg-purple-600 hover:bg-purple-700">Done</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetCustomizationPanel;
