import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'motion/react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Check your inbox for further instructions.');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold">Password Reset</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-center">
            Enter your email to receive a password reset link.
          </p>
        </div>

        <GlassCard className="p-8">
          {message && (
            <div className="mb-6 p-3 text-sm bg-green-100 border border-green-200 text-green-600 rounded-lg">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 p-3 text-sm bg-red-100 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading ? "Sending..." : "Send Reset Link"}
              {!loading && <Send size={18} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 text-center">
            <Link to="/login" className="text-primary-600 font-semibold hover:underline flex items-center justify-center gap-2">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
