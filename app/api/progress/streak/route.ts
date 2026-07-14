import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStreakData, getCurrentStreak } from '@/lib/services/progress'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [countByDay, currentStreak] = await Promise.all([
    getStreakData(session.user.id),
    getCurrentStreak(session.user.id),
  ])
  return NextResponse.json({ countByDay, currentStreak })
}
