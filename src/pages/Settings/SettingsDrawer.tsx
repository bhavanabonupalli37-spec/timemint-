import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Play, Volume2, ShieldCheck, HelpCircle, 
  Sparkles, Vibrate, Zap, Bell, Clock, Award, Info, 
  Eye, Heart, Settings as SettingsIcon, Star, 
  CheckCircle, MessageSquare
} from 'lucide-react';
import { SettingsData } from './SettingsData';
import { SettingRegistryItem } from './SettingsRegistry';

interface SettingsDrawerProps {
  item: SettingRegistryItem;
  settings: SettingsData;
  setSettingValue: (key: any, val: any) => void;
  toggleSetting: (key: any) => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onClose: () => void;
  playSynthSoundPreview: (soundName: string, volPercentage: number) => void;
  isInline?: boolean;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  item,
  settings,
  setSettingValue,
  toggleSetting,
  triggerToast,
  onClose,
  playSynthSoundPreview,
  isInline = false
}) => {
  // Local state for interactive components
  const [favoriteSounds, setFavoriteSounds] = useState<string[]>(['Soft Chime', 'Digital Beep']);
  const [hapticPresStrength, setHapticPresStrength] = useState<'light' | 'medium' | 'strong'>('medium');
  const [isVibrating, setIsVibrating] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  
  // Dynamic audio jumper bars
  const [meterHeights, setMeterHeights] = useState<number[]>([15, 30, 20, 45, 12, 18, 40, 25, 35, 16, 22, 10]);
  const meterIntervalRef = useRef<any>(null);

  // Dynamic States for Float Toasts
  const [toastPos, setToastPos] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>(() => {
    return (localStorage.getItem('timemint_toast_position') as any) || 'bottom-right';
  });
  const [toastDur, setToastDur] = useState<number>(() => {
    return parseInt(localStorage.getItem('timemint_toast_duration') || '5', 10);
  });

  // Dynamic States for Banners
  const [banStyle, setBanStyle] = useState<'standard' | 'glass' | 'minimal' | 'bold'>('standard');
  const [banPriority, setBanPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [banAutoClose, setBanAutoClose] = useState(true);

  // Channels sub-states
  const [meetingSnooze, setMeetingSnooze] = useState<number>(5);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Slide-Volume Meter trigger
  const triggerAudioVisualizer = () => {
    if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
    let count = 0;
    meterIntervalRef.current = setInterval(() => {
      setMeterHeights(Array.from({ length: 12 }, () => Math.floor(Math.random() * 45) + 5));
      count++;
      if (count > 8) {
        clearInterval(meterIntervalRef.current);
        setMeterHeights([10, 15, 10, 15, 8, 12, 10, 8, 12, 10, 12, 10]);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
    };
  }, []);

  const handleFavoriteSound = (sound: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteSounds.includes(sound)) {
      setFavoriteSounds(favoriteSounds.filter(s => s !== sound));
      triggerToast(`Removed ${sound} from favorites.`);
    } else {
      setFavoriteSounds([...favoriteSounds, sound]);
      triggerToast(`Added ${sound} to favorites!`);
    }
  };

  // Test Beacon emitter
  const handleLaunchBeaconTest = () => {
    setTestSuccess(false);
    triggerToast("Initiating system testing beacon flow...", "info");
    
    // Simulate haptic buzz
    if ("vibrate" in navigator && settings.enableVibrationAlerts) {
      navigator.vibrate([100, 50, 100]);
    }

    // Play active chime synthesizer
    playSynthSoundPreview(settings.selectedAlarmSound || 'Classic Alarm', settings.reminderVolume);

    // Dynamic toast trigger
    setTimeout(() => {
      triggerToast("✓ TimeMint Test Alert Diagnostic: Connection Successful! Audio Chimes synthesizer, haptic drivers, and visual layers active.", "success");
      setTestSuccess(true);
    }, 700);
  };

  const handleHapticTest = () => {
    setIsVibrating(true);
    const pattern = hapticPresStrength === 'strong' ? [300, 100, 300, 100, 400] : hapticPresStrength === 'medium' ? [150, 50, 150] : [80];
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
    setTimeout(() => {
      setIsVibrating(false);
      triggerToast(`Fired ${hapticPresStrength} haptic pulse sequence completely!`);
    }, 600);
  };

  const handleToastSave = (pos: any, dur: number) => {
    setToastPos(pos);
    setToastDur(dur);
    localStorage.setItem('timemint_toast_position', pos);
    localStorage.setItem('timemint_toast_duration', String(dur));
    triggerToast(`Toasts position saved to [${pos}] with duration [${dur}s]`);
  };

  const handlePreviewToastMockup = () => {
    triggerToast(`Trial Floating Toast Alert Success! Dynamic Position: ${toastPos.toUpperCase()}, Duration: ${toastDur}s.`);
  };

  return (
    <div 
      className={isInline 
        ? "w-full mt-3.5 p-5 bg-slate-950/40 border border-white/10 rounded-2xl space-y-4 relative z-10 cursor-default"
        : "fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden"
      }
      onClick={isInline ? e => e.stopPropagation() : undefined}
    >
      
      {/* Header */}
      {!isInline && (
        <div className="p-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center relative z-10 shrink-0">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest font-black text-slate-500 font-mono">Configuration Control</span>
            <h3 className="text-white text-base font-extrabold flex items-center gap-2">
              <SettingsIcon className="text-primary-400 rotate-45" size={16} />
              {item.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Drawer Scrollable Content */}
      <div className={isInline ? "space-y-5" : "flex-1 p-6 overflow-y-auto space-y-6 text-xs text-slate-300 relative z-10"}>
        
        {/* Floating Toasts Position & Preview Configuration */}
        {item.configType === 'toast-config' && (
          <div className="space-y-5">
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
              <label className="text-[10px] uppercase font-bold text-slate-400">Corner Screen Position</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { pos: 'top-left', label: 'Top Left Angle' },
                  { pos: 'top-right', label: 'Top Right Angle' },
                  { pos: 'bottom-left', label: 'Bottom Left Angle' },
                  { pos: 'bottom-right', label: 'Bottom Right Angle' }
                ].map(p => (
                  <button
                    key={p.pos}
                    onClick={() => handleToastSave(p.pos as any, toastDur)}
                    className={`p-3 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${toastPos === p.pos ? 'border-primary-400 bg-primary-500/10 text-primary-400' : 'border-white/5 bg-transparent text-slate-400 hover:text-white'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
              <label className="text-[10px] uppercase font-bold text-slate-400">Popup Hold Duration</label>
              <div className="flex gap-2">
                {[3, 5, 10].map(seconds => (
                  <button
                    key={seconds}
                    onClick={() => handleToastSave(toastPos, seconds)}
                    className={`flex-1 py-2.5 rounded-lg border text-[11px] font-black cursor-pointer transition-all ${toastDur === seconds ? 'bg-primary-500 text-black border-primary-500' : 'border-white/5 text-slate-400 hover:text-white'}`}
                  >
                    {seconds} seconds
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
              <p className="text-slate-400 text-[11px]">Test how your corner alert floating toast prompts behave with immediate sandbox preview:</p>
              <button
                onClick={handlePreviewToastMockup}
                className="w-full py-3 bg-primary-500 hover:bg-primary-400 text-black rounded-xl font-bold cursor-pointer transition-colors"
              >
                Preview Toast Notification
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Banners Setup */}
        {(item.configType === 'banner-config' || item.id === 'enableInAppReminders') && item.configType !== 'toast-config' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5 font-bold">
              <div>
                <p className="text-white">Display Welcome Banners</p>
                <p className="text-[10px] text-slate-500">Show tips in calendar grids</p>
              </div>
              <button 
                onClick={() => toggleSetting('enableInAppReminders')}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${settings.enableInAppReminders ? 'bg-primary-500' : 'bg-slate-800'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all ${settings.enableInAppReminders ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
              <label className="text-[10px] uppercase font-bold text-slate-500">Banner Frame Styling</label>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {['standard', 'glass', 'minimal', 'bold'].map(style => (
                  <button
                    key={style}
                    onClick={() => { setBanStyle(style as any); triggerToast(`Style shifted to ${style}.`); }}
                    className={`p-2 rounded-xl text-left border uppercase font-bold transition-all ${banStyle === style ? 'border-primary-400 bg-primary-500/15 text-primary-400' : 'border-white/5 text-slate-400 hover:text-white'}`}
                  >
                    {style} Theme style
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
              <label className="text-[10px] uppercase font-bold text-slate-500">Banner Intrusiveness</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setBanPriority(lvl as any)}
                    className={`flex-1 py-1.5 rounded-lg border uppercase font-bold text-[9px] cursor-pointer transition-all ${banPriority === lvl ? 'bg-slate-800 border-primary-500 text-primary-400' : 'border-white/5 text-slate-400 hover:text-white'}`}
                  >
                    {lvl} level
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2 flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-400">Auto Dismiss After 8s</span>
              <input 
                type="checkbox" 
                checked={banAutoClose} 
                onChange={(e) => setBanAutoClose(e.target.checked)}
                className="rounded bg-slate-950 border-white/10 text-primary-400 focus:ring-0 cursor-pointer"
              />
            </div>

            <button
              onClick={() => triggerToast(`Banner Trial triggered at workspace top! Style: [${banStyle}], Priority: [${banPriority}]`)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl border border-white/5 font-extrabold cursor-pointer"
            >
              Preview Banner Layout
            </button>
          </div>
        )}

        {/* Synthesized Sound Beeps Library Selection */}
        {item.configType === 'sound-library' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Below are real-time synthesizer pitch progressions mapped inside our audio context. Star your favorite soundboard tunes to earmark them:
            </p>

            <div className="space-y-2">
              {[
                { id: 'Classic Alarm', desc: 'Square wave frequency pattern' },
                { id: 'Digital Beep', desc: 'Oscillating electronic sine pulse' },
                { id: 'Gentle Bell', desc: 'Polyphonic harmonic bells ring style' },
                { id: 'Soft Chime', desc: 'Magical frequency sweep cascade' },
                { id: 'Success Tone', desc: 'Triangle wave progress chord progression' },
                { id: 'Notification Ping', desc: 'Short high-frequency electronic ping' }
              ].map(sound => {
                const isSelected = settings.selectedAlarmSound === sound.id;
                const isFav = favoriteSounds.includes(sound.id);
                return (
                  <div
                    key={sound.id}
                    onClick={() => {
                      setSettingValue('selectedAlarmSound', sound.id);
                      playSynthSoundPreview(sound.id, settings.reminderVolume);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between ${isSelected ? 'bg-primary-500/10 border-primary-500 text-white shadow-md' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
                  >
                    <div>
                      <p className="font-extrabold text-xs">{sound.id}</p>
                      <p className="text-[9px] text-slate-500 font-semibold">{sound.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => playSynthSoundPreview(sound.id, settings.reminderVolume)}
                        className="p-1.5 bg-slate-950/40 rounded-lg text-slate-400 hover:text-primary-400 transition-colors cursor-pointer"
                        title="Play trial"
                      >
                        <Play size={10} />
                      </button>
                      <button
                        onClick={(e) => handleFavoriteSound(sound.id, e)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isFav ? 'text-rose-400 hover:text-rose-300' : 'text-slate-600 hover:text-white'}`}
                        title="Favorite"
                      >
                        <Heart size={10} fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => playSynthSoundPreview(settings.selectedAlarmSound || 'Classic Alarm', settings.reminderVolume)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-white rounded-xl border border-white/5 font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Volume2 size={13} className="text-primary-400" />
              Listen to Chosen Default Selected
            </button>
          </div>
        )}

        {/* Device Vibration Haptic Presets & Checker */}
        {item.configType === 'vibration-picker' && (
          <div className="space-y-4">
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="font-bold text-white">Vibrator Bridge Diagnostic</h4>
                <p className="text-[10px] text-slate-500">Physical haptic motor availability</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black border uppercase tracking-widest ${("vibrate" in navigator) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'}`}>
                {("vibrate" in navigator) ? 'Supported Device' : 'Compatible Simulator'}
              </span>
            </div>

            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
              <label className="text-[10px] uppercase font-bold text-slate-400">Vibration Pulse Intensity</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'Light Tick', desc: '80ms beat' },
                  { id: 'medium', label: 'Medium Double', desc: 'Double pulse' },
                  { id: 'strong', label: 'Triple Alarm', desc: 'Major vibration' }
                ].map(pre => (
                  <button
                    key={pre.id}
                    onClick={() => { setHapticPresStrength(pre.id as any); triggerToast(`Strength adjusted to [${pre.id}]`); }}
                    className={`p-3 rounded-xl text-center border cursor-pointer transition-all ${hapticPresStrength === pre.id ? 'border-primary-400 bg-primary-500/10 text-primary-400' : 'border-white/5 bg-transparent text-slate-400'}`}
                  >
                    <p className="font-extrabold text-[11px] leading-tight">{pre.label}</p>
                    <span className="text-[8px] text-slate-500 tracking-tight block">{pre.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleHapticTest}
              disabled={isVibrating}
              className={`w-full py-3 text-black rounded-xl font-bold cursor-pointer transition-all flex items-center justify-center gap-2 ${isVibrating ? 'bg-red-500 text-white' : 'bg-primary-500 hover:bg-primary-400'}`}
            >
              <Vibrate size={14} className={isVibrating ? 'animate-bounce' : ''} />
              {isVibrating ? 'Vibrating/Signaling Device...' : 'Test Haptic Pulses'}
            </button>
          </div>
        )}

        {/* Active System Alarm Tune Selection */}
        {item.configType === 'alarm-tune' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-mono">Master Ring Tone Choice</span>
                <p className="font-bold text-white truncate">{settings.selectedAlarmSound}</p>
              </div>
              <span className="text-[8px] font-extrabold uppercase font-mono tracking-widest text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">Selected</span>
            </div>

            <div className="space-y-2">
              {[
                { name: 'Classic Alarm', desc: 'Rhythmic double chime square waves' },
                { name: 'Sunrise Alarm', desc: 'Gentle low sweep ascending progression tone' },
                { name: 'Gentle Wake', desc: 'Fading bell tones chime series' },
                { name: 'Digital Ring', desc: 'Speedy electronic oscillation pings' },
                { name: 'Clock Bell', desc: 'Vintage deep brassy resonator bell' },
                { name: 'Focus Bell', desc: 'Calming low frequency hum sweep' }
              ].map(alarm => {
                const isChosen = settings.selectedAlarmSound === alarm.name;
                return (
                  <div
                    key={alarm.name}
                    onClick={() => {
                      setSettingValue('selectedAlarmSound', alarm.name);
                      playSynthSoundPreview(alarm.name, settings.reminderVolume);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isChosen ? 'border-primary-500 bg-primary-500/10 text-white font-extrabold' : 'border-white/5 bg-transparent hover:text-white text-slate-400'}`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{alarm.name}</h4>
                      <p className="text-[9px] text-slate-500 font-semibold">{alarm.desc}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSynthSoundPreview(alarm.name, settings.reminderVolume);
                      }}
                      className="p-1.5 bg-slate-950/40 rounded-lg hover:text-primary-400 transition-colors cursor-pointer text-slate-400"
                    >
                      <Play size={9} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Volume Output with visual equalizer bars */}
        {item.configType === 'volume-output' && (
          <div className="space-y-5">
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-400">Audio Volume Loudness</span>
                <span className="font-mono text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2.5 py-0.5 rounded text-xs">{settings.reminderVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.reminderVolume}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSettingValue('reminderVolume', val);
                  if (val % 5 === 0) {
                    playSynthSoundPreview(settings.selectedAlarmSound, val);
                    triggerAudioVisualizer();
                  }
                }}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>

            {/* Jump visualizer animation */}
            <div className="p-5 bg-black/30 rounded-2xl border border-white/5 flex flex-col items-center justify-center space-y-3.5 relative overflow-hidden h-32">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono font-black absolute top-3">Synthesizer Frequency Decibel Meter</span>
              <div className="flex items-end justify-center gap-1.5 h-12 w-full max-w-xs px-4 pt-4">
                {meterHeights.map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: h }}
                    transition={{ type: 'spring', sharpness: 50, damping: 5 }}
                    className={`w-2.5 rounded-t-sm ${i < 6 ? 'bg-primary-400' : 'bg-primary-600'}`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                playSynthSoundPreview(settings.selectedAlarmSound, settings.reminderVolume);
                triggerAudioVisualizer();
                triggerToast("Decibels diagnostics triggered successfully!");
              }}
              className="w-full py-3 bg-primary-500 hover:bg-primary-400 text-black rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Volume2 size={13} />
              Trigger Diagnostic Test Decibel Beep
            </button>
          </div>
        )}

        {/* Pre-Warn periods list selection */}
        {item.configType === 'prewarn-period' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-[11px] leading-relaxed">
              How early before an upcoming routine, meeting slot, or task target date should early alerts warn you? Choose your default:
            </p>

            <div className="grid grid-cols-1 gap-2 text-xs">
              {[
                { time: 1, label: '1 Minute warnings', desc: 'High momentum immediate warnings' },
                { time: 3, label: '3 Minutes warnings', desc: 'Standard brief warning periods' },
                { time: 5, label: '5 Minutes warnings', desc: 'Average preparation time selection' },
                { time: 10, label: '10 Minutes warnings', desc: 'Recommended meeting slot buffers' },
                { time: 15, label: '15 Minutes warnings', desc: 'Generous routine warnings' },
                { time: 30, label: '30 Minutes warnings', desc: 'Major block notification lead' },
                { time: 60, label: '1 Hour warnings', desc: 'Chronicles long-range timers early warn' }
              ].map(opt => {
                const isSelected = settings.reminderLeadTime === opt.time;
                return (
                  <div
                    key={opt.time}
                    onClick={() => {
                      setSettingValue('reminderLeadTime', opt.time);
                      triggerToast(`Warn time updated to: ${opt.label}`);
                    }}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'border-primary-500 bg-primary-500/10 text-white font-extrabold' : 'border-white/5 bg-transparent hover:text-white text-slate-400'}`}
                  >
                    <div>
                      <p className="text-xs text-white">{opt.label}</p>
                      <p className="text-[9px] text-slate-500">{opt.desc}</p>
                    </div>
                    {isSelected && <CheckCircle size={14} className="text-primary-400" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reminders Channels differentiation */}
        {item.configType === 'reminders-channels' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Establish individual configuration presets, sounds frequencies, and priorities across separate notification channels:
            </p>

            {/* Task checklists */}
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse" />
                  Task Checklists
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Custom Sound</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <div className="p-2.5 bg-slate-950/40 rounded-xl space-y-1">
                  <span className="text-slate-500">Urgency Standard</span>
                  <select
                    value={taskPriority}
                    onChange={(e) => { setTaskPriority(e.target.value as any); triggerToast("Priority changed."); }}
                    className="w-full bg-slate-900 border border-white/5 rounded py-1 px-1.5 text-white"
                  >
                    <option value="low">Low Level</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">Urgent Priority</option>
                  </select>
                </div>
                <div className="p-2.5 bg-slate-950/40 rounded-xl space-y-1 flex flex-col justify-between">
                  <span className="text-slate-500">Early Warn Trigger</span>
                  <p className="text-white">At session start</p>
                </div>
              </div>
            </div>

            {/* Meetings slots */}
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  Meetings Slots
                </span>
                <span className="text-[10px] text-primary-400 font-bold">5 Min warn defaults</span>
              </div>
              <div className="p-3 bg-slate-950/40 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400">Snooze Option Period</span>
                  <span className="text-primary-400">{meetingSnooze} mins</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 5, 10].map(m => (
                    <button
                      key={m}
                      onClick={() => { setMeetingSnooze(m); triggerToast(`Snooze set to ${m}m.`); }}
                      className={`flex-grow py-1 rounded border font-mono text-[9px] cursor-pointer transition-all ${meetingSnooze === m ? 'bg-primary-500 text-black border-transparent font-extrabold' : 'border-white/5 text-slate-500 hover:text-white'}`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Breaks & Rests */}
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex justify-between items-center text-xs font-bold">
              <div>
                <h4 className="text-white font-bold text-xs">Breaks Rest Warnings</h4>
                <p className="text-[10px] text-slate-500 leading-tight">Sound double bells when timers finish</p>
              </div>
              <button 
                onClick={() => setSettingValue('autoStartBreak', !settings.autoStartBreak)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${settings.autoStartBreak ? 'bg-primary-500' : 'bg-slate-800'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all ${settings.autoStartBreak ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Goal achievements */}
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex justify-between items-center text-xs font-bold">
              <div>
                <h4 className="text-white font-bold text-xs">Celebration Animation Displays</h4>
                <p className="text-[10px] text-slate-500 leading-tight">Launch confetti particles during milestone unlocks</p>
              </div>
              <button 
                onClick={() => toggleSetting('goalTrackingDashboard')}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${settings.goalTrackingDashboard ? 'bg-primary-500' : 'bg-slate-800'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all ${settings.goalTrackingDashboard ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Trigger Test Reminder Beacon */}
        {item.configType === 'test-beacon' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Launch an immediate diagnostic broadcast check. This tests in-app corner toasts, Web Audio synth tones, local logging registers, and vibration:
            </p>

            <button
              onClick={handleLaunchBeaconTest}
              className="w-full py-4.5 bg-primary-500 hover:bg-primary-400 text-black rounded-2xl font-black text-sm cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              FIRE DIAGNOSTICS BEACON
            </button>

            {testSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[11px] leading-relaxed md:flex items-center gap-2 font-semibold"
              >
                <CheckCircle size={18} className="shrink-0 text-emerald-400 animate-pulse" />
                <div>
                  <p className="font-extrabold text-[#10b981]">Diagnostics Validation Pass</p>
                  <p className="text-slate-400 font-mono text-[9px] mt-0.5">TimeMint System state healthy. Outputs dispatched into local registry loops successfully.</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* STANDARD FALLBACKS (sliders/enums for standard settings parameters) */}
        {!['toast-config', 'banner-config', 'sound-library', 'vibration-picker', 'alarm-tune', 'volume-output', 'prewarn-period', 'reminders-channels', 'test-beacon'].includes(item.configType) && (
          <div className="space-y-5">
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3.5">
              <label className="text-[10px] uppercase font-bold text-slate-400">Modify Current Selection</label>
              
              {/* String Selectors */}
              {item.type === 'enum' && (
                <div className="space-y-2">
                  <select
                    value={settings[item.id] as any}
                    onChange={(e) => {
                      setSettingValue(item.id, e.target.value);
                    }}
                    className="w-full bg-slate-950 text-white rounded-xl py-2.5 px-3 border border-white/10"
                  >
                    {item.id === 'theme' && (
                      <>
                        <option value="dark">Cosmic Dark Space</option>
                        <option value="light">Light Clean Theme</option>
                        <option value="system">Sync OS Criteria</option>
                      </>
                    )}
                    {item.id === 'accentColor' && (
                      <>
                        <option value="teal">Cosmic Teal</option>
                        <option value="blue">Hydra Blue</option>
                        <option value="purple">Pulsar Purple</option>
                        <option value="amber">Solar Amber</option>
                        <option value="emerald">Bio Emerald</option>
                        <option value="rose">Nebula Rose</option>
                      </>
                    )}
                    {item.id === 'layoutDensity' && (
                      <>
                        <option value="compact">Compact Interface Density</option>
                        <option value="comfortable">Comfortable Layout Padding</option>
                      </>
                    )}
                    {item.id === 'fontSize' && (
                      <>
                        <option value="small">Small Headers Size</option>
                        <option value="medium">Medium Standard Text</option>
                        <option value="large">Large Magnified Size</option>
                      </>
                    )}
                    {item.id === 'defaultTaskPriority' && (
                      <>
                        <option value="low">Low Urgency</option>
                        <option value="medium">Medium Urgency</option>
                        <option value="high">High Urgency</option>
                      </>
                    )}
                    {item.id === 'completedTaskArchivePeriod' && (
                      <>
                        <option value="1">After 1 Day</option>
                        <option value="7">After 7 Days</option>
                        <option value="30">After 30 Days</option>
                        <option value="never">Never Archive</option>
                      </>
                    )}
                    {item.id === 'sortBy' && (
                      <>
                        <option value="dueDate">Due Date Limit</option>
                        <option value="priority">Priority weight</option>
                        <option value="createdAt">Creation Time</option>
                      </>
                    )}
                    {item.id === 'weekStartsOn' && (
                      <>
                        <option value="sunday">Starts Sunday</option>
                        <option value="monday">Starts Monday</option>
                        <option value="saturday">Starts Saturday</option>
                      </>
                    )}
                    {item.id === 'calendarView' && (
                      <>
                        <option value="day">Day Plan List</option>
                        <option value="week">Week Overview Planner</option>
                        <option value="month">Month Grid Planner</option>
                      </>
                    )}
                    {item.id === 'profileVisibility' || item.id === 'activityVisibility' ? (
                      <>
                        <option value="public">Fully Public (Global Workspace)</option>
                        <option value="organization">Organization Nodes Only</option>
                        <option value="private">Strictly Private Cache</option>
                      </>
                    ) : null}
                    {item.id === 'customFocusBackgroundSound' && (
                      <>
                        <option value="none">None (Silence)</option>
                        <option value="rain">Gentle Rainstorm</option>
                        <option value="ocean">Ocean Tide Waves</option>
                        <option value="forest">Windy Woodlands</option>
                        <option value="white-noise">Steady White Noise</option>
                        <option value="cafe">Café Ambience</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Number/Slider triggers */}
              {item.type === 'number' && (
                <div className="space-y-3">
                  <div className="flex justify-between font-mono font-bold text-slate-400">
                    <span>Range limit bounds</span>
                    <span className="text-primary-400">
                      {settings[item.id] as any} {item.id.toString().includes('Duration') ? 'mins' : item.id.toString().includes('Goal') ? 'hours' : 'units'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={item.id.toString().includes('Goal') ? "1" : "5"}
                    max={item.id.toString().includes('monthlyGoal') ? "320" : item.id.toString().includes('weeklyGoal') ? "80" : item.id.toString().includes('dailyGoal') ? "24" : "120"}
                    value={settings[item.id] as any}
                    onChange={(e) => setSettingValue(item.id, parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-primary-500"
                  />
                </div>
              )}

              {item.type === 'boolean' && (
                <div className="flex items-center justify-between p-2 hover:bg-white/[0.01] rounded-xl transition-all">
                  <span className="text-white font-bold font-mono">Value: {settings[item.id] ? 'Enabled' : 'Disabled'}</span>
                  <button 
                    onClick={() => toggleSetting(item.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${settings[item.id] ? 'bg-primary-500' : 'bg-slate-800'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all ${settings[item.id] ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Footer reset button and actions */}
      <div className={isInline ? "pt-3 border-t border-white/5 flex justify-between items-center gap-2" : "p-6 border-t border-white/5 bg-slate-900/60 relative z-10 shrink-0 flex justify-between gap-3"}>
        <button
          onClick={() => {
            triggerToast("Option restored default factory parameter!");
            onClose();
          }}
          className={isInline 
            ? "px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-lg text-[9px] font-bold border border-red-950/10 transition-all cursor-pointer"
            : "px-5 py-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-xl font-bold transition-all border border-red-950/20 cursor-pointer"
          }
        >
          Restore Defaults
        </button>
        <button
          onClick={onClose}
          className={isInline 
            ? "px-4 py-1.5 bg-primary-500 hover:bg-primary-400 text-black font-extrabold rounded-lg text-[10px] transition-all cursor-pointer"
            : "px-6 py-2.5 bg-primary-500 hover:bg-primary-400 text-black font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-primary-500/10 ml-auto"
          }
        >
          {isInline ? "Done" : "Apply Config"}
        </button>
      </div>

      {/* Floating backdrop decoration */}
      {!isInline && (
        <div className="absolute inset-x-0 bottom-0 top-[60%] bg-gradient-to-t from-primary-500/5 to-transparent pointer-events-none z-0" />
      )}
    </div>
  );
};
