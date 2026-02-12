
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import {
  MessageCircle,
  Search,
  Send,
  Tag,
  ShieldCheck,
  Clock,
  Sparkles,
  LifeBuoy,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  ImagePlus,
  EyeOff,
  ShieldAlert,
  BookOpen,
  X,
  Crown,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrustLevelBadge } from '@/components/TrustLevelBadge';
import { safetyApi } from '@/lib/api/safety';
import { GuardianNudge } from '@/components/GuardianNudge';
import { PassportCard } from '@/components/PassportCard';
import { SensoryProfileCard } from '@/components/SensoryProfileCard';
import { BoundariesIntroCard } from '@/components/BoundariesIntroCard';
import { VenueSuggestions } from '@/components/VenueSuggestions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ContentWarningDialog } from '@/components/ContentWarningDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AdBanner } from '@/components/AdBanner';
import { cn, isQuietHoursActive, formatTime } from '@/lib/utils';
import { aiApi, type AIRephrase, type AISummary } from '@/lib/api/ai';
import { messagesApi, type Conversation, type Message } from '@/lib/api/messages';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth';
import { scanTextForWarnings } from '@/lib/safety';
import { toast } from 'sonner';

const QUICK_REPLIES = [
  'Thanks for checking in.',
  'Can we slow this down a bit?',
  'I need a little more time to respond.',
  'That makes sense to me.',
  'I appreciate you sharing that.'
];

const TONE_TAGS = ['/j', '/srs', '/gen', '/info', '/nm', '/pos'];

const SLOW_SEND_DELAY = 15;
const LOAD_LIMIT = 50;
const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

export function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [toneTag, setToneTag] = useState('');
  const [summaryMode, setSummaryMode] = useState(false);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [pendingSend, setPendingSend] = useState<{ content: string; toneTag?: string; imageUrl?: string; isNsfw?: boolean } | null>(null);
  const [slowMode, setSlowMode] = useState(false);
  const [slowDialogOpen, setSlowDialogOpen] = useState(false);
  const [slowCountdown, setSlowCountdown] = useState(0);
  const [queuedSend, setQueuedSend] = useState<{ content: string; toneTag?: string; imageUrl?: string; isNsfw?: boolean } | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [tagConversation, setTagConversation] = useState<Conversation | null>(null);
  const [isRephraseOpen, setIsRephraseOpen] = useState(false);
  const [rephraseOptions, setRephraseOptions] = useState<AIRephrase | null>(null);
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [canSendImages, setCanSendImages] = useState(false);
  const [markNsfw, setMarkNsfw] = useState(false);
  const [revealedNsfw, setRevealedNsfw] = useState<Set<string>>(new Set());
  const [safetyGuideOpen, setSafetyGuideOpen] = useState(false);
  const [safetyOnboardingShown, setSafetyOnboardingShown] = useState(() => {
    return localStorage.getItem('neuronest_msg_safety_seen') === '1';
  });

  const socketRef = useRef<Socket | null>(null);
  const imageFileRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const slowTimerRef = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const activeConversationId = conversationId || null;
  const activeConversation = useMemo(
    () => conversations.find((conv) => conv.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conv) => {
      const name = conv.user?.name?.toLowerCase() || '';
      const tags = conv.tags?.join(' ').toLowerCase() || '';
      const last = conv.lastMessage?.content.toLowerCase() || '';
      return name.includes(query) || tags.includes(query) || last.includes(query);
    });
  }, [conversations, searchQuery]);
  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (isLoadingConversations) return;
    if (!activeConversationId && conversations.length > 0) {
      navigate(`/messages/${conversations[0].id}`, { replace: true });
    }
  }, [isLoadingConversations, conversations, activeConversationId, navigate]);

  useEffect(() => {
    if (!activeConversationId) return;
    // If navigated to a conversation not in the list (e.g. just created), re-fetch
    if (!isLoadingConversations && !conversations.find((c) => c.id === activeConversationId)) {
      loadConversations();
    }
    loadMessages(activeConversationId);
    markAsRead(activeConversationId);
    // Fetch trust level to gate image sending
    safetyApi.getTrustLevel(activeConversationId)
      .then((info) => setCanSendImages(info.features.images))
      .catch(() => setCanSendImages(false));
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversation) return;
    setSlowMode(activeConversation.user?.communicationPreferences?.responsePace === 'slow');
  }, [activeConversation]);

  useEffect(() => {
    const token = api.getToken();
    if (!token) return;
    const explicitApiUrl = import.meta.env.VITE_API_URL as string | undefined;
    // When using Vite proxy (no VITE_API_URL), connect to same origin — Vite proxies /socket.io
    // When explicit URL is set (e.g. http://localhost:3001/api), strip /api to get socket base
    const socketUrl = explicitApiUrl ? explicitApiUrl.replace(/\/api\/?$/, '') : undefined;

    const socket = io(socketUrl || window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('message', (payload: { conversationId: string; message: Message }) => {
      const incoming = payload.message;
      const isOwn = incoming.sender.id === user?.id;

      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id !== payload.conversationId) return conv;
          return {
            ...conv,
            lastMessage: {
              id: incoming.id,
              content: incoming.content,
              toneTag: incoming.toneTag,
              createdAt: incoming.createdAt,
              isMe: isOwn
            },
            unreadCount:
              isOwn || payload.conversationId === activeConversationId
                ? 0
                : Math.max(0, (conv.unreadCount || 0) + 1),
            updatedAt: incoming.createdAt
          };
        });
        return updated.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

      // Skip own messages — handleSendNow already appends them from the HTTP response
      if (isOwn) return;

      if (payload.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === incoming.id)) return prev;
          return [...prev, { ...incoming, isMe: false }];
        });
        markAsRead(payload.conversationId);
      }
    });

    socket.on('read', (payload: { conversationId: string; userId: string }) => {
      if (payload.userId === user?.id) return;
      if (payload.conversationId !== activeConversationId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isMe && !msg.readAt ? { ...msg, readAt: new Date().toISOString() } : msg
        )
      );
    });

    socket.on('typing', (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.conversationId !== activeConversationId) return;
      if (payload.userId === user?.id) return;
      setPartnerTyping(payload.isTyping);
    });

    socket.on('reaction', (payload: { conversationId: string; messageId: string; reactions: any[] }) => {
      if (payload.conversationId !== activeConversationId) return;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === payload.messageId ? { ...msg, reactions: payload.reactions } : msg))
      );
    });

    socket.on('trust-level-changed', (payload: { conversationId: string; trustLevel: number; features: { images: boolean } }) => {
      if (payload.conversationId === activeConversationId) {
        setCanSendImages(payload.features.images);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('join', activeConversationId);
    return () => {
      socket.emit('leave', activeConversationId);
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeConversationId]);

  useEffect(() => {
    if (!slowDialogOpen || !queuedSend) return;
    if (slowCountdown <= 0) return;

    slowTimerRef.current = window.setInterval(() => {
      setSlowCountdown((prev) => prev - 1);
    }, 1000);

    return () => {
      if (slowTimerRef.current) {
        window.clearInterval(slowTimerRef.current);
      }
    };
  }, [slowDialogOpen, queuedSend]);

  useEffect(() => {
    if (!slowDialogOpen || slowCountdown > 0 || !queuedSend) return;
    handleSendNow(queuedSend);
  }, [slowCountdown, slowDialogOpen, queuedSend]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await messagesApi.getConversations();
      setConversations(response.conversations);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversation: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await messagesApi.getMessages(conversation, { limit: LOAD_LIMIT });
      const ordered = [...response.messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(ordered);
      setHasMore(response.messages.length >= LOAD_LIMIT);
    } catch (err: any) {
      if (err?.statusCode === 404) {
        // Conversation no longer exists (server restart, etc.) — redirect
        navigate('/messages', { replace: true });
      } else {
        toast.error('Failed to load messages');
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadMore = async () => {
    if (!activeConversationId || isLoadingMore || !hasMore) return;
    const oldest = messages[0];
    if (!oldest) return;
    setIsLoadingMore(true);
    try {
      const response = await messagesApi.getMessages(activeConversationId, {
        limit: LOAD_LIMIT,
        before: oldest.id
      });
      if (response.messages.length < LOAD_LIMIT) {
        setHasMore(false);
      }
      const ordered = [...response.messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages((prev) => [...ordered, ...prev]);
    } catch {
      toast.error('Failed to load older messages');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const markAsRead = async (conversation: string) => {
    try {
      await messagesApi.markAsRead(conversation);
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversation ? { ...conv, unreadCount: 0 } : conv))
      );
    } catch {
      // ignore
    }
  };

  const updateConversationFromMessage = (conversation: string, message: Message) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.id === conversation
          ? {
              ...conv,
              lastMessage: {
                id: message.id,
                content: message.content,
                toneTag: message.toneTag,
                createdAt: message.createdAt,
                isMe: message.isMe
              },
              updatedAt: message.createdAt,
              unreadCount: 0
            }
          : conv
      );
      return updated.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  };

  const handleTyping = (value: string) => {
    setMessageDraft(value);
    const socket = socketRef.current;
    if (!socket || !activeConversationId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { conversationId: activeConversationId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { conversationId: activeConversationId, isTyping: false });
    }, 900);
  };

  const handleSend = () => {
    if (!activeConversationId) return;
    const content = messageDraft.trim();
    const img = imageUrl.trim();
    if (!content && !img) return;

    const payload = {
      content,
      toneTag: toneTag.trim() || undefined,
      imageUrl: img || undefined,
      isNsfw: img ? markNsfw : undefined
    };

    const warnings = scanTextForWarnings(content);
    if (warnings.length > 0) {
      setWarningMessages(warnings.map((warning) => warning.message));
      setPendingSend(payload);
      setWarningOpen(true);
      return;
    }

    queueSend(payload);
  };
  const queueSend = (payload: { content: string; toneTag?: string; imageUrl?: string; isNsfw?: boolean }) => {
    if (!activeConversationId) return;
    if (slowMode) {
      setQueuedSend(payload);
      setSlowCountdown(SLOW_SEND_DELAY);
      setSlowDialogOpen(true);
      return;
    }
    handleSendNow(payload);
  };

  const handleSendNow = async (payload: { content: string; toneTag?: string; imageUrl?: string; isNsfw?: boolean }) => {
    if (!activeConversationId) return;
    setIsSending(true);
    try {
      const response = await messagesApi.sendMessage(
        activeConversationId,
        payload.content,
        payload.toneTag,
        payload.imageUrl,
        payload.isNsfw
      );
      setMessages((prev) =>
        prev.some((m) => m.id === response.message.id) ? prev : [...prev, response.message]
      );
      updateConversationFromMessage(activeConversationId, response.message);
      setMessageDraft('');
      setToneTag('');
      setImageUrl('');
      setImagePreview(null);
      setMarkNsfw(false);
      setQueuedSend(null);
      setSlowDialogOpen(false);
      // Refresh trust level (backend may have auto-upgraded)
      safetyApi.getTrustLevel(activeConversationId)
        .then((info) => setCanSendImages(info.features.images))
        .catch(() => {});
    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const cancelQueuedSend = () => {
    setQueuedSend(null);
    setSlowDialogOpen(false);
    setSlowCountdown(0);
    if (slowTimerRef.current) {
      window.clearInterval(slowTimerRef.current);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!activeConversationId) return;
    try {
      const res = await messagesApi.reactToMessage(activeConversationId, messageId, emoji);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: res.reactions } : m))
      );
    } catch {
      toast.error('Failed to react');
    }
  };

  const handleOpenTags = (conversation: Conversation) => {
    setTagConversation(conversation);
    setTagDraft(conversation.tags?.join(', ') || '');
    setTagDialogOpen(true);
  };

  const handleSaveTags = async () => {
    if (!tagConversation) return;
    try {
      const tags = tagDraft
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      const response = await messagesApi.updateConversationTags(tagConversation.id, tags);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === tagConversation.id ? { ...conv, tags: response.tags } : conv
        )
      );
      setTagDialogOpen(false);
    } catch {
      toast.error('Failed to update tags');
    }
  };

  const handleSummarize = async () => {
    if (messages.length === 0) return;
    setIsSummarizing(true);
    try {
      const response = await aiApi.summarizeConversation(
        messages.map((message) => ({
          sender: message.sender.name,
          content: message.content
        }))
      );
      setSummary(response.summary);
    } catch {
      toast.error('Failed to summarize conversation');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleRephrase = async () => {
    const draft = messageDraft.trim();
    if (!draft) {
      toast.error('Write a message draft first');
      return;
    }
    setIsRephrasing(true);
    try {
      const response = await aiApi.rephraseMessage(draft);
      setRephraseOptions(response.rephrase);
      setIsRephraseOpen(true);
    } catch {
      toast.error('Failed to rephrase');
    } finally {
      setIsRephrasing(false);
    }
  };

  const activeBadges = useMemo(() => {
    const verification = activeConversation?.user?.verification;
    if (!verification) return [] as string[];
    const badges: string[] = [];
    if (verification.self) badges.push('Self verified');
    if (verification.peer) badges.push('Peer verified');
    if (verification.admin) badges.push('Admin verified');
    if (verification.email) badges.push('Email verified');
    if (verification.photo) badges.push('Photo verified');
    if (verification.id) badges.push('ID verified');
    return badges;
  }, [activeConversation]);

  const quietHoursActive = isQuietHoursActive(activeConversation?.user?.quietHours);
  const slowPaceNotice = activeConversation?.user?.communicationPreferences?.responsePace === 'slow';

  return (
    <div className="h-[calc(100vh-4rem)] p-4 sm:p-6 overflow-hidden">
      <div className="max-w-6xl mx-auto h-full grid gap-6 lg:grid-cols-[280px,1fr,320px]">
        <Card className="h-full overflow-hidden flex flex-col">
          <CardContent className="p-4 space-y-4 flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Messages</h2>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search conversations"
                className="pl-9"
              />
            </div>

            {isLoadingConversations ? (
              <div className="text-sm text-neutral-500">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-sm text-neutral-500">No conversations yet.</div>
            ) : (
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-3">
                  {filteredConversations.map((conversation) => {
                    const isActive = conversation.id === activeConversationId;
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => navigate(`/messages/${conversation.id}`)}
                        className={cn(
                          'w-full rounded-xl border p-3 text-left transition',
                          isActive
                            ? 'border-primary/60 bg-primary/5'
                            : 'border-neutral-200 hover:border-primary/40'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={conversation.user?.avatar} />
                            <AvatarFallback>{conversation.user?.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-sm">
                                  {conversation.user?.name || 'Unknown'}
                                </p>
                                {conversation.prioritySender && (
                                  <span title="Priority inbox"><Crown className="w-3.5 h-3.5 text-amber-500" /></span>
                                )}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 line-clamp-2">
                              {conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {(conversation.tags || []).slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardContent className="p-4 flex flex-col flex-1 gap-4 overflow-hidden">
            {activeConversation ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={activeConversation.user?.avatar} />
                      <AvatarFallback>{activeConversation.user?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">
                          {activeConversation.user?.name || 'Unknown'}
                        </h2>
                        {activeConversation.id && (
                          <TrustLevelBadge conversationId={activeConversation.id} compact />
                        )}
                        {quietHoursActive && (
                          <Badge variant="outline" className="text-[10px]">
                            <Clock className="w-3 h-3 mr-1" />
                            Quiet hours
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">
                        {activeConversation.user?.communicationPreferences?.responsePace || 'balanced'} pace,{' '}
                        {activeConversation.user?.communicationPreferences?.directness || 'gentle'} tone
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSummaryMode((prev) => !prev)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {summaryMode ? 'Messages' : 'Summary'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/help')}
                    >
                      <LifeBuoy className="w-4 h-4 mr-2" />
                      Help
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenTags(activeConversation)}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      Tags
                    </Button>
                  </div>
                </div>

                {slowPaceNotice && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Slow pace reminder: take your time and send one clear message at a time.
                  </div>
                )}
                {summaryMode ? (
                  <Card className="border-dashed">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Conversation summary</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSummarize}
                          disabled={isSummarizing}
                        >
                          {isSummarizing ? 'Summarizing...' : 'Refresh summary'}
                        </Button>
                      </div>
                      {summary ? (
                        <>
                          <p className="text-sm text-neutral-600">{summary.summary}</p>
                          <div className="space-y-2">
                            {summary.highlights.map((highlight, index) => (
                              <div
                                key={`${highlight}-${index}`}
                                className="rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-sm"
                              >
                                {highlight}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-neutral-500">Generate a quick summary for this thread.</p>
                      )}
                      <p className="text-[10px] text-neutral-400">Messages are processed by Google Gemini in real-time and are not stored. <a href="/privacy" className="underline hover:text-primary">Privacy policy</a></p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex-1 flex flex-col gap-3 min-h-0">
                    <ScrollArea className="flex-1 min-h-0 pr-2">
                      <div className="space-y-3">
                        {hasMore && (
                          <div className="flex justify-center">
                            <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
                              {isLoadingMore ? 'Loading...' : 'Load earlier'}
                            </Button>
                          </div>
                        )}
                        {isLoadingMessages ? (
                          <div className="text-sm text-neutral-500">Loading messages...</div>
                        ) : (
                          messages.map((message) => {
                            const nsfwFullyBlocked = !message.isMe && !!message.nsfwBlocked;
                            const showNsfwOverlay = !!message.isNsfw && !nsfwFullyBlocked && !revealedNsfw.has(message.id);
                            return (
                            <div
                              key={message.id}
                              className={cn('flex gap-3 group', message.isMe ? 'justify-end' : 'justify-start')}
                            >
                              {!message.isMe && (
                                <Avatar className="w-9 h-9">
                                  <AvatarImage src={message.sender.avatar} />
                                  <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                                </Avatar>
                              )}
                              <div className="relative max-w-[75%]">
                              <div
                                className={cn(
                                  'rounded-2xl px-4 py-3 text-sm',
                                  message.isMe
                                    ? 'bg-primary text-white'
                                    : 'bg-neutral-100 text-neutral-800'
                                )}
                              >
                                {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                                {message.imageUrl && !nsfwFullyBlocked && (
                                  <div className="relative mt-2 rounded-lg overflow-hidden">
                                    <img
                                      src={message.imageUrl}
                                      alt="Shared image"
                                      className={cn('max-w-full max-h-60 rounded-lg', showNsfwOverlay && 'blur-xl')}
                                    />
                                    {showNsfwOverlay && (
                                      <button
                                        onClick={() => setRevealedNsfw((prev) => new Set([...prev, message.id]))}
                                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white gap-2"
                                      >
                                        <EyeOff className="w-6 h-6" />
                                        <span className="text-xs font-medium">NSFW — tap to reveal</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                                {nsfwFullyBlocked && (
                                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-200 p-3 text-xs text-neutral-600">
                                    <EyeOff className="w-4 h-4 shrink-0" />
                                    NSFW image blocked by recipient&apos;s settings
                                  </div>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-200">
                                  {message.toneTag && (
                                    <Badge variant="outline" className="text-[10px]">
                                      Tone: {message.toneTag}
                                    </Badge>
                                  )}
                                  <span className={message.isMe ? 'text-white/70' : 'text-neutral-400'}>
                                    {formatTime(message.createdAt)}
                                  </span>
                                  {message.isMe && message.readAt && (
                                    <span className="flex items-center gap-1 text-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Read
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Emoji reaction picker — visible on hover */}
                              <div className={cn(
                                'absolute -bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white border rounded-full shadow-sm px-1 py-0.5 z-10',
                                message.isMe ? 'right-0' : 'left-0'
                              )}>
                                {REACTION_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(message.id, emoji)}
                                    className="hover:scale-125 transition-transform text-sm leading-none p-0.5"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              {/* Display existing reactions */}
                              {(message.reactions?.length ?? 0) > 0 && (
                                <div className={cn('flex flex-wrap gap-1 mt-1', message.isMe ? 'justify-end' : 'justify-start')}>
                                  {Object.entries(
                                    (message.reactions || []).reduce<Record<string, string[]>>((acc, r) => {
                                      if (!acc[r.emoji]) acc[r.emoji] = [];
                                      acc[r.emoji].push(r.userId);
                                      return acc;
                                    }, {})
                                  ).map(([emoji, userIds]) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(message.id, emoji)}
                                      className={cn(
                                        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors',
                                        userIds.includes(user?.id || '')
                                          ? 'bg-primary/10 border-primary/30 text-primary'
                                          : 'bg-white border-neutral-200 text-neutral-600 hover:border-primary/30'
                                      )}
                                    >
                                      <span>{emoji}</span>
                                      {userIds.length > 1 && <span className="text-[10px]">{userIds.length}</span>}
                                    </button>
                                  ))}
                                </div>
                              )}
                              </div>
                            </div>
                            );
                          })
                        )}
                        {partnerTyping && (
                          <div className="text-xs text-neutral-400">Typing...</div>
                        )}
                        <div ref={endRef} />
                      </div>
                    </ScrollArea>

                    <div className="space-y-3 shrink-0 max-h-[45%] flex flex-col">
                      <div className="overflow-y-auto space-y-3 flex-1 min-h-0">
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                          <ChevronDown className="w-3.5 h-3.5 transition-transform [[data-state=open]>&]:rotate-180" />
                          Quick replies & tone tags
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 pt-2">
                          <div className="flex flex-wrap gap-1.5">
                            {QUICK_REPLIES.map((reply) => (
                              <Button
                                key={reply}
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={() => setMessageDraft(reply)}
                              >
                                {reply}
                              </Button>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {TONE_TAGS.map((tag) => (
                              <Button
                                key={tag}
                                size="sm"
                                variant={toneTag === tag ? 'default' : 'outline'}
                                className="text-xs h-7"
                                onClick={() => setToneTag(tag)}
                              >
                                {tag}
                              </Button>
                            ))}
                            <Input
                              value={toneTag}
                              onChange={(event) => setToneTag(event.target.value)}
                              placeholder="Tone tag"
                              className="max-w-[120px] h-7 text-xs"
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <Textarea
                        value={messageDraft}
                        onChange={(event) => handleTyping(event.target.value)}
                        placeholder="Write a message"
                        rows={2}
                      />

                      {/* Image attachment */}
                      <div className="space-y-2">
                        <input
                          ref={imageFileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
                            if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
                            const reader = new FileReader();
                            reader.onload = () => {
                              const dataUrl = reader.result as string;
                              setImageUrl(dataUrl);
                              setImagePreview(dataUrl);
                            };
                            reader.onerror = () => toast.error('Failed to read file');
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!canSendImages}
                            onClick={() => imageFileRef.current?.click()}
                          >
                            <ImagePlus className={`w-4 h-4 mr-1.5 ${canSendImages ? '' : 'text-neutral-300'}`} />
                            {canSendImages ? 'Attach image' : 'Images unlock at trust level 2'}
                          </Button>
                          {imagePreview && (
                            <Button variant="ghost" size="sm" onClick={() => { setImageUrl(''); setImagePreview(null); setMarkNsfw(false); }}>
                              <X className="w-3.5 h-3.5 mr-1" /> Remove
                            </Button>
                          )}
                        </div>
                        {imagePreview && (
                          <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
                            <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" />
                            <div className="flex items-center gap-2">
                              <Switch checked={markNsfw} onCheckedChange={setMarkNsfw} />
                              <span className="text-xs text-foreground font-medium">Mark as NSFW</span>
                            </div>
                            {markNsfw && (
                              <>
                                {activeConversation?.user?.blockNsfwImages && (
                                  <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-2 text-[11px] text-red-700">
                                    <EyeOff className="w-3.5 h-3.5 shrink-0" />
                                    <span>{activeConversation.user.name} blocks NSFW images — it will be hidden on their end.</span>
                                  </div>
                                )}
                                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-800">
                                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <p>Only share NSFW content with clear mutual consent. Unsolicited explicit images may result in a ban.</p>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch checked={slowMode} onCheckedChange={setSlowMode} />
                            <span className="text-xs text-neutral-500">Slow mode</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSafetyGuideOpen(true)}
                            className="text-xs text-muted-foreground"
                          >
                            <BookOpen className="w-3.5 h-3.5 mr-1" />
                            Safety Guide
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRephrase}
                            disabled={isRephrasing}
                          >
                            <Wand2 className="w-4 h-4 mr-2" />
                            {isRephrasing ? 'Rephrasing...' : 'Rephrase'}
                          </Button>
                          <Button onClick={handleSend} disabled={isSending || (!messageDraft.trim() && !imageUrl.trim())}>
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center text-neutral-500">
                <MessageCircle className="w-12 h-12 text-neutral-300 mb-4" />
                Select a conversation to start messaging.
              </div>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4 overflow-y-auto">
          <AdBanner area="messages" className="hidden lg:block" />
          <Card>
            <CardContent className="p-4 space-y-3">
              <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h3 className="font-semibold">Thread context</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=closed]>&]:rotate-[-90deg]" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
              {activeConversation ? (
                <>
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-500">Connection goals</div>
                    <div className="flex flex-wrap gap-2">
                      {(activeConversation.user?.connectionGoals || []).length === 0 ? (
                        <Badge variant="outline">No goals set</Badge>
                      ) : (
                        activeConversation.user?.connectionGoals?.map((goal) => (
                          <Badge key={goal} variant="secondary">
                            {goal}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-500">Boundaries</div>
                    <div className="flex flex-wrap gap-2">
                      {(activeConversation.user?.boundaries || []).length === 0 ? (
                        <Badge variant="outline">No boundaries shared</Badge>
                      ) : (
                        activeConversation.user?.boundaries?.map((boundary) => (
                          <Badge key={boundary} variant="outline">
                            {boundary}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-500">Verification</div>
                    <div className="flex flex-wrap gap-2">
                      {activeBadges.length === 0 ? (
                        <Badge variant="outline">No verification</Badge>
                      ) : (
                        activeBadges.map((badge) => (
                          <Badge key={badge} variant="secondary" className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {badge}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  {activeConversation?.id && (
                    <div className="space-y-2">
                      <div className="text-xs text-neutral-500">Trust Level</div>
                      <TrustLevelBadge conversationId={activeConversation.id} />
                    </div>
                  )}
                  {activeConversation?.id && (
                    <GuardianNudge conversationId={activeConversation.id} />
                  )}
                  {activeConversation?.user?.id && (
                    <PassportCard userId={activeConversation.user.id} compact />
                  )}
                  {activeConversation?.user?.id && (
                    <SensoryProfileCard userId={activeConversation.user.id} compact />
                  )}
                  {activeConversation?.user?.id && (
                    <BoundariesIntroCard userId={activeConversation.user.id} />
                  )}
                  {activeConversation?.user?.id && (
                    <VenueSuggestions matchUserId={activeConversation.user.id} />
                  )}
                  {quietHoursActive && (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
                      Quiet hours are active. Expect slower responses.
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-neutral-500">Select a conversation to see context.</p>
              )}
              </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h3 className="font-semibold">Safety reminders</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=closed]>&]:rotate-[-90deg]" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
              <div className="flex items-start gap-2 text-sm text-neutral-600">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                Share personal info only when you feel safe. Slow mode can help keep pacing comfortable.
              </div>
              <div className="flex items-start gap-2 text-sm text-neutral-600">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                You can report or block if a conversation feels off.
              </div>
              </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={tagDialogOpen} onOpenChange={(open) => setTagDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conversation tags</DialogTitle>
            <DialogDescription>Add comma-separated tags for this conversation.</DialogDescription>
          </DialogHeader>
          <Input
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            placeholder="example: slow pace, check-ins"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTags}>Save tags</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={slowDialogOpen} onOpenChange={(open) => !open && cancelQueuedSend()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slow mode active</DialogTitle>
            <DialogDescription>
              Sending in {slowCountdown}s. Use this time to review your message.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelQueuedSend}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!queuedSend) return;
                const payload = queuedSend;
                setQueuedSend(null);
                setSlowDialogOpen(false);
                setSlowCountdown(0);
                if (slowTimerRef.current) window.clearInterval(slowTimerRef.current);
                handleSendNow(payload);
              }}
            >
              Send now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRephraseOpen} onOpenChange={setIsRephraseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rephrase options</DialogTitle>
            <DialogDescription>Pick a version that feels right.</DialogDescription>
          </DialogHeader>
          {rephraseOptions ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-neutral-200 p-3 text-sm">
                <p className="text-xs text-neutral-500 mb-1">Gentle</p>
                <p className="text-neutral-700">{rephraseOptions.gentle}</p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setMessageDraft(rephraseOptions.gentle);
                    setIsRephraseOpen(false);
                  }}
                >
                  Use gentle
                </Button>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3 text-sm">
                <p className="text-xs text-neutral-500 mb-1">Direct</p>
                <p className="text-neutral-700">{rephraseOptions.direct}</p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setMessageDraft(rephraseOptions.direct);
                    setIsRephraseOpen(false);
                  }}
                >
                  Use direct
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No suggestions yet.</p>
          )}
          <p className="text-[10px] text-neutral-400">Your draft is processed by Google Gemini in real-time and is not stored. <a href="/privacy" className="underline hover:text-primary">Privacy policy</a></p>
        </DialogContent>
      </Dialog>

      <ContentWarningDialog
        open={warningOpen}
        warnings={warningMessages}
        onCancel={() => {
          setWarningOpen(false);
          setPendingSend(null);
        }}
        onConfirm={() => {
          if (!pendingSend) {
            setWarningOpen(false);
            return;
          }
          setWarningOpen(false);
          queueSend(pendingSend);
          setPendingSend(null);
        }}
      />

      {/* One-time messaging safety onboarding */}
      <Dialog
        open={!safetyOnboardingShown && !!activeConversationId}
        onOpenChange={(open) => {
          if (!open) {
            setSafetyOnboardingShown(true);
            localStorage.setItem('neuronest_msg_safety_seen', '1');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Messaging Safety Guide
            </DialogTitle>
            <DialogDescription>
              A few things to keep you safe while messaging.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">NSFW image blocking</p>
                <p>NSFW images are blocked by default. You can change this in Settings &gt; Privacy. Senders must mark images as NSFW before sending.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Personal info detection</p>
                <p>We scan messages for credit card numbers and phone numbers before sending, and warn you before they go out.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Slow mode</p>
                <p>Enable slow mode to add a 15-second review window before each message is sent. Great for managing impulsive responses.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Guardian nudges</p>
                <p>Our AI Guardian monitors for manipulation patterns and will gently alert you if something seems off.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setSafetyOnboardingShown(true);
                localStorage.setItem('neuronest_msg_safety_seen', '1');
              }}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-readable Safety Guide dialog */}
      <Dialog open={safetyGuideOpen} onOpenChange={setSafetyGuideOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Safety Guide
            </DialogTitle>
            <DialogDescription>
              Safety features active in your conversations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">NSFW image blocking</p>
                <p>NSFW images are blocked by default. Senders must explicitly mark images as NSFW. You can toggle this in Settings &gt; Privacy.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Cyber-flashing prevention</p>
                <p>Sending unsolicited explicit images is a bannable offense. The NSFW toggle includes a consent reminder.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Personal info scanning</p>
                <p>Credit card numbers and phone numbers are detected before sending. You'll be warned before they go out.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Slow mode</p>
                <p>Adds a 15-second review window. Automatically enabled when your conversation partner prefers a slow pace.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">AI Guardian</p>
                <p>Monitors for manipulation patterns (love-bombing, guilt-tripping, isolation tactics) and alerts you.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Tone tags & rephrase</p>
                <p>Add tone tags to clarify intent. Use AI rephrase to get gentle or direct alternatives before sending.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSafetyGuideOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
