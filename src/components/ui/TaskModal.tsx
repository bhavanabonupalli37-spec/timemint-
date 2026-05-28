import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './GlassCard';
import { X, Clock, Tag, Flag, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { auth, db } from '../../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetableId?: string;
  activities?: any[];
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, timetableId, activities = [] }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start: '09:00',
    end: '10:00',
    category: 'Work',
    priority: 'medium' as 'low' | 'medium' | 'high',
    repeat: 'none' as 'none' | 'daily' | 'weekly',
    notificationsEnabled: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      const newTask = {
        ...formData,
        id: Date.now().toString(),
        completed: false
      };

      if (timetableId) {
        // Update existing timetable
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'timetables', timetableId), {
          activities: [...activities, newTask]
        });
      } else {
        // Create new one if none exists
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'timetables'), {
          name: "My Timetable",
          activities: [newTask],
          type: 'manual',
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-display">Add New Activity</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold ml-1">Activity Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Deep Work Session"
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none border border-transparent focus:border-primary-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold ml-1 flex items-center gap-1 group">
                  <Clock size={14} className="text-gray-400 group-hover:text-primary-600" /> Start
                </label>
                <input
                  type="time"
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none"
                  value={formData.start}
                  onChange={e => setFormData({ ...formData, start: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold ml-1 flex items-center gap-1 group">
                  <Clock size={14} className="text-gray-400 group-hover:text-primary-600" /> End
                </label>
                <input
                  type="time"
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none"
                  value={formData.end}
                  onChange={e => setFormData({ ...formData, end: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold ml-1 flex items-center gap-1">
                <Tag size={14} className="text-gray-400" /> Category
              </label>
              <select 
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option>Work</option>
                <option>Study</option>
                <option>Health</option>
                <option>Free Time</option>
                <option>Chores</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold ml-1 flex items-center gap-1">
                  <Flag size={14} className="text-gray-400" /> Priority
                </label>
                <select 
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold ml-1 flex items-center gap-1">
                  <RotateCcw size={14} className="text-gray-400" /> Repeat
                </label>
                <select 
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none"
                  value={formData.repeat}
                  onChange={e => setFormData({ ...formData, repeat: e.target.value as any })}
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-600/20 text-primary-400 rounded-lg">
                   <Clock size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Enable Notifications</p>
                  <p className="text-[10px] text-slate-500">Get reminded before activity starts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, notificationsEnabled: !formData.notificationsEnabled })}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ring-2 ring-white/5",
                  formData.notificationsEnabled ? "bg-primary-600" : "bg-slate-800"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                    formData.notificationsEnabled ? "translate-x-5" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            <button
              disabled={loading}
              className="w-full btn-primary py-3 mt-4"
            >
              {loading ? "Adding..." : "Schedule Activity"}
            </button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};
