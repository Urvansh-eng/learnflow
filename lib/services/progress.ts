import { prisma } from '@/lib/db'
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'
import { computeProgress } from './courses'

export async function getStreakData(userId: string, days = 365) {
  const since = subDays(new Date(), days)

  const logs = await prisma.activityLog.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: 'asc' },
  })

  // Group by day
  const countByDay: Record<string, number> = {}
  for (const log of logs) {
    const day = log.date.toISOString().split('T')[0]
    countByDay[day] = (countByDay[day] ?? 0) + 1
  }

  return countByDay
}

export async function getCurrentStreak(userId: string): Promise<number> {
  const today = startOfDay(new Date())
  let streak = 0
  let current = today

  while (true) {
    const count = await prisma.activityLog.count({
      where: {
        userId,
        date: { gte: startOfDay(current), lte: endOfDay(current) },
      },
    })
    if (count === 0) break
    streak++
    current = subDays(current, 1)
  }

  return streak
}

export async function getWeeklySummary(userId: string) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  const [tasksCompleted, lessonsCompleted, resourcesSaved, courses] = await Promise.all([
    // Tasks moved to "Done"-like columns this week — approximate by completedAt
    prisma.activityLog.count({
      where: { userId, type: 'task_complete', date: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.activityLog.count({
      where: { userId, type: 'lesson_complete', date: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.activityLog.count({
      where: { userId, type: 'resource_saved', date: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.course.findMany({
      where: { userId },
      include: { modules: { include: { lessons: true } } },
    }),
  ])

  const courseProgress = courses.map((c) => ({
    id: c.id,
    title: c.title,
    progress: computeProgress(c.modules),
  }))

  return { tasksCompleted, lessonsCompleted, resourcesSaved, courseProgress }
}

export async function globalSearch(userId: string, query: string) {
  const q = { contains: query, mode: 'insensitive' as const }

  const [tasks, courses, certificates, resources] = await Promise.all([
    prisma.task.findMany({
      where: { column: { board: { userId } }, OR: [{ title: q }, { description: q }] },
      include: { column: { select: { name: true, board: { select: { name: true } } } } },
      take: 10,
    }),
    prisma.course.findMany({
      where: { userId, OR: [{ title: q }, { platform: q }, { category: q }] },
      take: 10,
    }),
    prisma.certificate.findMany({
      where: { userId, OR: [{ title: q }, { provider: q }] },
      take: 10,
    }),
    prisma.resource.findMany({
      where: { userId, OR: [{ title: q }, { url: q }] },
      take: 10,
    }),
  ])

  return { tasks, courses, certificates, resources }
}
