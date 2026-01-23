CREATE TABLE `ach_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromAccountId` int,
	`toAccountId` int,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`description` text,
	`status` enum('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`initiatedBy` int NOT NULL,
	`achTraceNumber` varchar(50),
	`errorCode` varchar(50),
	`errorMessage` text,
	`scheduledFor` timestamp,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ach_transfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bank_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`transactionId` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`type` enum('DEBIT','CREDIT') NOT NULL,
	`category` varchar(100),
	`description` text,
	`merchantName` varchar(255),
	`date` timestamp NOT NULL,
	`pending` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bank_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `bank_transactions_transactionId_unique` UNIQUE(`transactionId`),
	CONSTRAINT `bank_transaction_id_unique` UNIQUE(`transactionId`)
);
--> statement-breakpoint
CREATE TABLE `geofence_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`geofenceId` int NOT NULL,
	`alertType` enum('ENTER','EXIT') NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`location` json NOT NULL,
	`notified` boolean DEFAULT false,
	`notifiedAt` timestamp,
	CONSTRAINT `geofence_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linked_bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bankName` varchar(255) NOT NULL,
	`accountType` enum('CHECKING','SAVINGS') NOT NULL,
	`accountNumberLast4` varchar(4) NOT NULL,
	`accountNumberEncrypted` text NOT NULL,
	`routingNumber` varchar(9) NOT NULL,
	`accountHolderName` varchar(255) NOT NULL,
	`balance` decimal(12,2),
	`lastSynced` timestamp,
	`status` enum('ACTIVE','DISCONNECTED','ERROR','PENDING_VERIFICATION') NOT NULL DEFAULT 'PENDING_VERIFICATION',
	`isDefault` boolean DEFAULT false,
	`verificationStatus` enum('UNVERIFIED','PENDING','VERIFIED','FAILED') NOT NULL DEFAULT 'UNVERIFIED',
	`microDepositAmount1` decimal(4,2),
	`microDepositAmount2` decimal(4,2),
	`verificationAttempts` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `linked_bank_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from` varchar(20) NOT NULL,
	`to` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`status` enum('QUEUED','SENT','DELIVERED','FAILED','UNDELIVERED') NOT NULL DEFAULT 'QUEUED',
	`direction` enum('INBOUND','OUTBOUND') NOT NULL,
	`userId` int,
	`cost` decimal(6,4),
	`errorCode` varchar(50),
	`errorMessage` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_opt_outs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`optedOutAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_opt_outs_id` PRIMARY KEY(`id`),
	CONSTRAINT `sms_opt_outs_phoneNumber_unique` UNIQUE(`phoneNumber`),
	CONSTRAINT `sms_opt_out_phone_unique` UNIQUE(`phoneNumber`)
);
--> statement-breakpoint
CREATE INDEX `ach_from_account_idx` ON `ach_transfers` (`fromAccountId`);--> statement-breakpoint
CREATE INDEX `ach_to_account_idx` ON `ach_transfers` (`toAccountId`);--> statement-breakpoint
CREATE INDEX `ach_status_idx` ON `ach_transfers` (`status`);--> statement-breakpoint
CREATE INDEX `ach_initiated_by_idx` ON `ach_transfers` (`initiatedBy`);--> statement-breakpoint
CREATE INDEX `bank_transaction_account_idx` ON `bank_transactions` (`accountId`);--> statement-breakpoint
CREATE INDEX `bank_transaction_date_idx` ON `bank_transactions` (`date`);--> statement-breakpoint
CREATE INDEX `geofence_alert_vehicle_idx` ON `geofence_alerts` (`vehicleId`);--> statement-breakpoint
CREATE INDEX `geofence_alert_geofence_idx` ON `geofence_alerts` (`geofenceId`);--> statement-breakpoint
CREATE INDEX `geofence_alert_timestamp_idx` ON `geofence_alerts` (`timestamp`);--> statement-breakpoint
CREATE INDEX `linked_bank_user_idx` ON `linked_bank_accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `linked_bank_status_idx` ON `linked_bank_accounts` (`status`);--> statement-breakpoint
CREATE INDEX `sms_from_idx` ON `sms_messages` (`from`);--> statement-breakpoint
CREATE INDEX `sms_to_idx` ON `sms_messages` (`to`);--> statement-breakpoint
CREATE INDEX `sms_status_idx` ON `sms_messages` (`status`);--> statement-breakpoint
CREATE INDEX `sms_created_at_idx` ON `sms_messages` (`createdAt`);