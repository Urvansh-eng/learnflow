'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Award, Plus, ExternalLink, Trash2, Loader2, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn, daysUntil, formatDate } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1),
  provider: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  resumeUrl: z.string().url().optional().or(z.literal('')),
  targetDate: z.string().optional(),
})

const statusConfig = {
  not_started: { label: 'Not Started', class: 'bg-slate-500/15 text-slate-400 border-slate-500/25', step: 0 },
  in_progress: { label: 'In Progress', class: 'bg-blue-500/15 text-blue-400 border-blue-500/25', step: 1 },
  completed: { label: 'Completed', class: 'bg-green-500/15 text-green-400 border-green-500/25', step: 2 },
}

export default function CertificatesPage() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { status: 'not_started' as const } })

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => fetch('/api/certificates').then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      fetch('/api/certificates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, resumeUrl: data.resumeUrl || null, targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : null }) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['certificates'] }); setAddOpen(false); reset() },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/certificates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificates'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/certificates/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificates'] }),
  })

  const steps: ('not_started' | 'in_progress' | 'completed')[] = ['not_started', 'in_progress', 'completed']

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Certificates</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{certs.filter((c: any) => c.status === 'completed').length} of {certs.length} completed</p>
        </div>
        <button id="add-cert-btn" onClick={() => setAddOpen(true)} className="gradient-bg text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all duration-200">
          <Plus className="w-4 h-4" /> Add Certificate
        </button>
      </div>

      {/* Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-fade-in">
            <h2 className="font-semibold text-lg mb-4">Add Certificate</h2>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <input {...register('title')} placeholder="Certificate title *" className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input {...register('provider')} placeholder="Provider (e.g. AWS, Google)" className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input {...register('resumeUrl')} placeholder="Resume URL (direct link)" className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Status</label>
                  <select {...register('status')} className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Target Date</label>
                  <input {...register('targetDate')} type="date" className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={createMutation.isPending} className="flex-1 gradient-bg text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60">
                  {createMutation.isPending ? 'Adding...' : 'Add'}
                </button>
                <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cert cards */}
      {certs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 glass rounded-2xl">
          <Award className="w-12 h-12 text-muted-foreground/30" />
          <div className="text-center">
            <p className="font-medium">No certificates yet</p>
            <p className="text-muted-foreground text-sm mt-1">Track your certification journey here</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {certs.map((cert: any) => {
            const sc = statusConfig[cert.status as keyof typeof statusConfig]
            const days = cert.targetDate ? daysUntil(cert.targetDate) : null
            const currentStep = sc.step
            return (
              <div key={cert.id} className="glass rounded-2xl p-5 hover:glow-primary transition-all duration-200 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{cert.title}</h3>
                    {cert.provider && <p className="text-sm text-muted-foreground mt-0.5">{cert.provider}</p>}
                  </div>
                  <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(cert.id) }} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status pipeline */}
                <div className="flex items-center gap-0">
                  {steps.map((s, i) => (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: cert.id, status: s })}
                        className={cn(
                          'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200',
                          i <= currentStep ? 'border-primary bg-primary text-white' : 'border-border bg-secondary text-muted-foreground hover:border-primary/50'
                        )}
                      >
                        {i < currentStep ? '✓' : i + 1}
                      </button>
                      {i < steps.length - 1 && (
                        <div className={cn('flex-1 h-0.5 mx-0.5', i < currentStep ? 'bg-primary' : 'bg-border')} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 text-[10px] -mt-2">
                  {steps.map((s) => <span key={s} className="flex-1 text-center text-muted-foreground/70">{statusConfig[s].label}</span>)}
                </div>

                {/* Deadline */}
                {cert.targetDate && days !== null && (
                  <div className={cn('flex items-center gap-1.5 text-xs', days <= 0 ? 'text-red-400' : days <= 7 ? 'text-yellow-400' : 'text-muted-foreground')}>
                    <Clock className="w-3.5 h-3.5" />
                    {days <= 0 ? 'Overdue!' : `${days} days left · ${formatDate(cert.targetDate)}`}
                  </div>
                )}

                {/* Resume button */}
                {cert.resumeUrl && (
                  <a href={cert.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 border border-primary/30 text-primary rounded-xl py-2 text-sm hover:bg-primary/10 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Resume Study
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
