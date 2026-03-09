'use client';

import { useState, useEffect } from 'react';

type ActivityType = 'study' | 'break' | null;

interface StudySession {
  id: string;
  task: string;
  duration: number;
  timestamp: Date;
}

export default function Home() {
  const [activeTimer, setActiveTimer] = useState<ActivityType>(null);
  const [studySeconds, setStudySeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [showExerciseReminder, setShowExerciseReminder] = useState(false);

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

  const getTotalStudyTime = () => {
    const sessionTotal = studySessions.reduce((acc, session) => acc + session.duration, 0);
    return sessionTotal;
  };

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
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-neutral-500">Total Study Time</p>
              <p className="text-xl font-light text-neutral-900">{formatTime(getTotalStudyTime())}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Sessions Completed</p>
              <p className="text-xl font-light text-neutral-900">{studySessions.length}</p>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        {studySessions.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-neutral-900 mb-3">Recent Sessions</h2>
            <div className="space-y-2">
              {studySessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{session.task}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(session.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm text-neutral-600">{formatTime(session.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
