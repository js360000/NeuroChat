import { Router } from 'express';
import { db, findSitePageBySlug } from '../db/index.js';

const router = Router();

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
