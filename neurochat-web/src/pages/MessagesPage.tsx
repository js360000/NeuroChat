import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Search, Send, Sparkles, Lightbulb, ArrowLeft,
  Settings, Hash, GraduationCap, Accessibility,
  Brain, MessageCircle, Camera, Phone, Video, Flag,
} from 'lucide-react'
import { messagesApi } from '@/lib/api/messages'
import { aiApi } from '@/lib/api/ai'
import { cn, formatTime, getInitials } from '@/lib/utils'
import { useChatStore } from '@/stores/chatStore'
import { MoodRing, type MoodType } from '@/components/MoodRing'
import { TypingIndicator } from '@/components/TypingIndicator'
import { MessageSkeleton, ConversationSkeleton } from '@/components/MessageSkeleton'
import { SmartReplies } from '@/components/SmartReplies'
import { RephrasePanel } from '@/components/RephrasePanel'
import { ConversationSummary } from '@/components/ConversationSummary'
import { EnergyMeter } from '@/components/EnergyMeter'
import { MediaCapture, ImageViewer } from '@/components/MediaCapture'
import { CallUI } from '@/components/CallUI'
import { ReportBlockDialog } from '@/components/ReportBlockDialog'
import { SafetyWarningDialog } from '@/components/SafetyWarningDialog'
import { scanTextForWarnings, type SafetyWarning } from '@/lib/safety'
import { AACInput } from '@/components/AACInput'
import { SocialCoach } from '@/components/SocialCoach'
import { getSocket } from '@/lib/socket'
import { toast } from 'sonner'
import type { Conversation, Message, AIExplanation } from '@/types'

const TONE_TAGS = [
  { tag: '/j',    label: 'Joking',      emoji: '😄', color: 'text-amber-400 bg-amber-500/10' },
  { tag: '/srs',  label: 'Serious',     emoji: '🎯', color: 'text-blue-400 bg-blue-500/10' },
  { tag: '/gen',  label: 'Genuine',     emoji: '💚', color: 'text-emerald-400 bg-emerald-500/10' },
  { tag: '/info', label: 'Info',        emoji: '💡', color: 'text-cyan-400 bg-cyan-500/10' },
  { tag: '/nm',   label: 'Not mad',     emoji: '😌', color: 'text-violet-400 bg-violet-500/10' },
  { tag: '/pos',  label: 'Positive',    emoji: '✨', color: 'text-pink-400 bg-pink-500/10' },
]

function inferMood(messages: Message[]): MoodType {
  if (messages.length === 0) return 'neutral'
  const recent = messages.slice(-5)
  const tones = recent.map((m) => m.toneTag).filter(Boolean)
  if (tones.includes('/j') || tones.includes('/pos')) return 'playful'
  if (tones.includes('/srs')) return 'tense'
  if (tones.includes('/gen') || tones.includes('/nm')) return 'supportive'
  return 'positive'
}

export function MessagesPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageDraft, setMessageDraft] = useState('')
  const [selectedToneTag, setSelectedToneTag] = useState('')
  const [showTonePicker, setShowTonePicker] = useState(false)
  const [explanations, setExplanations] = useState<Record<string, AIExplanation>>({})
  const [explainLoading, setExplainLoading] = useState<string | null>(null)
  const [showExplain, setShowExplain] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [viewImage, setViewImage] = useState<string | null>(null)
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video'; userName: string } | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [safetyWarnings, setSafetyWarnings] = useState<SafetyWarning[]>([])
  const [showSafetyDialog, setShowSafetyDialog] = useState(false)
  const [showSocialCoach, setShowSocialCoach] = useState(false)
  const [aacEnabled, setAacEnabled] = useState(() => {
    try { const u = JSON.parse(localStorage.getItem('neurochat_user') || '{}'); return !!u.aacMode } catch { return false }
  })
  const [aacLevel] = useState<'symbol' | 'hybrid' | 'text-assisted'>(() => {
    try { const u = JSON.parse(localStorage.getItem('neurochat_user') || '{}'); return u.aacLevel || 'hybrid' } catch { return 'hybrid' }
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { smartReplies: showSmartReplies, messageAnimations, showTimestamps } = useChatStore()

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId)
    }
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket.io: listen for typing, new messages, read receipts
  useEffect(() => {
    const socket = getSocket()
    const onTypingStart = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) setIsTyping(true)
    }
    const onTypingStop = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) setIsTyping(false)
    }
    const onNewMessage = (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => [...prev, data.message])
      }
      // Refresh conversation list for unread counts
      loadConversations()
    }
    const onUserOnline = (data: { userId: string }) => {
      setConversations(prev => prev.map(c => c.user.id === data.userId ? { ...c, user: { ...c.user, isOnline: true } } : c))
    }
    const onUserOffline = (data: { userId: string }) => {
      setConversations(prev => prev.map(c => c.user.id === data.userId ? { ...c, user: { ...c.user, isOnline: false } } : c))
    }

    socket.on('typing:start', onTypingStart)
    socket.on('typing:stop', onTypingStop)
    socket.on('message:new', onNewMessage)
    socket.on('user:online', onUserOnline)
    socket.on('user:offline', onUserOffline)

    return () => {
      socket.off('typing:start', onTypingStart)
      socket.off('typing:stop', onTypingStop)
      socket.off('message:new', onNewMessage)
      socket.off('user:online', onUserOnline)
      socket.off('user:offline', onUserOffline)
    }
  }, [conversationId])

  async function loadConversations() {
    try {
      const data = await messagesApi.getConversations()
      setConversations(data.conversations)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadMessages(convId: string) {
    setMessagesLoading(true)
    try {
      const data = await messagesApi.getMessages(convId)
      setMessages(data.messages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  function trySendMessage() {
    if (!messageDraft.trim() || !conversationId) return
    // Safety scan before sending
    const warnings = scanTextForWarnings(messageDraft)
    if (warnings.length > 0) {
      setSafetyWarnings(warnings)
      setShowSafetyDialog(true)
      return
    }
    doSendMessage()
  }

  // Emit typing events on input change
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleInputChange(value: string) {
    setMessageDraft(value)
    if (!conversationId) return
    const socket = getSocket()
    const userId = (() => { try { return JSON.parse(localStorage.getItem('neurochat_user') || '{}').id } catch { return 'me' } })()
    socket.emit('typing:start', { conversationId, userId })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId, userId })
    }, 1500)
  }

  // Emit read receipt when opening a conversation
  useEffect(() => {
    if (!conversationId) return
    const socket = getSocket()
    const userId = (() => { try { return JSON.parse(localStorage.getItem('neurochat_user') || '{}').id } catch { return 'me' } })()
    socket.emit('message:read', { conversationId, userId, readAt: new Date().toISOString() })
  }, [conversationId, messages.length])

  async function doSendMessage() {
    if (!messageDraft.trim() || !conversationId) return
    try {
      const data = await messagesApi.sendMessage({
        conversationId,
        content: messageDraft,
        toneTag: selectedToneTag || undefined,
      })
      setMessages((prev) => [...prev, data.message])
      setMessageDraft('')
      setSelectedToneTag('')
      setShowTonePicker(false)
      // Notify recipient via socket
      const socket = getSocket()
      const recipientId = currentConversation?.user.id
      if (recipientId) {
        socket.emit('message:new', { conversationId, message: data.message, recipientId })
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(error.response.data?.error || 'Message blocked by moderation')
      } else {
        toast.error('Failed to send message')
      }
    }
  }

  async function handleAacSend(text: string) {
    if (!text.trim() || !conversationId) return
    try {
      const data = await messagesApi.sendMessage({ conversationId, content: text, toneTag: undefined })
      setMessages((prev) => [...prev, data.message])
      setIsTyping(true)
    } catch (error: any) {
      if (error.response?.status === 403) toast.error(error.response.data?.error || 'Message blocked')
      else toast.error('Failed to send message')
    }
  }

  function handleImageCapture(dataUrl: string) {
    // Send as a special image message (base64 inline for demo; production would use blob storage)
    if (!conversationId) return
    messagesApi.sendMessage({
      conversationId,
      content: `[image:${dataUrl.slice(0, 50)}...]`, // Truncated placeholder — real impl would upload
      toneTag: undefined,
    }).then((data) => {
      setMessages((prev) => [...prev, data.message])
    }).catch(() => toast.error('Failed to send image'))
    setShowCamera(false)
  }

  async function explainMessage(message: Message) {
    if (explanations[message.id]) {
      setShowExplain((prev) => {
        const next = new Set(prev)
        next.has(message.id) ? next.delete(message.id) : next.add(message.id)
        return next
      })
      return
    }

    setExplainLoading(message.id)
    try {
      const context = messages
        .filter((m) => m.createdAt <= message.createdAt)
        .slice(-5)
        .map((m) => `${m.sender.name}: ${m.content}`)
        .join('\n')

      const data = await aiApi.explainMessage(message.content, message.toneTag, context)
      setExplanations((prev) => ({ ...prev, [message.id]: data.explanation }))
      setShowExplain((prev) => new Set([...prev, message.id]))
    } catch (error) {
      console.error('Failed to explain message:', error)
    } finally {
      setExplainLoading(null)
    }
  }

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations || []
    const q = searchQuery.toLowerCase()
    return (conversations || []).filter(
      (c) =>
        c.user.name.toLowerCase().includes(q) ||
        c.lastMessage?.content.toLowerCase().includes(q)
    )
  }, [conversations, searchQuery])

  const currentConversation = (conversations || []).find((c) => c.id === conversationId)
  const mood = inferMood(messages || [])
  const lastReceivedMessage = [...(messages || [])].reverse().find((m) => !m.isMe)

  // ═══════════════════════════════════════════
  // No conversation selected — conversation list
  // ═══════════════════════════════════════════
  if (!conversationId) {
    return (
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className="w-full md:w-sidebar border-r border-border/50 flex flex-col bg-neural pb-16 md:pb-0">
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-semibold tracking-tight">Messages</h1>
              <div className="flex items-center gap-1">
                <EnergyMeter compact />
                <button
                  className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-4.5 h-4.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2.5 bg-muted/40 glass rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto py-1">
            {isLoading ? (
              <ConversationSkeleton count={5} />
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {searchQuery ? 'Try a different search term' : 'Start a conversation to get going'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv, i) => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 mx-2 rounded-xl transition-all',
                    'hover:bg-muted/30 active:scale-[0.98]',
                    'animate-fade-in',
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <MoodRing mood="neutral" isOnline={conv.user.isOnline} size="md">
                    <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-sm font-medium">
                      {getInitials(conv.user.name)}
                    </div>
                  </MoodRing>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{conv.user.name}</span>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate pr-2">
                        {conv.lastMessage?.content || 'Start a conversation'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Empty state — desktop only */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center bg-neural">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4 animate-float">
            <Brain className="w-8 h-8 text-primary/40" />
          </div>
          <h2 className="text-lg font-semibold text-foreground/70">Select a conversation</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Choose someone to chat with, or start a new conversation
          </p>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════
  // Conversation selected — chat view
  // ═══════════════════════════════════════════
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar — desktop */}
      <div className="w-sidebar border-r border-border/50 hidden md:flex flex-col bg-neural">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold tracking-tight">Messages</h1>
            <EnergyMeter compact />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2.5 bg-muted/40 glass rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => navigate(`/messages/${conv.id}`)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 mx-2 rounded-xl transition-all',
                'hover:bg-muted/30',
                conv.id === conversationId && 'bg-primary/5 ring-1 ring-primary/10'
              )}
            >
              <MoodRing mood="neutral" isOnline={conv.user.isOnline} size="sm">
                <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-[10px] font-medium">
                  {getInitials(conv.user.name)}
                </div>
              </MoodRing>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className={cn('text-sm truncate', conv.id === conversationId ? 'font-semibold' : 'font-medium')}>
                    {conv.user.name}
                  </span>
                  {conv.lastMessage && (
                    <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                      {formatTime(conv.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {conv.lastMessage?.content || 'No messages'}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-border/50 glass-heavy flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/messages')}
              className="md:hidden p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <MoodRing mood={mood} isOnline={currentConversation?.user.isOnline} size="md" showLabel={false}>
              <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-sm font-medium">
                {currentConversation ? getInitials(currentConversation.user.name) : '?'}
              </div>
            </MoodRing>
            <div>
              <h2 className="font-semibold text-sm leading-tight">{currentConversation?.user.name || 'Chat'}</h2>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                {currentConversation?.user.isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Online
                  </>
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ConversationSummary messages={messages} />
            <button onClick={() => setActiveCall({ type: 'voice', userName: currentConversation?.user.name || 'User' })} className="p-2 rounded-xl hover:bg-muted/50 transition-colors" title="Voice call">
              <Phone className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setActiveCall({ type: 'video', userName: currentConversation?.user.name || 'User' })} className="p-2 rounded-xl hover:bg-muted/50 transition-colors" title="Video call">
              <Video className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setShowSocialCoach(!showSocialCoach)} className={cn("p-2 rounded-xl hover:bg-muted/50 transition-colors", showSocialCoach && "bg-primary/10 text-primary")} title="Social Coach">
              <GraduationCap className="w-4 h-4" />
            </button>
            <button onClick={() => setShowReport(true)} className="p-2 rounded-xl hover:bg-muted/50 transition-colors" title="Report / Block">
              <Flag className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-neural">
          {messagesLoading ? (
            <MessageSkeleton count={6} />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-3 animate-float-slow">
                <Sparkles className="w-7 h-7 text-primary/30" />
              </div>
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Say hello to start the conversation</p>
            </div>
          ) : (
            <>
              {/* Date separator could go here */}
              {messages.map((message, idx) => {
                const isFirstInGroup = idx === 0 || messages[idx - 1].isMe !== message.isMe
                const isLastInGroup = idx === messages.length - 1 || messages[idx + 1]?.isMe !== message.isMe

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-2.5 max-w-[85%] md:max-w-[70%]',
                      message.isMe && 'ml-auto flex-row-reverse',
                      messageAnimations && 'animate-message-pop',
                      !isFirstInGroup && 'mt-0.5'
                    )}
                    style={messageAnimations ? { animationDelay: `${Math.min(idx * 30, 300)}ms` } : undefined}
                  >
                    {/* Avatar — only on first message in group */}
                    {!message.isMe && (
                      <div className={cn('shrink-0', !isFirstInGroup && 'invisible')}>
                        <MoodRing mood={mood} size="sm">
                          <div className="w-full h-full bg-gradient-to-br from-primary/70 to-secondary/70 flex items-center justify-center text-white text-[10px] font-medium">
                            {getInitials(message.sender.name)}
                          </div>
                        </MoodRing>
                      </div>
                    )}

                    <div className={cn('flex flex-col', message.isMe ? 'items-end' : 'items-start')}>
                      {/* Message bubble */}
                      <div
                        className={cn(
                          'px-3.5 py-2.5 transition-all',
                          message.isMe
                            ? cn(
                                'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground',
                                isFirstInGroup && isLastInGroup && 'rounded-2xl',
                                isFirstInGroup && !isLastInGroup && 'rounded-2xl rounded-br-lg',
                                !isFirstInGroup && isLastInGroup && 'rounded-2xl rounded-tr-lg',
                                !isFirstInGroup && !isLastInGroup && 'rounded-xl',
                              )
                            : cn(
                                'glass text-foreground',
                                isFirstInGroup && isLastInGroup && 'rounded-2xl',
                                isFirstInGroup && !isLastInGroup && 'rounded-2xl rounded-bl-lg',
                                !isFirstInGroup && isLastInGroup && 'rounded-2xl rounded-tl-lg',
                                !isFirstInGroup && !isLastInGroup && 'rounded-xl',
                              )
                        )}
                      >
                        {/* Tone tag badge */}
                        {message.toneTag && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md mb-1',
                              message.isMe ? 'bg-white/15' : 'bg-primary/10 text-primary'
                            )}
                          >
                            {TONE_TAGS.find((t) => t.tag === message.toneTag)?.emoji}
                            {message.toneTag}
                          </span>
                        )}
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        {showTimestamps && isLastInGroup && (
                          <span className={cn(
                            'text-[10px] mt-1 block',
                            message.isMe ? 'text-primary-foreground/50' : 'text-muted-foreground/60'
                          )}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {/* Explain button */}
                      {!message.isMe && message.content && isLastInGroup && (
                        <button
                          onClick={() => explainMessage(message)}
                          disabled={explainLoading === message.id}
                          className={cn(
                            'mt-1 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg transition-all',
                            'text-muted-foreground hover:text-primary hover:bg-primary/5',
                            'disabled:opacity-50'
                          )}
                        >
                          <Lightbulb className="w-3 h-3" />
                          {explainLoading === message.id
                            ? 'Analysing...'
                            : explanations[message.id]
                              ? (showExplain.has(message.id) ? 'Hide analysis' : 'Show analysis')
                              : 'Explain'
                          }
                        </button>
                      )}

                      {/* AI Explanation panel */}
                      {explanations[message.id] && showExplain.has(message.id) && (
                        <div className="mt-2 p-3 rounded-xl glass glow-sm max-w-xs animate-scale-in">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                              <Brain className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-[11px] font-semibold">AI Analysis</span>
                          </div>

                          {/* Tone + confidence */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                              {explanations[message.id].tone}
                            </span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                                style={{ width: `${explanations[message.id].confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round(explanations[message.id].confidence * 100)}%
                            </span>
                          </div>

                          {/* Hidden meanings */}
                          {explanations[message.id].hiddenMeanings.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Hidden meanings
                              </p>
                              <ul className="space-y-0.5">
                                {explanations[message.id].hiddenMeanings.map((m, i) => (
                                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                                    <span className="text-primary/60 mt-0.5">&#x2022;</span>
                                    {m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Social cues */}
                          {explanations[message.id].socialCues.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Social cues
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {explanations[message.id].socialCues.map((cue, i) => (
                                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                                    {cue}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Suggested responses */}
                          {explanations[message.id].suggestions.length > 0 && (
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Try responding with
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {explanations[message.id].suggestions.map((s, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setMessageDraft(s)}
                                    className="text-[11px] px-2 py-1 rounded-lg bg-primary/5 hover:bg-primary/10 text-foreground/80 hover:text-primary transition-all active:scale-95"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2.5">
                  <MoodRing mood={mood} size="sm">
                    <div className="w-full h-full bg-gradient-to-br from-primary/70 to-secondary/70 flex items-center justify-center text-white text-[10px] font-medium">
                      {currentConversation ? getInitials(currentConversation.user.name) : '?'}
                    </div>
                  </MoodRing>
                  <TypingIndicator />
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Smart replies */}
        {showSmartReplies && (
          <div className="px-4 pt-2">
            <SmartReplies
              lastMessage={lastReceivedMessage}
              onSelect={(text) => {
                setMessageDraft(text)
                inputRef.current?.focus()
              }}
            />
          </div>
        )}

        {/* Input area */}
        <div className="p-3 border-t border-border/50 glass-heavy">
          {/* AAC mode — replaces standard input */}
          {aacEnabled ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-primary flex items-center gap-1">
                  <Accessibility className="w-3 h-3" /> AAC Mode
                </span>
                <button onClick={() => setAacEnabled(false)} className="text-[10px] text-muted-foreground hover:text-foreground">
                  Switch to keyboard
                </button>
              </div>
              <AACInput level={aacLevel} onSend={handleAacSend} />
            </div>
          ) : (
            <>
              {/* Tone tag picker */}
              {showTonePicker && (
                <div className="flex gap-1.5 mb-2 flex-wrap animate-slide-up">
                  {TONE_TAGS.map((t) => (
                    <button
                      key={t.tag}
                      onClick={() => {
                        setSelectedToneTag(selectedToneTag === t.tag ? '' : t.tag)
                        setShowTonePicker(false)
                      }}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                        selectedToneTag === t.tag
                          ? 'bg-primary text-primary-foreground glow-sm'
                          : t.color,
                        'hover:scale-105 active:scale-95'
                      )}
                    >
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected tone indicator */}
              {selectedToneTag && !showTonePicker && (
                <div className="flex items-center gap-1.5 mb-2 animate-fade-in">
                  <span className="text-[10px] text-muted-foreground">Tone:</span>
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg',
                    TONE_TAGS.find((t) => t.tag === selectedToneTag)?.color
                  )}>
                    {TONE_TAGS.find((t) => t.tag === selectedToneTag)?.emoji}
                    {TONE_TAGS.find((t) => t.tag === selectedToneTag)?.label}
                  </span>
                  <button
                    onClick={() => setSelectedToneTag('')}
                    className="text-[10px] text-muted-foreground hover:text-destructive"
                  >
                    &#x2715;
                  </button>
                </div>
              )}

              {/* Input row */}
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowTonePicker(!showTonePicker)}
                    className={cn(
                      'p-2.5 rounded-xl transition-all',
                      'hover:bg-muted/50',
                      showTonePicker && 'bg-primary/10 text-primary',
                      selectedToneTag && 'text-primary'
                    )}
                    title="Add tone tag"
                  >
                    <Hash className="w-4.5 h-4.5" />
                  </button>
                  <RephrasePanel
                    text={messageDraft}
                    onSelect={(text) => setMessageDraft(text)}
                  />
                  <button
                    onClick={() => setShowCamera(true)}
                    className="p-2.5 rounded-xl transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Send photo"
                  >
                    <Camera className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => setAacEnabled(true)}
                    className="p-2.5 rounded-xl transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Switch to AAC input"
                  >
                    <Accessibility className="w-4.5 h-4.5" />
                  </button>
                </div>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={messageDraft}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && trySendMessage()}
                    placeholder="Type a message..."
                    className={cn(
                      'w-full px-4 py-2.5 rounded-2xl text-sm transition-all',
                      'bg-muted/40 glass',
                      'placeholder:text-muted-foreground/50',
                      'focus:outline-none focus:ring-1 focus:ring-primary/30 focus:bg-muted/60',
                    )}
                  />
                </div>
                <button
                  onClick={trySendMessage}
                  disabled={!messageDraft.trim()}
                  className={cn(
                    'p-2.5 rounded-xl transition-all',
                    messageDraft.trim()
                      ? 'bg-primary text-primary-foreground glow-primary hover:brightness-110 active:scale-95'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Social Coach panel */}
        {showSocialCoach && (
          <SocialCoach
            message={messageDraft}
            conversationContext={messages.slice(-10).map(m => `${m.sender.name}: ${m.content}`)}
            onSuggestion={(text) => {
              setMessageDraft(text)
              inputRef.current?.focus()
            }}
          />
        )}
      </div>

      {/* ═══ Overlays ═══ */}

      {/* Camera / media capture */}
      {showCamera && (
        <MediaCapture onCapture={handleImageCapture} onClose={() => setShowCamera(false)} />
      )}

      {/* Image viewer */}
      {viewImage && (
        <ImageViewer src={viewImage} onClose={() => setViewImage(null)} />
      )}

      {/* Voice / Video call */}
      {activeCall && (
        <CallUI
          userName={activeCall.userName}
          callType={activeCall.type}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {/* Report / Block dialog */}
      {showReport && currentConversation && (
        <ReportBlockDialog
          open={showReport}
          onClose={() => setShowReport(false)}
          targetUserId={currentConversation.user.id}
          targetUserName={currentConversation.user.name}
          mode="report-and-block"
        />
      )}

      {/* Safety warning dialog */}
      <SafetyWarningDialog
        open={showSafetyDialog}
        warnings={safetyWarnings}
        onConfirm={() => { setShowSafetyDialog(false); doSendMessage() }}
        onCancel={() => setShowSafetyDialog(false)}
      />
    </div>
  )
}
