'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, GripVertical, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
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
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/tasks/${task.id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  })

  const priority = priorityConfig[task.priority] ?? priorityConfig.MEDIUM
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'glass rounded-xl p-3 cursor-default group border border-border/50 hover:border-primary/30 transition-all duration-200 hover:glow-primary',
        (isDragging || isSortableDragging) && 'opacity-40 scale-105 rotate-1'
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
            <p className="text-sm font-medium leading-snug">{task.title}</p>
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Priority badge */}
            <span className={cn('text-[10px] border rounded-full px-2 py-0.5 font-medium', priority.class)}>
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
              <span className="text-[10px] text-blue-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Synced
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
