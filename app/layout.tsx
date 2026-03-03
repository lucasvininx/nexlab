// Layout raiz da aplicacao
// Define metadados globais, fontes, viewport e analytics
// Envoltorio HTML para todas as paginas da aplicacao

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Carrega fonte Inter do Google Fonts com multiplos pesos
// Usado em toda aplicacao para Typography consistente
const _inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'] })

// Metadados do site - usados em SEO e preview
export const metadata: Metadata = {
  title: 'NEX Photo Activation',
  description: 'Interactive photo activation experience for events.',
  generator: 'v0.app',
}

// Configuracao de viewport - importante para responsividade mobile
export const viewport: Viewport = {
  themeColor: '#EDEDED',
  userScalable: false,
  width: 'device-width',
  initialScale: 1,
}

// Componente layout raiz
// Renderiza HTML/BODY e qualquer coisa filha (rotas)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
