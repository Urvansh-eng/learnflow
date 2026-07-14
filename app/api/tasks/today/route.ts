import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTasksDueToday } from '@/lib/services/tasks'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tasks = await getTasksDueToday(session.user.id)
  return NextResponse.json(tasks)
}
