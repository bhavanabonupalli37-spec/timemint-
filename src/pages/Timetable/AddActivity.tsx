import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { ArrowLeft, Clock, Tag, Flag, RotateCcw, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc } from 'firebase/firestore';
import { cn } from '../../lib/utils';

interface Activity {
  id: string;
  taskId?: string;
  name: string;
  taskName?: string;
  start: string;
  startTime?: string;
  end: string;
  endTime?: string;
  duration?: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  notificationsEnabled?: boolean;
  reminderOffset?: number;
  reminderEnabled?: boolean;
  voiceReminderEnabled?: boolean;
  alarmEnabled?: boolean;
  notificationEnabled?: boolean;
}

interface Timetable {
  id: string;
  activities: Activity[];
}

export default function AddActivity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form state from localStorage to preserve entered form data on back gestures/navigation
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('timemint_add_activity_form');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved add activity form state", e);
      }
    }
    return {
      name: '',
      start: '09:00',
      end: '10:00',
      category: 'Work',
      priority: 'medium' as 'low' | 'medium' | 'high',
      repeat: 'none' as 'none' | 'daily' | 'weekly',
      notificationsEnabled: true,
      reminderOffset: 10
    };
  });

  // Preserve form data on change
  useEffect(() => {
    localStorage.setItem('timemint_add_activity_form', JSON.stringify(formData));
  }, [formData]);

  // Load the current timetable dynamically to ensure sync
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'timetables'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latest = snapshot.docs[0];
        const data = latest.data();
        setTimetable({
          id: latest.id,
          activities: data.activities || []
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const [conflict, setConflict] = useState<{
    overlappingActivity: Activity;
    newTask: Activity;
  } | null>(null);

  const parseToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  };

  const sortActivities = (list: Activity[]): Activity[] => {
    return [...list].sort((a, b) => parseToMinutes(a.start) - parseToMinutes(b.start));
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

  const saveNewActivity = async (newTask: Activity, existingList: Activity[]) => {
    const user = auth.currentUser;
    if (!user || !timetable) return;
    const sorted = sortActivities([...existingList, newTask]);
    await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
      activities: sorted
    });
    setSuccessMsg(`Activity "${newTask.name}" scheduled successfully!`);
    localStorage.removeItem('timemint_add_activity_form');
    setTimeout(() => {
      navigate(-1);
    }, 1500);
  };

  const createNewTimetable = async (newTask: Activity) => {
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'timetables'), {
      name: "My Timetable",
      activities: [newTask],
      type: 'manual',
      createdAt: new Date().toISOString()
    });
    setSuccessMsg(`Activity "${newTask.name}" scheduled successfully!`);
    localStorage.removeItem('timemint_add_activity_form');
    setTimeout(() => {
      navigate(-1);
    }, 1500);
  };

  const handleReplaceConflict = async () => {
    if (!conflict || !timetable) return;
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const filtered = timetable.activities.filter(a => a.id !== conflict.overlappingActivity.id);
      const sorted = sortActivities([...filtered, conflict.newTask]);
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: sorted
      });
      localStorage.removeItem('timemint_add_activity_form');
      setSuccessMsg(`Replaced "${conflict.overlappingActivity.name}" successfully!`);
      setConflict(null);
      setTimeout(() => navigate(-1), 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to replace activity");
    } finally {
      setLoading(false);
    }
  };

  const handleKeepBothConflict = async () => {
    if (!conflict || !timetable) return;
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const sorted = sortActivities([...timetable.activities, conflict.newTask]);
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: sorted
      });
      localStorage.removeItem('timemint_add_activity_form');
      setSuccessMsg(`Saved both activities successfully!`);
      setConflict(null);
      setTimeout(() => navigate(-1), 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save both");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      setErrorMsg("You must be logged in to schedule an activity.");
      return;
    }

    if (!formData.name.trim()) {
      setErrorMsg("Please enter an activity name.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const startMins = parseToMinutes(formData.start);
      const endMins = parseToMinutes(formData.end);
      let durationDiff = endMins - startMins;
      if (durationDiff < 0) durationDiff += 24 * 60;

      const actId = Date.now().toString();
      const newTask: Activity = {
        id: actId,
        taskId: actId,
        name: formData.name.trim(),
        taskName: formData.name.trim(),
        start: formData.start,
        startTime: formData.start,
        end: formData.end,
        endTime: formData.end,
        duration: durationDiff,
        category: formData.category,
        priority: formData.priority,
        completed: false,
        notificationsEnabled: formData.notificationsEnabled,
        reminderOffset: formData.notificationsEnabled ? (formData.reminderOffset ?? 10) : undefined,
        reminderEnabled: formData.notificationsEnabled,
        voiceReminderEnabled: formData.notificationsEnabled,
        alarmEnabled: formData.notificationsEnabled,
        notificationEnabled: formData.notificationsEnabled
      };

      if (timetable) {
        const issue = detectOverlapIssue(formData.start, formData.end, timetable.activities);
        if (issue) {
          setConflict({ overlappingActivity: issue.overlappingActivity, newTask });
          setLoading(false);
          return;
        }
        await saveNewActivity(newTask, timetable.activities);
      } else {
        await createNewTimetable(newTask);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while saving the activity.");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Clear draft state on explicit cancel
    localStorage.removeItem('timemint_add_activity_form');
    navigate(-1);
  };

  return (
    <div className="w-full relative py-2">
      {/* Visual background atmospheric glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-primary-600/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-lg mx-auto">
        {/* Navigation Action Area */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            type="button"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors py-2 pr-4 pl-1 rounded-xl hover:bg-white/5 active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold">Back</span>
          </button>
          
          <span className="text-xs font-mono font-bold uppercase text-primary-400 tracking-widest bg-primary-950/40 px-3 py-1.5 rounded-full border border-primary-500/20">
            TimeMint Planner
          </span>
        </div>

        {/* Dynamic State Success Toast/Banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 shadow-2xl backdrop-blur-md"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Success</p>
                <p className="text-sm text-white/90 leading-tight font-medium">{successMsg}</p>
              </div>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/30 text-rose-300 flex items-center gap-3 shadow-2xl backdrop-blur-md"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Error</p>
                <p className="text-sm text-white/90 leading-tight font-medium">{errorMsg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GlassCard className="p-8 border-white/5 shadow-2xl rounded-[32px] bg-black/40 backdrop-blur-3xl" hover={false}>
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">Add New Activity</h1>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Define the schedule metrics, duration slot, category bounds, prioritization level, and notifications setup.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="name-input" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Activity Name
              </label>
              <input
                id="name-input"
                name="name"
                required
                type="text"
                maxLength={80}
                placeholder="e.g. Deep Work Session"
                className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-slate-900 border border-white/5 focus:border-primary-500/50 rounded-2xl outline-none text-white font-medium transition-all text-sm placeholder-slate-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Start and End Times Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" /> Start Time
                </label>
                <input
                  type="time"
                  required
                  className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-slate-900 border border-white/5 focus:border-primary-500/50 rounded-2xl outline-none text-white font-medium text-sm transition-all"
                  value={formData.start}
                  onChange={e => setFormData({ ...formData, start: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" /> End Time
                </label>
                <input
                  type="time"
                  required
                  className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-slate-900 border border-white/5 focus:border-primary-500/50 rounded-2xl outline-none text-white font-medium text-sm transition-all"
                  value={formData.end}
                  onChange={e => setFormData({ ...formData, end: e.target.value })}
                />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="category-select" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                <Tag size={12} className="text-slate-400" /> Category
              </label>
              <select 
                id="category-select"
                className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-slate-900 border border-white/5 focus:border-primary-500/50 rounded-2xl outline-none text-white font-medium text-sm transition-all appearance-none cursor-pointer"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Work" className="bg-slate-900 text-white">Work</option>
                <option value="Study" className="bg-slate-900 text-white">Study</option>
                <option value="Health" className="bg-slate-900 text-white">Health</option>
                <option value="Free Time" className="bg-slate-900 text-white">Free Time</option>
                <option value="Chores" className="bg-slate-900 text-white">Chores</option>
              </select>
            </div>

            {/* Priority & Repeat Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="priority-select" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                  <Flag size={12} className="text-slate-400" /> Priority
                </label>
                <select 
                  id="priority-select"
                  className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-slate-900 border border-white/5 focus:border-primary-500/50 rounded-2xl outline-none text-white font-medium text-sm transition-all appearance-none cursor-pointer"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="low" className="bg-slate-900 text-white">Low</option>
                  <option value="medium" className="bg-slate-900 text-white">Medium</option>
                  <option value="high" className="bg-slate-900 text-white">High</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="repeat-select" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                  <RotateCcw size={12} className="text-slate-400" /> Repeat
                </label>
                <select 
                  id="repeat-select"
                  className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-slate-900 border border-white/5 focus:border-primary-500/50 rounded-2xl outline-none text-white font-medium text-sm transition-all appearance-none cursor-pointer"
                  value={formData.repeat}
                  onChange={e => setFormData({ ...formData, repeat: e.target.value as any })}
                >
                  <option value="none" className="bg-slate-900 text-white">None</option>
                  <option value="daily" className="bg-slate-900 text-white">Daily</option>
                  <option value="weekly" className="bg-slate-900 text-white">Weekly</option>
                </select>
              </div>
            </div>

            {/* Notification Toggle Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/[0.01] rounded-2xl border border-white/5 hover:bg-white/[0.03] transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary-600/20 text-primary-400 rounded-xl">
                     <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-normal">Enable Notifications</p>
                    <p className="text-[10px] text-slate-500 font-medium">Alert me prior to start time</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, notificationsEnabled: !formData.notificationsEnabled })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-white/5 cursor-pointer",
                    formData.notificationsEnabled ? "bg-primary-600" : "bg-slate-800"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
                      formData.notificationsEnabled ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Offset Selector Panel (only when notifications are enabled) */}
              <AnimatePresence>
                {formData.notificationsEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden space-y-2 p-4 bg-white/[0.02] border border-white/5 rounded-2xl"
                  >
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Choose Reminder Time offset
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { label: 'At start time', value: 0 },
                        { label: '5 mins before', value: 5 },
                        { label: '10 mins before', value: 10 },
                        { label: '15 mins before', value: 15 },
                        { label: '30 mins before', value: 30 },
                        { label: '1 hour before', value: 60 }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, reminderOffset: opt.value })}
                          className={cn(
                            "py-2 px-3 text-left rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                            formData.reminderOffset === opt.value
                              ? "bg-primary-600/20 text-primary-400 border-primary-500/40"
                              : "bg-transparent border-white/5 hover:bg-white/5 text-slate-400"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action buttons (always reachable and fully visible at the bottom) */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="w-full sm:w-1/3 py-3 px-4 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-all rounded-2xl border border-white/5 text-sm font-bold active:scale-98 cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-2/3 py-3 px-4 bg-gradient-to-r from-primary-600 to-teal-500 hover:from-primary-500 hover:to-teal-400 text-white transition-all rounded-2xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary-600/10 active:scale-98 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Activity</span>
                )}
              </button>
            </div>

            {/* Security Indicator */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <ShieldCheck size={12} className="text-slate-600" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600">
                Encrypted Firebase Firestore Storage
              </span>
            </div>

          </form>
        </GlassCard>
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
                    {conflict.overlappingActivity.start} – {conflict.overlappingActivity.end}
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
    </div>
  );
}
