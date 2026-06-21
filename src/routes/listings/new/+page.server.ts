import { fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions } from "./$types";
import { createListingSchema } from "$lib/server/listings/listings.schema";
import {
  createListing,
  getDefaultPropManagerId,
  type PhotoInput,
} from "$lib/server/listings/listings.service";

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const raw = Object.fromEntries(formData) as Record<string, string>;

    const parsed = createListingSchema.safeParse(raw);
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return fail(400, { errors: fieldErrors, values: raw });
    }

    const propManagerId = await getDefaultPropManagerId();
    if (!propManagerId) {
      return fail(500, {
        errors: {
          _form: ["No property manager found. Run `npm run db:seed` first."],
        },
        values: raw,
      });
    }

    const photos: PhotoInput[] = (raw.photos ?? "")
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean)
      .map((imageUrl, index) => ({
        imageUrl,
        orderIndex: index,
        isCover: index === 0,
      }));

    const listing = await createListing(propManagerId, parsed.data, photos);

    redirect(303, `/listings/${listing.id}`);
  },
};
