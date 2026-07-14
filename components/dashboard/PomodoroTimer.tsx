'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODES = {
  focus: { label: 'Focus', minutes: 25, color: 'text-indigo-400' },
  short: { label: 'Short Break', minutes: 5, color: 'text-green-400' },
  long: { label: 'Long Break', minutes: 15, color: 'text-blue-400' },
}

type Mode = keyof typeof MODES

export function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>('focus')
  const [seconds, setSeconds] = useState(MODES.focus.minutes * 60)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const total = MODES[mode].minutes * 60
  const progress = ((total - seconds) / total) * 100
  const circumference = 2 * Math.PI * 45

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            // Notify
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('LearnFlow', { body: `${MODES[mode].label} session complete! 🎉` })
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode])

  const switchMode = (m: Mode) => {
    setMode(m)
    setSeconds(MODES[m].minutes * 60)
    setRunning(false)
  }

  const reset = () => { setSeconds(MODES[mode].minutes * 60); setRunning(false) }

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  return (
    <div className="glass rounded-xl p-5">
      {/* Mode selector */}
      <div className="flex gap-1 mb-5 bg-secondary/30 rounded-xl p-1">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <button
            key={m}
            id={`pomodoro-mode-${m}`}
            onClick={() => switchMode(m)}
            className={cn(
              'flex-1 py-1.5 text-xs rounded-lg font-medium transition-all duration-200',
              mode === m ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      {/* Circular progress */}
      <div className="flex justify-center mb-4">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums">{mins}:{secs}</span>
            <span className={`text-[10px] ${MODES[mode].color}`}>{MODES[mode].label}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          id="pomodoro-reset"
          onClick={reset}
          className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          id="pomodoro-toggle"
          onClick={() => setRunning((r) => !r)}
          className="px-6 py-2 gradient-bg text-white rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center gap-2"
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {running ? 'Pause' : 'Start'}
        </button>
      </div>
    </div>
  )
}
