'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { KanbanCard } from './KanbanCard'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  columnId: string
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string | null
  showOnCalendar: boolean
}

interface Column {
  id: string
  name: string
  order: number
  tasks: Task[]
}

interface Props {
  column: Column
  onAddTask: () => void
  onEditTask: (task: Task) => void
  boardId: string
}

const columnColors: Record<string, string> = {
  'To Do': 'border-t-slate-500',
  'In Progress': 'border-t-blue-500',
  'Done': 'border-t-green-500',
  'Review': 'border-t-yellow-500',
  'Blocked': 'border-t-red-500',
}

export function KanbanColumn({ column, onAddTask, onEditTask, boardId }: Props) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState(column.name)
  const [menuOpen, setMenuOpen] = useState(false)

  const { setNodeRef, transform, transition, isOver } = useSortable({
    id: column.id,
    data: { type: 'Column' },
  })

  const style = { transform: CSS.Transform.toString(transform), transition }

  const renameMutation = useMutation({
    mutationFn: (name: string) =>
      fetch(`/api/columns/${column.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['boards'] }); setEditing(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/columns/${column.id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  })

  const topBorderClass = columnColors[column.name] ?? 'border-t-indigo-500'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex-shrink-0 w-72 flex flex-col rounded-2xl glass border-t-2 transition-all duration-200',
        topBorderClass,
        isOver && 'ring-2 ring-primary/50'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        {editing ? (
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) renameMutation.mutate(newName.trim())
              if (e.key === 'Escape') { setEditing(false); setNewName(column.name) }
            }}
            onBlur={() => { if (newName.trim() && newName !== column.name) renameMutation.mutate(newName.trim()); else { setEditing(false); setNewName(column.name) } }}
            className="flex-1 bg-transparent text-sm font-semibold focus:outline-none border-b border-primary"
          />
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">{column.name}</h3>
            <span className="flex-shrink-0 text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
              {column.tasks.length}
            </span>
          </div>
        )}

        <div className="relative ml-2">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl border border-border shadow-xl min-w-[140px] py-1">
              <button
                onClick={() => { setEditing(true); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-secondary transition-colors"
              >
                <Edit2 className="w-3 h-3" /> Rename
              </button>
              <button
                onClick={() => { if (confirm('Delete column and all tasks?')) deleteMutation.mutate(); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={() => onEditTask(task)} />
          ))}
        </SortableContext>
      </div>

      {/* Add task button */}
      <div className="p-3 pt-0">
        <button
          id={`add-task-${column.id}`}
          onClick={onAddTask}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-all duration-200 border border-dashed border-border hover:border-primary/40"
        >
          <Plus className="w-4 h-4" /> Add task
        </button>
      </div>
    </div>
  )
}
