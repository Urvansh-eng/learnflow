'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, BookOpen, CheckSquare, Calendar, Brain, Eye, EyeOff } from 'lucide-react'

const features = [
  { icon: CheckSquare, label: 'Kanban Board', color: 'text-indigo-400' },
  { icon: BookOpen, label: 'Course Tracker', color: 'text-purple-400' },
  { icon: Calendar, label: 'Smart Calendar', color: 'text-blue-400' },
  { icon: Brain, label: 'Hinglish AI', color: 'text-violet-400' },
]

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Registration failed')
          setLoading(false)
          return
        }
        // Auto sign in after register
        const result = await signIn('credentials', { email, password, redirect: false })
        if (result?.error) {
          setError('Registered but failed to sign in. Please try logging in.')
          setLoading(false)
          return
        }
        router.push('/')
        router.refresh()
      } else {
        const result = await signIn('credentials', { email, password, redirect: false })
        if (result?.error) {
          setError('Invalid email or password')
          setLoading(false)
          return
        }
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg mb-4 shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">LearnFlow</h1>
          <p className="text-muted-foreground mt-2 text-sm">Your personal learning &amp; productivity hub</p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {features.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-xs font-medium">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 glow-primary">
          <h2 className="text-xl font-semibold mb-6">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 rounded-xl py-3 font-medium text-sm hover:bg-gray-100 active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="text-sm font-medium text-foreground/80 block mb-1.5">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground/80 block mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/80 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'register' ? 'Minimum 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              id="submit-btn"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full gradient-bg text-white rounded-xl py-3 font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-primary hover:underline font-medium"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
