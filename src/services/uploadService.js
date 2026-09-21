import { apiClient } from './api'

/**
 * Upload service for handling file uploads
 */
export const uploadService = {
  /**
   * Upload multiple images
   * @param {File[]} files - Array of File objects to upload
   * @returns {Promise<{images: Array<{url: string, filename: string}>}>}
   */
  async uploadImages(files) {
    const formData = new FormData()

    files.forEach(file => {
      formData.append('images', file)
    })

    const response = await apiClient.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response
  },

  /**
   * Delete an uploaded image
   * @param {string} filename - The filename to delete
   * @returns {Promise<void>}
   */
  async deleteImage(filename) {
    await apiClient.delete(`/uploads/images/${filename}`)
  },

  /**
   * Upload a user avatar. The server stores it on the profile and
   * returns the new URL.
   * @param {File} file - Avatar image file
   * @returns {Promise<string>} - The uploaded avatar URL
   */
  async uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await apiClient.post('/uploads/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.avatarUrl
  },

  /**
   * Upload a single image and return just the URL
   * Convenience method for simple use cases
   * @param {File} file - Single file to upload
   * @returns {Promise<string>} - The uploaded image URL
   */
  async uploadSingleImage(file) {
    const response = await this.uploadImages([file])
    return response.images[0]?.url
  },
}

export default uploadService
