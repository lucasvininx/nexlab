// Server Action para upload de fotos
// Chamado quando usuario aprova foto na tela de review
// Faz upload para Vercel Blob e salva metadata no Supabase

'use server'

import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'

// Faz upload de arquivo fotografico para storage e cria registro no banco
// 
// Parametro: formData - contem arquivo 'file' com foto JPEG
// Retorna: { id: string; url: string } se sucesso, { error: string } se falha
export async function uploadPhotoAction(formData: FormData) {
  // Cria cliente Supabase para servidor
  const supabase = await createClient()
  
  // Valida se usuario autenticado - seguranca para evitar uploads anonimos
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Extrai arquivo do FormData
  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  // Gera nome unico para arquivo
  // Formato: photos/[timestamp]-[random].jpg
  // Isso garante que cada foto tem nome unico mesmo se multiplas ao mesmo tempo
  const filename = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  
  // Faz upload para Vercel Blob (storage de arquivos)
  // Access 'public' = URL publica para download
  const blob = await put(filename, file, { access: 'public' })

  // Insere registro em tabela 'photos' no Supabase
  // Armazena URL publica do arquivo no banco
  const { data, error } = await supabase
    .from('photos')
    .insert({ image_url: blob.url })
    .select('id') // Retorna ID do registro criado
    .single() // Espera um resultado

  // Se erro na insercao do banco
  if (error) return { error: error.message }

  // Sucesso - retorna ID do registro e URL publica da foto
  // Cliente usa ID para gerar URL de download e QR code
  return { id: data.id, url: blob.url }
}

