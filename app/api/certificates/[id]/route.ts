import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateCert, deleteCert } from '@/lib/services/certificates'
import { updateCertificateSchema } from '@/lib/validations/schemas'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const parsed = updateCertificateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  await updateCert(id, session.user.id, parsed.data)
  return NextResponse.json({ success: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteCert(id, session.user.id)
  return NextResponse.json({ success: true })
}
