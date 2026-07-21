import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...')
  await prisma.cosigner.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversationUser.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.review.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.agreement.deleteMany()
  await prisma.application.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.housemateProfile.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)

  // ─── LANDLORDS ────────────────────────────────────────────────
  console.log('Creating landlords...')

  const [owner1, owner2, owner3, owner4, owner5] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'sarah.chen@gmail.com',
        passwordHash,
        userType: 'owner',
        firstName: 'Sarah',
        lastName: 'Chen',
        phone: '(619) 555-1001',
        bio: 'Property manager with 8 years of experience in San Diego. Quick to respond and easy to work with.',
        verified: true,
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike.rodriguez@gmail.com',
        passwordHash,
        userType: 'owner',
        firstName: 'Mike',
        lastName: 'Rodriguez',
        phone: '(619) 555-1002',
        bio: 'Local landlord renting properties in North Park and Hillcrest. Fair and transparent.',
        verified: true,
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jennifer.park@gmail.com',
        passwordHash,
        userType: 'owner',
        firstName: 'Jennifer',
        lastName: 'Park',
        phone: '(619) 555-1003',
        bio: 'Renting modern condos in Pacific Beach and Mission Bay. Pet-friendly properties available.',
        verified: true,
        avatarUrl:
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      },
    }),
    prisma.user.create({
      data: {
        email: 'david.thompson@gmail.com',
        passwordHash,
        userType: 'owner',
        firstName: 'David',
        lastName: 'Thompson',
        phone: '(619) 555-1004',
        bio: 'Family-run property business. We take pride in keeping our homes well-maintained.',
        verified: true,
        avatarUrl:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      },
    }),
    prisma.user.create({
      data: {
        email: 'lisa.martinez@gmail.com',
        passwordHash,
        userType: 'owner',
        firstName: 'Lisa',
        lastName: 'Martinez',
        phone: '(619) 555-1005',
        bio: 'Downtown and Mission Valley specialist. All units include utilities and high-speed internet.',
        verified: true,
        avatarUrl:
          'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150',
      },
    }),
  ])

  // ─── TENANTS ──────────────────────────────────────────────────
  console.log('Creating tenants...')

  const [tenant1, tenant2, tenant3, tenant4, tenant5, tenant6] =
    await Promise.all([
      prisma.user.create({
        data: {
          email: 'alex.johnson@gmail.com',
          passwordHash,
          userType: 'student',
          firstName: 'Alex',
          lastName: 'Johnson',
          phone: '(619) 555-2001',
          bio: 'Working professional, non-smoker. Great references available.',
          verified: true,
          avatarUrl:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        },
      }),
      prisma.user.create({
        data: {
          email: 'emma.wilson@gmail.com',
          passwordHash,
          userType: 'student',
          firstName: 'Emma',
          lastName: 'Wilson',
          phone: '(619) 555-2002',
          bio: 'Quiet, clean, and responsible. Looking for a long-term place.',
          verified: true,
          avatarUrl:
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        },
      }),
      prisma.user.create({
        data: {
          email: 'jordan.lee@gmail.com',
          passwordHash,
          userType: 'student',
          firstName: 'Jordan',
          lastName: 'Lee',
          phone: '(619) 555-2003',
          bio: 'Remote worker looking for a home office setup. Stable income.',
          verified: true,
          avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        },
      }),
      prisma.user.create({
        data: {
          email: 'mia.garcia@gmail.com',
          passwordHash,
          userType: 'student',
          firstName: 'Mia',
          lastName: 'Garcia',
          phone: '(619) 555-2004',
          bio: 'Healthcare professional seeking quiet neighborhood. No pets.',
          verified: true,
          avatarUrl:
            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
        },
      }),
      prisma.user.create({
        data: {
          email: 'tyler.brown@gmail.com',
          passwordHash,
          userType: 'student',
          firstName: 'Tyler',
          lastName: 'Brown',
          phone: '(619) 555-2005',
          bio: 'Recent grad, employed full-time. Looking for a 1-year lease.',
          verified: false,
          avatarUrl:
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        },
      }),
      prisma.user.create({
        data: {
          email: 'sophia.kim@gmail.com',
          passwordHash,
          userType: 'student',
          firstName: 'Sophia',
          lastName: 'Kim',
          phone: '(619) 555-2006',
          bio: 'Interior designer looking for a bright, airy space. Cat owner.',
          verified: true,
          avatarUrl:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        },
      }),
    ])

  // ─── LISTINGS ─────────────────────────────────────────────────
  console.log('Creating listings...')

  const listings = await Promise.all([
    // Sarah Chen — 3 listings
    prisma.listing.create({
      data: {
        title: 'Bright 2BR Apartment in Mission Valley',
        description:
          'Spacious 2-bedroom apartment on the 3rd floor with balcony views. Recently renovated kitchen with stainless steel appliances. Washer/dryer in unit. Close to shopping centers and major freeways. Easy commute anywhere in San Diego.',
        price: 2400,
        location: 'Mission Valley, San Diego, CA 92108',
        university: 'Mission Valley',
        moveInDate: new Date('2026-05-01'),
        moveOutDate: new Date('2027-05-01'),
        propertyType: 'Apartment',
        bedrooms: 2,
        bathrooms: 2,
        amenities: [
          'WiFi',
          'Laundry',
          'Parking',
          'AC',
          'Dishwasher',
          'Balcony',
        ],
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        ],
        ownerId: owner1.id,
        active: true,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Cozy Studio – Heart of Hillcrest',
        description:
          'Charming studio in the most walkable neighborhood in San Diego. Steps from restaurants, bars, shops, and Balboa Park. Hardwood floors, updated bathroom, large closet. Utilities included.',
        price: 1550,
        location: 'Hillcrest, San Diego, CA 92103',
        university: 'Hillcrest',
        moveInDate: new Date('2026-05-15'),
        propertyType: 'Studio',
        bedrooms: 0,
        bathrooms: 1,
        amenities: ['WiFi', 'Furnished', 'AC', 'Security'],
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        ],
        ownerId: owner1.id,
        active: true,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Modern 1BR Condo – Gaslamp Quarter',
        description:
          'Sleek, modern condo in the heart of downtown. High ceilings, floor-to-ceiling windows, city views. Building amenities include gym, rooftop deck, and concierge. Walking distance to Petco Park.',
        price: 2100,
        location: 'Gaslamp Quarter, San Diego, CA 92101',
        university: 'Downtown',
        moveInDate: new Date('2026-06-01'),
        propertyType: 'Condo',
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['WiFi', 'Gym', 'Parking', 'AC', 'Security', 'Elevator'],
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        ],
        ownerId: owner1.id,
        active: true,
      },
    }),

    // Mike Rodriguez — 3 listings
    prisma.listing.create({
      data: {
        title: 'Private Room in North Park Craftsman',
        description:
          'Furnished private room in a beautiful craftsman-style home. Shared common areas with 2 other professionals. Large backyard, covered parking, quiet street. North Park is vibrant with local coffee shops and art galleries.',
        price: 1050,
        location: 'North Park, San Diego, CA 92104',
        university: 'North Park',
        moveInDate: new Date('2026-05-01'),
        propertyType: 'SingleRoom',
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['WiFi', 'Furnished', 'Laundry', 'Garden', 'Parking'],
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        ],
        ownerId: owner2.id,
        active: true,
      },
    }),
    prisma.listing.create({
      data: {
        title: '3BR House – South Park / Golden Hill',
        description:
          'Spacious 3-bedroom Craftsman house with a large yard and 2-car garage. Updated kitchen, original hardwood floors throughout. Quiet, tree-lined street. Perfect for a group or family. No smoking. Pets considered.',
        price: 3200,
        location: 'South Park, San Diego, CA 92102',
        university: 'South Park',
        moveInDate: new Date('2026-06-15'),
        moveOutDate: new Date('2027-06-15'),
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 2,
        amenities: [
          'WiFi',
          'Laundry',
          'Parking',
          'Garden',
          'Pet-friendly',
          'Storage',
        ],
        images: [
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
          'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
        ],
        ownerId: owner2.id,
        active: true,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Stylish 1BR in Normal Heights',
        description:
          'Updated 1-bedroom apartment with designer finishes. Open concept living area, quartz countertops, stainless appliances. On-site parking and laundry. Close to 30th St restaurant row.',
        price: 1750,
        location: 'Normal Heights, San Diego, CA 92116',
        university: 'North Park',
        moveInDate: new Date('2026-05-01'),
        propertyType: 'Apartment',
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['WiFi', 'Laundry', 'Parking', 'AC', 'Dishwasher'],
        images: [
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        ],
        ownerId: owner2.id,
        active: true,
      },
    }),

    // Jennifer Park — 3 listings
    prisma.listing.create({
      data: {
        title: 'Beachside 2BR – Pacific Beach',
        description:
          'Just 2 blocks from the sand! Bright 2-bedroom with ocean breezes. Fully furnished option available. Rooftop deck with panoramic views. Walk to the boardwalk, shops, and nightlife. Summer availability — act fast.',
        price: 2950,
        location: 'Pacific Beach, San Diego, CA 92109',
        university: 'Pacific Beach',
        moveInDate: new Date('2026-06-01'),
        moveOutDate: new Date('2027-06-01'),
        propertyType: 'Apartment',
        bedrooms: 2,
        bathrooms: 1,
        amenities: ['WiFi', 'Furnished', 'Laundry', 'Balcony', 'AC', 'Parking'],
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
          'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
        ],
        ownerId: owner3.id,
        active: true,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Ocean View Studio – Bird Rock / La Jolla',
        description:
          'Rare ocean view studio in the charming Bird Rock neighborhood. Vaulted ceilings, updated kitchen, private patio. A 5-minute walk to the ocean. Quiet residential street. Ideal for one person.',
        price: 1900,
        location: 'Bird Rock, La Jolla, CA 92037',
        university: 'La Jolla',
        moveInDate: new Date('2026-05-15'),
        propertyType: 'Studio',
        bedrooms: 0,
        bathrooms: 1,
        amenities: ['WiFi', 'AC', 'Parking', 'Storage', 'Balcony'],
        images: [
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        ],
        ownerId: owner3.id,
        active: true,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Pet-Friendly 1BR – Mission Beach',
        description:
          'Light-filled 1-bedroom steps from Mission Beach boardwalk. Pet-friendly building (dogs welcome up to 50 lbs). New flooring, renovated bathroom, in-unit washer/dryer. Perfect for beach lovers.',
        price: 2200,
        location: 'Mission Beach, San Diego, CA 92109',
        university: 'Pacific Beach',
        moveInDate: new Date('2026-05-01'),
        propertyType: 'Apartment',
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['WiFi', 'Laundry', 'Pet-friendly', 'AC', 'Storage'],
        images: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
        ],
        ownerId: owner3.id,
        active: true,
      },
    }),

    // David Thompson — 3 listings
    prisma.listing.create({
      data: {
        title: 'Spacious 4BR Home – Mission Hills',
        description:
          'Stunning Mission Hills home with original 1920s character. 4 bedrooms, 2 full baths, formal dining room, sunroom, and landscaped backyard. Detached 2-car garage. Perfect for a large household.',
        price: 4200,
        location: 'Mission Hills, San Diego, CA 92103',
        university: 'Hillcrest',
        moveInDate: new Date('2026-07-01'),
        moveOutDate: new Date('2027-07-01'),
        propertyType: 'House',
        bedrooms: 4,
        bathrooms: 2,
        amenities: ['WiFi', 'Laundry', 'Parking', 'Garden', 'Storage', 'AC'],
        images: [
          'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
        ],
        ownerId: owner4.id,
        active: true,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Renovated 2BR in Ocean Beach',
        description:
          'Fully renovated 2-bedroom duplex in the eclectic OB neighborhood. New kitchen and baths, private backyard, and off-street parking. A short walk to the beach and Newport Avenue shops.',
        price: 2700,
        location: 'Ocean Beach, San Diego, CA 92107',
        university: 'Ocean Beach',
        moveInDate: new Date('2026-06-01'),
        propertyType: 'House',
        bedrooms: 2,
        bathrooms: 1,
        amenities: ['WiFi', 'Laundry', 'Parking', 'Garden', 'Pet-friendly'],
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
        ],
        ownerId: owner4.id,
        active: true,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Private Room – Kensington / College Area',
        description:
          'Furnished room in a well-maintained home shared with one other quiet professional. Private bathroom. Gated driveway, large backyard, near SDSU trolley stop.',
        price: 950,
        location: 'Kensington, San Diego, CA 92116',
        university: 'North Park',
        moveInDate: new Date('2026-05-01'),
        propertyType: 'SingleRoom',
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['WiFi', 'Furnished', 'Laundry', 'Parking', 'Garden'],
        images: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        ],
        ownerId: owner4.id,
        active: true,
      },
    }),

    // Lisa Martinez — 3 listings
    prisma.listing.create({
      data: {
        title: 'Luxury High-Rise 1BR – Downtown San Diego',
        description:
          'Premium corner unit on the 18th floor with stunning bay views. High-end finishes throughout — marble counters, spa bathroom, chef kitchen. Building has 24/7 concierge, heated pool, and wine storage.',
        price: 2800,
        location: 'East Village, San Diego, CA 92101',
        university: 'Downtown',
        moveInDate: new Date('2026-05-01'),
        propertyType: 'Condo',
        bedrooms: 1,
        bathrooms: 1,
        amenities: [
          'WiFi',
          'Gym',
          'Pool',
          'Parking',
          'Security',
          'Elevator',
          'AC',
          'Dishwasher',
        ],
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        ],
        ownerId: owner5.id,
        active: true,
      },
    }),
    prisma.listing.create({
      data: {
        title: '2BR with Den – Mission Valley West',
        description:
          'Rare 2BR + den floor plan — perfect for a home office. Gated complex with resort-style pool, fitness center, and tennis courts. Newly painted with new carpet. In-unit washer/dryer.',
        price: 2650,
        location: 'Mission Valley West, San Diego, CA 92110',
        university: 'Mission Valley',
        moveInDate: new Date('2026-06-01'),
        propertyType: 'Apartment',
        bedrooms: 2,
        bathrooms: 2,
        amenities: [
          'WiFi',
          'Laundry',
          'Parking',
          'Pool',
          'Gym',
          'AC',
          'Dishwasher',
        ],
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        ],
        ownerId: owner5.id,
        active: true,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Affordable Studio – Linda Vista',
        description:
          'Clean, move-in ready studio in a well-maintained complex. Great freeway access. On-site laundry and parking included in rent. Utilities (water/trash) included. Ideal for a single occupant.',
        price: 1350,
        location: 'Linda Vista, San Diego, CA 92111',
        university: 'Mission Valley',
        moveInDate: new Date('2026-05-01'),
        propertyType: 'Studio',
        bedrooms: 0,
        bathrooms: 1,
        amenities: ['WiFi', 'Laundry', 'Parking', 'AC'],
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
        ],
        ownerId: owner5.id,
        active: true,
      },
    }),
  ])

  const [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14, l15] =
    listings
  console.log(`Created ${listings.length} listings`)

  // ─── FAVORITES ────────────────────────────────────────────────
  await prisma.favorite.createMany({
    data: [
      { userId: tenant1.id, listingId: l1.id },
      { userId: tenant1.id, listingId: l3.id },
      { userId: tenant2.id, listingId: l7.id },
      { userId: tenant2.id, listingId: l9.id },
      { userId: tenant3.id, listingId: l4.id },
      { userId: tenant4.id, listingId: l8.id },
      { userId: tenant4.id, listingId: l13.id },
      { userId: tenant5.id, listingId: l5.id },
      { userId: tenant6.id, listingId: l7.id },
      { userId: tenant6.id, listingId: l2.id },
    ],
  })

  // ─── APPLICATIONS ─────────────────────────────────────────────
  console.log('Creating applications...')

  const app1 = await prisma.application.create({
    data: {
      listingId: l1.id,
      applicantId: tenant1.id,
      ownerId: owner1.id,
      status: 'pending',
      message:
        "Hi Sarah, I'm very interested in this apartment. I'm a working professional with stable income. Can we schedule a viewing?",
      startDate: new Date('2026-05-01'),
      endDate: new Date('2027-05-01'),
      emergencyContact: 'Jane Johnson (mother) – (619) 555-9999',
    },
  })

  const app2 = await prisma.application.create({
    data: {
      listingId: l7.id,
      applicantId: tenant2.id,
      ownerId: owner3.id,
      status: 'approved',
      message:
        "Hi Jennifer! Pacific Beach is my dream neighborhood. I'm quiet, tidy, and have excellent rental history.",
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-06-01'),
      emergencyContact: 'Robert Wilson (father) – (619) 555-8888',
    },
  })

  const app3 = await prisma.application.create({
    data: {
      listingId: l4.id,
      applicantId: tenant3.id,
      ownerId: owner2.id,
      status: 'pending',
      message:
        'I work from home and would love the quiet North Park vibe. Happy to provide references and pay first/last month up front.',
      startDate: new Date('2026-05-01'),
      endDate: new Date('2027-05-01'),
      emergencyContact: 'Chris Lee (spouse) – (619) 555-7777',
    },
  })

  const app4 = await prisma.application.create({
    data: {
      listingId: l13.id,
      applicantId: tenant4.id,
      ownerId: owner5.id,
      status: 'rejected',
      message:
        "Love this unit! I'm a nurse at Scripps, great credit score and rental history.",
      startDate: new Date('2026-05-01'),
      endDate: new Date('2027-05-01'),
      emergencyContact: 'Luis Garcia (brother) – (619) 555-6666',
    },
  })

  const app5 = await prisma.application.create({
    data: {
      listingId: l2.id,
      applicantId: tenant6.id,
      ownerId: owner1.id,
      status: 'pending',
      message:
        'Looking for a cozy studio in Hillcrest — this looks perfect. I design interiors for a living so I keep my space immaculate!',
      startDate: new Date('2026-05-15'),
      endDate: new Date('2027-05-15'),
      emergencyContact: 'James Kim (father) – (619) 555-5555',
    },
  })

  console.log('Created 5 applications')

  // ─── CONVERSATIONS & MESSAGES ─────────────────────────────────
  console.log('Creating conversations...')

  const convo1 = await prisma.conversation.create({
    data: {
      listingId: l1.id,
      users: {
        create: [{ userId: tenant1.id }, { userId: owner1.id, unreadCount: 1 }],
      },
    },
  })
  await prisma.message.createMany({
    data: [
      {
        conversationId: convo1.id,
        senderId: tenant1.id,
        content: 'Hi Sarah! Is the Mission Valley apartment still available?',
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        conversationId: convo1.id,
        senderId: owner1.id,
        content: 'Yes it is! Would you like to come see it this week?',
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        conversationId: convo1.id,
        senderId: tenant1.id,
        content: "That works! I'm free Thursday or Friday after 5pm.",
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 90 * 60 * 1000),
      },
      {
        conversationId: convo1.id,
        senderId: owner1.id,
        content:
          "Let's do Friday at 5:30pm. I'll text you the gate code day-of.",
        type: 'text',
        read: false,
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      },
    ],
  })

  const convo2 = await prisma.conversation.create({
    data: {
      listingId: l7.id,
      users: {
        create: [{ userId: tenant2.id }, { userId: owner3.id, unreadCount: 0 }],
      },
    },
  })
  await prisma.message.createMany({
    data: [
      {
        conversationId: convo2.id,
        senderId: tenant2.id,
        content:
          'Hi Jennifer! I applied for the Pacific Beach apartment. Just wanted to introduce myself.',
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        conversationId: convo2.id,
        senderId: owner3.id,
        content:
          "Hi Emma! I reviewed your application and it looks great. Welcome aboard! I'll send over the lease documents soon.",
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
      {
        conversationId: convo2.id,
        senderId: tenant2.id,
        content: 'Amazing, thank you so much! Really excited about this place.',
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      },
    ],
  })

  const convo3 = await prisma.conversation.create({
    data: {
      listingId: l4.id,
      users: {
        create: [{ userId: tenant3.id }, { userId: owner2.id, unreadCount: 2 }],
      },
    },
  })
  await prisma.message.createMany({
    data: [
      {
        conversationId: convo3.id,
        senderId: tenant3.id,
        content:
          "Hey Mike, I'm really interested in the North Park room. Do you allow remote workers?",
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        conversationId: convo3.id,
        senderId: owner2.id,
        content:
          'Absolutely, many of my tenants work from home. The house is quiet and has great WiFi.',
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        conversationId: convo3.id,
        senderId: tenant3.id,
        content: 'Perfect. Is there a desk or workspace in the room?',
        type: 'text',
        read: false,
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
      },
      {
        conversationId: convo3.id,
        senderId: tenant3.id,
        content: "Also, what's the earliest move-in date?",
        type: 'text',
        read: false,
        createdAt: new Date(Date.now() - 38 * 60 * 1000),
      },
    ],
  })

  const convo4 = await prisma.conversation.create({
    data: {
      listingId: l2.id,
      users: {
        create: [{ userId: tenant6.id }, { userId: owner1.id, unreadCount: 1 }],
      },
    },
  })
  await prisma.message.createMany({
    data: [
      {
        conversationId: convo4.id,
        senderId: tenant6.id,
        content:
          'Love the Hillcrest studio listing! Is it available for a May 15 move-in?',
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        conversationId: convo4.id,
        senderId: owner1.id,
        content:
          'Yes, May 15 works perfectly. Can you tell me a bit more about yourself?',
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        conversationId: convo4.id,
        senderId: tenant6.id,
        content:
          "Sure! I'm an interior designer, work from home mostly. I'm very neat and quiet. No smoking, no parties.",
        type: 'text',
        read: false,
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
    ],
  })

  // ─── REVIEWS ──────────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      {
        authorId: tenant2.id,
        subjectId: owner3.id,
        listingId: l7.id,
        rating: 5,
        comment:
          'Jennifer is an amazing landlord. Super responsive and the place was spotless on move-in.',
      },
      {
        authorId: tenant1.id,
        subjectId: owner1.id,
        listingId: l1.id,
        rating: 4,
        comment:
          'Sarah is professional and easy to communicate with. Minor maintenance issues were resolved quickly.',
      },
    ],
  })

  // ─── HOUSEMATE PROFILES (powers the Housemates tab) ──────────
  console.log('Creating housemate profiles...')
  await prisma.housemateProfile.createMany({
    data: [
      {
        userId: tenant1.id,
        audience: 'professional',
        age: 27,
        gender: 'woman',
        agePreferenceMin: 22,
        agePreferenceMax: 35,
        genderPreference: 'everyone',
        occupation: 'Working Professional',
        location: 'San Diego, CA',
        budgetMin: 1200,
        budgetMax: 1800,
        bio: 'Working professional, non-smoker. Tidy and easy-going housemate.',
        sleepSchedule: 'night',
        cleanliness: 'very',
        noiseTolerance: 'quiet',
        guestFrequency: 'rarely',
        tags: ['Non-smoker', 'Tidy', 'Quiet weekends'],
        lookingForRoom: true,
      },
      {
        userId: tenant2.id,
        audience: 'student',
        age: 24,
        gender: 'man',
        agePreferenceMin: 20,
        agePreferenceMax: 30,
        genderPreference: 'everyone',
        occupation: 'Graduate Student',
        location: 'San Diego, CA',
        budgetMin: 1000,
        budgetMax: 1500,
        bio: 'Quiet, clean, and responsible. Looking for a long-term place.',
        sleepSchedule: 'morning',
        cleanliness: 'very',
        noiseTolerance: 'quiet',
        guestFrequency: 'rarely',
        tags: ['Early riser', 'Very tidy', 'Studious'],
        lookingForRoom: true,
      },
    ],
  })
  console.log('Created 2 housemate profiles')

  console.log('✅ Database seeded successfully!')
  console.log('')
  console.log('📝 Demo Accounts (password: password123)')
  console.log('─'.repeat(50))
  console.log('LANDLORDS:')
  console.log('  sarah.chen@gmail.com       (3 listings)')
  console.log('  mike.rodriguez@gmail.com   (3 listings)')
  console.log('  jennifer.park@gmail.com    (3 listings)')
  console.log('  david.thompson@gmail.com   (3 listings)')
  console.log('  lisa.martinez@gmail.com    (3 listings)')
  console.log('')
  console.log('TENANTS:')
  console.log('  alex.johnson@gmail.com')
  console.log('  emma.wilson@gmail.com')
  console.log('  jordan.lee@gmail.com')
  console.log('  mia.garcia@gmail.com')
  console.log('  tyler.brown@gmail.com')
  console.log('  sophia.kim@gmail.com')
  console.log('─'.repeat(50))
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
