import { z } from "zod";

/**
 * Client-side rules mirroring the API constraints (RegisterUserRequest,
 * UpdateProfileRequest): instant feedback, the API remaining the authority.
 */
const email = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(180, "Email must not exceed 180 characters.")
  .pipe(z.email("Enter a valid email address."));

const name = z
  .string()
  .trim()
  .min(2, "Name must contain at least 2 characters.")
  .max(100, "Name must not exceed 100 characters.");

export const PASSWORD_MIN_LENGTH = 8;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z
  .object({
    name,
    email,
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must contain at least ${PASSWORD_MIN_LENGTH} characters.`)
      .max(4096, "Password is too long."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match.",
  });

export const profileSchema = z.object({ name, email });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
