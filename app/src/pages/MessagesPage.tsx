
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
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
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

function isQuietHoursActive(quietHours?: { enabled: boolean; start: string; end: string }) {
  if (!quietHours?.enabled) return false;
  const now = new Date();
  const [startH, startM] = quietHours.start.split(':').map(Number);
  const [endH, endM] = quietHours.end.split(':').map(Number);
  if (Number.isNaN(startH) || Number.isNaN(endH)) return false;
  const start = new Date();
  start.setHours(startH, startM || 0, 0, 0);
  const end = new Date();
  end.setHours(endH, endM || 0, 0, 0);
  if (start <= end) {
    return now >= start && now <= end;
  }
  return now >= start || now <= end;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
  const [pendingSend, setPendingSend] = useState<{ content: string; toneTag?: string } | null>(null);
  const [slowMode, setSlowMode] = useState(false);
  const [slowDialogOpen, setSlowDialogOpen] = useState(false);
  const [slowCountdown, setSlowCountdown] = useState(0);
  const [queuedSend, setQueuedSend] = useState<{ content: string; toneTag?: string } | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [tagConversation, setTagConversation] = useState<Conversation | null>(null);
  const [isRephraseOpen, setIsRephraseOpen] = useState(false);
  const [rephraseOptions, setRephraseOptions] = useState<AIRephrase | null>(null);
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
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
    loadMessages(activeConversationId);
    markAsRead(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversation) return;
    setSlowMode(activeConversation.user?.communicationPreferences?.responsePace === 'slow');
  }, [activeConversation]);

  useEffect(() => {
    const token = api.getToken();
    if (!token) return;
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const socketUrl = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : undefined;

    const socket = io(socketUrl, {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('message', (payload: { conversationId: string; message: Message }) => {
      const incoming = payload.message;
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
              isMe: incoming.sender.id === user?.id
            },
            unreadCount:
              payload.conversationId === activeConversationId
                ? 0
                : Math.max(0, (conv.unreadCount || 0) + 1),
            updatedAt: incoming.createdAt
          };
        });
        return updated.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

      if (payload.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === incoming.id)) return prev;
          const normalized = {
            ...incoming,
            isMe: incoming.sender.id === user?.id
          };
          return [...prev, normalized];
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
    } catch {
      toast.error('Failed to load messages');
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
    if (!content) return;

    const payload = {
      content,
      toneTag: toneTag.trim() || undefined
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
  const queueSend = (payload: { content: string; toneTag?: string }) => {
    if (!activeConversationId) return;
    if (slowMode) {
      setQueuedSend(payload);
      setSlowCountdown(SLOW_SEND_DELAY);
      setSlowDialogOpen(true);
      return;
    }
    handleSendNow(payload);
  };

  const handleSendNow = async (payload: { content: string; toneTag?: string }) => {
    if (!activeConversationId) return;
    setIsSending(true);
    try {
      const response = await messagesApi.sendMessage(
        activeConversationId,
        payload.content,
        payload.toneTag
      );
      setMessages((prev) => [...prev, response.message]);
      updateConversationFromMessage(activeConversationId, response.message);
      setMessageDraft('');
      setToneTag('');
      setQueuedSend(null);
      setSlowDialogOpen(false);
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
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[280px,1fr,320px]">
        <Card className="h-full">
          <CardContent className="p-4 space-y-4">
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
                              <p className="font-medium text-sm">
                                {conversation.user?.name || 'Unknown'}
                              </p>
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

        <Card className="flex flex-col min-h-[640px]">
          <CardContent className="p-4 flex flex-col flex-1 gap-4">
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
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex-1 flex flex-col gap-3">
                    <ScrollArea className="flex-1 pr-2">
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
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn('flex gap-3', message.isMe ? 'justify-end' : 'justify-start')}
                            >
                              {!message.isMe && (
                                <Avatar className="w-9 h-9">
                                  <AvatarImage src={message.sender.avatar} />
                                  <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={cn(
                                  'max-w-[75%] rounded-2xl px-4 py-3 text-sm',
                                  message.isMe
                                    ? 'bg-primary text-white'
                                    : 'bg-neutral-100 text-neutral-800'
                                )}
                              >
                                <p className="whitespace-pre-wrap">{message.content}</p>
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
                            </div>
                          ))
                        )}
                        {partnerTyping && (
                          <div className="text-xs text-neutral-400">Typing...</div>
                        )}
                        <div ref={endRef} />
                      </div>
                    </ScrollArea>

                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {QUICK_REPLIES.map((reply) => (
                          <Button
                            key={reply}
                            size="sm"
                            variant="outline"
                            onClick={() => setMessageDraft(reply)}
                          >
                            {reply}
                          </Button>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {TONE_TAGS.map((tag) => (
                          <Button
                            key={tag}
                            size="sm"
                            variant={toneTag === tag ? 'default' : 'outline'}
                            onClick={() => setToneTag(tag)}
                          >
                            {tag}
                          </Button>
                        ))}
                        <Input
                          value={toneTag}
                          onChange={(event) => setToneTag(event.target.value)}
                          placeholder="Tone tag"
                          className="max-w-[140px]"
                        />
                      </div>

                      <Textarea
                        value={messageDraft}
                        onChange={(event) => handleTyping(event.target.value)}
                        placeholder="Write a message"
                        rows={3}
                      />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Switch checked={slowMode} onCheckedChange={setSlowMode} />
                          <span className="text-xs text-neutral-500">Slow mode</span>
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
                          <Button onClick={handleSend} disabled={isSending || !messageDraft.trim()}>
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
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Thread context</h3>
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
                  {quietHoursActive && (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
                      Quiet hours are active. Expect slower responses.
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-neutral-500">Select a conversation to see context.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Safety reminders</h3>
              <div className="flex items-start gap-2 text-sm text-neutral-600">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                Share personal info only when you feel safe. Slow mode can help keep pacing comfortable.
              </div>
              <div className="flex items-start gap-2 text-sm text-neutral-600">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                You can report or block if a conversation feels off.
              </div>
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
                setSlowCountdown(0);
                handleSendNow(queuedSend);
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
    </div>
  );
}
