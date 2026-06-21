import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

// Unchecked checkboxes are simply absent from FormData, so anything truthy = true.
const checkbox = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean()
);

const optionalInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().optional()
);

const optionalFloat = z.preprocess(
  emptyToUndefined,
  z.coerce.number().optional()
);

const optionalText = z.preprocess(emptyToUndefined, z.string().optional());

const optionalDate = z.preprocess(
  emptyToUndefined,
  z.coerce.date().optional()
);

export const createListingSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),

  // Location
  address: z.string().trim().min(1, "Address is required"),
  apartmentUnit: optionalText,
  city: z.string().trim().min(1, "City is required"),
  zip: z.string().trim().min(1, "ZIP is required"),
  neighborhood: optionalText,
  latitude: z.coerce.number().default(0),
  longitude: z.coerce.number().default(0),
  distanceToCampus: optionalFloat,
  hideExactAddress: checkbox,

  // Pricing
  monthlyRent: z.coerce.number().int().min(0, "Rent must be 0 or more"),
  deposit: optionalInt,
  applicationFee: optionalInt,
  utilitiesIncluded: checkbox,
  leaseType: z.enum(["MONTH_TO_MONTH", "SIX_MONTH", "TWELVE_MONTH", "CUSTOM"]),
  moveInDate: optionalDate,
  moveOutDate: optionalDate,

  // Room info
  numberOfRooms: z.coerce.number().int().min(0),
  roomType: z.enum(["PRIVATE", "SHARED"]),
  bathroomType: z.enum(["PRIVATE", "SHARED"]),
  roommateCount: z.coerce.number().int().min(0),

  // Requirements
  roommatesAllowed: checkbox,
  maxOccupants: z.coerce.number().int().min(1, "At least 1 occupant"),
  incomeRequirement: optionalInt,
  creditScoreMinimum: optionalInt,
  backgroundCheck: checkbox,
  petsAllowed: checkbox,
  smokingAllowed: checkbox,
  quietHours: optionalText,

  // Amenities
  furnished: checkbox,
  laundry: checkbox,
  parking: checkbox,
  wifiIncluded: checkbox,
  gasIncluded: checkbox,
  waterIncluded: checkbox,
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
