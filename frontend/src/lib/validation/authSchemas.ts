import { z } from "zod";

/**
 * Client-side rules mirroring the API constraints (RegisterUserRequest,
 * UpdateProfileRequest): instant feedback, the API remaining the authority.
 * Messages are translation keys ("validation.*"), translated when displayed.
 */
const email = z
  .string()
  .trim()
  .min(1, "validation.emailRequired")
  .max(180, "validation.emailTooLong")
  .pipe(z.email("validation.emailInvalid"));

const name = z.string().trim().min(2, "validation.nameLength").max(100, "validation.nameLength");

export const PASSWORD_MIN_LENGTH = 8;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "validation.passwordRequired"),
});

export const registerSchema = z
  .object({
    name,
    email,
    password: z.string().min(PASSWORD_MIN_LENGTH, "validation.passwordTooShort").max(4096, "validation.passwordTooLong"),
    confirmPassword: z.string().min(1, "validation.confirmPasswordRequired"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    error: "validation.passwordMismatch",
  });

export const profileSchema = z.object({ name, email });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
