import { prisma } from '@/lib/db'
import type { CreateCourseInput } from '@/lib/validations/schemas'

export async function getCourses(userId: string) {
  const courses = await prisma.course.findMany({
    where: { userId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } }
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return courses.map((course) => ({
    ...course,
    progress: computeProgress(course.modules),
    nextLesson: getNextLesson(course.modules),
  }))
}

export async function getCourse(courseId: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, userId },
    include: {
      modules: { 
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } }
      },
      resources: true,
    },
  })
  if (!course) return null
  return {
    ...course,
    progress: computeProgress(course.modules),
    nextLesson: getNextLesson(course.modules),
  }
}

export function computeProgress(modules: { lessons: { completed: boolean }[] }[]): number {
  let totalLessons = 0
  let completedLessons = 0
  for (const mod of modules) {
    totalLessons += mod.lessons.length
    completedLessons += mod.lessons.filter((l) => l.completed).length
  }
  if (totalLessons === 0) return 0
  return Math.round((completedLessons / totalLessons) * 100)
}

function getNextLesson(modules: { lessons: any[] }[]) {
  for (const mod of modules) {
    const incomplete = mod.lessons.find((l) => !l.completed)
    if (incomplete) return incomplete
  }
  return null
}

export async function createCourse(userId: string, data: CreateCourseInput & { url?: string }) {
  return prisma.course.create({
    data: { userId, ...data },
    include: { modules: { include: { lessons: true } } },
  })
}

export async function updateCourse(courseId: string, userId: string, data: Partial<CreateCourseInput & { url?: string }>) {
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
