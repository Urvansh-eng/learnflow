'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, GripVertical, Trash2, Edit2, CheckCircle2, Circle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn, formatDate, isOverdue } from '@/lib/utils'

interface Task {
  id: string
  columnId: string
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string | null
  showOnCalendar: boolean
  completedAt?: string | null
}

const priorityConfig = {
  LOW: { label: 'Low', class: 'bg-green-500/15 text-green-400 border-green-500/25' },
  MEDIUM: { label: 'Medium', class: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  HIGH: { label: 'High', class: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
  URGENT: { label: 'Urgent', class: 'bg-red-500/15 text-red-400 border-red-500/25 animate-pulse' },
}

interface Props {
  task: Task
  onEdit?: () => void
  isDragging?: boolean
}

export function KanbanCard({ task, onEdit, isDragging }: Props) {
  const qc = useQueryClient()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/tasks/${task.id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  })

  const completeMutation = useMutation({
    mutationFn: (completedAt: string | null) => 
      fetch(`/api/tasks/${task.id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ completedAt }) 
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  })

  const priority = priorityConfig[task.priority] ?? priorityConfig.MEDIUM
  const overdue = task.dueDate && !task.completedAt ? isOverdue(task.dueDate) : false
  const isCompleted = !!task.completedAt

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'glass rounded-xl p-3 cursor-default group border border-border/50 hover:border-primary/30 transition-all duration-200 hover:glow-primary relative',
        (isDragging || isSortableDragging) && 'opacity-40 scale-105 rotate-1',
        isCompleted && 'opacity-70 grayscale-[0.5]'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <button
                onClick={() => completeMutation.mutate(isCompleted ? null : new Date().toISOString())}
                className={cn('flex-shrink-0 mt-0.5 transition-colors', isCompleted ? 'text-green-500' : 'text-muted-foreground hover:text-primary')}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </button>
              <p className={cn('text-sm font-medium leading-snug', isCompleted && 'line-through text-muted-foreground')}>
                {task.title}
              </p>
            </div>
            {/* Actions - Always visible on small screens, hover on large */}
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 bg-background/50 backdrop-blur-sm sm:bg-transparent rounded-lg">
              <button onClick={onEdit} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => { if (confirm('Delete task?')) deleteMutation.mutate() }}
                className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className={cn('text-xs mt-1 line-clamp-2', isCompleted ? 'text-muted-foreground/50 line-through' : 'text-muted-foreground')}>
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Priority badge */}
            <span className={cn('text-[10px] border rounded-full px-2 py-0.5 font-medium', isCompleted ? 'bg-secondary text-muted-foreground border-transparent' : priority.class)}>
              {priority.label}
            </span>

            {/* Due date */}
            {task.dueDate && (
              <span className={cn('flex items-center gap-1 text-[10px]', overdue ? 'text-red-400' : 'text-muted-foreground')}>
                <Calendar className="w-3 h-3" />
                {overdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
              </span>
            )}

            {/* Calendar indicator */}
            {task.showOnCalendar && (
              <span className={cn('text-[10px] flex items-center gap-1', isCompleted ? 'text-muted-foreground' : 'text-blue-400')}>
                <Calendar className="w-3 h-3" /> Synced
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
