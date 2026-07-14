import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCourses, createCourse } from '@/lib/services/courses'
import { createCourseSchema } from '@/lib/validations/schemas'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const courses = await getCourses(session.user.id)
  return NextResponse.json(courses)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = createCourseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const course = await createCourse(session.user.id, parsed.data)
  return NextResponse.json(course, { status: 201 })
}
