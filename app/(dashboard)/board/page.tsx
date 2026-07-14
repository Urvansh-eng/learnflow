'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Loader2 } from 'lucide-react'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { KanbanCard } from '@/components/kanban/KanbanCard'
import { TaskModal } from '@/components/kanban/TaskModal'

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
  boardId: string
  name: string
  order: number
  tasks: Task[]
}

interface Board {
  id: string
  name: string
  columns: Column[]
}

export default function BoardPage() {
  const qc = useQueryClient()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultColumnId, setDefaultColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const { data: boards = [], isLoading } = useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: () => fetch('/api/boards').then((r) => r.json()),
  })

  const createBoardMutation = useMutation({
    mutationFn: (name: string) =>
      fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  })

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, newColumnId }: { taskId: string; newColumnId: string }) =>
      fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newColumnId }),
      }),
  })

  const board = boards[0] // Use first board; can be extended for multi-board later

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = board?.columns.flatMap((c) => c.tasks).find((t) => t.id === active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null)
      const { active, over } = event
      if (!over || !board) return

      const taskId = active.id as string
      // Find source and target columns
      const sourceColumn = board.columns.find((c) => c.tasks.some((t) => t.id === taskId))
      let targetColumnId = over.id as string

      // If dropped over a task, get its column
      const overTask = board.columns.flatMap((c) => c.tasks).find((t) => t.id === over.id)
      if (overTask) {
        targetColumnId = board.columns.find((c) => c.tasks.some((t) => t.id === over.id))?.id ?? targetColumnId
      }

      if (!sourceColumn) return
      if (sourceColumn.id === targetColumnId) return // Same column, no change for now

      moveTaskMutation.mutate({ taskId, newColumnId: targetColumnId })
      qc.invalidateQueries({ queryKey: ['boards'] })
    },
    [board, moveTaskMutation, qc]
  )

  const handleAddTask = (columnId: string) => {
    setDefaultColumnId(columnId)
    setEditingTask(null)
    setTaskModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
          <Plus className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">No board yet</h2>
          <p className="text-muted-foreground text-sm mt-1">Create your first Kanban board to get started</p>
        </div>
        <button
          id="create-board-btn"
          onClick={() => createBoardMutation.mutate('My Board')}
          disabled={createBoardMutation.isPending}
          className="gradient-bg text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center gap-2"
        >
          {createBoardMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Board
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{board.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {board.columns.reduce((acc, col) => acc + col.tasks.length, 0)} tasks across {board.columns.length} columns
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
          <SortableContext
            items={board.columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onAddTask={() => handleAddTask(column.id)}
                onEditTask={handleEditTask}
                boardId={board.id}
              />
            ))}
          </SortableContext>

          {/* Add column button */}
          <AddColumnButton boardId={board.id} />
        </div>

        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        open={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null) }}
        defaultColumnId={defaultColumnId}
        task={editingTask}
        columns={board.columns}
      />
    </div>
  )
}

function AddColumnButton({ boardId }: { boardId: string }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (columnName: string) =>
      fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, name: columnName }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['boards'] }); setAdding(false); setName('') },
  })

  if (!adding) {
    return (
      <button
        id="add-column-btn"
        onClick={() => setAdding(true)}
        className="flex-shrink-0 w-72 h-14 glass rounded-2xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all duration-200 self-start"
      >
        <Plus className="w-4 h-4" /> Add column
      </button>
    )
  }

  return (
    <div className="flex-shrink-0 w-72 glass rounded-2xl p-3 self-start space-y-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) mutation.mutate(name.trim()) }}
        placeholder="Column name"
        className="w-full bg-secondary/50 rounded-xl px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { if (name.trim()) mutation.mutate(name.trim()) }}
          disabled={mutation.isPending || !name.trim()}
          className="flex-1 gradient-bg text-white rounded-lg py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-60"
        >
          {mutation.isPending ? 'Adding...' : 'Add'}
        </button>
        <button onClick={() => { setAdding(false); setName('') }} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">
          Cancel
        </button>
      </div>
    </div>
  )
}
