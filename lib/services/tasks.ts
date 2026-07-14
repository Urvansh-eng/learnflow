import { prisma } from '@/lib/db'
import type { CreateTaskInput, UpdateTaskInput, MoveTaskInput } from '@/lib/validations/schemas'
import { syncTaskToCalendar } from './events'

export async function getTask(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: { events: true },
  })
}

export async function createTask(data: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      columnId: data.columnId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      showOnCalendar: data.showOnCalendar ?? false,
    },
    include: { events: true },
  })

  if (task.showOnCalendar && task.dueDate) {
    // We need userId — caller must handle this
    // syncTaskToCalendar is called by the API route with userId
  }

  return task
}

export async function updateTask(taskId: string, userId: string, data: UpdateTaskInput) {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    include: { events: true },
  })
  if (!existing) throw new Error('Task not found')

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.showOnCalendar !== undefined && { showOnCalendar: data.showOnCalendar }),
    },
    include: { events: true },
  })

  // Sync calendar event
  await syncTaskToCalendar(taskId, userId, updated)

  return updated
}

export async function moveTask(data: MoveTaskInput) {
  return prisma.task.update({
    where: { id: data.taskId },
    data: { columnId: data.newColumnId },
  })
}

export async function deleteTask(taskId: string) {
  return prisma.task.delete({ where: { id: taskId } })
}

export async function getTasksDueToday(userId: string) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  return prisma.task.findMany({
    where: {
      column: {
        board: { userId },
      },
      dueDate: { gte: start, lte: end },
    },
    include: {
      column: { select: { name: true } },
    },
    orderBy: { priority: 'asc' },
  })
}
