import { prisma } from '@/lib/db'
import type { CreateResourceInput, UpdateResourceInput } from '@/lib/validations/schemas'

export async function getResources(
  userId: string,
  filters?: {
    type?: string
    tag?: string
    courseId?: string
    search?: string
  }
) {
  return prisma.resource.findMany({
    where: {
      userId,
      ...(filters?.type && { type: filters.type as any }),
      ...(filters?.courseId && { courseId: filters.courseId }),
      ...(filters?.tag && { tags: { has: filters.tag } }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { url: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      course: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createResource(userId: string, data: CreateResourceInput) {
  const resource = await prisma.resource.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      url: data.url,
      tags: data.tags,
      courseId: data.courseId ?? null,
    },
    include: { course: { select: { id: true, title: true } } },
  })

  await prisma.activityLog.create({
    data: { userId, type: 'resource_saved', refId: resource.id },
  })

  return resource
}

export async function updateResource(resourceId: string, userId: string, data: UpdateResourceInput) {
  return prisma.resource.updateMany({
    where: { id: resourceId, userId },
    data,
  })
}

export async function deleteResource(resourceId: string, userId: string) {
  return prisma.resource.deleteMany({
    where: { id: resourceId, userId },
  })
}

export async function getAllTags(userId: string): Promise<string[]> {
  const resources = await prisma.resource.findMany({
    where: { userId },
    select: { tags: true },
  })
  const allTags = resources.flatMap((r) => r.tags)
  return [...new Set(allTags)].sort()
}
