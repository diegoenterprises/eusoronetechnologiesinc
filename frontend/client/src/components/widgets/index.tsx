import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Check, X, Calendar as CalendarIcon, FileText, Bell, 
  MessageSquare, Search, Activity, TrendingUp, CheckCircle
} from 'lucide-react';

// Persistent state helper — saves to localStorage keyed per user
function usePersistentState<T>(key: string, defaultValue: T): [T, (v: T | ((prev: T) => T)) => void] {
  const storageKey = `eusotrip_widget_${key}`;
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
  }, [state, storageKey]);

  return [state, setState];
}

// ============================================================================
// UNIVERSAL WIDGETS — Premium Edition
// ============================================================================

// Shared premium row style
const premiumRow = "flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200";

// Tasks Widget
export const TasksWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [tasks, setTasks] = usePersistentState('tasks', [
    { id: 1, text: 'Review shipment quotes', done: false },
    { id: 2, text: 'Update carrier contracts', done: true },
    { id: 3, text: 'Schedule team meeting', done: false },
  ]);
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
    setNewTask('');
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex gap-2">
          <Input
            placeholder="Add a task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-gray-500 rounded-xl focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
          />
          <Button size="sm" onClick={addTask} className="bg-purple-500/80 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-500/20 transition-all">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
      <div className="space-y-1.5">
        {tasks.slice(0, compact ? 3 : undefined).map(task => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
              task.done
                ? 'bg-green-500/[0.08] border-green-500/20 text-gray-500'
                : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] text-white'
            }`}
          >
            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              task.done ? 'border-green-500 bg-green-500 shadow-sm shadow-green-500/30' : 'border-gray-500/60 hover:border-gray-400'
            }`}>
              {task.done && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-sm tracking-wide ${task.done ? 'line-through opacity-60' : 'font-medium'}`}>{task.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Notes Widget — Premium notebook feel
export const NotesWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [note, setNote] = usePersistentState('notes', '');
  const lineCount = 8;

  return (
    <div className="h-full relative">
      {/* Notebook paper background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
        {/* Ruled lines */}
        <div className="absolute inset-0 pt-2 px-4">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              className="border-b border-white/[0.06]"
              style={{ height: `${100 / lineCount}%` }}
            />
          ))}
        </div>
        {/* Left margin line */}
        <div className="absolute top-0 bottom-0 left-10 w-px bg-purple-500/15" />
      </div>

      <Textarea
        placeholder="Start writing..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="relative z-10 bg-transparent border-0 text-white/90 placeholder:text-gray-600 min-h-[140px] h-full resize-none rounded-xl focus:ring-0 focus:border-0 shadow-none pl-14 pr-4 pt-3 leading-[calc(100%/8*1.1)]"
        style={{
          fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
          fontSize: '14px',
          letterSpacing: '0.02em',
          lineHeight: '1.85',
        }}
      />

      {/* Page corner fold */}
      <div className="absolute bottom-0 right-0 w-6 h-6 overflow-hidden">
        <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-white/[0.08] to-transparent rotate-0 origin-bottom-right" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
      </div>
    </div>
  );
};

// Notifications Widget
export const NotificationsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const notifications = [
    { id: 1, text: 'New bid received on Load #4521', time: '5m ago', type: 'info' },
    { id: 2, text: 'Driver John arrived at destination', time: '15m ago', type: 'success' },
    { id: 3, text: 'Document expiring soon', time: '1h ago', type: 'warning' },
  ];

  const dotColor = (type: string) => type === 'success' ? 'bg-green-400 shadow-green-400/40' : type === 'warning' ? 'bg-yellow-400 shadow-yellow-400/40' : 'bg-blue-400 shadow-blue-400/40';
  const iconColor = (type: string) => type === 'success' ? 'text-green-400' : type === 'warning' ? 'text-yellow-400' : 'text-blue-400';

  return (
    <div className="space-y-1.5">
      {notifications.slice(0, compact ? 2 : undefined).map(n => (
        <div key={n.id} className={premiumRow}>
          <div className="relative flex-shrink-0">
            <Bell className={`w-4 h-4 ${iconColor(n.type)}`} />
            <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${dotColor(n.type)} shadow-sm`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium tracking-wide truncate">{n.text}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{n.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Quick Actions Widget
export const QuickActionsWidget: React.FC<{ compact?: boolean; role?: string }> = ({ compact = false }) => {
  const actions = [
    { label: 'Create Load', icon: Plus },
    { label: 'Find Carrier', icon: Search },
    { label: 'View Reports', icon: FileText },
  ];

  return (
    <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-1'} gap-2`}>
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className="bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.1] hover:border-white/[0.15] justify-start gap-3 rounded-xl h-11 transition-all duration-200 shadow-sm"
        >
          <div className="p-1.5 rounded-lg bg-purple-500/15">
            <action.icon className="w-3.5 h-3.5 text-purple-400" />
          </div>
          {!compact && <span className="text-sm font-medium tracking-wide">{action.label}</span>}
        </Button>
      ))}
    </div>
  );
};

// Recent Activity Widget
export const RecentActivityWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const activities = [
    { action: 'Load #4521 picked up', time: '10m ago' },
    { action: 'Bid accepted by ABC Trucking', time: '25m ago' },
    { action: 'New message from dispatch', time: '1h ago' },
  ];

  return (
    <div className="space-y-1.5">
      {activities.slice(0, compact ? 2 : undefined).map((a, i) => (
        <div key={i} className={premiumRow}>
          <div className="p-1.5 rounded-lg bg-purple-500/15 flex-shrink-0">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium tracking-wide truncate">{a.action}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{a.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Performance Summary Widget
export const PerformanceSummaryWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const metrics = [
    { label: 'On-Time Delivery', value: '96%', trend: '+2%' },
    { label: 'Customer Rating', value: '4.8', trend: '+0.1' },
    { label: 'Revenue MTD', value: '$125K', trend: '+15%' },
  ];

  return (
    <div className="space-y-2">
      {metrics.slice(0, compact ? 2 : undefined).map((m) => (
        <div key={m.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <span className="text-sm text-gray-400 font-medium tracking-wide">{m.label}</span>
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold text-white tabular-nums">{m.value}</span>
            <span className="text-[11px] font-semibold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-md">{m.trend}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Search Widget
export const SearchWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <Input
        placeholder="Search loads, carriers, documents..."
        className="pl-11 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-gray-600 rounded-xl h-11 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
      />
    </div>
  );
};

// Messages Widget
export const MessagesWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const messages = [
    { from: 'John D.', message: 'ETA updated to 3pm', time: '5m', initials: 'JD' },
    { from: 'ABC Trucking', message: 'Documents received', time: '20m', initials: 'AT' },
  ];

  return (
    <div className="space-y-1.5">
      {messages.map((m, i) => (
        <div key={i} className={`${premiumRow} cursor-pointer`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/25 to-purple-500/25 flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
            <span className="text-[10px] font-bold text-white/80">{m.initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white tracking-wide">{m.from}</p>
            <p className="text-[11px] text-gray-500 truncate">{m.message}</p>
          </div>
          <span className="text-[10px] text-gray-600 font-medium tabular-nums flex-shrink-0">{m.time}</span>
        </div>
      ))}
    </div>
  );
};

// Calendar Widget
export const CalendarWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const events = [
    { title: 'Load #4521 Delivery', time: '2:00 PM', color: 'cyan' },
    { title: 'Carrier Meeting', time: '4:30 PM', color: 'purple' },
  ];

  return (
    <div className="space-y-1.5">
      {events.map((e, i) => (
        <div key={i} className={premiumRow}>
          <div className={`w-1 h-8 rounded-full flex-shrink-0 ${e.color === 'cyan' ? 'bg-cyan-400' : 'bg-purple-400'}`} />
          <div className="p-1.5 rounded-lg bg-white/[0.06] flex-shrink-0">
            <CalendarIcon className={`w-3.5 h-3.5 ${e.color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium tracking-wide truncate">{e.title}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 tabular-nums">{e.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Re-export other widget files
export * from './WidgetAnimations';
