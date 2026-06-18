CREATE TABLE `poll` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`created_by_user_id` text,
	`question` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`join_code` text NOT NULL,
	`opened_at` integer,
	`closed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `poll_join_code_unique` ON `poll` (`join_code`);--> statement-breakpoint
CREATE INDEX `poll_organizationId_idx` ON `poll` (`organization_id`);--> statement-breakpoint
CREATE INDEX `poll_organization_status_idx` ON `poll` (`organization_id`,`status`);--> statement-breakpoint
CREATE TABLE `poll_option` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`label` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `poll_option_poll_label_uidx` ON `poll_option` (`poll_id`,`label`);--> statement-breakpoint
CREATE UNIQUE INDEX `poll_option_id_poll_uidx` ON `poll_option` (`id`,`poll_id`);--> statement-breakpoint
CREATE INDEX `poll_option_poll_position_idx` ON `poll_option` (`poll_id`,`position`);--> statement-breakpoint
CREATE TABLE `vote` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`poll_option_id` text NOT NULL,
	`voter_key` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`poll_option_id`,`poll_id`) REFERENCES `poll_option`(`id`,`poll_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vote_poll_voter_uidx` ON `vote` (`poll_id`,`voter_key`);--> statement-breakpoint
CREATE INDEX `vote_poll_option_idx` ON `vote` (`poll_id`,`poll_option_id`);--> statement-breakpoint
CREATE INDEX `vote_option_idx` ON `vote` (`poll_option_id`);