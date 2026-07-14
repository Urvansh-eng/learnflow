import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getResources, createResource, getAllTags } from '@/lib/services/resources'
import { createResourceSchema } from '@/lib/validations/schemas'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const filters = {
    type: searchParams.get('type') ?? undefined,
    tag: searchParams.get('tag') ?? undefined,
    courseId: searchParams.get('courseId') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  }
  const resources = await getResources(session.user.id, filters)
  return NextResponse.json(resources)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = createResourceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const resource = await createResource(session.user.id, parsed.data)
  return NextResponse.json(resource, { status: 201 })
}
