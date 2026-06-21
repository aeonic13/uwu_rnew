import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getListingById } from "$lib/server/listings/listings.service";

export const load: PageServerLoad = async ({ params }) => {
  const listing = await getListingById(params.id);
  if (!listing) {
    error(404, "Listing not found");
  }
  return { listing };
};
