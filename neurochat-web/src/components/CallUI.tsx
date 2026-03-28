import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
  Minimize,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { MoodRing } from './MoodRing'

type CallState = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended'
type CallType = 'voice' | 'video'

interface CallUIProps {
  userName: string
  callType: CallType
  onEnd: () => void
  isIncoming?: boolean
  onAccept?: () => void
  onDecline?: () => void
}

export function CallUI({ userName, callType, onEnd, isIncoming, onAccept, onDecline }: CallUIProps) {
  const [state, setState] = useState<CallState>(isIncoming ? 'ringing' : 'connecting')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video')
  const [duration, setDuration] = useState(0)
  const [isMinimised, setIsMinimised] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const localStream = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)

  // Start local media
  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video' ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
      })
      localStream.current = stream
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play()
      }

      // Simulate connection delay
      setTimeout(() => setState('connected'), 1500)
    } catch (err) {
      console.error('Media access denied:', err)
      setState('ended')
    }
  }, [callType])

  // Start timer when connected
  useEffect(() => {
    if (state === 'connected') {
      timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state])

  // Auto-start for outgoing calls
  useEffect(() => {
    if (!isIncoming) startMedia()
    return () => {
      localStream.current?.getTracks().forEach((t) => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isIncoming, startMedia])

  function handleAccept() {
    onAccept?.()
    startMedia()
  }

  function handleDecline() {
    onDecline?.()
    setState('ended')
    setTimeout(onEnd, 500)
  }

  function handleEnd() {
    localStream.current?.getTracks().forEach((t) => t.stop())
    setState('ended')
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeout(onEnd, 500)
  }

  function toggleMute() {
    const audioTrack = localStream.current?.getAudioTracks()[0]
    if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsMuted(!isMuted) }
  }

  function toggleVideo() {
    const videoTrack = localStream.current?.getVideoTracks()[0]
    if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setIsVideoOn(!isVideoOn) }
  }

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  // Minimised floating bubble
  if (isMinimised && state === 'connected') {
    return (
      <button
        onClick={() => setIsMinimised(false)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-primary glow-primary animate-glow-pulse flex items-center justify-center shadow-xl"
      >
        <Phone className="w-5 h-5 text-white" />
        <span className="absolute -top-1 -right-1 text-[9px] font-mono bg-background text-foreground px-1 rounded-full border">
          {formatDuration(duration)}
        </span>
      </button>
    )
  }

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex flex-col',
      callType === 'video' ? 'bg-[#0a0a14]' : 'bg-gradient-to-b from-[#0a0e1a] to-[#141d2f]'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 z-10">
        <div className="text-white/60 text-xs">
          {state === 'ringing' && 'Incoming call...'}
          {state === 'connecting' && 'Connecting...'}
          {state === 'connected' && (
            <span className="font-mono tabular-nums">{formatDuration(duration)}</span>
          )}
          {state === 'ended' && 'Call ended'}
        </div>
        <div className="flex items-center gap-2">
          {state === 'connected' && (
            <button onClick={() => setIsMinimised(true)} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
              <Minimize className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Remote video placeholder (would be WebRTC remote stream) */}
        {callType === 'video' && state === 'connected' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0a14] flex items-center justify-center">
              {/* In production: remote video stream */}
              <div className="text-center">
                <MoodRing mood="positive" size="lg">
                  <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-2xl font-bold">
                    {getInitials(userName)}
                  </div>
                </MoodRing>
                <p className="text-white/40 text-xs mt-3">Waiting for video...</p>
              </div>
            </div>
          </div>
        )}

        {/* Local video (PiP) */}
        {callType === 'video' && isVideoOn && (
          <div className="absolute bottom-20 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden bg-black/80 shadow-xl z-10 border border-white/10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
        )}

        {/* Voice call UI */}
        {(callType === 'voice' || !isVideoOn) && (
          <div className="text-center animate-fade-in">
            <div className={cn('mx-auto mb-6', state === 'ringing' && 'animate-glow-pulse')}>
              <MoodRing mood="positive" size="lg">
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials(userName)}
                </div>
              </MoodRing>
            </div>
            <h2 className="text-white text-xl font-semibold">{userName}</h2>
            <p className="text-white/40 text-sm mt-1">
              {state === 'ringing' && 'Incoming call'}
              {state === 'connecting' && 'Calling...'}
              {state === 'connected' && (callType === 'voice' ? 'Voice call' : 'Camera off')}
              {state === 'ended' && 'Call ended'}
            </p>
            {state === 'connected' && (
              <p className="text-white/60 text-lg font-mono mt-2 tabular-nums">{formatDuration(duration)}</p>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-8 flex items-center justify-center">
        {state === 'ringing' && isIncoming ? (
          <div className="flex items-center gap-8">
            <button onClick={handleDecline}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all">
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
            <button onClick={handleAccept}
              className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all animate-glow-pulse">
              <Phone className="w-6 h-6 text-white" />
            </button>
          </div>
        ) : state === 'connected' ? (
          <div className="flex items-center gap-4">
            <button onClick={toggleMute}
              className={cn('w-12 h-12 rounded-full flex items-center justify-center transition-all',
                isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
              )}>
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            {callType === 'video' && (
              <button onClick={toggleVideo}
                className={cn('w-12 h-12 rounded-full flex items-center justify-center transition-all',
                  !isVideoOn ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
                )}>
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}
            <button onClick={handleEnd}
              className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all">
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        ) : state === 'connecting' ? (
          <button onClick={handleEnd}
            className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all">
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
