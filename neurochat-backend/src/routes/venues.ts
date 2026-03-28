import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'

export const venuesRouter = Router()

function formatVenue(venue: any) {
  const reviews = db.prepare('SELECT * FROM venue_reviews WHERE venue_id = ?').all(venue.id) as any[]
  const avg = (key: string) => reviews.length ? Math.round(reviews.reduce((s, r) => s + (r[key] || 0), 0) / reviews.length * 10) / 10 : null

  return {
    id: venue.id,
    name: venue.name,
    address: venue.address,
    category: venue.category,
    latitude: venue.latitude,
    longitude: venue.longitude,
    createdBy: venue.created_by,
    createdAt: venue.created_at,
    reviewCount: reviews.length,
    averages: {
      noise: avg('noise'),
      lighting: avg('lighting'),
      crowding: avg('crowding'),
      scents: avg('scents'),
      predictability: avg('predictability'),
    },
    overallSensoryScore: reviews.length
      ? Math.round(((avg('noise')! + avg('lighting')! + avg('crowding')! + avg('scents')! + avg('predictability')!) / 5) * 10) / 10
      : null,
  }
}

// GET /api/venues
venuesRouter.get('/', (req, res) => {
  const { q, category } = req.query
  let sql = 'SELECT * FROM venues WHERE 1=1'
  const params: any[] = []
  if (q) { sql += ' AND (name LIKE ? OR address LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
  if (category) { sql += ' AND category = ?'; params.push(category) }
  sql += ' ORDER BY created_at DESC LIMIT 100'

  const venues = db.prepare(sql).all(...params)
  res.json({ venues: venues.map(formatVenue) })
})

// GET /api/venues/:id
venuesRouter.get('/:id', (req, res) => {
  const venue = db.prepare('SELECT * FROM venues WHERE id = ?').get(req.params.id) as any
  if (!venue) return res.status(404).json({ error: 'Venue not found' })

  const reviews = db.prepare(`
    SELECT vr.*, u.name as reviewer_name, u.avatar FROM venue_reviews vr
    JOIN users u ON u.id = vr.user_id WHERE vr.venue_id = ? ORDER BY vr.created_at DESC
  `).all(venue.id)

  res.json({ venue: formatVenue(venue), reviews })
})

// POST /api/venues — create venue
venuesRouter.post('/', (req, res) => {
  const userId = (req as any).userId
  const { name, address, category, latitude, longitude } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Venue name required' })

  const id = uuid()
  db.prepare('INSERT INTO venues (id, name, address, category, latitude, longitude, created_by) VALUES (?,?,?,?,?,?,?)').run(
    id, name.trim(), address || null, category || null, latitude || null, longitude || null, userId
  )
  const venue = db.prepare('SELECT * FROM venues WHERE id = ?').get(id)
  res.json({ venue: formatVenue(venue) })
})

// POST /api/venues/:id/review — add/update sensory review
venuesRouter.post('/:id/review', (req, res) => {
  const userId = (req as any).userId
  const { noise, lighting, crowding, scents, predictability, notes, timeOfVisit } = req.body

  const venue = db.prepare('SELECT * FROM venues WHERE id = ?').get(req.params.id) as any
  if (!venue) return res.status(404).json({ error: 'Venue not found' })

  const id = uuid()
  db.prepare(`
    INSERT INTO venue_reviews (id, venue_id, user_id, noise, lighting, crowding, scents, predictability, notes, time_of_visit)
    VALUES (?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(venue_id, user_id) DO UPDATE SET
      noise=excluded.noise, lighting=excluded.lighting, crowding=excluded.crowding,
      scents=excluded.scents, predictability=excluded.predictability,
      notes=excluded.notes, time_of_visit=excluded.time_of_visit
  `).run(id, venue.id, userId, noise || null, lighting || null, crowding || null, scents || null, predictability || null, notes || null, timeOfVisit || null)

  res.json({ venue: formatVenue(venue) })
})
