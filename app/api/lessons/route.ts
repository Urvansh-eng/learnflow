import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createLesson } from '@/lib/services/lessons'
import { createLessonSchema } from '@/lib/validations/schemas'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = createLessonSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const lesson = await createLesson(parsed.data)
  return NextResponse.json(lesson, { status: 201 })
}
