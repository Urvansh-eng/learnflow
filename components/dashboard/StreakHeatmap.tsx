'use client'

import { useMemo } from 'react'

interface Props {
  data: Record<string, number>
}

const WEEKS = 52
const DAYS = 7

function getColor(count: number): string {
  if (count === 0) return 'bg-secondary/40'
  if (count === 1) return 'bg-indigo-900/80'
  if (count <= 3) return 'bg-indigo-700/80'
  if (count <= 6) return 'bg-indigo-500/90'
  return 'bg-indigo-400'
}

export function StreakHeatmap({ data }: Props) {
  const cells = useMemo(() => {
    const result: { date: string; count: number }[][] = []
    const today = new Date()
    // Start from WEEKS * 7 days ago, then snap to Sunday
    const start = new Date(today)
    start.setDate(start.getDate() - WEEKS * DAYS)
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay())

    for (let w = 0; w < WEEKS; w++) {
      const week: { date: string; count: number }[] = []
      for (let d = 0; d < DAYS; d++) {
        const date = new Date(start)
        date.setDate(start.getDate() + w * 7 + d)
        const key = date.toISOString().split('T')[0]
        week.push({ date: key, count: data[key] ?? 0 })
      }
      result.push(week)
    }
    return result
  }, [data])

  const months = useMemo(() => {
    const labels: { label: string; offset: number }[] = []
    let prev = ''
    cells.forEach((week, i) => {
      const month = new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' })
      if (month !== prev) { labels.push({ label: month, offset: i }); prev = month }
    })
    return labels
  }, [cells])

  const total = Object.values(data).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{total} activities in the past year</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          Less
          {[0, 1, 2, 4, 7].map((v) => (
            <div key={v} className={`w-3 h-3 rounded-sm ${getColor(v)}`} />
          ))}
          More
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-[3px] mb-1 overflow-hidden">
        {cells.map((_, i) => {
          const label = months.find((m) => m.offset === i)
          return (
            <div key={i} className="w-3 flex-shrink-0 text-[9px] text-muted-foreground/60">
              {label?.label ?? ''}
            </div>
          )
        })}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-[3px] overflow-x-auto">
        {cells.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map(({ date, count }) => (
              <div
                key={date}
                title={`${date}: ${count} activities`}
                className={`heatmap-cell w-3 h-3 ${getColor(count)}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
