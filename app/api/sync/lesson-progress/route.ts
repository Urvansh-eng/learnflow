import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { syncToken, url, completed } = await req.json()

    if (!syncToken || !url || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }

    // Find the user by syncToken
    const user = await prisma.user.findUnique({
      where: { syncToken },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid sync token' }, { status: 401 })
    }

    // Find the lesson by URL belonging to a course owned by this user
    // Since we need to ensure the lesson belongs to the user's course, we can join
    const lesson = await prisma.lesson.findFirst({
      where: {
        url: url,
        module: {
          course: {
            userId: user.id,
          },
        },
      },
    })

    if (!lesson) {
      // Also try matching just by the base url or similar if exact matching is too strict,
      // but for now strict matching is safest.
      return NextResponse.json({ error: 'Lesson not found for this URL' }, { status: 404 })
    }

    // Update lesson
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        completed: completed,
        lastSyncedAt: new Date(),
      },
    })

    // Log activity if completed
    if (completed) {
      await prisma.activityLog.create({
        data: { userId: user.id, type: 'lesson_complete_sync', refId: lesson.id },
      })
    }

    return NextResponse.json({ success: true, lessonId: lesson.id })
  } catch (error) {
    console.error('Lesson sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
