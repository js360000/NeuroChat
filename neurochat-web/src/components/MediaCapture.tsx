import { useState, useRef, useCallback } from 'react'
import { Camera, Image, X, Send, RotateCcw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaCaptureProps {
  onCapture: (dataUrl: string) => void
  onClose: () => void
  className?: string
}

export function MediaCapture({ onCapture, onClose, className }: MediaCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)
  const [mode, setMode] = useState<'choose' | 'camera' | 'preview'>('choose')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [isStarting, setIsStarting] = useState(false)

  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    setIsStarting(true)
    try {
      if (stream) { stream.getTracks().forEach((t) => t.stop()) }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setStream(newStream)
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        videoRef.current.play()
      }
      setMode('camera')
      setFacingMode(facing)
    } catch (err) {
      console.error('Camera access denied:', err)
    } finally {
      setIsStarting(false)
    }
  }, [stream, facingMode])

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Mirror for front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCaptured(dataUrl)
    setMode('preview')
    // Stop camera
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
  }, [stream, facingMode])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      setCaptured(reader.result as string)
      setMode('preview')
    }
    reader.readAsDataURL(file)
  }

  const retake = () => {
    setCaptured(null)
    startCamera()
  }

  const send = () => {
    if (captured) { onCapture(captured) }
    cleanup()
  }

  const cleanup = () => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setCaptured(null)
    setMode('choose')
    onClose()
  }

  return (
    <div className={cn('fixed inset-0 z-50 bg-black/90 flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={cleanup} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
        {mode === 'camera' && (
          <button
            onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {mode === 'choose' && (
          <div className="space-y-4 text-center animate-scale-in">
            <p className="text-white/60 text-sm">Share a photo</p>
            <div className="flex gap-4">
              <button onClick={() => startCamera()} disabled={isStarting}
                className="flex flex-col items-center gap-2 px-6 py-5 rounded-2xl bg-white/10 hover:bg-white/15 transition-all">
                {isStarting ? <Loader2 className="w-7 h-7 text-white animate-spin" /> : <Camera className="w-7 h-7 text-white" />}
                <span className="text-xs text-white/70">Camera</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 px-6 py-5 rounded-2xl bg-white/10 hover:bg-white/15 transition-all">
                <Image className="w-7 h-7 text-white" />
                <span className="text-xs text-white/70">Gallery</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </div>
        )}

        {mode === 'camera' && (
          <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden bg-black animate-fade-in">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn('w-full h-full object-cover', facingMode === 'user' && 'scale-x-[-1]')}
            />
          </div>
        )}

        {mode === 'preview' && captured && (
          <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden bg-black animate-fade-in">
            <img src={captured} alt="Captured" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 flex items-center justify-center gap-6">
        {mode === 'camera' && (
          <button onClick={takePhoto}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
            <div className="w-12 h-12 rounded-full bg-white" />
          </button>
        )}
        {mode === 'preview' && (
          <>
            <button onClick={retake}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all">
              <RotateCcw className="w-4 h-4" /> Retake
            </button>
            <button onClick={send}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-primary hover:brightness-110 transition-all">
              <Send className="w-4 h-4" /> Send
            </button>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

// ═══════════════════════════════════════════
// Inline image viewer
// ═══════════════════════════════════════════

export function ImageViewer({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 z-10">
        <X className="w-5 h-5 text-white" />
      </button>
      <img src={src} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
    </div>
  )
}
