import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Clock, Zap, Target, Brain, ArrowRight, ShieldCheck, Github } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center transition-all">
        <div className="flex items-center gap-2">
          <Clock className="text-primary-600" size={28} />
          <span className="text-xl font-display font-bold">TimeMint</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-semibold hover:text-primary-600 transition-colors">Login</Link>
          <Link to="/signup" className="btn-primary py-2 px-6 rounded-full text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-950/30 text-primary-600 rounded-full text-xs font-bold mb-8"
          >
            <Zap size={14} />
            <span>AI-POWERED PRODUCTIVITY</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-bold tracking-tighter mb-6 lg:max-w-4xl mx-auto"
          >
            Own your time with <span className="text-primary-600">AI Intelligence.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto"
          >
            TimeMint helps you organize your chaos. Just tell us your goals, 
            and our AI will craft the perfect timetable for your lifestyle.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup" className="btn-primary py-4 px-10 rounded-2xl text-lg font-bold flex items-center gap-2 w-full sm:w-auto">
              Start Building Now
              <ArrowRight size={20} />
            </Link>
            <button className="glass py-4 px-10 rounded-2xl text-lg font-bold w-full sm:w-auto hover:bg-gray-50 dark:hover:bg-slate-900 transition-all">
              Watch Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Crafted for Modern Life</h2>
            <p className="text-gray-500 dark:text-slate-400">Everything you need to stay on top of your schedule.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Brain, 
                title: "AI Generation", 
                desc: "Describe your routine and we'll handle the rest. No more manual scheduling stress." 
              },
              { 
                icon: Target, 
                title: "Smart Tracking", 
                desc: "Track your productivity streaks and get insights into your daily performance." 
              },
              { 
                icon: ShieldCheck, 
                title: "Always In-Sync", 
                desc: "Your schedule is synced across device. Access it offline as a clean PWA." 
              }
            ].map((f, i) => (
              <GlassCard key={i} className="p-8 group hover:border-primary-500 transition-all">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950/40 rounded-xl flex items-center justify-center text-primary-600 mb-6 group-hover:scale-110 transition-transform">
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t dark:border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Clock className="text-primary-600" size={24} />
            <span className="text-lg font-display font-bold">TimeMint</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-primary-600">Privacy</a>
            <a href="#" className="hover:text-primary-600">Terms</a>
            <a href="#" className="hover:text-primary-600">Contact</a>
          </div>
          <div className="flex gap-4">
            <button className="p-2 glass rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"><Github size={18} /></button>
          </div>
        </div>
        <div className="text-center mt-12 text-xs text-gray-400">
          © 2026 TimeMint AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
