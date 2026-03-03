'use client'

import { useState } from 'react'
import Image from 'next/image'
import { loginAction } from '@/app/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await loginAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* NEX Logo */}
        <div className="mb-12 flex flex-col items-center gap-6">
          <Image
            src="/nex-logo.png"
            alt="NEX"
            width={160}
            height={80}
            className="object-contain"
            priority
          />
          <p className="text-muted-foreground text-sm tracking-wide uppercase">
            Photo Activation
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-widest">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full bg-card border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30 transition rounded-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-foreground mb-2 uppercase tracking-widest">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-card border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30 transition rounded-none"
            />
          </div>

          {error && (
            <p className="text-destructive text-sm border border-destructive/30 bg-destructive/5 px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold text-sm py-4 uppercase tracking-widest hover:bg-foreground/80 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2 rounded-none"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
