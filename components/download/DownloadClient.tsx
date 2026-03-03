'use client'

import Image from 'next/image'

interface Photo {
  id: string
  image_url: string
  created_at: string
}

export default function DownloadClient({ photo }: { photo: Photo }) {
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 gap-8">
      {/* Logo */}
      <Image
        src="/nex-logo.png"
        alt="NEX"
        width={140}
        height={70}
        className="object-contain"
        priority
      />

      <div className="text-center">
        <h1 className="text-3xl font-black text-foreground tracking-tight text-balance uppercase">
          Your Photo
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date(photo.created_at).toLocaleString()}
        </p>
      </div>

      <div className="w-full max-w-sm overflow-hidden border border-border shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.image_url}
          alt="Your activation photo"
          className="w-full h-auto"
        />
      </div>

      <button
        onClick={handleDownload}
        className="w-full max-w-sm bg-primary text-primary-foreground font-bold text-base py-5 uppercase tracking-widest active:scale-95 transition-transform hover:bg-foreground/80 rounded-none"
      >
        Download Photo
      </button>
    </div>
  )
}
