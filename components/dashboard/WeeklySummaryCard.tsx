'use client'

import { CheckSquare, BookOpen, Link2, TrendingUp } from 'lucide-react'

interface Summary {
  tasksCompleted: number
  modulesCompleted: number
  resourcesSaved: number
  courseProgress: { id: string; title: string; progress: number }[]
}

export function WeeklySummaryCard({ summary }: { summary: Summary }) {
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-green-400" />
        This Week
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">{summary.tasksCompleted}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tasks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-indigo-400">{summary.modulesCompleted}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Modules</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">{summary.resourcesSaved}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Saved</p>
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
