import { error, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  deleteListing,
  getListingById,
  publishListing,
} from "$lib/server/listings/listings.service";

export const load: PageServerLoad = async ({ params }) => {
  const listing = await getListingById(params.id);
  if (!listing) {
    error(404, "Listing not found");
  }

  // TODO(auth): once authentication exists, restrict non-PUBLISHED listings
  // (DRAFT/ARCHIVED) to their owner. The UUID makes a listing unlisted, not
  // private, so anyone with the link can currently view a draft. Gate it:
  //   if (listing.status !== "PUBLISHED" && locals.user?.id !== listing.propManager.user.id) {
  //     error(404, "Listing not found"); // 404 (not 403) avoids confirming it exists
  //   }
  return { listing };
};

export const actions: Actions = {
  publish: async ({ params }) => {
    await publishListing(params.id);
    redirect(303, `/listings/${params.id}`);
  },
  delete: async ({ params }) => {
    await deleteListing(params.id);
    redirect(303, "/");
  },
};
