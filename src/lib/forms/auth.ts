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
