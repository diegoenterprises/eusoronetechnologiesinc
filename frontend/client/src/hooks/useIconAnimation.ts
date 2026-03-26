/**
 * ICON HOVER ANIMATIONS — Platform-wide animated icon system
 * Import this hook anywhere to get consistent icon hover animations.
 * 
 * Usage:
 *   import { getIconAnimation } from "@/hooks/useIconAnimation";
 *   <motion.div {...getIconAnimation("Truck")}>
 *     <Truck />
 *   </motion.div>
 */

type AnimationConfig = {
  whileHover: Record<string, any>;
  transition?: Record<string, any>;
};

const animations: Record<string, AnimationConfig> = {
  // Navigation & Layout
  LayoutDashboard: { whileHover: { scale: [1, 1.15, 1.05], rotate: [0, -5, 0] }, transition: { duration: 0.5 } },
  LayoutGrid: { whileHover: { rotate: [0, 5, -5, 0], scale: 1.1 }, transition: { duration: 0.4 } },
  Menu: { whileHover: { scaleX: [1, 1.2, 1] }, transition: { duration: 0.3 } },
  Home: { whileHover: { y: [0, -3, 0], scale: 1.05 }, transition: { duration: 0.3 } },
  ArrowLeft: { whileHover: { x: [0, -4, 0] }, transition: { duration: 0.3 } },
  ArrowRight: { whileHover: { x: [0, 4, 0] }, transition: { duration: 0.3 } },
  ChevronDown: { whileHover: { y: [0, 2, 0] }, transition: { duration: 0.2 } },
  ChevronRight: { whileHover: { x: [0, 3, 0] }, transition: { duration: 0.2 } },
  ChevronLeft: { whileHover: { x: [0, -3, 0] }, transition: { duration: 0.2 } },
  ExternalLink: { whileHover: { x: [0, 3, 2], y: [0, -3, -2] }, transition: { duration: 0.3 } },
  
  // Loads & Freight
  Package: { whileHover: { y: [0, -4, 0], scale: [1, 1.1, 1] }, transition: { duration: 0.4 } },
  Boxes: { whileHover: { y: [0, -3, 0], scaleX: [1, 1.05, 1] }, transition: { duration: 0.3 } },
  Container: { whileHover: { y: [0, -3, 0], scaleX: [1, 1.05, 1] }, transition: { duration: 0.3 } },
  Combine: { whileHover: { scale: [1, 0.9, 1.1, 1.05] }, transition: { duration: 0.4 } },
  Layers: { whileHover: { y: [0, -3, 0], scale: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  
  // Vehicles & Transport
  Truck: { whileHover: { x: [0, 5, 0], scale: 1.05 }, transition: { duration: 0.6, ease: "easeInOut" } },
  Car: { whileHover: { x: [0, 4, 0] }, transition: { duration: 0.5 } },
  Ship: { whileHover: { rotate: [0, -5, 5, -3, 0], y: [0, -2, 0] }, transition: { duration: 0.6 } },
  Anchor: { whileHover: { y: [0, 3, 0], rotate: [0, -5, 0] }, transition: { duration: 0.4 } },
  Train: { whileHover: { x: [0, 4, 0], scale: 1.05 }, transition: { duration: 0.5 } },
  Plane: { whileHover: { y: [0, -5, -2], rotate: [0, -10, -5] }, transition: { duration: 0.4 } },
  Rocket: { whileHover: { y: [0, -6, -3], rotate: [0, -10, -5] }, transition: { duration: 0.4 } },
  Navigation: { whileHover: { rotate: [0, 15, -15, 0], scale: 1.1 }, transition: { duration: 0.5 } },
  Route: { whileHover: { x: [0, 3, 0], scale: 1.05 }, transition: { duration: 0.4 } },
  
  // People
  Users: { whileHover: { y: [0, -3, 0], x: [0, 2, 0] }, transition: { duration: 0.4 } },
  Users2: { whileHover: { y: [0, -3, 0], x: [0, 2, 0] }, transition: { duration: 0.4 } },
  User: { whileHover: { scale: [1, 1.15, 1.05] }, transition: { duration: 0.3 } },
  UserCheck: { whileHover: { scale: [1, 1.15, 1.05] }, transition: { duration: 0.3 } },
  UserCog: { whileHover: { rotate: [0, 10, 0], scale: 1.1 }, transition: { duration: 0.4 } },
  UserPlus: { whileHover: { scale: 1.15 }, transition: { duration: 0.2 } },
  UserMinus: { whileHover: { scale: 0.9 }, transition: { duration: 0.2 } },
  Contact: { whileHover: { scale: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  Handshake: { whileHover: { scale: 1.15, rotate: [0, -5, 0] }, transition: { duration: 0.3 } },
  
  // Money & Finance
  Wallet: { whileHover: { rotateY: [0, 180, 360], scale: 1.1 }, transition: { duration: 0.6 } },
  DollarSign: { whileHover: { y: [0, -4, 0], scale: [1, 1.2, 1] }, transition: { duration: 0.3, type: "spring" } },
  Banknote: { whileHover: { x: [0, 3, 0], rotateZ: [0, 3, 0] }, transition: { duration: 0.4 } },
  CreditCard: { whileHover: { rotateY: [0, 15, 0] }, transition: { duration: 0.4 } },
  Receipt: { whileHover: { y: [0, -4, -2] }, transition: { duration: 0.3 } },
  Percent: { whileHover: { rotate: [0, 15, 0] }, transition: { duration: 0.3 } },
  Calculator: { whileHover: { scale: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  Landmark: { whileHover: { scaleY: [1, 1.08, 1.03] }, transition: { duration: 0.3 } },
  Scale: { whileHover: { rotate: [0, -8, 8, 0] }, transition: { duration: 0.5 } },
  PieChart: { whileHover: { rotate: 45, scale: 1.1 }, transition: { duration: 0.4 } },
  
  // Documents & Files
  FileText: { whileHover: { rotateY: [0, 20, 0], scale: 1.05 }, transition: { duration: 0.4 } },
  FileCheck: { whileHover: { scale: [1, 1.15, 1.05] }, transition: { duration: 0.3 } },
  FileBarChart: { whileHover: { scaleY: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  FileStack: { whileHover: { y: [0, -3, 0] }, transition: { duration: 0.3 } },
  FileWarning: { whileHover: { rotate: [0, -5, 5, 0], scale: 1.1 }, transition: { duration: 0.4 } },
  FileSpreadsheet: { whileHover: { rotateY: [0, 15, 0] }, transition: { duration: 0.4 } },
  FileImage: { whileHover: { scale: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  FolderOpen: { whileHover: { scaleX: [1, 1.1, 1], scale: 1.05 }, transition: { duration: 0.3 } },
  ClipboardCheck: { whileHover: { y: [0, -3, 0] }, transition: { duration: 0.3 } },
  ClipboardList: { whileHover: { y: [0, -3, 0] }, transition: { duration: 0.3 } },
  BookOpen: { whileHover: { scaleX: [1, 1.15, 1.05] }, transition: { duration: 0.3 } },
  
  // Communication
  MessageSquare: { whileHover: { rotate: [0, -10, 10, -5, 0], scale: 1.1 }, transition: { duration: 0.5 } },
  MessageCircle: { whileHover: { scale: [1, 1.15, 1.05] }, transition: { duration: 0.3 } },
  Mail: { whileHover: { rotateX: [0, 20, 0], scale: 1.05 }, transition: { duration: 0.3 } },
  Send: { whileHover: { x: [0, 5, 2], y: [0, -3, -1] }, transition: { duration: 0.3 } },
  Inbox: { whileHover: { y: [0, 3, 0] }, transition: { duration: 0.3 } },
  Bell: { whileHover: { rotate: [0, 15, -15, 10, -10, 0], scale: 1.1 }, transition: { duration: 0.5 } },
  BellRing: { whileHover: { rotate: [0, 15, -15, 10, -10, 0], scale: 1.1 }, transition: { duration: 0.5 } },
  Radio: { whileHover: { scale: [1, 1.15, 1.05, 1.12, 1.05] }, transition: { duration: 0.5 } },
  Mic: { whileHover: { scaleY: [1, 1.15, 1.05] }, transition: { duration: 0.3 } },
  Phone: { whileHover: { rotate: [0, -15, 15, 0] }, transition: { duration: 0.4 } },
  Smartphone: { whileHover: { x: [0, -2, 2, -1, 1, 0] }, transition: { duration: 0.4 } },
  
  // Settings & Tools
  Settings: { whileHover: { rotate: 90, scale: 1.1 }, transition: { duration: 0.4 } },
  Wrench: { whileHover: { rotate: [0, -20, 20, 0], scale: 1.1 }, transition: { duration: 0.5 } },
  Construction: { whileHover: { rotate: [0, -15, 15, -10, 0] }, transition: { duration: 0.5 } },
  Hammer: { whileHover: { rotate: [0, -25, 0] }, transition: { duration: 0.3 } },
  PenTool: { whileHover: { rotate: [0, -10, 0], y: [0, -2, 0] }, transition: { duration: 0.3 } },
  Edit3: { whileHover: { rotate: [0, -10, 0], y: [0, -2, 0] }, transition: { duration: 0.3 } },
  Trash2: { whileHover: { rotate: [0, -10, 10, 0], y: [0, 2, 0] }, transition: { duration: 0.3 } },
  
  // Security & Safety
  Shield: { whileHover: { scale: [1, 1.2, 1.1], y: [0, -2, 0] }, transition: { duration: 0.3 } },
  ShieldCheck: { whileHover: { scale: [1, 1.2, 1.1] }, transition: { duration: 0.3 } },
  ShieldAlert: { whileHover: { rotate: [0, -5, 5, 0], scale: 1.1 }, transition: { duration: 0.4 } },
  Lock: { whileHover: { y: [0, -3, 0] }, transition: { duration: 0.3 } },
  Unlock: { whileHover: { rotate: [0, -10, 0] }, transition: { duration: 0.3 } },
  Key: { whileHover: { rotate: [0, 15, 0] }, transition: { duration: 0.3 } },
  KeyRound: { whileHover: { rotate: [0, 15, 0] }, transition: { duration: 0.3 } },
  AlertTriangle: { whileHover: { scale: [1, 1.15, 1], y: [0, -2, 0] }, transition: { duration: 0.3 } },
  AlertCircle: { whileHover: { scale: [1, 1.15, 1] }, transition: { duration: 0.3 } },
  AlertOctagon: { whileHover: { rotate: [0, -5, 5, 0], scale: 1.1 }, transition: { duration: 0.3 } },
  Siren: { whileHover: { scale: [1, 1.2, 1, 1.15, 1] }, transition: { duration: 0.4 } },
  
  // Analytics & Charts
  BarChart3: { whileHover: { scaleY: [1, 1.15, 1.05] }, transition: { duration: 0.4 } },
  TrendingUp: { whileHover: { y: [0, -4, -2], rotate: [0, -5, 0] }, transition: { duration: 0.4 } },
  TrendingDown: { whileHover: { y: [0, 4, 2], rotate: [0, 5, 0] }, transition: { duration: 0.4 } },
  Activity: { whileHover: { scaleX: [1, 1.2, 0.95, 1.1, 1] }, transition: { duration: 0.5 } },
  LineChart: { whileHover: { scaleX: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  
  // AI & Intelligence
  Brain: { whileHover: { scale: [1, 1.15, 1.05, 1.12, 1.05] }, transition: { duration: 0.6 } },
  Sparkles: { whileHover: { rotate: [0, 10, -10, 0], scale: [1, 1.2, 1.1] }, transition: { duration: 0.5 } },
  Zap: { whileHover: { scale: [1, 1.3, 1], y: [0, -3, 0] }, transition: { duration: 0.25 } },
  Wand2: { whileHover: { rotate: [0, -15, 15, 0], scale: 1.1 }, transition: { duration: 0.4 } },
  Bot: { whileHover: { y: [0, -3, 0], scale: [1, 1.1, 1.05] }, transition: { duration: 0.4 } },
  
  // Location & Maps
  MapPin: { whileHover: { y: [0, -5, -2], scale: 1.1 }, transition: { duration: 0.3, type: "spring" } },
  Map: { whileHover: { scale: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  Globe: { whileHover: { rotateY: 180 }, transition: { duration: 0.6 } },
  Compass: { whileHover: { rotate: 90 }, transition: { duration: 0.5 } },
  Radar: { whileHover: { rotate: 360 }, transition: { duration: 0.8, ease: "linear" } },
  
  // Buildings & Facilities
  Building2: { whileHover: { scaleY: [1, 1.15, 1.05], y: [0, -2, 0] }, transition: { duration: 0.4 } },
  Building: { whileHover: { scaleY: [1, 1.1, 1.03] }, transition: { duration: 0.3 } },
  Factory: { whileHover: { scaleY: [1, 1.08, 1.03], y: [0, -2, 0] }, transition: { duration: 0.4 } },
  Warehouse: { whileHover: { scaleY: [1, 1.08, 1.03] }, transition: { duration: 0.3 } },
  Store: { whileHover: { scale: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  
  // Gamification
  Trophy: { whileHover: { y: [0, -4, 0], scale: [1, 1.15, 1.05] }, transition: { duration: 0.4, type: "spring" } },
  Award: { whileHover: { rotate: [0, -10, 10, 0], scale: 1.1 }, transition: { duration: 0.4 } },
  Crown: { whileHover: { y: [0, -3, 0], scale: 1.15 }, transition: { duration: 0.3 } },
  Target: { whileHover: { scale: [1, 1.2, 0.95, 1.1], rotate: [0, 0, 0, 5] }, transition: { duration: 0.5 } },
  Gift: { whileHover: { y: [0, -5, 0], rotate: [0, -5, 5, 0] }, transition: { duration: 0.4, type: "spring" } },
  Gamepad2: { whileHover: { rotate: [0, -8, 8, 0], scale: 1.1 }, transition: { duration: 0.4 } },
  Star: { whileHover: { rotate: [0, 72, 0], scale: [1, 1.2, 1.1] }, transition: { duration: 0.5 } },
  
  // Time & Calendar
  Clock: { whileHover: { rotate: [0, 30, 0] }, transition: { duration: 0.4 } },
  Timer: { whileHover: { rotate: [0, 30, 0] }, transition: { duration: 0.4 } },
  Calendar: { whileHover: { rotateX: [0, 10, 0] }, transition: { duration: 0.3 } },
  CalendarDays: { whileHover: { rotateX: [0, 10, 0] }, transition: { duration: 0.3 } },
  History: { whileHover: { rotate: -90 }, transition: { duration: 0.4 } },
  
  // Weather & Nature
  Sun: { whileHover: { rotate: 45, scale: 1.1 }, transition: { duration: 0.5 } },
  Cloud: { whileHover: { x: [0, 3, 0] }, transition: { duration: 0.5 } },
  CloudRain: { whileHover: { y: [0, 2, 0] }, transition: { duration: 0.4 } },
  CloudLightning: { whileHover: { scale: [1, 1.15, 1] }, transition: { duration: 0.3 } },
  Wind: { whileHover: { x: [0, 5, 0] }, transition: { duration: 0.5 } },
  Snowflake: { whileHover: { rotate: 60, scale: 1.1 }, transition: { duration: 0.5 } },
  Flame: { whileHover: { y: [0, -2, 0, -1, 0], scale: [1, 1.1, 1.05] }, transition: { duration: 0.5 } },
  Droplet: { whileHover: { y: [0, 3, 0], scale: [1, 1.1, 1] }, transition: { duration: 0.3 } },
  
  // Energy & Fuel
  Fuel: { whileHover: { scale: [1, 1.1, 1.05, 1.1, 1.05] }, transition: { duration: 0.5 } },
  Battery: { whileHover: { scaleX: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  BatteryCharging: { whileHover: { scale: [1, 1.15, 1.05] }, transition: { duration: 0.4 } },
  Plug: { whileHover: { x: [0, 3, 0] }, transition: { duration: 0.3 } },
  Plug2: { whileHover: { x: [0, 3, 0] }, transition: { duration: 0.3 } },
  Power: { whileHover: { rotate: [0, 10, 0], scale: 1.1 }, transition: { duration: 0.3 } },
  
  // Health & Wellness
  Heart: { whileHover: { scale: [1, 1.25, 1, 1.2, 1] }, transition: { duration: 0.5 } },
  HeartPulse: { whileHover: { scale: [1, 1.25, 1, 1.2, 1] }, transition: { duration: 0.5 } },
  Pill: { whileHover: { rotate: [0, -15, 15, 0] }, transition: { duration: 0.4 } },
  Stethoscope: { whileHover: { rotate: [0, -10, 0] }, transition: { duration: 0.3 } },
  
  // Media & Visual
  Camera: { whileHover: { scale: [1, 0.9, 1.1, 1] }, transition: { duration: 0.3 } },
  Image: { whileHover: { scale: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  Eye: { whileHover: { scaleY: [1, 0.3, 1], scale: 1.05 }, transition: { duration: 0.4 } },
  EyeOff: { whileHover: { scaleY: [1, 0.3, 1] }, transition: { duration: 0.4 } },
  Monitor: { whileHover: { scale: [1, 1.05, 1, 1.05, 1] }, transition: { duration: 0.5 } },
  
  // Actions
  Search: { whileHover: { scale: [1, 1.2, 1.1], rotate: [0, 10, 0] }, transition: { duration: 0.3 } },
  Plus: { whileHover: { rotate: 90, scale: 1.1 }, transition: { duration: 0.3 } },
  Minus: { whileHover: { scaleX: 1.3 }, transition: { duration: 0.2 } },
  X: { whileHover: { rotate: 90, scale: 0.9 }, transition: { duration: 0.3 } },
  Check: { whileHover: { scale: [1, 1.3, 1.1] }, transition: { duration: 0.3 } },
  CheckCircle: { whileHover: { scale: [1, 1.2, 1.1] }, transition: { duration: 0.3 } },
  XCircle: { whileHover: { rotate: 90, scale: 1.1 }, transition: { duration: 0.3 } },
  RefreshCw: { whileHover: { rotate: 180 }, transition: { duration: 0.4 } },
  RotateCcw: { whileHover: { rotate: -180 }, transition: { duration: 0.4 } },
  Download: { whileHover: { y: [0, 4, 2] }, transition: { duration: 0.3 } },
  Upload: { whileHover: { y: [0, -5, -2] }, transition: { duration: 0.3 } },
  Copy: { whileHover: { x: [0, 3, 1] }, transition: { duration: 0.2 } },
  Repeat: { whileHover: { rotate: 180 }, transition: { duration: 0.5 } },
  
  // Science & Compliance
  FlaskConical: { whileHover: { rotate: [0, -10, 10, 0] }, transition: { duration: 0.4 } },
  TestTube: { whileHover: { rotate: [0, -15, 0] }, transition: { duration: 0.3 } },
  TestTube2: { whileHover: { rotate: [0, -15, 0] }, transition: { duration: 0.3 } },
  Database: { whileHover: { scaleY: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  HardDrive: { whileHover: { scale: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  Server: { whileHover: { scaleY: [1, 1.08, 1.03] }, transition: { duration: 0.3 } },
  Code: { whileHover: { scaleX: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  
  // Misc
  Flag: { whileHover: { rotate: [0, -8, 8, -4, 0] }, transition: { duration: 0.5 } },
  GraduationCap: { whileHover: { y: [0, -6, -2], rotate: [0, 10, 0] }, transition: { duration: 0.4 } },
  Newspaper: { whileHover: { rotateY: [0, 15, 0], scale: 1.05 }, transition: { duration: 0.4 } },
  HelpCircle: { whileHover: { rotate: [0, -10, 10, 0], scale: 1.1 }, transition: { duration: 0.4 } },
  Info: { whileHover: { scale: [1, 1.2, 1.1] }, transition: { duration: 0.3 } },
  Maximize2: { whileHover: { scale: 1.2 }, transition: { duration: 0.2 } },
  Minimize2: { whileHover: { scale: 0.85 }, transition: { duration: 0.2 } },
  MoreHorizontal: { whileHover: { scaleX: [1, 1.2, 1] }, transition: { duration: 0.3 } },
  Briefcase: { whileHover: { y: [0, -3, 0], scale: 1.05 }, transition: { duration: 0.3 } },
  Gauge: { whileHover: { rotate: [0, 20, 0], scale: 1.1 }, transition: { duration: 0.5 } },
  Share2: { whileHover: { scale: 1.15, rotate: [0, 10, 0] }, transition: { duration: 0.3 } },
  Link: { whileHover: { rotate: [0, -10, 10, 0] }, transition: { duration: 0.4 } },
  Columns3: { whileHover: { scaleX: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  List: { whileHover: { x: [0, 3, 0] }, transition: { duration: 0.3 } },
  Filter: { whileHover: { scaleY: [1, 0.9, 1.1, 1] }, transition: { duration: 0.3 } },
  SortAsc: { whileHover: { y: [0, -3, 0] }, transition: { duration: 0.3 } },
  SortDesc: { whileHover: { y: [0, 3, 0] }, transition: { duration: 0.3 } },
  Loader2: { whileHover: { rotate: 360 }, transition: { duration: 0.6, ease: "linear" } },
  ArrowRightLeft: { whileHover: { scaleX: [1, 1.2, 1] }, transition: { duration: 0.3 } },
  Play: { whileHover: { scale: 1.2, x: [0, 2, 0] }, transition: { duration: 0.3 } },
  Pause: { whileHover: { scale: 1.1 }, transition: { duration: 0.2 } },
  Square: { whileHover: { scale: 0.9 }, transition: { duration: 0.2 } },
  ToggleLeft: { whileHover: { scaleX: [1, 1.1, 1] }, transition: { duration: 0.3 } },
  ToggleRight: { whileHover: { scaleX: [1, 1.1, 1] }, transition: { duration: 0.3 } },
  Crosshair: { whileHover: { scale: [1, 1.2, 1.1] }, transition: { duration: 0.3 } },
  Scan: { whileHover: { scale: [1, 1.15, 1] }, transition: { duration: 0.3 } },
  QrCode: { whileHover: { scale: [1, 1.1, 1.05] }, transition: { duration: 0.3 } },
  Fingerprint: { whileHover: { scale: [1, 1.15, 1.05] }, transition: { duration: 0.4 } },
  Hash: { whileHover: { rotate: 15 }, transition: { duration: 0.3 } },
  AtSign: { whileHover: { rotate: [0, 15, 0] }, transition: { duration: 0.4 } },
  Paperclip: { whileHover: { rotate: [0, -15, 0] }, transition: { duration: 0.3 } },
  Bookmark: { whileHover: { y: [0, -3, 0] }, transition: { duration: 0.3 } },
  Tag: { whileHover: { rotate: [0, -10, 0], scale: 1.05 }, transition: { duration: 0.3 } },
  Lightbulb: { whileHover: { scale: [1, 1.2, 1.1], y: [0, -2, 0] }, transition: { duration: 0.4 } },
};

const defaultAnimation: AnimationConfig = {
  whileHover: { scale: 1.12, y: -1 },
  transition: { duration: 0.2 },
};

/**
 * Get Framer Motion hover animation props for any icon by name.
 * Spread the result onto a motion.div/motion.span:
 *   <motion.div {...getIconAnimation("Truck")}><Truck /></motion.div>
 */
export function getIconAnimation(iconName: string): AnimationConfig {
  return animations[iconName] || defaultAnimation;
}

/**
 * Full animation map — use for bulk lookups
 */
export const ICON_ANIMATIONS = animations;
export const DEFAULT_ICON_ANIMATION = defaultAnimation;
