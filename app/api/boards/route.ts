import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getBoardsByUser, createBoard } from '@/lib/services/boards'
import { createBoardSchema } from '@/lib/validations/schemas'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const boards = await getBoardsByUser(session.user.id)
  return NextResponse.json(boards)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createBoardSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const board = await createBoard(session.user.id, parsed.data)
  return NextResponse.json(board, { status: 201 })
}
