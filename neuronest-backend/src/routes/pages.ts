import { Router } from 'express';
import { db, findSitePageBySlug } from '../db/index.js';
import { getExperiments, getAppConfig, getAdConfig } from '../config/settings.js';

const router = Router();

// GET /pages/config - public app config (traits, interests, goals, pricing, crisis resources)
router.get('/config', (_req, res) => {
  res.json({ config: getAppConfig() });
});

// GET /pages/testimonials - public testimonials
router.get('/testimonials', (req, res) => {
  const featured = req.query.featured as string | undefined;
  let testimonials = db.testimonials.filter((item) => item.status === 'published');
  if (featured === 'true') {
    testimonials = testimonials.filter((item) => item.featured);
  }
  const results = testimonials
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((item) => ({
      id: item.id,
      quote: item.quote,
      author: item.author,
      role: item.role,
      avatar: item.avatar,
      micro: item.micro,
      featured: item.featured
    }));
  res.json({ testimonials: results });
});

// GET /pages/ads - public ad config (client ID + enabled slots only)
router.get('/ads', (_req, res) => {
  const config = getAdConfig();
  if (!config.globalEnabled || !config.adsenseClientId) {
    return res.json({ enabled: false, clientId: '', slots: [] });
  }
  const enabledSlots = config.slots
    .filter((s) => s.enabled && s.adSlotId)
    .map((s) => ({ id: s.id, area: s.area, format: s.format, adSlotId: s.adSlotId }));
  res.json({
    enabled: true,
    clientId: config.adsenseClientId,
    showToFreeOnly: config.showToFreeOnly,
    slots: enabledSlots,
  });
});

// GET /pages/experiments - public experiment toggles
router.get('/experiments', (_req, res) => {
  res.json({ experiments: getExperiments() });
});

// GET /pages/:slug - public page content
router.get('/:slug', (req, res) => {
  const page = findSitePageBySlug(req.params.slug);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  res.json({
    page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      summary: page.summary,
      body: page.body,
      updatedAt: page.updatedAt.toISOString()
    }
  });
});

// GET /pages - list public pages
router.get('/', (req, res) => {
  const pages = db.sitePages.map((page) => ({
    id: page.id,
    slug: page.slug,
    title: page.title,
    summary: page.summary,
    updatedAt: page.updatedAt.toISOString()
  }));
  res.json({ pages });
});

export default router;
