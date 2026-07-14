'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Sparkles, BookOpen, CheckSquare, Calendar, Brain } from 'lucide-react'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await signIn('nodemailer', { email: data.email, redirect: false, callbackUrl: '/' })
    setSent(true)
  }

  const features = [
    { icon: CheckSquare, label: 'Kanban Board', color: 'text-indigo-400' },
    { icon: BookOpen, label: 'Course Tracker', color: 'text-purple-400' },
    { icon: Calendar, label: 'Smart Calendar', color: 'text-blue-400' },
    { icon: Brain, label: 'Hinglish AI', color: 'text-violet-400' },
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background orbs */}
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
          <p className="text-muted-foreground mt-2 text-sm">Your personal learning & productivity hub</p>
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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Check your email!</h2>
              <p className="text-muted-foreground text-sm">
                We sent a magic link to your email. Click it to sign in — no password needed.
              </p>
              <p className="text-muted-foreground/60 text-xs mt-3">Link expires in 15 minutes.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-1">Sign in</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Enter your email — we'll send you a magic link.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-foreground/80 block mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
                <button
                  id="signin-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gradient-bg text-white rounded-xl py-3 font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          By signing in, you agree to use this app responsibly. ✨
        </p>
      </div>
    </div>
  )
}
