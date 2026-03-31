import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'data', 'uploads')

// Ensure uploads directory exists
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin'
    cb(null, `${uuid()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)|video\/(mp4|webm)|audio\/(mpeg|ogg|wav)$/
    if (allowed.test(file.mimetype)) cb(null, true)
    else cb(new Error('Unsupported file type'))
  },
})

export const uploadsRouter = Router()

// POST /api/uploads — upload a file, returns URL
uploadsRouter.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })

  const url = `/api/uploads/${req.file.filename}`
  res.json({
    url,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  })
})

// GET /api/uploads/:filename — serve uploaded file
uploadsRouter.get('/:filename', (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename)
  // Prevent directory traversal
  if (!filePath.startsWith(UPLOADS_DIR)) return res.status(403).end()
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' })
  res.sendFile(filePath)
})
