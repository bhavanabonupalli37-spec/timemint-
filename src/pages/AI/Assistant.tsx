import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Bot, Send, Brain, Sparkles, Loader2, CalendarPlus, ChevronRight } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { cn } from '../../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  options?: any;
}

export default function AIAssistant() {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: "Hi! I'm your TimeMint Assistant. Describe your daily routine, or tell me 'Generate my study plan', and I'll create an optimized timetable for you!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerate = async (prompt: string) => {
    setLoading(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: prompt }]);
    setInput('');

    try {
      const response = await fetch('/api/generate-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userDetails: userData })
      });
      
      const data = await response.json();
      
      if (data.activities) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString() + '-ai', 
          role: 'ai', 
          content: `I've optimized your schedule! I've balanced your ${userData?.role || 'routine'} requirements with healthy breaks.`,
          options: data
        }]);
      } else {
        throw new Error("Invalid output");
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString() + '-err', role: 'ai', content: "I encountered an error while generating your timetable. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const saveTimetable = async (data: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'timetables'), {
        name: `AI Generated - ${new Date().toLocaleDateString()}`,
        activities: data.activities.map((a: any, i: number) => ({ ...a, id: i.toString(), completed: false })),
        type: 'ai',
        createdAt: new Date().toISOString()
      });
      setMessages(prev => [...prev, { id: Date.now().toString() + '-saved', role: 'ai', content: "Great! Your new timetable has been saved to your Dashboard." }]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] lg:h-[calc(100vh-120px)]">
      <div className="flex-none mb-10">
        <h1 className="text-4xl font-display font-bold flex items-center gap-3 text-white">
          <Bot className="text-primary-400" size={40} />
          AI Assistant
        </h1>
        <p className="text-slate-400">Your high-performance routine coach.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6 scrollbar-hide">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
          >
            <div className={cn(
              "max-w-[85%] lg:max-w-xl p-5 rounded-3xl shadow-lg border",
              msg.role === 'user' 
                ? "bg-primary-400 text-black border-primary-300 rounded-tr-none font-medium" 
                : "bg-white/5 border-white/10 text-slate-200 rounded-tl-none backdrop-blur-md"
            )}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              
              {msg.options && (
                <div className="mt-6 space-y-3">
                  <div className="border-t border-white/10 pt-4 flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-300 opacity-60">Proposed Roadmap</span>
                    <button 
                      onClick={() => saveTimetable(msg.options)}
                      className="text-[10px] bg-primary-400 text-black px-4 py-1.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 hover:bg-primary-300 transition-colors shadow-lg shadow-primary-400/20"
                    >
                      <CalendarPlus size={14} />
                      Commit to Schedule
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {msg.options.activities.map((act: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs p-3 bg-black/40 border border-white/5 rounded-2xl">
                        <span className="font-bold w-24 text-primary-400">{act.start} — {act.end}</span>
                        <span className="flex-1 truncate font-medium ml-2 text-white">{act.name}</span>
                        <span className="text-[9px] font-black opacity-40 px-2 uppercase tracking-widest">{act.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4">
              <Loader2 className="animate-spin text-primary-400" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="flex-none">
        <div className="p-4 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-3 shadow-2xl backdrop-blur-xl">
          <input
            type="text"
            placeholder="Describe your goals or routine..."
            className="flex-1 bg-transparent border-none outline-none p-2 ml-2 text-sm text-white placeholder-slate-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && input && handleGenerate(input)}
          />
          <button
            disabled={!input || loading}
            onClick={() => handleGenerate(input)}
            className="p-3 bg-primary-400 text-black rounded-2xl hover:bg-primary-300 transition-all disabled:opacity-50 shadow-lg shadow-primary-400/20"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
