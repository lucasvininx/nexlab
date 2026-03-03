import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ActivationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Redirect admins to /admin
  const isAdmin = user.user_metadata?.is_admin === true
  if (isAdmin) redirect('/admin')

  return (
    <div className="min-h-screen bg-[var(--kiosk-bg)] flex items-center justify-center">
      {/* Kiosk frame: 9:16 aspect ratio */}
      <div
        className="relative w-full max-w-[540px] overflow-hidden"
        style={{ aspectRatio: '9/16' }}
      >
        {children}
      </div>
    </div>
  )
}

