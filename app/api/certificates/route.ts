import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCertificates, createCert } from '@/lib/services/certificates'
import { createCertificateSchema } from '@/lib/validations/schemas'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const certs = await getCertificates(session.user.id)
  return NextResponse.json(certs)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = createCertificateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const cert = await createCert(session.user.id, parsed.data)
  return NextResponse.json(cert, { status: 201 })
}
