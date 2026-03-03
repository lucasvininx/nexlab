// Pagina de download de foto
// Rota dinamica /download/[id] onde [id] eh ID da foto no banco
// Busca foto do banco e exibe interface para usuario baixar/compartilhar

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DownloadClient from '@/components/download/DownloadClient'

// Componente de pagina assíncrona
// Params vem como Promise no Next.js 15+ - precisar fazer await
export default async function DownloadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Extrai ID da URL dinamica - params eh Promise
  const { id } = await params
  
  // Cria cliente Supabase para servidor
  const supabase = await createClient()
  
  // Busca foto no banco usando ID da URL
  const { data: photo, error } = await supabase
    .from('photos')
    .select('id, image_url, created_at')
    .eq('id', id) // Filtra por ID
    .single() // Espera um resultado

  // Se foto nao encontrada ou erro na busca
  if (error || !photo) notFound() // Mostra pagina 404

  // Foto encontrada - renderiza componente cliente com dados
  return <DownloadClient photo={photo} />
}
