import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import { Readable } from 'stream'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configure Multer for memory storage (we'll upload to Cloudinary from memory)
const storage = multer.memoryStorage()

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false)
  }
}

// Multer upload middleware
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: imageFileFilter,
})

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
export async function uploadToCloudinary(fileBuffer, options = {}) {
  const {
    folder = 'rentra',
    transformation,
    publicId,
    resourceType = 'image',
  } = options

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation,
        public_id: publicId,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }
    )

    // Convert buffer to stream and pipe to Cloudinary
    const readableStream = new Readable()
    readableStream.push(fileBuffer)
    readableStream.push(null)
    readableStream.pipe(uploadStream)
  })
}

/**
 * Upload property images
 * @param {Array<Buffer>} files - Array of file buffers
 * @param {String} listingId - Listing ID for folder organization
 * @returns {Promise<Array<String>>} Array of uploaded image URLs
 */
export async function uploadPropertyImages(files, listingId) {
  if (!files || files.length === 0) {
    return []
  }

  const uploadPromises = files.map((file, index) =>
    uploadToCloudinary(file.buffer, {
      folder: `rentra/listings/${listingId}`,
      publicId: `image_${index}_${Date.now()}`,
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    })
  )

  const results = await Promise.all(uploadPromises)
  return results.map((result) => result.secure_url)
}

/**
 * Upload user avatar
 * @param {Buffer} fileBuffer - Avatar file buffer
 * @param {String} userId - User ID
 * @returns {Promise<String>} Uploaded avatar URL
 */
export async function uploadAvatar(fileBuffer, userId) {
  const result = await uploadToCloudinary(fileBuffer, {
    folder: 'rentra/avatars',
    publicId: `avatar_${userId}`,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  })

  return result.secure_url
}

/**
 * Delete an image from Cloudinary
 * @param {String} imageUrl - The Cloudinary image URL
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteImage(imageUrl) {
  try {
    // Extract public_id from URL
    const urlParts = imageUrl.split('/')
    const filename = urlParts[urlParts.length - 1].split('.')[0]
    const folder = urlParts.slice(urlParts.indexOf('rentra'), -1).join('/')
    const publicId = `${folder}/${filename}`

    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw error
  }
}

/**
 * Delete multiple images
 * @param {Array<String>} imageUrls - Array of Cloudinary image URLs
 * @returns {Promise<Array>} Array of deletion results
 */
export async function deleteMultipleImages(imageUrls) {
  const deletePromises = imageUrls.map((url) => deleteImage(url))
  return await Promise.all(deletePromises)
}

/**
 * Get optimized image URL with transformations
 * @param {String} imageUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {String} Transformed image URL
 */
export function getOptimizedImageUrl(imageUrl, options = {}) {
  const { width, height, crop = 'fill', quality = 'auto' } = options

  if (!imageUrl || !imageUrl.includes('cloudinary')) {
    return imageUrl
  }

  // Insert transformations into URL
  const transformations = []
  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  transformations.push(`c_${crop}`)
  transformations.push(`q_${quality}`)
  transformations.push('f_auto')

  const transformString = transformations.join(',')
  return imageUrl.replace('/upload/', `/upload/${transformString}/`)
}

export default {
  upload,
  uploadToCloudinary,
  uploadPropertyImages,
  uploadAvatar,
  deleteImage,
  deleteMultipleImages,
  getOptimizedImageUrl,
}
