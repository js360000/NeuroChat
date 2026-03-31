import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'data', 'neurochat.db')

// Ensure data directory exists
import fs from 'fs'
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)

// WAL mode for better concurrency
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ═══════════════════════════════════════════
// Schema
// ═══════════════════════════════════════════

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pronouns TEXT,
    bio TEXT,
    location TEXT,
    comm_style TEXT,
    interests TEXT DEFAULT '[]',
    avatar TEXT,
    is_online INTEGER DEFAULT 0,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    verified INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user1_id TEXT NOT NULL REFERENCES users(id),
    user2_id TEXT NOT NULL REFERENCES users(id),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    sender_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    tone_tag TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    tone_tag TEXT,
    content_warning TEXT,
    tags TEXT DEFAULT '[]',
    pinned INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS post_reactions (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES community_posts(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK(type IN ('heart','solidarity','lightbulb','sparkle','hug')),
    UNIQUE(post_id, user_id, type)
  );

  CREATE TABLE IF NOT EXISTS preferences (
    user_id TEXT NOT NULL REFERENCES users(id),
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY(user_id, key)
  );

  -- ═══════ Admin / Moderation ═══════

  CREATE TABLE IF NOT EXISTS site_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK(type IN ('temporary','permanent','automatic')),
    reason TEXT,
    issued_by TEXT NOT NULL DEFAULT 'system',
    issued_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS keyword_flags (
    id TEXT PRIMARY KEY,
    keyword TEXT NOT NULL UNIQUE,
    severity TEXT NOT NULL DEFAULT 'warn' CHECK(severity IN ('warn','mute','ban')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS keyword_violations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    keyword_id TEXT NOT NULL REFERENCES keyword_flags(id),
    content_snippet TEXT,
    source TEXT NOT NULL DEFAULT 'message' CHECK(source IN ('message','post')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    target_user_id TEXT,
    admin_user_id TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════ Calls ═══════

  CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    caller_id TEXT NOT NULL REFERENCES users(id),
    callee_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK(type IN ('voice','video')),
    status TEXT NOT NULL DEFAULT 'ringing' CHECK(status IN ('ringing','connecting','connected','ended','missed','declined')),
    started_at TEXT,
    ended_at TEXT,
    duration_seconds INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_calls_users ON calls(caller_id, callee_id, created_at DESC);

  -- ═══════ Energy Tracking ═══════

  CREATE TABLE IF NOT EXISTS energy_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    social INTEGER NOT NULL DEFAULT 50,
    sensory INTEGER NOT NULL DEFAULT 50,
    cognitive INTEGER NOT NULL DEFAULT 50,
    physical INTEGER NOT NULL DEFAULT 50,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_energy_user ON energy_logs(user_id, created_at DESC);

  -- ═══════ Together Rooms (Parallel Play) ═══════

  CREATE TABLE IF NOT EXISTS together_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    activity TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    max_participants INTEGER DEFAULT 6,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS room_participants (
    room_id TEXT NOT NULL REFERENCES together_rooms(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'present' CHECK(status IN ('present','away','focused','resting')),
    activity TEXT,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY(room_id, user_id)
  );

  -- ═══════ Venue Sensory Reviews ═══════

  CREATE TABLE IF NOT EXISTS venues (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    category TEXT,
    latitude REAL,
    longitude REAL,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS venue_reviews (
    id TEXT PRIMARY KEY,
    venue_id TEXT NOT NULL REFERENCES venues(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    noise INTEGER CHECK(noise BETWEEN 1 AND 5),
    lighting INTEGER CHECK(lighting BETWEEN 1 AND 5),
    crowding INTEGER CHECK(crowding BETWEEN 1 AND 5),
    scents INTEGER CHECK(scents BETWEEN 1 AND 5),
    predictability INTEGER CHECK(predictability BETWEEN 1 AND 5),
    notes TEXT,
    time_of_visit TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(venue_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_venue_reviews ON venue_reviews(venue_id);

  -- ═══════ Trusted Supporters (Safeguarding) ═══════

  CREATE TABLE IF NOT EXISTS trusted_supporters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    supporter_id TEXT NOT NULL REFERENCES users(id),
    safeguarding_level TEXT DEFAULT 'guided' CHECK(safeguarding_level IN ('independent','guided','supported','protected')),
    can_view_messages INTEGER DEFAULT 0,
    can_approve_contacts INTEGER DEFAULT 0,
    can_view_activity INTEGER DEFAULT 0,
    approved_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, supporter_id)
  );

  -- ═══════ Manipulation Detection Alerts ═══════

  CREATE TABLE IF NOT EXISTS safety_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    conversation_id TEXT REFERENCES conversations(id),
    alert_type TEXT NOT NULL CHECK(alert_type IN ('love_bombing','isolation','urgency','financial','authority','velocity','grooming')),
    severity TEXT DEFAULT 'warning' CHECK(severity IN ('info','warning','critical')),
    description TEXT,
    message_ids TEXT DEFAULT '[]',
    acknowledged INTEGER DEFAULT 0,
    notified_supporter INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_safety_alerts ON safety_alerts(user_id, created_at DESC);

  -- ═══════ Masking Tracker ═══════

  CREATE TABLE IF NOT EXISTS masking_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    masking_level INTEGER CHECK(masking_level BETWEEN 0 AND 10),
    context TEXT,
    recovery_activity TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_masking_user ON masking_logs(user_id, created_at DESC);

  -- ═══════ AAC Phrase Banks ═══════

  CREATE TABLE IF NOT EXISTS aac_phrase_banks (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    category TEXT NOT NULL,
    phrase TEXT NOT NULL,
    symbol_key TEXT,
    is_default INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_aac_phrases ON aac_phrase_banks(user_id, category);

  -- ═══════ Respond-Later Queue ═══════

  CREATE TABLE IF NOT EXISTS respond_later (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    message_id TEXT NOT NULL REFERENCES messages(id),
    note TEXT,
    completed INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_respond_later ON respond_later(user_id, completed);

  -- Add role + ban_status to users if not exists
  -- SQLite doesn't support ADD COLUMN IF NOT EXISTS, so use a try-catch approach via pragma
  -- We'll handle missing columns gracefully in code

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_reactions_post ON post_reactions(post_id);
  CREATE INDEX IF NOT EXISTS idx_bans_user ON bans(user_id, active);
  CREATE INDEX IF NOT EXISTS idx_violations_user ON keyword_violations(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
`)

// Safe column migrations (ALTER TABLE ADD COLUMN is no-op if column exists in SQLite >= 3.35)
try { db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`) } catch { /* already exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN ban_status TEXT DEFAULT NULL`) } catch { /* already exists */ }

// Onboarding & extended profile columns
try { db.exec(`ALTER TABLE users ADD COLUMN date_of_birth TEXT`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN gender TEXT`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN neurotype TEXT DEFAULT '[]'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN triggers TEXT DEFAULT '[]'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN accommodations TEXT DEFAULT '[]'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN connection_goals TEXT DEFAULT '[]'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN sensory_profile TEXT DEFAULT '{}'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN communication_prefs TEXT DEFAULT '{}'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN experience_prefs TEXT DEFAULT '{}'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN safety_checklist TEXT DEFAULT '{}'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN onboarding_completed INTEGER DEFAULT 0`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN onboarding_completed_at TEXT`) } catch { /* exists */ }

// AAC & advanced feature columns
try { db.exec(`ALTER TABLE users ADD COLUMN aac_mode TEXT DEFAULT 'off'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN aac_level TEXT DEFAULT 'hybrid'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN energy_status TEXT DEFAULT '{"social":50,"sensory":50,"cognitive":50,"physical":50}'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN energy_visible INTEGER DEFAULT 1`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN auto_responder TEXT DEFAULT '{}'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN async_prefs TEXT DEFAULT '{"readReceipts":false,"typingIndicator":false,"maxMessagesPerHour":0,"draftAndHold":false}'`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN masking_tracking INTEGER DEFAULT 0`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN recovery_mode INTEGER DEFAULT 0`) } catch { /* exists */ }
db.exec(`
  CREATE TABLE IF NOT EXISTS user_blocks (
    id TEXT PRIMARY KEY,
    blocker_id TEXT NOT NULL REFERENCES users(id),
    blocked_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(blocker_id, blocked_id)
  );

  CREATE TABLE IF NOT EXISTS user_reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users(id),
    reported_id TEXT NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

try { db.exec(`ALTER TABLE community_posts ADD COLUMN parent_id TEXT REFERENCES community_posts(id)`) } catch { /* exists */ }

try { db.exec(`ALTER TABLE users ADD COLUMN email TEXT UNIQUE`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN phone_number TEXT`) } catch { /* exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN phone_hash TEXT`) } catch { /* exists */ }
try { db.exec(`CREATE UNIQUE INDEX idx_users_phone_hash ON users(phone_hash) WHERE phone_hash IS NOT NULL`) } catch { /* exists */ }

// Seed default site config if empty
const configCount = (db.prepare('SELECT COUNT(*) as c FROM site_config').get() as any).c
if (configCount === 0) {
  const insertConfig = db.prepare('INSERT OR IGNORE INTO site_config (key, value) VALUES (?, ?)')
  const defaults: [string, string][] = [
    ['ai.provider', '"heuristic"'],
    ['ai.openai_api_key', '""'],
    ['ai.model', '"gpt-5.4-mini"'],
    ['ai.enabled', 'true'],
    ['moderation.auto_ban_enabled', 'true'],
    ['moderation.auto_ban_threshold', '5'],
    ['moderation.auto_ban_window_hours', '24'],
    ['moderation.auto_ban_duration_hours', '48'],
    ['site.name', '"NeuroChat"'],
    ['site.tagline', '"A calmer way to connect"'],
    ['site.maintenance_mode', 'false'],
    ['site.registration_open', 'true'],
  ]
  const seedConfig = db.transaction(() => { for (const [k, v] of defaults) insertConfig.run(k, v) })
  seedConfig()
}

export default db
