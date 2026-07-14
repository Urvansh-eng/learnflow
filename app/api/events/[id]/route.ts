import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateEvent, deleteEvent } from '@/lib/services/events'
import { updateEventSchema } from '@/lib/validations/schemas'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const parsed = updateEventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  await updateEvent(id, session.user.id, parsed.data)
  return NextResponse.json({ success: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteEvent(id, session.user.id)
  return NextResponse.json({ success: true })
}
