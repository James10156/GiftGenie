CREATE TABLE "friends" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"personality_traits" jsonb NOT NULL,
	"interests" jsonb NOT NULL,
	"category" text DEFAULT 'friend' NOT NULL,
	"notes" text,
	"country" text DEFAULT 'United States' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"profile_picture" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"operation" text NOT NULL,
	"response_time_ms" integer NOT NULL,
	"success" boolean NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"timestamp" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "recommendation_feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"friend_id" varchar,
	"recommendation_data" jsonb NOT NULL,
	"rating" integer NOT NULL,
	"feedback" text,
	"helpful" boolean,
	"purchased" boolean DEFAULT false,
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "saved_gifts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"friend_id" varchar NOT NULL,
	"gift_data" jsonb NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "user_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"session_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"timestamp" text DEFAULT CURRENT_TIMESTAMP,
	"user_agent" text,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"is_admin" boolean DEFAULT false,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_friend_id_friends_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."friends"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_gifts" ADD CONSTRAINT "saved_gifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_gifts" ADD CONSTRAINT "saved_gifts_friend_id_friends_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."friends"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;