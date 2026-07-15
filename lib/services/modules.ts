import { prisma } from '@/lib/db'
import type { CreateModuleInput, UpdateModuleInput } from '@/lib/validations/schemas'

export async function createModule(data: CreateModuleInput) {
  const maxOrder = await prisma.courseModule.findFirst({
    where: { courseId: data.courseId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  return prisma.courseModule.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      order: data.order ?? (maxOrder?.order ?? -1) + 1,
    },
  })
}

export async function updateModule(moduleId: string, data: UpdateModuleInput) {
  return prisma.courseModule.update({
    where: { id: moduleId },
    data,
  })
}

export async function deleteModule(moduleId: string) {
  return prisma.courseModule.delete({ where: { id: moduleId } })
}

export async function reorderModules(courseId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    prisma.courseModule.update({ where: { id }, data: { order: index } })
  )
  return prisma.$transaction(updates)
}
