import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Check, X, Calendar as CalendarIcon, FileText, Bell, 
  MessageSquare, Search, Activity, TrendingUp, CheckCircle
} from 'lucide-react';

// ============================================================================
// UNIVERSAL WIDGETS
// ============================================================================

// Tasks Widget
export const TasksWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [tasks, setTasks] = useState([
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
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
          <Button size="sm" onClick={addTask} className="bg-purple-500 hover:bg-purple-600">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {tasks.slice(0, compact ? 3 : undefined).map(task => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
              task.done ? 'bg-green-500/20 text-gray-400 line-through' : 'bg-white/5 hover:bg-white/10 text-white'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              task.done ? 'border-green-500 bg-green-500' : 'border-gray-400'
            }`}>
              {task.done && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm">{task.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Notes Widget
export const NotesWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [note, setNote] = useState('');
  return (
    <div className="h-full">
      <Textarea
        placeholder="Write your notes here..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px] resize-none"
      />
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

  return (
    <div className="space-y-2">
      {notifications.slice(0, compact ? 2 : undefined).map(n => (
        <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
          <Bell className={`w-4 h-4 mt-0.5 ${n.type === 'success' ? 'text-green-400' : n.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`} />
          <div className="flex-1">
            <p className="text-sm text-white">{n.text}</p>
            <p className="text-xs text-gray-500">{n.time}</p>
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
          className="bg-white/5 border-white/20 text-white hover:bg-white/10 justify-start gap-2"
        >
          <action.icon className="w-4 h-4" />
          {!compact && action.label}
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
    <div className="space-y-2">
      {activities.slice(0, compact ? 2 : undefined).map((a, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
          <Activity className="w-4 h-4 text-purple-400" />
          <div className="flex-1">
            <p className="text-sm text-white">{a.action}</p>
            <p className="text-xs text-gray-500">{a.time}</p>
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
    <div className="space-y-3">
      {metrics.slice(0, compact ? 2 : undefined).map((m) => (
        <div key={m.label} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
          <span className="text-sm text-gray-300">{m.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">{m.value}</span>
            <span className="text-xs text-green-400">{m.trend}</span>
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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        placeholder="Search loads, carriers, documents..."
        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
      />
    </div>
  );
};

// Messages Widget
export const MessagesWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const messages = [
    { from: 'John D.', message: 'ETA updated to 3pm', time: '5m' },
    { from: 'ABC Trucking', message: 'Documents received', time: '20m' },
  ];

  return (
    <div className="space-y-2">
      {messages.map((m, i) => (
        <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
          <MessageSquare className="w-4 h-4 mt-0.5 text-blue-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{m.from}</p>
            <p className="text-xs text-gray-400">{m.message}</p>
          </div>
          <span className="text-xs text-gray-500">{m.time}</span>
        </div>
      ))}
    </div>
  );
};

// Calendar Widget
export const CalendarWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const events = [
    { title: 'Load #4521 Delivery', time: '2:00 PM' },
    { title: 'Carrier Meeting', time: '4:30 PM' },
  ];

  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
          <CalendarIcon className="w-4 h-4 text-cyan-400" />
          <div className="flex-1">
            <p className="text-sm text-white">{e.title}</p>
            <p className="text-xs text-gray-500">{e.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Re-export other widget files
export * from './WidgetAnimations';
