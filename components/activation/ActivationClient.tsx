'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import NextImage from 'next/image'
import { uploadPhotoAction } from '@/app/actions/photos'
import { logoutAction } from '@/app/actions/auth'
import QRCode from 'qrcode'

type Screen =
  | 'idle'
  | 'camera'
  | 'countdown'
  | 'processing'
  | 'review'
  | 'qr'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920
const FRAME_TOP_HEIGHT = 228
const FRAME_BOTTOM_HEIGHT = 136
const FRAME_BG = '#d9d9db'
const FRAME_TEXT_COLOR = '#3d3f44'
const FRAME_MESSAGE = 'we make tech simple_'
const FRAME_TOP_PERCENT = (FRAME_TOP_HEIGHT / CANVAS_HEIGHT) * 100
const FRAME_BOTTOM_PERCENT = (FRAME_BOTTOM_HEIGHT / CANVAS_HEIGHT) * 100

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number,
) {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const sourceDrawWidth = targetWidth / scale
  const sourceDrawHeight = targetHeight / scale
  const sourceX = (sourceWidth - sourceDrawWidth) / 2
  const sourceY = (sourceHeight - sourceDrawHeight) / 2

  ctx.drawImage(
    source,
    sourceX,
    sourceY,
    sourceDrawWidth,
    sourceDrawHeight,
    targetX,
    targetY,
    targetWidth,
    targetHeight,
  )
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  logo: HTMLImageElement | null,
) {
  ctx.fillStyle = FRAME_BG
  ctx.fillRect(0, 0, width, FRAME_TOP_HEIGHT)
  ctx.fillRect(0, height - FRAME_BOTTOM_HEIGHT, width, FRAME_BOTTOM_HEIGHT)

  if (logo) {
    const logoHeight = Math.min(118, FRAME_TOP_HEIGHT - 54)
    const logoWidth = (logo.width / logo.height) * logoHeight
    const logoX = 46
    const logoY = (FRAME_TOP_HEIGHT - logoHeight) / 2
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight)
  }

  ctx.fillStyle = FRAME_TEXT_COLOR
  ctx.textBaseline = 'middle'
  ctx.font = '600 66px Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(FRAME_MESSAGE, width - 48, FRAME_TOP_HEIGHT / 2 + 2)

  ctx.font = '600 72px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(FRAME_MESSAGE, width / 2, height - FRAME_BOTTOM_HEIGHT / 2 + 4)
}

export default function ActivationClient() {
  const [screen, setScreen] = useState<Screen>('idle')
  const [countdown, setCountdown] = useState(3)
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null)
  const [finalImageBlob, setFinalImageBlob] = useState<Blob | null>(null)
  const [photoId, setPhotoId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameLogoRef = useRef<HTMLImageElement | null>(null)

  // Em alguns celulares, "environment" escolhe lente ultra-wide (pior para foco).
  // Aqui tentamos priorizar a camera traseira principal.
  const getPreferredRearCameraDeviceId = useCallback(async () => {
    if (cameraFacing !== 'environment') return null

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter((d) => d.kind === 'videoinput')
      if (!videoInputs.length) return null
      if (!videoInputs.some((d) => d.label.trim().length > 0)) return null

      const rearRegex = /(back|rear|traseira|environment)/i
      const avoidRegex = /(ultra|macro|0\.5x|0,5x|0\.5|0,5)/i

      const ranked = videoInputs
        .map((device) => {
          const label = device.label || ''
          let score = 0
          if (rearRegex.test(label)) score += 4
          if (avoidRegex.test(label)) score -= 3
          return { deviceId: device.deviceId, score }
        })
        .sort((a, b) => b.score - a.score)

      return ranked[0]?.deviceId ?? null
    } catch {
      return null
    }
  }, [cameraFacing])

  // Tenta ativar autofoco continuo quando o dispositivo suporta essa constraint
  const applyBestFocus = useCallback(async (stream: MediaStream) => {
    const [track] = stream.getVideoTracks()
    if (!track) return

    try {
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & {
        focusMode?: string[]
      }

      if (capabilities?.focusMode?.includes('continuous')) {
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
        })
      }
    } catch {
      // Ignora erro em browsers/dispositivos sem suporte completo a focusMode
    }
  }, [])

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const preferredRearDeviceId = await getPreferredRearCameraDeviceId()
      const videoConstraints: MediaTrackConstraints = {
        facingMode: { ideal: cameraFacing },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      }

      if (preferredRearDeviceId) {
        videoConstraints.deviceId = { exact: preferredRearDeviceId }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      })
      streamRef.current = stream
      await applyBestFocus(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setError('Camera access denied. Please allow camera permissions.')
    }
  }, [cameraFacing, applyBestFocus, getPreferredRearCameraDeviceId])

  // Para o stream de camera e limpa todos os tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  // Alterna entre camera frontal e traseira
  const toggleCamera = useCallback(async () => {
    stopCamera()
    setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'))
  }, [stopCamera])

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

    const W = CANVAS_WIDTH
    const H = CANVAS_HEIGHT
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, W, H)

    // Foto ocupa a area central entre as faixas da moldura
    const photoAreaY = FRAME_TOP_HEIGHT
    const photoAreaHeight = H - FRAME_TOP_HEIGHT - FRAME_BOTTOM_HEIGHT

    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return
    drawCoverImage(ctx, video, vw, vh, 0, photoAreaY, W, photoAreaHeight)
    drawFrame(ctx, W, H, frameLogoRef.current)

    // Salva foto ja com moldura aplicada
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

  // Preload do logo para desenhar na moldura final da foto
  useEffect(() => {
    const logo = new window.Image()
    logo.src = '/nex-logo.png'
    logo.onload = () => {
      frameLogoRef.current = logo
    }
    return () => {
      frameLogoRef.current = null
    }
  }, [])

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
      {/* Botão Logout - topo direito */}
      <button
        onClick={() => logoutAction()}
        className="absolute top-4 right-4 z-20 px-4 py-2 bg-black text-white text-sm font-semibold rounded hover:bg-black/80 active:scale-95 transition-all"
        aria-label="Logout"
      >
        Logout
      </button>

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
          />
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div
              className="absolute inset-x-0 top-0 bg-[#d9d9db] px-8 md:px-10 flex items-center justify-between"
              style={{ height: `${FRAME_TOP_PERCENT}%` }}
            >
              <NextImage
                src="/nex-logo.png"
                alt=""
                width={240}
                height={96}
                className="h-[50%] w-auto object-contain"
                aria-hidden
              />
              <p
                className="text-[#3d3f44] font-semibold tracking-tight lowercase"
                style={{ fontSize: 'clamp(1.2rem, 3.2vw, 2.8rem)' }}
              >
                {FRAME_MESSAGE}
              </p>
            </div>
            <div
              className="absolute inset-x-0 bottom-0 bg-[#d9d9db] flex items-center justify-center"
              style={{ height: `${FRAME_BOTTOM_PERCENT}%` }}
            >
              <p
                className="text-[#3d3f44] font-semibold tracking-tight lowercase"
                style={{ fontSize: 'clamp(1.5rem, 3.8vw, 3rem)' }}
              >
                {FRAME_MESSAGE}
              </p>
            </div>
          </div>
          
          {/* Botão trocar câmera - topo esquerdo (durante camera) */}
          {screen === 'camera' && (
            <button
              onClick={toggleCamera}
              className="absolute left-4 z-20 px-3 py-2 bg-black/70 text-white text-xs font-semibold rounded hover:bg-black active:scale-95 transition-all flex items-center gap-2"
              style={{ top: `calc(${FRAME_TOP_PERCENT}% + 1rem)` }}
              aria-label="Toggle camera"
              title={cameraFacing === 'user' ? 'Trocar para câmera traseira' : 'Trocar para câmera frontal'}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              {cameraFacing === 'user' ? 'Traseira' : 'Frontal'}
            </button>
          )}

          {/* Capture button (only in camera mode) */}
          {screen === 'camera' && (
            <div
              className="absolute left-0 right-0 z-20 flex flex-col items-center gap-5"
              style={{ bottom: `calc(${FRAME_BOTTOM_PERCENT}% + 1.5rem)` }}
            >
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
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
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
              className="w-full h-full object-contain bg-black"
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
