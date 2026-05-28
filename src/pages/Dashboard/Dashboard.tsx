import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { GlassCard } from '../../components/ui/GlassCard';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flame, 
  Plus, 
  Trophy,
  Brain,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  GripVertical,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { sendNotification } from '../../lib/notifications';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { UpcomingReminder } from '../../components/dashboard/UpcomingReminder';

interface Activity {
  id: string;
  name: string;
  start: string;
  end: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

interface Timetable {
  id: string;
  name: string;
  activities: Activity[];
}

export default function Dashboard() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState({
    completed: 0,
    total: 0,
    streak: 0,
    productivity: 0
  });

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
        
        let sorted = data.activities || [];
        if (sorted.length) {
          sorted = sortActivities(sorted);
        }
        setTimetable(data);
        setActivities(sorted);

        // Calc stats
        const total = sorted.length;
        const completed = sorted.filter(a => a.completed).length;
        setStats(prev => ({
          ...prev,
          total,
          completed,
          productivity: total > 0 ? Math.round((completed / total) * 100) : 0
        }));
      } else {
        setTimetable(null);
        setActivities([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const toggleActivity = async (activityId: string) => {
    if (!timetable || !user) return;

    const updatedActivities = activities.map(a => 
      a.id === activityId ? { ...a, completed: !a.completed } : a
    );
    const sorted = sortActivities(updatedActivities);

    try {
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: sorted
      });
      
      const justCompleted = sorted.find(a => a.id === activityId && a.completed);
      if (justCompleted) {
        sendNotification("Task Completed!", { body: `Great job finishing: ${justCompleted.name}` });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteActivity = async (activityId: string) => {
    if (!timetable || !user) return;
    const updatedActivities = activities.filter(a => a.id !== activityId);
    const sorted = sortActivities(updatedActivities);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: sorted
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReorder = async (newOrder: Activity[]) => {
    const sorted = sortActivities(newOrder);
    setActivities(sorted);
    if (!timetable || !user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'timetables', timetable.id), {
        activities: sorted
      });
    } catch (err) {
      console.error(err);
    }
  };

  const chartData = [
    { day: 'Mon', completion: 65 },
    { day: 'Tue', completion: 45 },
    { day: 'Wed', completion: 85 },
    { day: 'Thu', completion: 70 },
    { day: 'Fri', completion: 90 },
    { day: 'Sat', completion: 30 },
    { day: 'Sun', completion: 50 },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10 border border-red-400/20';
      case 'medium': return 'text-amber-400 bg-amber-400/10 border border-amber-400/20';
      default: return 'text-primary-400 bg-primary-400/10 border border-primary-400/20';
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Good Day, {userData?.name?.split(' ')[0]}.</h1>
          <p className="text-slate-400">Your AI has optimized your schedule for today's peak performance.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-4xl font-light text-white leading-none">{format(new Date(), 'HH:mm')}</p>
            <p className="text-xs font-bold text-primary-400 tracking-tighter uppercase">{format(new Date(), 'EEEE, MMM do')}</p>
          </div>
          <button 
            onClick={() => navigate('/add-activity')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            New Task
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Efficiency</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">{stats.productivity}%</span>
            <span className="text-xs text-primary-400">+12%</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
            <div 
              style={{ width: `${stats.productivity}%` }}
              className="h-full bg-primary-400 shadow-[0_0_10px_rgba(45,212,191,0.5)] transition-all duration-1000"
            />
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl group cursor-pointer hover:bg-white/10 transition-all">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Current Streak</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white group-hover:text-amber-400 transition-colors">{stats.streak}</span>
            <span className="text-xs text-slate-400">Days</span>
            {stats.streak >= 0 && <Flame size={16} className="text-amber-500 animate-pulse ml-1" />}
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-accent-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all" 
              style={{ width: '85%' }}
            />
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Tasks Done</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">{stats.completed}</span>
            <span className="text-xs text-slate-400">/ {stats.total}</span>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Mood Focus</p>
          <div className="flex items-baseline gap-1 font-bold text-white">
            <span className="text-2xl tracking-tight">Prime Flow</span>
            <span className="text-[10px] text-primary-400 ml-2 font-black uppercase">Optimal</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Timeline Roadmap</h3>
            <span className="text-xs text-primary-400 underline underline-offset-4 cursor-pointer">Live View</span>
          </div>

          <div className="space-y-4">
            {timetable ? (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {activities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "group relative p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-6 cursor-pointer hover:bg-white/10 transition-all",
                        activity.completed && "opacity-50"
                      )}
                    >
                      <div className="text-right w-24 shrink-0" onClick={() => toggleActivity(activity.id)}>
                        <p className="text-sm font-bold text-white whitespace-nowrap">{formatTimeTo12h(activity.start)}</p>
                        <p className="text-[10px] text-slate-500 font-mono tracking-tight">{formatTimeTo12h(activity.end)}</p>
                      </div>
                      <div className="h-10 w-px bg-white/10" />
                      
                      <div className="flex-1 min-w-0" onClick={() => toggleActivity(activity.id)}>
                        <h4 className={cn("text-sm font-bold text-white truncate", activity.completed && "line-through")}>
                          {activity.name}
                        </h4>
                        <p className="text-xs text-slate-400 capitalize">Priority: {activity.priority} • {activity.category || 'Routine'}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider", getPriorityColor(activity.priority))}>
                          {activity.priority}
                        </span>
                        <div 
                          onClick={() => toggleActivity(activity.id)}
                          className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer",
                          activity.completed 
                            ? "bg-primary-400 border-primary-400 text-black" 
                            : "border-white/20 text-transparent"
                        )}>
                          ✓
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deleteActivity(activity.id); }}
                          className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <GlassCard className="p-16 flex flex-col items-center text-center gap-6 border-dashed border-white/10">
                <div className="p-6 bg-primary-400/10 rounded-full text-primary-400">
                  <Brain size={48} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Optimize Your Day</h3>
                  <p className="text-slate-400 text-sm max-w-sm mt-1">Our AI is ready to suggest a high-performance routine based on your goals.</p>
                </div>
                <button 
                  onClick={() => navigate('/ai-assistant')}
                  className="btn-primary mt-2"
                >
                  Generate with AI
                </button>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Sidebar/Quick Info */}
        <div className="space-y-8">
          <UpcomingReminder activities={activities} />

          <div className="p-6 rounded-3xl bg-gradient-to-br from-accent-500/20 to-primary-400/20 border border-white/10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Brain size={80} className="text-white" />
             </div>
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary-300 mb-4">AI Assistant</h3>
             <p className="text-sm font-medium text-white leading-relaxed mb-6 italic">“You're entering a deep focus state. Should I mute your notifications until your break at 11:30?”</p>
             <div className="flex items-center gap-2">
               <input 
                type="text" 
                placeholder="Ask TimeMint..." 
                className="flex-1 bg-black/40 border-none rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-primary-400 outline-none text-white"
               />
               <button className="p-2 bg-primary-400 rounded-xl text-black hover:bg-primary-300 transition-colors">
                 <Plus size={16} />
               </button>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-2">Efficiency Rating</h3>
            <GlassCard className="p-6">
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#2dd4bf' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completion" 
                      stroke="#2dd4bf" 
                      fillOpacity={1} 
                      fill="url(#colorComp)" 
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 w-full gap-4 mt-6">
                <div className="text-center">
                  <p className="text-sm font-bold text-white">4h 12m</p>
                  <p className="text-[10px] text-slate-500">Focus Time</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">1h 05m</p>
                  <p className="text-[10px] text-slate-500">Breaks</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
