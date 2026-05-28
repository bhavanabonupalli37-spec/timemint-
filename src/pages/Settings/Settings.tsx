import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { 
  User, Palette, Flame, CheckSquare, Calendar, Bell, EyeOff, Database, 
  ShieldCheck, Eye, Layers, Brain, BarChart3, Activity, HelpCircle, Info, 
  Search, Download, Upload, Trash2, ShieldAlert, Key, Lock, Sparkles, 
  Check, Play, Square, Settings as SettingsIcon, ChevronRight, ChevronLeft, Volume2, 
  Globe, Save, Edit2, FileText, Share2, Award, Zap, Vibrate, CheckCircle, 
  Clock, LogOut, Terminal, History, Plus, X, AlertTriangle, MessageSquare
} from 'lucide-react';
import { 
  getSavedSettings,
  saveSettings,
  addLog,
  subscribeToLogs,
  speakAnnouncement,
  simulateTaskReminder,
  triggerAlarm,
  stopAlarm,
  sendNotification
} from '../../lib/notifications';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc, arrayUnion, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { 
  SettingsData, 
  DEFAULT_SETTINGS, 
  ACCENT_COLORS, 
  AVATAR_SEEDS, 
  AmbientFocusSoundPlayer 
} from './SettingsData';
import { 
  UserGuideModal, 
  FAQModal, 
  SupportContactModal, 
  FeedbackModal, 
  DoubleConfirmDialog 
} from './SettingsHelpModals';
import { SETTINGS_REGISTRY, SettingRegistryItem } from './SettingsRegistry';
import { SettingsDetailsModal } from './SettingsDetailsModal';
import { SettingsDrawer } from './SettingsDrawer';

const iconMap: Record<string, React.ComponentType<any>> = {
  palette: Palette,
  flame: Flame,
  checkSquare: CheckSquare,
  calendar: Calendar,
  bell: Bell,
  eyeOff: EyeOff,
  database: Database,
  shieldCheck: ShieldCheck,
  eye: Eye,
  layers: Layers,
  brain: Brain,
  barChart: BarChart3,
  activity: Activity,
  help: HelpCircle,
  info: Info,
  lock: Lock,
  user: User,
  volume: Volume2,
  vibrate: Vibrate,
  zap: Zap,
  award: Award,
  clock: Clock,
  key: Key
};

export default function Settings() {
  const { user } = useAuth();
  
  // Local core registries
  const [logs, setLogs] = useState<string[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTab, setActiveTab] = useState<any>('profile');
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'content'>('list');
  
  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setSearchQuery('');
    setMobileActiveView('content');
    triggerToast(`Active workspace: ${tabId.toUpperCase()}`, "info");
  };
  
  // Main reactive settings data
  const [settings, setSettings] = useState<SettingsData>(() => {
    const saved = localStorage.getItem('timemint_settings_v32');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);
  
  // Custom dialogs
  const [activeModal, setActiveModal] = useState<any>(null);
  const [activeConfigureSetting, setActiveConfigureSetting] = useState<SettingRegistryItem | null>(null);
  const [activeDetailsSetting, setActiveDetailsSetting] = useState<SettingRegistryItem | null>(null);

  // Buffer profile fields
  const [profileForm, setProfileForm] = useState({
    fullName: settings.fullName,
    email: settings.email,
    employeeId: settings.employeeId,
    department: settings.department,
    designation: settings.designation,
    timezone: settings.timezone,
    language: settings.language,
    bio: settings.bio,
    avatarUrl: settings.avatarUrl
  });

  // Background Synth Sound Support helper
  const playSynthSoundPreview = (soundName: string, volPercentage: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      const volume = (volPercentage / 100) * 0.15; // ear-safe
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      
      if (soundName === 'Digital Beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (soundName === 'Classic Alarm') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (['Gentle Bell', 'Clock Bell', 'Focus Bell'].includes(soundName)) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        
        const osc2 = ctx.createOscillator();
        const gainNode2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        gainNode2.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc2.connect(gainNode2);
        gainNode2.connect(ctx.destination);
        
        osc.start();
        osc2.start();
        osc.stop(ctx.currentTime + 1.1);
        osc2.stop(ctx.currentTime + 1.1);
      } else if (['Soft Chime', 'Gentle Wake'].includes(soundName)) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.25);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (['Success Tone', 'Sunrise Alarm'].includes(soundName)) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24);
        gainNode.gain.setValueAtTime(volume * 1.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      } else {
        // Notification Ping or Fallback
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.warn("Audio Context is blocked in iframe container environment.", e);
    }
  };

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Sync log listener
  useEffect(() => {
    const unsubscribeLogs = subscribeToLogs(setLogs);
    
    if (user) {
      const q = query(
        collection(db, 'users', user.uid, 'timetables'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribeTimetable = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setActivities(snapshot.docs[0].data().activities || []);
        }
      });
      return () => {
        unsubscribeLogs();
        unsubscribeTimetable();
      };
    }
    return unsubscribeLogs;
  }, [user]);

  // Sync settings
  const saveAllSettings = (updated: SettingsData) => {
    localStorage.setItem('timemint_settings_v32', JSON.stringify(updated));
    const bkCompat = {
      activityNotifications: updated.activityNotifications,
      reminderNotifications: updated.reminderNotifications,
      alarmSounds: updated.alarmSounds,
      vibration: updated.vibration,
      persistentAlerts: updated.persistentAlerts,
      selectedAlarmSound: updated.selectedAlarmSound
    };
    saveSettings(bkCompat);
    setSettings(updated);

    if (user) {
      updateDoc(doc(db, 'users', user.uid), {
        settings: bkCompat
      }).catch(e => console.warn("Firebase offline profile storage cached.", e));
    }
  };

  const toggleSetting = (key: keyof SettingsData) => {
    const updated = { ...settings, [key]: !settings[key] as any };
    saveAllSettings(updated);
    addLog(`System setting [${String(key)}] updated successfully.`);
    triggerToast(`Option "${String(key)}" synced inside browser.`);
    playSynthSoundPreview('Notification Ping', 40);
  };

  const setSettingValue = <K extends keyof SettingsData>(key: K, val: SettingsData[K]) => {
    const updated = { ...settings, [key]: val };
    saveAllSettings(updated);
    addLog(`Updated parameter [${String(key)}] set to [${val}].`);
if (typeof val !== 'object') {
      triggerToast(`Saved ${String(key)}: ${val}`);
    } else {
      triggerToast(`Saved configuration for ${String(key)}`);
    }
  };

  const updateSpecificSetting = (updatedFields: Partial<SettingsData>) => {
    const updated = { ...settings, ...updatedFields };
    saveAllSettings(updated);
  };

  // Dynamic Theme injector styles
  useEffect(() => {
    const accent = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.teal;
    let styleEl = document.getElementById('timemint-dynamic-accent');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'timemint-dynamic-accent';
      document.head.appendChild(styleEl);
    }
    
    styleEl.innerHTML = `
      :root {
        --color-primary-300: ${accent.color400};
        --color-primary-400: ${accent.color400};
        --color-primary-500: ${accent.color500};
        --color-primary-600: ${accent.color600};
        --color-primary-glow: ${accent.glow};
      }
      
      .light {
        --color-surface-950: #FAF6F0;
        --color-surface-900: #FAF6F0;
        background-color: #FAF6F0 !important;
        color: #0f172a !important;
      }
      .light body {
        background-color: #FAF6F0 !important;
        color: #1e293b !important;
      }
      .light h1, .light h2, .light h3, .light h4, .light h5, .light h6, .light th {
        color: #0f172a !important;
      }
      .light .glass {
        background-color: #FFFFFF !important;
        border: 1px solid #EAE0D5 !important;
        box-shadow: 0 10px 30px rgba(139, 120, 95, 0.04) !important;
        color: #0f172a !important;
      }
      .light .text-slate-400 {
        color: #5C5248 !important;
      }
      .light .text-slate-500 {
        color: #8C7F72 !important;
      }
      .light .bg-white\\/5 {
        background-color: rgba(139, 120, 95, 0.05) !important;
      }
      .light .border-white\\/5 {
        border-color: rgba(139, 120, 95, 0.08) !important;
      }
      .light .border-white\\/10 {
        border-color: rgba(139, 120, 95, 0.12) !important;
      }
      
      ${settings.fontSize === 'small' ? `
        .settings-content-wrapper { font-size: 0.815rem !important; }
        .settings-input-label { font-size: 0.7rem !important; }
      ` : settings.fontSize === 'large' ? `
        .settings-content-wrapper { font-size: 1.05rem !important; }
        .settings-input-label { font-size: 0.9rem !important; }
      ` : ''}
    `;

    if (settings.theme === 'light') {
      document.documentElement.classList.add('light');
    } else if (settings.theme === 'dark') {
      document.documentElement.classList.remove('light');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
      }
    }
  }, [settings.accentColor, settings.theme, settings.fontSize]);

  const handleOpenProfileEditor = () => {
    setProfileForm({
      fullName: settings.fullName,
      email: settings.email,
      employeeId: settings.employeeId,
      department: settings.department,
      designation: settings.designation,
      timezone: settings.timezone,
      language: settings.language,
      bio: settings.bio,
      avatarUrl: settings.avatarUrl
    });
    setActiveModal('edit-profile');
  };

  const handleSaveProfile = () => {
    if (!profileForm.fullName.trim()) {
      alert("Name is required.");
      return;
    }
    const updated = {
      ...settings,
      fullName: profileForm.fullName,
      email: profileForm.email,
      employeeId: profileForm.employeeId,
      department: profileForm.department,
      designation: profileForm.designation,
      timezone: profileForm.timezone,
      language: profileForm.language,
      bio: profileForm.bio,
      avatarUrl: profileForm.avatarUrl
    };
    saveAllSettings(updated);
    addLog(`Profile catalog saved for ${profileForm.fullName}.`);
    triggerToast("User credentials updated successfully!");
    setActiveModal(null);
  };

  // Export JSON Configuration Backups
  const handleExportJSON = () => {
    const configBundle = {
      settings,
      exportedAt: new Date().toISOString(),
      activities
    };
    const blob = new Blob([JSON.stringify(configBundle, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'timemint-session-backup.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Backup JSON file download initiated!");
    addLog("System export executed completely.");
  };

  // Import JSON Configuration Backups
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.settings) {
          saveAllSettings({ ...DEFAULT_SETTINGS, ...data.settings });
          triggerToast("Settings profile restored successfully!");
          addLog("Import Sequence Completed.");
        } else {
          alert("Invalid configuration registry file format.");
        }
      } catch (err) {
        alert("The chosen workspace file is corrupted.");
      }
    };
    reader.readAsText(file);
  };

  const handleFullReset = () => {
    localStorage.removeItem('timemint_settings_v32');
    setSettings(DEFAULT_SETTINGS);
    saveAllSettings(DEFAULT_SETTINGS);
    triggerToast("Restored factory defaults instantly!", "info");
    addLog("Master Reset Cleared custom parameters.");
    setActiveModal(null);
  };

  const restoreSingleDefault = (id: string) => {
    const defaultVal = (DEFAULT_SETTINGS as any)[id];
    setSettingValue(id as any, defaultVal);
    triggerToast(`Restored "${id}" to production default!`);
  };

  // Search filter matching
  const matchingRegistryItems = searchQuery.trim()
    ? SETTINGS_REGISTRY.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tab.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectSearchMatch = (tab: any) => {
    setActiveTab(tab);
    setSearchQuery('');
    triggerToast(`Jumped to ${tab.toUpperCase()} workspace.`, "info");
  };

  // Rendering individual setting cards
  const renderSettingRow = (item: SettingRegistryItem) => {
    const val = (settings as any)[item.id];
    const IconComponent = iconMap[item.iconName] || SettingsIcon;
    
    let badgeText = "Active";
    let badgeColor = "bg-primary-500/10 text-primary-400 border-primary-500/20";
    
    if (typeof val === 'boolean') {
      badgeText = val ? "Enabled" : "Disabled";
      badgeColor = val 
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
        : "bg-slate-500/10 text-slate-400 border-slate-500/20";
    } else if (item.id === 'theme') {
      badgeText = val === 'dark' ? "Cosmic Dark" : val === 'light' ? "Clean Light" : "OS Sync";
      badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
    } else if (item.id === 'accentColor') {
      badgeText = ACCENT_COLORS[val as keyof typeof ACCENT_COLORS]?.name || "Cosmic Teal";
      badgeColor = "bg-primary-500/10 text-primary-400 border-primary-500/20";
    } else if (item.id === 'layoutDensity') {
      badgeText = val === 'compact' ? "Compact Density" : "Comfortable";
      badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    } else if (item.id === 'fontSize') {
      badgeText = String(val).toUpperCase();
      badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/10";
    } else if (typeof val === 'number') {
      if (item.id.toString().includes('Volume')) {
        badgeText = `Volume output: ${val}%`;
      } else if (item.id.toString().includes('Duration')) {
        badgeText = `${val} mins`;
      } else {
        badgeText = `${val} units`;
      }
      badgeColor = "bg-teal-500/5 text-teal-400 border-teal-500/10";
    } else if (typeof val === 'string') {
      badgeText = val.charAt(0).toUpperCase() + val.slice(1);
      badgeColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }

    const isExpanded = activeConfigureSetting?.id === item.id;
    return (
      <div 
        key={item.id}
        className={cn(
          "p-4 border rounded-2xl transition-all select-none group flex flex-col gap-4",
          isExpanded 
            ? "bg-white/[0.03] border-primary-500/20 shadow-lg shadow-primary-500/[0.02]" 
            : "bg-white/[0.01] hover:bg-white/[0.03] border-white/5 hover:border-white/10"
        )}
      >
        <div 
          onClick={() => setActiveConfigureSetting(isExpanded ? null : item)}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl group-hover:scale-110 transition-all shrink-0">
              <IconComponent size={15} />
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-white font-bold text-xs tracking-tight group-hover:text-primary-300 transition-colors">{item.name}</h4>
                <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border leading-none shrink-0", badgeColor)}>
                  {badgeText}
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-normal max-w-md">{item.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto" onClick={e => e.stopPropagation()}>
            {typeof val === 'boolean' && (
              <button 
                onClick={() => toggleSetting(item.id as any)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer mr-1.5",
                  val ? "bg-primary-500" : "bg-slate-800"
                )}
              >
                <span className={cn(
                  "inline-block h-3 w-3 transform rounded-full bg-white transition-all",
                  val ? "translate-x-5" : "translate-x-1"
                )} />
              </button>
            )}

            <button
              onClick={() => setActiveConfigureSetting(isExpanded ? null : item)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black transition-colors border border-white/5 cursor-pointer",
                isExpanded 
                  ? "bg-primary-500 hover:bg-primary-400 text-black border-transparent" 
                  : "bg-slate-800 hover:bg-slate-755 text-slate-300 hover:text-white"
              )}
            >
              {isExpanded ? "Collapse" : "Configure"}
            </button>
            
            <button
              onClick={() => setActiveDetailsSetting(item)}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-300 rounded-lg text-[9px] font-bold border border-white/5 transition-colors cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>

        {/* Inline Drawer Configuration */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full border-t border-white/5 pt-1 overflow-hidden"
            >
              <SettingsDrawer
                item={item}
                settings={settings}
                setSettingValue={setSettingValue}
                toggleSetting={toggleSetting}
                triggerToast={triggerToast}
                onClose={() => setActiveConfigureSetting(null)}
                playSynthSoundPreview={playSynthSoundPreview}
                isInline={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4 settings-content-wrapper transition-all">
      
      {/* Toast Render Node dynamically positioned based on selected toast style */}
      <div className={cn(
        "fixed z-55 flex flex-col gap-2 p-4 font-bold text-xs max-w-sm pointer-events-none",
        (localStorage.getItem('timemint_toast_position') as any) === 'top-left' ? "top-6 left-6" :
        (localStorage.getItem('timemint_toast_position') as any) === 'top-right' ? "top-6 right-6" :
        (localStorage.getItem('timemint_toast_position') as any) === 'bottom-left' ? "bottom-6 left-6" : "bottom-6 right-6"
      )}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={cn(
                "p-3 rounded-2xl shadow-2xl backdrop-blur-md border pointer-events-auto flex items-center gap-2 max-w-xs",
                t.type === 'error' ? "bg-red-950/90 border-red-500/20 text-red-300" :
                t.type === 'info' ? "bg-blue-950/95 border-blue-500/10 text-blue-300" : "bg-slate-900 border-primary-500/20 text-emerald-400"
              )}
            >
              <Sparkles size={13} className="shrink-0 animate-pulse text-primary-400" />
              <p className="font-semibold text-[11px] leading-snug">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header Panel */}
      <GlassCard className="p-6 border-white/5 bg-slate-900/40 relative z-30" hover={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-display font-extrabold text-white tracking-tight flex items-center gap-2">
              ⚙️ Settings & Preferences
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xl font-semibold">
              Customize your TimeMint experience, productivity workflow, notifications, appearance, and account preferences.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950/60 text-white rounded-xl py-2 px-3.5 pl-9 text-xs border border-white/10 focus:outline-none focus:border-primary-400 w-44 md:w-56"
              />
              <Search size={12} className="text-slate-500 absolute left-3 top-2.5" />
              
              {searchQuery && (
                <div className="absolute top-11 left-0 right-0 max-h-48 bg-slate-950 border border-white/10 rounded-xl overflow-y-auto shadow-2xl z-50 p-1 divide-y divide-white/5">
                  {matchingRegistryItems.length === 0 ? (
                    <div className="p-3 text-[11px] text-slate-500 italic font-semibold">No settings match catalog parameters</div>
                  ) : (
                    matchingRegistryItems.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setActiveConfigureSetting(r);
                          setSearchQuery('');
                        }}
                        className="w-full text-left font-black uppercase text-[9px] text-slate-300 hover:text-white p-2.5 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between"
                      >
                        {r.name} in "{r.tab.toUpperCase()}"
                        <ChevronRight size={10} className="text-primary-400" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-slate-300 border border-white/5 transition-all cursor-pointer"
            >
              <Download size={11} className="text-primary-400" />
              Export Config
            </button>
            
            <label className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-slate-300 border border-white/5 transition-all cursor-pointer">
              <Upload size={11} className="text-primary-400" />
              Import Config
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              onClick={() => setActiveModal('reset-all')}
              className="px-3 py-2 bg-red-950/20 text-red-400 border border-red-900/10 rounded-xl text-[10px] font-bold hover:bg-red-950/40 transition-all cursor-pointer"
            >
              Reset All
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Main Grid Category Routing Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Sidebar Tabs */}
        <div className={cn(
          "space-y-4 lg:sticky lg:top-6",
          mobileActiveView === "content" ? "hidden lg:block" : "block"
        )}>
          <GlassCard className="p-4 border-white/5 bg-slate-900/20" hover={false}>
            <div className="space-y-3.5">
              
              <div>
                <span className="text-[9px] font-black tracking-wider text-slate-500 uppercase px-2 font-mono">My Account profile</span>
                <div className="space-y-1 mt-1.5">
                  {[
                    { id: 'profile', label: 'User Profile', icon: User },
                    { id: 'security', label: 'Security Lock', icon: ShieldCheck },
                    { id: 'privacy', label: 'Privacy Control', icon: Eye }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleSelectTab(tab.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer group",
                        activeTab === tab.id 
                          ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" 
                          : "bg-transparent text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <tab.icon size={13} className={cn(activeTab === tab.id ? "text-primary-400" : "text-slate-400")} />
                        <span>{tab.label}</span>
                      </div>
                      <ChevronRight size={10} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", activeTab === tab.id && "opacity-100 text-primary-400")} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black tracking-wider text-slate-500 uppercase px-2 font-mono">Visual workspace</span>
                <div className="space-y-1 mt-1.5">
                  {[
                    { id: 'appearance', label: 'Appearance Theme', icon: Palette },
                    { id: 'accessibility', label: 'Accessibility Settings', icon: Activity },
                    { id: 'calendar', label: 'Calendar Planner', icon: Calendar }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleSelectTab(tab.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer group",
                        activeTab === tab.id 
                          ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" 
                          : "bg-transparent text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <tab.icon size={13} className={cn(activeTab === tab.id ? "text-primary-400" : "text-slate-400")} />
                        <span>{tab.label}</span>
                      </div>
                      <ChevronRight size={10} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", activeTab === tab.id && "opacity-100 text-primary-400")} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black tracking-wider text-slate-500 uppercase px-2 font-mono">Alert System engine</span>
                <div className="space-y-1 mt-1.5">
                  {[
                    { id: 'productivity', label: 'Productivity Goals', icon: Flame },
                    { id: 'tasks', label: 'Task List Settings', icon: CheckSquare },
                    { id: 'reminders', label: 'Reminders & Alerts', icon: Bell },
                    { id: 'focus', label: 'Focus Ambient Mode', icon: EyeOff },
                    { id: 'ai', label: 'AI Assistant', icon: Brain }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleSelectTab(tab.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer group",
                        activeTab === tab.id 
                          ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" 
                          : "bg-transparent text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <tab.icon size={13} className={cn(activeTab === tab.id ? "text-primary-400" : "text-slate-400")} />
                        <span>{tab.label}</span>
                      </div>
                      <ChevronRight size={10} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", activeTab === tab.id && "opacity-100 text-primary-400")} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black tracking-wider text-slate-500 uppercase px-2 font-mono">Diagnostics help</span>
                <div className="space-y-1 mt-1.5">
                  {[
                    { id: 'data', label: 'Data Diagnostics', icon: Database },
                    { id: 'reports', label: 'Reports Analytics', icon: BarChart3 },
                    { id: 'support', label: 'Support FAQ Desk', icon: HelpCircle },
                    { id: 'about', label: 'About TimeMint', icon: Info }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleSelectTab(tab.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer group",
                        activeTab === tab.id 
                          ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" 
                          : "bg-transparent text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <tab.icon size={13} className={cn(activeTab === tab.id ? "text-primary-400" : "text-slate-400")} />
                        <span>{tab.label}</span>
                      </div>
                      <ChevronRight size={10} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", activeTab === tab.id && "opacity-100 text-primary-400")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* LOGGED IN AS profile block */}
              <div className="pt-2 px-1 border-t border-white/5 mt-4">
                <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block font-mono">Logged in as</span>
                <div className="flex items-center gap-3 mt-2 p-2 rounded-xl bg-white/[0.01] border border-white/5">
                  <img
                    src={settings.avatarUrl ? (settings.avatarUrl.startsWith('http') ? settings.avatarUrl : `https://${settings.avatarUrl}`) : `https://api.dicebear.com/7.x/bottts/svg?seed=Avery`}
                    alt="Current profile avatar"
                    className="h-8 w-8 rounded-full border border-primary-500/20 p-0.5 bg-slate-950 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-xs truncate leading-snug">{settings.fullName || 'User Spec'}</p>
                    <p className="text-[9px] text-slate-400 truncate leading-tight font-medium font-sans">{settings.designation || 'Productivity Developer'}</p>
                  </div>
                </div>
              </div>

            </div>
          </GlassCard>
        </div>

        {/* Dynamic Display Pane */}
        <div className={cn(
          "lg:col-span-3 space-y-6",
          mobileActiveView === "list" ? "hidden lg:block" : "block"
        )}>
          {/* Back button on mobile */}
          {mobileActiveView === "content" && (
            <button
              onClick={() => setMobileActiveView('list')}
              className="lg:hidden w-full flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/5 hover:bg-white/10 text-primary-400 font-extrabold rounded-2xl mb-4 transition-all cursor-pointer text-xs"
            >
              <ChevronLeft size={14} className="text-primary-400" />
              Return to Preference Categories
            </button>
          )}

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && !searchQuery && (
            <GlassCard className="p-6 border-white/5 space-y-6" hover={false}>
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl">
                    <User size={16} />
                  </div>
                  <div>
                    <h2 className="text-white font-extrabold text-sm tracking-tight">User Profile Details</h2>
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider font-mono">Workspace Identity Specifications</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenProfileEditor}
                  className="px-3 py-1.5 bg-primary-500 hover:bg-primary-400 text-black rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1"
                >
                  <Edit2 size={11} />
                  Edit Credentials
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                <img
                  src={`https://${settings.avatarUrl}`}
                  referrerPolicy="no-referrer"
                  alt="Avery Profile Avatar"
                  className="h-16 w-16 rounded-full border border-primary-500/30 p-1 bg-slate-950 object-cover shrink-0"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-xs">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 block uppercase">Full Name</span>
                    <p className="text-white font-extrabold truncate">{settings.fullName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 block uppercase">Professional Designation</span>
                    <p className="text-white font-extrabold truncate">{settings.designation}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 block uppercase">Assigned Department</span>
                    <p className="text-white font-extrabold truncate">{settings.department}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 block uppercase">Zone & Country</span>
                    <p className="text-white font-extrabold truncate">{settings.timezone} ({settings.language})</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-xs">
                <span className="text-[10px] font-black text-slate-500 uppercase block">Short Bio Profile Summary</span>
                <p className="text-slate-300 font-semibold leading-relaxed italic">
                  "{settings.bio || 'Productivity lead utilizing TimeMint to schedule development sprints.'}"
                </p>
              </div>
            </GlassCard>
          )}

          {/* TAB: SUPPORT FAQs / USER GUIDES */}
          {activeTab === 'support' && !searchQuery && (
            <GlassCard className="p-6 border-white/5 space-y-6" hover={false}>
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl">
                  <HelpCircle size={15} />
                </div>
                <div>
                  <h2 className="text-white font-extrabold text-sm tracking-tight">TimeMint FAQ & Help Desk</h2>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider font-mono">Resource hubs & diagnostics</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveModal('user-guide')}
                  className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl flex flex-col items-start gap-2 text-left transition-all cursor-pointer group"
                >
                  <FileText className="text-primary-400 group-hover:scale-110 transition-transform" size={16} />
                  <div>
                    <h4 className="text-white font-bold text-xs">Interactive User Guide</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Comprehensive handbook details</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveModal('faq')}
                  className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl flex flex-col items-start gap-2 text-left transition-all cursor-pointer group"
                >
                  <HelpCircle className="text-primary-400 group-hover:scale-110 transition-transform" size={16} />
                  <div>
                    <h4 className="text-white font-bold text-xs">Frequently Asked Questions</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Solve setup errors immediately</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveModal('support')}
                  className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl flex flex-col items-start gap-2 text-left transition-all cursor-pointer group"
                >
                  <Terminal className="text-primary-400 group-hover:scale-110 transition-transform" size={16} />
                  <div>
                    <h4 className="text-white font-bold text-xs">Submit Support Ticket</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Route query to engineering desks</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveModal('feedback')}
                  className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl flex flex-col items-start gap-2 text-left transition-all cursor-pointer group"
                >
                  <MessageSquare className="text-primary-400 group-hover:scale-110 transition-transform" size={16} />
                  <div>
                    <h4 className="text-white font-bold text-xs">Transmit Workspace Feedback</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Recommend smart integrations</p>
                  </div>
                </button>
              </div>
            </GlassCard>
          )}

          {/* TAB ABOUT: version specs */}
          {activeTab === 'about' && !searchQuery && (
            <GlassCard className="p-6 border-white/5 text-xs text-slate-300 space-y-4" hover={false}>
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl animate-pulse">
                  <Info size={15} />
                </div>
                <div>
                  <h2 className="text-white font-extrabold text-sm tracking-tight">About TimeMint Engine</h2>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider font-mono">Metadata build specifications</p>
                </div>
              </div>
              <p className="font-semibold leading-relaxed">
                TimeMint is a high-productivity workspace built to coordinate complex milestones, focus periods, synthesized chimes, and reports archives seamlessly.
              </p>
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl divide-y divide-white/5 text-xs">
                <div className="py-2 flex justify-between font-bold">
                  <span className="text-slate-500">System Build Version</span>
                  <span className="text-white font-mono">v3.2.1 Secure Cluster</span>
                </div>
                <div className="py-2 flex justify-between font-bold">
                  <span className="text-slate-500">Lead Product Developer</span>
                  <span className="text-white font-sans">Google AI Studio</span>
                </div>
                <div className="py-2 flex justify-between font-bold">
                  <span className="text-slate-500">Framework Dependencies</span>
                  <span className="text-white font-mono">React 18 + Vite + esbuild + Tailwind</span>
                </div>
                <div className="py-2 flex justify-between font-bold">
                  <span className="text-slate-500">Encryption Layer</span>
                  <span className="text-white font-mono">AES-256 LocalStorage Cache Keyed</span>
                </div>
              </div>
            </GlassCard>
          )}

          {/* TAB LOGS DIAGNOSTICS: rendered automatically under 'data' tab */}
          {activeTab === 'data' && !searchQuery && (
            <GlassCard className="p-6 border-white/5 space-y-4" hover={false}>
              <h3 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
                <Terminal size={14} className="text-primary-400" />
                Live Logging Stack Registers (Offline Storage Diagnostic)
              </h3>
              <div className="bg-black/30 border border-white/5 p-4 rounded-2xl max-h-48 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1 shadow-inner h-32">
                {logs.length === 0 ? (
                  <p className="italic text-slate-600">No telemetry log entries found in this local workstation cycle.</p>
                ) : (
                  [...logs].reverse().map((log, idx) => (
                    <p key={idx} className="leading-relaxed hover:text-white transition-colors">
                      <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> {log}
                    </p>
                  ))
                )}
              </div>
            </GlassCard>
          )}

          {/* TAB REMINDERS CONFIGURATION BLOCK */}
          {activeTab === 'reminders' && !searchQuery && (
            <div className="space-y-6">
              {/* Voice Reminder Panel */}
              <GlassCard className="p-6 border-white/5 space-y-6" hover={false}>
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl">
                    <Volume2 size={16} />
                  </div>
                  <div>
                    <h2 className="text-white text-sm font-extrabold tracking-tight">Smart Voice Announcement Suite</h2>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">Synthesizes schedule alerts in real-time</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Switch */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-205 font-semibold text-slate-250">Speech Reminders Engine</div>
                      <div className="text-[10px] text-slate-500">Enable synthesized verbal readings 5 minutes before tasks.</div>
                    </div>
                    <button
                      onClick={() => updateSpecificSetting({ enableVoiceReminders: !settings.enableVoiceReminders })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.enableVoiceReminders ? 'bg-primary-500' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.enableVoiceReminders ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.enableVoiceReminders && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5 pt-3 border-t border-white/5"
                    >
                      {/* Voice Type Selector */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 flex flex-col">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Acoustic Voice Accent</label>
                          <select
                            value={settings.voiceSelection}
                            onChange={(e) => updateSpecificSetting({ voiceSelection: e.target.value as any })}
                            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                          >
                            <option value="system">Default System Voice</option>
                            <option value="male">Synthesizer Male Accent</option>
                            <option value="female">Synthesizer Female Accent</option>
                          </select>
                        </div>

                        {/* Repeat Voice */}
                        <div className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                          <div>
                            <div className="text-[11px] text-slate-300 font-bold">Double Verbal Cycle</div>
                            <div className="text-[9px] text-slate-500">Repeat speech notification once on trigger.</div>
                          </div>
                          <button
                            onClick={() => updateSpecificSetting({ repeatVoiceReminder: !settings.repeatVoiceReminder })}
                            className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              settings.repeatVoiceReminder ? 'bg-primary-500' : 'bg-slate-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                                settings.repeatVoiceReminder ? 'translate-x-3' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Sliders */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Voice Volume */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                            <span className="text-slate-400 font-extrabold">Speech Volume</span>
                            <span className="text-primary-400 font-black">{settings.voiceVolume}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={settings.voiceVolume}
                            onChange={(e) => updateSpecificSetting({ voiceVolume: Number(e.target.value) })}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                        </div>

                        {/* Speed / Pitch Rate */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                            <span className="text-slate-400 font-extrabold">Speech Rate Speed</span>
                            <span className="text-primary-400 font-black">{settings.voiceSpeed}x multiplier</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={settings.voiceSpeed}
                            onChange={(e) => updateSpecificSetting({ voiceSpeed: Number(e.target.value) })}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                        </div>
                      </div>

                      {/* Announcement Elements Checkboxes */}
                      <div className="space-y-2.5 pt-2">
                        <div className="text-[10px] text-slate-400 uppercase font-black font-mono tracking-wider border-b border-white/5 pb-1.5">Verbal Reading Elements</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Name Checkbox */}
                          <label className="flex items-center gap-2.5 p-2 bg-white/[0.01] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.02] transition-colors">
                            <input
                              type="checkbox"
                              checked={settings.enableTaskNameAnnouncement}
                              onChange={(e) => updateSpecificSetting({ enableTaskNameAnnouncement: e.target.checked })}
                              className="rounded border-white/10 text-primary-500 focus:ring-primary-500 cursor-pointer bg-slate-900"
                            />
                            <span className="text-[10px] text-slate-300 font-bold">Include Task Name</span>
                          </label>

                          {/* Start Time Checkbox */}
                          <label className="flex items-center gap-2.5 p-2 bg-white/[0.01] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.02] transition-colors">
                            <input
                              type="checkbox"
                              checked={settings.enableStartTimeAnnouncement}
                              onChange={(e) => updateSpecificSetting({ enableStartTimeAnnouncement: e.target.checked })}
                              className="rounded border-white/10 text-primary-500 focus:ring-primary-500 cursor-pointer bg-slate-900"
                            />
                            <span className="text-[10px] text-slate-300 font-bold">Include Start Time</span>
                          </label>

                          {/* Duration Checkbox */}
                          <label className="flex items-center gap-2.5 p-2 bg-white/[0.01] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.02] transition-colors">
                            <input
                              type="checkbox"
                              checked={settings.enableDurationAnnouncement}
                              onChange={(e) => updateSpecificSetting({ enableDurationAnnouncement: e.target.checked })}
                              className="rounded border-white/10 text-primary-500 focus:ring-primary-500 cursor-pointer bg-slate-900"
                            />
                            <span className="text-[10px] text-slate-300 font-bold">Include Duration</span>
                          </label>
                        </div>
                      </div>

                      {/* Interactive Test Speech Button */}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            let sentence = `Attention. Your next task is Mathematics Lecture.`;
                            if (!settings.enableTaskNameAnnouncement) sentence = "Attention. Your next task is approaching.";
                            let timeText = `It will begin in 5 minutes at 14:15`;
                            if (!settings.enableStartTimeAnnouncement) timeText = "It will begin in 5 minutes";
                            let durationText = `and will continue for 45 minutes.`;
                            if (!settings.enableDurationAnnouncement) durationText = "";
                            const speech = `${sentence} ${timeText} ${durationText} Please prepare to start your task.`.replace(/\s+/g, ' ').trim();
                            
                            speakAnnouncement(speech, {
                              voiceSelection: settings.voiceSelection,
                              voiceSpeed: settings.voiceSpeed,
                              voiceVolume: settings.voiceVolume
                            });
                            triggerToast("Auditory preview sent to synthesis browser API", "success");
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-500 text-slate-950 text-[10px] font-extrabold rounded-xl hover:bg-primary-400 cursor-pointer shadow-md transition-all uppercase"
                        >
                          <Play size={11} fill="currentColor" />
                          Audit Speech Accent
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </GlassCard>

              {/* Alarm Configuration Settings Panel */}
              <GlassCard className="p-6 border-white/5 space-y-6" hover={false}>
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl">
                    <Bell size={16} />
                  </div>
                  <div>
                    <h2 className="text-white text-sm font-extrabold tracking-tight">Heavy Audio Alarm Engine</h2>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">Bypasses mute switches on primary alarm states</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-200 font-semibold">Audible Alarm Output</div>
                      <div className="text-[10px] text-slate-500">Play continuous sirens and haptic waves during routine switches.</div>
                    </div>
                    <button
                      onClick={() => updateSpecificSetting({ enableAlarm: !settings.enableAlarm })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.enableAlarm ? 'bg-primary-500' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.enableAlarm ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.enableAlarm && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5 pt-3 border-t border-white/5"
                    >
                      {/* Tune select + Repeat switch */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 flex flex-col">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Selected Alarm Tune</label>
                          <select
                            value={settings.selectedAlarmSound}
                            onChange={(e) => updateSpecificSetting({ selectedAlarmSound: e.target.value as any })}
                            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500 cursor-pointer select-none"
                          >
                            <option value="Classic Alarm">☎️ Classic Alarm Tone</option>
                            <option value="Digital Alarm">📟 Digital Buzz Chime</option>
                            <option value="Soft Bell">🔔 Clear Soft Bell Chord</option>
                            <option value="Morning Chime">🍃 Soft Golden Sunrise Chime</option>
                            <option value="Focus Tone">🧘 Calm Productivity Tone</option>
                          </select>
                        </div>

                        {/* Continuous Loop Switch */}
                        <div className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                          <div>
                            <div className="text-[11px] text-slate-300 font-bold">Infinite Tune Loop</div>
                            <div className="text-[9px] text-slate-500">Repeat tune recursively until cleared manually.</div>
                          </div>
                          <button
                            onClick={() => updateSpecificSetting({ repeatAlarm: !settings.repeatAlarm })}
                            className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              settings.repeatAlarm ? 'bg-primary-500' : 'bg-slate-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                                settings.repeatAlarm ? 'translate-x-3' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Louder volume and automatic stop duration */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                            <span className="text-slate-400 font-extrabold">Alarm Vol Ratio</span>
                            <span className="text-primary-400 font-black">{settings.alarmVolume}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={settings.alarmVolume}
                            onChange={(e) => updateSpecificSetting({ alarmVolume: Number(e.target.value) })}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                            <span className="text-slate-400 font-extrabold">Auto-Silence Timeout</span>
                            <span className="text-primary-400 font-black">{settings.alarmDuration} seconds</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="120"
                            value={settings.alarmDuration}
                            onChange={(e) => updateSpecificSetting({ alarmDuration: Number(e.target.value) })}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                        </div>
                      </div>

                      {/* Interactive sound checking buttons */}
                      <div className="pt-2 flex justify-end gap-3 font-mono font-bold text-xs">
                        <button
                          onClick={stopAlarm}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 cursor-pointer shadow-md transition-all uppercase text-[10px]"
                        >
                          <Square size={11} fill="currentColor" />
                          Silence Alarm
                        </button>
                        <button
                          onClick={() => {
                            triggerAlarm(`Audible alarm preview test run`);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-500 text-slate-950 rounded-xl hover:bg-primary-400 cursor-pointer shadow-md transition-all uppercase text-[10px]"
                        >
                          <Play size={11} fill="currentColor" />
                          Play Active Alarm
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </GlassCard>

              {/* Diagnostic Test Matrix Workbench Panel */}
              <GlassCard className="p-6 border-white/5 space-y-6" hover={false}>
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl animate-pulse">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h2 className="text-white text-sm font-extrabold tracking-tight">Diagnostics Testing Matrix</h2>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">Bypasses scheduled timings for instant manual assessment</p>
                  </div>
                </div>

                {/* User Explicit Testing Suite */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950/35 rounded-2xl border border-white/5">
                  <button
                    onClick={() => {
                      sendNotification("Upcoming Task Reminder", {
                        body: "Task:\nMathematics Revision\n\nStarts:\n4:00 PM\n\nDuration:\n60 Minutes\n\nStarts in:\n5 Minutes",
                        tag: "test"
                      });
                      triggerToast("Sent Test Notification Alert", "success");
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-white/[0.01] hover:bg-white/5 border border-white/5 hover:border-primary-500/30 text-white rounded-xl transition-all cursor-pointer font-bold text-center gap-2"
                  >
                    <Bell size={18} className="text-primary-400" />
                    <span className="text-[11px]">Test Notification</span>
                  </button>

                  <button
                    onClick={() => {
                      speakAnnouncement(
                        "Attention. Your next task is Mathematics Revision. It will begin in 5 minutes at 4:30 PM and will continue for 60 minutes. Please prepare to start your task.",
                        {
                          voiceSelection: settings.voiceSelection,
                          voiceSpeed: settings.voiceSpeed,
                          voiceVolume: settings.voiceVolume
                        }
                      );
                      triggerToast("Synthesized Test Voice Announcement", "success");
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-white/[0.01] hover:bg-white/5 border border-white/5 hover:border-primary-500/30 text-white rounded-xl transition-all cursor-pointer font-bold text-center gap-2"
                  >
                    <Volume2 size={18} className="text-primary-400" />
                    <span className="text-[11px]">Test Voice Reminder</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerAlarm("Test Alarm sequence is fully operational");
                      triggerToast("Audible alarm triggered successfully", "success");
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-white/[0.01] hover:bg-white/5 border border-white/5 hover:border-primary-500/30 text-white rounded-xl transition-all cursor-pointer font-bold text-center gap-2"
                  >
                    <AlertTriangle size={18} className="text-primary-400" />
                    <span className="text-[11px]">Test Alarm</span>
                  </button>

                  <button
                    onClick={() => {
                      simulateTaskReminder('reminder_5', "Mathematics Revision", "16:00", 60);
                      triggerToast("Simulated 5m early warning trigger immediately.", "success");
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-white/[0.01] hover:bg-white/5 border border-white/5 hover:border-primary-500/30 text-white rounded-xl transition-all cursor-pointer font-bold text-center gap-2"
                  >
                    <Sparkles size={18} className="text-primary-400 animate-pulse" />
                    <span className="text-[11px] flex flex-col items-center">
                      <span>Test Upcoming</span>
                      <span className="text-[9px] text-slate-400 lowercase font-medium">Task Reminder</span>
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  {/* Test 5m early warning */}
                  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-white/10 transition-colors">
                    <div>
                      <div className="text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-wider">Test Case A</div>
                      <div className="text-white text-xs font-black mt-0.5">5m Approaching stage</div>
                      <div className="text-[9px] text-slate-500 mt-1">Triggers approaching banner, synthesizes verbal announcement block and plays alarm.</div>
                    </div>
                    <button
                      onClick={() => {
                        simulateTaskReminder('reminder_5', "Mathematics Lecture", "14:15", 45);
                        triggerToast("Executed 5-minute pre-warn scenario.", "success");
                      }}
                      className="w-full text-center py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 hover:text-primary-300 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer font-mono"
                    >
                      Trigger Simulate
                    </button>
                  </div>

                  {/* Test 2m preparation warning */}
                  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-white/10 transition-colors">
                    <div>
                      <div className="text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-wider">Test Case B</div>
                      <div className="text-white text-xs font-black mt-0.5">2m Standby stage</div>
                      <div className="text-[9px] text-slate-500 mt-1">Pop smaller checklist notice and whispers countdown reminder message.</div>
                    </div>
                    <button
                      onClick={() => {
                        simulateTaskReminder('alarm_2', "Mathematics Lecture", "14:15", 45);
                        triggerToast("Executed 2-minute checklist notice.", "success");
                      }}
                      className="w-full text-center py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 hover:text-primary-300 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer font-mono"
                    >
                      Trigger Simulate
                    </button>
                  </div>

                  {/* Test starting warning */}
                  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-white/10 transition-colors">
                    <div>
                      <div className="text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-wider">Test Case C</div>
                      <div className="text-white text-xs font-black mt-0.5">0m Startup active</div>
                      <div className="text-[9px] text-slate-500 mt-1">Fires fullscreen alert, lock, sounds alarms continuously and verbalizes startup rules.</div>
                    </div>
                    <button
                      onClick={() => {
                        simulateTaskReminder('start_0', "Mathematics Lecture", "14:15", 45);
                        triggerToast("Executed startup active scenario.", "success");
                      }}
                      className="w-full text-center py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 hover:text-primary-300 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer font-mono"
                    >
                      Trigger Simulate
                    </button>
                  </div>

                  {/* Kill ongoing alarms */}
                  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-white/10 transition-colors">
                    <div>
                      <div className="text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-wider">Control Panel</div>
                      <div className="text-red-400 text-xs font-black mt-0.5">Clear Active sound</div>
                      <div className="text-[9px] text-slate-500 mt-1">Immediately silence browser speech synthesizers and clear audio loop oscillators.</div>
                    </div>
                    <button
                      onClick={() => {
                        stopAlarm();
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        triggerToast("Stopped all sound channels.", "error");
                      }}
                      className="w-full text-center py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer font-mono"
                    >
                      Emergency Kill
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* STANDARD REGISTRY ROWS - dynamically maps settings items matching chosen active target tab tab */}
          {!['support', 'about', 'reminders'].includes(activeTab) && !searchQuery && (
            <GlassCard className="p-6 border-white/5 space-y-4" hover={false}>
              <h3 className="text-white font-black uppercase text-xs tracking-wider border-b border-white/5 pb-3 block">
                {activeTab.toUpperCase()} Option Parameters
              </h3>
              <div className="space-y-3">
                {SETTINGS_REGISTRY.filter(item => item.tab === activeTab).map(renderSettingRow)}
              </div>
            </GlassCard>
          )}

          {/* SEARCH RESULTS MATCHING PANEL VIEW */}
          {searchQuery && (
            <GlassCard className="p-6 border-white/5 space-y-4" hover={false}>
              <h3 className="text-white font-black uppercase text-xs tracking-wider border-b border-white/5 pb-3 flex items-center gap-2">
                <Search size={14} className="text-primary-400" />
                Filtered Settings Matches ({matchingRegistryItems.length})
              </h3>
              <div className="space-y-3">
                {matchingRegistryItems.length === 0 ? (
                  <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl text-center text-slate-500 italic font-semibold">
                    No active parameters match your search. Make sure spellings correspond to Account, Theme, Volume, or Sound types.
                  </div>
                ) : (
                  matchingRegistryItems.map(renderSettingRow)
                )}
              </div>
            </GlassCard>
          )}

        </div>
      </div>

      {/* RENDER MODAL: EDIT USER PROFILE */}
      <AnimatePresence>
        {activeModal === 'edit-profile' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-905 border border-white/10 rounded-3xl overflow-hidden shadow-2xl bg-slate-900"
            >
              <div className="p-6 border-b border-white/5 bg-slate-900/60 flex justify-between items-center">
                <h3 className="text-white text-base font-extrabold flex items-center gap-1.5">
                  <User size={15} className="text-primary-400" />
                  Edit Profile Credentials
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Full Surname</label>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="w-full bg-slate-950 rounded-xl py-2 px-3 border border-white/5 focus:border-primary-400 text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Employee ID</label>
                    <input
                      type="text"
                      value={profileForm.employeeId}
                      onChange={(e) => setProfileForm({ ...profileForm, employeeId: e.target.value })}
                      className="w-full bg-slate-950 rounded-xl py-2 px-3 border border-white/5 focus:border-primary-400 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Profile Email Coordinates</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full bg-slate-950 rounded-xl py-2 px-3 border border-white/5 focus:border-primary-400 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono font-black">Role / Designation Title</label>
                    <input
                      type="text"
                      value={profileForm.designation}
                      onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                      className="w-full bg-slate-950 rounded-xl py-2 px-3 border border-white/5 focus:border-primary-400 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Primary Division / Dept</label>
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                      className="w-full bg-slate-950 rounded-xl py-2 px-3 border border-white/5 focus:border-primary-400 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Region Timezone</label>
                    <input
                      type="text"
                      value={profileForm.timezone}
                      onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      className="w-full bg-slate-950 rounded-xl py-2 px-3 border border-white/5 focus:border-primary-400 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Workspace Avatar Seed</label>
                  <select
                    value={profileForm.avatarUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                    className="w-full bg-slate-950 rounded-xl py-2 px-3 border border-white/5 text-white"
                  >
                    {AVATAR_SEEDS.map(seed => (
                      <option key={seed} value={`api.dicebear.com/7.x/bottts/svg?seed=${seed}`}>
                        {seed} layout profile avatar
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Profile Biography Summary</label>
                  <textarea
                    rows={2.5}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full bg-slate-950 rounded-xl p-3 border border-white/5 focus:border-primary-400 text-white leading-relaxed font-semibold italic"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-slate-900/60 flex justify-between items-center">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold transition-all border border-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 bg-primary-500 hover:bg-primary-400 text-black font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-primary-500/15"
                >
                  Synchronize Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDER MODAL: CLEAR RESET-ALL CONFIRMATION */}
      <AnimatePresence>
        {activeModal === 'reset-all' && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative text-center p-6 space-y-4"
            >
              <div className="mx-auto bg-red-500/10 text-red-400 p-2.5 rounded-full border border-red-500/20 w-11 h-11 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-black text-sm uppercase tracking-wide">Failsafe Factory Reset</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Are you absolutely certain you want to wipe all local adjustments? Your profile details, countdown chimes volume, and system widgets parameters will return back to original defaults.
                </p>
              </div>
              <div className="flex gap-2.5 w-full pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 bg-white/5 text-slate-300 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer"
                >
                  Cancel Wiping
                </button>
                <button
                  onClick={handleFullReset}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-red-500/15"
                >
                  Erase Completely
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDER REUSABLE HELP MODALS FROM SIDEBAR TRIGGERS */}
      <AnimatePresence>
        {activeModal === 'user-guide' && <UserGuideModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'faq' && <FAQModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'support' && <SupportContactModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'feedback' && <FeedbackModal type="feedback" onClose={() => setActiveModal(null)} />}
      </AnimatePresence>



      {/* RENDER VIEW DETAILS SPECS DIALOG MODAL */}
      <AnimatePresence>
        {activeDetailsSetting && (
          <SettingsDetailsModal
            item={activeDetailsSetting}
            currentValue={(settings as any)[activeDetailsSetting.id]}
            userFullName={settings.fullName}
            onClose={() => setActiveDetailsSetting(null)}
            onRestoreDefault={restoreSingleDefault}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
