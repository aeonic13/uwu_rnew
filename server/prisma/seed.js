import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...')
  await prisma.message.deleteMany()
  await prisma.conversationUser.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.review.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.agreement.deleteMany()
  await prisma.application.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.user.deleteMany()

  // Hash password for all users
  const passwordHash = await bcrypt.hash('password123', 10)

  // Create Users
  console.log('Creating users...')

  const owner1 = await prisma.user.create({
    data: {
      email: 'sarah.chen@gmail.com',
      passwordHash,
      userType: 'owner',
      firstName: 'Sarah',
      lastName: 'Chen',
      phone: '(310) 555-1234',
      verified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  })

  const owner2 = await prisma.user.create({
    data: {
      email: 'mike.rodriguez@gmail.com',
      passwordHash,
      userType: 'owner',
      firstName: 'Mike',
      lastName: 'Rodriguez',
      phone: '(310) 555-5678',
      verified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  })

  const student1 = await prisma.user.create({
    data: {
      email: 'alex.johnson@usc.edu',
      passwordHash,
      userType: 'student',
      firstName: 'Alex',
      lastName: 'Johnson',
      phone: '(213) 555-9012',
      university: 'USC',
      major: 'Computer Science',
      bio: 'Junior at USC studying CS. Looking for housing near campus.',
      verified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  })

  const student2 = await prisma.user.create({
    data: {
      email: 'emma.wilson@ucla.edu',
      passwordHash,
      userType: 'student',
      firstName: 'Emma',
      lastName: 'Wilson',
      phone: '(310) 555-3456',
      university: 'UCLA',
      major: 'Biology',
      bio: 'Grad student at UCLA. Quiet, clean, and responsible.',
      verified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    },
  })

  console.log('Created 4 users')

  // Create Listings
  console.log('Creating listings...')

  const listing1 = await prisma.listing.create({
    data: {
      title: 'Cozy 1BR near USC Campus',
      description: 'Perfect for students! Fully furnished apartment just 5 min walk to campus.',
      price: 1200,
      location: 'University Park, Los Angeles, CA',
      university: 'USC',
      moveInDate: new Date('2026-02-15'),
      moveOutDate: new Date('2026-08-15'),
      propertyType: 'Apartment',
      bedrooms: 1,
      bathrooms: 1,
      amenities: ['WiFi', 'Laundry', 'Parking', 'Furnished', 'AC'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      ],
      ownerId: owner1.id,
      active: true,
    },
  })

  const listing2 = await prisma.listing.create({
    data: {
      title: 'Spacious Room in Shared House - UCLA',
      description: 'Great location in Westwood, walking distance to UCLA.',
      price: 850,
      location: 'Westwood, Los Angeles, CA',
      university: 'UCLA',
      moveInDate: new Date('2026-03-01'),
      moveOutDate: new Date('2026-08-31'),
      propertyType: 'SingleRoom',
      bedrooms: 1,
      bathrooms: 1,
      amenities: ['WiFi', 'Kitchen', 'Garden', 'Pet-friendly', 'Laundry'],
      images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
      ownerId: owner2.id,
      active: true,
    },
  })

  const listing3 = await prisma.listing.create({
    data: {
      title: 'Modern Studio in Downtown LA',
      description: 'Stylish studio with gym and rooftop pool access.',
      price: 1650,
      location: 'Downtown Los Angeles, CA',
      university: 'USC',
      propertyType: 'Studio',
      bedrooms: 0,
      bathrooms: 1,
      amenities: ['WiFi', 'Gym', 'Pool', 'Security', 'AC', 'Parking'],
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
      ownerId: owner1.id,
      active: true,
    },
  })

  console.log('Created 3 listings')

  // Create Favorites
  await prisma.favorite.createMany({
    data: [
      { userId: student1.id, listingId: listing1.id },
      { userId: student2.id, listingId: listing2.id },
    ],
  })

  // Create Application
  const application1 = await prisma.application.create({
    data: {
      listingId: listing1.id,
      applicantId: student1.id,
      ownerId: owner1.id,
      status: 'pending',
      message: "Hi! I'm interested in your apartment.",
      startDate: new Date('2026-02-15'),
      endDate: new Date('2026-08-15'),
    },
  })

  console.log('Created 1 application')

  // Create Conversation
  const conversation1 = await prisma.conversation.create({
    data: {
      listingId: listing1.id,
      users: {
        create: [
          { userId: student1.id },
          { userId: owner1.id, unreadCount: 1 },
        ],
      },
    },
  })

  // Create Messages
  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation1.id,
        senderId: student1.id,
        content: 'Hi! Is this apartment still available?',
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        conversationId: conversation1.id,
        senderId: owner1.id,
        content: "Yes! Would you like to schedule a tour?",
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        conversationId: conversation1.id,
        senderId: student1.id,
        content: "That would be great! I'm free this weekend.",
        type: 'text',
        read: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
  })

  console.log('Created 1 conversation with 3 messages')

  console.log('\n✅ Database seeded successfully!')
  console.log('\n📝 Test Accounts:')
  console.log('─'.repeat(50))
  console.log('OWNERS:')
  console.log('  sarah.chen@gmail.com')
  console.log('  mike.rodriguez@gmail.com')
  console.log('STUDENTS:')
  console.log('  alex.johnson@usc.edu')
  console.log('  emma.wilson@ucla.edu')
  console.log('\nPassword for all: password123')
  console.log('─'.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })