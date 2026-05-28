import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, HelpCircle, FileText, Send, AlertTriangle, ShieldAlert, Check } from 'lucide-react';

interface ModalWrapperProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ onClose, title, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
    >
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/40">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {title}
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
        {children}
      </div>
    </motion.div>
  </div>
);

// ==== USER GUIDE MODAL ====
export const UserGuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <ModalWrapper onClose={onClose} title="📚 TimeMint User Guide">
    <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
      <section className="space-y-2">
        <h4 className="text-white font-bold text-base">1. Getting Started with TimeMint</h4>
        <p>TimeMint is built on scientific time-boxing principles. Schedule your calendar in advance, block distractions through synchronized deep work loops, and allow our AI engine to dynamically re-order priorities.</p>
      </section>
      
      <section className="space-y-2 border-t border-white/5 pt-4">
        <h4 className="text-white font-bold text-base">2. Pomodoro & Routine Customization</h4>
        <p>You can optimize session duration sliders inside <i>Productivity Settings</i>. Default work cycles are set to 25 minutes with a 5-minute break. Double the duration for deep intellectual focus.</p>
      </section>

      <section className="space-y-2 border-t border-white/5 pt-4">
        <h4 className="text-white font-bold text-base">3. Real-Time Diagnostics & Alarm Sounds</h4>
        <p>All activity thresholds generate elegant, safe visual and audible cues directly inside our workspace sandboxing. Review your Cron state under <i>Reminders</i> to test synthesis engines live.</p>
      </section>

      <section className="space-y-2 border-t border-white/5 pt-4">
        <h4 className="text-white font-bold text-base">4. Security & Isolation Keycards</h4>
        <p>Timebox metadata is saved locally inside secure storage buffers or synced out dynamically to secure Firestore. Export backups regularly via <i>Data Management</i> to never lose your timelines.</p>
      </section>
    </div>
  </ModalWrapper>
);

// ==== FAQ MODAL ====
export const FAQModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <ModalWrapper onClose={onClose} title="❓ Frequently Asked Questions">
    <div className="space-y-4 text-sm text-slate-300">
      {[
        {
          q: "How does the sound synthesis work without downloading assets?",
          a: "TimeMint utilizes the physical Web Audio API chip simulation on your device, generating frequency modulations (FM) and low frequency sweeps (LFO) for alarms and ambient noise directly in the system thread."
        },
        {
          q: "Why are my changes updated instantly without saving manually?",
          a: "All UI event loops automatically flush parameters to persistent storages immediately on input events, showing dynamic visual success toasts as confirmations."
        },
        {
          q: "Are my calendars securely isolated?",
          a: "Yes. Integrations utilize client oauth and secure server authentication routes. No raw credentials are stored in clear text formats."
        },
        {
          q: "Can I use TimeMint completely offline?",
          a: "Yes, fully! The custom offline-first routing and Local Storage fallbacks let you manage timelines safely without a continuous connection."
        }
      ].map((faq, i) => (
        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1.5">
          <p className="font-bold text-white text-sm">💡 {faq.q}</p>
          <p className="text-slate-400 text-xs leading-relaxed">{faq.a}</p>
        </div>
      ))}
    </div>
  </ModalWrapper>
);

// ==== CONTACT SUPPORT ====
export const SupportContactModal: React.FC<{ onClose: () => void; onSubmit: (msg: string) => void }> = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ subject: '', message: '', priority: 'medium' });
  const [errorCode, setErrorCode] = useState('');

  const handleSend = () => {
    if (!form.message) {
      setErrorCode('Message cannot be blank.');
      return;
    }
    onSubmit(`Support Ticket "${form.subject || 'General'}" logged successfully.`);
    onClose();
  };

  return (
    <ModalWrapper onClose={onClose} title="🛠️ Contact TimeMint Support">
      <div className="space-y-4">
        {errorCode && <div className="p-3 bg-red-500/10 border border-red-500/30 text-xs text-red-200 rounded-xl">{errorCode}</div>}
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-slate-400">Subject</label>
          <input
            type="text"
            placeholder="How can we assist you?"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full bg-slate-950 text-white rounded-xl py-2.5 px-4 text-sm border border-white/15 focus:outline-none focus:border-primary-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400">Severity Level</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full bg-slate-950 text-white rounded-xl py-2.5 px-3 text-sm border border-white/15 focus:outline-none focus:border-primary-400"
            >
              <option value="low">Low (General Inquiry)</option>
              <option value="medium">Medium (App Glitch)</option>
              <option value="high">High (Production Blocked)</option>
            </select>
          </div>
          <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-slate-500 flex items-center justify-center">
            Avg. Ticket response: <b>&lt; 15 minutes</b>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-slate-400">Describe the Issue</label>
          <textarea
            rows={4}
            placeholder="Please enter logs, behaviors, or error indicators..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full bg-slate-950 text-white rounded-xl py-2.5 px-4 text-sm border border-white/15 focus:outline-none focus:border-primary-400"
          />
        </div>
        <button
          onClick={handleSend}
          className="w-full py-3 bg-primary-500 text-black rounded-xl font-bold text-sm cursor-pointer hover:bg-primary-400 transition-colors flex items-center justify-center gap-2"
        >
          <Send size={15} />
          Submit Support Ticket
        </button>
      </div>
    </ModalWrapper>
  );
};

// ==== GENERIC FEEDBACK MODAL ====
export const FeedbackModal: React.FC<{ type: 'feedback' | 'bug' | 'feature'; onClose: () => void; onSubmit: (msg: string) => void }> = ({ type, onClose, onSubmit }) => {
  const [form, setForm] = useState({ rating: '5', feedbackText: '', category: 'ui' });

  const handleSend = () => {
    if (!form.feedbackText) return;
    onSubmit(`Payload submitted: TimeMint ${type} registered.`);
    onClose();
  };

  const titleMap = {
    feedback: "💬 Submit Feedback",
    bug: "🐛 Report System Bug",
    feature: "✨ Feature Request"
  };

  return (
    <ModalWrapper onClose={onClose} title={titleMap[type]}>
      <div className="space-y-4">
        {type === 'feedback' && (
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400">Product Rating</label>
            <div className="flex gap-2">
              {['1', '2', '3', '4', '5'].map((star) => (
                <button
                  key={star}
                  onClick={() => setForm({ ...form, rating: star })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${form.rating === star ? 'bg-primary-500 text-black border-primary-500' : 'bg-slate-950 text-slate-400 border-white/15'}`}
                >
                  {star} ★
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-slate-400">Category Impact</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full bg-slate-950 text-white rounded-xl py-2.5 px-3 text-sm border border-white/15 focus:outline-none focus:border-primary-400"
          >
            <option value="ui">User Interface & Layout</option>
            <option value="timers">Timers & Reminders Tracker</option>
            <option value="ai">AI Productivity Engine</option>
            <option value="data">Data Sync & Integrations</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-slate-400">Your Message</label>
          <textarea
            rows={4}
            placeholder={type === 'bug' ? "What broke? Post copyable step outputs, error screens..." : "Describe your request in detail..."}
            value={form.feedbackText}
            onChange={(e) => setForm({ ...form, feedbackText: e.target.value })}
            className="w-full bg-slate-950 text-white rounded-xl py-2.5 px-4 text-sm border border-white/15 focus:outline-none focus:border-primary-400"
          />
        </div>
        <button
          onClick={handleSend}
          className="w-full py-3 bg-primary-500 text-black rounded-xl font-bold text-sm cursor-pointer hover:bg-primary-400 transition-colors flex items-center justify-center gap-2"
        >
          <Send size={15} />
          Submit {type === 'bug' ? 'Incident Report' : 'Proposal'}
        </button>
      </div>
    </ModalWrapper>
  );
};

// ==== DOUBLE CONFIRMATION DIALOG ====
export const DoubleConfirmDialog: React.FC<{
  title: string;
  desc: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  danger?: boolean;
}> = ({ title, desc, onClose, onConfirm, confirmText = "Confirm", danger = true }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-center"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
        <ShieldAlert size={24} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer"
        >
          Nevermind
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            danger
              ? 'bg-red-500 text-white hover:bg-red-400 shadow-md shadow-red-500/20'
              : 'bg-primary-500 text-black hover:bg-primary-400'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </motion.div>
  </div>
);
