import { useState, useMemo } from 'react'
import {
  BookOpen, ChevronLeft, ChevronRight, Volume2, X, Search,
  MessageCircle, Users, Heart, ShieldCheck, Sparkles, Clock,
  Utensils, Bus, Hospital, ShoppingCart,
  Phone as PhoneIcon, HandHeart, Brain, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StoryStep {
  emoji: string
  text: string
  tip?: string
}

interface SocialStory {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: 'conversation' | 'daily-life' | 'feelings' | 'safety' | 'social'
  steps: StoryStep[]
}

/* ------------------------------------------------------------------ */
/*  Story library (25+ stories)                                        */
/* ------------------------------------------------------------------ */

const STORIES: SocialStory[] = [
  // Conversation
  {
    id: 'starting-chat',
    title: 'Starting a Chat',
    description: 'How to begin talking to someone',
    icon: <MessageCircle className="w-5 h-5" />,
    category: 'conversation',
    steps: [
      { emoji: '👋', text: 'I want to talk to someone.', tip: 'It is okay to start a conversation.' },
      { emoji: '😊', text: 'I tap "Hello" or wave to say hi.' },
      { emoji: '⏳', text: 'I wait for them to reply. This might take a moment.' },
      { emoji: '👂', text: 'I read or listen to what they say.' },
      { emoji: '🗣️', text: 'I can reply by tapping more symbols or phrases.' },
      { emoji: '✅', text: 'Having a conversation is nice. I did a great job!' },
    ],
  },
  {
    id: 'ending-chat',
    title: 'Ending a Chat',
    description: 'How to finish a conversation nicely',
    icon: <MessageCircle className="w-5 h-5" />,
    category: 'conversation',
    steps: [
      { emoji: '💬', text: 'I have been chatting with someone.' },
      { emoji: '🕐', text: 'Sometimes conversations need to end. That is okay.' },
      { emoji: '🫡', text: 'I can say "Goodbye" or "Talk to you later".' },
      { emoji: '😊', text: 'The other person will understand.' },
      { emoji: '👍', text: 'I can chat with them again another time.' },
    ],
  },
  {
    id: 'someone-upset',
    title: 'When Someone is Upset',
    description: 'What to do when a friend seems sad',
    icon: <Heart className="w-5 h-5" />,
    category: 'conversation',
    steps: [
      { emoji: '😢', text: 'My friend seems sad or upset.' },
      { emoji: '🤔', text: 'I might not know why. That is okay.' },
      { emoji: '❤️', text: 'I can say "I am here for you".' },
      { emoji: '👂', text: 'I can listen if they want to talk.' },
      { emoji: '🤗', text: 'I can offer a hug symbol if they want one.' },
      { emoji: '⏳', text: 'Sometimes people need time alone. I can check later.', tip: 'You don\'t have to fix everything.' },
    ],
  },
  {
    id: 'dont-understand',
    title: "When I Don't Understand",
    description: 'What to do when a message confuses me',
    icon: <Brain className="w-5 h-5" />,
    category: 'conversation',
    steps: [
      { emoji: '🤔', text: 'Someone sent me a message I do not understand.' },
      { emoji: '✅', text: 'It is okay not to understand everything.' },
      { emoji: '🔄', text: 'I can tap "Please repeat" to ask them to say it again.' },
      { emoji: '❓', text: 'I can tap "What" to ask what they mean.' },
      { emoji: '⏳', text: 'I can take my time. There is no rush.' },
      { emoji: '💡', text: 'The "Read aloud" button can help me hear the message.' },
    ],
  },
  {
    id: 'saying-no',
    title: 'Saying No',
    description: 'It is okay to say no',
    icon: <ShieldCheck className="w-5 h-5" />,
    category: 'conversation',
    steps: [
      { emoji: '❌', text: 'Sometimes I do not want to do something.' },
      { emoji: '✅', text: 'It is always okay to say no.', tip: 'Nobody should be angry at you for saying no.' },
      { emoji: '🚫', text: 'I can tap "I don\'t want" and then what I don\'t want.' },
      { emoji: '🙅', text: 'I can tap "Stop" if something makes me uncomfortable.' },
      { emoji: '💪', text: 'Saying no is brave and important.' },
    ],
  },
  {
    id: 'asking-for-help',
    title: 'Asking for Help',
    description: 'How to tell someone I need help',
    icon: <HandHeart className="w-5 h-5" />,
    category: 'conversation',
    steps: [
      { emoji: '🤔', text: 'Sometimes I need help with something.' },
      { emoji: '✅', text: 'Everyone needs help sometimes. That is okay.' },
      { emoji: '🙏', text: 'I can tap "I need" and then "Help me".' },
      { emoji: '👤', text: 'I can tell someone what I need help with.' },
      { emoji: '⏳', text: 'I wait for them to help me.' },
      { emoji: '🙏', text: 'I can say "Thank you" when they help.', tip: 'You are doing great asking for help!' },
    ],
  },

  // Daily life
  {
    id: 'mealtime',
    title: 'Telling Someone I\'m Hungry',
    description: 'How to ask for food or drink',
    icon: <Utensils className="w-5 h-5" />,
    category: 'daily-life',
    steps: [
      { emoji: '🍽️', text: 'My tummy feels empty. I might be hungry.' },
      { emoji: '🙋', text: 'I can tap "I want" then "Food" or "Water".' },
      { emoji: '❤️', text: 'If I know what I want, I can say "I like" and then what food.' },
      { emoji: '⏳', text: 'Someone will help me get food. I wait a little bit.' },
      { emoji: '😊', text: 'Eating food helps me feel better.' },
    ],
  },
  {
    id: 'feeling-sick',
    title: 'Telling Someone I Feel Sick',
    description: 'What to do when I don\'t feel well',
    icon: <Hospital className="w-5 h-5" />,
    category: 'daily-life',
    steps: [
      { emoji: '😷', text: 'My body does not feel good.' },
      { emoji: '😣', text: 'I can tap "I don\'t feel good".' },
      { emoji: '📍', text: 'I can show where it hurts using body words.' },
      { emoji: '💊', text: 'I might need medicine. I can tap "I need medicine".' },
      { emoji: '👩', text: 'A grown-up will help me feel better.', tip: 'Always tell someone if you feel sick.' },
    ],
  },
  {
    id: 'going-out',
    title: 'Going on a Trip',
    description: 'What happens when we go somewhere',
    icon: <Bus className="w-5 h-5" />,
    category: 'daily-life',
    steps: [
      { emoji: '🚶', text: 'We are going somewhere new today.' },
      { emoji: '🤔', text: 'New places can feel different. That is okay.' },
      { emoji: '🔇', text: 'If it is too loud, I can say "Quiet" or "I need a break".' },
      { emoji: '👨', text: 'My family or helper will be with me.' },
      { emoji: '✅', text: 'I can say how I feel at any time.' },
      { emoji: '🏠', text: 'We will go home when we are finished.', tip: 'You can always ask to go home.' },
    ],
  },
  {
    id: 'shopping',
    title: 'Going Shopping',
    description: 'What happens at the shops',
    icon: <ShoppingCart className="w-5 h-5" />,
    category: 'daily-life',
    steps: [
      { emoji: '🛒', text: 'We are going to the shops.' },
      { emoji: '👀', text: 'There will be many things to see.' },
      { emoji: '🔊', text: 'It might be noisy. I can wear my ear defenders.' },
      { emoji: '🙋', text: 'If I see something I want, I can tap "I want".' },
      { emoji: '✅', text: 'Sometimes the answer is yes, sometimes no. Both are okay.' },
      { emoji: '🏠', text: 'Then we go home.' },
    ],
  },

  // Feelings
  {
    id: 'feeling-angry',
    title: 'When I Feel Angry',
    description: 'What to do with big angry feelings',
    icon: <AlertTriangle className="w-5 h-5" />,
    category: 'feelings',
    steps: [
      { emoji: '😠', text: 'I feel angry right now. My body feels hot and tight.' },
      { emoji: '✅', text: 'It is okay to feel angry. Everyone does sometimes.' },
      { emoji: '🗣️', text: 'I can tell someone "I am angry" using my symbols.' },
      { emoji: '😤', text: 'I can take deep breaths. In... and out...' },
      { emoji: '⏰', text: 'I can ask for a break if I need one.' },
      { emoji: '😌', text: 'The angry feeling will go away. I will feel better soon.', tip: 'Feelings are like weather — they always pass.' },
    ],
  },
  {
    id: 'feeling-anxious',
    title: 'When I Feel Worried',
    description: 'What to do when everything feels too much',
    icon: <Heart className="w-5 h-5" />,
    category: 'feelings',
    steps: [
      { emoji: '😰', text: 'I feel worried or scared. My tummy might feel funny.' },
      { emoji: '✅', text: 'Feeling worried is okay. It means my brain is trying to keep me safe.' },
      { emoji: '😮‍💨', text: 'I can breathe slowly. In for 4... hold for 4... out for 4...' },
      { emoji: '🤗', text: 'I can ask for a hug or squeeze my hands together.' },
      { emoji: '🗣️', text: 'I can tell someone how I feel using my feelings symbols.' },
      { emoji: '😌', text: 'I am safe. The worried feeling will pass.' },
    ],
  },
  {
    id: 'feeling-happy',
    title: 'When I Feel Happy',
    description: 'Sharing good feelings with others',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'feelings',
    steps: [
      { emoji: '😊', text: 'I feel happy! Something good happened.' },
      { emoji: '🤩', text: 'Happy is a wonderful feeling to have.' },
      { emoji: '🗣️', text: 'I can share my happy feeling by tapping "I am happy".' },
      { emoji: '❤️', text: 'I can tell people what made me happy: "I like..."' },
      { emoji: '🎉', text: 'Sharing happy feelings can make other people happy too!' },
    ],
  },
  {
    id: 'feeling-tired',
    title: 'When I Feel Tired',
    description: 'Telling people I need rest',
    icon: <Clock className="w-5 h-5" />,
    category: 'feelings',
    steps: [
      { emoji: '😴', text: 'I feel tired. My body and brain need rest.' },
      { emoji: '✅', text: 'Being tired is normal, especially after doing lots of things.' },
      { emoji: '🙏', text: 'I can tap "I need" then "Rest" or "Break".' },
      { emoji: '🔇', text: 'A quiet place can help me feel less tired.' },
      { emoji: '💤', text: 'Resting helps my brain recharge.' },
    ],
  },

  // Safety
  {
    id: 'stranger-online',
    title: 'Talking to New People Online',
    description: 'Staying safe with people I don\'t know',
    icon: <ShieldCheck className="w-5 h-5" />,
    category: 'safety',
    steps: [
      { emoji: '👤', text: 'Sometimes new people might message me.' },
      { emoji: '🤔', text: 'I should be careful with people I don\'t know.' },
      { emoji: '🚫', text: 'I do NOT share my address, phone number, or photos.' },
      { emoji: '🛑', text: 'If someone makes me feel uncomfortable, I tap "Stop".' },
      { emoji: '🆘', text: 'I can always tap the red "I need help" button.' },
      { emoji: '👩', text: 'I can tell my parent or helper about any message.', tip: 'You are never in trouble for telling a grown-up.' },
    ],
  },
  {
    id: 'someone-mean',
    title: 'When Someone is Mean to Me',
    description: 'What to do if someone says mean things',
    icon: <ShieldCheck className="w-5 h-5" />,
    category: 'safety',
    steps: [
      { emoji: '😢', text: 'Someone said something that made me feel bad.' },
      { emoji: '✅', text: 'It is NOT my fault. Mean words say something about them, not me.' },
      { emoji: '🙅', text: 'I can tap "Stop" or "I don\'t like" to tell them.' },
      { emoji: '🚫', text: 'I do not have to keep talking to them.' },
      { emoji: '🆘', text: 'I can tell my helper or use the report button.' },
      { emoji: '❤️', text: 'I am a good person. Mean words cannot change that.', tip: 'Always tell someone you trust.' },
    ],
  },
  {
    id: 'emergency',
    title: 'In an Emergency',
    description: 'What to do if something bad happens',
    icon: <AlertTriangle className="w-5 h-5" />,
    category: 'safety',
    steps: [
      { emoji: '🚨', text: 'Something bad or scary is happening right now.' },
      { emoji: '🆘', text: 'I tap the big red "I NEED HELP" button.' },
      { emoji: '📞', text: 'Someone will see my message and help me.' },
      { emoji: '📍', text: 'If I can, I say where I am.' },
      { emoji: '⏳', text: 'I stay where I am and wait for help.' },
      { emoji: '😌', text: 'Help is coming. I am brave.', tip: 'The help button is always there for you.' },
    ],
  },

  // Social
  {
    id: 'making-friends',
    title: 'Making Friends',
    description: 'How friendships work',
    icon: <Users className="w-5 h-5" />,
    category: 'social',
    steps: [
      { emoji: '👤', text: 'I can meet new people on NeuroChat.' },
      { emoji: '👋', text: 'I say hello first. That is how friendships start.' },
      { emoji: '❤️', text: 'I share things I like. They share things they like.' },
      { emoji: '🤝', text: 'If we like the same things, we might become friends.' },
      { emoji: '⏳', text: 'Friendship takes time. That is normal.' },
      { emoji: '😊', text: 'Having even one friend is wonderful.', tip: 'Being yourself is the best way to make friends.' },
    ],
  },
  {
    id: 'taking-turns',
    title: 'Taking Turns in Chat',
    description: 'How conversation flow works',
    icon: <MessageCircle className="w-5 h-5" />,
    category: 'social',
    steps: [
      { emoji: '🗣️', text: 'In a conversation, we take turns.' },
      { emoji: '💬', text: 'I say something, then I wait.' },
      { emoji: '👂', text: 'The other person says something, then they wait.' },
      { emoji: '🔄', text: 'We go back and forth. This is called turn-taking.' },
      { emoji: '⏳', text: 'It is okay if there is a long pause between messages.' },
      { emoji: '✅', text: 'I am doing great at taking turns!' },
    ],
  },
  {
    id: 'sharing-interests',
    title: 'Talking About My Interests',
    description: 'How to share what I love',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'social',
    steps: [
      { emoji: '⭐', text: 'I have things I really love and know a lot about.' },
      { emoji: '🗣️', text: 'I can tell people about them using "I like" or "My favourite".' },
      { emoji: '❓', text: 'I can also ask "What do you like?"' },
      { emoji: '👂', text: 'I listen when they talk about their interests too.' },
      { emoji: '🔄', text: 'Sometimes I talk about my thing, sometimes about theirs.' },
      { emoji: '😊', text: 'Sharing interests is a great way to connect!', tip: 'Your passions make you unique and interesting.' },
    ],
  },
  {
    id: 'personal-space',
    title: 'Personal Space Online',
    description: 'Understanding boundaries in chat',
    icon: <ShieldCheck className="w-5 h-5" />,
    category: 'social',
    steps: [
      { emoji: '🏠', text: 'Just like in real life, people need space online too.' },
      { emoji: '⏳', text: 'If someone does not reply quickly, that is okay.' },
      { emoji: '💬', text: 'I do not need to send many messages in a row.' },
      { emoji: '✅', text: 'One message and then I wait is a good rule.' },
      { emoji: '🔇', text: 'If I need a break from chatting, I can say "I need a break".', tip: 'It\'s healthy to take breaks from screens.' },
    ],
  },
  {
    id: 'phone-call',
    title: 'Making a Phone Call',
    description: 'What happens during a call',
    icon: <PhoneIcon className="w-5 h-5" />,
    category: 'social',
    steps: [
      { emoji: '📞', text: 'Sometimes I might want to call someone.' },
      { emoji: '👋', text: 'When they answer, I say hello.' },
      { emoji: '🗣️', text: 'I talk and listen, taking turns.' },
      { emoji: '🤔', text: 'If I get confused, I can say "Please repeat".' },
      { emoji: '🫡', text: 'When we are finished, I say goodbye.' },
      { emoji: '✅', text: 'Calls can feel hard, but I did it!', tip: 'It\'s okay to prefer messages over calls.' },
    ],
  },
]

const CATEGORY_CONFIG = {
  conversation: { label: 'Conversation', color: 'text-blue-400 bg-blue-500/10' },
  'daily-life': { label: 'Daily Life', color: 'text-emerald-400 bg-emerald-500/10' },
  feelings: { label: 'Feelings', color: 'text-pink-400 bg-pink-500/10' },
  safety: { label: 'Safety', color: 'text-red-400 bg-red-500/10' },
  social: { label: 'Social', color: 'text-violet-400 bg-violet-500/10' },
}

/* ------------------------------------------------------------------ */
/*  TTS                                                                */
/* ------------------------------------------------------------------ */

function speak(text: string) {
  if (!('speechSynthesis' in window) || !text.trim()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.8
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface SocialStoryToolProps {
  open: boolean
  onClose: () => void
  onSendSymbols?: (message: string, symbols: { emoji: string; label: string }[]) => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SocialStoryTool({ open, onClose }: SocialStoryToolProps) {
  const [selectedStory, setSelectedStory] = useState<SocialStory | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStories = useMemo(() => {
    let stories = STORIES
    if (filterCategory) stories = stories.filter(s => s.category === filterCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      stories = stories.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    }
    return stories
  }, [filterCategory, searchQuery])

  function openStory(story: SocialStory) {
    setSelectedStory(story)
    setCurrentStep(0)
  }

  function closeStory() {
    setSelectedStory(null)
    setCurrentStep(0)
  }

  function nextStep() {
    if (selectedStory && currentStep < selectedStory.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  function prevStep() {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  function speakStep() {
    if (!selectedStory) return
    speak(selectedStory.steps[currentStep].text)
  }

  function speakAll() {
    if (!selectedStory) return
    const full = selectedStory.steps.map(s => s.text).join('. ')
    speak(full)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-heavy rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            {selectedStory ? (
              <button onClick={closeStory} className="p-1 rounded-lg hover:bg-muted/50">
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <BookOpen className="w-5 h-5 text-primary" />
            )}
            <h2 className="font-semibold text-sm">
              {selectedStory ? selectedStory.title : 'Social Stories'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!selectedStory ? (
            /* ─── Story browser ─── */
            <div className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search stories..."
                  className="w-full pl-10 pr-4 py-2 bg-muted/30 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              {/* Category filters */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => setFilterCategory(null)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                    !filterCategory ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground hover:text-foreground'
                  )}
                >
                  All
                </button>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setFilterCategory(filterCategory === key ? null : key)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                      filterCategory === key ? 'bg-primary text-primary-foreground' : config.color
                    )}
                  >
                    {config.label}
                  </button>
                ))}
              </div>

              {/* Story cards */}
              <div className="space-y-2">
                {filteredStories.map((story, i) => {
                  const catConfig = CATEGORY_CONFIG[story.category]
                  return (
                    <button
                      key={story.id}
                      onClick={() => openStory(story)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:glow-sm transition-all text-left animate-fade-in"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', catConfig.color)}>
                        {story.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">{story.title}</span>
                        <span className="text-[11px] text-muted-foreground block truncate">{story.description}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/50 shrink-0">{story.steps.length} steps</span>
                    </button>
                  )
                })}
                {filteredStories.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">No stories found</p>
                )}
              </div>
            </div>
          ) : (
            /* ─── Story reader ─── */
            <div className="p-5 space-y-5">
              {/* Progress bar */}
              <div className="flex gap-1">
                {selectedStory.steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      'flex-1 h-1.5 rounded-full transition-all',
                      i <= currentStep ? 'bg-primary' : 'bg-muted/40',
                      i === currentStep && 'glow-sm'
                    )}
                  />
                ))}
              </div>

              {/* Step card */}
              <div className="glass rounded-2xl p-6 text-center space-y-4 min-h-[200px] flex flex-col items-center justify-center animate-fade-in" key={currentStep}>
                <span className="text-5xl" role="img">{selectedStory.steps[currentStep].emoji}</span>
                <p className="text-base leading-relaxed font-medium max-w-xs">
                  {selectedStory.steps[currentStep].text}
                </p>
                {selectedStory.steps[currentStep].tip && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10 max-w-xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed text-left">
                      {selectedStory.steps[currentStep].tip}
                    </p>
                  </div>
                )}
              </div>

              {/* Step counter */}
              <p className="text-center text-[11px] text-muted-foreground">
                Step {currentStep + 1} of {selectedStory.steps.length}
              </p>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex-1 py-3 rounded-xl glass text-sm font-medium disabled:opacity-30 hover:bg-muted/40 active:scale-[0.98] transition-all"
                >
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button
                  onClick={speakStep}
                  className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:bg-blue-500/10 hover:text-blue-400 active:scale-95 transition-all"
                  title="Read this step aloud"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                {currentStep < selectedStory.steps.length - 1 ? (
                  <button
                    onClick={nextStep}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-sm hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    Next <ChevronRight className="w-4 h-4 inline ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={closeStory}
                    className="flex-1 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 active:scale-[0.98] transition-all"
                  >
                    Done!
                  </button>
                )}
              </div>

              {/* Read all button */}
              <button
                onClick={speakAll}
                className="w-full py-2 rounded-xl glass text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Volume2 className="w-3 h-3 inline mr-1" /> Read entire story aloud
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
