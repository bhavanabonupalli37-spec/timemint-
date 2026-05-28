import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Sparkles, Brain, Loader2 } from 'lucide-react';

export default function Onboarding() {
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    role: 'Student',
    wakeUpTime: '07:00',
    sleepTime: '23:00',
    dailyGoals: '',
    preferredWorkHours: 'Morning',
    breakPreferences: '15 mins after 2 hours',
    exerciseTime: '',
    mealTimings: '',
    travelTime: '',
    freeTimePreferences: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        preferences: formData,
        onboarded: true,
        role: formData.role
      });
      await refreshUserData();
      navigate('/dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-950 dark:to-slate-900 p-4 pt-10 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-4"
          >
            <Sparkles className="text-primary-600" size={32} />
          </motion.div>
          <h1 className="text-4xl font-display font-bold mb-2">Personalize Your Routine</h1>
          <p className="text-gray-600 dark:text-slate-400">Tell us how you spend your day so TimeMint can optimize for you.</p>
        </div>

        <GlassCard className="relative overflow-hidden">
          <div className="flex justify-between mb-8 px-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-1/3 h-1.5 rounded-full mx-1 transition-all duration-300 ${
                  s <= step ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">What describes you best?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Student', 'Employee', 'Freelancer', 'Other'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: r })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.role === r 
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/20' 
                            : 'border-transparent bg-gray-50 dark:bg-slate-800'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">Wake-up Time</label>
                    <input
                      type="time"
                      value={formData.wakeUpTime}
                      onChange={(e) => setFormData({ ...formData, wakeUpTime: e.target.value })}
                      className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">Sleep Time</label>
                    <input
                      type="time"
                      value={formData.sleepTime}
                      onChange={(e) => setFormData({ ...formData, sleepTime: e.target.value })}
                      className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none"
                    />
                  </div>
                </div>
                <button type="button" onClick={nextStep} className="w-full btn-primary mt-4">Next Step</button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">Daily Goals / Main Focus</label>
                  <textarea
                    placeholder="Enter your main goals for the day..."
                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none h-24"
                    value={formData.dailyGoals}
                    onChange={(e) => setFormData({ ...formData, dailyGoals: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">Exercise / Gym Time</label>
                  <input
                    placeholder="e.g. 6PM - 7PM"
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none"
                    value={formData.exerciseTime}
                    onChange={(e) => setFormData({ ...formData, exerciseTime: e.target.value })}
                  />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={prevStep} className="flex-1 px-6 py-2 bg-gray-100 dark:bg-slate-800 rounded-xl">Back</button>
                  <button type="button" onClick={nextStep} className="flex-1 btn-primary">Next Step</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">Preferred Productivity Window</label>
                  <select
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none"
                    value={formData.preferredWorkHours}
                    onChange={(e) => setFormData({ ...formData, preferredWorkHours: e.target.value })}
                  >
                    <option>Early Morning</option>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Late Night</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold">Any more details? (Meals, Commute, etc.)</label>
                  <textarea
                    placeholder="Breakfast at 8, lunch at 1, commute 1 hour..."
                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none h-24"
                    value={formData.freeTimePreferences}
                    onChange={(e) => setFormData({ ...formData, freeTimePreferences: e.target.value })}
                  />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={prevStep} className="flex-1 px-6 py-2 bg-gray-100 dark:bg-slate-800 rounded-xl">Back</button>
                  <button
                    disabled={loading}
                    type="submit"
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Complete Setup"}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
