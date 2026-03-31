import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  BookOpen, ChevronLeft, ChevronRight, Volume2, X, Search, Settings2,
  MessageCircle, Users, Heart, ShieldCheck, Sparkles, Clock,
  Utensils, Bus, Hospital, ShoppingCart, Plus, Trash2, Edit3,
  HandHeart, Brain, AlertTriangle, Copy, Palette, Type, Play,
  Home, GraduationCap, Bath, Sun, Stethoscope,
  Dog, TreePine, Plane, Music, Gamepad2, Scissors, Shirt,
  Bed, Baby, Pill,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StoryStep {
  emoji: string
  text: string
  tip?: string
}

type StoryCategory =
  | 'conversation' | 'daily-life' | 'feelings' | 'safety' | 'social'
  | 'health' | 'routines' | 'places' | 'relationships' | 'custom'

interface SocialStory {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: StoryCategory
  steps: StoryStep[]
  isCustom?: boolean
}

interface CustomStoryData {
  id: string
  title: string
  description: string
  category: StoryCategory
  steps: StoryStep[]
}

/* ------------------------------------------------------------------ */
/*  localStorage persistence for custom stories                        */
/* ------------------------------------------------------------------ */

const CUSTOM_STORIES_KEY = 'neurochat_custom_stories'

function loadCustomStories(): CustomStoryData[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_STORIES_KEY) || '[]')
  } catch { return [] }
}

function saveCustomStories(stories: CustomStoryData[]) {
  localStorage.setItem(CUSTOM_STORIES_KEY, JSON.stringify(stories))
}

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_CONFIG: Record<StoryCategory, { label: string; color: string }> = {
  conversation: { label: 'Conversation', color: 'text-blue-400 bg-blue-500/10' },
  'daily-life': { label: 'Daily Life', color: 'text-emerald-400 bg-emerald-500/10' },
  feelings: { label: 'Feelings', color: 'text-pink-400 bg-pink-500/10' },
  safety: { label: 'Safety', color: 'text-red-400 bg-red-500/10' },
  social: { label: 'Social', color: 'text-violet-400 bg-violet-500/10' },
  health: { label: 'Health & Body', color: 'text-cyan-400 bg-cyan-500/10' },
  routines: { label: 'Routines', color: 'text-amber-400 bg-amber-500/10' },
  places: { label: 'Places', color: 'text-teal-400 bg-teal-500/10' },
  relationships: { label: 'People', color: 'text-orange-400 bg-orange-500/10' },
  custom: { label: 'My Stories', color: 'text-primary bg-primary/10' },
}

/* ------------------------------------------------------------------ */
/*  Built-in story library (50+ stories covering real life)            */
/* ------------------------------------------------------------------ */

const BUILT_IN_STORIES: SocialStory[] = [
  // ─── CONVERSATION (6) ───
  { id: 'starting-chat', title: 'Starting a Chat', description: 'How to begin talking to someone', icon: <MessageCircle className="w-5 h-5" />, category: 'conversation', steps: [
    { emoji: '👋', text: 'I want to talk to someone.', tip: 'It is okay to start a conversation.' },
    { emoji: '😊', text: 'I say "Hello" or wave to say hi.' },
    { emoji: '⏳', text: 'I wait for them to reply. This might take a moment.' },
    { emoji: '👂', text: 'I read or listen to what they say.' },
    { emoji: '🗣️', text: 'I can reply with words, symbols, or phrases.' },
    { emoji: '✅', text: 'Having a conversation is nice. I did a great job!' },
  ]},
  { id: 'ending-chat', title: 'Ending a Conversation', description: 'How to finish talking nicely', icon: <MessageCircle className="w-5 h-5" />, category: 'conversation', steps: [
    { emoji: '💬', text: 'I have been talking to someone.' },
    { emoji: '🕐', text: 'Sometimes conversations need to end. That is okay.' },
    { emoji: '🫡', text: 'I say "Goodbye" or "Talk to you later".' },
    { emoji: '😊', text: 'The other person will understand.' },
    { emoji: '👍', text: 'I can talk to them again another time.' },
  ]},
  { id: 'dont-understand', title: "When I Don't Understand", description: 'What to do when something confuses me', icon: <Brain className="w-5 h-5" />, category: 'conversation', steps: [
    { emoji: '🤔', text: 'Someone said something I do not understand.' },
    { emoji: '✅', text: 'It is okay not to understand everything.' },
    { emoji: '🔄', text: 'I can say "Please say that again".' },
    { emoji: '❓', text: 'I can ask "What do you mean?"' },
    { emoji: '⏳', text: 'I can take my time. There is no rush.', tip: 'It is brave to ask questions.' },
  ]},
  { id: 'saying-no', title: 'Saying No', description: 'It is okay to say no to anyone', icon: <ShieldCheck className="w-5 h-5" />, category: 'conversation', steps: [
    { emoji: '❌', text: 'Sometimes I do not want to do something.' },
    { emoji: '✅', text: 'It is always okay to say no.', tip: 'Nobody should be angry at you for saying no.' },
    { emoji: '🚫', text: 'I can say "I don\'t want" and then what I don\'t want.' },
    { emoji: '🙅', text: 'I can say "Stop" if something makes me uncomfortable.' },
    { emoji: '💪', text: 'Saying no is brave and important.' },
  ]},
  { id: 'asking-for-help', title: 'Asking for Help', description: 'How to tell someone I need help', icon: <HandHeart className="w-5 h-5" />, category: 'conversation', steps: [
    { emoji: '🤔', text: 'Sometimes I need help with something.' },
    { emoji: '✅', text: 'Everyone needs help sometimes. That is okay.' },
    { emoji: '🙏', text: 'I say "I need help" or "Help me please".' },
    { emoji: '👤', text: 'I can tell them what I need help with.' },
    { emoji: '🙏', text: 'I say "Thank you" when they help.', tip: 'You are doing great asking for help!' },
  ]},
  { id: 'someone-upset', title: 'When Someone is Upset', description: 'What to do when someone seems sad', icon: <Heart className="w-5 h-5" />, category: 'conversation', steps: [
    { emoji: '😢', text: 'Someone seems sad or upset.' },
    { emoji: '🤔', text: 'I might not know why. That is okay.' },
    { emoji: '❤️', text: 'I can say "I am here for you".' },
    { emoji: '👂', text: 'I can listen if they want to talk.' },
    { emoji: '⏳', text: 'Sometimes people need time alone. I can check later.', tip: 'You don\'t have to fix everything.' },
  ]},

  // ─── DAILY LIFE (8) ───
  { id: 'hungry', title: 'Telling Someone I\'m Hungry', description: 'How to ask for food or drink', icon: <Utensils className="w-5 h-5" />, category: 'daily-life', steps: [
    { emoji: '🍽️', text: 'My tummy feels empty. I might be hungry.' },
    { emoji: '🙋', text: 'I can say "I want food" or "I want water".' },
    { emoji: '❤️', text: 'If I know what I want, I say "I like" and then the food.' },
    { emoji: '⏳', text: 'Someone will help me get food.' },
    { emoji: '😊', text: 'Eating helps me feel better.' },
  ]},
  { id: 'getting-dressed', title: 'Getting Dressed', description: 'Putting on my clothes each day', icon: <Shirt className="w-5 h-5" />, category: 'daily-life', steps: [
    { emoji: '👕', text: 'It is time to get dressed.' },
    { emoji: '🤔', text: 'I can choose what to wear. Or someone can help me choose.' },
    { emoji: '👖', text: 'I put on my clothes one piece at a time.' },
    { emoji: '✅', text: 'If something feels wrong — too tight, too scratchy — I can say "I don\'t like this".', tip: 'It is okay if some fabrics feel bad.' },
    { emoji: '😊', text: 'When I am dressed, I am ready for my day!' },
  ]},
  { id: 'bathtime', title: 'Having a Bath or Shower', description: 'What happens at bathtime', icon: <Bath className="w-5 h-5" />, category: 'daily-life', steps: [
    { emoji: '🛁', text: 'It is time to have a bath or shower.' },
    { emoji: '🌡️', text: 'The water should feel warm, not too hot.' },
    { emoji: '🧴', text: 'I use soap to wash my body and shampoo for my hair.' },
    { emoji: '⏳', text: 'I can take my time. I do not need to rush.' },
    { emoji: '🧣', text: 'When I am done, I dry myself with a towel.' },
    { emoji: '✅', text: 'Clean feels good!', tip: 'If the water is too hot or cold, say so.' },
  ]},
  { id: 'bedtime', title: 'Going to Bed', description: 'Getting ready for sleep', icon: <Bed className="w-5 h-5" />, category: 'daily-life', steps: [
    { emoji: '🌙', text: 'It is getting dark. Bedtime is coming.' },
    { emoji: '🦷', text: 'I brush my teeth.' },
    { emoji: '👕', text: 'I put on my pyjamas.' },
    { emoji: '📖', text: 'I might read a story or listen to quiet music.' },
    { emoji: '🛏️', text: 'I get into my bed and close my eyes.' },
    { emoji: '💤', text: 'Sleep helps my brain and body feel strong tomorrow.', tip: 'If you cannot sleep, that is okay. Just rest.' },
  ]},
  { id: 'morning-routine', title: 'My Morning Routine', description: 'What I do when I wake up', icon: <Sun className="w-5 h-5" />, category: 'daily-life', steps: [
    { emoji: '🌅', text: 'I wake up. A new day is starting.' },
    { emoji: '🚿', text: 'I wash my face or have a shower.' },
    { emoji: '👕', text: 'I get dressed for the day.' },
    { emoji: '🥣', text: 'I eat breakfast to give my body energy.' },
    { emoji: '🦷', text: 'I brush my teeth.' },
    { emoji: '✅', text: 'I am ready for the day!', tip: 'You can do the steps in the order that works for you.' },
  ]},
  { id: 'haircut', title: 'Getting a Haircut', description: 'What happens at the hairdresser', icon: <Scissors className="w-5 h-5" />, category: 'daily-life', steps: [
    { emoji: '💇', text: 'Today I am going to get my hair cut.' },
    { emoji: '🪑', text: 'I sit in a special chair.' },
    { emoji: '✂️', text: 'Someone will use scissors or clippers near my head. They are being careful.' },
    { emoji: '💦', text: 'My hair might get wet. That is normal.' },
    { emoji: '⏳', text: 'It does not take too long. I can sit still or ask for a break.' },
    { emoji: '😊', text: 'When it is done, my hair looks nice!', tip: 'If the sound bothers you, you can wear ear defenders.' },
  ]},
  { id: 'cooking-helping', title: 'Helping in the Kitchen', description: 'How to help make food', icon: <Utensils className="w-5 h-5" />, category: 'daily-life', steps: [
    { emoji: '👨‍🍳', text: 'Someone is making food. I can help!' },
    { emoji: '🧼', text: 'First I wash my hands.' },
    { emoji: '🥕', text: 'I can help with safe jobs: stirring, pouring, washing vegetables.' },
    { emoji: '⚠️', text: 'I do not touch hot things or sharp knives without help.' },
    { emoji: '🍽️', text: 'When the food is ready, we eat together.' },
    { emoji: '✅', text: 'I helped make the food! That is something to be proud of.' },
  ]},
  { id: 'tidying-up', title: 'Tidying My Space', description: 'Keeping my room tidy', icon: <Home className="w-5 h-5" />, category: 'daily-life', steps: [
    { emoji: '🏠', text: 'My room is a bit messy. I can tidy up.' },
    { emoji: '1️⃣', text: 'I start with one small area. Not everything at once.' },
    { emoji: '📦', text: 'I put things back where they belong.' },
    { emoji: '🗑️', text: 'I throw away rubbish.' },
    { emoji: '✅', text: 'A tidy space helps my brain feel calmer.', tip: 'It does not have to be perfect. Just better.' },
  ]},

  // ─── FEELINGS (7) ───
  { id: 'feeling-angry', title: 'When I Feel Angry', description: 'What to do with big angry feelings', icon: <AlertTriangle className="w-5 h-5" />, category: 'feelings', steps: [
    { emoji: '😠', text: 'I feel angry right now. My body feels hot and tight.' },
    { emoji: '✅', text: 'It is okay to feel angry. Everyone does sometimes.' },
    { emoji: '🗣️', text: 'I can tell someone "I am angry".' },
    { emoji: '😤', text: 'I take deep breaths. In... and out...' },
    { emoji: '⏰', text: 'I can ask for a break or a quiet space.' },
    { emoji: '😌', text: 'The angry feeling will go away.', tip: 'Feelings are like weather — they always pass.' },
  ]},
  { id: 'feeling-anxious', title: 'When I Feel Worried', description: 'What to do when everything feels too much', icon: <Heart className="w-5 h-5" />, category: 'feelings', steps: [
    { emoji: '😰', text: 'I feel worried or scared. My tummy might feel funny.' },
    { emoji: '✅', text: 'Feeling worried is okay. My brain is trying to keep me safe.' },
    { emoji: '😮‍💨', text: 'I breathe slowly. In for 4... hold for 4... out for 4...' },
    { emoji: '🤗', text: 'I can ask for a hug or squeeze something soft.' },
    { emoji: '😌', text: 'I am safe. The worried feeling will pass.' },
  ]},
  { id: 'feeling-happy', title: 'When I Feel Happy', description: 'Sharing good feelings', icon: <Sparkles className="w-5 h-5" />, category: 'feelings', steps: [
    { emoji: '😊', text: 'I feel happy! Something good happened.' },
    { emoji: '🤩', text: 'Happy is a wonderful feeling.' },
    { emoji: '❤️', text: 'I can tell people what made me happy.' },
    { emoji: '🎉', text: 'Sharing happy feelings can make other people happy too!' },
  ]},
  { id: 'feeling-tired', title: 'When I Feel Tired', description: 'Telling people I need rest', icon: <Clock className="w-5 h-5" />, category: 'feelings', steps: [
    { emoji: '😴', text: 'I feel tired. My body and brain need rest.' },
    { emoji: '✅', text: 'Being tired is normal after doing lots of things.' },
    { emoji: '🙏', text: 'I say "I need rest" or "I need a break".' },
    { emoji: '💤', text: 'Resting helps my brain recharge.' },
  ]},
  { id: 'feeling-overwhelmed', title: 'When Everything is Too Much', description: 'What to do during a meltdown or shutdown', icon: <AlertTriangle className="w-5 h-5" />, category: 'feelings', steps: [
    { emoji: '😵', text: 'Everything feels too much right now. Too loud, too bright, too fast.' },
    { emoji: '✅', text: 'This is called being overwhelmed. It is not my fault.' },
    { emoji: '🔇', text: 'I need a quiet, safe space. I can ask for one.' },
    { emoji: '🧸', text: 'I can hold something comforting or stim in a way that helps.' },
    { emoji: '⏳', text: 'I do not need to do anything right now. Just breathe.' },
    { emoji: '😌', text: 'The feeling will pass. I will feel calmer soon.', tip: 'Meltdowns and shutdowns are not bad behaviour. They are overload.' },
  ]},
  { id: 'feeling-lonely', title: 'When I Feel Lonely', description: 'What loneliness feels like and what to do', icon: <Heart className="w-5 h-5" />, category: 'feelings', steps: [
    { emoji: '😔', text: 'I feel alone even if people are around me.' },
    { emoji: '✅', text: 'Many people feel lonely sometimes. I am not the only one.' },
    { emoji: '📱', text: 'I can message someone I trust.' },
    { emoji: '❤️', text: 'I can say "I want to talk" or "I need company".' },
    { emoji: '⭐', text: 'Doing something I enjoy can help me feel better too.', tip: 'Wanting connection is a strength, not a weakness.' },
  ]},
  { id: 'feeling-frustrated', title: 'When Something is Hard', description: 'What to do when I cannot do something', icon: <Brain className="w-5 h-5" />, category: 'feelings', steps: [
    { emoji: '😤', text: 'I am trying to do something and it is not working.' },
    { emoji: '✅', text: 'Feeling frustrated is normal when things are hard.' },
    { emoji: '⏸️', text: 'I can take a short break and come back to it.' },
    { emoji: '🙏', text: 'I can ask for help. That is not giving up.' },
    { emoji: '🏆', text: 'Every time I try, I am learning. Even if I do not finish.', tip: 'Struggling does not mean failing.' },
  ]},

  // ─── HEALTH & BODY (6) ───
  { id: 'feeling-sick', title: 'When I Feel Sick', description: 'Telling someone my body does not feel right', icon: <Hospital className="w-5 h-5" />, category: 'health', steps: [
    { emoji: '😷', text: 'My body does not feel good.' },
    { emoji: '😣', text: 'I say "I don\'t feel good".' },
    { emoji: '📍', text: 'I try to show or say where it hurts: head, tummy, throat.' },
    { emoji: '💊', text: 'I might need medicine or to see a doctor.' },
    { emoji: '👩', text: 'A grown-up or helper will take care of me.', tip: 'Always tell someone if you feel sick.' },
  ]},
  { id: 'going-to-doctor', title: 'Going to the Doctor', description: 'What happens at a doctor visit', icon: <Stethoscope className="w-5 h-5" />, category: 'health', steps: [
    { emoji: '🏥', text: 'Today I am going to see the doctor.' },
    { emoji: '🪑', text: 'I sit in the waiting room first. It might be busy.' },
    { emoji: '👩‍⚕️', text: 'The doctor will ask me questions about how I feel.' },
    { emoji: '🩺', text: 'They might listen to my chest or look in my ears. It does not hurt.' },
    { emoji: '💊', text: 'They might give me medicine to help me feel better.' },
    { emoji: '✅', text: 'The doctor is there to help me. I was brave going.', tip: 'You can bring a comfort item with you.' },
  ]},
  { id: 'going-to-dentist', title: 'Going to the Dentist', description: 'What happens at a dental visit', icon: <Sparkles className="w-5 h-5" />, category: 'health', steps: [
    { emoji: '🦷', text: 'Today I am going to the dentist.' },
    { emoji: '🪑', text: 'I sit in a big chair that goes up and down.' },
    { emoji: '👄', text: 'I open my mouth wide so they can look at my teeth.' },
    { emoji: '🔦', text: 'There is a bright light. I can close my eyes if I want.' },
    { emoji: '🪥', text: 'They clean my teeth with special tools. It might feel strange.' },
    { emoji: '✅', text: 'It is over! My teeth are clean and healthy.', tip: 'You can raise your hand if you need a break.' },
  ]},
  { id: 'taking-medicine', title: 'Taking Medicine', description: 'Why and how I take medicine', icon: <Pill className="w-5 h-5" />, category: 'health', steps: [
    { emoji: '💊', text: 'Sometimes I need to take medicine.' },
    { emoji: '✅', text: 'Medicine helps my body or brain work better.' },
    { emoji: '💧', text: 'I take it with water. Some medicine tastes funny — that is okay.' },
    { emoji: '⏰', text: 'I take it at the same time each day if I need to.' },
    { emoji: '😊', text: 'Taking my medicine helps me feel well.', tip: 'If medicine makes you feel strange, tell someone.' },
  ]},
  { id: 'sensory-overload', title: 'When My Senses are Overloaded', description: 'Too loud, too bright, too much', icon: <AlertTriangle className="w-5 h-5" />, category: 'health', steps: [
    { emoji: '🔊', text: 'It is too loud, too bright, or too smelly here.' },
    { emoji: '😖', text: 'My body feels uncomfortable. That is sensory overload.' },
    { emoji: '🎧', text: 'I can put on ear defenders or sunglasses.' },
    { emoji: '🚶', text: 'I can leave and go somewhere quieter.' },
    { emoji: '🙏', text: 'I say "I need a break" or "Too loud".' },
    { emoji: '😌', text: 'In a calmer place, my body will relax.', tip: 'Your comfort matters. You can always leave.' },
  ]},
  { id: 'body-changes', title: 'My Body is Changing', description: 'Understanding growing up', icon: <Baby className="w-5 h-5" />, category: 'health', steps: [
    { emoji: '📏', text: 'I am getting taller and my body is changing.' },
    { emoji: '✅', text: 'This is normal. Everyone\'s body changes as they grow.' },
    { emoji: '🤔', text: 'Some changes might feel strange or surprising.' },
    { emoji: '👩', text: 'I can ask a trusted person about anything I notice.' },
    { emoji: '❤️', text: 'My body is doing exactly what it should.', tip: 'Everyone grows at their own pace.' },
  ]},

  // ─── ROUTINES (4) ───
  { id: 'routine-change', title: 'When My Routine Changes', description: 'What to do when plans change unexpectedly', icon: <Clock className="w-5 h-5" />, category: 'routines', steps: [
    { emoji: '📅', text: 'Something has changed in my usual routine.' },
    { emoji: '😟', text: 'Change can feel uncomfortable or scary. That is okay.' },
    { emoji: '🤔', text: 'I can ask what is happening and what comes next.' },
    { emoji: '📝', text: 'A new plan or picture schedule can help me understand.' },
    { emoji: '✅', text: 'Even though it is different, I can handle it.', tip: 'It is okay to feel upset about changes.' },
  ]},
  { id: 'waiting', title: 'Waiting for Something', description: 'How to handle waiting', icon: <Clock className="w-5 h-5" />, category: 'routines', steps: [
    { emoji: '⏰', text: 'I need to wait for something. Waiting is hard.' },
    { emoji: '✅', text: 'Everyone finds waiting hard. My feelings are normal.' },
    { emoji: '🎯', text: 'I can do something else while I wait: count, stim, look at something.' },
    { emoji: '❓', text: 'I can ask "How much longer?" — that is okay.' },
    { emoji: '🎉', text: 'The wait is over! I was patient.', tip: 'Timer apps can help make waiting easier.' },
  ]},
  { id: 'transitions', title: 'Changing Activities', description: 'Moving from one thing to the next', icon: <Clock className="w-5 h-5" />, category: 'routines', steps: [
    { emoji: '🔄', text: 'It is time to stop what I am doing and do something else.' },
    { emoji: '😟', text: 'Stopping can feel hard, especially if I am enjoying something.' },
    { emoji: '⏱️', text: 'A warning helps: "5 more minutes" before I need to stop.' },
    { emoji: '✅', text: 'I finish what I am doing and move to the next thing.' },
    { emoji: '😊', text: 'The new activity might be nice too.', tip: 'Ask for warnings before transitions.' },
  ]},
  { id: 'screen-time-ending', title: 'When Screen Time Ends', description: 'Stopping games or videos', icon: <Gamepad2 className="w-5 h-5" />, category: 'routines', steps: [
    { emoji: '📱', text: 'I have been using my screen for a while.' },
    { emoji: '⏰', text: 'It is time to stop. I might not want to.' },
    { emoji: '✅', text: 'Feeling upset about stopping is normal.' },
    { emoji: '💾', text: 'I can save my progress. It will be there next time.' },
    { emoji: '🎯', text: 'I turn off the screen and do something else.' },
    { emoji: '😊', text: 'I can use it again later.', tip: 'A timer with a warning helps you prepare.' },
  ]},

  // ─── PLACES (7) ───
  { id: 'going-shopping', title: 'Going to the Shops', description: 'What happens at the shops', icon: <ShoppingCart className="w-5 h-5" />, category: 'places', steps: [
    { emoji: '🛒', text: 'We are going to the shops.' },
    { emoji: '👀', text: 'There will be many things to see and hear.' },
    { emoji: '🔊', text: 'It might be noisy. I can wear my ear defenders.' },
    { emoji: '🙋', text: 'If I want something, I say "I want" or point to it.' },
    { emoji: '✅', text: 'Sometimes the answer is yes, sometimes no. Both are okay.' },
    { emoji: '🏠', text: 'Then we go home.' },
  ]},
  { id: 'going-to-school', title: 'Going to School', description: 'What happens at school each day', icon: <GraduationCap className="w-5 h-5" />, category: 'places', steps: [
    { emoji: '🏫', text: 'Today is a school day.' },
    { emoji: '🎒', text: 'I get my bag ready with the things I need.' },
    { emoji: '👋', text: 'I go to school and see my teacher and classmates.' },
    { emoji: '📚', text: 'We do lessons, have break time, and eat lunch.' },
    { emoji: '🙏', text: 'If I need help or a break, I tell my teacher.' },
    { emoji: '🏠', text: 'At the end of the day, I go home.', tip: 'It is okay to need quiet time after school.' },
  ]},
  { id: 'restaurant', title: 'Eating at a Restaurant', description: 'What happens when we eat out', icon: <Utensils className="w-5 h-5" />, category: 'places', steps: [
    { emoji: '🍴', text: 'We are going to eat at a restaurant.' },
    { emoji: '🪑', text: 'We sit at a table and look at the menu.' },
    { emoji: '🙋', text: 'I choose what I want to eat. I can point or say it.' },
    { emoji: '⏳', text: 'We wait for the food to be made. This takes a little while.' },
    { emoji: '🍽️', text: 'The food arrives! I eat what I like.' },
    { emoji: '✅', text: 'When we are done, we pay and leave.', tip: 'You can bring headphones if it is noisy.' },
  ]},
  { id: 'park', title: 'Going to the Park', description: 'Playing outside at the park', icon: <TreePine className="w-5 h-5" />, category: 'places', steps: [
    { emoji: '🌳', text: 'We are going to the park!' },
    { emoji: '🏃', text: 'I can run, play on the equipment, or sit and watch.' },
    { emoji: '👥', text: 'Other children might be there too.' },
    { emoji: '🙋', text: 'If I want to join in, I can say "Can I play?"' },
    { emoji: '💧', text: 'I drink water if I feel hot or tired.' },
    { emoji: '🏠', text: 'When it is time, we go home.' },
  ]},
  { id: 'travelling', title: 'Going on a Journey', description: 'What happens on a long trip', icon: <Plane className="w-5 h-5" />, category: 'places', steps: [
    { emoji: '🧳', text: 'We are going on a journey. We pack our things.' },
    { emoji: '🚗', text: 'We travel by car, bus, train, or plane.' },
    { emoji: '⏳', text: 'The journey might take a long time. I can bring things to do.' },
    { emoji: '🤔', text: 'New places can feel different. That is okay.' },
    { emoji: '✅', text: 'I can say how I feel at any time.' },
    { emoji: '🏨', text: 'We arrive! I can explore at my own pace.', tip: 'Take photos of where you are staying to feel safer.' },
  ]},
  { id: 'public-transport', title: 'Using Public Transport', description: 'Buses, trains, and the underground', icon: <Bus className="w-5 h-5" />, category: 'places', steps: [
    { emoji: '🚌', text: 'I am going on a bus or train.' },
    { emoji: '🎫', text: 'I need a ticket or pass. Someone can help me with this.' },
    { emoji: '🪑', text: 'I find a seat and sit down.' },
    { emoji: '🔊', text: 'It might be noisy or crowded. I can use my ear defenders.' },
    { emoji: '🔔', text: 'I get off at my stop. I can ask someone if I am not sure.' },
    { emoji: '✅', text: 'I did it! I used public transport.', tip: 'Sitting near the door can help you feel safer.' },
  ]},
  { id: 'place-of-worship', title: 'Going to a Place of Worship', description: 'Churches, mosques, temples, synagogues', icon: <Heart className="w-5 h-5" />, category: 'places', steps: [
    { emoji: '🕌', text: 'We are going to a place of worship.' },
    { emoji: '🤫', text: 'It is usually quiet inside. People are praying or thinking.' },
    { emoji: '🪑', text: 'I sit or stand with my family.' },
    { emoji: '🙏', text: 'I can join in or sit quietly. Both are okay.' },
    { emoji: '✅', text: 'When it is finished, we leave together.', tip: 'It is okay if you need to step outside for a break.' },
  ]},

  // ─── RELATIONSHIPS & PEOPLE (6) ───
  { id: 'meeting-new-people', title: 'Meeting New People', description: 'What to do when I meet someone new', icon: <Users className="w-5 h-5" />, category: 'relationships', steps: [
    { emoji: '👤', text: 'I am meeting someone I do not know yet.' },
    { emoji: '😬', text: 'Meeting new people can feel scary. That is normal.' },
    { emoji: '👋', text: 'I can say hello and tell them my name.' },
    { emoji: '👂', text: 'I listen when they tell me their name.' },
    { emoji: '😊', text: 'I do not have to talk a lot. Being there is enough.', tip: 'First meetings are often the hardest. It gets easier.' },
  ]},
  { id: 'family-visit', title: 'Visiting Family', description: 'What happens when family comes to visit', icon: <Home className="w-5 h-5" />, category: 'relationships', steps: [
    { emoji: '👨‍👩‍👧', text: 'Family members are coming to visit or I am visiting them.' },
    { emoji: '👋', text: 'I say hello when they arrive.' },
    { emoji: '🤗', text: 'Some family like hugs. I do NOT have to hug anyone I do not want to.' },
    { emoji: '🗣️', text: 'They might ask me questions. I answer what I want to.' },
    { emoji: '🏠', text: 'I can go to a quiet room if I need a break.' },
    { emoji: '🫡', text: 'When it is time, we say goodbye.', tip: 'You never have to hug or kiss anyone.' },
  ]},
  { id: 'making-friends', title: 'Making Friends', description: 'How friendships work', icon: <Users className="w-5 h-5" />, category: 'relationships', steps: [
    { emoji: '👤', text: 'I see someone who seems nice.' },
    { emoji: '👋', text: 'I say hello. That is how friendships start.' },
    { emoji: '❤️', text: 'I share things I like. They share things they like.' },
    { emoji: '🤝', text: 'If we enjoy the same things, we might become friends.' },
    { emoji: '⏳', text: 'Friendship takes time. That is normal.' },
    { emoji: '😊', text: 'Having even one friend is wonderful.', tip: 'Being yourself is the best way to make friends.' },
  ]},
  { id: 'sharing-taking-turns', title: 'Sharing and Taking Turns', description: 'How to share things with others', icon: <Users className="w-5 h-5" />, category: 'relationships', steps: [
    { emoji: '🎮', text: 'Someone wants to use something I am using.' },
    { emoji: '🤔', text: 'Sharing means letting someone else have a turn.' },
    { emoji: '⏰', text: 'I can use it for a bit, then they use it for a bit.' },
    { emoji: '✅', text: 'If I really don\'t want to share something special, I can say "This is mine".', tip: 'You do not have to share everything.' },
    { emoji: '😊', text: 'Taking turns is a good way to play together.' },
  ]},
  { id: 'losing-someone', title: 'When Someone I Love is Gone', description: 'Understanding loss and grief', icon: <Heart className="w-5 h-5" />, category: 'relationships', steps: [
    { emoji: '😢', text: 'Someone I love is not here anymore. I feel very sad.' },
    { emoji: '✅', text: 'It is okay to feel sad, angry, confused, or nothing at all.' },
    { emoji: '💭', text: 'I can remember the happy times we had together.' },
    { emoji: '🤗', text: 'I can talk to someone I trust about how I feel.' },
    { emoji: '❤️', text: 'The love I have for them will always be in my heart.', tip: 'Grief takes as long as it takes. There is no wrong way to feel.' },
  ]},
  { id: 'pet-care', title: 'Looking After a Pet', description: 'Taking care of an animal', icon: <Dog className="w-5 h-5" />, category: 'relationships', steps: [
    { emoji: '🐾', text: 'I have a pet. My pet depends on me.' },
    { emoji: '🍽️', text: 'I give my pet food and fresh water.' },
    { emoji: '🚶', text: 'Some pets need walks or play time.' },
    { emoji: '❤️', text: 'I am gentle with my pet. I pay attention to how they feel.' },
    { emoji: '✅', text: 'Taking care of a living thing is a big responsibility. I am doing well.', tip: 'Pets can be wonderful friends.' },
  ]},

  // ─── SAFETY (5) ───
  { id: 'stranger-danger', title: 'Strangers and Safety', description: 'Staying safe with people I don\'t know', icon: <ShieldCheck className="w-5 h-5" />, category: 'safety', steps: [
    { emoji: '👤', text: 'A stranger is someone I do not know.' },
    { emoji: '🤔', text: 'Most strangers are nice, but I should be careful.' },
    { emoji: '🚫', text: 'I do NOT go with strangers or get in their car.' },
    { emoji: '🚫', text: 'I do NOT share my name, address, or photos with strangers.' },
    { emoji: '🗣️', text: 'If a stranger makes me feel uncomfortable, I tell a trusted adult.' },
    { emoji: '🆘', text: 'If I feel unsafe, I shout for help or run to a safe place.', tip: 'Trusted adults include parents, teachers, and police.' },
  ]},
  { id: 'online-safety', title: 'Staying Safe Online', description: 'How to be safe on the internet', icon: <ShieldCheck className="w-5 h-5" />, category: 'safety', steps: [
    { emoji: '💻', text: 'I use the internet to talk to people and learn things.' },
    { emoji: '🚫', text: 'I do NOT share my address, school, phone number, or photos.' },
    { emoji: '🛑', text: 'If someone makes me feel uncomfortable online, I stop talking to them.' },
    { emoji: '👩', text: 'I tell a trusted adult about anything that worries me.' },
    { emoji: '✅', text: 'Being careful online keeps me safe.', tip: 'You are never in trouble for telling a grown-up.' },
  ]},
  { id: 'bullying', title: 'When Someone Bullies Me', description: 'What to do about bullying', icon: <ShieldCheck className="w-5 h-5" />, category: 'safety', steps: [
    { emoji: '😢', text: 'Someone is being mean to me on purpose. This is bullying.' },
    { emoji: '✅', text: 'It is NOT my fault. Bullying says something about them, not me.' },
    { emoji: '🗣️', text: 'I tell a trusted adult: parent, teacher, or helper.' },
    { emoji: '🚶', text: 'I walk away if I can. I do not have to stay.' },
    { emoji: '❤️', text: 'I am a good person. Nobody deserves to be bullied.', tip: 'Telling someone is not "telling tales" — it is keeping yourself safe.' },
  ]},
  { id: 'fire-safety', title: 'Fire Safety', description: 'What to do if there is a fire', icon: <AlertTriangle className="w-5 h-5" />, category: 'safety', steps: [
    { emoji: '🔥', text: 'There might be a fire or a fire alarm is going off.' },
    { emoji: '🚶', text: 'I leave the building straight away. I do not stop for anything.' },
    { emoji: '🚪', text: 'I use the stairs, not the lift. I follow others to the meeting point.' },
    { emoji: '📞', text: 'Someone calls 999 (or 911).' },
    { emoji: '⏳', text: 'I stay at the meeting point until someone says it is safe.', tip: 'Fire drills at school practise this. They are loud but they keep us safe.' },
  ]},
  { id: 'emergency', title: 'In an Emergency', description: 'What to do if something bad happens', icon: <AlertTriangle className="w-5 h-5" />, category: 'safety', steps: [
    { emoji: '🚨', text: 'Something bad or scary is happening right now.' },
    { emoji: '🆘', text: 'I tell the nearest trusted adult. Or I call 999 / 911.' },
    { emoji: '📍', text: 'I try to say where I am.' },
    { emoji: '⏳', text: 'I stay where I am and wait for help.' },
    { emoji: '😌', text: 'Help is coming. I am brave.', tip: 'The emergency number is always free to call.' },
  ]},

  // ─── SOCIAL (5) ───
  { id: 'taking-turns-conversation', title: 'Taking Turns Talking', description: 'How conversations flow', icon: <MessageCircle className="w-5 h-5" />, category: 'social', steps: [
    { emoji: '🗣️', text: 'In a conversation, we take turns.' },
    { emoji: '💬', text: 'I say something, then I wait.' },
    { emoji: '👂', text: 'The other person says something, then they wait.' },
    { emoji: '🔄', text: 'We go back and forth.' },
    { emoji: '✅', text: 'It is okay if there are pauses. That is normal.' },
  ]},
  { id: 'sharing-interests', title: 'Talking About My Interests', description: 'Sharing what I love with others', icon: <Sparkles className="w-5 h-5" />, category: 'social', steps: [
    { emoji: '⭐', text: 'I have things I really love and know a lot about.' },
    { emoji: '🗣️', text: 'I can tell people about them.' },
    { emoji: '❓', text: 'I also ask "What do you like?"' },
    { emoji: '👂', text: 'I listen when they talk about their interests.' },
    { emoji: '😊', text: 'Sharing interests is a great way to connect!', tip: 'Your passions make you unique and interesting.' },
  ]},
  { id: 'personal-space', title: 'Personal Space', description: 'Understanding physical and emotional boundaries', icon: <Users className="w-5 h-5" />, category: 'social', steps: [
    { emoji: '🧍', text: 'Everyone has an invisible bubble around them. This is personal space.' },
    { emoji: '📏', text: 'I stand about one arm\'s length from people.' },
    { emoji: '✋', text: 'I ask before touching someone: "Can I hug you?"' },
    { emoji: '✅', text: 'If someone says no, I respect that. My body is mine too.' },
    { emoji: '😊', text: 'Respecting space helps everyone feel comfortable.' },
  ]},
  { id: 'apologising', title: 'Saying Sorry', description: 'What to do when I make a mistake', icon: <HandHeart className="w-5 h-5" />, category: 'social', steps: [
    { emoji: '😬', text: 'I did something that upset someone.' },
    { emoji: '✅', text: 'Everyone makes mistakes. That is how we learn.' },
    { emoji: '😔', text: 'I say "I am sorry" and mean it.' },
    { emoji: '🤔', text: 'I try to understand what went wrong so I can do better.' },
    { emoji: '❤️', text: 'Saying sorry takes courage. I am doing my best.', tip: 'You can also write sorry if saying it is hard.' },
  ]},
  { id: 'party-event', title: 'Going to a Party or Event', description: 'What to expect at celebrations', icon: <Music className="w-5 h-5" />, category: 'social', steps: [
    { emoji: '🎈', text: 'There is a party or special event.' },
    { emoji: '🔊', text: 'It might be loud, bright, and busy.' },
    { emoji: '🎧', text: 'I can wear ear defenders or take breaks outside.' },
    { emoji: '🍰', text: 'There might be food, music, and games.' },
    { emoji: '🙋', text: 'I join in what I like and skip what I do not.' },
    { emoji: '✅', text: 'I can leave early if I need to. That is always okay.', tip: 'Have a quiet exit plan ready before you go.' },
  ]},
]

/* ------------------------------------------------------------------ */
/*  TTS                                                                */
/* ------------------------------------------------------------------ */

// TTS is now handled via speakWithPrefs() inside the component,
// which respects the user's readingSpeed preference.

/* ------------------------------------------------------------------ */
/*  Story Display Preferences                                          */
/* ------------------------------------------------------------------ */

interface StoryDisplayPrefs {
  emojiSize: 'small' | 'medium' | 'large' | 'xlarge'
  textSize: 'small' | 'medium' | 'large' | 'xlarge'
  cardBackground: 'default' | 'warm' | 'cool' | 'nature' | 'calm' | 'high-contrast'
  showTips: boolean
  showProgressBar: boolean
  showStepNumbers: boolean
  autoAdvance: boolean
  autoAdvanceDelay: number // seconds
  autoRead: boolean
  readingSpeed: number // 0.5 to 1.5
  layout: 'card' | 'fullscreen' | 'compact'
  animationsEnabled: boolean
  highContrast: boolean
  borderStyle: 'none' | 'subtle' | 'bold'
}

const DEFAULT_STORY_PREFS: StoryDisplayPrefs = {
  emojiSize: 'large',
  textSize: 'medium',
  cardBackground: 'default',
  showTips: true,
  showProgressBar: true,
  showStepNumbers: true,
  autoAdvance: false,
  autoAdvanceDelay: 5,
  autoRead: false,
  readingSpeed: 0.8,
  layout: 'card',
  animationsEnabled: true,
  highContrast: false,
  borderStyle: 'subtle',
}

const STORY_PREFS_KEY = 'neurochat_story_prefs'

function loadStoryPrefs(): StoryDisplayPrefs {
  try {
    const stored = localStorage.getItem(STORY_PREFS_KEY)
    return stored ? { ...DEFAULT_STORY_PREFS, ...JSON.parse(stored) } : DEFAULT_STORY_PREFS
  } catch { return DEFAULT_STORY_PREFS }
}

function saveStoryPrefs(prefs: StoryDisplayPrefs) {
  localStorage.setItem(STORY_PREFS_KEY, JSON.stringify(prefs))
}

const EMOJI_SIZES = { small: 'text-2xl', medium: 'text-4xl', large: 'text-5xl', xlarge: 'text-7xl' }
const TEXT_SIZES = { small: 'text-xs', medium: 'text-sm', large: 'text-base', xlarge: 'text-lg' }
const CARD_BG = {
  default: 'glass',
  warm: 'bg-orange-500/5 border border-orange-500/10',
  cool: 'bg-blue-500/5 border border-blue-500/10',
  nature: 'bg-emerald-500/5 border border-emerald-500/10',
  calm: 'bg-violet-500/5 border border-violet-500/10',
  'high-contrast': 'bg-white dark:bg-zinc-900 border-2 border-foreground/20',
}
const BORDER_STYLES = { none: '', subtle: 'border border-border/20', bold: 'border-2 border-border/50' }

/* ------------------------------------------------------------------ */
/*  Story Preferences Panel                                            */
/* ------------------------------------------------------------------ */

function StoryPrefsPanel({ prefs, onChange }: { prefs: StoryDisplayPrefs; onChange: (p: StoryDisplayPrefs) => void }) {
  function update(patch: Partial<StoryDisplayPrefs>) {
    const updated = { ...prefs, ...patch }
    onChange(updated)
    saveStoryPrefs(updated)
  }

  function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between py-2.5">
        <span className="text-xs font-medium">{label}</span>
        <div className="flex items-center gap-1">{children}</div>
      </div>
    )
  }

  function SizeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
      <button onClick={onClick} className={cn('px-2 py-1 rounded-lg text-[10px] font-medium transition-all',
        active ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:text-foreground')}>{label}</button>
    )
  }

  function Toggle({ checked, onChange: onToggle }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button role="switch" aria-checked={checked} onClick={() => onToggle(!checked)}
        className={cn('relative w-9 h-5 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-muted')}>
        <span className={cn('block w-4 h-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-[2px]')} />
      </button>
    )
  }

  return (
    <div className="p-4 space-y-1 divide-y divide-border/20">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-2 flex items-center gap-1.5">
        <Palette className="w-3.5 h-3.5" /> Appearance
      </h3>

      <OptionRow label="Emoji size">
        {(['small', 'medium', 'large', 'xlarge'] as const).map(s => (
          <SizeButton key={s} active={prefs.emojiSize === s} label={s === 'xlarge' ? 'XL' : s[0].toUpperCase() + s.slice(1)} onClick={() => update({ emojiSize: s })} />
        ))}
      </OptionRow>

      <OptionRow label="Text size">
        {(['small', 'medium', 'large', 'xlarge'] as const).map(s => (
          <SizeButton key={s} active={prefs.textSize === s} label={s === 'xlarge' ? 'XL' : s[0].toUpperCase() + s.slice(1)} onClick={() => update({ textSize: s })} />
        ))}
      </OptionRow>

      <OptionRow label="Card theme">
        {(Object.keys(CARD_BG) as Array<keyof typeof CARD_BG>).map(k => (
          <SizeButton key={k} active={prefs.cardBackground === k} label={k === 'high-contrast' ? 'Hi-Con' : k[0].toUpperCase() + k.slice(1)} onClick={() => update({ cardBackground: k })} />
        ))}
      </OptionRow>

      <OptionRow label="Border">
        {(['none', 'subtle', 'bold'] as const).map(b => (
          <SizeButton key={b} active={prefs.borderStyle === b} label={b[0].toUpperCase() + b.slice(1)} onClick={() => update({ borderStyle: b })} />
        ))}
      </OptionRow>

      <OptionRow label="Layout">
        {(['card', 'compact', 'fullscreen'] as const).map(l => (
          <SizeButton key={l} active={prefs.layout === l} label={l[0].toUpperCase() + l.slice(1)} onClick={() => update({ layout: l })} />
        ))}
      </OptionRow>

      <OptionRow label="Animations">
        <Toggle checked={prefs.animationsEnabled} onChange={v => update({ animationsEnabled: v })} />
      </OptionRow>

      <OptionRow label="High contrast">
        <Toggle checked={prefs.highContrast} onChange={v => update({ highContrast: v })} />
      </OptionRow>

      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 flex items-center gap-1.5 pt-3">
        <Type className="w-3.5 h-3.5" /> Content
      </h3>

      <OptionRow label="Show tips">
        <Toggle checked={prefs.showTips} onChange={v => update({ showTips: v })} />
      </OptionRow>

      <OptionRow label="Show progress bar">
        <Toggle checked={prefs.showProgressBar} onChange={v => update({ showProgressBar: v })} />
      </OptionRow>

      <OptionRow label="Show step numbers">
        <Toggle checked={prefs.showStepNumbers} onChange={v => update({ showStepNumbers: v })} />
      </OptionRow>

      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 flex items-center gap-1.5 pt-3">
        <Play className="w-3.5 h-3.5" /> Playback
      </h3>

      <OptionRow label="Auto-read steps aloud">
        <Toggle checked={prefs.autoRead} onChange={v => update({ autoRead: v })} />
      </OptionRow>

      <OptionRow label="Reading speed">
        <div className="flex items-center gap-2">
          <input type="range" min={0.5} max={1.5} step={0.1} value={prefs.readingSpeed}
            onChange={e => update({ readingSpeed: parseFloat(e.target.value) })}
            className="w-20 h-1 rounded-full accent-primary" />
          <span className="text-[10px] text-muted-foreground w-6 text-right">{prefs.readingSpeed}x</span>
        </div>
      </OptionRow>

      <OptionRow label="Auto-advance steps">
        <Toggle checked={prefs.autoAdvance} onChange={v => update({ autoAdvance: v })} />
      </OptionRow>

      {prefs.autoAdvance && (
        <OptionRow label="Seconds per step">
          <div className="flex items-center gap-2">
            <input type="range" min={3} max={15} step={1} value={prefs.autoAdvanceDelay}
              onChange={e => update({ autoAdvanceDelay: parseInt(e.target.value) })}
              className="w-20 h-1 rounded-full accent-primary" />
            <span className="text-[10px] text-muted-foreground w-6 text-right">{prefs.autoAdvanceDelay}s</span>
          </div>
        </OptionRow>
      )}

      {/* Reset */}
      <div className="pt-3">
        <button onClick={() => { onChange(DEFAULT_STORY_PREFS); saveStoryPrefs(DEFAULT_STORY_PREFS); toast.success('Reset to defaults') }}
          className="w-full py-2 rounded-xl glass text-xs text-muted-foreground hover:text-foreground transition-colors">
          Reset to defaults
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Emoji picker data (for custom story builder)                       */
/* ------------------------------------------------------------------ */

const EMOJI_OPTIONS = [
  '😊','😢','😠','😰','😴','😷','🤔','😬','😌','🤩','😤','😵','😔','😣','🥳',
  '👋','👍','👎','✅','❌','🚫','🙋','🙏','💪','🤗','🙅','✋','👂','🗣️','👤','👥',
  '❤️','💔','⭐','🎉','🔥','💡','🆘','🚨','⏳','⏰','🔄','📱','📞','🏠','🏫','🏥',
  '🍽️','💊','🛁','🛏️','👕','🪑','🎮','📚','🎵','🐾','🌳','🚌','✈️','🛒','🎈','🧸',
]

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface SocialStoryToolProps {
  open: boolean
  onClose: () => void
}

/* ------------------------------------------------------------------ */
/*  Custom Story Editor                                                */
/* ------------------------------------------------------------------ */

function StoryEditor({ initial, onSave, onCancel }: {
  initial?: CustomStoryData
  onSave: (story: CustomStoryData) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [category, setCategory] = useState<StoryCategory>(initial?.category || 'custom')
  const [steps, setSteps] = useState<StoryStep[]>(initial?.steps || [{ emoji: '😊', text: '' }])
  const [emojiPickerStep, setEmojiPickerStep] = useState<number | null>(null)

  function addStep() {
    setSteps(prev => [...prev, { emoji: '😊', text: '' }])
  }

  function removeStep(i: number) {
    if (steps.length <= 1) return
    setSteps(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateStep(i: number, field: keyof StoryStep, value: string) {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function handleSave() {
    if (!title.trim()) { toast.error('Please add a title'); return }
    if (steps.some(s => !s.text.trim())) { toast.error('Please fill in all steps'); return }
    onSave({
      id: initial?.id || `custom-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || title.trim(),
      category,
      steps: steps.map(s => ({ emoji: s.emoji, text: s.text.trim(), tip: s.tip?.trim() || undefined })),
    })
  }

  return (
    <div className="p-4 space-y-4">
      {/* Title */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Story title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Going to Grandma's House" maxLength={80}
          className="w-full px-3 py-2 rounded-xl bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Short description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What this story is about" maxLength={120}
          className="w-full px-3 py-2 rounded-xl bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <button key={key} onClick={() => setCategory(key as StoryCategory)}
              className={cn('px-2 py-1 rounded-lg text-[11px] font-medium transition-all', category === key ? 'bg-primary text-primary-foreground' : config.color)}>
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Steps ({steps.length})</label>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start glass rounded-xl p-2.5 animate-fade-in">
              <div className="relative">
                <button onClick={() => setEmojiPickerStep(emojiPickerStep === i ? null : i)}
                  className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center text-xl hover:bg-muted/50 transition-colors shrink-0">
                  {step.emoji}
                </button>
                {emojiPickerStep === i && (
                  <div className="absolute top-12 left-0 z-10 glass-heavy rounded-xl p-2 w-64 grid grid-cols-8 gap-1 animate-scale-in shadow-lg">
                    {EMOJI_OPTIONS.map(e => (
                      <button key={e} onClick={() => { updateStep(i, 'emoji', e); setEmojiPickerStep(null) }}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted/50 text-sm">{e}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <input value={step.text} onChange={e => updateStep(i, 'text', e.target.value)} placeholder={`Step ${i + 1}: What happens?`}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-muted/20 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                <input value={step.tip || ''} onChange={e => updateStep(i, 'tip', e.target.value)} placeholder="Tip (optional)"
                  className="w-full px-2.5 py-1 rounded-lg bg-muted/10 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20" />
              </div>
              <button onClick={() => removeStep(i)} disabled={steps.length <= 1}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addStep} className="mt-2 w-full py-2 rounded-xl glass text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add step
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl glass text-sm font-medium hover:bg-muted/40 transition-all">Cancel</button>
        <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-sm hover:brightness-110 transition-all">
          {initial ? 'Save Changes' : 'Create Story'}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function SocialStoryTool({ open, onClose }: SocialStoryToolProps) {
  const [selectedStory, setSelectedStory] = useState<SocialStory | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [customStories, setCustomStories] = useState<CustomStoryData[]>([])
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null)
  const [editingStory, setEditingStory] = useState<CustomStoryData | undefined>(undefined)
  const [showPrefs, setShowPrefs] = useState(false)
  const [prefs, setPrefs] = useState<StoryDisplayPrefs>(loadStoryPrefs)

  // Load custom stories on mount
  useEffect(() => { setCustomStories(loadCustomStories()) }, [])

  // Auto-advance timer
  useEffect(() => {
    if (!prefs.autoAdvance || !selectedStory) return
    if (currentStep >= selectedStory.steps.length - 1) return
    const timer = setTimeout(() => nextStep(), prefs.autoAdvanceDelay * 1000)
    return () => clearTimeout(timer)
  }, [prefs.autoAdvance, prefs.autoAdvanceDelay, currentStep, selectedStory])

  // Auto-read step aloud
  useEffect(() => {
    if (!prefs.autoRead || !selectedStory) return
    const utterance = new SpeechSynthesisUtterance(selectedStory.steps[currentStep].text)
    utterance.rate = prefs.readingSpeed
    window.speechSynthesis?.cancel()
    window.speechSynthesis?.speak(utterance)
  }, [prefs.autoRead, prefs.readingSpeed, currentStep, selectedStory])

  // Merge built-in + custom
  const allStories = useMemo(() => {
    const customs: SocialStory[] = customStories.map(s => ({
      ...s,
      icon: <Edit3 className="w-5 h-5" />,
      isCustom: true,
    }))
    return [...BUILT_IN_STORIES, ...customs]
  }, [customStories])

  const filteredStories = useMemo(() => {
    let stories = allStories
    if (filterCategory) stories = stories.filter(s => s.category === filterCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      stories = stories.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    }
    return stories
  }, [allStories, filterCategory, searchQuery])

  const openStory = useCallback((story: SocialStory) => {
    setSelectedStory(story)
    setCurrentStep(0)
  }, [])

  function closeStory() { setSelectedStory(null); setCurrentStep(0) }

  function nextStep() {
    if (selectedStory && currentStep < selectedStory.steps.length - 1) setCurrentStep(prev => prev + 1)
  }
  function prevStep() {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  function speakWithPrefs(text: string) {
    if (!('speechSynthesis' in window) || !text.trim()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = prefs.readingSpeed
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }
  function speakStep() {
    if (!selectedStory) return
    speakWithPrefs(selectedStory.steps[currentStep].text)
  }
  function speakAll() {
    if (!selectedStory) return
    speakWithPrefs(selectedStory.steps.map(s => s.text).join('. '))
  }

  function handleSaveCustom(story: CustomStoryData) {
    const updated = editingStory
      ? customStories.map(s => s.id === story.id ? story : s)
      : [...customStories, story]
    setCustomStories(updated)
    saveCustomStories(updated)
    setEditorMode(null)
    setEditingStory(undefined)
    toast.success(editingStory ? 'Story updated!' : 'Story created!')
  }

  function handleDeleteCustom(id: string) {
    const updated = customStories.filter(s => s.id !== id)
    setCustomStories(updated)
    saveCustomStories(updated)
    setSelectedStory(null)
    toast.success('Story deleted')
  }

  function handleDuplicateAsCustom(story: SocialStory) {
    setEditingStory({
      id: `custom-${Date.now()}`,
      title: `${story.title} (my version)`,
      description: story.description,
      category: story.category,
      steps: story.steps.map(s => ({ ...s })),
    })
    setEditorMode('create')
  }

  function handleEditCustom(story: SocialStory) {
    const data = customStories.find(s => s.id === story.id)
    if (!data) return
    setEditingStory(data)
    setEditorMode('edit')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-heavy rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            {(selectedStory || editorMode || showPrefs) ? (
              <button onClick={() => { closeStory(); setEditorMode(null); setEditingStory(undefined); setShowPrefs(false) }} className="p-1 rounded-lg hover:bg-muted/50">
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <BookOpen className="w-5 h-5 text-primary" />
            )}
            <h2 className="font-semibold text-sm">
              {showPrefs ? 'Display Settings' : editorMode === 'create' ? 'Create Story' : editorMode === 'edit' ? 'Edit Story' : selectedStory ? selectedStory.title : 'Social Stories'}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowPrefs(!showPrefs)}
              className={cn('p-1.5 rounded-lg hover:bg-muted/50 transition-colors', showPrefs && 'bg-primary/10 text-primary')}
              title="Display settings">
              <Settings2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showPrefs ? (
            /* ─── Display preferences ─── */
            <StoryPrefsPanel prefs={prefs} onChange={setPrefs} />
          ) : editorMode ? (
            /* ─── Story editor ─── */
            <StoryEditor
              initial={editingStory}
              onSave={handleSaveCustom}
              onCancel={() => { setEditorMode(null); setEditingStory(undefined) }}
            />
          ) : !selectedStory ? (
            /* ─── Story browser ─── */
            <div className="p-4 space-y-4">
              {/* Search + create button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search stories..."
                    className="w-full pl-10 pr-4 py-2 bg-muted/30 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
                <button onClick={() => { setEditingStory(undefined); setEditorMode('create') }}
                  className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all shrink-0">
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>

              {/* Category filters */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                <button onClick={() => setFilterCategory(null)}
                  className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                    !filterCategory ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground hover:text-foreground')}>
                  All ({allStories.length})
                </button>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const count = allStories.filter(s => s.category === key).length
                  if (count === 0) return null
                  return (
                    <button key={key} onClick={() => setFilterCategory(filterCategory === key ? null : key)}
                      className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                        filterCategory === key ? 'bg-primary text-primary-foreground' : config.color)}>
                      {config.label} ({count})
                    </button>
                  )
                })}
              </div>

              {/* Story cards */}
              <div className="space-y-2">
                {filteredStories.map((story, i) => {
                  const catConfig = CATEGORY_CONFIG[story.category]
                  return (
                    <button key={story.id} onClick={() => openStory(story)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:glow-sm transition-all text-left animate-fade-in"
                      style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}>
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', catConfig.color)}>
                        {story.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{story.title}</span>
                          {story.isCustom && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">Custom</span>}
                        </div>
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
              {prefs.showProgressBar && (
                <div className="flex gap-1">
                  {selectedStory.steps.map((_, i) => (
                    <button key={i} onClick={() => setCurrentStep(i)}
                      className={cn('flex-1 h-1.5 rounded-full transition-all',
                        i <= currentStep ? 'bg-primary' : 'bg-muted/40',
                        i === currentStep && 'glow-sm')} />
                  ))}
                </div>
              )}

              {/* Step card — uses display prefs */}
              <div className={cn(
                'rounded-2xl text-center space-y-4 flex flex-col items-center justify-center',
                CARD_BG[prefs.cardBackground],
                BORDER_STYLES[prefs.borderStyle],
                prefs.layout === 'compact' ? 'p-4 min-h-[140px]' : prefs.layout === 'fullscreen' ? 'p-8 min-h-[300px]' : 'p-6 min-h-[200px]',
                prefs.animationsEnabled && 'animate-fade-in',
                prefs.highContrast && 'border-2 border-foreground/30',
              )} key={currentStep}>
                <span className={cn(EMOJI_SIZES[prefs.emojiSize])} role="img">{selectedStory.steps[currentStep].emoji}</span>
                <p className={cn('leading-relaxed font-medium max-w-xs', TEXT_SIZES[prefs.textSize], prefs.highContrast && 'font-bold')}>
                  {selectedStory.steps[currentStep].text}
                </p>
                {prefs.showTips && selectedStory.steps[currentStep].tip && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10 max-w-xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <p className={cn('text-muted-foreground leading-relaxed text-left', prefs.textSize === 'xlarge' ? 'text-sm' : 'text-[11px]')}>
                      {selectedStory.steps[currentStep].tip}
                    </p>
                  </div>
                )}
              </div>

              {/* Step counter */}
              {prefs.showStepNumbers && (
                <p className={cn('text-center text-muted-foreground', prefs.textSize === 'xlarge' ? 'text-sm' : 'text-[11px]')}>
                  Step {currentStep + 1} of {selectedStory.steps.length}
                  {prefs.autoAdvance && <span className="ml-1 text-primary/60">(auto-advancing in {prefs.autoAdvanceDelay}s)</span>}
                </p>
              )}

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button onClick={prevStep} disabled={currentStep === 0}
                  className="flex-1 py-3 rounded-xl glass text-sm font-medium disabled:opacity-30 hover:bg-muted/40 active:scale-[0.98] transition-all">
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button onClick={speakStep} className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:bg-blue-500/10 hover:text-blue-400 active:scale-95 transition-all" title="Read aloud">
                  <Volume2 className="w-5 h-5" />
                </button>
                {currentStep < selectedStory.steps.length - 1 ? (
                  <button onClick={nextStep}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-sm hover:brightness-110 active:scale-[0.98] transition-all">
                    Next <ChevronRight className="w-4 h-4 inline ml-1" />
                  </button>
                ) : (
                  <button onClick={closeStory}
                    className="flex-1 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 active:scale-[0.98] transition-all">
                    Done!
                  </button>
                )}
              </div>

              {/* Bottom actions */}
              <div className="flex gap-2">
                <button onClick={speakAll} className="flex-1 py-2 rounded-xl glass text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Volume2 className="w-3 h-3 inline mr-1" /> Read all aloud
                </button>
                <button onClick={() => handleDuplicateAsCustom(selectedStory)} className="flex-1 py-2 rounded-xl glass text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="w-3 h-3 inline mr-1" /> Make my own version
                </button>
              </div>

              {/* Custom story actions */}
              {selectedStory.isCustom && (
                <div className="flex gap-2 pt-2 border-t border-border/20">
                  <button onClick={() => handleEditCustom(selectedStory)} className="flex-1 py-2 rounded-xl glass text-xs text-primary hover:bg-primary/10 transition-colors">
                    <Edit3 className="w-3 h-3 inline mr-1" /> Edit
                  </button>
                  <button onClick={() => handleDeleteCustom(selectedStory.id)} className="flex-1 py-2 rounded-xl glass text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3 h-3 inline mr-1" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
