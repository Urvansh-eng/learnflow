'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().optional(),
  showOnCalendar: z.boolean(),
  columnId: z.string(),
})
type FormData = z.infer<typeof schema>

interface Task {
  id: string
  columnId: string
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string | null
  showOnCalendar: boolean
}

interface Column { id: string; name: string }

interface Props {
  open: boolean
  onClose: () => void
  defaultColumnId?: string | null
  task?: Task | null
  columns: Column[]
}

export function TaskModal({ open, onClose, defaultColumnId, task, columns }: Props) {
  const qc = useQueryClient()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      showOnCalendar: false,
      columnId: defaultColumnId ?? columns[0]?.id ?? '',
    },
  })

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        showOnCalendar: task.showOnCalendar,
        columnId: task.columnId,
      })
    } else {
      reset({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        showOnCalendar: false,
        columnId: defaultColumnId ?? columns[0]?.id ?? '',
      })
    }
  }, [task, defaultColumnId, columns, reset])

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        }),
      }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['boards'] }); onClose() },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch(`/api/tasks/${task!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        }),
      }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['boards'] }); onClose() },
  })

  const onSubmit = (data: FormData) => {
    if (task) updateMutation.mutate(data)
    else createMutation.mutate(data)
  }

  const showOnCalendar = watch('showOnCalendar')
  const isPending = createMutation.isPending || updateMutation.isPending

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-2xl border border-border shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="font-semibold text-lg">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Title *</label>
            <input
              {...register('title')}
              id="task-title-input"
              placeholder="What needs to be done?"
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Add more details..."
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Row: priority + column */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Priority</label>
              <select
                {...register('priority')}
                className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Column</label>
              <select
                {...register('columnId')}
                className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Due Date</label>
            <input
              {...register('dueDate')}
              type="date"
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Show on calendar toggle */}
          <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Show on Calendar</p>
              <p className="text-xs text-muted-foreground mt-0.5">Syncs due date to your calendar</p>
            </div>
            <button
              type="button"
              onClick={() => setValue('showOnCalendar', !showOnCalendar)}
              className={cn(
                'w-11 h-6 rounded-full transition-all duration-200 relative',
                showOnCalendar ? 'bg-primary' : 'bg-secondary'
              )}
            >
              <div className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200',
                showOnCalendar ? 'left-5' : 'left-0.5'
              )} />
            </button>
          </div>

          {/* Submit */}
          <button
            id="task-submit-btn"
            type="submit"
            disabled={isPending}
            className="w-full gradient-bg text-white rounded-xl py-2.5 font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  )
}
