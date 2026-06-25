import { error, fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { createListingSchema } from "$lib/server/listings/listings.schema";
import {
  deleteListing,
  getListingById,
  parsePhotos,
  updateListing,
} from "$lib/server/listings/listings.service";

const bool = (v: boolean | null | undefined) => (v ? "on" : "");
const str = (v: unknown) => (v == null ? "" : String(v));
const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

type LoadedListing = NonNullable<Awaited<ReturnType<typeof getListingById>>>;

function toFormValues(listing: LoadedListing): Record<string, string> {
  return {
    title: str(listing.title),
    address: str(listing.address),
    apartmentUnit: str(listing.apartmentUnit),
    city: str(listing.city),
    zip: str(listing.zip),
    neighborhood: str(listing.neighborhood),
    distanceToCampus: str(listing.distanceToCampus),
    hideExactAddress: bool(listing.hideExactAddress),
    monthlyRent: str(listing.monthlyRent),
    deposit: str(listing.deposit),
    applicationFee: str(listing.applicationFee),
    utilitiesIncluded: bool(listing.utilitiesIncluded),
    leaseType: str(listing.leaseType),
    moveInDate: day(listing.moveInDate),
    moveOutDate: day(listing.moveOutDate),
    numberOfRooms: str(listing.numberOfRooms),
    roommateCount: str(listing.roommateCount),
    roomType: str(listing.roomType),
    bathroomType: str(listing.bathroomType),
    maxOccupants: str(listing.maxOccupants),
    incomeRequirement: str(listing.incomeRequirement),
    creditScoreMinimum: str(listing.creditScoreMinimum),
    quietHours: str(listing.quietHours),
    roommatesAllowed: bool(listing.roommatesAllowed),
    backgroundCheck: bool(listing.backgroundCheck),
    petsAllowed: bool(listing.petsAllowed),
    smokingAllowed: bool(listing.smokingAllowed),
    furnished: bool(listing.furnished),
    laundry: bool(listing.laundry),
    parking: bool(listing.parking),
    wifiIncluded: bool(listing.wifiIncluded),
    gasIncluded: bool(listing.gasIncluded),
    waterIncluded: bool(listing.waterIncluded),
    photos: listing.photos.map((p) => p.imageUrl).join("\n"),
  };
}

export const load: PageServerLoad = async ({ params }) => {
  const listing = await getListingById(params.id);
  if (!listing) {
    error(404, "Listing not found");
  }
  return { values: toFormValues(listing), status: listing.status, listingId: listing.id };
};

async function save(request: Request, id: string, publish: boolean) {
  const raw = Object.fromEntries(await request.formData()) as Record<string, string>;

  const parsed = createListingSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(400, { errors: z.flattenError(parsed.error).fieldErrors, values: raw });
  }

  await updateListing(id, parsed.data, parsePhotos(raw), publish);
  return null;
}

export const actions: Actions = {
  publish: async ({ request, params }) => {
    const result = await save(request, params.id, true);
    if (result) return result;
    redirect(303, `/listings/${params.id}`);
  },
  saveDraft: async ({ request, params }) => {
    const result = await save(request, params.id, false);
    if (result) return result;
    redirect(303, `/listings/${params.id}`);
  },
  cancel: async ({ params }) => {
    const listing = await getListingById(params.id);
    if (!listing) {
      error(404, "Listing not found");
    }
    if (listing.status === "DRAFT") {
      await deleteListing(params.id);
      redirect(303, "/");
    }
    redirect(303, `/listings/${params.id}`);
  },
};
