import { z } from "zod";

/** Mirrors the API constraints of TestSessionRequest. Messages are translation keys. */
export const CAPACITY_MIN = 1;
export const CAPACITY_MAX = 1000;

export const sessionSchema = z.object({
  language: z.string().trim().min(2, "validation.languageLength").max(60, "validation.languageLength"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "validation.dateRequired"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "validation.timeRequired"),
  location: z.string().trim().min(2, "validation.locationLength").max(180, "validation.locationLength"),
  capacity: z
    .number({ error: "validation.capacityRequired" })
    .int("validation.capacityInteger")
    .min(CAPACITY_MIN, "validation.capacityRange")
    .max(CAPACITY_MAX, "validation.capacityRange"),
});

export type SessionValues = z.infer<typeof sessionSchema>;
