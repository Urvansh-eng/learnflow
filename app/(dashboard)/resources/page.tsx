'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, Plus, Search, Trash2, ExternalLink, Loader2, Video, FileText, File, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const typeIcons = { video: Video, article: FileText, doc: File, other: Link2 }
const typeColors: Record<string, string> = {
  video: 'text-red-400 bg-red-500/10',
  article: 'text-blue-400 bg-blue-500/10',
  doc: 'text-yellow-400 bg-yellow-500/10',
  other: 'text-purple-400 bg-purple-500/10',
}

export default function ResourcesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ title: '', url: '', type: 'other', tags: '' })

  const queryParams = new URLSearchParams({
    ...(search && { search }),
    ...(filterType && { type: filterType }),
    ...(filterTag && { tag: filterTag }),
  }).toString()

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources', search, filterType, filterTag],
    queryFn: () => fetch(`/api/resources?${queryParams}`).then((r) => r.json()),
  })

  const { data: allResources = [] } = useQuery({
    queryKey: ['resources-all'],
    queryFn: () => fetch('/api/resources').then((r) => r.json()),
  })

  const allTags = [...new Set((allResources as any[]).flatMap((r) => r.tags))].sort()

  const createMutation = useMutation({
    mutationFn: () =>
      fetch('/api/resources', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) }),
      }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); qc.invalidateQueries({ queryKey: ['resources-all'] }); setAddOpen(false); setForm({ title: '', url: '', type: 'other', tags: '' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/resources/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); qc.invalidateQueries({ queryKey: ['resources-all'] }) },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resource Vault</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{resources.length} resources saved</p>
        </div>
        <button id="add-resource-btn" onClick={() => setAddOpen(true)} className="gradient-bg text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all duration-200">
          <Plus className="w-4 h-4" /> Save Resource
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Types</option>
          {['video', 'article', 'doc', 'other'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterTag} onChange={(e) => setFilterTag(e.target.value)}
          className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Tags</option>
          {allTags.map((t: any) => <option key={t} value={t}>#{t}</option>)}
        </select>
      </div>

      {/* Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-fade-in space-y-4">
            <h2 className="font-semibold text-lg">Save Resource</h2>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title *" className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL * (https://...)" className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {['video', 'article', 'doc', 'other'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tags (comma separated)</label>
                <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, tutorial..." className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => createMutation.mutate()} disabled={!form.title || !form.url || createMutation.isPending} className="flex-1 gradient-bg text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60">
                {createMutation.isPending ? 'Saving...' : 'Save Resource'}
              </button>
              <button onClick={() => setAddOpen(false)} className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Resource grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 glass rounded-2xl">
          <Link2 className="w-12 h-12 text-muted-foreground/30" />
          <div className="text-center">
            <p className="font-medium">No resources found</p>
            <p className="text-muted-foreground text-sm mt-1">Save articles, videos, and docs for later</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {resources.map((res: any) => {
            const Icon = typeIcons[res.type as keyof typeof typeIcons] ?? Link2
            const colorClass = typeColors[res.type] ?? typeColors.other
            return (
              <div key={res.id} className="glass rounded-2xl p-4 hover:glow-primary transition-all duration-200 flex flex-col gap-3 group">
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{res.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{res.url}</p>
                  </div>
                </div>
                {res.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {res.tags.map((tag: string) => (
                      <button key={tag} onClick={() => setFilterTag(tag)} className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 hover:bg-primary/20 transition-colors">#{tag}</button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 border border-primary/30 text-primary rounded-xl py-1.5 text-xs hover:bg-primary/10 transition-colors">
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                  <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(res.id) }} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
