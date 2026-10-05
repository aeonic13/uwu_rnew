import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...')
  await prisma.tenantInvite.deleteMany()
  await prisma.autopaySchedule.deleteMany()
  await prisma.rentSplit.deleteMany()
  await prisma.securityDeposit.deleteMany()
  await prisma.agreementSigner.deleteMany()
  await prisma.maintenanceTicket.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.document.deleteMany()
  await prisma.group.deleteMany()
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
  // Street addresses and coordinates below are sample data for the Browse
  // map: plausible San Diego streets in each neighborhood, not real rentals.
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
        streetAddress: '7510 Hazard Center Dr, San Diego, CA 92108',
        latitude: 32.7712,
        longitude: -117.1584,
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
        streetAddress: '3845 Fourth Ave, San Diego, CA 92103',
        latitude: 32.7478,
        longitude: -117.1612,
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
        streetAddress: '555 Market St, San Diego, CA 92101',
        latitude: 32.7118,
        longitude: -117.16,
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
        streetAddress: '3025 University Ave, San Diego, CA 92104',
        latitude: 32.7486,
        longitude: -117.1301,
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
        streetAddress: '2246 Fern St, San Diego, CA 92102',
        latitude: 32.7281,
        longitude: -117.128,
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
        streetAddress: '4680 Felton St, San Diego, CA 92116',
        latitude: 32.7607,
        longitude: -117.121,
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
        streetAddress: '1245 Grand Ave, San Diego, CA 92109',
        latitude: 32.7948,
        longitude: -117.245,
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
        streetAddress: '5620 La Jolla Blvd, La Jolla, CA 92037',
        latitude: 32.814,
        longitude: -117.2735,
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
        streetAddress: '3160 Mission Blvd, San Diego, CA 92109',
        latitude: 32.7705,
        longitude: -117.2525,
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
        streetAddress: '1810 W Washington St, San Diego, CA 92103',
        latitude: 32.7499,
        longitude: -117.1818,
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
        streetAddress: '4855 Newport Ave, San Diego, CA 92107',
        latitude: 32.7478,
        longitude: -117.2492,
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
        streetAddress: '4120 Adams Ave, San Diego, CA 92116',
        latitude: 32.7627,
        longitude: -117.1047,
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
        streetAddress: '1050 Island Ave, San Diego, CA 92101',
        latitude: 32.7095,
        longitude: -117.1535,
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
        streetAddress: '5555 Friars Rd, San Diego, CA 92110',
        latitude: 32.7625,
        longitude: -117.1935,
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
        streetAddress: '6950 Linda Vista Rd, San Diego, CA 92111',
        latitude: 32.7832,
        longitude: -117.176,
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

  // ─── LANDLORD DEMO (Jennifer Park's portfolio) ────────────────
  // Everything the owner screens read, on one account: a leased unit with a
  // roommate-group lease, an occupied unit mid-onboarding (one tenant
  // confirmed, one invite outstanding), and two listed units with
  // individual and roommate-group applicants. Log in as
  // jennifer.park@gmail.com to see all of it.
  console.log('Creating landlord demo data (Jennifer Park)...')

  const now = new Date()
  const DAY = 24 * 60 * 60 * 1000
  const daysAgo = n => new Date(now.getTime() - n * DAY)
  const daysFromNow = n => new Date(now.getTime() + n * DAY)
  // 9am on the given day of a month `monthsBack` months ago.
  const onDay = (monthsBack, dayOfMonth) =>
    new Date(now.getFullYear(), now.getMonth() - monthsBack, dayOfMonth, 9)
  const landlordName = `${owner3.firstName} ${owner3.lastName}`
  const rentalProfile = (overrides = {}) => ({
    currentAddress: '4120 Cass St, San Diego, CA 92109',
    timeAtAddress: '2 years',
    currentLandlordName: 'Patricia Moore',
    currentLandlordPhone: '(619) 555-4040',
    currentRent: '$1,650',
    reasonForLeaving: 'Lease ending, want to be closer to campus',
    previousAddress: '9500 Gilman Dr, La Jolla, CA 92093',
    employer: 'UC San Diego',
    jobTitle: 'Research assistant',
    employmentLength: '1 year',
    workPhone: '(858) 555-3030',
    monthlyIncome: '$3,200',
    otherIncome: 'None',
    occupants: '1',
    pets: 'None',
    vehicles: '1 car',
    everEvicted: false,
    brokenLease: false,
    felony: false,
    smoker: false,
    ...overrides,
  })

  // Screening facts on the seeded tenants so applicant cards show real numbers.
  await Promise.all([
    prisma.user.update({
      where: { id: tenant1.id },
      data: {
        university: 'SDSU',
        year: 'Alumni',
        creditScore: 712,
        creditTier: 'Good',
      },
    }),
    prisma.user.update({
      where: { id: tenant2.id },
      data: {
        university: 'UCSD',
        year: 'Graduate',
        creditScore: 745,
        creditTier: 'Good',
      },
    }),
    prisma.user.update({
      where: { id: tenant3.id },
      data: {
        university: 'UCSD',
        year: 'Senior',
        creditScore: 705,
        creditTier: 'Good',
      },
    }),
    prisma.user.update({
      where: { id: tenant4.id },
      data: {
        university: 'SDSU',
        year: 'Junior',
        creditScore: 688,
        creditTier: 'Fair',
      },
    }),
    prisma.user.update({
      where: { id: tenant5.id },
      data: {
        university: 'USD',
        year: 'Alumni',
        creditScore: 672,
        creditTier: 'Fair',
      },
    }),
    prisma.user.update({
      where: { id: tenant6.id },
      data: {
        university: 'SDSU',
        year: 'Senior',
        creditScore: 761,
        creditTier: 'Excellent',
      },
    }),
  ])

  // A few more people so every state has a face.
  const [noah, priya, marcus, chloe, linda] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'noah.carter@gmail.com',
        passwordHash,
        userType: 'student',
        firstName: 'Noah',
        lastName: 'Carter',
        phone: '(619) 555-2007',
        university: 'SDSU',
        year: 'Senior',
        creditScore: 702,
        creditTier: 'Good',
        bio: 'Current tenant in Mission Beach. Surfer, early riser.',
        verified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'priya.patel@gmail.com',
        passwordHash,
        userType: 'student',
        firstName: 'Priya',
        lastName: 'Patel',
        phone: '(858) 555-2008',
        university: 'UCSD',
        year: 'Graduate',
        creditScore: 742,
        creditTier: 'Good',
        bio: 'PhD student in bioengineering. Quiet, tidy, no pets.',
        verified: true,
        rentalProfile: rentalProfile({
          employer: 'Qualcomm',
          jobTitle: 'UX designer (part-time) + PhD stipend',
          monthlyIncome: '$6,100',
        }),
      },
    }),
    prisma.user.create({
      data: {
        email: 'marcus.lee@gmail.com',
        passwordHash,
        userType: 'student',
        firstName: 'Marcus',
        lastName: 'Lee',
        phone: '(619) 555-2009',
        university: 'USD',
        year: 'Junior',
        creditScore: 651,
        creditTier: 'Fair',
        bio: 'Business major, campus job. My mom is co-signing.',
        verified: true,
        rentalProfile: rentalProfile({
          employer: 'USD Campus Recreation',
          jobTitle: 'Front desk (part-time)',
          monthlyIncome: '$1,400',
          otherIncome: 'Parent support $1,200/mo',
        }),
      },
    }),
    prisma.user.create({
      data: {
        email: 'chloe.nguyen@gmail.com',
        passwordHash,
        userType: 'student',
        firstName: 'Chloe',
        lastName: 'Nguyen',
        phone: '(858) 555-2010',
        university: 'UCSD',
        year: 'Junior',
        creditScore: 731,
        creditTier: 'Good',
        bio: 'Cognitive science major. Looking for a house with friends.',
        verified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'linda.lee@gmail.com',
        passwordHash,
        userType: 'cosigner',
        firstName: 'Linda',
        lastName: 'Lee',
        phone: '(626) 555-0101',
        verified: true,
      },
    }),
  ])

  // One more listing for Jennifer so a 3-person group has somewhere to apply.
  const l16 = await prisma.listing.create({
    data: {
      title: 'Sunny 3BR Townhome – Pacific Beach',
      description:
        'Two-story townhome three blocks from the bay. Three bedrooms, two and a half baths, in-unit laundry, private patio and a two-car garage. Ideal for a group of roommates. No smoking.',
      price: 4500,
      location: 'Pacific Beach, San Diego, CA 92109',
      streetAddress: '1835 Reed Ave, San Diego, CA 92109',
      latitude: 32.7945,
      longitude: -117.2412,
      university: 'Pacific Beach',
      moveInDate: new Date('2026-11-01'),
      moveOutDate: new Date('2027-10-31'),
      propertyType: 'House',
      bedrooms: 3,
      bathrooms: 2.5,
      amenities: [
        'In-unit laundry',
        'Garage',
        'Patio',
        'Dishwasher',
        'Central AC',
      ],
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      ],
      ownerId: owner3.id,
    },
  })

  // 1. Beachside 2BR (l7) — LEASED to a roommate group on a Rentra lease.
  //    Emma's seeded approved application becomes the lead of a household
  //    lease with Alex; equal split, deposit held, rent paid since June.
  const beachHouse = await prisma.group.create({
    data: {
      name: 'PB Beach House',
      description: 'Emma + Alex',
      maxMembers: 2,
      createdById: tenant2.id,
      members: {
        create: [
          { userId: tenant2.id, role: 'admin' },
          { userId: tenant1.id, role: 'member' },
        ],
      },
    },
  })
  const beachStart = new Date('2026-06-01')
  const beachEnd = new Date('2027-06-01')
  await prisma.application.update({
    where: { id: app2.id },
    data: {
      groupId: beachHouse.id,
      createdAt: daysAgo(140),
      employmentStatus: 'Graduate student + teaching assistant',
      references: ['Patricia Moore (prior landlord) – (619) 555-4040'],
      verificationData: {
        groupApplication: true,
        submittedBy: tenant2.id,
        bankConnected: true,
        incomeVerified: true,
        monthlyIncome: 3700,
        identityVerified: true,
        applicationFeePaid: true,
        rentalProfile: rentalProfile({ monthlyIncome: '$3,700' }),
      },
    },
  })
  const alexApp = await prisma.application.create({
    data: {
      listingId: l7.id,
      applicantId: tenant1.id,
      ownerId: owner3.id,
      groupId: beachHouse.id,
      status: 'approved',
      startDate: beachStart,
      endDate: beachEnd,
      message: 'Applying as part of group "PB Beach House"',
      employmentStatus: 'Full-time – account manager',
      createdAt: daysAgo(140),
      verificationData: {
        groupApplication: true,
        submittedBy: tenant2.id,
        bankConnected: true,
        incomeVerified: true,
        monthlyIncome: 5200,
        identityVerified: true,
        applicationFeePaid: true,
        rentalProfile: rentalProfile({
          employer: 'Illumina',
          jobTitle: 'Account manager',
          employmentLength: '3 years',
          monthlyIncome: '$5,200',
        }),
      },
    },
  })
  const beachShare = l7.price / 2
  const beachLease = await prisma.agreement.create({
    data: {
      applicationId: app2.id,
      groupId: beachHouse.id,
      source: 'rentra',
      monthlyRent: l7.price,
      securityDeposit: l7.price,
      startDate: beachStart,
      endDate: beachEnd,
      terms: {
        petPolicy: 'No pets',
        utilities:
          'Tenants pay electricity and internet; water and trash included',
        lateFee: '$50 after the 5th',
        parking: 'One assigned space',
      },
      tenantSigned: true,
      tenantSignedAt: daysAgo(135),
      landlordSigned: true,
      landlordSignedAt: daysAgo(134),
      signers: {
        create: [
          {
            role: 'tenant',
            userId: tenant2.id,
            applicationId: app2.id,
            signed: true,
            signedAt: daysAgo(135),
            signatureName: 'Emma Wilson',
          },
          {
            role: 'tenant',
            userId: tenant1.id,
            applicationId: alexApp.id,
            signed: true,
            signedAt: daysAgo(135),
            signatureName: 'Alex Johnson',
          },
          {
            role: 'landlord',
            userId: owner3.id,
            signed: true,
            signedAt: daysAgo(134),
            signatureName: landlordName,
          },
        ],
      },
      rentSplit: {
        create: {
          createdById: tenant2.id,
          total: l7.price,
          splitMode: 'equal',
          shares: {
            create: [
              { userId: tenant2.id, name: 'Emma Wilson', amount: beachShare },
              { userId: tenant1.id, name: 'Alex Johnson', amount: beachShare },
            ],
          },
        },
      },
      deposit: {
        create: {
          ownerId: owner3.id,
          amountHeld: l7.price,
          state: 'CA',
          status: 'holding',
        },
      },
      autopays: {
        create: [
          {
            userId: tenant2.id,
            amount: beachShare,
            dayOfMonth: 1,
            nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 1, 9),
            lastRunAt: onDay(0, 1),
          },
        ],
      },
    },
  })
  await prisma.application.updateMany({
    where: { id: { in: [app2.id, alexApp.id] } },
    data: { agreementId: beachLease.id },
  })

  // Rent history since June: Emma is paid up (autopay), Alex's current
  // month is still processing so the rent roll shows a partial month.
  const beachPayments = []
  for (let monthsBack = 4; monthsBack >= 0; monthsBack -= 1) {
    beachPayments.push({
      userId: tenant2.id,
      applicationId: app2.id,
      amount: beachShare,
      serviceFee: 0,
      total: beachShare,
      status: 'completed',
      paymentMethod: 'ach',
      createdAt: onDay(monthsBack, 1),
    })
    beachPayments.push({
      userId: tenant1.id,
      applicationId: alexApp.id,
      amount: beachShare,
      serviceFee: 0,
      total: beachShare,
      status: monthsBack === 0 ? 'processing' : 'completed',
      paymentMethod: 'ach',
      createdAt: onDay(monthsBack, monthsBack === 0 ? 3 : 2),
    })
  }
  await prisma.transaction.createMany({ data: beachPayments })

  await prisma.maintenanceTicket.createMany({
    data: [
      {
        listingId: l7.id,
        tenantId: tenant2.id,
        category: 'Plumbing',
        description:
          'Kitchen sink drains slowly and there is a drip under the cabinet.',
        priority: 'high',
        status: 'pending',
        createdAt: daysAgo(3),
      },
      {
        listingId: l7.id,
        tenantId: tenant1.id,
        category: 'Appliance',
        description: 'Dryer runs but does not heat.',
        priority: 'medium',
        status: 'in-progress',
        assignedTo: 'Pacific Appliance Repair',
        createdAt: daysAgo(9),
      },
      {
        listingId: l7.id,
        tenantId: tenant2.id,
        category: 'Electrical',
        description: 'Bedroom outlet by the closet stopped working.',
        priority: 'low',
        status: 'completed',
        completedAt: daysAgo(40),
        createdAt: daysAgo(45),
      },
    ],
  })

  // 2. Pet-Friendly 1BR (l9) — OCCUPIED, lease signed off-platform and
  //    imported through the onboarding flow. Noah confirmed; Olivia's
  //    invite is still open. Month-to-month, so endDate is the stand-in
  //    next anniversary the hourly runner rolls forward.
  const mbStart = new Date('2025-09-01')
  const mbEnd = new Date('2027-09-01')
  const onboardedRow = {
    listingId: l9.id,
    ownerId: owner3.id,
    applicantId: null,
    status: 'approved',
    source: 'onboarded',
    startDate: mbStart,
    endDate: mbEnd,
    message: null,
    createdAt: daysAgo(6),
  }
  const noahApp = await prisma.application.create({
    data: { ...onboardedRow, applicantId: noah.id },
  })
  const oliviaApp = await prisma.application.create({ data: onboardedRow })
  const mbShare = l9.price / 2
  const mbLease = await prisma.agreement.create({
    data: {
      applicationId: noahApp.id,
      source: 'imported',
      monthToMonth: true,
      monthlyRent: l9.price,
      securityDeposit: l9.price,
      startDate: mbStart,
      endDate: mbEnd,
      terms: {
        importedLease: true,
        attestedBy: landlordName,
        attestedAt: daysAgo(6).toISOString(),
        utilities: 'As stated in the signed lease.',
        petPolicy: 'As stated in the signed lease.',
      },
      landlordSigned: true,
      landlordSignedAt: daysAgo(6),
      signers: {
        create: [
          {
            role: 'tenant',
            userId: noah.id,
            applicationId: noahApp.id,
            signed: true,
            signedAt: daysAgo(4),
            signatureName: 'Noah Carter',
          },
          { role: 'tenant', userId: null, applicationId: oliviaApp.id },
          {
            role: 'landlord',
            userId: owner3.id,
            signed: true,
            signedAt: daysAgo(6),
            signatureName: landlordName,
          },
        ],
      },
      rentSplit: {
        create: {
          createdById: owner3.id,
          total: l9.price,
          splitMode: 'equal',
          shares: {
            create: [
              { userId: noah.id, name: 'Noah Carter', amount: mbShare },
              { userId: null, name: 'Olivia Reyes', amount: mbShare },
            ],
          },
        },
      },
      deposit: {
        create: { ownerId: owner3.id, amountHeld: l9.price, state: 'CA' },
      },
    },
  })
  await prisma.application.updateMany({
    where: { id: { in: [noahApp.id, oliviaApp.id] } },
    data: { agreementId: mbLease.id },
  })
  // Fixed tokens so the accept page can be opened straight from the seed log.
  const OLIVIA_INVITE_TOKEN = 'demo-olivia-reyes-mission-beach'
  await prisma.tenantInvite.createMany({
    data: [
      {
        token: 'demo-noah-carter-mission-beach',
        email: noah.email,
        firstName: 'Noah',
        lastName: 'Carter',
        phone: noah.phone,
        status: 'accepted',
        expiresAt: daysFromNow(24),
        respondedAt: daysAgo(4),
        listingId: l9.id,
        ownerId: owner3.id,
        agreementId: mbLease.id,
        applicationId: noahApp.id,
        acceptedUserId: noah.id,
        createdAt: daysAgo(6),
      },
      {
        token: OLIVIA_INVITE_TOKEN,
        email: 'olivia.reyes@gmail.com',
        firstName: 'Olivia',
        lastName: 'Reyes',
        phone: '(619) 555-2011',
        status: 'pending',
        expiresAt: daysFromNow(24),
        listingId: l9.id,
        ownerId: owner3.id,
        agreementId: mbLease.id,
        applicationId: oliviaApp.id,
        createdAt: daysAgo(6),
      },
    ],
  })
  await prisma.transaction.createMany({
    data: [1, 0].map(monthsBack => ({
      userId: noah.id,
      applicationId: noahApp.id,
      amount: mbShare,
      serviceFee: 0,
      total: mbShare,
      status: 'completed',
      paymentMethod: 'ach',
      createdAt: onDay(monthsBack, 1),
    })),
  })
  await prisma.maintenanceTicket.create({
    data: {
      listingId: l9.id,
      tenantId: noah.id,
      category: 'Pest control',
      description: 'Ants in the kitchen near the patio door.',
      priority: 'medium',
      status: 'pending',
      createdAt: daysAgo(1),
    },
  })

  // 3. Ocean View Studio (l8) — LISTED with two individual applicants.
  await prisma.application.createMany({
    data: [
      {
        listingId: l8.id,
        applicantId: priya.id,
        ownerId: owner3.id,
        status: 'pending',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2027-10-31'),
        message:
          "Hi Jennifer, I'm a PhD student at UCSD and would love a quiet place in Bird Rock. Happy to share references and tour any afternoon this week.",
        emergencyContact: 'Anand Patel (father) – (408) 555-9090',
        employmentStatus: 'Part-time UX designer + PhD stipend',
        references: [
          'Patricia Moore (prior landlord) – (619) 555-4040',
          'Dr. Sam Okafor (advisor) – (858) 555-3030',
        ],
        tourStatus: 'requested',
        createdAt: daysAgo(2),
        verificationData: {
          bankConnected: true,
          incomeVerified: true,
          monthlyIncome: 6100,
          identityVerified: true,
          applicationFeePaid: true,
          rentalProfile: priya.rentalProfile,
        },
      },
      {
        listingId: l8.id,
        applicantId: tenant6.id,
        ownerId: owner3.id,
        status: 'pending',
        startDate: new Date('2026-11-15'),
        endDate: new Date('2027-11-15'),
        message:
          'The ocean view sold me. I design interiors and work from home a few days a week.',
        emergencyContact: 'James Kim (father) – (619) 555-5555',
        employmentStatus: 'Freelance interior designer',
        tourStatus: 'scheduled',
        tourDate: daysFromNow(2),
        createdAt: daysAgo(5),
        verificationData: {
          bankConnected: true,
          incomeVerified: true,
          monthlyIncome: 4200,
          identityVerified: true,
          applicationFeePaid: true,
          rentalProfile: rentalProfile({
            employer: 'Self-employed',
            jobTitle: 'Interior designer',
            employmentLength: '4 years',
            monthlyIncome: '$4,200',
            pets: '1 cat',
          }),
        },
      },
    ],
  })

  // 4. Sunny 3BR Townhome (l16) — LISTED with a roommate group of three,
  //    one individual applicant backed by a co-signer, and one rejection.
  const studySquad = await prisma.group.create({
    data: {
      name: 'PB Study Squad',
      description: 'Jordan, Mia and Chloe',
      maxMembers: 3,
      createdById: tenant3.id,
      members: {
        create: [
          { userId: tenant3.id, role: 'admin' },
          { userId: tenant4.id, role: 'member' },
          { userId: chloe.id, role: 'member' },
        ],
      },
    },
  })
  const squadRow = (user, monthlyIncome, extra = {}) => ({
    listingId: l16.id,
    applicantId: user.id,
    ownerId: owner3.id,
    groupId: studySquad.id,
    status: 'pending',
    startDate: new Date('2026-11-01'),
    endDate: new Date('2027-10-31'),
    message: 'Applying as part of group "PB Study Squad"',
    createdAt: daysAgo(4),
    verificationData: {
      groupApplication: true,
      submittedBy: tenant3.id,
      bankConnected: true,
      incomeVerified: true,
      monthlyIncome,
      identityVerified: true,
      applicationFeePaid: true,
      rentalProfile: rentalProfile({
        monthlyIncome: `$${monthlyIncome.toLocaleString()}`,
        ...extra,
      }),
    },
  })
  await prisma.application.createMany({
    data: [
      squadRow(tenant3, 5400, {
        employer: 'ServiceNow',
        jobTitle: 'Software engineering intern',
      }),
      squadRow(tenant4, 4600, {
        employer: 'Scripps Health',
        jobTitle: 'Nursing assistant',
      }),
      squadRow(chloe, 3800, {
        employer: 'UCSD Library',
        jobTitle: 'Student assistant',
        otherIncome: 'Parent support $1,000/mo',
      }),
    ],
  })

  const marcusApp = await prisma.application.create({
    data: {
      listingId: l16.id,
      applicantId: marcus.id,
      ownerId: owner3.id,
      status: 'pending',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2027-10-31'),
      message:
        "Hi! I'd take the townhome with two friends from USD who will join the lease once approved. My mom is co-signing and has already verified her income.",
      emergencyContact: 'Linda Lee (mother) – (626) 555-0101',
      employmentStatus: 'Part-time campus job',
      createdAt: daysAgo(1),
      verificationData: {
        bankConnected: true,
        incomeVerified: true,
        monthlyIncome: 1400,
        identityVerified: true,
        applicationFeePaid: true,
        rentalProfile: marcus.rentalProfile,
      },
    },
  })
  await prisma.cosigner.create({
    data: {
      applicationId: marcusApp.id,
      tenantId: marcus.id,
      cosignerId: linda.id,
      status: 'accepted',
      relationshipType: 'parent',
      inviteEmail: linda.email,
      inviteToken: 'demo-linda-lee-cosigner',
      tokenExpires: daysFromNow(30),
      invitedAt: daysAgo(1),
      respondedAt: daysAgo(1),
      verifiedMonthlyIncome: 12400,
      incomeVerifiedAt: daysAgo(1),
    },
  })
  await prisma.application.create({
    data: {
      listingId: l16.id,
      applicantId: tenant5.id,
      ownerId: owner3.id,
      status: 'rejected',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2027-05-01'),
      message: 'Looking for a 6-month lease while I finish my contract.',
      employmentStatus: 'Contract – logistics coordinator',
      createdAt: daysAgo(8),
      verificationData: {
        bankConnected: true,
        incomeVerified: true,
        monthlyIncome: 3100,
        identityVerified: true,
        applicationFeePaid: false,
      },
    },
  })

  // Bookkeeping: this year's expenses across the portfolio (Schedule E
  // categories) and the document index. Receipt/document links point at
  // Cloudinary's public demo asset because local trials have no upload keys.
  const DEMO_FILE = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
  await prisma.expense.createMany({
    data: [
      {
        ownerId: owner3.id,
        listingId: l7.id,
        date: daysAgo(2),
        amount: 185,
        category: 'repairs',
        description: 'Plumber – kitchen sink P-trap and drain snake',
        vendor: 'Bay Park Plumbing',
        receiptUrl: DEMO_FILE,
      },
      {
        ownerId: owner3.id,
        listingId: l7.id,
        date: daysAgo(120),
        amount: 240,
        category: 'cleaning_maintenance',
        description: 'Move-in deep clean',
        vendor: 'Coastal Cleaners',
      },
      {
        ownerId: owner3.id,
        listingId: l7.id,
        date: onDay(1, 15),
        amount: 1620,
        category: 'mortgage_interest',
        description: 'Mortgage interest – last month',
        vendor: 'Wells Fargo',
      },
      {
        ownerId: owner3.id,
        listingId: l9.id,
        date: daysAgo(20),
        amount: 95,
        category: 'utilities',
        description: 'Water and trash',
        vendor: 'City of San Diego',
      },
      {
        ownerId: owner3.id,
        listingId: l9.id,
        date: daysAgo(60),
        amount: 430,
        category: 'repairs',
        description: 'Replace garbage disposal',
        vendor: 'Bay Park Plumbing',
        receiptUrl: DEMO_FILE,
      },
      {
        ownerId: owner3.id,
        listingId: l8.id,
        date: daysAgo(12),
        amount: 75,
        category: 'advertising',
        description: 'Listing photos',
        vendor: 'Snap SD Photography',
      },
      {
        ownerId: owner3.id,
        listingId: l16.id,
        date: daysAgo(6),
        amount: 350,
        category: 'cleaning_maintenance',
        description: 'Pre-listing clean and carpet shampoo',
        vendor: 'Coastal Cleaners',
      },
      {
        ownerId: owner3.id,
        listingId: null,
        date: new Date(now.getFullYear(), 0, 12),
        amount: 1890,
        category: 'insurance',
        description: 'Landlord insurance – annual premium (all units)',
        vendor: 'State Farm',
      },
      {
        ownerId: owner3.id,
        listingId: null,
        date: new Date(now.getFullYear(), 3, 10),
        amount: 6400,
        category: 'taxes',
        description: 'Property tax – second installment',
        vendor: 'San Diego County Treasurer',
      },
      {
        ownerId: owner3.id,
        listingId: null,
        date: daysAgo(30),
        amount: 325,
        category: 'legal_professional',
        description: 'Lease review',
        vendor: 'Harbor Legal',
      },
    ],
  })
  await prisma.document.createMany({
    data: [
      {
        ownerId: owner3.id,
        listingId: l7.id,
        name: 'Lease – Beachside 2BR – Jun 2026 to Jun 2027.pdf',
        category: 'lease',
        url: DEMO_FILE,
        mimeType: 'application/pdf',
        size: 182400,
        createdAt: daysAgo(134),
      },
      {
        ownerId: owner3.id,
        listingId: l7.id,
        name: 'Move-in inspection – Beachside 2BR.pdf',
        category: 'inspection',
        url: DEMO_FILE,
        mimeType: 'application/pdf',
        size: 2140000,
        createdAt: daysAgo(126),
      },
      {
        ownerId: owner3.id,
        listingId: l9.id,
        name: 'Lease – Mission Beach 1BR – signed 2025.pdf',
        category: 'lease',
        url: DEMO_FILE,
        mimeType: 'application/pdf',
        size: 164000,
        createdAt: daysAgo(6),
      },
      {
        ownerId: owner3.id,
        listingId: l7.id,
        name: 'Receipt – Bay Park Plumbing.jpg',
        category: 'receipt',
        url: DEMO_FILE,
        mimeType: 'image/jpeg',
        size: 420000,
        createdAt: daysAgo(2),
      },
      {
        ownerId: owner3.id,
        listingId: null,
        name: 'Landlord insurance policy 2026.pdf',
        category: 'insurance',
        url: DEMO_FILE,
        mimeType: 'application/pdf',
        size: 910000,
        createdAt: new Date(now.getFullYear(), 0, 12),
      },
    ],
  })

  console.log('Created landlord demo data')
  console.log(
    `  Olivia's open tenant invite: ${process.env.CLIENT_URL || 'http://localhost:3000'}/tenant-invite/${OLIVIA_INVITE_TOKEN}`
  )

  console.log('✅ Database seeded successfully!')
  console.log('')
  console.log('📝 Demo Accounts (password: password123)')
  console.log('─'.repeat(50))
  console.log('LANDLORDS:')
  console.log('  sarah.chen@gmail.com       (3 listings)')
  console.log('  mike.rodriguez@gmail.com   (3 listings)')
  console.log(
    '  jennifer.park@gmail.com    (4 listings — full landlord demo: leased, onboarding, applicants)'
  )
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
  console.log('  noah.carter@gmail.com      (onboarded tenant, Mission Beach)')
  console.log('  priya.patel@gmail.com      (applicant, Ocean View Studio)')
  console.log(
    '  marcus.lee@gmail.com       (applicant; co-signer linda.lee@gmail.com)'
  )
  console.log('  chloe.nguyen@gmail.com     (PB Study Squad group member)')
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
