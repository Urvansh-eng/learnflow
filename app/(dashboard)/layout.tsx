'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Kanban,
  BookOpen,
  Award,
  Link2,
  Calendar,
  Bot,
  LogOut,
  Sparkles,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChatPanel } from '@/components/ai/ChatPanel'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/board', icon: Kanban, label: 'Kanban Board' },
  { href: '/courses', icon: BookOpen, label: 'Courses' },
  { href: '/certificates', icon: Award, label: 'Certificates' },
  { href: '/resources', icon: Link2, label: 'Resources' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
]

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full z-40 flex flex-col glass border-r border-border/50 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/50">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg gradient-text tracking-tight">LearnFlow</span>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'ml-auto p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground',
            collapsed && 'ml-0'
          )}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-primary/15 text-primary glow-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 space-y-2">
        {/* User avatar */}
        {session?.user && (
          <div className={cn('flex items-center gap-3 px-2 py-2', collapsed && 'justify-center')}>
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
              {session.user.name?.[0] ?? session.user.email?.[0] ?? '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.user.name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          id="signout-btn"
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      {/* Main content */}
      <main
        className={cn(
          'flex-1 min-h-screen transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-end px-6 py-3 glass border-b border-border/50">
          <button
            id="ai-chat-btn"
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 gradient-bg text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-200 shadow-lg shadow-indigo-500/20"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>

        <div className="p-6">{children}</div>
      </main>

      {/* AI Chat Panel */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
