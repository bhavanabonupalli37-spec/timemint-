import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { GlassCard } from '../../components/ui/GlassCard';
import { 
  Clock, 
  Edit3, 
  Plus, 
  Trash2, 
  ChevronDown, 
  Save, 
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { cn } from '../../lib/utils';
import { TaskModal } from '../../components/ui/TaskModal';
import { 
  addLog,
  sendNotification,
  stopAlarm,
  start10sCountdown
} from '../../lib/notifications';
import { Bell, Play, Zap, Bug, Settings } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  start: string;
  end: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  notificationsEnabled?: boolean;
  reminderOffset?: number;
}

interface Timetable {
  id: string;
  activities: Activity[];
}

export default function TimetableTable() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Activity>>({});
  const [error, setError] = useState<string | null>(null);
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);
  const [conflict, setConflict] = useState<{
    overlappingActivity: Activity;
    editedTask: Activity;
  } | null>(null);

  const [, setTick] = useState(0);

  // Set up auto-updater to recalculate status live every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Intercept physical android back button when overlays are open
  useEffect(() => {
    if (viewingActivity || conflict || editingId) {
      window.history.pushState({ modalOpen: true }, '');
      
      const handlePopState = (e: PopStateEvent) => {
        setViewingActivity(null);
        setConflict(null);
        setEditingId(null);
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [viewingActivity, conflict, editingId]);

  const parseToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const ampmMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  };

  const sortActivities = (list: Activity[]): Activity[] => {
    return [...list].sort((a, b) => parseToMinutes(a.start) - parseToMinutes(b.start));
  };

  const formatTimeTo12h = (time24: string): string => {
    if (!time24) return "";
    const parts = time24.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return time24;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    const hrStr = hours < 10 ? '0' + hours : hours;
    return `${hrStr}:${minStr} ${ampm}`;
  };

  const getGapMinutes = (endStr: string, nextStartStr: string): number => {
    const endM = parseToMinutes(endStr);
    const startM = parseToMinutes(nextStartStr);
    return startM - endM;
  };

  const detectOverlapIssue = (newStart: string, newEnd: string, existingActivities: Activity[], skipId?: string) => {
    const newS = parseToMinutes(newStart);
    const newE = parseToMinutes(newEnd);

    for (const act of existingActivities) {
      if (skipId && act.id === skipId) continue;
      const actS = parseToMinutes(act.start);
      const actE = parseToMinutes(act.end);
      
      if (newS < actE && actS < newE) {
        return { overlappingActivity: act };
      }
    }
    return null;
  };

  const getAutoStatus = (activity: Activity): 'Upcoming' | 'In Progress' | 'Completed' => {
    if (activity.completed) return 'Completed';
    
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    const startMin = parseToMinutes(activity.start);
    const endMin = parseToMinutes(activity.end);
    
    if (currentMin < startMin) return 'Upcoming';
    if (currentMin >= startMin && currentMin <= endMin) return 'In Progress';
    return 'Completed';
  };

  const getStatusStyle = (status: 'Upcoming' | 'In Progress' | 'Completed') => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20';
      case 'In Progress':
        return 'bg-teal-500/20 text-teal-300 ring-teal-500/30 animate-pulse';
      default:
        return 'bg-amber-500/10 text-amber-400 ring-amber-500/20';
    }
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'timetables'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latest = snapshot.docs[0];
        const data = latest.data() as Timetable;
        data.id = latest.id;
        if (data.activities && Array.isArray(data.activities)) {
          data.activities = sortActivities(data.activities);
        } else {
          data.activities = [];
        }
        setTimetable(data);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleReorder = async (newOrder: Activity[]) => {
    if (!timetable || !user) return;
    const sorted = sortActivities(newOrder);
    setTimetable({ ...timetable, activities: sorted });
    try {
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: sorted
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!timetable || !user) return;
    const updated = timetable.activities.filter(a => a.id !== activityId);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: updated
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (activity: Activity) => {
    if (!timetable || !user) return;
    const duplicated: Activity = {
      ...activity,
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
      name: `${activity.name} (Copy)`
    };
    const sorted = sortActivities([...timetable.activities, duplicated]);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: sorted
      });
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (activity: Activity) => {
    setEditingId(activity.id);
    setEditValues(activity);
  };

  const saveEdit = async () => {
    if (!timetable || !user || !editingId) return;
    
    const updated = timetable.activities.map(a => 
      a.id === editingId ? { ...a, ...editValues } as Activity : a
    );
    
    const editedTask = updated.find(a => a.id === editingId);
    if (editedTask) {
      const issue = detectOverlapIssue(editedTask.start, editedTask.end, timetable.activities, editingId);
      if (issue) {
        setConflict({ overlappingActivity: issue.overlappingActivity, editedTask });
        return;
      }
    }

    const sorted = sortActivities(updated);

    try {
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: sorted
      });
      setEditingId(null);
      setError(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplaceConflict = async () => {
    if (!conflict || !timetable || !user) return;
    try {
      const filtered = timetable.activities.filter(a => a.id !== conflict.overlappingActivity.id);
      const updated = filtered.map(a => 
        a.id === editingId ? conflict.editedTask : a
      );
      const sorted = sortActivities(updated);
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: sorted
      });
      setEditingId(null);
      setConflict(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeepBothConflict = async () => {
    if (!conflict || !timetable || !user) return;
    try {
      const updated = timetable.activities.map(a => 
        a.id === editingId ? conflict.editedTask : a
      );
      const sorted = sortActivities(updated);
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: sorted
      });
      setEditingId(null);
      setConflict(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleNotification = async (activityId: string) => {
    if (!timetable || !user) return;
    const updated = timetable.activities.map(a => 
      a.id === activityId ? { ...a, notificationsEnabled: !a.notificationsEnabled } : a
    );
    try {
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: updated
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (activityId: string) => {
    if (!timetable || !user) return;
    const updated = timetable.activities.map(a => 
      a.id === activityId ? { ...a, completed: !a.completed } : a
    );
    try {
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: updated
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-emerald-500/20 text-emerald-400';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Dev Mode Testing Bar */}
      <div className="bg-primary-600/10 border border-primary-500/20 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/20 text-primary-400 rounded-xl">
             <Bug size={18} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary-400">Dev Mode</p>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight">Mission Control Diagnostic Active</p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-50">
          <button 
            type="button"
            onClick={() => {
              addLog("Dev: Test Notify clicked");
              sendNotification("Diagnostic Test", { body: "Browser notification payload delivered successfully." });
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Bell size={12} />
            Test Notify
          </button>
          <button 
            type="button"
            onClick={() => {
              addLog("Dev: Test Alarm clicked");
              sendNotification("ALARM TRIGGERED", { body: "Emergency mission sequence starting...", tag: 'alarm' });
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Zap size={12} />
            Test Alarm
          </button>
          <button 
            type="button"
            onClick={() => {
              start10sCountdown();
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-tighter hover:scale-105 transition-all shadow-lg shadow-primary-600/20 cursor-pointer"
          >
            Launch 10s Trigger
          </button>
        </div>
      </div>

      <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md py-6 flex items-center justify-between border-b border-white/5 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">TimeMint <span className="text-primary-400">Routine</span></h1>
          <p className="text-slate-400 text-sm">Design Your Perfect Day.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Daily Progress</p>
            <p className="text-lg font-bold text-white">
              {timetable ? Math.round((timetable.activities.filter(a => a.completed).length / (timetable.activities.length || 1)) * 100) : 0}%
            </p>
          </div>
          <button 
            type="button"
            onClick={() => navigate('/add-activity')}
            className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-600/20 hover:scale-105 transition-transform cursor-pointer"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>
      


      {error && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm overflow-hidden"
        >
          <AlertCircle size={20} />
          {error}
        </motion.div>
      )}

      <div className="space-y-6">
        <div className="relative pl-6 sm:pl-8 border-l border-white/10 ml-4 space-y-8 py-4">
          <AnimatePresence mode="popLayout">
            {(() => {
              const activitiesList = timetable?.activities || [];
              const renderList: (
                | { type: 'activity'; activity: Activity }
                | { type: 'gap'; id: string; start: string; end: string; duration: number }
              )[] = [];

              for (let i = 0; i < activitiesList.length; i++) {
                const activity = activitiesList[i];
                renderList.push({ type: 'activity', activity });
                if (i < activitiesList.length - 1) {
                  const nextActivity = activitiesList[i + 1];
                  const gapMins = getGapMinutes(activity.end, nextActivity.start);
                  if (gapMins > 0) {
                    renderList.push({
                      type: 'gap',
                      id: `gap-${activity.id}-${nextActivity.id}`,
                      start: activity.end,
                      end: nextActivity.start,
                      duration: gapMins
                    });
                  }
                }
              }

              return renderList.map((item) => {
                if (item.type === 'gap') {
                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative flex items-center group -ml-10 sm:-ml-12 pl-10 sm:pl-12 py-2"
                    >
                      {/* Gap vertical connector */}
                      <div className="absolute left-[3px] top-0 bottom-0 w-px border-l-2 border-dashed border-slate-500/30" />
                      
                      {/* Little gap dot */}
                      <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-800 border border-slate-500/30" />
                      
                      <div className="flex flex-wrap items-center gap-2 pl-4">
                        <Clock size={11} className="text-slate-500 shrink-0" />
                        <span className="text-[11px] font-mono font-black text-slate-500 uppercase tracking-widest">
                          {formatTimeTo12h(item.start)} – {formatTimeTo12h(item.end)}
                        </span>
                        <span className="text-[10px] lowercase font-semibold text-primary-400 bg-primary-950/20 px-2.5 py-0.5 rounded-full ring-1 ring-primary-500/10 font-mono">
                          {item.duration}m transition buffer
                        </span>
                      </div>
                    </motion.div>
                  );
                    }

                    const { activity } = item;
                    const autoStatus = getAutoStatus(activity);
                    const isEditing = editingId === activity.id;
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative group -ml-10 sm:-ml-12 pl-10 sm:pl-12"
                      >
                        {/* Timeline node */}
                        <div className={cn(
                          "absolute left-[-5px] top-6 w-3 h-3 rounded-full border-2 transition-all duration-300 bg-slate-950",
                          activity.completed 
                            ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] bg-emerald-500" 
                            : autoStatus === 'In Progress' 
                            ? "border-teal-400 bg-teal-400 animate-pulse shadow-[0_0_12px_rgba(45,212,191,0.5)]" 
                            : "border-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.2)]"
                        )} />

                        <div className={cn(
                          "p-5 rounded-[24px] border transition-all duration-200 bg-slate-900/40 backdrop-blur-md",
                          isEditing 
                            ? "border-primary-500/40 bg-slate-900/70 shadow-xl" 
                            : activity.completed 
                            ? "border-emerald-500/10 opacity-70 hover:opacity-100 bg-emerald-950/5" 
                            : "border-white/5 hover:border-white/10 hover:bg-slate-900/60"
                        )}>
                          {isEditing ? (
                            /* INLINE EDIT FORM */
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-primary-400 tracking-widest">
                                  Modify Activity Frame
                                </span>
                                <div className="flex gap-1.5 font-sans">
                                  <button 
                                    type="button" 
                                    onClick={saveEdit} 
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Save size={12} /> Save
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => setEditingId(null)} 
                                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <X size={12} /> Cancel
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Activity Name</label>
                                  <input 
                                    type="text"
                                    className="w-full bg-slate-950 border border-white/5 rounded-xl text-sm px-3.5 py-2.5 text-white outline-none focus:border-primary-500 transition-all font-medium mt-1"
                                    value={editValues.name || ''}
                                    onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Start Time</label>
                                    <input 
                                      type="time"
                                      className="w-full bg-slate-950 border border-white/5 rounded-xl text-xs px-3 py-2.5 text-white outline-none focus:border-primary-500 transition-all font-mono mt-1"
                                      value={editValues.start || ''}
                                      onChange={e => setEditValues({ ...editValues, start: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">End Time</label>
                                    <input 
                                      type="time"
                                      className="w-full bg-slate-950 border border-white/5 rounded-xl text-xs px-3 py-2.5 text-white outline-none focus:border-primary-500 transition-all font-mono mt-1"
                                      value={editValues.end || ''}
                                      onChange={e => setEditValues({ ...editValues, end: e.target.value })}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Category</label>
                                    <select 
                                      className="w-full bg-slate-950 border border-white/5 rounded-xl text-xs px-2.5 py-2.5 text-white outline-none focus:border-primary-500 transition-all mt-1 cursor-pointer"
                                      value={editValues.category || 'Work'}
                                      onChange={e => setEditValues({ ...editValues, category: e.target.value })}
                                    >
                                      <option value="Work">Work</option>
                                      <option value="Study">Study</option>
                                      <option value="Health">Health</option>
                                      <option value="Free Time">Free Time</option>
                                      <option value="Chores">Chores</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Priority</label>
                                    <div className="flex gap-1.5 mt-1">
                                      {(['low', 'medium', 'high'] as const).map(p => (
                                        <button 
                                          key={p}
                                          type="button"
                                          onClick={() => setEditValues({ ...editValues, priority: p })}
                                          className={cn(
                                            "flex-1 py-1.5 rounded-xl text-[10px] uppercase font-mono font-semibold transition-all border cursor-pointer",
                                            editValues.priority === p 
                                              ? "bg-primary-600/10 text-primary-400 border-primary-500/40 font-bold" 
                                              : "bg-transparent border-white/5 text-slate-500 hover:bg-white/[0.02]"
                                          )}
                                        >
                                          {p}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Notifications / Offset Option */}
                                <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded-xl space-y-2 mt-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Enable Reminders</span>
                                    <button
                                      type="button"
                                      onClick={() => setEditValues({ ...editValues, notificationsEnabled: !editValues.notificationsEnabled })}
                                      className={cn(
                                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer",
                                        editValues.notificationsEnabled ? "bg-primary-600" : "bg-slate-800"
                                      )}
                                    >
                                      <span className={cn(
                                        "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                        editValues.notificationsEnabled ? "translate-x-5" : "translate-x-1"
                                      )} />
                                    </button>
                                  </div>

                                  {editValues.notificationsEnabled && (
                                    <div className="pt-2 border-t border-white/5">
                                      <label className="text-[9px] font-bold text-slate-500 uppercase">Alert timing</label>
                                      <select
                                        className="w-full bg-slate-950 border border-white/5 rounded-lg text-[10px] px-2 py-1.5 text-white outline-none mt-1"
                                        value={editValues.reminderOffset !== undefined ? editValues.reminderOffset : 10}
                                        onChange={e => setEditValues({ ...editValues, reminderOffset: parseInt(e.target.value, 10) })}
                                      >
                                        <option value={0}>At start time</option>
                                        <option value={5}>5 minutes before</option>
                                        <option value={10}>10 minutes before</option>
                                        <option value={15}>15 minutes before</option>
                                        <option value={30}>30 minutes before</option>
                                        <option value={60}>1 hour before</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* DISPLAY MODE RESPONSIVE CARD */
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              
                              {/* Main Left Activity details */}
                              <div className="flex items-start gap-4 min-w-0 flex-1">
                                {/* Tap status checkbox */}
                                <div 
                                  onClick={() => toggleStatus(activity.id)}
                                  className={cn(
                                    "w-11 h-11 rounded-2xl border-2 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all text-sm font-bold",
                                    activity.completed 
                                      ? "bg-emerald-500 border-emerald-500 text-black leading-none" 
                                      : "border-white/10 hover:border-white/30 text-transparent"
                                  )}
                                  style={{ minWidth: '44px', minHeight: '44px' }} /* Guaranteed 44px touch target */
                                >
                                  ✓
                                </div>

                                <div className="min-w-0 flex-1 pt-0.5">
                                  {/* Duration Stamp & Category */}
                                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5 font-sans">
                                    <span className="text-[10px] font-mono font-black text-white bg-white/[0.04] px-2.5 py-0.5 rounded-lg border border-white/5">
                                      {formatTimeTo12h(activity.start)} – {formatTimeTo12h(activity.end)}
                                    </span>
                                    <span className="text-[9px] uppercase font-black tracking-widest text-primary-400 bg-primary-950/20 px-1.5 py-0.5 rounded border border-primary-500/15">
                                      {activity.category || 'Routine'}
                                    </span>
                                    <span className={cn("text-[8px] uppercase font-mono font-bold px-1 py-0.5 rounded border", getPriorityColor(activity.priority))}>
                                      {activity.priority}
                                    </span>
                                  </div>

                                  {/* Title */}
                                  <h3 className={cn(
                                    "text-sm sm:text-base font-bold tracking-tight text-white mb-1 truncate",
                                    activity.completed && "text-slate-500 line-through truncate"
                                  )}>
                                    {activity.name}
                                  </h3>

                                  {/* Notification Settings label */}
                                  <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                                    {activity.notificationsEnabled ? (
                                      <>
                                        <Bell size={10} className="text-primary-400 shrink-0" />
                                        <span className="text-slate-400 font-medium font-sans">
                                          Notification: {activity.reminderOffset !== undefined ? (activity.reminderOffset === 0 ? "At start" : `${activity.reminderOffset}m before`) : "10m before"}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-slate-600 font-sans">No alerts set</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right side actions and status tag */}
                              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
                                {/* Live Status capsule */}
                                <button
                                  type="button"
                                  onClick={() => toggleStatus(activity.id)}
                                  className={cn(
                                    "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ring-1 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform font-sans",
                                    activity.completed 
                                      ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30" 
                                      : getStatusStyle(autoStatus)
                                  )}
                                >
                                  {activity.completed ? (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 size={10} /> Completed
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      {autoStatus === 'In Progress' && <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping" />}
                                      {autoStatus}
                                    </span>
                                  )}
                                </button>

                                {/* Action shortcuts */}
                                <div className="flex items-center gap-0.5">
                                  <button 
                                    type="button"
                                    onClick={() => setViewingActivity(activity)}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                                    title="View details"
                                    style={{ minWidth: '44px', minHeight: '44px' }} /* Comfortable mini targets */
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => startEditing(activity)}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                                    title="Edit activity"
                                    style={{ minWidth: '44px', minHeight: '44px' }}
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleDuplicate(activity)}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                                    title="Duplicate activity"
                                    style={{ minWidth: '44px', minHeight: '44px' }}
                                  >
                                    <Copy size={16} />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleDelete(activity.id)}
                                    className="p-2 text-slate-500 hover:text-rose-450 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                                    title="Delete task"
                                    style={{ minWidth: '44px', minHeight: '44px' }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </AnimatePresence>
            </div>

            {/* Empty state conditional banner */}
            {!timetable?.activities.length && (
              <div className="py-24 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-600 bg-slate-900/40 animate-pulse">
                   <AlertCircle size={40} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-sans">Configure Your Sequence</h3>
                <p className="text-slate-400 max-w-xs text-sm leading-relaxed font-sans">
                  Your Day Planner matrix is currently clear. Add a specific activity or generate an optimized routine using the AI assistant to begin.
                </p>
              </div>
            )}
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2">Focus Mode</p>
          <h4 className="text-white font-bold text-lg">Pomodoro Sprints</h4>
          <p className="text-slate-400 text-xs mt-1">Boost productivity with 25-minute concentrated work sessions.</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-white/5 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-2">Health Matrix</p>
          <h4 className="text-white font-bold text-lg">Balance Status</h4>
          <p className="text-slate-400 text-xs mt-1">You have scheduled enough breaks to maintain peak mental state.</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-white/5 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-2">Smart Suggestion</p>
          <h4 className="text-white font-bold text-lg">Hydration Check</h4>
          <p className="text-slate-400 text-xs mt-1">Don't forget to add water breaks every 2 hours in your matrix.</p>
        </div>
      </div>

      {/* Interactive Conflict Resolution Overlay Modal */}
      <AnimatePresence>
        {conflict && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Schedule Conflict</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Time conflict detected. This activity overlaps with an existing schedule item.
                  </p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conflicting Item</p>
                <div>
                  <p className="text-sm font-bold text-white">{conflict.overlappingActivity.name}</p>
                  <p className="text-xs text-amber-400 font-mono mt-0.5">
                    {formatTimeTo12h(conflict.overlappingActivity.start)} – {formatTimeTo12h(conflict.overlappingActivity.end)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setConflict(null)}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Adjust Time
                </button>
                
                <button
                  type="button"
                  onClick={handleReplaceConflict}
                  className="w-full py-3 px-4 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Replace Existing Activity
                </button>

                <button
                  type="button"
                  onClick={handleKeepBothConflict}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
                >
                  Keep Both Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Activity View Overlay Modal */}
      <AnimatePresence>
        {viewingActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <button 
                type="button"
                onClick={() => setViewingActivity(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-primary-950 text-primary-400 border border-primary-500/20"
                )}>
                  {viewingActivity.category || 'Routine'}
                </span>
                <h3 className="text-xl font-bold text-white font-display mt-3">{viewingActivity.name}</h3>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-slate-400 font-medium">Time Interval</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {formatTimeTo12h(viewingActivity.start)} – {formatTimeTo12h(viewingActivity.end)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-slate-400 font-medium">Priority Tier</span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold", getPriorityColor(viewingActivity.priority))}>
                    {viewingActivity.priority}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-slate-400 font-medium">Status</span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ring-1", getStatusStyle(getAutoStatus(viewingActivity)))}>
                    {getAutoStatus(viewingActivity)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-slate-400 font-medium">Dynamic Reminders</span>
                  <span className="text-xs font-bold text-slate-300">
                    {viewingActivity.notificationsEnabled ? ("Enabled (" + (viewingActivity.reminderOffset !== undefined ? (viewingActivity.reminderOffset === 0 ? "At start time" : viewingActivity.reminderOffset + "m before") : "10m before") + ")") : "Disabled"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingActivity(null)}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-center text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-primary-600/20"
              >
                Dismiss Details
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
