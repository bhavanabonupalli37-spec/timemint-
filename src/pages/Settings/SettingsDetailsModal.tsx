import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, History, User, Info, Check, RotateCcw } from 'lucide-react';
import { SettingsData } from './SettingsData';
import { SettingRegistryItem } from './SettingsRegistry';

interface SettingsDetailsModalProps {
  item: SettingRegistryItem;
  currentValue: any;
  userFullName: string;
  onClose: () => void;
  onRestoreDefault: (id: string) => void;
}

export const SettingsDetailsModal: React.FC<SettingsDetailsModalProps> = ({
  item,
  currentValue,
  userFullName,
  onClose,
  onRestoreDefault
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  // Beautify value representation
  const formatFriendlyValue = (val: any) => {
    if (typeof val === 'boolean') {
      return val ? 'Enabled (Active)' : 'Disabled (Inactive)';
    }
    if (typeof val === 'number') {
      if (item.id.toString().includes('Volume')) return `${val}% Volume Output`;
      if (item.id.toString().includes('Duration') || item.id.toString().includes('time') || item.id.toString().includes('Time')) return `${val} Minutes`;
      if (item.id.toString().includes('Goal')) return `${val} Hours Target`;
      return `${val} Units`;
    }
    if (typeof val === 'string') {
      return val.charAt(0).toUpperCase() + val.slice(1);
    }
    return JSON.stringify(val);
  };

  const handleCommitReset = () => {
    onRestoreDefault(item.id);
    setShowConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-slate-900/40">
          <h3 className="text-sm font-black text-slate-300 flex items-center gap-2 uppercase tracking-wider">
            <Info size={14} className="text-primary-400" />
            Workspace Node Specifications
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-300">
          <div className="space-y-1">
            <h4 className="text-white text-base font-extrabold tracking-tight">{item.name}</h4>
            <p className="text-slate-400 leading-relaxed font-semibold">{item.desc}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 font-medium">
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Status Value</span>
              <p className="text-white font-extrabold font-mono text-sm">{formatFriendlyValue(currentValue)}</p>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">System Default</span>
              <p className="text-slate-400 font-bold font-mono text-xs">{item.systemDefaultLabel}</p>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block flex items-center gap-1">
                <History size={10} className="text-primary-400" />
                Last Modified
              </span>
              <p className="text-white font-mono text-xs">Today, 10:25 AM</p>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block flex items-center gap-1">
                <User size={10} className="text-primary-400" />
                User Modified By
              </span>
              <p className="text-white font-mono text-xs truncate capitalize">{userFullName || 'Avery Sterling'}</p>
            </div>
          </div>

          <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex items-start gap-2 text-[11px] leading-relaxed text-blue-300">
            <Info size={14} className="shrink-0 mt-0.5" />
            <p>
              This is a standard system specification. All live adjustments persist instantly across the browser session and sync safely to your Firestore cluster profile cache.
            </p>
          </div>

          <div className="pt-2 flex justify-between gap-3">
            <button
              onClick={() => setShowConfirm(true)}
              className="py-2.5 px-4 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-xl font-bold transition-all border border-red-950/20 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={12} />
              Restore Default
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-6 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-black transition-all border border-white/5 cursor-pointer ml-auto"
            >
              Dismiss Specs
            </button>
          </div>
        </div>

        {/* Double confirmation drawer inside the details modal */}
        <AnimatePresence>
          {showConfirm && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-55 flex flex-col justify-center items-center p-6 space-y-4 text-center">
              <div className="bg-red-500/10 text-red-400 p-2.5 rounded-full border border-red-500/20">
                <ShieldAlert size={26} />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-white font-black text-sm uppercase tracking-wide">Reset Parameter Override?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you absolutely sure you want to restore "{item.name}" to its production setting default ({item.systemDefaultLabel})? Any current customization will be discarded.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2 w-full max-w-xs">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 bg-white/5 text-slate-300 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommitReset}
                  className="flex-1 py-1.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer"
                >
                  Reset Option
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
