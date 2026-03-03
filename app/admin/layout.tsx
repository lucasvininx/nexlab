import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const isAdmin = user.user_metadata?.is_admin === true
  if (!isAdmin) redirect('/activation')

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
