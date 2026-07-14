import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getEvents, createEvent } from '@/lib/services/events'
import { createEventSchema } from '@/lib/validations/schemas'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
  const events = await getEvents(session.user.id, from, to)
  return NextResponse.json(events)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = createEventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const event = await createEvent(session.user.id, parsed.data)
  return NextResponse.json(event, { status: 201 })
}
