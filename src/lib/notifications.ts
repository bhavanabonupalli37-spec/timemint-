export const getNotificationPermissionStatus = () => {
  if (!("Notification" in window)) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  addLog("Permission request initiated...");
  if (!("Notification" in window)) {
    addLog("FAILED: Browser does not support Notifications.");
    alert("This browser does not support desktop notifications.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    addLog(`Permission result: ${permission}`);
    if (permission === 'denied') {
       alert("Notification permission denied. Please enable them in your browser settings to receive reminders.");
    } else if (permission === 'granted') {
       addLog("SUCCESS: Notifications authorized.");
    }
    return permission === "granted";
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    addLog(`ERROR: ${msg}`);
    console.error("Error requesting notification permission:", error);
    alert(`Could not request notifications: ${msg}`);
    return false;
  }
};

// Web Audio API Synthesizer
class WebAudioSynth {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;

  private resumeCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn("Context resume blocked", e));
    }
  }

  play(soundType: string, isStrong = false, customVolumePercent?: number) {
    this.stop();
    this.resumeCtx();
    if (!this.ctx) return;

    const settings = getV32Settings();
    const activeVolume = customVolumePercent !== undefined ? customVolumePercent : (settings.alarmVolume !== undefined ? settings.alarmVolume : 75);
    const volumeMultiplier = (activeVolume / 100) * 0.5; // Scale keep it clear and comfortable

    const playTone = (freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.5) => {
      if (!this.ctx || this.ctx.state === 'suspended') return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol * volumeMultiplier * 2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration - 0.02);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.error("Audio trigger failed", e);
      }
    };

    let step = 0;
    const rate = isStrong ? 220 : 350;

    const isClassic = soundType === 'Classic Alarm';
    const isDigital = soundType === 'Digital Alarm' || soundType === 'Digital Beep';
    const isBell = soundType === 'Soft Bell' || soundType === 'Gentle Bell';
    const isChime = soundType === 'Morning Chime' || soundType === 'Soft Chime';

    if (isClassic) {
      this.intervalId = setInterval(() => {
        const freq = step % 2 === 0 ? 980 : 780;
        playTone(freq, isStrong ? 0.15 : 0.22, 'square', isStrong ? 0.35 : 0.2);
        step++;
      }, rate);
    } else if (isDigital) {
      const intervalVal = isStrong ? 250 : 500;
      this.intervalId = setInterval(() => {
        playTone(1000, 0.12, 'sine', isStrong ? 0.45 : 0.25);
      }, intervalVal);
    } else if (isBell) {
      const playBell = () => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const freqs = isStrong ? [523.25, 659.25, 783.99, 1046.50] : [440, 554, 659, 880];
        freqs.forEach((f, idx) => {
          try {
            const osc = this.ctx!.createOscillator();
            const gainNode = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);
            gainNode.gain.setValueAtTime((idx === 0 ? (isStrong ? 0.35 : 0.2) : 0.08) * volumeMultiplier * 2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + (isStrong ? 1.0 : 1.6));
            osc.connect(gainNode);
            gainNode.connect(this.ctx!.destination);
            osc.start(now);
            osc.stop(now + 1.8);
          } catch (e) {}
        });
      };
      playBell();
      this.intervalId = setInterval(playBell, isStrong ? 1200 : 2000);
    } else if (isChime) {
      const playChime = () => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const freqs = [1500, 1800, 2100, 2700];
        freqs.forEach((f, idx) => {
          try {
            const osc = this.ctx!.createOscillator();
            const gainNode = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * (isStrong ? 0.03 : 0.06));
            gainNode.gain.setValueAtTime((isStrong ? 0.12 : 0.06) * volumeMultiplier * 2, now + idx * (isStrong ? 0.03 : 0.06));
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + idx * (isStrong ? 0.03 : 0.06));
            osc.connect(gainNode);
            gainNode.connect(this.ctx!.destination);
            osc.start(now + idx * (isStrong ? 0.03 : 0.06));
            osc.stop(now + 1.0);
          } catch (e) {}
        });
      };
      playChime();
      this.intervalId = setInterval(playChime, isStrong ? 800 : 1500);
    } else { // Focus Tone or Productivity Tone
      const playProd = () => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const chord = isStrong ? [523.25, 659.25, 783.99, 1046.50] : [329.63, 440.00, 523.25, 659.25];
        chord.forEach((f, idx) => {
          try {
            const osc = this.ctx!.createOscillator();
            const gainNode = this.ctx!.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + idx * 0.12);
            gainNode.gain.setValueAtTime((isStrong ? 0.2 : 0.1) * volumeMultiplier * 2, now + idx * 0.12);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + idx * 0.12);
            osc.connect(gainNode);
            gainNode.connect(this.ctx!.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + 1.1);
          } catch (e) {}
        });
      };
      playProd();
      this.intervalId = setInterval(playProd, isStrong ? 1200 : 2200);
    }
  }

  preview(soundType: string, customVolumePercent?: number) {
    this.stop();
    this.resumeCtx();
    if (!this.ctx) return;

    const settings = getV32Settings();
    const activeVolume = customVolumePercent !== undefined ? customVolumePercent : (settings.alarmVolume !== undefined ? settings.alarmVolume : 75);
    const volumeMultiplier = (activeVolume / 100) * 0.5;

    const playTone = (freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.5, startOffset = 0) => {
      if (!this.ctx || this.ctx.state === 'suspended') return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startOffset);
        gain.gain.setValueAtTime(vol * volumeMultiplier * 2, this.ctx.currentTime + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startOffset + duration - 0.02);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + startOffset);
        osc.stop(this.ctx.currentTime + startOffset + duration);
      } catch (e) {}
    };

    const isClassic = soundType === 'Classic Alarm';
    const isDigital = soundType === 'Digital Alarm' || soundType === 'Digital Beep';
    const isBell = soundType === 'Soft Bell' || soundType === 'Gentle Bell';
    const isChime = soundType === 'Morning Chime' || soundType === 'Soft Chime';

    if (isClassic) {
      playTone(880, 0.15, 'square', 0.15, 0);
      playTone(660, 0.15, 'square', 0.15, 0.2);
      playTone(880, 0.15, 'square', 0.15, 0.4);
    } else if (isDigital) {
      playTone(1000, 0.12, 'sine', 0.25, 0);
      playTone(1000, 0.12, 'sine', 0.25, 0.25);
    } else if (isBell) {
      const now = this.ctx.currentTime;
      [440, 554, 659].forEach((f, idx) => {
        try {
          const osc = this.ctx!.createOscillator();
          const gainNode = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          gainNode.gain.setValueAtTime((idx === 0 ? 0.25 : 0.06) * volumeMultiplier * 2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
          osc.connect(gainNode);
          gainNode.connect(this.ctx!.destination);
          osc.start(now);
          osc.stop(now + 1.3);
        } catch (e) {}
      });
    } else if (isChime) {
      const now = this.ctx.currentTime;
      [1500, 1800, 2100].forEach((f, idx) => {
        try {
          const osc = this.ctx!.createOscillator();
          const gainNode = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.05);
          gainNode.gain.setValueAtTime(0.06 * volumeMultiplier * 2, now + idx * 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + idx * 0.05);
          osc.connect(gainNode);
          gainNode.connect(this.ctx!.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + 0.8);
        } catch (e) {}
      });
    } else { // Focus Tone or Productivity Tone
      const now = this.ctx.currentTime;
      [329.63, 440.00, 523.25].forEach((f, idx) => {
        try {
          const osc = this.ctx!.createOscillator();
          const gainNode = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.1);
          gainNode.gain.setValueAtTime(0.12 * volumeMultiplier * 2, now + idx * 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + idx * 0.1);
          osc.connect(gainNode);
          gainNode.connect(this.ctx!.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + 0.7);
        } catch (e) {}
      });
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

const synth = new WebAudioSynth();

export interface NotificationSettingsInterface {
  activityNotifications: boolean;
  reminderNotifications: boolean;
  alarmSounds: boolean;
  vibration: boolean;
  persistentAlerts: boolean;
  selectedAlarmSound: string;
}

export const getV32Settings = () => {
  const saved = localStorage.getItem('timemint_settings_v32');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        // Voice / Audio Suite defaults
        enableVoiceReminders: parsed.enableVoiceReminders !== undefined ? parsed.enableVoiceReminders : true,
        enableTaskNameAnnouncement: parsed.enableTaskNameAnnouncement !== undefined ? parsed.enableTaskNameAnnouncement : true,
        enableDurationAnnouncement: parsed.enableDurationAnnouncement !== undefined ? parsed.enableDurationAnnouncement : true,
        enableStartTimeAnnouncement: parsed.enableStartTimeAnnouncement !== undefined ? parsed.enableStartTimeAnnouncement : true,
        repeatVoiceReminder: parsed.repeatVoiceReminder !== undefined ? parsed.repeatVoiceReminder : false,
        voiceSpeed: parsed.voiceSpeed !== undefined ? parsed.voiceSpeed : 1.0,
        voiceVolume: parsed.voiceVolume !== undefined ? parsed.voiceVolume : 80,
        voiceSelection: parsed.voiceSelection || 'system',

        enableAlarm: parsed.enableAlarm !== undefined ? parsed.enableAlarm : true,
        alarmVolume: parsed.alarmVolume !== undefined ? parsed.alarmVolume : 75,
        alarmDuration: parsed.alarmDuration !== undefined ? parsed.alarmDuration : 30,
        repeatAlarm: parsed.repeatAlarm !== undefined ? parsed.repeatAlarm : true,
        selectedAlarmSound: parsed.selectedAlarmSound || 'Classic Alarm',

        // Compatibility fallbacks
        activityNotifications: parsed.activityNotifications !== undefined ? parsed.activityNotifications : true,
        reminderNotifications: parsed.reminderNotifications !== undefined ? parsed.reminderNotifications : true,
        alarmSounds: parsed.alarmSounds !== undefined ? parsed.alarmSounds : true,
        vibration: parsed.vibration !== undefined ? parsed.vibration : true,
        persistentAlerts: parsed.persistentAlerts !== undefined ? parsed.persistentAlerts : true,
      };
    } catch (e) {}
  }
  return {
    enableVoiceReminders: true,
    enableTaskNameAnnouncement: true,
    enableDurationAnnouncement: true,
    enableStartTimeAnnouncement: true,
    repeatVoiceReminder: false,
    voiceSpeed: 1.0,
    voiceVolume: 80,
    voiceSelection: 'system' as const,

    enableAlarm: true,
    alarmVolume: 75,
    alarmDuration: 30,
    repeatAlarm: true,
    selectedAlarmSound: 'Classic Alarm',

    activityNotifications: true,
    reminderNotifications: true,
    alarmSounds: true,
    vibration: true,
    persistentAlerts: true,
  };
};

export const getSavedSettings = (): NotificationSettingsInterface => {
  const settings = getV32Settings();
  return {
    activityNotifications: settings.activityNotifications,
    reminderNotifications: settings.reminderNotifications,
    alarmSounds: settings.enableAlarm,
    vibration: settings.vibration,
    persistentAlerts: settings.persistentAlerts,
    selectedAlarmSound: settings.selectedAlarmSound
  };
};

export const saveSettings = (newSettings: NotificationSettingsInterface) => {
  const currentV32 = getV32Settings();
  const updated = {
    ...currentV32,
    ...newSettings,
    enableAlarm: newSettings.alarmSounds,
    selectedAlarmSound: newSettings.selectedAlarmSound
  };
  localStorage.setItem('timemint_settings_v32', JSON.stringify(updated));
  localStorage.setItem('timemint_settings', JSON.stringify(newSettings));
};

export const previewSound = (soundType: string, customVolumePercent?: number) => {
  addLog(`Previewing Sound: ${soundType}`);
  synth.preview(soundType, customVolumePercent);
};

// Vibration API
export const vibrateDevice = (pattern: number[]) => {
  const settings = getSavedSettings();
  if ("vibrate" in navigator && settings.vibration) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn("Vibration failed", e);
    }
  }
};

let activeAlarmTitle = "";
let alarmStateSubscribers: ((active: boolean, title?: string) => void)[] = [];
let alarmAutoStopTimeout: any = null;

export const triggerAlarm = (title: string, isStrong: boolean = false) => {
  const settings = getV32Settings();
  activeAlarmTitle = title;
  
  if (settings.enableAlarm) {
    synth.play(settings.selectedAlarmSound, isStrong, settings.alarmVolume);
    addLog(`Alarm active: "${title}" using ${settings.selectedAlarmSound} (${isStrong ? 'Strong' : 'Normal'})`);
  } else {
    addLog(`Alarm active (SILENT): "${title}"`);
  }

  const hasVibrate = settings.vibration !== undefined ? settings.vibration : true;
  if (hasVibrate) {
    vibrateDevice(isStrong ? [500, 200, 500, 200, 500] : [200, 100, 200]);
  }

  // Handle Alarm Duration limit automatically
  if (alarmAutoStopTimeout) {
    clearTimeout(alarmAutoStopTimeout);
    alarmAutoStopTimeout = null;
  }
  if (settings.alarmDuration && settings.alarmDuration > 0) {
    alarmAutoStopTimeout = setTimeout(() => {
      stopAlarm();
      addLog(`Alarm auto-silenced after configured threshold limit of ${settings.alarmDuration} seconds.`);
    }, settings.alarmDuration * 1000);
  }

  alarmStateSubscribers.forEach(sub => sub(true, title));
};

export const stopAlarm = () => {
  synth.stop();
  if (alarmAutoStopTimeout) {
    clearTimeout(alarmAutoStopTimeout);
    alarmAutoStopTimeout = null;
  }
  if (activeSnoozeTimeout) {
    clearTimeout(activeSnoozeTimeout);
    activeSnoozeTimeout = null;
  }
  snoozeTargetTime = null;
  addLog('Alarm stopped manually');
  alarmStateSubscribers.forEach(sub => sub(false));
};

export const subscribeToAlarmState = (callback: (active: boolean, title?: string) => void) => {
  alarmStateSubscribers.push(callback);
  callback(false, activeAlarmTitle);
  return () => {
    const index = alarmStateSubscribers.indexOf(callback);
    if (index > -1) alarmStateSubscribers.splice(index, 1);
  };
};

// Snooze Management
let activeSnoozeTimeout: any = null;
let snoozeTargetTime: number | null = null;

export const snoozeAlarm = (minutes: number = 1) => {
  synth.stop();
  if (activeSnoozeTimeout) {
    clearTimeout(activeSnoozeTimeout);
  }
  
  const label = activeAlarmTitle || "Snoozed Mission";
  addLog(`Alarm for "${label}" snoozed for ${minutes} minute(s)`);
  snoozeTargetTime = Date.now() + minutes * 60000;
  
  alarmStateSubscribers.forEach(sub => sub(false)); // Hide modal momentarily

  activeSnoozeTimeout = setTimeout(() => {
    addLog(`Snooze ended. Reactivating alarm for: ${label}`);
    triggerAlarm(label, true); // Play stronger alarm
    snoozeTargetTime = null;
  }, minutes * 60000);
};

export const getSnoozeTargetTime = () => snoozeTargetTime;
export const getSnoozeActivityTitle = () => activeAlarmTitle;

// Logs Management
const logs: string[] = [];
const logSubscribers: ((logs: string[]) => void)[] = [];

export const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const entry = `[${timestamp}] ${message}`;
  logs.unshift(entry);
  if (logs.length > 50) logs.pop();
  logSubscribers.forEach(sub => sub([...logs]));
};

export const subscribeToLogs = (callback: (logs: string[]) => void) => {
  logSubscribers.push(callback);
  callback([...logs]);
  return () => {
    const index = logSubscribers.indexOf(callback);
    if (index > -1) logSubscribers.splice(index, 1);
  };
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  const settings = getSavedSettings();

  const isAlarm = options?.tag === 'alarm';
  const isTest = options?.tag === 'test' || title.includes("Test") || title.includes("Diagnostic");

  if (!isTest) {
    if (isAlarm && !settings.activityNotifications) {
      addLog(`Blocked alarm notification by settings: ${title}`);
      return null;
    }
    if (!isAlarm && !settings.reminderNotifications) {
      addLog(`Blocked reminder notification by settings: ${title}`);
      return null;
    }
  }

  if (Notification.permission === "granted") {
    addLog(`Notification triggered: "${title}"`);
    const notification = new Notification(title, {
      icon: '/vite.svg',
      badge: '/vite.svg',
      body: options?.body,
      tag: options?.tag,
      requireInteraction: settings.persistentAlerts || options?.requireInteraction
    } as any);

    try {
      notification.onclick = (e) => {
        e.preventDefault();
        window.focus();
        addLog(`Notification clicked: "${title}"`);
      };
    } catch (err) {}

    if (isAlarm) {
      triggerAlarm(title, false);
    } else {
      if (settings.alarmSounds) {
        synth.preview('Soft Chime');
      }
    }

    if ("vibrate" in navigator && settings.vibration) {
      try {
        navigator.vibrate(isAlarm ? [500, 200, 500] : [120, 80]);
      } catch (e) {}
    }

    return notification;
  } else {
    addLog(`Visual notification fallback: ${title} - ${options?.body || ""}`);
    if (isAlarm) {
      triggerAlarm(title, false);
    } else {
      if (settings.alarmSounds) {
        synth.preview('Soft Chime');
      }
    }
  }
  return null;
};

// Timed 10s Countdown
let countdownInterval: any = null;
export const start10sCountdown = () => {
  if (countdownInterval) clearInterval(countdownInterval);
  addLog("10s Countdown Selected.");
  let seconds = 10;
  
  countdownInterval = setInterval(() => {
    if (seconds > 0) {
      addLog(`Countdown: ${seconds}...`);
      vibrateDevice([60]); // little countdown tick vibration
      seconds--;
    } else {
      clearInterval(countdownInterval);
      addLog("0! Countdown complete. Launching alarm.");
      sendNotification("10s TEST COMPLETE", {
        body: "Your timed mission trigger worked perfectly.",
        tag: 'alarm',
        requireInteraction: true
      });
    }
  }, 1000);
};

// Scheduler Triggers calculations
export interface ScheduledTrigger {
  id: string;
  activityId: string;
  activityName: string;
  activityTime: string;
  type: 'reminder_5' | 'alarm_2' | 'start_0';
  triggerTime: string;
  status: 'Scheduled' | 'Triggered' | 'Snoozed';
}

const getTriggerTime = (startTimeStr: string, offsetMins: number): string => {
  if (!startTimeStr) return "";
  const parts = startTimeStr.split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return startTimeStr;
  
  m -= offsetMins;
  while (m < 0) {
    m += 60;
    h -= 1;
  }
  while (h < 0) {
    h += 24;
  }
  
  const hStr = h < 10 ? '0' + h : String(h);
  const mStr = m < 10 ? '0' + m : String(m);
  return `${hStr}:${mStr}`;
};

export const getScheduledTriggers = (activities: any[], triggeredKeys: Set<string>): ScheduledTrigger[] => {
  const triggers: ScheduledTrigger[] = [];
  const todayDateStr = new Date().toDateString();

  // Sort activities by start time
  const sorted = [...activities].sort((a, b) => a.start.localeCompare(b.start));

  sorted.forEach(activity => {
    if (!activity.notificationsEnabled) return;

    // 1. 5-minute reminder
    const r5Time = getTriggerTime(activity.start, 5);
    const r5Key = `${activity.id}-reminder_5-${r5Time}-${todayDateStr}`;
    triggers.push({
      id: r5Key,
      activityId: activity.id,
      activityName: activity.name,
      activityTime: activity.start,
      type: 'reminder_5',
      triggerTime: r5Time,
      status: triggeredKeys.has(r5Key) ? 'Triggered' : 'Scheduled'
    });

    // 2. 2-minute alarm
    const a2Time = getTriggerTime(activity.start, 2);
    const a2Key = `${activity.id}-alarm_2-${a2Time}-${todayDateStr}`;
    triggers.push({
      id: a2Key,
      activityId: activity.id,
      activityName: activity.name,
      activityTime: activity.start,
      type: 'alarm_2',
      triggerTime: a2Time,
      status: triggeredKeys.has(a2Key) ? 'Triggered' : 'Scheduled'
    });

    // 3. Start-time alert
    const s0Time = getTriggerTime(activity.start, 0);
    const s0Key = `${activity.id}-start_0-${s0Time}-${todayDateStr}`;
    triggers.push({
      id: s0Key,
      activityId: activity.id,
      activityName: activity.name,
      activityTime: activity.start,
      type: 'start_0',
      triggerTime: s0Time,
      status: triggeredKeys.has(s0Key) ? 'Triggered' : 'Scheduled'
    });
  });

  return triggers;
};

export const speakAnnouncement = (text: string, options?: { voiceSelection?: 'male' | 'female' | 'system'; voiceSpeed?: number; voiceVolume?: number }) => {
  if (!('speechSynthesis' in window)) {
    addLog(`Speech synthesis unsupported in this browser.`);
    return;
  }
  const settings = getV32Settings();
  if (!settings.enableVoiceReminders) {
    addLog(`Voice announcement suppressed: "${text}"`);
    return;
  }

  const voiceSelection = options?.voiceSelection || settings.voiceSelection || 'system';
  const voiceSpeed = options?.voiceSpeed !== undefined ? options.voiceSpeed : (settings.voiceSpeed || 1.0);
  const voiceVolume = options?.voiceVolume !== undefined ? options.voiceVolume : (settings.voiceVolume || 80);

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = voiceVolume / 100;
    utterance.rate = voiceSpeed;

    const voices = window.speechSynthesis.getVoices();
    if (voiceSelection === 'male') {
      const maleVoice = voices.find(v => {
        const name = v.name.toLowerCase();
        return name.includes('male') || name.includes('david') || name.includes('microsoft david') || name.includes('google uk english male');
      });
      if (maleVoice) utterance.voice = maleVoice;
    } else if (voiceSelection === 'female') {
      const femaleVoice = voices.find(v => {
        const name = v.name.toLowerCase();
        return name.includes('female') || name.includes('zira') || name.includes('microsoft zira') || name.includes('google us english') || name.includes('google uk english female');
      });
      if (femaleVoice) utterance.voice = femaleVoice;
    }

    window.speechSynthesis.speak(utterance);
    addLog(`Speaking: "${text}" [Voice: ${voiceSelection}, Speed: ${voiceSpeed}, Vol: ${voiceVolume}%]`);
  } catch (e) {
    console.error("Speech Synthesis failed:", e);
  }
};

export const simulateTaskReminder = (stage: 'reminder_5' | 'alarm_2' | 'start_0', taskName = "Mathematics Lecture", startTime = "14:15", duration = 45) => {
  const settings = getV32Settings();
  addLog(`Simulating ${stage} event sequence immediately.`);

  if (stage === 'reminder_5') {
    sendNotification(`Upcoming Task in 5m: ${taskName}`, {
      body: `Starts at ${startTime} (Duration: ${duration} mins)`,
      tag: 'reminder',
      requireInteraction: false
    });

    let sentence = `Attention. Your next task is ${taskName}.`;
    if (!settings.enableTaskNameAnnouncement) sentence = "Attention. Your next task is approaching.";
    
    let timeText = `It will begin in 5 minutes at ${startTime}`;
    if (!settings.enableStartTimeAnnouncement) timeText = "It will begin in 5 minutes";

    let durationText = `and will continue for ${duration} minutes.`;
    if (!settings.enableDurationAnnouncement) durationText = "";

    const announcement = `${sentence} ${timeText} ${durationText} Please prepare to start your task.`.replace(/\s+/g, ' ').trim();
    speakAnnouncement(announcement);
    triggerAlarm(`${taskName} pre-warn alarm`, false);
  } else if (stage === 'alarm_2') {
    sendNotification(`Task Starts in 2m: ${taskName}`, {
      body: `Review preparation checklist.`,
      tag: 'reminder',
      requireInteraction: false
    });
    speakAnnouncement(`Reminder. Your task ${taskName} starts in 2 minutes.`);
  } else {
    sendNotification(`Task Now Starting: ${taskName}`, {
      body: `Your routine block is now active. Have a productive session!`,
      tag: 'alarm',
      requireInteraction: true
    });
    speakAnnouncement(`Your task ${taskName} is now starting. Duration ${duration} minutes. Have a productive session.`);
    triggerAlarm(`${taskName} starting alarm`, true);
  }
};
