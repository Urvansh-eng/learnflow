'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Plus, ExternalLink, Trash2, ChevronDown, ChevronRight, CheckCircle, Circle, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'

interface Module {
  id: string
  title: string
  order: number
  resumeUrl?: string | null
  completed: boolean
  notes?: string | null
}

interface Course {
  id: string
  title: string
  platform?: string
  category?: string
  progress: number
  modules: Module[]
  nextModule?: Module | null
}

const courseSchema = z.object({
  title: z.string().min(1),
  platform: z.string().optional(),
  category: z.string().optional(),
})

const moduleSchema = z.object({
  title: z.string().min(1),
  resumeUrl: z.string().url().optional().or(z.literal('')),
})

export default function CoursesPage() {
  const qc = useQueryClient()
  const [addCourseOpen, setAddCourseOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addModuleCourseId, setAddModuleCourseId] = useState<string | null>(null)

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => fetch('/api/courses').then((r) => r.json()),
  })

  const courseForm = useForm({ resolver: zodResolver(courseSchema) })
  const moduleForm = useForm({ resolver: zodResolver(moduleSchema) })

  const createCourseMutation = useMutation({
    mutationFn: (data: any) =>
      fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); setAddCourseOpen(false); courseForm.reset() },
  })

  const createModuleMutation = useMutation({
    mutationFn: ({ courseId, ...data }: any) =>
      fetch('/api/modules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, ...data, resumeUrl: data.resumeUrl || null }) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); setAddModuleCourseId(null); moduleForm.reset() },
  })

  const toggleModuleMutation = useMutation({
    mutationFn: ({ moduleId, completed }: { moduleId: string; completed: boolean }) =>
      fetch(`/api/modules/${moduleId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })

  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/courses/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{courses.length} courses tracked</p>
        </div>
        <button
          id="add-course-btn"
          onClick={() => setAddCourseOpen(true)}
          className="gradient-bg text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all duration-200"
        >
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {/* Add Course Modal */}
      {addCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddCourseOpen(false)} />
          <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-fade-in">
            <h2 className="font-semibold text-lg mb-4">Add New Course</h2>
            <form onSubmit={courseForm.handleSubmit((d) => createCourseMutation.mutate(d))} className="space-y-4">
              {[
                { name: 'title', placeholder: 'Course title *', required: true },
                { name: 'platform', placeholder: 'Platform (e.g. Udemy, Code with Harry)', required: false },
                { name: 'category', placeholder: 'Category (e.g. Web Dev, DSA)', required: false },
              ].map(({ name, placeholder }) => (
                <input
                  key={name}
                  {...courseForm.register(name as any)}
                  placeholder={placeholder}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ))}
              <div className="flex gap-3">
                <button type="submit" disabled={createCourseMutation.isPending} className="flex-1 gradient-bg text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60">
                  {createCourseMutation.isPending ? 'Adding...' : 'Add Course'}
                </button>
                <button type="button" onClick={() => setAddCourseOpen(false)} className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course list */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 glass rounded-2xl">
          <BookOpen className="w-12 h-12 text-muted-foreground/30" />
          <div className="text-center">
            <p className="font-medium">No courses yet</p>
            <p className="text-muted-foreground text-sm mt-1">Add your first course to start tracking progress</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="glass rounded-2xl overflow-hidden">
              {/* Course header */}
              <div
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => setExpandedId(expandedId === course.id ? null : course.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{course.title}</h3>
                    {course.category && (
                      <span className="text-xs bg-primary/15 text-primary rounded-full px-2 py-0.5 flex-shrink-0">{course.category}</span>
                    )}
                  </div>
                  {course.platform && <p className="text-sm text-muted-foreground mt-0.5">{course.platform}</p>}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full gradient-bg rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }} />
                    </div>
                    <span className="text-sm font-medium text-primary flex-shrink-0">{course.progress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {course.modules.filter((m) => m.completed).length} / {course.modules.length} modules complete
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {course.nextModule?.resumeUrl && (
                    <a
                      href={course.nextModule.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 gradient-bg text-white text-xs rounded-lg px-3 py-2 hover:opacity-90 transition-opacity flex-shrink-0"
                    >
                      Continue <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete course?')) deleteCourseMutation.mutate(course.id) }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedId === course.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Modules */}
              {expandedId === course.id && (
                <div className="border-t border-border/50">
                  {course.modules.map((mod) => (
                    <div key={mod.id} className="flex items-center gap-3 px-5 py-3 border-b border-border/30 last:border-0 hover:bg-secondary/10 transition-colors">
                      <button
                        onClick={() => toggleModuleMutation.mutate({ moduleId: mod.id, completed: !mod.completed })}
                        className={cn('flex-shrink-0 transition-colors', mod.completed ? 'text-green-400' : 'text-muted-foreground hover:text-primary')}
                      >
                        {mod.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <span className={cn('flex-1 text-sm', mod.completed && 'line-through text-muted-foreground')}>{mod.title}</span>
                      {mod.resumeUrl && (
                        <a href={mod.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0">
                          <ExternalLink className="w-3 h-3" /> Resume
                        </a>
                      )}
                    </div>
                  ))}

                  {/* Add module */}
                  {addModuleCourseId === course.id ? (
                    <form
                      onSubmit={moduleForm.handleSubmit((d) => createModuleMutation.mutate({ courseId: course.id, ...d }))}
                      className="flex gap-2 p-4"
                    >
                      <input
                        {...moduleForm.register('title')}
                        autoFocus
                        placeholder="Module title *"
                        className="flex-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <input
                        {...moduleForm.register('resumeUrl')}
                        placeholder="Resume URL (optional)"
                        className="flex-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button type="submit" disabled={createModuleMutation.isPending} className="gradient-bg text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60">
                        Add
                      </button>
                      <button type="button" onClick={() => setAddModuleCourseId(null)} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary">
                        ✕
                      </button>
                    </form>
                  ) : (
                    <button
                      id={`add-module-${course.id}`}
                      onClick={() => setAddModuleCourseId(course.id)}
                      className="flex items-center gap-2 w-full px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Module
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
