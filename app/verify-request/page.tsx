import { Sparkles } from 'lucide-react'

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg mb-6 shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
        <p className="text-muted-foreground max-w-sm">
          A sign-in link has been sent to your email address. Check your inbox (and spam folder) and click the link to continue.
        </p>
      </div>
    </div>
  )
}
