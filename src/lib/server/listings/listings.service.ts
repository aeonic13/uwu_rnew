import prisma from "$lib/server/prisma";
import type { CreateListingInput } from "./listings.schema";

export type PhotoInput = {
  imageUrl: string;
  orderIndex: number;
  isCover: boolean;
};

/**
 * Dev shortcut: until auth exists, every listing is owned by the first
 * property manager (created by `prisma/seed.ts`).
 */
export async function getDefaultPropManagerId(): Promise<string | null> {
  const profile = await prisma.propManagerProfile.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return profile?.id ?? null;
}

export async function createListing(
  propManagerId: string,
  input: CreateListingInput,
  photos: PhotoInput[]
) {
  return prisma.listing.create({
    data: {
      title: input.title,
      propManager: { connect: { id: propManagerId } },
      location: {
        create: {
          address: input.address,
          apartmentUnit: input.apartmentUnit,
          city: input.city,
          zip: input.zip,
          neighborhood: input.neighborhood,
          latitude: input.latitude,
          longitude: input.longitude,
          distanceToCampus: input.distanceToCampus,
          hideExactAddress: input.hideExactAddress,
        },
      },
      pricing: {
        create: {
          monthlyRent: input.monthlyRent,
          deposit: input.deposit,
          applicationFee: input.applicationFee,
          utilitiesIncluded: input.utilitiesIncluded,
          leaseType: input.leaseType,
          moveInDate: input.moveInDate,
          moveOutDate: input.moveOutDate,
        },
      },
      roomInfo: {
        create: {
          numberOfRooms: input.numberOfRooms,
          roomType: input.roomType,
          bathroomType: input.bathroomType,
          roommateCount: input.roommateCount,
        },
      },
      requirements: {
        create: {
          roommatesAllowed: input.roommatesAllowed,
          maxOccupants: input.maxOccupants,
          incomeRequirement: input.incomeRequirement,
          creditScoreMinimum: input.creditScoreMinimum,
          backgroundCheck: input.backgroundCheck,
          petsAllowed: input.petsAllowed,
          smokingAllowed: input.smokingAllowed,
          quietHours: input.quietHours,
        },
      },
      amenities: {
        create: {
          furnished: input.furnished,
          laundry: input.laundry,
          parking: input.parking,
          wifiIncluded: input.wifiIncluded,
          gasIncluded: input.gasIncluded,
          waterIncluded: input.waterIncluded,
        },
      },
      photos: photos.length ? { create: photos } : undefined,
    },
  });
}

export async function getListingById(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      location: true,
      pricing: true,
      roomInfo: true,
      requirements: true,
      amenities: true,
      photos: { orderBy: { orderIndex: "asc" } },
      propManager: { include: { user: true } },
    },
  });
}
