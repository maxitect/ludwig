import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { bookTexts } from "./tables";

export const bookTextFileSchema = z.object({
  meta: createInsertSchema(bookTexts).omit({ id: true }),
  paragraphs: z.array(z.string().min(1)).min(1),
});

export type BookTextFile = z.infer<typeof bookTextFileSchema>;
