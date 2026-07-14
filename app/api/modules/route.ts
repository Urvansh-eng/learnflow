import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createModule } from '@/lib/services/modules'
import { createModuleSchema } from '@/lib/validations/schemas'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = createModuleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const mod = await createModule(parsed.data)
  return NextResponse.json(mod, { status: 201 })
}
