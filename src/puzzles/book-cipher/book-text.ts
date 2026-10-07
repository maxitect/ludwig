import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { bookTexts } from "./tables";

export const bookTextFileSchema = z.object({
  meta: createInsertSchema(bookTexts).omit({ id: true }),
  paragraphs: z.array(z.string().regex(/\S/)).min(1),
});

export type BookTextFile = z.infer<typeof bookTextFileSchema>;
