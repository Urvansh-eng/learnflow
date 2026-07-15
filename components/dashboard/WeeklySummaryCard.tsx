'use client'

import { CheckSquare, BookOpen, Link2, TrendingUp } from 'lucide-react'

interface Summary {
  tasksCompleted: number
  lessonsCompleted: number
  resourcesSaved: number
  courseProgress: { id: string; title: string; progress: number }[]
}

export function WeeklySummaryCard({ summary }: { summary: Summary | null }) {
  if (!summary) return <div className="glass rounded-3xl p-6 h-40 animate-pulse"></div>

  return (
    <div className="glass rounded-3xl p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h3 className="font-semibold text-lg flex items-center gap-2 mb-4 relative z-10">
        <TrendingUp className="w-5 h-5 text-primary" />
        This Week
      </h3>
      <div className="grid grid-cols-3 gap-4 relative z-10">
        <div className="bg-secondary/40 rounded-2xl p-4 border border-border/50 hover:bg-secondary/60 transition-colors">
          <p className="text-sm text-muted-foreground mb-1">Tasks</p>
          <p className="text-2xl font-bold text-green-400">{summary.tasksCompleted}</p>
        </div>
        <div className="bg-secondary/40 rounded-2xl p-4 border border-border/50 hover:bg-secondary/60 transition-colors">
          <p className="text-sm text-muted-foreground mb-1">Lessons</p>
          <p className="text-2xl font-bold text-indigo-400">{summary.lessonsCompleted}</p>
        </div>
        <div className="bg-secondary/40 rounded-2xl p-4 border border-border/50 hover:bg-secondary/60 transition-colors">
          <p className="text-sm text-muted-foreground mb-1">Saved</p>
          <p className="text-2xl font-bold text-blue-400">{summary.resourcesSaved}</p>
        </div>
      </div>
      {summary.courseProgress.slice(0, 3).map((c) => (
        <div key={c.id} className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground truncate">{c.title}</span>
            <span className="text-primary font-medium">{c.progress}%</span>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full gradient-bg rounded-full" style={{ width: `${c.progress}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
