import prisma from "$lib/server/prisma";
import type { CreateListingInput } from "./listings.schema";

export type PhotoInput = {
  imageUrl: string;
  orderIndex: number;
  isCover: boolean;
};

/** Turn the textarea (one URL per line) into ordered photos; first is cover. */
export function parsePhotos(raw: Record<string, string>): PhotoInput[] {
  return (raw.photos ?? "")
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean)
    .map((imageUrl, index) => ({ imageUrl, orderIndex: index, isCover: index === 0 }));
}

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

function listingData(input: CreateListingInput) {
  return {
    title: input.title,
    address: input.address,
    apartmentUnit: input.apartmentUnit,
    city: input.city,
    zip: input.zip,
    neighborhood: input.neighborhood,
    latitude: input.latitude,
    longitude: input.longitude,
    distanceToCampus: input.distanceToCampus,
    hideExactAddress: input.hideExactAddress,
    monthlyRent: input.monthlyRent,
    deposit: input.deposit,
    applicationFee: input.applicationFee,
    utilitiesIncluded: input.utilitiesIncluded,
    leaseType: input.leaseType,
    moveInDate: input.moveInDate,
    moveOutDate: input.moveOutDate,
    numberOfRooms: input.numberOfRooms,
    roomType: input.roomType,
    bathroomType: input.bathroomType,
    roommateCount: input.roommateCount,
    roommatesAllowed: input.roommatesAllowed,
    maxOccupants: input.maxOccupants,
    incomeRequirement: input.incomeRequirement,
    creditScoreMinimum: input.creditScoreMinimum,
    backgroundCheck: input.backgroundCheck,
    petsAllowed: input.petsAllowed,
    smokingAllowed: input.smokingAllowed,
    quietHours: input.quietHours,
    furnished: input.furnished,
    laundry: input.laundry,
    parking: input.parking,
    wifiIncluded: input.wifiIncluded,
    gasIncluded: input.gasIncluded,
    waterIncluded: input.waterIncluded,
  };
}

/**
 * Create a listing from a fully-valid form. When `publish` is false the
 * listing is stored as a DRAFT (saved, but hidden from renters); when true it
 * goes live immediately. Both paths require the same validated input.
 */
export async function createListing(
  propManagerId: string,
  input: CreateListingInput,
  photos: PhotoInput[],
  publish: boolean
) {
  return prisma.listing.create({
    data: {
      ...listingData(input),
      propManager: { connect: { id: propManagerId } },
      status: publish ? "PUBLISHED" : "DRAFT",
      publishedAt: publish ? new Date() : null,
      photos: photos.length ? { create: photos } : undefined,
    },
  });
}

/**
 * Update an existing listing (used when reopening a saved draft to add photos
 * or fix details). When `publish` is true the listing also goes live.
 */
export async function updateListing(
  id: string,
  input: CreateListingInput,
  photos: PhotoInput[],
  publish: boolean
) {
  return prisma.listing.update({
    where: { id },
    data: {
      ...listingData(input),
      ...(publish ? { status: "PUBLISHED", publishedAt: new Date() } : {}),
      photos: { deleteMany: {}, ...(photos.length ? { create: photos } : {}) },
    },
  });
}

/** Flip a saved draft live without re-editing it. */
export async function publishListing(id: string) {
  return prisma.listing.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}

export async function getListingById(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { orderIndex: "asc" } },
      propManager: { include: { user: true } },
    },
  });
}

export async function deleteListing(id: string) {
  return prisma.listing.delete({ where: { id } });
}
