import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getWeeklySummary } from '@/lib/services/progress'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const summary = await getWeeklySummary(session.user.id)
  return NextResponse.json(summary)
}
