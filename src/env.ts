import "server-only";
import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    DATABASE_URL_UNPOOLED: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().optional(),
    VERCEL_ENV: z.string().optional(),
    VERCEL_URL: z.string().optional(),
  })
  .refine((value) => value.BETTER_AUTH_URL || value.VERCEL_ENV === "preview", {
    path: ["BETTER_AUTH_URL"],
    message: "Required outside Vercel previews",
  });

export function parseEnv(source: Record<string, string | undefined>) {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n  ");
    throw new Error(`Invalid environment variables:\n  ${issues}`);
  }
  return result.data;
}

export const env = parseEnv(process.env);
