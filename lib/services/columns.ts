import { prisma } from '@/lib/db'
import type { CreateColumnInput } from '@/lib/validations/schemas'

export async function createColumn(data: CreateColumnInput) {
  const maxOrder = await prisma.column.findFirst({
    where: { boardId: data.boardId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  return prisma.column.create({
    data: {
      boardId: data.boardId,
      name: data.name,
      order: (maxOrder?.order ?? -1) + 1,
    },
    include: { tasks: true },
  })
}

export async function updateColumn(columnId: string, data: Partial<{ name: string; order: number }>) {
  return prisma.column.update({
    where: { id: columnId },
    data,
  })
}

export async function deleteColumn(columnId: string) {
  return prisma.column.delete({ where: { id: columnId } })
}

export async function reorderColumns(boardId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    prisma.column.update({
      where: { id },
      data: { order: index },
    })
  )
  return prisma.$transaction(updates)
}
