import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { 
  Plus, Check, X, Calendar as CalendarIcon, FileText, Bell, 
  MessageSquare, Search, Activity, TrendingUp, CheckCircle,
  Trash2, Clock, ArrowUpRight, Package, Truck, DollarSign, MapPin,
  AlertTriangle, CheckCircle2, Info, BarChart3, Zap, Star
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
    { id: 2, text: 'Update catalyst contracts', done: true },
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

// Notifications Widget — fetches from dashboard.getNotifications
export const NotificationsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: liveNotifications } = trpc.dashboard.getNotifications.useQuery(undefined, { staleTime: 15000 });
  const notifications = (liveNotifications || []).map((n: any) => ({
    id: n.id,
    text: n.message,
    time: n.time,
    type: n.type === 'delivery' ? 'success' : n.type === 'document' ? 'warning' : n.type === 'alert' ? 'warning' : 'info',
    read: n.read,
  }));

  const typeConfig: Record<string, { dot: string; icon: string; Icon: any }> = {
    success: { dot: 'bg-emerald-400 shadow-emerald-400/40', icon: 'text-emerald-400', Icon: CheckCircle2 },
    warning: { dot: 'bg-amber-400 shadow-amber-400/40', icon: 'text-amber-400', Icon: AlertTriangle },
    info: { dot: 'bg-blue-400 shadow-blue-400/40', icon: 'text-blue-400', Icon: Info },
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="space-y-2">
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-blue-400">{unreadCount}</span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">unread</span>
        </div>
      )}
      {notifications.slice(0, compact ? 3 : 6).map((n: any) => {
        const cfg = typeConfig[n.type] || typeConfig.info;
        const NIcon = cfg.Icon;
        return (
          <div key={n.id} className={`${premiumRow} ${!n.read ? 'border-l-2 border-l-blue-400/60' : ''}`}>
            <div className="relative flex-shrink-0">
              <NIcon className={`w-4 h-4 ${cfg.icon}`} />
              {!n.read && <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${cfg.dot} shadow-sm animate-pulse`} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium tracking-wide truncate ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.text}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />{n.time}
              </p>
            </div>
          </div>
        );
      })}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-gray-500">
          <Bell className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-xs">No notifications</p>
        </div>
      )}
    </div>
  );
};

// Quick Actions Widget — role-aware actions
export const QuickActionsWidget: React.FC<{ compact?: boolean; role?: string }> = ({ compact = false, role = 'SHIPPER' }) => {
  const roleActions: Record<string, Array<{ label: string; icon: any; color: string; gradient: string }>> = {
    SHIPPER: [
      { label: 'Create Load', icon: Package, color: 'text-blue-400', gradient: 'from-blue-500/20 to-blue-600/10' },
      { label: 'Find Catalyst', icon: Truck, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-emerald-600/10' },
      { label: 'Track Shipments', icon: MapPin, color: 'text-purple-400', gradient: 'from-purple-500/20 to-purple-600/10' },
      { label: 'View Reports', icon: BarChart3, color: 'text-cyan-400', gradient: 'from-cyan-500/20 to-cyan-600/10' },
    ],
    CATALYST: [
      { label: 'Browse Loads', icon: Search, color: 'text-blue-400', gradient: 'from-blue-500/20 to-blue-600/10' },
      { label: 'Fleet Status', icon: Truck, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-emerald-600/10' },
      { label: 'Dispatch', icon: Zap, color: 'text-amber-400', gradient: 'from-amber-500/20 to-amber-600/10' },
      { label: 'Earnings', icon: DollarSign, color: 'text-green-400', gradient: 'from-green-500/20 to-green-600/10' },
    ],
    BROKER: [
      { label: 'Post Load', icon: Plus, color: 'text-blue-400', gradient: 'from-blue-500/20 to-blue-600/10' },
      { label: 'Find Catalyst', icon: Search, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-emerald-600/10' },
      { label: 'Margins', icon: DollarSign, color: 'text-amber-400', gradient: 'from-amber-500/20 to-amber-600/10' },
      { label: 'Bids', icon: TrendingUp, color: 'text-purple-400', gradient: 'from-purple-500/20 to-purple-600/10' },
    ],
    DRIVER: [
      { label: 'My Route', icon: MapPin, color: 'text-blue-400', gradient: 'from-blue-500/20 to-blue-600/10' },
      { label: 'HOS Log', icon: Clock, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-emerald-600/10' },
      { label: 'Fuel Stops', icon: Zap, color: 'text-amber-400', gradient: 'from-amber-500/20 to-amber-600/10' },
      { label: 'Documents', icon: FileText, color: 'text-purple-400', gradient: 'from-purple-500/20 to-purple-600/10' },
    ],
  };

  const actions = roleActions[role] || roleActions.SHIPPER;

  return (
    <div className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-2'} gap-2`}>
      {actions.map((action) => (
        <button
          key={action.label}
          className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br ${action.gradient} border border-white/[0.06] hover:border-white/[0.15] hover:scale-[1.02] transition-all duration-200 group`}
        >
          <div className="p-2 rounded-xl bg-white/[0.06] group-hover:bg-white/[0.12] transition-colors">
            <action.icon className={`w-4 h-4 ${action.color}`} />
          </div>
          <span className="text-[11px] font-semibold text-gray-300 group-hover:text-white tracking-wide transition-colors">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

// Recent Activity Widget — fetches from dashboard.getRecentActivity
export const RecentActivityWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: liveActivity } = trpc.dashboard.getRecentActivity.useQuery(undefined, { staleTime: 20000 });
  const activities = (liveActivity || []).map((a: any) => ({
    id: a.id,
    action: a.action,
    details: a.details,
    time: a.time,
    user: a.user,
  }));

  const actionColors: Record<string, { bg: string; text: string }> = {
    'Load Created': { bg: 'bg-blue-500/15', text: 'text-blue-400' },
    'Bid Accepted': { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    'Driver Assigned': { bg: 'bg-purple-500/15', text: 'text-purple-400' },
    'POD Uploaded': { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  };

  return (
    <div className="space-y-1.5">
      {activities.slice(0, compact ? 3 : 6).map((a: any, i: number) => {
        const colors = actionColors[a.action] || { bg: 'bg-purple-500/15', text: 'text-purple-400' };
        return (
          <div key={a.id || i} className={`${premiumRow} group cursor-pointer`}>
            <div className={`p-1.5 rounded-lg ${colors.bg} flex-shrink-0`}>
              <Activity className={`w-3.5 h-3.5 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-white font-medium tracking-wide truncate">{a.action}</p>
                <ArrowUpRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">{a.details}</p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-[10px] text-gray-600 font-medium tabular-nums">{a.time}</span>
              {a.user && <span className="text-[9px] text-gray-700 mt-0.5">{a.user}</span>}
            </div>
          </div>
        );
      })}
      {activities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-gray-500">
          <Activity className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-xs">No recent activity</p>
        </div>
      )}
    </div>
  );
};

// Performance Summary Widget — fetches from dashboard.getStats
export const PerformanceSummaryWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: stats } = trpc.dashboard.getStats.useQuery(undefined, { staleTime: 30000 });

  const s = stats as any;
  const metrics = s ? [
    { label: 'Active Loads', value: String(s.activeLoads ?? s.totalLoads ?? 0), trend: s.loadsTrend || '+0', icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Revenue MTD', value: `$${((s.revenue ?? s.monthRevenue ?? 0) / 1000).toFixed(0)}K`, trend: s.revenueTrend || '+0%', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'On-Time Rate', value: `${s.onTimeRate ?? s.onTimeDelivery ?? 95}%`, trend: s.onTimeTrend || '+1%', icon: CheckCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Rating', value: String(s.rating ?? s.customerRating ?? '4.8'), trend: s.ratingTrend || '+0.1', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ] : [
    { label: 'Active Loads', value: '—', trend: '', icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Revenue MTD', value: '—', trend: '', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'On-Time Rate', value: '—', trend: '', icon: CheckCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Rating', value: '—', trend: '', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
      {metrics.slice(0, compact ? 4 : undefined).map((m) => (
        <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-all">
          <div className={`p-2 rounded-xl ${m.bg} flex-shrink-0`}>
            <m.icon className={`w-4 h-4 ${m.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-500 font-medium tracking-wide">{m.label}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold text-white tabular-nums">{m.value}</span>
              {m.trend && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  m.trend.startsWith('+') ? 'text-emerald-400 bg-emerald-400/10' : m.trend.startsWith('-') ? 'text-red-400 bg-red-400/10' : 'text-gray-400 bg-gray-400/10'
                }`}>{m.trend}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Search Widget — enhanced with keyboard shortcut hint and recent searches
export const SearchWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [query, setQuery] = useState('');
  const [recentSearches] = usePersistentState<string[]>('recent_searches', ['LOAD-45901', 'ABC Transport', 'Dallas terminal']);

  return (
    <div className="space-y-3">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
        <Input
          placeholder="Search loads, catalysts, documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11 pr-16 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-gray-600 rounded-xl h-11 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded-md font-mono">⌘K</kbd>
      </div>
      {!compact && !query && (
        <div className="flex flex-wrap gap-1.5">
          {recentSearches.map((s, i) => (
            <button
              key={i}
              onClick={() => setQuery(s)}
              className="text-[11px] text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg hover:bg-white/[0.08] hover:text-gray-300 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Messages Widget — enhanced with online indicators and unread badges
export const MessagesWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const messages = [
    { from: 'John Davis', message: 'ETA updated to 3:00 PM — on schedule', time: '5m', initials: 'JD', online: true, unread: 2, gradient: 'from-blue-500/30 to-cyan-500/20' },
    { from: 'ABC Transport', message: 'Rate confirmation signed and returned', time: '20m', initials: 'AT', online: true, unread: 0, gradient: 'from-emerald-500/30 to-green-500/20' },
    { from: 'Sarah Miller', message: 'POD uploaded for LOAD-45892', time: '1h', initials: 'SM', online: false, unread: 1, gradient: 'from-purple-500/30 to-pink-500/20' },
    { from: 'Dispatch Ops', message: 'Driver reassignment for tomorrow', time: '2h', initials: 'DO', online: true, unread: 0, gradient: 'from-amber-500/30 to-orange-500/20' },
  ];

  const totalUnread = messages.reduce((sum, m) => sum + m.unread, 0);

  return (
    <div className="space-y-2">
      {totalUnread > 0 && (
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-gray-500 font-medium">{totalUnread} unread</span>
          </div>
          <button className="text-[11px] text-purple-400 hover:text-purple-300 font-medium transition-colors">Mark all read</button>
        </div>
      )}
      {messages.slice(0, compact ? 2 : 4).map((m, i) => (
        <div key={i} className={`${premiumRow} cursor-pointer group`}>
          <div className="relative flex-shrink-0">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center border border-white/[0.08]`}>
              <span className="text-[10px] font-bold text-white/90">{m.initials}</span>
            </div>
            {m.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white tracking-wide truncate">{m.from}</p>
              {m.unread > 0 && (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-white">{m.unread}</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-500 truncate group-hover:text-gray-400 transition-colors">{m.message}</p>
          </div>
          <span className="text-[10px] text-gray-600 font-medium tabular-nums flex-shrink-0">{m.time}</span>
        </div>
      ))}
    </div>
  );
};

// Calendar Widget — enhanced with today's date header and color-coded events
export const CalendarWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const events = [
    { title: 'Load #45901 Pickup', time: '9:00 AM', endTime: '10:00 AM', color: 'blue', type: 'pickup' },
    { title: 'Catalyst Rate Review', time: '11:30 AM', endTime: '12:00 PM', color: 'purple', type: 'meeting' },
    { title: 'Load #45905 Delivery', time: '2:00 PM', endTime: '3:00 PM', color: 'cyan', type: 'delivery' },
    { title: 'Safety Briefing', time: '4:30 PM', endTime: '5:00 PM', color: 'amber', type: 'meeting' },
  ];

  const colorMap: Record<string, { bar: string; bg: string; icon: string }> = {
    blue: { bar: 'bg-blue-400', bg: 'bg-blue-500/10', icon: 'text-blue-400' },
    purple: { bar: 'bg-purple-400', bg: 'bg-purple-500/10', icon: 'text-purple-400' },
    cyan: { bar: 'bg-cyan-400', bg: 'bg-cyan-500/10', icon: 'text-cyan-400' },
    amber: { bar: 'bg-amber-400', bg: 'bg-amber-500/10', icon: 'text-amber-400' },
  };

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-white tabular-nums">{dateStr}</p>
            <p className="text-[11px] text-gray-500">{dayName}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] text-gray-500 font-medium">{events.length} events today</span>
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        {events.slice(0, compact ? 2 : 4).map((e, i) => {
          const c = colorMap[e.color] || colorMap.blue;
          return (
            <div key={i} className={`${premiumRow} group cursor-pointer`}>
              <div className={`w-1 h-10 rounded-full flex-shrink-0 ${c.bar}`} />
              <div className={`p-1.5 rounded-lg ${c.bg} flex-shrink-0`}>
                <CalendarIcon className={`w-3.5 h-3.5 ${c.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium tracking-wide truncate group-hover:text-purple-200 transition-colors">{e.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 tabular-nums">{e.time} — {e.endTime}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Re-export other widget files
export * from './WidgetAnimations';
