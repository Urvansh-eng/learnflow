import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createColumn } from '@/lib/services/columns'
import { createColumnSchema } from '@/lib/validations/schemas'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = createColumnSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const column = await createColumn(parsed.data)
  return NextResponse.json(column, { status: 201 })
}
