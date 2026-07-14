'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { X, Loader2 } from 'lucide-react'

interface CalEvent {
  id: string
  title: string
  date: string
  type: 'meeting' | 'task'
  sourceTask?: { title: string; priority: string } | null
}

export default function CalendarPage() {
  const qc = useQueryClient()
  const calendarRef = useRef<any>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventType, setEventType] = useState<'meeting' | 'task'>('meeting')

  const { data: events = [] } = useQuery<CalEvent[]>({
    queryKey: ['events'],
    queryFn: () => fetch('/api/events').then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setAddOpen(false); setEventTitle('') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })

  const calEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    backgroundColor: e.type === 'task' ? '#6366f1' : '#8b5cf6',
    borderColor: e.type === 'task' ? '#4f46e5' : '#7c3aed',
    extendedProps: { type: e.type, sourceTask: e.sourceTask },
  }))

  const handleDateClick = (arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr)
    setAddOpen(true)
  }

  const handleEventClick = (arg: any) => {
    if (confirm(`Delete event "${arg.event.title}"?`)) {
      deleteMutation.mutate(arg.event.id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Click any date to add an event · Kanban tasks sync automatically</p>
      </div>

      <div className="glass rounded-2xl p-5">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          events={calEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-indigo-500" /> Task event
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-violet-500" /> Meeting
        </div>
      </div>

      {/* Add Event Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-sm glass rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Add Event</h2>
              <button onClick={() => setAddOpen(false)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Event Title</label>
                <input
                  id="event-title-input"
                  autoFocus
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Team standup, Study session..."
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Type</label>
                <div className="flex gap-2">
                  {(['meeting', 'task'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setEventType(t)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${eventType === t ? 'gradient-bg text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <button
                id="event-submit-btn"
                onClick={() => createMutation.mutate({ title: eventTitle, date: new Date(selectedDate).toISOString(), type: eventType })}
                disabled={!eventTitle.trim() || !selectedDate || createMutation.isPending}
                className="w-full gradient-bg text-white rounded-xl py-2.5 font-medium text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
