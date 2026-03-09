'use client';

import { useState, useEffect } from 'react';

type ActivityType = 'study' | 'break' | null;

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

export default function Home() {
  const [activeTimer, setActiveTimer] = useState<ActivityType>(null);
  const [studySeconds, setStudySeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [showExerciseReminder, setShowExerciseReminder] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState(0);

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
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (studySessions.length > 0) {
      localStorage.setItem('studySessions', JSON.stringify(studySessions));
    }
  }, [studySessions]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Save claimed rewards
  useEffect(() => {
    localStorage.setItem('claimedRewards', JSON.stringify(claimedRewards));
  }, [claimedRewards]);

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
      // Stop current timer
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
      // Stop other timer if running
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

  // Group sessions by date
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

    // Sort by date (most recent first)
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

  // Rewards calculation (1 reward per 50 minutes)
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

  const dailyData = getSessionsByDate();

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-6 transition-colors">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light text-neutral-900 dark:text-neutral-100">Study Tracker</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Track your study, breaks, and stay active</p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

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

          {/* Calendar View - Sessions by Date */}
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
        </div>
      </div>
    </div>
  );
}
