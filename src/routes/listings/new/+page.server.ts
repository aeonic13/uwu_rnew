import { fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions } from "./$types";
import { createListingSchema } from "$lib/server/listings/listings.schema";
import {
  createListing,
  getDefaultPropManagerId,
  parsePhotos,
} from "$lib/server/listings/listings.service";

async function save(request: Request, publish: boolean) {
  const raw = Object.fromEntries(await request.formData()) as Record<string, string>;

  const parsed = createListingSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(400, { errors: z.flattenError(parsed.error).fieldErrors, values: raw });
  }

  const propManagerId = await getDefaultPropManagerId();
  if (!propManagerId) {
    return fail(500, {
      errors: { _form: ["No property manager found. Run `npm run db:seed` first."] },
      values: raw,
    });
  }

  const listing = await createListing(propManagerId, parsed.data, parsePhotos(raw), publish);
  return listing.id;
}

export const actions: Actions = {
  publish: async ({ request }) => {
    const result = await save(request, true);
    if (typeof result !== "string") return result;
    redirect(303, `/listings/${result}`);
  },
  saveDraft: async ({ request }) => {
    const result = await save(request, false);
    if (typeof result !== "string") return result;
    redirect(303, `/listings/${result}`);
  },
};
