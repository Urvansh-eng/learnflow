import { prisma } from '@/lib/db'
import type { CreateLessonInput, UpdateLessonInput } from '@/lib/validations/schemas'

export async function createLesson(data: CreateLessonInput) {
  const maxOrder = await prisma.lesson.findFirst({
    where: { moduleId: data.moduleId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  return prisma.lesson.create({
    data: {
      moduleId: data.moduleId,
      title: data.title,
      url: data.url ?? null,
      order: data.order ?? (maxOrder?.order ?? -1) + 1,
      notes: data.notes ?? null,
    },
  })
}

export async function updateLesson(lessonId: string, data: UpdateLessonInput) {
  return prisma.lesson.update({
    where: { id: lessonId },
    data,
  })
}

export async function toggleLessonComplete(lessonId: string, userId: string, completed: boolean) {
  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: { completed },
  })

  // Log activity for streak tracking if completed
  if (completed) {
    await prisma.activityLog.create({
      data: { userId, type: 'lesson_complete', refId: lessonId },
    })
  }

  return lesson
}

export async function deleteLesson(lessonId: string) {
  return prisma.lesson.delete({ where: { id: lessonId } })
}

export async function reorderLessons(moduleId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    prisma.lesson.update({ where: { id }, data: { order: index } })
  )
  return prisma.$transaction(updates)
}
