import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Play, Pause, RotateCcw, Timer, Brain, Coffee, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { sendNotification } from '../../lib/notifications';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export default function FocusTimer() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const config = {
    work: { time: 25 * 60, color: 'text-primary-600', bg: 'bg-primary-500', label: 'Stay Focused' },
    shortBreak: { time: 5 * 60, color: 'text-green-600', bg: 'bg-green-500', label: 'Relax' },
    longBreak: { time: 15 * 60, color: 'text-blue-600', bg: 'bg-blue-500', label: 'Long Rest' }
  };

  useEffect(() => {
    let interval: any = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    sendNotification("Focus Session Complete!", { 
      body: mode === 'work' ? "Time for a break!" : "Break is over, back to focus!",
      tag: 'alarm'
    });

    if (mode === 'work') {
      const newSessionCount = sessionsCompleted + 1;
      setSessionsCompleted(newSessionCount);
      if (newSessionCount % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(config.longBreak.time);
      } else {
        setMode('shortBreak');
        setTimeLeft(config.shortBreak.time);
      }
    } else {
      setMode('work');
      setTimeLeft(config.work.time);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(config[mode].time);
  };

  const changeMode = (newMode: TimerMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(config[newMode].time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((config[mode].time - timeLeft) / config[mode].time) * 100;

  return (
    <div className="max-w-xl mx-auto space-y-8 py-4">
      <div className="text-center">
        <h1 className="text-3xl font-display font-bold">Focus Timer</h1>
        <p className="text-gray-500">Master your productivity with Pomodoro.</p>
      </div>

      <div className="flex justify-center gap-2">
        {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              mode === m 
                ? "bg-white dark:bg-slate-900 shadow-md transform scale-105 text-primary-600" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            {m === 'work' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>

      <GlassCard className="p-12 text-center relative overflow-hidden">
        {/* Progress Background */}
        <motion.div 
          initial={false}
          animate={{ height: `${progress}%` }}
          className={cn("absolute bottom-0 left-0 w-full opacity-10 transition-all", config[mode].bg)}
        />

        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            key={mode}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn("flex items-center gap-2 mb-4 font-bold uppercase tracking-widest text-xs", config[mode].color)}
          >
            {mode === 'work' ? <Brain size={16} /> : <Coffee size={16} />}
            {config[mode].label}
          </motion.div>

          <span className="text-8xl md:text-9xl font-display font-bold tracking-tighter mb-8 tabular-nums">
            {formatTime(timeLeft)}
          </span>

          <div className="flex gap-4">
            <button
              onClick={toggleTimer}
              className={cn(
                "p-6 rounded-full text-white shadow-xl transform active:scale-95 transition-all",
                isActive ? "bg-amber-500" : config[mode].bg
              )}
            >
              {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-6 rounded-full glass hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            >
              <RotateCcw size={32} />
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Daily Goal</p>
            <p className="text-lg font-bold">{sessionsCompleted} / 8 sessions</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
            <Timer size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Time Focused</p>
            <p className="text-lg font-bold">{Math.round((sessionsCompleted * 25) / 60 * 10) / 10}h</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
