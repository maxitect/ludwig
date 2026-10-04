import { createUpdateSchema } from "drizzle-orm/zod";
import type { z } from "zod";
import { userSettings } from "@/db/schema";
import { signUpSchema } from "./auth";

export const settingsSchema = createUpdateSchema(userSettings)
  .omit({ userId: true })
  .required()
  .extend(signUpSchema.pick({ name: true }).shape);

export type SettingsInput = z.infer<typeof settingsSchema>;
