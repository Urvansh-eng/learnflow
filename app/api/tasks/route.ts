import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createTask } from '@/lib/services/tasks'
import { syncTaskToCalendar } from '@/lib/services/events'
import { createTaskSchema } from '@/lib/validations/schemas'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const task = await createTask(parsed.data)

  if (task.showOnCalendar && task.dueDate) {
    await syncTaskToCalendar(task.id, session.user.id, task)
  }

  return NextResponse.json(task, { status: 201 })
}
