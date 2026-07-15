import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createTask, moveTask, updateTask } from '@/lib/services/tasks'
import { createCourse } from '@/lib/services/courses'
import { toggleModuleComplete } from '@/lib/services/modules'
import { createCert, updateCert } from '@/lib/services/certificates'
import { createResource } from '@/lib/services/resources'
import { createEvent, syncTaskToCalendar } from '@/lib/services/events'
import { getWeeklySummary, getCurrentStreak } from '@/lib/services/progress'
import { prisma } from '@/lib/db'
import { Column, Task } from '@prisma/client'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

const tools = [
  {
    functionDeclarations: [
      {
        name: 'create_task',
        description: 'Create a new task in the Kanban board',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Task title' },
            columnName: { type: 'STRING', description: 'Column name like "To Do", "In Progress", "Done"' },
            priority: { type: 'STRING', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], description: 'Task priority' },
            dueDate: { type: 'STRING', description: 'ISO date string for due date, optional' },
            description: { type: 'STRING', description: 'Task description, optional' },
            showOnCalendar: { type: 'BOOLEAN', description: 'Whether to show this task on the calendar, optional' },
          },
          required: ['title'],
        },
      },
      {
        name: 'move_task',
        description: 'Move a task to a different column by task title and target column name',
        parameters: {
          type: 'OBJECT',
          properties: {
            taskTitle: { type: 'STRING', description: 'Title of the task to move (partial match ok)' },
            newColumnName: { type: 'STRING', description: 'Target column name' },
          },
          required: ['taskTitle', 'newColumnName'],
        },
      },
      {
        name: 'create_course',
        description: 'Add a new course to track',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            platform: { type: 'STRING', description: 'e.g. "Udemy", "Code with Harry"' },
            category: { type: 'STRING', description: 'e.g. "Web Dev", "DSA"' },
          },
          required: ['title'],
        },
      },
      {
        name: 'update_course_progress',
        description: 'Mark a course module as completed or not completed',
        parameters: {
          type: 'OBJECT',
          properties: {
            courseTitle: { type: 'STRING', description: 'Course title (partial match)' },
            moduleTitle: { type: 'STRING', description: 'Module title (partial match)' },
            completed: { type: 'BOOLEAN' },
          },
          required: ['courseTitle', 'moduleTitle', 'completed'],
        },
      },
      {
        name: 'add_certificate',
        description: 'Add a new certificate to track',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            provider: { type: 'STRING' },
            resumeUrl: { type: 'STRING' },
            status: { type: 'STRING', enum: ['not_started', 'in_progress', 'completed'] },
            targetDate: { type: 'STRING', description: 'ISO date string, optional' },
          },
          required: ['title'],
        },
      },
      {
        name: 'save_resource',
        description: 'Save a link/resource to the vault',
        parameters: {
          type: 'OBJECT',
          properties: {
            url: { type: 'STRING' },
            title: { type: 'STRING' },
            type: { type: 'STRING', enum: ['video', 'article', 'doc', 'other'] },
            tags: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Tags for the resource' },
          },
          required: ['url', 'title'],
        },
      },
      {
        name: 'create_calendar_event',
        description: 'Create a calendar event or meeting',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            date: { type: 'STRING', description: 'ISO datetime string' },
            type: { type: 'STRING', enum: ['meeting', 'task'] },
          },
          required: ['title', 'date'],
        },
      },
      {
        name: 'query_progress',
        description: 'Get a summary of the user\'s progress including streaks, weekly stats, and course progress',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
    ],
  },
]

async function executeTool(userId: string, name: string, args: Record<string, any>) {
  switch (name) {
    case 'create_task': {
      // Find the first board's matching column for this user
      const board = await prisma.board.findFirst({
        where: { userId },
        include: { columns: true },
      })
      if (!board) return { error: 'No board found. Create a board first.' }
      let column = board.columns.find((c: Column) =>
        c.name.toLowerCase().includes((args.columnName ?? 'to do').toLowerCase())
      ) ?? board.columns[0]
      const task = await createTask({
        columnId: column.id,
        title: args.title,
        description: args.description,
        priority: args.priority ?? 'MEDIUM',
        dueDate: args.dueDate ?? null,
        showOnCalendar: args.showOnCalendar ?? false,
      })
      if (task.showOnCalendar && task.dueDate) {
        await syncTaskToCalendar(task.id, userId, task)
      }
      return { success: true, task: { id: task.id, title: task.title } }
    }

    case 'move_task': {
      const boards = await prisma.board.findMany({
        where: { userId },
        include: { columns: { include: { tasks: true } } },
      })
      let foundTask: any = null
      let targetColumn: any = null
      for (const board of boards) {
        for (const col of board.columns) {
          if (!foundTask) {
            foundTask = col.tasks.find((t: Task) => t.title.toLowerCase().includes(args.taskTitle.toLowerCase()))
          }
          if (!targetColumn && col.name.toLowerCase().includes(args.newColumnName.toLowerCase())) {
            targetColumn = col
          }
        }
      }
      if (!foundTask) return { error: `Task matching "${args.taskTitle}" not found` }
      if (!targetColumn) return { error: `Column matching "${args.newColumnName}" not found` }
      await moveTask({ taskId: foundTask.id, newColumnId: targetColumn.id })
      return { success: true, message: `Moved "${foundTask.title}" to "${targetColumn.name}"` }
    }

    case 'create_course': {
      const course = await createCourse(userId, { title: args.title, platform: args.platform, category: args.category })
      return { success: true, course: { id: course.id, title: course.title } }
    }

    case 'update_course_progress': {
      const course = await prisma.course.findFirst({
        where: { userId, title: { contains: args.courseTitle, mode: 'insensitive' } },
        include: { modules: true },
      })
      if (!course) return { error: `Course matching "${args.courseTitle}" not found` }
      const mod = course.modules.find((m) => m.title.toLowerCase().includes(args.moduleTitle.toLowerCase()))
      if (!mod) return { error: `Module matching "${args.moduleTitle}" not found` }
      await toggleModuleComplete(mod.id, userId, args.completed)
      return { success: true, message: `Module "${mod.title}" marked as ${args.completed ? 'completed' : 'incomplete'}` }
    }

    case 'add_certificate': {
      const cert = await createCert(userId, {
        title: args.title,
        provider: args.provider,
        status: args.status ?? 'not_started',
        resumeUrl: args.resumeUrl,
        targetDate: args.targetDate,
      })
      return { success: true, cert: { id: cert.id, title: cert.title } }
    }

    case 'save_resource': {
      const resource = await createResource(userId, {
        url: args.url,
        title: args.title,
        type: args.type ?? 'other',
        tags: args.tags ?? [],
        courseId: null,
      })
      return { success: true, resource: { id: resource.id, title: resource.title } }
    }

    case 'create_calendar_event': {
      const event = await createEvent(userId, {
        title: args.title,
        date: args.date,
        type: args.type ?? 'meeting',
      })
      return { success: true, event: { id: event.id, title: event.title } }
    }

    case 'query_progress': {
      const [summary, streak] = await Promise.all([getWeeklySummary(userId), getCurrentStreak(userId)])
      return { summary, currentStreak: streak }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages } = await req.json() as { messages: { role: string; content: string }[] }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: `You are a smart personal productivity assistant built into a Learning & Task Management app.
You help the user manage tasks, courses, certificates, resources, and calendar events.
You have access to tools to create, update, and query data in the app.

Language style: If the user writes in Hinglish (mixed Hindi and English in Latin script, like "ek task banao" or "mera progress kya hai"), you MUST respond in Hinglish. If they write in plain English, respond in plain English. Mirror their language style exactly.

When executing an action, always confirm what you did. Be concise and friendly.
If you cannot complete something, explain clearly why and what they can do instead.
Today's date is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
    tools: tools as any,
    toolConfig: { function_calling_config: { mode: 'AUTO' } } as any,
  })

  try {
    const chat = model.startChat({
      history: messages.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    })

    const lastMessage = messages[messages.length - 1]
    let response = await chat.sendMessage(lastMessage.content)

    // Handle tool calls in a loop (Claude-style multi-step)
    let iterations = 0
    while (iterations < 5) {
      const candidate = response.response.candidates?.[0]
      const parts = candidate?.content?.parts ?? []
      const toolCallPart = parts.find((p: any) => p.functionCall)

      if (!toolCallPart?.functionCall) break

      const { name, args } = toolCallPart.functionCall
      const result = await executeTool(session.user.id, name, args as Record<string, any>)

      response = await chat.sendMessage([
        { functionResponse: { name, response: result } },
      ])
      iterations++
    }

    const text = response.response.text()
    return NextResponse.json({ message: text })
  } catch (error: any) {
    console.error('================ AI ASSISTANT ERROR ================')
    console.error(error)
    console.error('====================================================')
    return NextResponse.json({ error: 'AI Error', details: error?.message || String(error) }, { status: 500 })
  }
}
