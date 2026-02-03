import { Router } from 'express';
import { db, findSitePageBySlug } from '../db/index.js';
import { getExperiments } from '../config/settings.js';

const router = Router();

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
