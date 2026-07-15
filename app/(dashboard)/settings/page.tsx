import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Settings as SettingsIcon, Key, RefreshCw } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { syncToken: true },
  })

  async function generateToken() {
    'use server'
    const s = await auth()
    if (!s?.user?.id) return
    const crypto = await import('crypto')
    const newToken = crypto.randomUUID()
    await prisma.user.update({
      where: { id: s.user.id },
      data: { syncToken: newToken },
    })
    revalidatePath('/settings')
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and integration settings</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-primary" /> Extension Sync Token
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          This token is used by the upcoming browser extension to securely sync your course progress from external websites directly into your LearnFlow dashboard.
        </p>
        
        <div className="bg-secondary/30 p-4 rounded-xl border border-border/50 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <code className="text-sm font-mono text-primary break-all">
            {user?.syncToken || 'No token generated yet'}
          </code>
          <form action={generateToken}>
            <button
              type="submit"
              className="flex items-center gap-2 gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" />
              {user?.syncToken ? 'Regenerate Token' : 'Generate Token'}
            </button>
          </form>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4 italic">
          Keep this token secret. Do not share it with anyone.
        </p>
      </div>
    </div>
  )
}
