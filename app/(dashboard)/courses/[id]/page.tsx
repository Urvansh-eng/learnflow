'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, ExternalLink, Trash2, CheckCircle, Circle, Loader2, GripVertical } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Lesson {
  id: string
  title: string
  url?: string | null
  completed: boolean
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  url?: string | null
  platform?: string
  category?: string
  progress: number
  modules: Module[]
}

const moduleSchema = z.object({
  title: z.string().min(1),
})

const lessonSchema = z.object({
  title: z.string().min(1),
  url: z.string().url().optional().or(z.literal('')),
})

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const courseId = params.id as string

  const [addModuleOpen, setAddModuleOpen] = useState(false)
  const [addLessonModuleId, setAddLessonModuleId] = useState<string | null>(null)

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}`)
      if (!res.ok) {
        if (res.status === 404) router.push('/courses')
        throw new Error('Failed to load course')
      }
      return res.json()
    },
  })

  const moduleForm = useForm({ resolver: zodResolver(moduleSchema) })
  const lessonForm = useForm({ resolver: zodResolver(lessonSchema) })

  const createModuleMutation = useMutation({
    mutationFn: (data: any) =>
      fetch('/api/modules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, ...data }) }).then(async (r) => { if (!r.ok) throw new Error(await r.text()); return r.json() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course', courseId] }); qc.invalidateQueries({ queryKey: ['courses'] }); setAddModuleOpen(false); moduleForm.reset() },
    onError: (e) => alert('Failed to add module: ' + e.message)
  })

  const createLessonMutation = useMutation({
    mutationFn: ({ moduleId, ...data }: any) =>
      fetch('/api/lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId, ...data, url: data.url || null }) }).then(async (r) => { if (!r.ok) throw new Error(await r.text()); return r.json() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course', courseId] }); qc.invalidateQueries({ queryKey: ['courses'] }); setAddLessonModuleId(null); lessonForm.reset() },
    onError: (e) => alert('Failed to add lesson: ' + e.message)
  })

  const toggleLessonMutation = useMutation({
    mutationFn: ({ lessonId, completed }: { lessonId: string; completed: boolean }) =>
      fetch(`/api/lessons/${lessonId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course', courseId] }); qc.invalidateQueries({ queryKey: ['courses'] }) },
  })

  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/modules/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course', courseId] }),
  })

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/lessons/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course', courseId] }),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  if (!course) return null

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <div className="glass rounded-3xl p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <div className="flex items-center gap-3 mt-3">
              {course.category && (
                <span className="text-xs font-medium bg-primary/15 text-primary rounded-full px-3 py-1">{course.category}</span>
              )}
              {course.platform && <span className="text-sm text-muted-foreground">{course.platform}</span>}
            </div>
          </div>
          {course.url && (
            <a
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 gradient-bg text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Open Course <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="mt-8 bg-secondary/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Overall Progress</span>
            <span className="font-bold text-primary text-xl">{course.progress}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full gradient-bg rounded-full transition-all duration-700 ease-out" style={{ width: `${course.progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-10 mb-6">
        <h2 className="text-xl font-semibold">Course Content</h2>
        <button
          onClick={() => setAddModuleOpen(true)}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Module
        </button>
      </div>

      {addModuleOpen && (
        <form onSubmit={moduleForm.handleSubmit((d) => createModuleMutation.mutate(d))} className="glass rounded-2xl p-5 mb-6 animate-fade-in flex gap-3">
          <input
            {...moduleForm.register('title')}
            autoFocus
            placeholder="Module title (e.g. Introduction)"
            className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button type="submit" disabled={createModuleMutation.isPending} className="gradient-bg text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60">
            Add
          </button>
          <button type="button" onClick={() => setAddModuleOpen(false)} className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary">
            Cancel
          </button>
        </form>
      )}

      <div className="space-y-4">
        {course.modules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-secondary/10 rounded-2xl border border-dashed border-border/50">
            No modules yet. Add a module to start organizing your lessons.
          </div>
        ) : (
          course.modules.map((mod, index) => {
            const completedCount = mod.lessons.filter(l => l.completed).length
            const totalCount = mod.lessons.length
            
            return (
              <div key={mod.id} className="glass rounded-2xl overflow-hidden border border-border/40">
                <div className="bg-secondary/20 p-5 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold text-lg">{mod.title}</h3>
                    <span className="ml-2 text-xs font-medium text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
                      {completedCount} / {totalCount} lessons
                    </span>
                  </div>
                  <button onClick={() => { if(confirm('Delete this entire module and all its lessons?')) deleteModuleMutation.mutate(mod.id) }} className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-400 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-border/30">
                  {mod.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center gap-4 p-4 hover:bg-secondary/10 transition-colors group">
                      <button
                        onClick={() => toggleLessonMutation.mutate({ lessonId: lesson.id, completed: !lesson.completed })}
                        className={cn('flex-shrink-0 transition-colors', lesson.completed ? 'text-green-400' : 'text-muted-foreground hover:text-primary')}
                      >
                        {lesson.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={cn('text-sm block truncate', lesson.completed && 'line-through text-muted-foreground')}>
                          {lesson.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {lesson.url && (
                          <a href={lesson.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 flex items-center gap-1.5 flex-shrink-0 transition-colors">
                            Lesson Link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button onClick={() => { if(confirm('Delete lesson?')) deleteLessonMutation.mutate(lesson.id) }} className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {addLessonModuleId === mod.id ? (
                    <form onSubmit={lessonForm.handleSubmit((d) => createLessonMutation.mutate({ moduleId: mod.id, ...d }))} className="flex items-center gap-3 p-4 bg-secondary/5">
                      <input
                        {...lessonForm.register('title')}
                        autoFocus
                        placeholder="Lesson title *"
                        className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <input
                        {...lessonForm.register('url')}
                        placeholder="Direct URL (optional)"
                        className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button type="submit" disabled={createLessonMutation.isPending} className="gradient-bg text-white rounded-xl px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60">
                        Save
                      </button>
                      <button type="button" onClick={() => setAddLessonModuleId(null)} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary">
                        ✕
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setAddLessonModuleId(mod.id)}
                      className="flex items-center gap-2 w-full p-4 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/5 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Lesson
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
