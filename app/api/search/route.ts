import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { globalSearch } from '@/lib/services/progress'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  if (!q || q.trim().length < 2) return NextResponse.json({ tasks: [], courses: [], certificates: [], resources: [] })
  const results = await globalSearch(session.user.id, q.trim())
  return NextResponse.json(results)
}
