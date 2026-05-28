import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  sendNotification, 
  addLog, 
  subscribeToAlarmState, 
  stopAlarm,
  snoozeAlarm,
  speakAnnouncement,
  getV32Settings,
  triggerAlarm,
  requestNotificationPermission
} from '../../lib/notifications';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertCircle, Volume2, X } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  start: string;
  end?: string;
  duration?: number;
  notificationsEnabled?: boolean;
  reminderOffset?: number;
}

const getTriggerTime = (startTimeStr: string, offsetMins: number): string => {
  if (!startTimeStr) return "";
  const parts = startTimeStr.split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return startTimeStr;
  
  m -= offsetMins;
  while (m < 0) {
    m += 60;
    h -= 1;
  }
  while (h < 0) {
    h += 24;
  }
  
  const hStr = h < 10 ? '0' + h : String(h);
  const mStr = m < 10 ? '0' + m : String(m);
  return `${hStr}:${mStr}`;
};

export const Layout: React.FC = () => {
  const { user, userData, loading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [activeActivity, setActiveActivity] = useState<string | null>(null);


  useEffect(() => {
    const unsubscribeAlarm = subscribeToAlarmState((active, title) => {
      setIsAlarmActive(active);
      if (active && title) setActiveActivity(title);
    });
    return () => unsubscribeAlarm();
  }, []);

  // Automatically request notification permissions on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'timetables'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeOnSnapshot = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data();
        setActivities(latest.activities || []);
      }
    });

    return () => {
      unsubscribeOnSnapshot();
    };
  }, [user]);

  // Precise background worker triggered ticking
  useEffect(() => {
    if (activities.length === 0) return;

    const getPersistedKeys = (): Set<string> => {
      try {
        const saved = localStorage.getItem('timemint_triggered_keys');
        if (saved) {
          const arr = JSON.parse(saved);
          const todayStr = new Date().toDateString();
          const fresh = arr.filter((key: string) => key.endsWith(todayStr));
          return new Set(fresh);
        }
      } catch (e) {}
      return new Set();
    };

    const persistKeys = (set: Set<string>) => {
      try {
        localStorage.setItem('timemint_triggered_keys', JSON.stringify(Array.from(set)));
      } catch (e) {}
    };

    const getDuration = (activity: any) => {
      if (activity.duration) return Number(activity.duration);
      if (activity.start && activity.end) {
        try {
          const sp = activity.start.split(':').map(Number);
          const ep = activity.end.split(':').map(Number);
          const startMins = sp[0] * 60 + sp[1];
          const endMins = ep[0] * 60 + ep[1];
          let diff = endMins - startMins;
          if (diff < 0) diff += 24 * 60;
          return diff;
        } catch (e) {}
      }
      return 30; // standard default
    };

    const handleTick = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const todayStr = now.toDateString();
      const activeKeys = getPersistedKeys();
      let updated = false;

      const settings = getV32Settings();

      activities.forEach(activity => {
        if (!activity.notificationsEnabled) return;

        const duration = getDuration(activity);

        // 1. Five-minute reminder notification + TTS pre-warn
        const r5Time = getTriggerTime(activity.start, 5);
        const r5Key = `${activity.id}-reminder_5-${r5Time}-${todayStr}`;
        if (r5Time === currentTime && !activeKeys.has(r5Key)) {
          activeKeys.add(r5Key);
          updated = true;

          sendNotification(`Upcoming Task Reminder`, {
            body: `Task:\n${activity.name}\n\nStarts:\n${activity.start}\n\nDuration:\n${duration} Minutes\n\nStarts in:\n5 Minutes`,
            tag: 'reminder'
          });

          // Text to speech sequence
          let sentence = `Attention. Your next task is ${activity.name}.`;
          if (!settings.enableTaskNameAnnouncement) {
            sentence = "Attention. Your next task is approaching.";
          }
          let timeText = `It will begin in 5 minutes at ${activity.start}`;
          if (!settings.enableStartTimeAnnouncement) {
            timeText = "It will begin in 5 minutes";
          }
          let durationText = `and will continue for ${duration} minutes.`;
          if (!settings.enableDurationAnnouncement) {
            durationText = "";
          }
          const announcement = `${sentence} ${timeText} ${durationText} Please prepare to start your task.`.replace(/\s+/g, ' ').trim();
          
          speakAnnouncement(announcement);
          triggerAlarm(`Upcoming Reminder: ${activity.name}`, false);
          addLog(`5m pre-warn scheduled reminder triggered for "${activity.name}"`);
        }

        // 2. Two-minute alarm reminder + TTS whisper
        const a2Time = getTriggerTime(activity.start, 2);
        const a2Key = `${activity.id}-alarm_2-${a2Time}-${todayStr}`;
        if (a2Time === currentTime && !activeKeys.has(a2Key)) {
          activeKeys.add(a2Key);
          updated = true;

          sendNotification(`Upcoming Task Reminder`, {
            body: `Starts in 2m: ${activity.name}`,
            tag: 'reminder'
          });

          if (settings.repeatVoiceReminder) {
            speakAnnouncement(`Reminder. Your task ${activity.name} starts in 2 minutes.`);
          }
          addLog(`2-min warning triggered for "${activity.name}"`);
        }

        // 3. Start-time alert + TTS start task announcement
        const s0Time = getTriggerTime(activity.start, 0);
        const s0Key = `${activity.id}-start_0-${s0Time}-${todayStr}`;
        if (s0Time === currentTime && !activeKeys.has(s0Key)) {
          activeKeys.add(s0Key);
          updated = true;

          sendNotification(`Task Now Starting: ${activity.name}`, {
            body: `Your scheduled block is now starting. Keep up the high efficiency!`,
            tag: 'alarm',
            requireInteraction: true
          });

          speakAnnouncement(`Your task ${activity.name} is now starting. Duration ${duration} minutes. Have a productive session.`);
          triggerAlarm(`Startup: ${activity.name}`, true);
          addLog(`Start-time alert sequence run for "${activity.name}"`);
        }
      });

      if (updated) {
        persistKeys(activeKeys);
        window.dispatchEvent(new Event('storage'));
      }
    };

    // Construct persistent background timer worker using Inline Blob
    const workerCode = `
      let timerId = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (timerId) clearInterval(timerId);
          timerId = setInterval(() => {
            self.postMessage('tick');
          }, 3000);
        } else if (e.data === 'stop') {
          if (timerId) clearInterval(timerId);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = () => {
      handleTick();
    };
    worker.postMessage('start');

    // Fallback interval in case Web Workers are blocked or unsupported
    const fallbackId = setInterval(handleTick, 10000);

    return () => {
      worker.postMessage('stop');
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      clearInterval(fallbackId);
    };
  }, [activities]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white">
            <span className="text-2xl font-bold">T</span>
          </div>
          <span className="text-gray-500 font-medium">Loading TimeMint...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect to onboarding if not done
  if (userData && !userData.onboarded && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return (
    <div className="min-h-screen bg-surface-950 text-slate-200">
      {/* Immersive background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-primary-400/10 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[5%] w-[400px] h-[400px] rounded-full bg-accent-500/10 blur-[100px]"></div>
      </div>

      <Navbar />
      <main className="lg:pl-64 pt-16 lg:pt-0 pb-24 lg:pb-8 min-h-screen relative z-10">
        <div className="max-w-6xl mx-auto p-6 lg:p-12">
          <Outlet />
        </div>
      </main>

      {/* Fullscreen Alarm Overlay */}
      <AnimatePresence>
        {isAlarmActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-pulse" />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-emerald-600 rounded-[40px] p-10 text-center shadow-2xl shadow-emerald-500/20"
            >
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Bell size={48} className="text-white" />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">TimeWindow Mission Trigger</h2>
              <h1 className="text-4xl font-display font-bold text-white mb-4 leading-tight">
                {activeActivity || 'Activity'} Started
              </h1>
              <p className="text-white/80 text-lg mb-10 font-medium tracking-tight">Your scheduled mission sequence is now active.</p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={stopAlarm}
                  className="w-full h-16 bg-white text-emerald-600 rounded-3xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-xl"
                >
                  Confirm & Commence
                </button>
                <button 
                  onClick={() => snoozeAlarm(5)}
                  className="text-white/60 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                  Snooze 5 Minutes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
