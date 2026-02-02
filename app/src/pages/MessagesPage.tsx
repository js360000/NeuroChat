import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Brain, Smile, Mic, MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContentWarningDialog } from '@/components/ContentWarningDialog';
import { messagesApi, type Conversation, type Message } from '@/lib/api/messages';
import { aiApi, type AIExplanation } from '@/lib/api/ai';
import { useAuthStore } from '@/lib/stores/auth';
import { scanTextForWarnings } from '@/lib/safety';
import { toast } from 'sonner';

const TONE_TAGS = [
  { id: '/j', label: 'Joking', color: 'bg-yellow-100 text-yellow-700' },
  { id: '/srs', label: 'Serious', color: 'bg-blue-100 text-blue-700' },
  { id: '/lh', label: 'Light Hearted', color: 'bg-pink-100 text-pink-700' },
  { id: '/nm', label: 'Not Mad', color: 'bg-green-100 text-green-700' },
  { id: '/nbh', label: 'Nobody Here', color: 'bg-purple-100 text-purple-700' },
  { id: '/nsrs', label: 'Not Serious', color: 'bg-orange-100 text-orange-700' },
  { id: '/g', label: 'Genuine', color: 'bg-teal-100 text-teal-700' },
  { id: '/hj', label: 'Half Joking', color: 'bg-indigo-100 text-indigo-700' },
];

export function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedToneTag, setSelectedToneTag] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explainingMessage, setExplainingMessage] = useState<Message | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('neuronest_token');
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    const socketUrl = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : undefined;
    const socket = io(socketUrl, {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('message', (payload: { conversationId: string; message: Message }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === payload.conversationId
            ? {
                ...conv,
                lastMessage: {
                  id: payload.message.id,
                  content: payload.message.content,
                  toneTag: payload.message.toneTag,
                  createdAt: payload.message.createdAt,
                  isMe: payload.message.sender.id === user?.id
                },
                unreadCount:
                  payload.conversationId === conversationId || payload.message.sender.id === user?.id
                    ? conv.unreadCount
                    : conv.unreadCount + 1,
                updatedAt: payload.message.createdAt
              }
            : conv
        )
      );

      if (payload.conversationId !== conversationId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.message.id)) return prev;
        return [
          ...prev,
          {
            ...payload.message,
            isMe: payload.message.sender.id === user?.id
          }
        ];
      });
    });

    socket.on('typing', (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === user?.id) return;
      if (payload.isTyping) {
        setTypingUserId(payload.userId);
        if (typingTimeoutRef.current) {
          window.clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = window.setTimeout(() => {
          setTypingUserId(null);
        }, 2000);
      } else {
        setTypingUserId(null);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, conversationId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;
    socket.emit('join', conversationId);
    return () => {
      socket.emit('leave', conversationId);
    };
  }, [conversationId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await messagesApi.getConversations();
      setConversations(response.conversations);
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (id: string) => {
    try {
      const response = await messagesApi.getMessages(id);
      setMessages(response.messages.reverse());
      
      // Mark as read
      await messagesApi.markAsRead(id);
      setConversations((prev) =>
        prev.map((conv) => (conv.id === id ? { ...conv, unreadCount: 0 } : conv))
      );
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !conversationId) return;

    setIsSending(true);
    try {
      const response = await messagesApi.sendMessage(
        conversationId,
        messageText,
        selectedToneTag
      );
      
      setMessages((prev) => [...prev, response.message]);
      setInputMessage('');
      setSelectedToneTag(undefined);
      setPendingMessage(null);
      
      // Update conversation list
      loadConversations();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || !conversationId) return;
    const warnings = scanTextForWarnings(inputMessage);
    if (warnings.length > 0) {
      setWarningMessages(warnings.map((warning) => warning.message));
      setPendingMessage(inputMessage);
      setWarningOpen(true);
      return;
    }
    await sendMessage(inputMessage);
  };

  const handleExplain = async (message: Message) => {
    setExplainingMessage(message);
    setExplainModalOpen(true);
    setIsAnalyzing(true);

    try {
      const response = await aiApi.explainMessage(
        message.content,
        message.toneTag,
        'Dating app conversation'
      );
      setAiExplanation(response.explanation);
    } catch (error: any) {
      if (error.statusCode === 503) {
        setAiAvailable(false);
        toast.error('AI features are currently unavailable');
        setExplainModalOpen(false);
      } else if (error.code === 'SUBSCRIPTION_REQUIRED') {
        toast.error('AI explanations require a Premium subscription');
        setExplainModalOpen(false);
      } else {
        toast.error('Failed to analyze message');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentConversation = conversations.find(c => c.id === conversationId);

  const handleInputChange = (value: string) => {
    setInputMessage(value);
    const socket = socketRef.current;
    if (socket && conversationId) {
      socket.emit('typing', { conversationId, isTyping: true });
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = window.setTimeout(() => {
        socket.emit('typing', { conversationId, isTyping: false });
      }, 1200);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className={`w-full md:w-80 bg-white border-r border-neutral-200 ${conversationId ? 'hidden md:block' : ''}`}>
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-bold">Messages</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              No conversations yet
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors ${
                    conv.id === conversationId ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.user.avatar} />
                      <AvatarFallback>{conv.user.name[0]}</AvatarFallback>
                    </Avatar>
                    {conv.user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{conv.user.name}</p>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-primary text-white text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-dark font-medium' : 'text-neutral-500'}`}>
                        {conv.lastMessage.isMe ? 'You: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {conversationId ? (
        <div className="flex-1 flex flex-col bg-neutral-50">
          {/* Header */}
          <div className="bg-white border-b border-neutral-200 p-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => navigate('/messages')}
            >
              Back
            </Button>
            {currentConversation && (
              <>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={currentConversation.user.avatar} />
                  <AvatarFallback>{currentConversation.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{currentConversation.user.name}</p>
                  <p className="text-xs text-neutral-500">
                    {currentConversation.user.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        msg.isMe
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-white border border-neutral-200 rounded-bl-md'
                      }`}
                    >
                      <p>{msg.content}</p>
                      {msg.toneTag && (
                        <Badge
                          variant="secondary"
                          className={`mt-1 text-xs ${
                            TONE_TAGS.find(t => t.id === msg.toneTag)?.color || ''
                          }`}
                        >
                          {msg.toneTag}
                        </Badge>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${msg.isMe ? 'justify-end' : ''}`}>
                      <span className="text-xs text-neutral-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!msg.isMe && aiAvailable && (
                         <button
                           onClick={() => handleExplain(msg)}
                           className="flex items-center gap-1 text-xs text-primary hover:underline"
                         >
                           <Brain className="w-3 h-3" />
                           Explain
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              ))}
              {typingUserId && (
                <div className="text-xs text-neutral-400">Someone is typing...</div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="bg-white border-t border-neutral-200 p-4">
            {selectedToneTag && (
              <div className="flex items-center gap-2 mb-2">
                <Badge className={TONE_TAGS.find(t => t.id === selectedToneTag)?.color}>
                  {selectedToneTag}
                </Badge>
                <button
                  onClick={() => setSelectedToneTag(undefined)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <span className="sr-only">Remove tone tag</span>
                  x
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              {/* Tone Tag Selector */}
              <div className="relative group">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Smile className="w-5 h-5" />
                </Button>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-white rounded-xl shadow-card border border-neutral-100 p-2 w-48 z-10">
                  <p className="text-xs text-neutral-400 mb-2 px-2">Select tone tag</p>
                  <div className="grid grid-cols-2 gap-1">
                    {TONE_TAGS.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => setSelectedToneTag(tag.id)}
                        className={`px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                          selectedToneTag === tag.id ? 'bg-primary/10' : 'hover:bg-neutral-50'
                        }`}
                      >
                        {tag.id} - {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Input
                value={inputMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1"
              />

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <Mic className="w-5 h-5" />
              </Button>

              <Button
                onClick={handleSend}
                disabled={!inputMessage.trim() || isSending}
                className="shrink-0 bg-primary hover:bg-primary-600"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-neutral-50">
          <div className="text-center text-neutral-500">
            <p>Select a conversation to start messaging</p>
          </div>
        </div>
      )}

      {/* AI Explain Modal */}
      <Dialog open={explainModalOpen} onOpenChange={setExplainModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Message Analysis
            </DialogTitle>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-neutral-500">Analyzing message tone and context...</p>
            </div>
          ) : aiExplanation ? (
            <div className="space-y-4">
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-sm text-neutral-600 italic">
                  "{explainingMessage?.content}"
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-dark mb-1">Detected Tone</p>
                <Badge className="bg-primary/10 text-primary">
                  {aiExplanation.tone}
                </Badge>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-neutral-500">AI Confidence:</span>
                  <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${aiExplanation.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{aiExplanation.confidence}%</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-dark mb-2">What This Might Mean</p>
                <ul className="space-y-2">
                  {aiExplanation.hiddenMeanings.map((meaning, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {meaning}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium text-dark mb-2">Suggested Responses</p>
                <ul className="space-y-2">
                  {aiExplanation.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                      <MessageCircle className="w-4 h-4 text-accent-teal mt-0.5 shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ContentWarningDialog
        open={warningOpen}
        warnings={warningMessages}
        onCancel={() => setWarningOpen(false)}
        onConfirm={() => {
          setWarningOpen(false);
          if (pendingMessage) {
            sendMessage(pendingMessage);
          }
        }}
        confirmLabel="Send anyway"
      />
    </div>
  );
}
