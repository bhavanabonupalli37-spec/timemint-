import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Volume2, Bell, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { getV32Settings, simulateTaskReminder, stopAlarm } from '../../lib/notifications';

interface Activity {
  id: string;
  name: string;
  start: string;
  end: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  duration?: number;
}

interface UpcomingReminderProps {
  activities: Activity[];
}

export const UpcomingReminder: React.FC<UpcomingReminderProps> = ({ activities }) => {
  const [nextActivity, setNextActivity] = useState<Activity | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [status, setStatus] = useState<'Scheduled' | 'Approaching' | 'Starting Now' | 'None'>('None');

  const parseToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  };

  const getDurationMins = (activity: Activity) => {
    if (activity.duration) return Number(activity.duration);
    try {
      const sp = activity.start.split(':').map(Number);
      const ep = activity.end.split(':').map(Number);
      const startMins = sp[0] * 60 + sp[1];
      const endMins = ep[0] * 60 + ep[1];
      let diff = endMins - startMins;
      if (diff < 0) diff += 24 * 60;
      return diff;
    } catch (e) {
      return 30; // standard default
    }
  };

  useEffect(() => {
    const updateCountdown = () => {
      if (!activities || activities.length === 0) {
        setNextActivity(null);
        setTimeLeftStr('');
        setSecondsRemaining(null);
        setStatus('None');
        return;
      }

      const now = new Date();
      const currentTotalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      // Filter activities that start in the future today
      const upcoming = activities
        .filter(act => {
          if (act.completed) return false;
          const actMins = parseToMinutes(act.start);
          const actSeconds = actMins * 60;
          return actSeconds > currentTotalSeconds;
        })
        .sort((a, b) => parseToMinutes(a.start) - parseToMinutes(b.start));

      if (upcoming.length === 0) {
        setNextActivity(null);
        setTimeLeftStr('');
        setSecondsRemaining(null);
        setStatus('None');
        return;
      }

      const active = upcoming[0];
      setNextActivity(active);

      const targetMins = parseToMinutes(active.start);
      const targetSecondsTotal = targetMins * 60;
      const diffSeconds = targetSecondsTotal - currentTotalSeconds;

      setSecondsRemaining(diffSeconds);

      if (diffSeconds <= 0) {
        setStatus('Starting Now');
        setTimeLeftStr('Starting Now');
      } else if (diffSeconds <= 300) {
        // Less than or equal to 5 minutes
        setStatus('Approaching');
        const m = Math.floor(diffSeconds / 60);
        const s = diffSeconds % 60;
        const mStr = String(m).padStart(1, '0') + 'm';
        const sStr = String(s).padStart(2, '0') + 's';
        setTimeLeftStr(`${mStr} ${sStr}`);
      } else {
        setStatus('Scheduled');
        const h = Math.floor(diffSeconds / 3600);
        const m = Math.floor((diffSeconds % 3600) / 60);
        const s = diffSeconds % 60;
        if (h > 0) {
          setTimeLeftStr(`${h}h ${m}m ${s}s`);
        } else {
          setTimeLeftStr(`${m}m ${String(s).padStart(2, '0')}s`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activities]);

  if (!nextActivity) {
    return (
      <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center p-6 min-h-[160px] relative overflow-hidden">
        <Clock size={28} className="text-slate-600 mb-2.5" />
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Upcoming Reminders</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">No upcoming scheduled tasks left today.</p>
      </div>
    );
  }

  const duration = getDurationMins(nextActivity);
  const settings = getV32Settings();

  const getStatusBadge = () => {
    switch (status) {
      case 'Starting Now':
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono bg-red-500/20 text-red-400 border border-red-500/30 rounded-md animate-pulse">
            Active Now
          </span>
        );
      case 'Approaching':
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-md animate-bounce">
            Approaching
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono bg-primary-500/15 text-primary-400 border border-primary-500/25 rounded-md">
            Armed
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative p-5 rounded-3xl border transition-all duration-300 overflow-hidden ${
        status === 'Approaching'
          ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 shadow-lg shadow-amber-500/5'
          : 'bg-white/5 border-white/10'
      }`}
    >
      {/* Decorative Glow elements */}
      {status === 'Approaching' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
      )}

      {/* Header title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <Clock size={14} className={status === 'Approaching' ? 'text-amber-400 animate-spin' : 'text-primary-400'} />
          <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Upcoming Reminder</h4>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Focus metric info */}
      <div className="space-y-3.5">
        <div>
          <h3 className="text-white text-base font-black tracking-tight truncate" title={nextActivity.name}>
            {nextActivity.name}
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider font-mono">
            Duration: {duration} Minutes
          </p>
        </div>

        {/* Dynamic Countdown */}
        <div className="py-2.5 px-3 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest font-mono">Starts In</div>
            <div className={`text-2xl font-black font-mono tracking-tighter ${
              status === 'Approaching' ? 'text-amber-300 animate-pulse' : 'text-white'
            }`}>
              {timeLeftStr}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest font-mono">Start Time</div>
            <div className="text-sm font-extrabold text-slate-305 font-mono text-slate-300">{nextActivity.start}</div>
          </div>
        </div>

        {/* Reminder Settings / Status info items */}
        <div className="flex items-center justify-between text-[11px] border-t border-white/5 pt-3 text-slate-500 font-mono font-semibold">
          <span className="flex items-center gap-1">
            <Bell size={12} className={settings.enableAlarm ? "text-emerald-400" : "text-slate-600"} />
            Alarm {settings.enableAlarm ? "Set" : "Muted"}
          </span>
          <span className="flex items-center gap-1">
            <Volume2 size={12} className={settings.enableVoiceReminders ? "text-emerald-400" : "text-slate-600"} />
            Voice {settings.enableVoiceReminders ? "Active" : "Disabled"}
          </span>
        </div>

        {/* Quick Simulated trigger diagnostics button */}
        {status === 'Approaching' && (
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono font-bold text-[9px] uppercase">
            <button
              onClick={() => {
                stopAlarm();
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              }}
              className="py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-center rounded-lg transition-all cursor-pointer"
            >
              Quiet Alarm
            </button>
            <button
              onClick={() => {
                simulateTaskReminder('reminder_5', nextActivity.name, nextActivity.start, duration);
              }}
              className="py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-center rounded-lg transition-all cursor-pointer"
            >
              Test Pre-Warn
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
