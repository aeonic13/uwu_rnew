import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, optionalAuth } from '../middleware/authenticate.js'

const router = express.Router()

// GET /api/listings - Public endpoint with optional auth
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      university,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      propertyType,
      amenities,
      page = 1,
      limit = 20,
    } = req.query

    // Build where clause
    const where = { active: true }

    if (university && university !== 'All Universities') {
      where.university = university
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseInt(minPrice, 10)
      if (maxPrice) where.price.lte = parseInt(maxPrice, 10)
    }

    if (bedrooms) {
      where.bedrooms = parseInt(bedrooms, 10)
    }

    if (bathrooms) {
      where.bathrooms = parseFloat(bathrooms)
    }

    if (propertyType) {
      where.propertyType = propertyType
    }

    if (amenities) {
      const amenitiesList = amenities.split(',')
      where.amenities = {
        hasEvery: amenitiesList,
      }
    }

    // Calculate pagination
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)

    // Get listings with owner info
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: parseInt(limit, 10),
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              verified: true,
            },
          },
          _count: {
            select: {
              favorites: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.listing.count({ where }),
    ])

    res.json({
      listings,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    })
  } catch (error) {
    console.error('Get listings error:', error)
    res.status(500).json({ error: { message: 'Failed to get listings' } })
  }
})

// GET /api/listings/:id - Public endpoint with optional auth
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            verified: true,
            university: true,
            createdAt: true,
            _count: {
              select: {
                listings: true,
              },
            },
          },
        },
        reviews: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            favorites: true,
            applications: true,
          },
        },
      },
    })

    if (!listing) {
      return res.status(404).json({
        error: { message: 'Listing not found' },
      })
    }

    // Check if current user has favorited this listing
    let isFavorited = false
    if (req.user) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_listingId: {
            userId: req.user.id,
            listingId: id,
          },
        },
      })
      isFavorited = !!favorite
    }

    res.json({
      listing: {
        ...listing,
        isFavorited,
      },
    })
  } catch (error) {
    console.error('Get listing error:', error)
    res.status(500).json({ error: { message: 'Failed to get listing' } })
  }
})

// POST /api/listings - Create listing (authenticated)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      university,
      moveInDate,
      moveOutDate,
      propertyType,
      bedrooms,
      bathrooms,
      incomeMultiplier,
      amenities,
      images,
    } = req.body

    // Validate required fields
    if (!title || !description || !price || !location || !propertyType) {
      return res.status(400).json({
        error: { message: 'Missing required fields' },
      })
    }

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: parseInt(price, 10),
        location,
        university,
        moveInDate: moveInDate ? new Date(moveInDate) : null,
        moveOutDate: moveOutDate ? new Date(moveOutDate) : null,
        propertyType,
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : 0,
        bathrooms: bathrooms ? parseFloat(bathrooms) : 1,
        ...(incomeMultiplier && {
          incomeMultiplier: parseFloat(incomeMultiplier),
        }),
        amenities: amenities || [],
        images: images || [],
        ownerId: req.user.id,
        active: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            verified: true,
          },
        },
      },
    })

    res.status(201).json({
      message: 'Listing created successfully',
      listing,
    })
  } catch (error) {
    console.error('Create listing error:', error)
    res.status(400).json({ error: { message: 'Failed to create listing' } })
  }
})

// PUT /api/listings/:id - Update listing (owner only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Check if listing exists and user is the owner
    const existingListing = await prisma.listing.findUnique({
      where: { id },
    })

    if (!existingListing) {
      return res.status(404).json({
        error: { message: 'Listing not found' },
      })
    }

    if (existingListing.ownerId !== req.user.id) {
      return res.status(403).json({
        error: { message: 'You do not have permission to update this listing' },
      })
    }

    // Build update data
    const updateData = {}
    const {
      title,
      description,
      price,
      location,
      university,
      moveInDate,
      moveOutDate,
      propertyType,
      bedrooms,
      bathrooms,
      amenities,
      images,
      active,
    } = req.body

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseInt(price, 10)
    if (location !== undefined) updateData.location = location
    if (university !== undefined) updateData.university = university
    if (moveInDate !== undefined)
      updateData.moveInDate = moveInDate ? new Date(moveInDate) : null
    if (moveOutDate !== undefined)
      updateData.moveOutDate = moveOutDate ? new Date(moveOutDate) : null
    if (propertyType !== undefined) updateData.propertyType = propertyType
    if (bedrooms !== undefined) updateData.bedrooms = parseInt(bedrooms, 10)
    if (bathrooms !== undefined) updateData.bathrooms = parseFloat(bathrooms)
    if (amenities !== undefined) updateData.amenities = amenities
    if (images !== undefined) updateData.images = images
    if (active !== undefined) updateData.active = active

    // Update listing
    const listing = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            verified: true,
          },
        },
      },
    })

    res.json({
      message: 'Listing updated successfully',
      listing,
    })
  } catch (error) {
    console.error('Update listing error:', error)
    res.status(400).json({ error: { message: 'Failed to update listing' } })
  }
})

// DELETE /api/listings/:id - Delete listing (owner only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Check if listing exists and user is the owner
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        applications: {
          where: {
            status: {
              in: ['pending', 'approved'],
            },
          },
        },
      },
    })

    if (!listing) {
      return res.status(404).json({
        error: { message: 'Listing not found' },
      })
    }

    if (listing.ownerId !== req.user.id) {
      return res.status(403).json({
        error: { message: 'You do not have permission to delete this listing' },
      })
    }

    // Check for active applications
    if (listing.applications.length > 0) {
      return res.status(400).json({
        error: {
          message:
            'Cannot delete listing with active applications. Please resolve all applications first.',
        },
      })
    }

    // Delete listing (cascade will handle related data)
    await prisma.listing.delete({
      where: { id },
    })

    res.json({ message: 'Listing deleted successfully' })
  } catch (error) {
    console.error('Delete listing error:', error)
    res.status(400).json({ error: { message: 'Failed to delete listing' } })
  }
})

// GET /api/listings/my-listings - Get current user's listings
router.get('/my/listings', authenticate, async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        ownerId: req.user.id,
      },
      include: {
        _count: {
          select: {
            applications: true,
            favorites: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({ listings })
  } catch (error) {
    console.error('Get my listings error:', error)
    res.status(500).json({ error: { message: 'Failed to get listings' } })
  }
})

// POST /api/listings/:id/favorite - Toggle favorite
router.post('/:id/favorite', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id },
    })

    if (!listing) {
      return res.status(404).json({
        error: { message: 'Listing not found' },
      })
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: req.user.id,
          listingId: id,
        },
      },
    })

    if (existingFavorite) {
      // Remove favorite
      await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      })
      return res.json({
        message: 'Removed from favorites',
        isFavorited: false,
      })
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          userId: req.user.id,
          listingId: id,
        },
      })
      return res.json({
        message: 'Added to favorites',
        isFavorited: true,
      })
    }
  } catch (error) {
    console.error('Toggle favorite error:', error)
    res.status(500).json({ error: { message: 'Failed to toggle favorite' } })
  }
})

// GET /api/listings/favorites/all - Get user's favorites
router.get('/favorites/all', authenticate, async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        listing: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                verified: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const listings = favorites.map(fav => fav.listing)

    res.json({ listings })
  } catch (error) {
    console.error('Get favorites error:', error)
    res.status(500).json({ error: { message: 'Failed to get favorites' } })
  }
})

export default router
