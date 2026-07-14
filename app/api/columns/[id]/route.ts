import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateColumn, deleteColumn, reorderColumns } from '@/lib/services/columns'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  // Support both rename and reorder-all operations
  if (body.orderedIds && Array.isArray(body.orderedIds)) {
    await reorderColumns(body.boardId, body.orderedIds)
    return NextResponse.json({ success: true })
  }
  await updateColumn(id, body)
  return NextResponse.json({ success: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteColumn(id)
  return NextResponse.json({ success: true })
}
