import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateModule, toggleModuleComplete, deleteModule } from '@/lib/services/modules'
import { updateModuleSchema } from '@/lib/validations/schemas'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  // Toggle completion shortcut
  if (typeof body.completed === 'boolean' && Object.keys(body).length === 1) {
    const mod = await toggleModuleComplete(id, session.user.id, body.completed)
    return NextResponse.json(mod)
  }

  const parsed = updateModuleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const mod = await updateModule(id, parsed.data)
  return NextResponse.json(mod)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteModule(id)
  return NextResponse.json({ success: true })
}
