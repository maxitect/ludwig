ALTER TABLE "attempts" ADD COLUMN "last_saved_at" timestamp with time zone;--> statement-breakpoint
UPDATE "attempts" SET "last_saved_at" = coalesce("completed_at", "started_at");--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "last_saved_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "last_saved_at" SET NOT NULL;
