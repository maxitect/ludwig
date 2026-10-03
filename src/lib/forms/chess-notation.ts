import { createSelectSchema } from "drizzle-orm/zod";
import { userSettings } from "@/db/schema";

export const chessNotationSchema = createSelectSchema(userSettings).pick({
  chessNotation: true,
});
