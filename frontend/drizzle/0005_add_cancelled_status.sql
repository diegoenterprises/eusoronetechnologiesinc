ALTER TABLE `mission_progress` MODIFY COLUMN `status` enum('not_started','in_progress','completed','claimed','expired','cancelled') NOT NULL DEFAULT 'not_started';
