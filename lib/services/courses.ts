import { prisma } from '@/lib/db'
import type { CreateCourseInput } from '@/lib/validations/schemas'

export async function getCourses(userId: string) {
  const courses = await prisma.course.findMany({
    where: { userId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return courses.map((course) => ({
    ...course,
    progress: computeProgress(course.modules),
    nextModule: course.modules.find((m) => !m.completed) ?? null,
  }))
}

export async function getCourse(courseId: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, userId },
    include: {
      modules: { orderBy: { order: 'asc' } },
      resources: true,
    },
  })
  if (!course) return null
  return {
    ...course,
    progress: computeProgress(course.modules),
    nextModule: course.modules.find((m) => !m.completed) ?? null,
  }
}

export function computeProgress(modules: { completed: boolean }[]): number {
  if (modules.length === 0) return 0
  const completed = modules.filter((m) => m.completed).length
  return Math.round((completed / modules.length) * 100)
}

export async function createCourse(userId: string, data: CreateCourseInput) {
  return prisma.course.create({
    data: { userId, ...data },
    include: { modules: true },
  })
}

export async function updateCourse(courseId: string, userId: string, data: Partial<CreateCourseInput>) {
  return prisma.course.updateMany({
    where: { id: courseId, userId },
    data,
  })
}

export async function deleteCourse(courseId: string, userId: string) {
  return prisma.course.deleteMany({
    where: { id: courseId, userId },
  })
}
