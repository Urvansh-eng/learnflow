import { prisma } from '@/lib/db'
import type { CreateBoardInput } from '@/lib/validations/schemas'

export async function getBoardsByUser(userId: string) {
  return prisma.board.findMany({
    where: { userId },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getBoard(boardId: string, userId: string) {
  return prisma.board.findFirst({
    where: { id: boardId, userId },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })
}

export async function createBoard(userId: string, data: CreateBoardInput) {
  // Create board with default columns
  return prisma.board.create({
    data: {
      userId,
      name: data.name,
      columns: {
        create: [
          { name: 'To Do', order: 0 },
          { name: 'In Progress', order: 1 },
          { name: 'Done', order: 2 },
        ],
      },
    },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: { tasks: true },
      },
    },
  })
}

export async function updateBoard(boardId: string, userId: string, data: Partial<CreateBoardInput>) {
  return prisma.board.updateMany({
    where: { id: boardId, userId },
    data,
  })
}

export async function deleteBoard(boardId: string, userId: string) {
  return prisma.board.deleteMany({
    where: { id: boardId, userId },
  })
}
