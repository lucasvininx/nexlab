'use server'

import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'

export async function uploadPhotoAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  const filename = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const blob = await put(filename, file, { access: 'public' })

  const { data, error } = await supabase
    .from('photos')
    .insert({ image_url: blob.url })
    .select('id')
    .single()

  if (error) return { error: error.message }

  return { id: data.id, url: blob.url }
}
