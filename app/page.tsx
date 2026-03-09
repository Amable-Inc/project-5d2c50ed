'use client';

import { useState, useEffect } from 'react';

type ActivityType = 'study' | 'break' | null;
type TabType = 'tracker' | 'habits';

interface StudySession {
  id: string;
  task: string;
  duration: number;
  timestamp: Date;
}

interface DailyData {
  date: string;
  sessions: StudySession[];
  totalDuration: number;
}

interface HabitParameter {
  name: string;
  type: 'boolean' | 'number' | 'duration' | 'rating';
  unit?: string;
}

interface Habit {
  id: string;
  name: string;
  parameters: HabitParameter[];
  createdAt: Date;
}

interface HabitEntry {
  habitId: string;
  date: string;
  values: Record<string, any>;
}

export default function Home() {
  const [currentTab, setCurrentTab] = useState<TabType>('tracker');
  const [activeTimer, setActiveTimer] = useState<ActivityType>(null);
  const [studySeconds, setStudySeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [showExerciseReminder, setShowExerciseReminder] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState(0);

  // Habit tracker state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('studySessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setStudySessions(parsed.map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp)
      })));
    }

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }

    const savedClaimedRewards = localStorage.getItem('claimedRewards');
    if (savedClaimedRewards) {
      setClaimedRewards(JSON.parse(savedClaimedRewards));
    }

    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) {
      const parsed = JSON.parse(savedHabits);
      setHabits(parsed.map((h: any) => ({
        ...h,
        createdAt: new Date(h.createdAt)
      })));
    }

    const savedHabitEntries = localStorage.getItem('habitEntries');
    if (savedHabitEntries) {
      setHabitEntries(JSON.parse(savedHabitEntries));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (studySessions.length > 0) {
      localStorage.setItem('studySessions', JSON.stringify(studySessions));
    }
  }, [studySessions]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('claimedRewards', JSON.stringify(claimedRewards));
  }, [claimedRewards]);

  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem('habits', JSON.stringify(habits));
    }
  }, [habits]);

  useEffect(() => {
    if (habitEntries.length > 0) {
      localStorage.setItem('habitEntries', JSON.stringify(habitEntries));
    }
  }, [habitEntries]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeTimer === 'study') {
      interval = setInterval(() => {
        setStudySeconds((prev) => prev + 1);
      }, 1000);
    } else if (activeTimer === 'break') {
      interval = setInterval(() => {
        setBreakSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Exercise reminder (every 2 hours of study)
  useEffect(() => {
    if (studySeconds > 0 && studySeconds % 7200 === 0) {
      setShowExerciseReminder(true);
      setTimeout(() => setShowExerciseReminder(false), 10000);
    }
  }, [studySeconds]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const startActivity = (type: ActivityType) => {
    if (activeTimer === type) {
      if (type === 'study' && studySeconds > 0) {
        const session: StudySession = {
          id: Date.now().toString(),
          task: currentTask || 'General Study',
          duration: studySeconds,
          timestamp: new Date(),
        };
        setStudySessions([session, ...studySessions]);
      }
      setActiveTimer(null);
    } else {
      if (activeTimer) {
        if (activeTimer === 'study' && studySeconds > 0) {
          const session: StudySession = {
            id: Date.now().toString(),
            task: currentTask || 'General Study',
            duration: studySeconds,
            timestamp: new Date(),
          };
          setStudySessions([session, ...studySessions]);
        }
      }
      setActiveTimer(type);
    }
  };

  const resetTimer = (type: 'study' | 'break') => {
    if (type === 'study') {
      setStudySeconds(0);
      setCurrentTask('');
      if (activeTimer === 'study') setActiveTimer(null);
    } else {
      setBreakSeconds(0);
      if (activeTimer === 'break') setActiveTimer(null);
    }
  };

  const getSessionsByDate = (): DailyData[] => {
    const grouped = new Map<string, StudySession[]>();
    
    studySessions.forEach(session => {
      const dateKey = new Date(session.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(session);
    });

    const dailyData: DailyData[] = Array.from(grouped.entries()).map(([date, sessions]) => ({
      date,
      sessions,
      totalDuration: sessions.reduce((acc, s) => acc + s.duration, 0)
    }));

    return dailyData.sort((a, b) => {
      return new Date(b.sessions[0].timestamp).getTime() - new Date(a.sessions[0].timestamp).getTime();
    });
  };

  const getTotalStudyTime = () => {
    return studySessions.reduce((acc, session) => acc + session.duration, 0);
  };

  const getAverageStudyTime = () => {
    const dailyData = getSessionsByDate();
    if (dailyData.length === 0) return 0;
    return getTotalStudyTime() / dailyData.length;
  };

  const getTotalRewards = () => {
    const totalMinutes = Math.floor(getTotalStudyTime() / 60);
    return Math.floor(totalMinutes / 50);
  };

  const getUnclaimedRewards = () => {
    return getTotalRewards() - claimedRewards;
  };

  const claimRewards = () => {
    const unclaimed = getUnclaimedRewards();
    if (unclaimed > 0) {
      setClaimedRewards(claimedRewards + unclaimed);
    }
  };

  // AI-powered habit parameter detection
  const detectHabitParameters = (habitName: string): HabitParameter[] => {
    const lowerName = habitName.toLowerCase();
    const params: HabitParameter[] = [];

    // Exercise-related
    if (lowerName.includes('run') || lowerName.includes('jog')) {
      params.push({ name: 'Distance', type: 'number', unit: 'km' });
      params.push({ name: 'Duration', type: 'duration' });
      params.push({ name: 'Completed', type: 'boolean' });
    } else if (lowerName.includes('gym') || lowerName.includes('workout') || lowerName.includes('exercise')) {
      params.push({ name: 'Duration', type: 'duration' });
      params.push({ name: 'Intensity', type: 'rating' });
      params.push({ name: 'Completed', type: 'boolean' });
    } else if (lowerName.includes('yoga') || lowerName.includes('stretch')) {
      params.push({ name: 'Duration', type: 'duration' });
      params.push({ name: 'Quality', type: 'rating' });
      params.push({ name: 'Completed', type: 'boolean' });
    } else if (lowerName.includes('meditat')) {
      params.push({ name: 'Duration', type: 'duration' });
      params.push({ name: 'Quality', type: 'rating' });
      params.push({ name: 'Completed', type: 'boolean' });
    }
    // Reading/Learning
    else if (lowerName.includes('read')) {
      params.push({ name: 'Pages', type: 'number' });
      params.push({ name: 'Duration', type: 'duration' });
      params.push({ name: 'Completed', type: 'boolean' });
    } else if (lowerName.includes('study') || lowerName.includes('learn')) {
      params.push({ name: 'Duration', type: 'duration' });
      params.push({ name: 'Focus', type: 'rating' });
      params.push({ name: 'Completed', type: 'boolean' });
    }
    // Health
    else if (lowerName.includes('water') || lowerName.includes('hydrat')) {
      params.push({ name: 'Glasses', type: 'number' });
      params.push({ name: 'Completed', type: 'boolean' });
    } else if (lowerName.includes('sleep')) {
      params.push({ name: 'Hours', type: 'number' });
      params.push({ name: 'Quality', type: 'rating' });
    } else if (lowerName.includes('meal') || lowerName.includes('eat')) {
      params.push({ name: 'Healthy', type: 'boolean' });
      params.push({ name: 'Meals', type: 'number' });
    }
    // Productivity
    else if (lowerName.includes('write') || lowerName.includes('journal')) {
      params.push({ name: 'Words', type: 'number' });
      params.push({ name: 'Completed', type: 'boolean' });
    } else if (lowerName.includes('code') || lowerName.includes('program')) {
      params.push({ name: 'Duration', type: 'duration' });
      params.push({ name: 'Commits', type: 'number' });
      params.push({ name: 'Completed', type: 'boolean' });
    }
    // Default fallback
    else {
      params.push({ name: 'Completed', type: 'boolean' });
      params.push({ name: 'Quality', type: 'rating' });
      params.push({ name: 'Notes', type: 'number' });
    }

    return params;
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;

    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      parameters: detectHabitParameters(newHabitName),
      createdAt: new Date(),
    };

    setHabits([...habits, habit]);
    setNewHabitName('');
  };

  const deleteHabit = (habitId: string) => {
    setHabits(habits.filter(h => h.id !== habitId));
    setHabitEntries(habitEntries.filter(e => e.habitId !== habitId));
  };

  const getWeekDates = (offset: number = 0): Date[] => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Start from Monday
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diff + (offset * 7));
    weekStart.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getHabitEntry = (habitId: string, date: Date): HabitEntry | undefined => {
    const dateKey = formatDateKey(date);
    return habitEntries.find(e => e.habitId === habitId && e.date === dateKey);
  };

  const updateHabitEntry = (habitId: string, date: Date, paramName: string, value: any) => {
    const dateKey = formatDateKey(date);
    const existingEntry = habitEntries.find(e => e.habitId === habitId && e.date === dateKey);

    if (existingEntry) {
      setHabitEntries(habitEntries.map(e =>
        e.habitId === habitId && e.date === dateKey
          ? { ...e, values: { ...e.values, [paramName]: value } }
          : e
      ));
    } else {
      const newEntry: HabitEntry = {
        habitId,
        date: dateKey,
        values: { [paramName]: value }
      };
      setHabitEntries([...habitEntries, newEntry]);
    }
  };

  const getWeekProgress = (habitId: string, weekOffset: number = 0): { completed: number; total: number } => {
    const weekDates = getWeekDates(weekOffset);
    const completedParam = habits.find(h => h.id === habitId)?.parameters.find(p => p.name === 'Completed');
    
    if (!completedParam) return { completed: 0, total: 7 };

    const completed = weekDates.filter(date => {
      const entry = getHabitEntry(habitId, date);
      return entry?.values['Completed'] === true;
    }).length;

    return { completed, total: 7 };
  };

  const getProgressComparison = (habitId: string): string => {
    const currentWeek = getWeekProgress(habitId, currentWeekOffset);
    const lastWeek = getWeekProgress(habitId, currentWeekOffset - 1);

    if (lastWeek.completed === 0) return 'First week tracking';
    
    const diff = currentWeek.completed - lastWeek.completed;
    if (diff > 0) return `↗️ +${diff} vs last week`;
    if (diff < 0) return `↘️ ${diff} vs last week`;
    return '→ Same as last week';
  };

  const weekDates = getWeekDates(currentWeekOffset);
  const dailyData = getSessionsByDate();

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-6 transition-colors">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light text-neutral-900 dark:text-neutral-100">Study Tracker</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Track your study, breaks, and habits</p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCurrentTab('tracker')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'tracker'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              Study Tracker
            </button>
            <button
              onClick={() => setCurrentTab('habits')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'habits'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              Habit Tracker
            </button>
          </div>

          {/* Study Tracker Tab */}
          {currentTab === 'tracker' && (
            <>
              {/* Exercise Reminder */}
              {showExerciseReminder && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">💪 Time to stretch or exercise! You've been studying for 2 hours.</p>
                </div>
              )}

              {/* Rewards Section */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 mb-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Rewards</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">1 reward per 50 minutes of study</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
                      🏆 {getUnclaimedRewards()}
                    </div>
                    <button
                      onClick={claimRewards}
                      disabled={getUnclaimedRewards() === 0}
                      className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded hover:bg-amber-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed transition-colors"
                    >
                      Claim {getUnclaimedRewards() > 0 ? `(${getUnclaimedRewards()})` : ''}
                    </button>
                  </div>
                </div>
                {claimedRewards > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Total claimed: {claimedRewards} reward{claimedRewards !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* Study Timer */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Study Time</h2>
                  <span className="text-3xl font-light text-neutral-900 dark:text-neutral-100">{formatTime(studySeconds)}</span>
                </div>
                
                <input
                  type="text"
                  placeholder="Task or course (optional)"
                  value={currentTask}
                  onChange={(e) => setCurrentTask(e.target.value)}
                  className="w-full px-3 py-2 mb-3 text-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  disabled={activeTimer === 'study'}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => startActivity('study')}
                    className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                      activeTimer === 'study'
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                    }`}
                  >
                    {activeTimer === 'study' ? 'Stop' : 'Start'}
                  </button>
                  <button
                    onClick={() => resetTimer('study')}
                    className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Break Timer */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Break Time</h2>
                  <span className="text-3xl font-light text-neutral-900 dark:text-neutral-100">{formatTime(breakSeconds)}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startActivity('break')}
                    className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                      activeTimer === 'break'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                    }`}
                  >
                    {activeTimer === 'break' ? 'Stop Break' : 'Start Break'}
                  </button>
                  <button
                    onClick={() => resetTimer('break')}
                    className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 mb-4 shadow-sm">
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">Summary</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Hours</p>
                    <p className="text-xl font-light text-neutral-900 dark:text-neutral-100">{formatDuration(getTotalStudyTime())}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Daily Average</p>
                    <p className="text-xl font-light text-neutral-900 dark:text-neutral-100">{formatDuration(Math.round(getAverageStudyTime()))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Days Tracked</p>
                    <p className="text-xl font-light text-neutral-900 dark:text-neutral-100">{dailyData.length}</p>
                  </div>
                </div>
              </div>

              {/* Calendar View */}
              {dailyData.length > 0 && (
                <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm">
                  <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">Study Calendar</h2>
                  <div className="space-y-4">
                    {dailyData.map((day) => (
                      <div key={day.date} className="border-l-2 border-neutral-200 dark:border-neutral-700 pl-4">
                        <div className="flex justify-between items-baseline mb-2">
                          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{day.date}</h3>
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{formatDuration(day.totalDuration)}</span>
                        </div>
                        <div className="space-y-1">
                          {day.sessions.map((session) => (
                            <div key={session.id} className="flex justify-between items-center text-xs py-1">
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-400 dark:text-neutral-500">
                                  {new Date(session.timestamp).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                <span className="text-neutral-700 dark:text-neutral-300">{session.task}</span>
                              </div>
                              <span className="text-neutral-500 dark:text-neutral-400">{formatDuration(session.duration)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Habit Tracker Tab */}
          {currentTab === 'habits' && (
            <>
              {/* Add New Habit */}
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 mb-4 shadow-sm">
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">Add New Habit</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Morning Run, Meditation, Read Book..."
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                    className="flex-1 px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  />
                  <button
                    onClick={addHabit}
                    className="px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  AI will automatically suggest relevant tracking parameters based on your habit name
                </p>
              </div>

              {/* Week Navigation */}
              {habits.length > 0 && (
                <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 mb-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
                      className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      ← Previous Week
                    </button>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {currentWeekOffset === 0 ? 'This Week' : `Week ${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset}`}
                    </span>
                    <button
                      onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                      disabled={currentWeekOffset >= 0}
                      className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next Week →
                    </button>
                  </div>
                </div>
              )}

              {/* Habits List */}
              <div className="space-y-4">
                {habits.map((habit) => (
                  <div key={habit.id} className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{habit.name}</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {getProgressComparison(habit.id)}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Week Grid */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {weekDates.map((date, index) => {
                        const entry = getHabitEntry(habit.id, date);
                        const isCompleted = entry?.values['Completed'] === true;
                        const isToday = formatDateKey(date) === formatDateKey(new Date());

                        return (
                          <div
                            key={index}
                            className={`text-center p-2 rounded ${
                              isToday ? 'ring-2 ring-neutral-400 dark:ring-neutral-500' : ''
                            }`}
                          >
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="text-xs text-neutral-600 dark:text-neutral-300 mb-2">
                              {date.getDate()}
                            </div>
                            <div className="text-lg">
                              {isCompleted ? '✓' : '○'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Track Today */}
                    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-3">Track Today</p>
                      <div className="grid grid-cols-2 gap-3">
                        {habit.parameters.map((param) => {
                          const todayEntry = getHabitEntry(habit.id, new Date());
                          const currentValue = todayEntry?.values[param.name];

                          return (
                            <div key={param.name}>
                              <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                                {param.name} {param.unit && `(${param.unit})`}
                              </label>
                              {param.type === 'boolean' && (
                                <input
                                  type="checkbox"
                                  checked={currentValue || false}
                                  onChange={(e) => updateHabitEntry(habit.id, new Date(), param.name, e.target.checked)}
                                  className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600"
                                />
                              )}
                              {param.type === 'number' && (
                                <input
                                  type="number"
                                  value={currentValue || ''}
                                  onChange={(e) => updateHabitEntry(habit.id, new Date(), param.name, Number(e.target.value))}
                                  className="w-full px-2 py-1 text-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                                />
                              )}
                              {param.type === 'duration' && (
                                <input
                                  type="number"
                                  placeholder="minutes"
                                  value={currentValue || ''}
                                  onChange={(e) => updateHabitEntry(habit.id, new Date(), param.name, Number(e.target.value))}
                                  className="w-full px-2 py-1 text-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                                />
                              )}
                              {param.type === 'rating' && (
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => updateHabitEntry(habit.id, new Date(), param.name, star)}
                                      className={`text-lg ${
                                        (currentValue || 0) >= star
                                          ? 'text-yellow-500'
                                          : 'text-neutral-300 dark:text-neutral-600'
                                      }`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {habits.length === 0 && (
                  <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                    <p className="text-sm">No habits yet. Add one to get started!</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
