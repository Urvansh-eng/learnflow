'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Bot, Send, Loader2, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  open: boolean
  onClose: () => void
}

const SUGGESTIONS = [
  'Ek new task banao "Review PRs" in To Do',
  'Show my progress this week',
  'Add a course "System Design" on Udemy',
  'Create a meeting for tomorrow at 10am',
]

export function ChatPanel({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, messages])

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMessage: Message = { role: 'user', content }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('AI Chat Failed:', errorData)
        throw new Error(errorData.details || 'Server returned an error')
      }
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Oops! Error: ${err.message || 'Kuch error ho gaya'}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full sm:w-[420px] z-50 flex flex-col bg-background shadow-2xl border-l border-border transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Hinglish & English — aapki marzi</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-xl shadow-indigo-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-semibold">Kya help chahiye?</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Ask me anything — tasks, courses, progress, calendar!
                </p>
              </div>
              <div className="w-full space-y-2 mt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="w-full text-left text-sm glass rounded-xl px-4 py-2.5 hover:border-primary/40 border border-border/50 transition-all duration-200 text-muted-foreground hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex gap-3 message-animate', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'gradient-bg text-white rounded-tr-sm'
                      : 'glass border border-border/50 rounded-tl-sm'
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3 message-animate">
              <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="glass border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2 items-end glass rounded-2xl border border-border/50 p-2 focus-within:border-primary/50 transition-colors">
            <textarea
              ref={inputRef}
              id="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
              }}
              placeholder="Type in Hindi, English, ya Hinglish..."
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground/60 max-h-32 py-1 px-2"
              style={{ minHeight: '36px' }}
            />
            <button
              id="ai-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 gradient-bg text-white rounded-xl flex items-center justify-center hover:opacity-90 active:scale-90 transition-all duration-200 disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  )
}
