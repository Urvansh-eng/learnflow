'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen, CheckSquare, Award, Flame, ArrowRight, ExternalLink, Clock } from 'lucide-react'
import Link from 'next/link'
import { daysUntil, formatDate } from '@/lib/utils'
import { StreakHeatmap } from '@/components/dashboard/StreakHeatmap'
import { WeeklySummaryCard } from '@/components/dashboard/WeeklySummaryCard'
import { PomodoroTimer } from '@/components/dashboard/PomodoroTimer'

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4 glow-primary hover:scale-[1.02] transition-all duration-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => fetch('/api/courses').then((r) => r.json()),
  })

  const { data: certs = [] } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => fetch('/api/certificates').then((r) => r.json()),
  })

  const { data: todayTasks = [] } = useQuery({
    queryKey: ['tasks-today'],
    queryFn: () => fetch('/api/tasks/today').then((r) => r.json()),
  })

  const { data: streakData } = useQuery({
    queryKey: ['streak'],
    queryFn: () => fetch('/api/progress/streak').then((r) => r.json()),
  })

  const { data: summary } = useQuery({
    queryKey: ['weekly-summary'],
    queryFn: () => fetch('/api/progress/weekly').then((r) => r.json()),
  })

  const inProgressCourses = courses.filter((c: any) => c.progress > 0 && c.progress < 100)
  const upcomingDeadlines = certs.filter((c: any) => {
    if (!c.targetDate || c.status === 'completed') return false
    const days = daysUntil(c.targetDate)
    return days !== null && days <= 14 && days >= 0
  })

  const priorityColors: Record<string, string> = {
    LOW: 'bg-green-500/20 text-green-400 border-green-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    URGENT: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Day Streak" value={streakData?.currentStreak ?? 0} color="bg-gradient-to-br from-orange-500 to-red-500" />
        <StatCard icon={BookOpen} label="Courses" value={courses.length} color="bg-gradient-to-br from-indigo-500 to-purple-500" />
        <StatCard icon={Award} label="Certificates" value={certs.length} color="bg-gradient-to-br from-blue-500 to-cyan-500" />
        <StatCard icon={CheckSquare} label="Today's Tasks" value={todayTasks.length} color="bg-gradient-to-br from-green-500 to-emerald-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: courses + tasks */}
        <div className="xl:col-span-2 space-y-6">
          {/* Continue Courses */}
          {inProgressCourses.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Continue Learning
                </h2>
                <Link href="/courses" className="text-xs text-primary hover:underline flex items-center gap-1">
                  All courses <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {inProgressCourses.slice(0, 3).map((course: any) => (
                  <div key={course.id} className="glass rounded-xl p-4 hover:glow-primary transition-all duration-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{course.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {course.platform} · {course.modules.filter((m: any) => m.completed).length}/{course.modules.length} modules
                        </p>
                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-bg rounded-full transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{course.progress}% complete</p>
                      </div>
                      {course.nextModule?.resumeUrl && (
                        <a
                          href={course.nextModule.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          id={`continue-course-${course.id}`}
                          className="flex-shrink-0 flex items-center gap-1.5 gradient-bg text-white text-xs rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
                        >
                          Continue <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Today's Tasks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-400" />
                Today's Tasks
              </h2>
              <Link href="/board" className="text-xs text-primary hover:underline flex items-center gap-1">
                Open board <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {todayTasks.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No tasks due today — great job staying ahead! 🎉
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task: any) => (
                  <div key={task.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.column?.name}</p>
                      </div>
                    </div>
                    <span className={`text-xs border rounded-full px-2 py-0.5 flex-shrink-0 ${priorityColors[task.priority] ?? ''}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Streak Heatmap */}
          <section>
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Activity
            </h2>
            <div className="glass rounded-xl p-5">
              <StreakHeatmap data={streakData?.countByDay ?? {}} />
            </div>
          </section>
        </div>

        {/* Right column: deadlines + weekly summary + pomodoro */}
        <div className="space-y-6">
          {/* Certificate Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <section>
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                Upcoming Deadlines
              </h2>
              <div className="space-y-2">
                {upcomingDeadlines.map((cert: any) => {
                  const days = daysUntil(cert.targetDate)!
                  return (
                    <div key={cert.id} className="glass rounded-xl p-4">
                      <p className="text-sm font-medium truncate">{cert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cert.provider}</p>
                      <div className={`mt-2 text-xs font-medium ${days <= 3 ? 'text-red-400' : days <= 7 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {days === 0 ? 'Due today!' : `${days} day${days !== 1 ? 's' : ''} left`}
                      </div>
                      {cert.resumeUrl && (
                        <a
                          href={cert.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Resume <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Weekly Summary */}
          {summary && <WeeklySummaryCard summary={summary} />}

          {/* Pomodoro Timer */}
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Focus Timer
            </h2>
            <PomodoroTimer />
          </section>
        </div>
      </div>
    </div>
  )
}
