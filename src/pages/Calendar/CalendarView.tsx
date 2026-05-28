import React from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export default function CalendarView() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timetables, setTimetables] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'timetables'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTimetables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Monthly View</h1>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <button onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))} className="p-1 hover:text-primary-600">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold min-w-[120px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))} className="p-1 hover:text-primary-600">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <GlassCard className="p-4 overflow-x-auto">
        <div className="min-w-[600px] grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">{day}</div>
          ))}
          
          {/* Spacer for first day */}
          {Array(startOfMonth(currentDate).getDay()).fill(null).map((_, i) => (
            <div key={`empty-${i}`} className="h-32 rounded-xl bg-gray-50/50 dark:bg-slate-900/20" />
          ))}

          {days.map(day => {
            const isToday = isSameDay(day, new Date());
            return (
              <div 
                key={day.toString()} 
                className={cn(
                  "h-32 p-2 rounded-xl border border-gray-100 dark:border-slate-800 transition-all cursor-pointer group",
                  isToday ? "bg-primary-50/50 dark:bg-primary-900/10 border-primary-200" : "hover:border-primary-200"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                    isToday ? "bg-primary-600 text-white shadow-sm" : "text-gray-400"
                  )}>
                    {format(day, 'd')}
                  </span>
                  <Plus size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="space-y-1">
                  {/* Just mock some data indicators */}
                  <div className="h-1 w-full bg-blue-400 rounded-full opacity-30" />
                  <div className="h-1 w-2/3 bg-purple-400 rounded-full opacity-30" />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
