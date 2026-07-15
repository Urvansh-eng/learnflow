import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deleteLesson, toggleLessonComplete, updateLesson } from '@/lib/services/lessons'
import { updateLessonSchema } from '@/lib/validations/schemas'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  
  if (typeof body.completed === 'boolean') {
    const lesson = await toggleLessonComplete(id, session.user.id, body.completed)
    return NextResponse.json(lesson)
  }

  const parsed = updateLessonSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const lesson = await updateLesson(id, parsed.data)
  return NextResponse.json(lesson)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteLesson(id)
  return NextResponse.json({ success: true })
}
