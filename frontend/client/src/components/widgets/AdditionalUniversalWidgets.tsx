import React, { useState } from 'react';
import { 
  BarChart3, FileText, FolderOpen, Users as UsersIcon, Megaphone,
  HelpCircle, Zap, Bookmark, Timer, Calculator, Ruler as RulerIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// Analytics Dashboard Widget
export const AnalyticsDashboardWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const metrics = [
    { label: 'Page Views', value: '12,543', change: '+12%' },
    { label: 'Active Users', value: '1,234', change: '+8%' },
    { label: 'Avg Session', value: '4:32', change: '-2%' },
  ];

  return (
    <div className="space-y-3">
      {metrics.slice(0, compact ? 2 : 3).map((metric, i) => (
        <div key={i} className="p-3 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">{metric.label}</p>
              <p className="text-xl font-bold text-white">{metric.value}</p>
            </div>
            <span className={`text-xs font-semibold ${metric.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {metric.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Reports Generator Widget
export const ReportsGeneratorWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const reports = [
    { name: 'Monthly Summary', lastRun: '2024-10-01', status: 'ready' },
    { name: 'Performance Report', lastRun: '2024-09-28', status: 'generating' },
    { name: 'Financial Analysis', lastRun: '2024-09-25', status: 'ready' },
  ];

  return (
    <div className="space-y-2">
      {reports.slice(0, compact ? 2 : 3).map((report, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-white">{report.name}</p>
                <p className="text-xs text-gray-400">Last run: {report.lastRun}</p>
              </div>
            </div>
            <Button size="sm" className="h-7 px-2 bg-blue-600 hover:bg-blue-700">
              {report.status === 'generating' ? 'Wait...' : 'Generate'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// File Manager Widget
export const FileManagerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const files = [
    { name: 'Q3 Report.pdf', size: '2.4 MB', modified: '2024-10-15' },
    { name: 'Contract.docx', size: '156 KB', modified: '2024-10-14' },
    { name: 'Invoice_1234.xlsx', size: '89 KB', modified: '2024-10-13' },
  ];

  return (
    <div className="space-y-2">
      {files.slice(0, compact ? 2 : 3).map((file, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-yellow-400" />
            <div className="flex-1">
              <p className="text-sm text-white">{file.name}</p>
              <p className="text-xs text-gray-400">{file.size} • {file.modified}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Team Collaboration Widget
export const TeamCollaborationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const members = [
    { name: 'Alice Johnson', status: 'online', role: 'Manager' },
    { name: 'Bob Smith', status: 'away', role: 'Driver' },
    { name: 'Carol White', status: 'offline', role: 'Dispatcher' },
  ];

  return (
    <div className="space-y-2">
      {members.slice(0, compact ? 2 : 3).map((member, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/30">
          <div className={`w-2 h-2 rounded-full ${
            member.status === 'online' ? 'bg-green-400 animate-pulse' :
            member.status === 'away' ? 'bg-yellow-400' :
            'bg-gray-600'
          }`} />
          <div className="flex-1">
            <p className="text-sm text-white">{member.name}</p>
            <p className="text-xs text-gray-400">{member.role}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Announcements Widget
export const AnnouncementsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const announcements = [
    { title: 'System Maintenance', date: '2024-10-20', priority: 'high' },
    { title: 'New Feature Release', date: '2024-10-18', priority: 'medium' },
    { title: 'Policy Update', date: '2024-10-15', priority: 'low' },
  ];

  return (
    <div className="space-y-2">
      {announcements.slice(0, compact ? 2 : 3).map((announcement, i) => (
        <div key={i} className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-800/30 ${
          announcement.priority === 'high' ? 'bg-red-900/10 border-red-500/30' :
          announcement.priority === 'medium' ? 'bg-yellow-900/10 border-yellow-500/30' :
          'bg-blue-900/10 border-blue-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className={`w-4 h-4 ${
              announcement.priority === 'high' ? 'text-red-400' :
              announcement.priority === 'medium' ? 'text-yellow-400' :
              'text-blue-400'
            }`} />
            <span className="text-sm font-semibold text-white">{announcement.title}</span>
          </div>
          <p className="text-xs text-gray-400">{announcement.date}</p>
        </div>
      ))}
    </div>
  );
};

// Help & Support Widget
export const HelpSupportWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const topics = [
    { title: 'Getting Started', articles: 12 },
    { title: 'Troubleshooting', articles: 24 },
    { title: 'FAQs', articles: 35 },
  ];

  return (
    <div className="space-y-2">
      {topics.slice(0, compact ? 2 : 3).map((topic, i) => (
        <div key={i} className="p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">{topic.title}</span>
            </div>
            <span className="text-xs text-gray-400">{topic.articles} articles</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Shortcuts Widget
export const ShortcutsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const shortcuts = [
    { name: 'Create Load', key: 'Ctrl+N', icon: Zap },
    { name: 'Search', key: 'Ctrl+K', icon: Zap },
    { name: 'Settings', key: 'Ctrl+,', icon: Zap },
  ];

  return (
    <div className="space-y-2">
      {shortcuts.slice(0, compact ? 2 : 3).map((shortcut, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30">
          <span className="text-sm text-white">{shortcut.name}</span>
          <kbd className="px-2 py-1 text-xs bg-gray-700 rounded border border-gray-600 text-gray-300">
            {shortcut.key}
          </kbd>
        </div>
      ))}
    </div>
  );
};

// Bookmarks Widget
export const BookmarksWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const bookmarks = [
    { name: 'Dashboard', url: '/' },
    { name: 'Loads', url: '/loads' },
    { name: 'Reports', url: '/reports' },
  ];

  return (
    <div className="space-y-2">
      {bookmarks.slice(0, compact ? 2 : 3).map((bookmark, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white">{bookmark.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Timer/Stopwatch Widget
export const TimerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className="text-center">
        <Timer className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
        <p className="text-2xl font-mono font-bold text-white">{formatTime(time)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-6 rounded-lg bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30">
        <p className="text-4xl font-mono font-bold text-white">{formatTime(time)}</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-blue-600 hover:bg-blue-700">
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button onClick={() => { setTime(0); setIsRunning(false); }} variant="outline" className="flex-1">
          Reset
        </Button>
      </div>
    </div>
  );
};

// Calculator Widget
export const CalculatorWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [display, setDisplay] = useState('0');

  const handleClick = (value: string) => {
    if (value === 'C') {
      setDisplay('0');
    } else if (value === '=') {
      try {
        setDisplay(eval(display).toString());
      } catch {
        setDisplay('Error');
      }
    } else {
      setDisplay(display === '0' ? value : display + value);
    }
  };

  if (compact) {
    return (
      <div className="text-center">
        <Calculator className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
        <p className="text-lg font-mono font-bold text-white">{display}</p>
      </div>
    );
  }

  const buttons = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'C'];

  return (
    <div className="space-y-2">
      <div className="p-3 rounded-lg bg-gray-800 border border-gray-700">
        <p className="text-right text-xl font-mono text-white">{display}</p>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {buttons.map(btn => (
          <button
            key={btn}
            onClick={() => handleClick(btn)}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold"
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

// Unit Converter Widget
export const UnitConverterWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [value, setValue] = useState('');
  const [from, setFrom] = useState('miles');
  const [to, setTo] = useState('kilometers');

  const convert = () => {
    const num = parseFloat(value) || 0;
    if (from === 'miles' && to === 'kilometers') return (num * 1.60934).toFixed(2);
    if (from === 'kilometers' && to === 'miles') return (num / 1.60934).toFixed(2);
    if (from === 'pounds' && to === 'kilograms') return (num * 0.453592).toFixed(2);
    if (from === 'kilograms' && to === 'pounds') return (num / 0.453592).toFixed(2);
    return num.toFixed(2);
  };

  if (compact) {
    return (
      <div className="text-center">
        <RulerIcon className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
        <p className="text-xs text-gray-400">Unit Converter</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter value"
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
      />
      <div className="grid grid-cols-2 gap-2">
        <select value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm">
          <option value="miles">Miles</option>
          <option value="kilometers">Kilometers</option>
          <option value="pounds">Pounds</option>
          <option value="kilograms">Kilograms</option>
        </select>
        <select value={to} onChange={(e) => setTo(e.target.value)} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm">
          <option value="miles">Miles</option>
          <option value="kilometers">Kilometers</option>
          <option value="pounds">Pounds</option>
          <option value="kilograms">Kilograms</option>
        </select>
      </div>
      {value && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30">
          <p className="text-center text-2xl font-bold text-white">{convert()}</p>
          <p className="text-center text-xs text-gray-400 mt-1">{to}</p>
        </div>
      )}
    </div>
  );
};
