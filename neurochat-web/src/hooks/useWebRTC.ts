import { useState, useRef, useCallback, useEffect } from 'react'
import { getSocket } from '@/lib/socket'
import { api } from '@/lib/api/client'

export type CallState = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended'
export type CallType = 'voice' | 'video'

interface IncomingCall {
  callId: string
  callerId: string
  callerName: string
  type: CallType
}

export function useWebRTC() {
  const [callState, setCallState] = useState<CallState>('idle')
  const [callId, setCallId] = useState<string | null>(null)
  const [callType, setCallType] = useState<CallType>('voice')
  const [peerName, setPeerName] = useState('')
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)

  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const remoteStream = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const timerRef = useRef<number | null>(null)

  // Fetch ICE servers from backend
  const getIceServers = useCallback(async () => {
    try {
      const res = await api.get<{ iceServers: RTCIceServer[] }>('/calls/ice-servers')
      return res.data.iceServers
    } catch {
      return [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  }, [])

  // Create RTCPeerConnection
  const createPeerConnection = useCallback(async () => {
    const iceServers = await getIceServers()
    const pc = new RTCPeerConnection({ iceServers })

    // Send ICE candidates to peer via signalling
    pc.onicecandidate = (event) => {
      if (event.candidate && callId) {
        getSocket().emit('webrtc:ice-candidate', { callId, candidate: event.candidate.toJSON() })
      }
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (!remoteStream.current) {
        remoteStream.current = new MediaStream()
      }
      remoteStream.current.addTrack(event.track)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream.current
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected')
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall()
      }
    }

    peerConnection.current = pc
    return pc
  }, [callId, getIceServers])

  // Start local media
  const startMedia = useCallback(async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video' ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
    })
    localStream.current = stream
    if (localVideoRef.current && type === 'video') {
      localVideoRef.current.srcObject = stream
    }
    return stream
  }, [])

  // Initiate outgoing call
  const startCall = useCallback(async (calleeId: string, peeName: string, type: CallType) => {
    const socket = getSocket()
    setCallType(type)
    setPeerName(peeName)
    setCallState('ringing')
    setIsVideoOn(type === 'video')

    socket.emit('call:initiate', { calleeId, type })

    socket.once('call:initiated', async ({ callId: newCallId }: { callId: string }) => {
      setCallId(newCallId)
      setCallState('connecting')

      const stream = await startMedia(type)
      const pc = await createPeerConnection()
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('webrtc:offer', { callId: newCallId, sdp: offer })
    })

    socket.once('call:declined', () => {
      setCallState('ended')
      cleanup()
    })
  }, [startMedia, createPeerConnection])

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return
    const socket = getSocket()
    const { callId: inCallId, type } = incomingCall

    setCallId(inCallId)
    setCallType(type)
    setPeerName(incomingCall.callerName)
    setCallState('connecting')
    setIsVideoOn(type === 'video')
    setIncomingCall(null)

    socket.emit('call:accept', { callId: inCallId })

    const stream = await startMedia(type)
    const pc = await createPeerConnection()
    stream.getTracks().forEach((track) => pc.addTrack(track, stream))

    // Wait for SDP offer from caller
    socket.once('webrtc:offer', async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('webrtc:answer', { callId: inCallId, sdp: answer })
    })
  }, [incomingCall, startMedia, createPeerConnection])

  // Decline incoming call
  const declineCall = useCallback(() => {
    if (!incomingCall) return
    getSocket().emit('call:decline', { callId: incomingCall.callId })
    setIncomingCall(null)
  }, [incomingCall])

  // End current call
  const endCall = useCallback(() => {
    if (callId) {
      getSocket().emit('call:end', { callId })
    }
    setCallState('ended')
    cleanup()
  }, [callId])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const audioTrack = localStream.current?.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setIsMuted(!audioTrack.enabled)
    }
  }, [])

  // Toggle video
  const toggleVideo = useCallback(() => {
    const videoTrack = localStream.current?.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      setIsVideoOn(videoTrack.enabled)
    }
  }, [])

  // Cleanup
  function cleanup() {
    localStream.current?.getTracks().forEach((t) => t.stop())
    localStream.current = null
    remoteStream.current = null
    peerConnection.current?.close()
    peerConnection.current = null
    if (timerRef.current) clearInterval(timerRef.current)
    setDuration(0)
    setCallId(null)
    setTimeout(() => setCallState('idle'), 1000)
  }

  // Duration timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [callState])

  // Listen for incoming calls and WebRTC signals
  useEffect(() => {
    const socket = getSocket()

    const handleIncoming = (data: IncomingCall) => {
      setIncomingCall(data)
    }

    const handleAnswer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp))
      }
    }

    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
      }
    }

    const handleEnded = () => {
      setCallState('ended')
      cleanup()
    }

    socket.on('call:incoming', handleIncoming)
    socket.on('webrtc:answer', handleAnswer)
    socket.on('webrtc:ice-candidate', handleIceCandidate)
    socket.on('call:ended', handleEnded)

    return () => {
      socket.off('call:incoming', handleIncoming)
      socket.off('webrtc:answer', handleAnswer)
      socket.off('webrtc:ice-candidate', handleIceCandidate)
      socket.off('call:ended', handleEnded)
    }
  }, [])

  return {
    callState,
    callType,
    callId,
    peerName,
    incomingCall,
    duration,
    isMuted,
    isVideoOn,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
  }
}
