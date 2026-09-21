import { z } from "zod";

/** Mirrors the API constraints of TestSessionRequest. */
export const CAPACITY_MIN = 1;
export const CAPACITY_MAX = 1000;

export const sessionSchema = z.object({
  language: z.string().trim().min(2, "Language must contain at least 2 characters.").max(60, "Language must not exceed 60 characters."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a time (HH:MM)."),
  location: z.string().trim().min(2, "Location must contain at least 2 characters.").max(180, "Location must not exceed 180 characters."),
  capacity: z
    .number({ error: "Enter a number of seats." })
    .int("The number of seats must be a whole number.")
    .min(CAPACITY_MIN, `A session offers at least ${CAPACITY_MIN} seat.`)
    .max(CAPACITY_MAX, `A session offers at most ${CAPACITY_MAX} seats.`),
});

export type SessionValues = z.infer<typeof sessionSchema>;
