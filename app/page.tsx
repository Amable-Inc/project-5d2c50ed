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

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('studySessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setStudySessions(parsed.map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp)
      })));
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (studySessions.length > 0) {
      localStorage.setItem('studySessions', JSON.stringify(studySessions));
    }
  }, [studySessions]);

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

  const dailyData = getSessionsByDate();

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-light text-neutral-900">Study Tracker</h1>
          <p className="text-sm text-neutral-500 mt-1">Track your study, breaks, and stay active</p>
        </div>

        {/* Exercise Reminder */}
        {showExerciseReminder && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">💪 Time to stretch or exercise! You've been studying for 2 hours.</p>
          </div>
        )}

        {/* Study Timer */}
        <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-neutral-900">Study Time</h2>
            <span className="text-3xl font-light text-neutral-900">{formatTime(studySeconds)}</span>
          </div>
          
          <input
            type="text"
            placeholder="Task or course (optional)"
            value={currentTask}
            onChange={(e) => setCurrentTask(e.target.value)}
            className="w-full px-3 py-2 mb-3 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-neutral-400"
            disabled={activeTimer === 'study'}
          />

          <div className="flex gap-2">
            <button
              onClick={() => startActivity('study')}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                activeTimer === 'study'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
              }`}
            >
              {activeTimer === 'study' ? 'Stop' : 'Start'}
            </button>
            <button
              onClick={() => resetTimer('study')}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Break Timer */}
        <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-neutral-900">Break Time</h2>
            <span className="text-3xl font-light text-neutral-900">{formatTime(breakSeconds)}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => startActivity('break')}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                activeTimer === 'break'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {activeTimer === 'break' ? 'Stop Break' : 'Start Break'}
            </button>
            <button
              onClick={() => resetTimer('break')}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <h2 className="text-lg font-medium text-neutral-900 mb-3">Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-neutral-500">Total Hours</p>
              <p className="text-xl font-light text-neutral-900">{formatDuration(getTotalStudyTime())}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Daily Average</p>
              <p className="text-xl font-light text-neutral-900">{formatDuration(Math.round(getAverageStudyTime()))}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Days Tracked</p>
              <p className="text-xl font-light text-neutral-900">{dailyData.length}</p>
            </div>
          </div>
        </div>

        {/* Calendar View - Sessions by Date */}
        {dailyData.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Study Calendar</h2>
            <div className="space-y-4">
              {dailyData.map((day) => (
                <div key={day.date} className="border-l-2 border-neutral-200 pl-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-sm font-medium text-neutral-900">{day.date}</h3>
                    <span className="text-sm font-medium text-neutral-600">{formatDuration(day.totalDuration)}</span>
                  </div>
                  <div className="space-y-1">
                    {day.sessions.map((session) => (
                      <div key={session.id} className="flex justify-between items-center text-xs py-1">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400">
                            {new Date(session.timestamp).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          <span className="text-neutral-700">{session.task}</span>
                        </div>
                        <span className="text-neutral-500">{formatDuration(session.duration)}</span>
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
  );
}
