CREATE TYPE "bangboo-schema"."role" AS ENUM('root', 'admin', 'premium', 'user');--> statement-breakpoint
CREATE TABLE "bangboo-schema"."jwks" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"alg" text,
	"crv" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
DROP INDEX "bangboo-schema"."account_userId_idx";--> statement-breakpoint
DROP INDEX "bangboo-schema"."session_userId_idx";--> statement-breakpoint
ALTER TABLE "bangboo-schema"."account" ALTER COLUMN "access_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."account" ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."account" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."account" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bangboo-schema"."account" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."account" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bangboo-schema"."session" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."session" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."session" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bangboo-schema"."session" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."session" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bangboo-schema"."user" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."user" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bangboo-schema"."user" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."user" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bangboo-schema"."verification" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."verification" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."verification" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bangboo-schema"."verification" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."verification" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bangboo-schema"."user" ADD COLUMN "discord_id" text;--> statement-breakpoint
ALTER TABLE "bangboo-schema"."user" ADD COLUMN "role" "bangboo-schema"."role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "bangboo-schema"."account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_uidx" ON "bangboo-schema"."account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "bangboo-schema"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "bangboo-schema"."session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "verification_expires_at_idx" ON "bangboo-schema"."verification" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "bangboo-schema"."user" ADD CONSTRAINT "user_discord_id_unique" UNIQUE("discord_id");--> statement-breakpoint
ALTER TABLE "bangboo-schema"."user" ADD CONSTRAINT "user_discord_id_format_chk" CHECK ("bangboo-schema"."user"."discord_id" ~ '^[0-9]{17,20}$');