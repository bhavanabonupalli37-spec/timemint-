export interface SettingRegistryItem {
  id: string;
  name: string;
  desc: string;
  iconName: string;
  tab: 'appearance' | 'productivity' | 'tasks' | 'calendar' | 'reminders' | 'focus' | 'security' | 'privacy' | 'ai' | 'reports' | 'accessibility';
  type: 'boolean' | 'enum' | 'number' | 'trigger';
  configType: string;
  systemDefaultLabel: string;
}

export const SETTINGS_REGISTRY: SettingRegistryItem[] = [
  // --- APPEARANCE ---
  {
    id: 'theme',
    name: 'Visual Theme',
    desc: 'Select your preferred visual mode: Cosmic Dark Space, Light Clean, or Sync with OS.',
    iconName: 'palette',
    tab: 'appearance',
    type: 'enum',
    configType: 'theme',
    systemDefaultLabel: 'Dark Space'
  },
  {
    id: 'accentColor',
    name: 'Accent Hue Matrix',
    desc: 'Choose primary neon glow lights for highlights, boundaries, and sliders.',
    iconName: 'zap',
    tab: 'appearance',
    type: 'enum',
    configType: 'accentColor',
    systemDefaultLabel: 'Cosmic Teal'
  },
  {
    id: 'layoutDensity',
    name: 'Layout Density',
    desc: 'Shift spacing from compact density for details, to comfortable for more room.',
    iconName: 'layers',
    tab: 'appearance',
    type: 'enum',
    configType: 'layoutDensity',
    systemDefaultLabel: 'Comfortable'
  },
  {
    id: 'fontSize',
    name: 'Font Size Hierarchy',
    desc: 'Modify scaling ranges for page text headings, paragraphs, and list elements.',
    iconName: 'activity',
    tab: 'appearance',
    type: 'enum',
    configType: 'fontSize',
    systemDefaultLabel: 'Medium'
  },
  {
    id: 'sidebarCollapsed',
    name: 'Sidebar Default Collapse',
    desc: 'Keep the main utility sidebar collapsed by default during routine loads.',
    iconName: 'eyeOff',
    tab: 'appearance',
    type: 'boolean',
    configType: 'sidebarCollapsed',
    systemDefaultLabel: 'Disabled'
  },

  // --- PRODUCTIVITY ---
  {
    id: 'workSessionDuration',
    name: 'Work Session Duration',
    desc: 'Set the minutes clock for active focus sessions before taking short rests.',
    iconName: 'flame',
    tab: 'productivity',
    type: 'number',
    configType: 'workSessionDuration',
    systemDefaultLabel: '25 minutes'
  },
  {
    id: 'breakDuration',
    name: 'Short Break Duration',
    desc: 'Configure short rest time between productive Pomodoro intervals.',
    iconName: 'clock',
    tab: 'productivity',
    type: 'number',
    configType: 'breakDuration',
    systemDefaultLabel: '5 minutes'
  },
  {
    id: 'longBreakDuration',
    name: 'Long Break Duration',
    desc: 'Configure major rest intervals following 4 continuous Pomodoro loops.',
    iconName: 'calendar',
    tab: 'productivity',
    type: 'number',
    configType: 'longBreakDuration',
    systemDefaultLabel: '15 minutes'
  },
  {
    id: 'dailyGoal',
    name: 'Daily Focus Goal',
    desc: 'Define aggregate cumulative session targets in productive hours per day.',
    iconName: 'award',
    tab: 'productivity',
    type: 'number',
    configType: 'dailyGoal',
    systemDefaultLabel: '8 hours'
  },
  {
    id: 'weeklyGoal',
    name: 'Weekly Target Goal',
    desc: 'Total objective target hours across the calendar weekly envelope.',
    iconName: 'barChart',
    tab: 'productivity',
    type: 'number',
    configType: 'weeklyGoal',
    systemDefaultLabel: '40 hours'
  },
  {
    id: 'monthlyGoal',
    name: 'Monthly Milestone Target',
    desc: 'Aggregated monthly focus hours objective stored in reports registry.',
    iconName: 'database',
    tab: 'productivity',
    type: 'number',
    configType: 'monthlyGoal',
    systemDefaultLabel: '160 hours'
  },
  {
    id: 'autoStartBreak',
    name: 'Auto-Start Rest Loops',
    desc: 'Instantly launch break countdowns when Pomodoro focus clocks end.',
    iconName: 'zap',
    tab: 'productivity',
    type: 'boolean',
    configType: 'autoStartBreak',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'autoStartNextSession',
    name: 'Auto-Start Focus Loops',
    desc: 'Cycle back to next work pomodoros automatically when rests finish.',
    iconName: 'zap',
    tab: 'productivity',
    type: 'boolean',
    configType: 'autoStartNextSession',
    systemDefaultLabel: 'Disabled'
  },
  {
    id: 'enableFocusMode',
    name: 'Enable Focus Mode Shield',
    desc: 'Suppress secondary browser alerts and in-app triggers during work.',
    iconName: 'lock',
    tab: 'productivity',
    type: 'boolean',
    configType: 'enableFocusMode',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'enableDeepWorkMode',
    name: 'Enable Deep Work Restrictions',
    desc: 'Lock edit screens and dashboards strictly to force absolute focus.',
    iconName: 'shieldCheck',
    tab: 'productivity',
    type: 'boolean',
    configType: 'enableDeepWorkMode',
    systemDefaultLabel: 'Disabled'
  },

  // --- TASK SETTINGS ---
  {
    id: 'defaultTaskPriority',
    name: 'Default Priority Level',
    desc: 'Standard initial urgency flag applied to newly logged checkboxes.',
    iconName: 'checkSquare',
    tab: 'tasks',
    type: 'enum',
    configType: 'defaultTaskPriority',
    systemDefaultLabel: 'Medium'
  },
  {
    id: 'autoSortTasks',
    name: 'Auto-Sort Priority Checklists',
    desc: 'Arrange tasks dynamically placing high priority and immediate due dates at top.',
    iconName: 'activity',
    tab: 'tasks',
    type: 'boolean',
    configType: 'autoSortTasks',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'enableTaskCategories',
    name: 'Enable Folder Segments',
    desc: 'Organize chores into categories like Engineering, Routine, Planning, Personal.',
    iconName: 'layers',
    tab: 'tasks',
    type: 'boolean',
    configType: 'enableTaskCategories',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'enableTaskLabels',
    name: 'Enable Color Labels',
    desc: 'Apply visual tags to search and group related list items.',
    iconName: 'palette',
    tab: 'tasks',
    type: 'boolean',
    configType: 'enableTaskLabels',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'enableDueDates',
    name: 'Due Dates Tracker',
    desc: 'Include deadline calendars and remaining time tags in items.',
    iconName: 'calendar',
    tab: 'tasks',
    type: 'boolean',
    configType: 'enableDueDates',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'enableRecurringTasks',
    name: 'Enable Recurring Tasks',
    desc: 'Automatically re-log repeating items on selective interval schedules.',
    iconName: 'clock',
    tab: 'tasks',
    type: 'boolean',
    configType: 'enableRecurringTasks',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'completedTaskArchivePeriod',
    name: 'Task Auto-Archive Period',
    desc: 'Archive accomplished routine blocks after predetermined days.',
    iconName: 'database',
    tab: 'tasks',
    type: 'enum',
    configType: 'completedTaskArchivePeriod',
    systemDefaultLabel: '7 Days'
  },
  {
    id: 'sortBy',
    name: 'Task List Sorting Rule',
    desc: 'Preferred default indexing parameter for visual listings.',
    iconName: 'activity',
    tab: 'tasks',
    type: 'enum',
    configType: 'sortBy',
    systemDefaultLabel: 'Due Date'
  },

  // --- CALENDAR PLANNER ---
  {
    id: 'weekStartsOn',
    name: 'Week Starts On',
    desc: 'Determine the leading day on timetable grids and reports.',
    iconName: 'calendar',
    tab: 'calendar',
    type: 'enum',
    configType: 'weekStartsOn',
    systemDefaultLabel: 'Monday'
  },
  {
    id: 'meetingBufferTime',
    name: 'Inter-meeting buffer',
    desc: 'Set automatic idle spacing between overlapping calendar blocks.',
    iconName: 'clock',
    tab: 'calendar',
    type: 'number',
    configType: 'meetingBufferTime',
    systemDefaultLabel: '10 minutes'
  },
  {
    id: 'eventReminderTiming',
    name: 'Event Pre-warn Buffer',
    desc: 'Receive alerts minutes prior to calendar block trigger sessions.',
    iconName: 'bell',
    tab: 'calendar',
    type: 'number',
    configType: 'eventReminderTiming',
    systemDefaultLabel: '5 minutes before'
  },
  {
    id: 'calendarView',
    name: 'Default Calendar View',
    desc: 'Visual granularity of calendar panels (Day, Week, Month lists).',
    iconName: 'layers',
    tab: 'calendar',
    type: 'enum',
    configType: 'calendarView',
    systemDefaultLabel: 'Week List'
  },

  // --- REMINDERS (ALERTS & SOUNDS) ---
  {
    id: 'enableInAppReminders',
    name: 'Enable Floating Toasts',
    desc: 'Pop glowing alert cards inside the screen corner on routine actions.',
    iconName: 'info',
    tab: 'reminders',
    type: 'boolean',
    configType: 'toast-config',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'enableSoundAlerts',
    name: 'Synthesized Sound Beeps',
    desc: 'Play FM frequencies and LFO pitch sweeps on interval countdowns.',
    iconName: 'volume',
    tab: 'reminders',
    type: 'boolean',
    configType: 'sound-library',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'enableVibrationAlerts',
    name: 'Vibration Haptic Feedback',
    desc: 'Pulse hardware vibration motors on alert event triggers.',
    iconName: 'vibrate',
    tab: 'reminders',
    type: 'boolean',
    configType: 'vibration-picker',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'selectedAlarmSound',
    name: 'Active System Alarm Tune',
    desc: 'Master audible track fired on critical timer completions.',
    iconName: 'bell',
    tab: 'reminders',
    type: 'enum',
    configType: 'alarm-tune',
    systemDefaultLabel: 'Classic Alarm'
  },
  {
    id: 'reminderVolume',
    name: 'Volume Output Level',
    desc: 'General audio loudness percentage for play back alerts.',
    iconName: 'volume',
    tab: 'reminders',
    type: 'number',
    configType: 'volume-output',
    systemDefaultLabel: '75%'
  },
  {
    id: 'reminderLeadTime',
    name: 'Default Pre-Warn Period',
    desc: 'Timing duration selector for early routine warnings.',
    iconName: 'clock',
    tab: 'reminders',
    type: 'number',
    configType: 'prewarn-period',
    systemDefaultLabel: '5 minutes'
  },
  {
    id: 'reminderNotifications',
    name: 'Differentiate Reminder Channels',
    desc: 'Configure separate notifications properties for Task, Meeting, Break, and Goal.',
    iconName: 'layers',
    tab: 'reminders',
    type: 'boolean',
    configType: 'reminders-channels',
    systemDefaultLabel: 'Differentiated'
  },
  {
    id: 'activityNotifications',
    name: 'Trigger Test Reminder Beacon',
    desc: 'Emit instant combined sound, haptic, toast, and banner diagnostics.',
    iconName: 'zap',
    tab: 'reminders',
    type: 'trigger',
    configType: 'test-beacon',
    systemDefaultLabel: 'Click To Trigger'
  },

  // --- FOCUS MODE AMBIENT ---
  {
    id: 'customFocusBackgroundSound',
    name: 'Acoustic Soundscapes',
    desc: 'Select comforting forest, rain, ocean, white noise synthesizers.',
    iconName: 'volume',
    tab: 'focus',
    type: 'enum',
    configType: 'focus-sound',
    systemDefaultLabel: 'None'
  },
  {
    id: 'enableFocusSessions',
    name: 'Automate Tab Locks',
    desc: 'Restrict interface page switches during active timer counts.',
    iconName: 'lock',
    tab: 'focus',
    type: 'boolean',
    configType: 'enableFocusSessions',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'blockDistractions',
    name: 'Suppress Secondary Alerts',
    desc: 'Mute non-critical alarms when focus sounds are playing.',
    iconName: 'eyeOff',
    tab: 'focus',
    type: 'boolean',
    configType: 'blockDistractions',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'autoSilenceAlerts',
    name: 'Master Timer Isolation',
    desc: 'Ensure only final milestone alarms sound when active.',
    iconName: 'shieldCheck',
    tab: 'focus',
    type: 'boolean',
    configType: 'autoSilenceAlerts',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'focusSessionGoalTracking',
    name: 'Streak Metric Logging',
    desc: 'Record milestone minutes directly into reports for trophies.',
    iconName: 'award',
    tab: 'focus',
    type: 'boolean',
    configType: 'focusSessionGoalTracking',
    systemDefaultLabel: 'Enabled'
  },

  // --- SECURITY LOCK ---
  {
    id: 'pinLockEnabled',
    name: 'Interactive PIN Keypad Request',
    desc: 'Require an encrypted numeric unlock code to enter dashboard.',
    iconName: 'key',
    tab: 'security',
    type: 'boolean',
    configType: 'pinLockEnabled',
    systemDefaultLabel: 'Disabled'
  },
  {
    id: 'appLockEnabled',
    name: 'Auto Inactivity Lockdown',
    desc: 'Enforce lock screens if system detects no activity for period.',
    iconName: 'lock',
    tab: 'security',
    type: 'boolean',
    configType: 'appLockEnabled',
    systemDefaultLabel: 'Disabled'
  },
  {
    id: 'rememberLogin',
    name: 'Skip Security Key Cached Session',
    desc: 'Trust current browser cookie environment skipping passwords.',
    iconName: 'shieldCheck',
    tab: 'security',
    type: 'boolean',
    configType: 'rememberLogin',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'twoFactorEnabled',
    name: 'Dual Key Authorization Matrix',
    desc: 'Require secondary email login verification envelopes.',
    iconName: 'activity',
    tab: 'security',
    type: 'boolean',
    configType: 'twoFactorEnabled',
    systemDefaultLabel: 'Disabled'
  },

  // --- PRIVACY CONTROL ---
  {
    id: 'profileVisibility',
    name: 'Profile Workspace Visibility',
    desc: 'Who can examine department and organization schedules.',
    iconName: 'eye',
    tab: 'privacy',
    type: 'enum',
    configType: 'profileVisibility',
    systemDefaultLabel: 'Organization Nodes Only'
  },
  {
    id: 'activityVisibility',
    name: 'Milestone Disclosure Level',
    desc: 'Permit reporting algorithms to publish speed indices.',
    iconName: 'award',
    tab: 'privacy',
    type: 'enum',
    configType: 'activityVisibility',
    systemDefaultLabel: 'Share Milestone Trophies'
  },
  {
    id: 'productivitySharing',
    name: 'Allow Peer Metric Auditing',
    desc: 'Participate and sync with team focus averages.',
    iconName: 'layers',
    tab: 'privacy',
    type: 'boolean',
    configType: 'productivitySharing',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'analyticsCollection',
    name: 'Performance Diagnostic Logging',
    desc: 'Log interval timers offline to improve layout load speeds.',
    iconName: 'database',
    tab: 'privacy',
    type: 'boolean',
    configType: 'analyticsCollection',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'anonymousStatistics',
    name: 'Anonymous Collective Benchmarking',
    desc: 'Aggregate analytics anonymous statistics into global models.',
    iconName: 'brain',
    tab: 'privacy',
    type: 'boolean',
    configType: 'anonymousStatistics',
    systemDefaultLabel: 'Enabled'
  },

  // --- AI ASSISTANT ---
  {
    id: 'enableAISuggestions',
    name: 'Zen Banners & Advice',
    desc: 'Generate interactive smart suggestion prompts in header.',
    iconName: 'brain',
    tab: 'ai',
    type: 'boolean',
    configType: 'enableAISuggestions',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'smartScheduling',
    name: 'Overlapping Collision Checks',
    desc: 'Receive early hints if calendar bookings overlap.',
    iconName: 'calendar',
    tab: 'ai',
    type: 'boolean',
    configType: 'smartScheduling',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'taskPrioritization',
    name: 'Priority Score Audits',
    desc: 'Recommend daily routine order based on accomplishments.',
    iconName: 'award',
    tab: 'ai',
    type: 'boolean',
    configType: 'taskPrioritization',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'productivityInsights',
    name: 'Weekly AI Executive Summary',
    desc: 'Compile comprehensive summaries analyzing focus indexes.',
    iconName: 'barChart',
    tab: 'ai',
    type: 'boolean',
    configType: 'productivityInsights',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'dailyRecommendations',
    name: 'Quotes & Mindset Pushes',
    desc: 'Transmit micro focus tips directly to active breaks.',
    iconName: 'zap',
    tab: 'ai',
    type: 'boolean',
    configType: 'dailyRecommendations',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'weeklyReports',
    name: 'Flow State Logs Analyser',
    desc: 'Produce automated models checking peak performance.',
    iconName: 'activity',
    tab: 'ai',
    type: 'boolean',
    configType: 'weeklyReports',
    systemDefaultLabel: 'Enabled'
  },

  // --- REPORTS ANALYTICS ---
  {
    id: 'generateDailyReport',
    name: 'Automate Daily KPI Exports',
    desc: 'Aggregate accomplished checkboxes at day end.',
    iconName: 'barChart',
    tab: 'reports',
    type: 'boolean',
    configType: 'generateDailyReport',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'weeklySummaryEmail',
    name: 'E-Mail Summary Reports',
    desc: 'Deliver weekly score checklists direct to profile mailbox.',
    iconName: 'info',
    tab: 'reports',
    type: 'boolean',
    configType: 'weeklySummaryEmail',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'monthlyProductivityReport',
    name: 'Aggregate Monthly Milestones',
    desc: 'Generate cumulative trend charts for data reviews.',
    iconName: 'database',
    tab: 'reports',
    type: 'boolean',
    configType: 'monthlyProductivityReport',
    systemDefaultLabel: 'Enabled'
  },
  {
    id: 'goalTrackingDashboard',
    name: 'Goal Dashboard Graphs',
    desc: 'Activate interactive calendars measuring focus streaks.',
    iconName: 'layers',
    tab: 'reports',
    type: 'boolean',
    configType: 'goalTrackingDashboard',
    systemDefaultLabel: 'Enabled'
  },

  // --- ACCESSIBILITY ---
  {
    id: 'highContrastMode',
    name: 'High Contrast Mode Contours',
    desc: 'Maximize contrast using solid black backdrops and borders.',
    iconName: 'eye',
    tab: 'accessibility',
    type: 'boolean',
    configType: 'highContrastMode',
    systemDefaultLabel: 'Disabled'
  },
  {
    id: 'largerText',
    name: 'Magnified Heading Sizes',
    desc: 'Slightly enlarge screen text components to support reading.',
    iconName: 'activity',
    tab: 'accessibility',
    type: 'boolean',
    configType: 'largerText',
    systemDefaultLabel: 'Disabled'
  },
  {
    id: 'reducedMotion',
    name: 'Reduced Slide Animations',
    desc: 'Disable bouncy and layout-shifting transitions.',
    iconName: 'eyeOff',
    tab: 'accessibility',
    type: 'boolean',
    configType: 'reducedMotion',
    systemDefaultLabel: 'Disabled'
  },
  {
    id: 'keyboardNavigation',
    name: 'Master Shortcut Navigation',
    desc: 'Direct page jumping commands mapped on browser hotkeys.',
    iconName: 'key',
    tab: 'accessibility',
    type: 'boolean',
    configType: 'keyboardNavigation',
    systemDefaultLabel: 'Disabled'
  },
  {
    id: 'screenReaderSupport',
    name: 'Voice Reader Assist',
    desc: 'Include explicit descriptors on interactive buttons.',
    iconName: 'info',
    tab: 'accessibility',
    type: 'boolean',
    configType: 'screenReaderSupport',
    systemDefaultLabel: 'Disabled'
  }
];
