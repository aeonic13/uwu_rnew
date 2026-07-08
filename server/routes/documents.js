import express from 'express'
import multer from 'multer'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'
import { uploadToCloudinary, deleteImage } from '../utils/cloudinary.js'

const router = express.Router()

export const DOCUMENT_CATEGORIES = [
  'lease',
  'receipt',
  'notice',
  'insurance',
  'inspection',
  'tax',
  'other',
]

// The shared cloudinary multer only accepts images; documents also need PDFs
// and Word files.
const ALLOWED_DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_DOC_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(
        new Error('Invalid file type. PDF, Word, and image files are allowed.'),
        false
      )
    }
  },
})

/**
 * GET /api/documents?listingId=&category=
 */
router.get('/', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const { listingId, category } = req.query
    const where = { ownerId: req.user.id }
    if (listingId) where.listingId = listingId
    if (category) where.category = category

    const documents = await prisma.document.findMany({
      where,
      include: { listing: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ documents, categories: DOCUMENT_CATEGORIES })
  } catch (error) {
    console.error('List documents error:', error)
    res.status(500).json({ error: { message: 'Failed to list documents' } })
  }
})

/**
 * POST /api/documents
 * multipart/form-data: file, name?, category?, listingId?
 */
router.post(
  '/',
  authenticate,
  requireUserType('owner'),
  docUpload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: { message: 'No file provided' } })
      }
      const { name, category = 'other', listingId } = req.body
      if (!DOCUMENT_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: { message: 'Invalid category' } })
      }
      if (listingId) {
        const listing = await prisma.listing.findFirst({
          where: { id: listingId, ownerId: req.user.id },
          select: { id: true },
        })
        if (!listing) {
          return res
            .status(404)
            .json({ error: { message: 'Listing not found' } })
        }
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: `rentra/documents/${req.user.id}`,
        publicId: `doc_${Date.now()}`,
        resourceType: 'auto',
      })

      const document = await prisma.document.create({
        data: {
          ownerId: req.user.id,
          name: name || req.file.originalname,
          category,
          url: result.secure_url,
          mimeType: req.file.mimetype,
          size: req.file.size,
          listingId: listingId || null,
        },
        include: { listing: { select: { id: true, title: true } } },
      })
      res.status(201).json({ document })
    } catch (error) {
      console.error('Upload document error:', error)
      res.status(500).json({ error: { message: 'Failed to upload document' } })
    }
  }
)

/**
 * DELETE /api/documents/:id
 * Removes the index row and best-effort deletes the Cloudinary asset.
 */
router.delete(
  '/:id',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const document = await prisma.document.findFirst({
        where: { id: req.params.id, ownerId: req.user.id },
      })
      if (!document) {
        return res
          .status(404)
          .json({ error: { message: 'Document not found' } })
      }
      await prisma.document.delete({ where: { id: document.id } })
      // The DB row is the source of truth; a failed asset delete only orphans
      // a file in Cloudinary, so don't fail the request over it.
      deleteImage(document.url).catch(err =>
        console.error('Cloudinary document delete failed:', err.message)
      )
      res.json({ message: 'Document deleted' })
    } catch (error) {
      console.error('Delete document error:', error)
      res.status(500).json({ error: { message: 'Failed to delete document' } })
    }
  }
)

// Multer error handler (file too large / bad type)
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ error: { message: 'File too large. Maximum size is 15MB.' } })
    }
    return res.status(400).json({ error: { message: error.message } })
  }
  if (error.message?.includes('Invalid file type')) {
    return res.status(400).json({ error: { message: error.message } })
  }
  next(error)
})

export default router
