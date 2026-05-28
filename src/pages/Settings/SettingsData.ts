export interface SettingsData {
  // Profile
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
  designation: string;
  timezone: string;
  language: string;
  bio: string;
  avatarUrl: string;

  // Appearance
  theme: 'dark' | 'light' | 'system';
  layoutDensity: 'compact' | 'comfortable';
  sidebarCollapsed: boolean;
  accentColor: 'teal' | 'blue' | 'purple' | 'amber' | 'emerald' | 'rose';
  fontSize: 'small' | 'medium' | 'large';

  // Productivity
  workSessionDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  autoStartBreak: boolean;
  autoStartNextSession: boolean;
  enableFocusMode: boolean;
  enableDeepWorkMode: boolean;

  // Task Settings
  defaultTaskPriority: 'low' | 'medium' | 'high';
  autoSortTasks: boolean;
  enableTaskCategories: boolean;
  enableTaskLabels: boolean;
  enableDueDates: boolean;
  enableRecurringTasks: boolean;
  completedTaskArchivePeriod: '1' | '7' | '30' | 'never';
  sortBy: 'dueDate' | 'priority' | 'createdAt';

  // Calendar
  weekStartsOn: 'sunday' | 'monday' | 'saturday';
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  meetingBufferTime: number;
  eventReminderTiming: number;
  calendarView: 'day' | 'week' | 'month';

  // Reminders & Alerts
  enableInAppReminders: boolean;
  enableSoundAlerts: boolean;
  enableVibrationAlerts: boolean;
  reminderVolume: number;
  reminderLeadTime: number;
  reminderTypes: {
    task: boolean;
    meeting: boolean;
    break: boolean;
    goal: boolean;
  };

  // Focus Mode
  enableFocusSessions: boolean;
  blockDistractions: boolean;
  autoSilenceAlerts: boolean;
  focusSessionGoalTracking: boolean;
  customFocusBackgroundSound: 'none' | 'rain' | 'ocean' | 'forest' | 'white-noise' | 'cafe';

  // Security
  pinLockEnabled: boolean;
  appLockEnabled: boolean;
  sessionTimeout: number;
  rememberLogin: boolean;
  twoFactorEnabled: boolean;

  // Privacy
  profileVisibility: 'public' | 'private' | 'organization';
  activityVisibility: 'public' | 'private' | 'organization';
  productivitySharing: boolean;
  analyticsCollection: boolean;
  anonymousStatistics: boolean;

  // AI Assistant
  enableAISuggestions: boolean;
  smartScheduling: boolean;
  taskPrioritization: boolean;
  productivityInsights: boolean;
  dailyRecommendations: boolean;
  weeklyReports: boolean;

  // Reports
  generateDailyReport: boolean;
  weeklySummaryEmail: boolean;
  monthlyProductivityReport: boolean;
  goalTrackingDashboard: boolean;

  // Accessibility
  highContrastMode: boolean;
  largerText: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;

  // Backwards Compatibility for Old Alarms
  activityNotifications: boolean;
  reminderNotifications: boolean;
  alarmSounds: boolean;
  vibration: boolean;
  persistentAlerts: boolean;
  selectedAlarmSound: string;

  // New Smart Alarm & Voice Reminder Suite
  enableVoiceReminders: boolean;
  enableTaskNameAnnouncement: boolean;
  enableDurationAnnouncement: boolean;
  enableStartTimeAnnouncement: boolean;
  repeatVoiceReminder: boolean;
  voiceSpeed: number;
  voiceVolume: number;
  voiceSelection: 'male' | 'female' | 'system';

  enableAlarm: boolean;
  alarmVolume: number;
  alarmDuration: number;
  repeatAlarm: boolean;
}

export const DEFAULT_SETTINGS: SettingsData = {
  fullName: "Avery Sterling",
  email: "avery@example.com",
  employeeId: "TM-2049",
  department: "Product Engineering",
  designation: "Lead Systems Architect",
  timezone: "Etc/UTC",
  language: "English (US)",
  bio: "Designing clean schedules for optimal human performance.",
  avatarUrl: "api.dicebear.com/7.x/bottts/svg?seed=Avery",

  theme: 'dark',
  layoutDensity: 'comfortable',
  sidebarCollapsed: false,
  accentColor: 'teal',
  fontSize: 'medium',

  workSessionDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  dailyGoal: 8,
  weeklyGoal: 40,
  monthlyGoal: 160,
  autoStartBreak: true,
  autoStartNextSession: false,
  enableFocusMode: true,
  enableDeepWorkMode: false,

  defaultTaskPriority: 'medium',
  autoSortTasks: true,
  enableTaskCategories: true,
  enableTaskLabels: true,
  enableDueDates: true,
  enableRecurringTasks: true,
  completedTaskArchivePeriod: '7',
  sortBy: 'dueDate',

  weekStartsOn: 'monday',
  workingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  meetingBufferTime: 10,
  eventReminderTiming: 5,
  calendarView: 'week',

  enableInAppReminders: true,
  enableSoundAlerts: true,
  enableVibrationAlerts: true,
  reminderVolume: 75,
  reminderLeadTime: 5,
  reminderTypes: {
    task: true,
    meeting: true,
    break: true,
    goal: false
  },

  enableFocusSessions: true,
  blockDistractions: true,
  autoSilenceAlerts: true,
  focusSessionGoalTracking: true,
  customFocusBackgroundSound: 'none',

  pinLockEnabled: false,
  appLockEnabled: false,
  sessionTimeout: 15,
  rememberLogin: true,
  twoFactorEnabled: false,

  profileVisibility: 'organization',
  activityVisibility: 'private',
  productivitySharing: true,
  analyticsCollection: true,
  anonymousStatistics: true,

  enableAISuggestions: true,
  smartScheduling: true,
  taskPrioritization: true,
  productivityInsights: true,
  dailyRecommendations: true,
  weeklyReports: true,

  generateDailyReport: true,
  weeklySummaryEmail: true,
  monthlyProductivityReport: true,
  goalTrackingDashboard: true,

  highContrastMode: false,
  largerText: false,
  reducedMotion: false,
  keyboardNavigation: false,
  screenReaderSupport: false,

  activityNotifications: true,
  reminderNotifications: true,
  alarmSounds: true,
  vibration: true,
  persistentAlerts: true,
  selectedAlarmSound: 'Classic Alarm',

  // New Smart Alarm & Voice Reminder Default Values
  enableVoiceReminders: true,
  enableTaskNameAnnouncement: true,
  enableDurationAnnouncement: true,
  enableStartTimeAnnouncement: true,
  repeatVoiceReminder: false,
  voiceSpeed: 1.0,
  voiceVolume: 80,
  voiceSelection: 'system',

  enableAlarm: true,
  alarmVolume: 75,
  alarmDuration: 30,
  repeatAlarm: true
};

export const ACCENT_COLORS = {
  teal: { color400: '#2dd4bf', color500: '#14b8a6', color600: '#0d9488', glow: 'rgba(45, 212, 191, 0.2)', name: 'Cosmic Teal' },
  blue: { color400: '#3b82f6', color500: '#1d4ed8', color600: '#1e3a8a', glow: 'rgba(59, 130, 246, 0.2)', name: 'Hydra Blue' },
  purple: { color400: '#d946ef', color500: '#a855f7', color600: '#7e22ce', glow: 'rgba(217, 70, 239, 0.2)', name: 'Pulsar Purple' },
  amber: { color400: '#f59e0b', color500: '#b45309', color600: '#78350f', glow: 'rgba(245, 158, 11, 0.2)', name: 'Solar Amber' },
  emerald: { color400: '#10b981', color500: '#047857', color600: '#064e3b', glow: 'rgba(16, 185, 129, 0.2)', name: 'Bio Emerald' },
  rose: { color400: '#f43f5e', color500: '#be123c', color600: '#881337', glow: 'rgba(244, 63, 94, 0.2)', name: 'Nebula Rose' },
};

export const AVATAR_SEEDS = [
  "Avery", "Nova", "Cosmo", "Astro", "Matrix", "Neo", "Pixel", "Atlas", "Zelda", "Vortex"
];

export class AmbientFocusSoundPlayer {
  private ctx: AudioContext | null = null;
  private source: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: string | null = null;

  start(soundType: 'rain' | 'ocean' | 'forest' | 'white-noise' | 'cafe') {
    this.stop();
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = this.ctx;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.connect(ctx.destination);
      this.gainNode = gain;

      if (soundType === 'white-noise') {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.connect(gain);
        whiteNoise.start();
        this.source = whiteNoise;
      } else if (soundType === 'rain') {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 4.5;
        }
        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        rainSource.connect(filter);
        filter.connect(gain);
        rainSource.start();
        this.source = rainSource;
      } else if (soundType === 'ocean') {
        const bufferSize = 4 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const oceanSource = ctx.createBufferSource();
        oceanSource.buffer = noiseBuffer;
        oceanSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(150, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        oceanSource.connect(filter);
        filter.connect(gain);
        oceanSource.start();
        this.source = oceanSource;
      } else if (soundType === 'forest') {
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(320, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, ctx.currentTime);

        oscillator.connect(filter);
        filter.connect(gain);
        oscillator.start();
        this.source = oscillator;

        const interval = setInterval(() => {
          if (ctx.state === 'running') {
            try {
              const bOsc = ctx.createOscillator();
              const bGain = ctx.createGain();
              bOsc.type = 'sine';
              bOsc.frequency.setValueAtTime(1800 + Math.random() * 400, ctx.currentTime);
              bOsc.frequency.exponentialRampToValueAtTime(2400 + Math.random() * 400, ctx.currentTime + 0.35);

              bGain.gain.setValueAtTime(0.015, ctx.currentTime);
              bGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);

              bOsc.connect(bGain);
              bGain.connect(ctx.destination);
              bOsc.start();
              bOsc.stop(ctx.currentTime + 0.4);
            } catch (e) {}
          }
        }, 3000);

        (this as any).birdInterval = interval;
      } else if (soundType === 'cafe') {
        const oscillator = ctx.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(130, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(80, ctx.currentTime);

        oscillator.connect(filter);
        filter.connect(gain);
        oscillator.start();
        this.source = oscillator;

        const interval = setInterval(() => {
          if (ctx.state === 'running') {
            try {
              const cOsc = ctx.createOscillator();
              const cGain = ctx.createGain();
              cOsc.type = 'sine';
              cOsc.frequency.setValueAtTime(2200 + Math.random() * 300, ctx.currentTime);

              cGain.gain.setValueAtTime(0.008, ctx.currentTime);
              cGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);

              cOsc.connect(cGain);
              cGain.connect(ctx.destination);
              cOsc.start();
              cOsc.stop(ctx.currentTime + 0.15);
            } catch (e) {}
          }
        }, 2200);

        (this as any).cafeInterval = interval;
      }
      this.isPlaying = soundType;
    } catch (err) {
      console.warn("Ambient synthetic audio could not run block", err);
    }
  }

  stop() {
    if ((this as any).birdInterval) {
      clearInterval((this as any).birdInterval);
      (this as any).birdInterval = null;
    }
    if ((this as any).cafeInterval) {
      clearInterval((this as any).cafeInterval);
      (this as any).cafeInterval = null;
    }
    if (this.source) {
      try {
        (this.source as any).stop();
      } catch (e) {}
      this.source = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
    this.isPlaying = null;
  }

  getPlaying() {
    return this.isPlaying;
  }
}
