import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { Chrome, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const navigate = useNavigate();

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setToast(null);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error("No Email associated with this Google Account.");
      }

      // Sync user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user profile for TimeMint
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || 'TimeMint User',
          email: user.email,
          onboarded: false, // New users pass through the Onboarding wizard first
          createdAt: new Date().toISOString()
        });
      }

      showToast('success', `Welcome to TimeMint, ${user.displayName || 'User'}!`);
      
      // Navigate to TimeMint Dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err: any) {
      console.error("Firebase Login Error: ", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        const errorMsg = err.message || "An unexpected error occurred during sign in.";
        showToast('error', `Login Failed: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:to-slate-900 relative overflow-hidden">
      
      {/* Aesthetic glowing accents in page margins */}
      <div className="absolute top-[-10%] right-[-10%] w-[450px] h-[450px] bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating high-contrast Toast widgets */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md pointer-events-auto ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-950/90 border-rose-500/20 text-rose-300'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5">
                  {toast.type === 'success' ? 'Success' : 'Authentification Error'}
                </p>
                <p className="text-sm text-white/80 leading-relaxed font-sans">{toast.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-8 border-white/10 shadow-2xl relative bg-black/40 backdrop-blur-3xl rounded-[32px] overflow-hidden">
          <div className="flex flex-col items-center">
            
            {/* Smooth pulsing branding Icon */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 bg-gradient-to-tr from-primary-600 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-600/10 mb-6 border border-primary-500/20"
            >
              <Clock size={32} className="text-white" />
            </motion.div>

            {/* Typography pair */}
            <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-2 text-center">
              Welcome Back
            </h1>
            <p className="text-slate-400 text-center text-sm px-4 leading-relaxed mb-8">
              Sign in to continue using TimeMint and manage your tasks, schedules, and productivity.
            </p>

            {/* Google Sign-in flow controls */}
            <div className="w-full">
              <motion.button
                whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                disabled={loading}
                onClick={handleGoogleLogin}
                aria-label="Continue with Google"
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-neutral-100 text-slate-900 border border-neutral-200 rounded-2xl font-semibold shadow-lg shadow-black/20 hover:shadow-primary-500/10 transition-all cursor-pointer relative overflow-hidden"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                ) : (
                  <Chrome className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-semibold pr-1">
                  {loading ? "Signing in..." : "Continue with Google"}
                </span>
              </motion.button>
            </div>

            {/* Subtle aesthetic indicator below action item */}
            <p className="text-[11px] text-slate-500 text-center font-mono mt-8 uppercase tracking-widest">
              Secure Cloud Session
            </p>

          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
