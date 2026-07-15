import { z } from 'zod'

// ─── Board / Column / Task ────────────────────────────────────────────────────

export const createBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(100),
})

export const createColumnSchema = z.object({
  boardId: z.string().cuid(),
  name: z.string().min(1, 'Column name is required').max(100),
})

export const createTaskSchema = z.object({
  columnId: z.string().cuid(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional().nullable(),
  showOnCalendar: z.boolean().default(false),
  completedAt: z.string().datetime().optional().nullable(),
})

export const updateTaskSchema = createTaskSchema.partial().omit({ columnId: true })

export const moveTaskSchema = z.object({
  taskId: z.string().cuid(),
  newColumnId: z.string().cuid(),
})

export type CreateBoardInput = z.infer<typeof createBoardSchema>
export type CreateColumnInput = z.infer<typeof createColumnSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type MoveTaskInput = z.infer<typeof moveTaskSchema>

// ─── Course / Module ──────────────────────────────────────────────────────────

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Course title is required').max(200),
  platform: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
})

export const createModuleSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(1, 'Module title is required').max(200),
  order: z.number().int().min(0).optional(),
  resumeUrl: z.string().url().optional().nullable(),
  notes: z.string().optional(),
})

export const updateModuleSchema = createModuleSchema.partial().omit({ courseId: true })

export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type CreateModuleInput = z.infer<typeof createModuleSchema>
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>

// ─── Certificate ──────────────────────────────────────────────────────────────

export const createCertificateSchema = z.object({
  title: z.string().min(1, 'Certificate title is required').max(200),
  provider: z.string().max(100).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
  resumeUrl: z.string().url().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
})

export const updateCertificateSchema = createCertificateSchema.partial()

export type CreateCertificateInput = z.infer<typeof createCertificateSchema>
export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>

// ─── Resource ─────────────────────────────────────────────────────────────────

export const createResourceSchema = z.object({
  type: z.enum(['video', 'article', 'doc', 'other']).default('other'),
  title: z.string().min(1, 'Title is required').max(200),
  url: z.string().url('Must be a valid URL'),
  tags: z.array(z.string().max(50)).default([]),
  courseId: z.string().cuid().optional().nullable(),
})

export const updateResourceSchema = createResourceSchema.partial()

export type CreateResourceInput = z.infer<typeof createResourceSchema>
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>

// ─── Event ────────────────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(200),
  date: z.string().datetime(),
  type: z.enum(['meeting', 'task']).default('meeting'),
  sourceTaskId: z.string().cuid().optional().nullable(),
})

export const updateEventSchema = createEventSchema.partial()

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
