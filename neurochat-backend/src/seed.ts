import db from './db.js'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'

const DEFAULT_HASH = bcrypt.hashSync('password123', 10)

// ═══════════════════════════════════════════
// Clear existing data
// ═══════════════════════════════════════════
db.exec(`
  DELETE FROM post_reactions;
  DELETE FROM community_posts;
  DELETE FROM messages;
  DELETE FROM conversations;
  DELETE FROM preferences;
  DELETE FROM users;
`)

// ═══════════════════════════════════════════
// Users
// ═══════════════════════════════════════════

const insertUser = db.prepare(`
  INSERT INTO users (id, name, pronouns, bio, location, comm_style, interests, is_online, joined_at, verified, email, password_hash)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const users = [
  { id: 'me', name: 'Alex Morgan', pronouns: 'they/them', bio: "Neurodivergent and proud. Love deep conversations about space, music, and why cats are better than dogs. /gen", location: 'London, UK', commStyle: 'gentle', interests: ['Music','Coding','Space','Gaming','Pets'], isOnline: 1, joinedAt: '2025-09-15T00:00:00Z', verified: 1, email: 'alex@neurochat.dev' },
  { id: 'u1', name: 'Jordan Lee', pronouns: 'they/them', bio: 'Autistic creative who loves deep dives into music theory and pixel art.', location: 'Manchester, UK', commStyle: 'direct', interests: ['Music','Art','Gaming','Coding'], isOnline: 1, joinedAt: '2025-10-01T00:00:00Z', verified: 1, email: 'jordan@neurochat.dev' },
  { id: 'u2', name: 'Sam Rivera', pronouns: 'she/her', bio: 'ADHD brain with too many hobbies. Currently hyperfixating on astrophotography.', location: 'Brighton, UK', commStyle: 'playful', interests: ['Space','Photography','Science','Pets'], isOnline: 1, joinedAt: '2025-08-20T00:00:00Z', verified: 1, email: 'sam@neurochat.dev' },
  { id: 'u3', name: 'Kai Chen', pronouns: 'he/him', bio: 'Quiet introvert who writes code by day and fantasy novels by night.', location: 'Edinburgh, UK', commStyle: 'gentle', interests: ['Coding','Writing','Reading','Nature'], isOnline: 0, joinedAt: '2025-11-05T00:00:00Z', verified: 0, email: 'kai@neurochat.dev' },
  { id: 'u4', name: 'Riley Brooks', pronouns: 'they/she', bio: 'Neurodivergent advocate. Big fan of cosy games and tea ceremonies.', location: 'Bristol, UK', commStyle: 'emotional', interests: ['Gaming','Cooking','Psychology','Crafts'], isOnline: 0, joinedAt: '2025-12-10T00:00:00Z', verified: 1, email: 'riley@neurochat.dev' },
  { id: 'u5', name: 'Mika Tanaka', pronouns: 'she/they', bio: 'Disabled artist making accessible zines. Lover of film scores and rainy days.', location: 'Glasgow, UK', commStyle: 'gentle', interests: ['Art','Film','Music','Writing'], isOnline: 1, joinedAt: '2025-07-22T00:00:00Z', verified: 1, email: 'mika@neurochat.dev' },
  { id: 'u6', name: 'Dex Okafor', pronouns: 'he/they', bio: 'Queer Black nerd. Building community through tabletop RPGs and mutual aid.', location: 'Birmingham, UK', commStyle: 'playful', interests: ['Gaming','Psychology','Cooking','Reading'], isOnline: 1, joinedAt: '2025-06-18T00:00:00Z', verified: 1, email: 'dex@neurochat.dev' },
]

const insertUsers = db.transaction(() => {
  for (const u of users) {
    insertUser.run(u.id, u.name, u.pronouns, u.bio, u.location, u.commStyle, JSON.stringify(u.interests), u.isOnline, u.joinedAt, u.verified, u.email, DEFAULT_HASH)
  }
})
insertUsers()

// Set the current user as admin
try { db.exec(`UPDATE users SET role = 'admin' WHERE id = 'me'`) } catch { /* role column may not exist yet on first run */ }

console.log(`Seeded ${users.length} users`)

// ═══════════════════════════════════════════
// Conversations & Messages
// ═══════════════════════════════════════════

const insertConv = db.prepare(`INSERT INTO conversations (id, user1_id, user2_id, updated_at) VALUES (?, ?, ?, ?)`)
const insertMsg = db.prepare(`INSERT INTO messages (id, conversation_id, sender_id, content, tone_tag, created_at) VALUES (?, ?, ?, ?, ?, ?)`)

function mins(n: number) { return new Date(Date.now() - n * 60000).toISOString() }
function hours(n: number) { return new Date(Date.now() - n * 3600000).toISOString() }
function days(n: number) { return new Date(Date.now() - n * 86400000).toISOString() }

const conversations = [
  { id: 'conv1', partner: 'u1', updated: mins(3), messages: [
    { sender: 'u1', content: "Hey! How's your day going?", tone: null, at: mins(120) },
    { sender: 'me', content: "Pretty good! Been working on some music all morning", tone: null, at: mins(115) },
    { sender: 'u1', content: "Oh nice! What genre?", tone: null, at: mins(110) },
    { sender: 'me', content: "Ambient electronic stuff, kind of like Boards of Canada vibes", tone: '/gen', at: mins(105) },
    { sender: 'u1', content: "That sounds so cool, I'd love to hear it when it's ready /gen", tone: '/gen', at: mins(100) },
    { sender: 'me', content: "Absolutely! I'll send you a preview", tone: null, at: mins(95) },
    { sender: 'u1', content: "Have you heard the new Hozier album? It's incredible /gen", tone: '/gen', at: mins(3) },
  ]},
  { id: 'conv2', partner: 'u2', updated: mins(45), messages: [
    { sender: 'u2', content: "The sky was SO clear last night!", tone: null, at: hours(2) },
    { sender: 'me', content: "I'm so jealous, it was cloudy here", tone: null, at: hours(1.5) },
    { sender: 'u2', content: "Just got the most amazing shot of the Pleiades!", tone: null, at: mins(45) },
  ]},
  { id: 'conv3', partner: 'u3', updated: hours(3), messages: [
    { sender: 'u3', content: "Quick question — do you use Zod or Yup for validation?", tone: null, at: hours(5) },
    { sender: 'me', content: "Zod all the way — it's TypeScript-native so the DX is way better /info", tone: '/info', at: hours(4.5) },
    { sender: 'u3', content: "Thanks for the TypeScript tips, that really helped", tone: '/gen', at: hours(3) },
  ]},
  { id: 'conv4', partner: 'u5', updated: hours(6), messages: [
    { sender: 'u5', content: "I've been working on a new zine about accessible design!", tone: null, at: hours(8) },
    { sender: 'me', content: "That sounds amazing! What kind of content?", tone: null, at: hours(7) },
    { sender: 'u5', content: "Would you be interested in collaborating on my zine?", tone: null, at: hours(6) },
  ]},
  { id: 'conv5', partner: 'u6', updated: days(1), messages: [
    { sender: 'u6', content: "Session was amazing last night, your character's arc is *chef's kiss* /j", tone: '/j', at: days(1) },
  ]},
]

const seedConvos = db.transaction(() => {
  for (const c of conversations) {
    insertConv.run(c.id, 'me', c.partner, c.updated)
    for (const m of c.messages) {
      insertMsg.run(uuid(), c.id, m.sender, m.content, m.tone, m.at)
    }
  }
})
seedConvos()
console.log(`Seeded ${conversations.length} conversations with messages`)

// ═══════════════════════════════════════════
// Community Posts
// ═══════════════════════════════════════════

const insertPost = db.prepare(`INSERT INTO community_posts (id, author_id, content, tone_tag, content_warning, tags, pinned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
const insertReaction = db.prepare(`INSERT INTO post_reactions (id, post_id, user_id, type) VALUES (?, ?, ?, ?)`)

interface PostSeed {
  id: string; author: string; content: string; tone?: string; cw?: string; tags: string[]; pinned?: boolean; at: string;
  reactions: { type: string; users: string[] }[];
}

const posts: PostSeed[] = [
  {
    id: 'p1', author: 'u5', at: mins(15), pinned: true,
    content: "Just published my new zine about accessible design patterns! It covers colour contrast, screen reader compatibility, and why we should all be thinking about neurodivergent-friendly interfaces.",
    tone: '/gen', tags: ['accessibility','design','zines'],
    reactions: [{ type: 'heart', users: ['me','u1','u2','u6'] }, { type: 'lightbulb', users: ['u3','u4'] }, { type: 'sparkle', users: ['u1','u2'] }],
  },
  {
    id: 'p2', author: 'u6', at: mins(42),
    content: "Hot take: tabletop RPGs are genuinely one of the best social skills training tools for neurodivergent people. You get to practice social interaction in a structured, low-stakes environment where everyone agrees on the rules. /srs",
    tone: '/srs', tags: ['gaming','neurodivergent','social'],
    reactions: [{ type: 'solidarity', users: ['me','u1','u3','u5'] }, { type: 'lightbulb', users: ['u2','u4'] }, { type: 'heart', users: ['u5'] }],
  },
  {
    id: 'p3', author: 'u2', at: hours(1.5),
    content: "Stayed up way too late photographing the sky again but look at this shot of the Orion Nebula! My ADHD hyperfixation is doing amazing things for my astrophotography portfolio /j",
    tone: '/j', tags: ['photography','space','adhd'],
    reactions: [{ type: 'sparkle', users: ['me','u1','u3','u4','u5','u6'] }, { type: 'heart', users: ['u1','u5'] }],
  },
  {
    id: 'p4', author: 'u1', at: hours(3),
    content: "Reminder that it's okay to have a quiet day. You don't owe anyone your energy. Rest is productive. /gen",
    tone: '/gen', tags: ['selfcare','boundaries'],
    reactions: [{ type: 'heart', users: ['me','u2','u3','u4','u5','u6'] }, { type: 'hug', users: ['u2','u3','u5'] }, { type: 'solidarity', users: ['u4','u6'] }],
  },
  {
    id: 'p5', author: 'u3', at: hours(5),
    content: "Working on a new open-source library for accessible form validation in React. If anyone wants to contribute or test it, DMs are open! Looking especially for screen reader users to help with a11y testing. /info",
    tone: '/info', tags: ['opensource','coding','accessibility'],
    reactions: [{ type: 'lightbulb', users: ['me','u1','u5'] }, { type: 'sparkle', users: ['u2','u6'] }, { type: 'solidarity', users: ['u4'] }],
  },
  {
    id: 'p6', author: 'u4', at: hours(7), cw: 'Mental health, burnout',
    content: "Had a rough week with burnout. But I'm learning that asking for help isn't weakness — it's a skill I'm still developing. Grateful for this community for being a safe space to say that. /gen",
    tone: '/gen', tags: ['mentalhealth','community'],
    reactions: [{ type: 'hug', users: ['me','u1','u2','u3','u5','u6'] }, { type: 'heart', users: ['me','u1','u2','u5','u6'] }, { type: 'solidarity', users: ['u1','u3','u5'] }],
  },
  {
    id: 'p7', author: 'u6', at: hours(10),
    content: "Started a mutual aid fund for neurodivergent creators who need assistive tech. We've already helped 3 people get noise-cancelling headphones and fidget tools. Every contribution matters!",
    tags: ['mutualaid','community','accessibility'],
    reactions: [{ type: 'heart', users: ['me','u1','u2','u3','u4','u5'] }, { type: 'solidarity', users: ['me','u1','u2','u3','u5'] }, { type: 'sparkle', users: ['u2','u4'] }],
  },
  {
    id: 'p8', author: 'u5', at: hours(14),
    content: "Gentle reminder that stimming is not something to be ashamed of. It's your body's way of self-regulating and it's beautiful. Flap those hands, rock that body, click that pen. You are valid. /gen",
    tone: '/gen', tags: ['neurodivergent','selfcare','stimming'],
    reactions: [{ type: 'heart', users: ['me','u1','u2','u3','u4','u6'] }, { type: 'hug', users: ['me','u1','u3','u4','u6'] }, { type: 'sparkle', users: ['u2','u4','u6'] }],
  },
  {
    id: 'p9', author: 'u1', at: days(1),
    content: "Just finished producing a 12-minute ambient track inspired by the sound of rain on windows. Sometimes the best music comes from listening to the world around you. /gen",
    tone: '/gen', tags: ['music','creative','ambient'],
    reactions: [{ type: 'sparkle', users: ['me','u2','u5'] }, { type: 'heart', users: ['u5','u6'] }],
  },
  {
    id: 'p10', author: 'u2', at: days(1.5),
    content: "PSA: if someone tells you they're autistic, the correct response is NOT 'you don't look autistic'. We don't have a look. We have a neurotype. /srs",
    tone: '/srs', tags: ['autism','awareness','education'],
    reactions: [{ type: 'solidarity', users: ['me','u1','u3','u4','u5','u6'] }, { type: 'heart', users: ['me','u1','u4','u5'] }, { type: 'lightbulb', users: ['u3','u6'] }],
  },
]

const seedPosts = db.transaction(() => {
  for (const p of posts) {
    insertPost.run(p.id, p.author, p.content, p.tone || null, p.cw || null, JSON.stringify(p.tags), p.pinned ? 1 : 0, p.at)
    for (const r of p.reactions) {
      for (const userId of r.users) {
        insertReaction.run(uuid(), p.id, userId, r.type)
      }
    }
  }
})
seedPosts()
console.log(`Seeded ${posts.length} community posts with reactions`)

console.log('Seed complete.')
