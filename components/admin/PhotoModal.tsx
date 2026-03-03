'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface Photo {
  id: string
  image_url: string
  created_at: string
}

export default function PhotoModal({
  photo,
  onClose,
}: {
  photo: Photo
  onClose: () => void
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = `${window.location.origin}/download/${photo.id}`
    QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark: '#111111', light: '#FFFFFF' },
    }).then(setQrDataUrl)
  }, [photo.id])

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleDownload() {
    const res = await fetch(photo.image_url)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `photo-${photo.id}.jpg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Photo details"
    >
      <div className="bg-card border border-border w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-widest">
            Photo Details
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 bg-secondary hover:bg-muted flex items-center justify-center transition"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Photo preview */}
          <div className="overflow-hidden border border-border bg-secondary aspect-[9/16] max-h-64 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.image_url}
              alt="Full photo preview"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Meta */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-mono break-all">{photo.id}</p>
            <p className="text-sm text-foreground">{new Date(photo.created_at).toLocaleString()}</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3 bg-secondary p-5 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Scan to Download
            </p>
            {qrDataUrl ? (
              <div className="bg-white p-2 border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR code for download" className="w-36 h-36" />
              </div>
            ) : (
              <div className="w-36 h-36 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="w-full bg-primary text-primary-foreground font-bold py-4 text-sm uppercase tracking-widest active:scale-95 transition-transform hover:bg-foreground/80 rounded-none"
          >
            Download Photo
          </button>
        </div>
      </div>
    </div>
  )
}
