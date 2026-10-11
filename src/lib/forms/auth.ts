import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { user } from "@/db/schema";

export const signUpSchema = createInsertSchema(user, {
  email: z.email("Enter a valid email address."),
  name: (schema) => schema.trim().min(1, "Enter your name."),
})
  .pick({ email: true, name: true })
  .extend({ password: z.string().min(10, "Use at least 10 characters.") });

export const signInSchema = signUpSchema
  .pick({ email: true })
  .extend({ password: z.string().min(1) });

const passwordsMatch = {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
};

export const forgotPasswordSchema = signUpSchema.pick({ email: true });

export const resetPasswordSchema = signUpSchema
  .pick({ password: true })
  .extend({ token: z.string().min(1), confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, passwordsMatch);

export const changePasswordSchema = signUpSchema
  .pick({ password: true })
  .extend({
    currentPassword: z.string().min(1, "Enter your current password."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, passwordsMatch);
