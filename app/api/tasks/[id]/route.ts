import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTask, updateTask, moveTask, deleteTask } from '@/lib/services/tasks'
import { updateTaskSchema, moveTaskSchema } from '@/lib/validations/schemas'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const task = await getTask(id)
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(task)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  // Move task operation
  if (body.newColumnId) {
    const parsed = moveTaskSchema.safeParse({ taskId: id, newColumnId: body.newColumnId })
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const task = await moveTask(parsed.data)
    return NextResponse.json(task)
  }

  // Update task fields
  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const task = await updateTask(id, session.user.id, parsed.data)
  return NextResponse.json(task)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteTask(id)
  return NextResponse.json({ success: true })
}
