import { prisma } from '@/lib/db'
import type { CreateEventInput, UpdateEventInput } from '@/lib/validations/schemas'

export async function getEvents(userId: string, from?: Date, to?: Date) {
  return prisma.event.findMany({
    where: {
      userId,
      ...(from && to && { date: { gte: from, lte: to } }),
    },
    include: {
      sourceTask: { select: { id: true, title: true, priority: true } },
    },
    orderBy: { date: 'asc' },
  })
}

export async function createEvent(userId: string, data: CreateEventInput) {
  return prisma.event.create({
    data: {
      userId,
      title: data.title,
      date: new Date(data.date),
      type: data.type,
      sourceTaskId: data.sourceTaskId ?? null,
    },
  })
}

export async function updateEvent(eventId: string, userId: string, data: UpdateEventInput) {
  return prisma.event.updateMany({
    where: { id: eventId, userId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.type !== undefined && { type: data.type }),
    },
  })
}

export async function deleteEvent(eventId: string, userId: string) {
  return prisma.event.deleteMany({
    where: { id: eventId, userId },
  })
}

/**
 * Called when a Task's showOnCalendar or dueDate changes.
 * Creates, updates, or deletes the linked Event row accordingly.
 */
export async function syncTaskToCalendar(
  taskId: string,
  userId: string,
  task: { showOnCalendar: boolean; dueDate: Date | null; title: string; events?: { id: string }[] }
) {
  const existingEvent = await prisma.event.findFirst({
    where: { sourceTaskId: taskId, userId },
  })

  if (task.showOnCalendar && task.dueDate) {
    if (existingEvent) {
      await prisma.event.update({
        where: { id: existingEvent.id },
        data: { date: task.dueDate, title: task.title },
      })
    } else {
      await prisma.event.create({
        data: {
          userId,
          title: task.title,
          date: task.dueDate,
          type: 'task',
          sourceTaskId: taskId,
        },
      })
    }
  } else if (!task.showOnCalendar && existingEvent) {
    await prisma.event.delete({ where: { id: existingEvent.id } })
  }
}
