import api from './api'

export const uploadsService = {
  /**
   * Upload property images
   * @param {FormData} formData - Form data with images
   * @returns {Promise} Upload response with image URLs
   */
  uploadPropertyImages: async (formData) => {
    const response = await api.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Upload user avatar
   * @param {FormData} formData - Form data with avatar image
   * @returns {Promise} Upload response with avatar URL
   */
  uploadAvatar: async (formData) => {
    const response = await api.post('/uploads/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Delete image from Cloudinary
   * @param {string} imageUrl - URL of image to delete
   * @returns {Promise} Deletion confirmation
   */
  deleteImage: async (imageUrl) => {
    const response = await api.delete('/uploads/images', {
      data: { imageUrl },
    })
    return response.data
  },

  /**
   * Helper: Convert File to FormData
   * @param {File} file - File object
   * @param {string} fieldName - Form field name
   * @returns {FormData} Form data object
   */
  createFormData: (file, fieldName = 'image') => {
    const formData = new FormData()
    formData.append(fieldName, file)
    return formData
  },

  /**
   * Helper: Convert multiple files to FormData
   * @param {FileList|Array} files - Array of files
   * @param {string} fieldName - Form field name
   * @returns {FormData} Form data object
   */
  createMultipleFilesFormData: (files, fieldName = 'images') => {
    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append(fieldName, file)
    })
    return formData
  },
}

export default uploadsService
