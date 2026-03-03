'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import NextImage from 'next/image'
import { uploadPhotoAction } from '@/app/actions/photos'
import QRCode from 'qrcode'

type Screen =
  | 'idle'
  | 'camera'
  | 'countdown'
  | 'processing'
  | 'review'
  | 'qr'

export default function ActivationClient() {
  const [screen, setScreen] = useState<Screen>('idle')
  const [countdown, setCountdown] = useState(3)
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null)
  const [finalImageBlob, setFinalImageBlob] = useState<Blob | null>(null)
  const [photoId, setPhotoId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setError('Camera access denied. Please allow camera permissions.')
    }
  }, [])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  function goToCamera() {
    setError(null)
    setScreen('camera')
  }

  function triggerCountdown() {
    setCountdown(3)
    setScreen('countdown')
  }

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const W = 1080
    const H = 1920
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw video frame covering the canvas (cover crop)
    const vw = video.videoWidth
    const vh = video.videoHeight
    const scale = Math.max(W / vw, H / vh)
    const sw = W / scale
    const sh = H / scale
    const sx = (vw - sw) / 2
    const sy = (vh - sh) / 2
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H)

    // Load and composite frame overlay
    const frame = new window.Image()
    frame.crossOrigin = 'anonymous'
    frame.src = '/frame-overlay.png'
    frame.onload = () => {
      ctx.drawImage(frame, 0, 0, W, H)
      canvas.toBlob(
        (blob) => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          setFinalImageUrl(url)
          setFinalImageBlob(blob)
          setScreen('review')
          stopCamera()
        },
        'image/jpeg',
        0.92,
      )
    }
    frame.onerror = () => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          setFinalImageUrl(url)
          setFinalImageBlob(blob)
          setScreen('review')
          stopCamera()
        },
        'image/jpeg',
        0.92,
      )
    }
  }, [stopCamera])

  // Handle countdown
  useEffect(() => {
    if (screen !== 'countdown') return
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(t)
    } else {
      setScreen('processing')
      capturePhoto()
    }
  }, [screen, countdown, capturePhoto])

  // Start/stop camera based on screen
  useEffect(() => {
    if (screen === 'camera' || screen === 'countdown') {
      startCamera()
    } else {
      if (screen !== 'processing') stopCamera()
    }
  }, [screen, startCamera, stopCamera])

  // Auto-reset from QR screen after 15s
  useEffect(() => {
    if (screen === 'qr') {
      resetTimerRef.current = setTimeout(() => resetToIdle(), 15000)
      return () => {
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      }
    }
  }, [screen])

  function resetToIdle() {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    setScreen('idle')
    setFinalImageUrl(null)
    setFinalImageBlob(null)
    setPhotoId(null)
    setQrDataUrl(null)
    setError(null)
    setUploading(false)
  }

  async function approvePhoto() {
    if (!finalImageBlob) return
    setUploading(true)
    setScreen('processing')
    const formData = new FormData()
    formData.append('file', finalImageBlob, 'photo.jpg')
    const result = await uploadPhotoAction(formData)
    if (result.error) {
      setError(result.error)
      setScreen('review')
      setUploading(false)
      return
    }
    const id = result.id!
    setPhotoId(id)
    const downloadUrl = `${window.location.origin}/download/${id}`
    const qr = await QRCode.toDataURL(downloadUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#111111', light: '#FFFFFF' },
    })
    setQrDataUrl(qr)
    setUploading(false)
    setScreen('qr')
  }

  return (
    <div className="w-full h-full relative overflow-hidden select-none" style={{ background: 'var(--kiosk-bg)' }}>
      {/* Hidden canvas for compositing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* --- IDLE SCREEN --- */}
      {screen === 'idle' && (
        <div className="w-full h-full flex flex-col items-center justify-between py-20 px-10">
          {/* Logo top */}
          <div className="flex items-center justify-center pt-6">
            <NextImage
              src="/nex-logo.png"
              alt="NEX"
              width={180}
              height={90}
              className="object-contain"
              priority
            />
          </div>

          {/* Center content */}
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-6xl font-black text-foreground tracking-tight text-center text-balance leading-tight">
              Take Your<br />Photo
            </h1>
            <p className="text-muted-foreground text-xl text-center text-balance">
              Tap the button below to start
            </p>
          </div>

          {/* Start button */}
          <button
            onClick={goToCamera}
            className="w-full max-w-xs bg-primary text-primary-foreground font-black text-3xl py-8 uppercase tracking-widest active:scale-95 transition-transform rounded-none"
          >
            Start
          </button>
        </div>
      )}

      {/* --- CAMERA SCREEN --- */}
      {(screen === 'camera' || screen === 'countdown') && (
        <div className="w-full h-full relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {/* Capture button (only in camera mode) */}
          {screen === 'camera' && (
            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-5">
              <button
                onClick={triggerCountdown}
                className="w-24 h-24 rounded-full bg-white border-4 border-foreground active:scale-90 transition-transform shadow-xl"
                aria-label="Take photo"
              >
                <span className="sr-only">Capture</span>
              </button>
              <button
                onClick={resetToIdle}
                className="text-white/80 text-base underline underline-offset-4"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Countdown overlay */}
          {screen === 'countdown' && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span
                key={countdown}
                className="text-[18rem] font-black text-white leading-none"
                style={{ animation: 'countPulse 0.9s ease-out forwards' }}
              >
                {countdown}
              </span>
            </div>
          )}
        </div>
      )}

      {/* --- PROCESSING SCREEN --- */}
      {screen === 'processing' && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-6">
          <div className="w-14 h-14 rounded-full border-4 border-foreground border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-xl font-medium">
            {uploading ? 'Saving your photo...' : 'Processing...'}
          </p>
        </div>
      )}

      {/* --- REVIEW SCREEN --- */}
      {screen === 'review' && finalImageUrl && (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={finalImageUrl}
              alt="Your photo preview"
              className="w-full h-full object-cover"
            />
          </div>
          {error && (
            <p className="text-center text-destructive text-sm py-3 bg-destructive/5 border-t border-destructive/20 px-4">
              {error}
            </p>
          )}
          <div className="flex gap-0 border-t border-border">
            <button
              onClick={goToCamera}
              className="flex-1 border-r border-border text-foreground font-bold text-xl py-6 active:scale-95 transition-transform bg-card hover:bg-secondary uppercase tracking-widest rounded-none"
            >
              Retake
            </button>
            <button
              onClick={approvePhoto}
              className="flex-1 bg-primary text-primary-foreground font-bold text-xl py-6 active:scale-95 transition-transform hover:bg-foreground/80 uppercase tracking-widest rounded-none"
            >
              Approve
            </button>
          </div>
        </div>
      )}

      {/* --- QR SCREEN --- */}
      {screen === 'qr' && qrDataUrl && (
        <div className="w-full h-full flex flex-col items-center justify-between py-16 px-10">
          {/* Logo top */}
          <NextImage
            src="/nex-logo.png"
            alt="NEX"
            width={140}
            height={70}
            className="object-contain"
          />

          <div className="flex flex-col items-center gap-8">
            <h2 className="text-4xl font-black text-foreground text-center text-balance tracking-tight">
              Scan to Download
            </h2>
            {/* QR Code */}
            <div className="bg-white p-5 border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR code to download your photo" className="w-64 h-64" />
            </div>
            <p className="text-muted-foreground text-lg text-center text-balance">
              Scan with your phone to get your free photo.
            </p>
          </div>

          {/* Auto-reset */}
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full h-1 bg-border overflow-hidden">
              <div
                className="h-full bg-foreground"
                style={{ animation: 'shrink 15s linear forwards' }}
              />
            </div>
            <p className="text-muted-foreground text-sm">Resetting in 15 seconds...</p>
            <button
              onClick={resetToIdle}
              className="text-muted-foreground text-base underline underline-offset-4"
            >
              Reset now
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes countPulse {
          0% { transform: scale(1.4); opacity: 0.6; }
          60% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.9; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
