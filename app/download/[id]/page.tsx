import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DownloadClient from '@/components/download/DownloadClient'

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: photo, error } = await supabase
    .from('photos')
    .select('id, image_url, created_at')
    .eq('id', id)
    .single()

  if (error || !photo) notFound()

  return <DownloadClient photo={photo} />
}
