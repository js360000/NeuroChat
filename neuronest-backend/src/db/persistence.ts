import { Pool } from 'pg';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

export interface PersistenceDb {
  sitePages: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  socialSchedules: Array<{
    id: string;
    channel: string;
    title: string;
    caption?: string;
    description?: string;
    mediaUrl?: string;
    scheduledAt?: string;
    status: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  n8nWorkflowHooks: Array<{
    workflowId: string;
    webhookUrl: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  n8nWorkflowRuns: Array<{
    id: string;
    workflowId: string;
    webhookUrl: string;
    status: string;
    responseStatus?: number;
    error?: string;
    triggeredAt: Date;
    triggeredBy: string;
  }>;
  cookieConsents: Array<{
    id: string;
    analytics: boolean;
    marketing: boolean;
    userAgent: string;
    ip: string;
    createdAt: Date;
  }>;
}

type PersistentStore = {
  sitePages?: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    createdAt: string;
    updatedAt: string;
  }>;
  socialSchedules?: Array<{
    id: string;
    channel: string;
    title: string;
    caption?: string;
    description?: string;
    mediaUrl?: string;
    scheduledAt?: string;
    status: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }>;
  n8nWorkflowHooks?: Array<{
    workflowId: string;
    webhookUrl: string;
    createdAt: string;
    updatedAt: string;
  }>;
  n8nWorkflowRuns?: Array<{
    id: string;
    workflowId: string;
    webhookUrl: string;
    status: string;
    responseStatus?: number;
    error?: string;
    triggeredAt: string;
    triggeredBy: string;
  }>;
  cookieConsents?: Array<{
    id: string;
    analytics: boolean;
    marketing: boolean;
    userAgent: string;
    ip: string;
    createdAt: string;
  }>;
};

const STORE_PATH = process.env.DATA_STORE_PATH || path.resolve(process.cwd(), 'data', 'store.json');

let pool: Pool | null = null;

function shouldUsePostgres() {
  return Boolean(process.env.DATABASE_URL);
}

function buildPool() {
  if (!process.env.DATABASE_URL) return null;
  const isProduction = process.env.NODE_ENV === 'production';
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined
  });
}

async function ensureSchema(client: Pool) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS site_pages (
      id UUID PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS social_schedules (
      id UUID PRIMARY KEY,
      channel TEXT NOT NULL,
      title TEXT NOT NULL,
      caption TEXT,
      description TEXT,
      media_url TEXT,
      scheduled_at TEXT,
      status TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS n8n_workflow_hooks (
      workflow_id TEXT PRIMARY KEY,
      webhook_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS n8n_workflow_runs (
      id UUID PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      webhook_url TEXT NOT NULL,
      status TEXT NOT NULL,
      response_status INT,
      error TEXT,
      triggered_at TIMESTAMPTZ NOT NULL,
      triggered_by TEXT NOT NULL
    );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS cookie_consents (
      id UUID PRIMARY KEY,
      analytics BOOLEAN NOT NULL,
      marketing BOOLEAN NOT NULL,
      user_agent TEXT NOT NULL,
      ip TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);
}

function hydrateFromFile(db: PersistenceDb) {
  if (!existsSync(STORE_PATH)) return;
  try {
    const raw = readFileSync(STORE_PATH, 'utf-8');
    const store = JSON.parse(raw) as PersistentStore;
    if (store.sitePages && store.sitePages.length > 0) {
      db.sitePages = store.sitePages.map((page) => ({
        ...page,
        createdAt: new Date(page.createdAt),
        updatedAt: new Date(page.updatedAt)
      }));
    }
    if (store.socialSchedules && store.socialSchedules.length > 0) {
      db.socialSchedules = store.socialSchedules.map((entry) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));
    }
    if (store.n8nWorkflowHooks && store.n8nWorkflowHooks.length > 0) {
      db.n8nWorkflowHooks = store.n8nWorkflowHooks.map((hook) => ({
        ...hook,
        createdAt: new Date(hook.createdAt),
        updatedAt: new Date(hook.updatedAt)
      }));
    }
    if (store.n8nWorkflowRuns && store.n8nWorkflowRuns.length > 0) {
      db.n8nWorkflowRuns = store.n8nWorkflowRuns.map((run) => ({
        ...run,
        triggeredAt: new Date(run.triggeredAt)
      }));
    }
    if (store.cookieConsents && store.cookieConsents.length > 0) {
      db.cookieConsents = store.cookieConsents.map((consent) => ({
        ...consent,
        createdAt: new Date(consent.createdAt)
      }));
    }
  } catch {
    // ignore malformed files
  }
}

async function hydrateFromPostgres(db: PersistenceDb) {
  if (!pool) return;
  await ensureSchema(pool);
  const pages = await pool.query('SELECT * FROM site_pages ORDER BY updated_at DESC');
  if (pages.rows.length > 0) {
    db.sitePages = pages.rows.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      body: row.body,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  const schedules = await pool.query('SELECT * FROM social_schedules ORDER BY updated_at DESC');
  if (schedules.rows.length > 0) {
    db.socialSchedules = schedules.rows.map((row: any) => ({
      id: row.id,
      channel: row.channel,
      title: row.title,
      caption: row.caption,
      description: row.description,
      mediaUrl: row.media_url,
      scheduledAt: row.scheduled_at,
      status: row.status,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  const hooks = await pool.query('SELECT * FROM n8n_workflow_hooks');
  if (hooks.rows.length > 0) {
    db.n8nWorkflowHooks = hooks.rows.map((row: any) => ({
      workflowId: row.workflow_id,
      webhookUrl: row.webhook_url,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  const runs = await pool.query('SELECT * FROM n8n_workflow_runs ORDER BY triggered_at DESC');
  if (runs.rows.length > 0) {
    db.n8nWorkflowRuns = runs.rows.map((row: any) => ({
      id: row.id,
      workflowId: row.workflow_id,
      webhookUrl: row.webhook_url,
      status: row.status,
      responseStatus: row.response_status ?? undefined,
      error: row.error ?? undefined,
      triggeredAt: new Date(row.triggered_at),
      triggeredBy: row.triggered_by
    }));
  }

  const consents = await pool.query('SELECT * FROM cookie_consents ORDER BY created_at DESC');
  if (consents.rows.length > 0) {
    db.cookieConsents = consents.rows.map((row: any) => ({
      id: row.id,
      analytics: row.analytics,
      marketing: row.marketing,
      userAgent: row.user_agent,
      ip: row.ip,
      createdAt: new Date(row.created_at)
    }));
  }
}

export async function initPersistence(db: PersistenceDb) {
  if (shouldUsePostgres()) {
    pool = buildPool();
    try {
      await hydrateFromPostgres(db);
      return;
    } catch {
      // Fallback to file if postgres is unreachable.
    }
  }
  hydrateFromFile(db);
}

async function persistToFile(db: PersistenceDb) {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const payload: PersistentStore = {
      sitePages: db.sitePages.map((page) => ({
        ...page,
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString()
      })),
      socialSchedules: db.socialSchedules.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString()
      })),
      n8nWorkflowHooks: db.n8nWorkflowHooks.map((hook) => ({
        ...hook,
        createdAt: hook.createdAt.toISOString(),
        updatedAt: hook.updatedAt.toISOString()
      })),
      n8nWorkflowRuns: db.n8nWorkflowRuns.map((run) => ({
        ...run,
        triggeredAt: run.triggeredAt.toISOString()
      })),
      cookieConsents: db.cookieConsents.map((consent) => ({
        ...consent,
        createdAt: consent.createdAt.toISOString()
      }))
    };
    writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2));
  } catch {
    // ignore
  }
}

async function persistToPostgres(db: PersistenceDb) {
  if (!pool) return;
  await ensureSchema(pool);

  for (const page of db.sitePages) {
    await pool.query(
      `INSERT INTO site_pages (id, slug, title, summary, body, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE
       SET slug = EXCLUDED.slug,
           title = EXCLUDED.title,
           summary = EXCLUDED.summary,
           body = EXCLUDED.body,
           updated_at = EXCLUDED.updated_at`,
      [page.id, page.slug, page.title, page.summary, page.body, page.createdAt, page.updatedAt]
    );
  }

  for (const entry of db.socialSchedules) {
    await pool.query(
      `INSERT INTO social_schedules (id, channel, title, caption, description, media_url, scheduled_at, status, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE
       SET channel = EXCLUDED.channel,
           title = EXCLUDED.title,
           caption = EXCLUDED.caption,
           description = EXCLUDED.description,
           media_url = EXCLUDED.media_url,
           scheduled_at = EXCLUDED.scheduled_at,
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at`,
      [
        entry.id,
        entry.channel,
        entry.title,
        entry.caption ?? null,
        entry.description ?? null,
        entry.mediaUrl ?? null,
        entry.scheduledAt ?? null,
        entry.status,
        entry.createdBy,
        entry.createdAt,
        entry.updatedAt
      ]
    );
  }

  for (const hook of db.n8nWorkflowHooks) {
    await pool.query(
      `INSERT INTO n8n_workflow_hooks (workflow_id, webhook_url, created_at, updated_at)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (workflow_id) DO UPDATE
       SET webhook_url = EXCLUDED.webhook_url,
           updated_at = EXCLUDED.updated_at`,
      [hook.workflowId, hook.webhookUrl, hook.createdAt, hook.updatedAt]
    );
  }

  for (const run of db.n8nWorkflowRuns) {
    await pool.query(
      `INSERT INTO n8n_workflow_runs (id, workflow_id, webhook_url, status, response_status, error, triggered_at, triggered_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE
       SET status = EXCLUDED.status,
           response_status = EXCLUDED.response_status,
           error = EXCLUDED.error`,
      [
        run.id,
        run.workflowId,
        run.webhookUrl,
        run.status,
        run.responseStatus ?? null,
        run.error ?? null,
        run.triggeredAt,
        run.triggeredBy
      ]
    );
  }

  for (const consent of db.cookieConsents) {
    await pool.query(
      `INSERT INTO cookie_consents (id, analytics, marketing, user_agent, ip, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO NOTHING`,
      [consent.id, consent.analytics, consent.marketing, consent.userAgent, consent.ip, consent.createdAt]
    );
  }
}

export async function persistDbSnapshot(db: PersistenceDb) {
  if (shouldUsePostgres()) {
    if (!pool) pool = buildPool();
    try {
      await persistToPostgres(db);
      return;
    } catch {
      // fallback to file
    }
  }
  await persistToFile(db);
}
