import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Palette } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export interface WidgetSettingsData {
  refreshInterval: number;
  theme: 'default' | 'dark' | 'light' | 'glass' | 'neon';
  opacity: number;
  blur: number;
  showHeader: boolean;
  showBorder: boolean;
  accentColor: string;
}

const defaultSettings: WidgetSettingsData = {
  refreshInterval: 30,
  theme: 'default',
  opacity: 80,
  blur: 10,
  showHeader: true,
  showBorder: true,
  accentColor: '#06b6d4',
};

const refreshOptions = [
  { value: 0, label: 'Off' },
  { value: 10, label: '10 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
];

const themeOptions = [
  { value: 'default', label: 'Default', preview: 'bg-gray-800/80' },
  { value: 'dark', label: 'Dark', preview: 'bg-gray-900/90' },
  { value: 'light', label: 'Light', preview: 'bg-gray-100/80' },
  { value: 'glass', label: 'Glass', preview: 'bg-white/10' },
  { value: 'neon', label: 'Neon', preview: 'bg-purple-900/30' },
];

const accentColors = [
  { value: '#06b6d4', name: 'Cyan' },
  { value: '#8b5cf6', name: 'Purple' },
  { value: '#10b981', name: 'Emerald' },
  { value: '#f59e0b', name: 'Amber' },
  { value: '#ef4444', name: 'Red' },
  { value: '#3b82f6', name: 'Blue' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#14b8a6', name: 'Teal' },
];

interface WidgetSettingsProps {
  widgetId: string;
  widgetName: string;
  onSettingsChange?: (settings: WidgetSettingsData) => void;
}

export const WidgetSettingsButton: React.FC<WidgetSettingsProps> = ({
  widgetId,
  widgetName,
  onSettingsChange,
}) => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<WidgetSettingsData>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem(`widget-settings-${widgetId}`);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to parse widget settings:', e);
      }
    }
  }, [widgetId]);

  const saveSettings = (newSettings: WidgetSettingsData) => {
    setSettings(newSettings);
    localStorage.setItem(`widget-settings-${widgetId}`, JSON.stringify(newSettings));
    onSettingsChange?.(newSettings);
  };

  const updateSetting = <K extends keyof WidgetSettingsData>(key: K, value: WidgetSettingsData[K]) => {
    saveSettings({ ...settings, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all opacity-0 group-hover:opacity-100">
          <Settings className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            {widgetName} Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm text-gray-300">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Auto-Refresh Interval
            </Label>
            <Select value={settings.refreshInterval.toString()} onValueChange={(v) => updateSetting('refreshInterval', parseInt(v))}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {refreshOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm text-gray-300">
              <Palette className="w-4 h-4 text-purple-400" />
              Widget Theme
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {themeOptions.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => updateSetting('theme', theme.value as any)}
                  className={`p-2 rounded-lg border-2 transition-all ${settings.theme === theme.value ? 'border-cyan-500' : 'border-gray-700 hover:border-gray-600'}`}
                >
                  <div className={`w-full h-8 rounded ${theme.preview}`}></div>
                  <p className="text-xs mt-1 text-gray-400">{theme.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-300">Accent Color</Label>
            <div className="flex gap-2 flex-wrap">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateSetting('accentColor', color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${settings.accentColor === color.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm text-gray-300">
              <span>Background Opacity</span>
              <span className="text-cyan-400">{settings.opacity}%</span>
            </Label>
            <Slider value={[settings.opacity]} onValueChange={([v]) => updateSetting('opacity', v)} min={20} max={100} step={5} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm text-gray-300">
              <span>Blur Effect</span>
              <span className="text-cyan-400">{settings.blur}px</span>
            </Label>
            <Slider value={[settings.blur]} onValueChange={([v]) => updateSetting('blur', v)} min={0} max={20} step={1} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-300">Show Header</Label>
              <Switch checked={settings.showHeader} onCheckedChange={(v) => updateSetting('showHeader', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-300">Show Border</Label>
              <Switch checked={settings.showBorder} onCheckedChange={(v) => updateSetting('showBorder', v)} />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <Button onClick={() => saveSettings(defaultSettings)} variant="outline" className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700">
              Reset to Defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function useWidgetSettings(widgetId: string): WidgetSettingsData {
  const [settings, setSettings] = useState<WidgetSettingsData>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem(`widget-settings-${widgetId}`);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to parse widget settings:', e);
      }
    }
  }, [widgetId]);

  return settings;
}

export default WidgetSettingsButton;
