import { createSelectSchema } from "drizzle-orm/zod";
import { userSettings } from "@/db/schema";

export const themeSchema = createSelectSchema(userSettings).pick({
  theme: true,
});
