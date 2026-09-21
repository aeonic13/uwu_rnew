import express from 'express'
import multer from 'multer'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  upload,
  uploadPropertyImages,
  uploadAvatar,
  deleteImage,
} from '../utils/cloudinary.js'

const router = express.Router()

/**
 * POST /api/uploads/images
 * Upload multiple images for a listing
 * Returns array of image URLs
 */
router.post(
  '/images',
  authenticate,
  upload.array('images', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: { message: 'No images provided' },
        })
      }

      const { listingId } = req.body
      if (!listingId) {
        return res.status(400).json({
          error: { message: 'Listing ID is required' },
        })
      }

      // Upload to Cloudinary
      const imageUrls = await uploadPropertyImages(req.files, listingId)

      res.status(201).json({
        message: 'Images uploaded successfully',
        images: imageUrls.map(url => ({ url })),
      })
    } catch (error) {
      console.error('Image upload error:', error)
      res.status(500).json({
        error: { message: 'Failed to upload images' },
      })
    }
  }
)

/**
 * POST /api/uploads/avatar
 * Upload user avatar
 */
router.post(
  '/avatar',
  authenticate,
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: { message: 'No avatar provided' },
        })
      }

      // Upload to Cloudinary and persist on the user so the new avatar
      // survives the next profile fetch.
      const avatarUrl = await uploadAvatar(req.file.buffer, req.user.id)
      await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl },
      })

      res.status(201).json({
        message: 'Avatar uploaded successfully',
        avatarUrl,
      })
    } catch (error) {
      console.error('Avatar upload error:', error)
      res.status(500).json({
        error: { message: 'Failed to upload avatar' },
      })
    }
  }
)

/**
 * DELETE /api/uploads/images
 * Delete images from Cloudinary
 */
router.delete('/images', authenticate, async (req, res) => {
  try {
    const { imageUrl } = req.body

    if (!imageUrl) {
      return res.status(400).json({
        error: { message: 'Image URL required' },
      })
    }

    await deleteImage(imageUrl)

    res.json({ message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Image delete error:', error)
    res.status(500).json({
      error: { message: 'Failed to delete image' },
    })
  }
})

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: { message: 'File too large. Maximum size is 5MB.' },
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: { message: 'Too many files. Maximum is 10 images.' },
      })
    }
    return res.status(400).json({
      error: { message: error.message },
    })
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: { message: error.message },
    })
  }

  next(error)
})

export default router
