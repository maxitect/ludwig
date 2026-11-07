CREATE TABLE "user_favourite_types" (
	"user_id" uuid,
	"type_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_favourite_types_pkey" PRIMARY KEY("user_id","type_key")
);
--> statement-breakpoint
CREATE TABLE "user_type_visits" (
	"user_id" uuid,
	"type_key" text,
	"visited_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_type_visits_pkey" PRIMARY KEY("user_id","type_key")
);
--> statement-breakpoint
ALTER TABLE "user_favourite_types" ADD CONSTRAINT "user_favourite_types_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_favourite_types" ADD CONSTRAINT "user_favourite_types_type_key_puzzle_types_key_fkey" FOREIGN KEY ("type_key") REFERENCES "puzzle_types"("key");--> statement-breakpoint
ALTER TABLE "user_type_visits" ADD CONSTRAINT "user_type_visits_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_type_visits" ADD CONSTRAINT "user_type_visits_type_key_puzzle_types_key_fkey" FOREIGN KEY ("type_key") REFERENCES "puzzle_types"("key");