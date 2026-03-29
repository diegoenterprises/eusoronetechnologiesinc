-- 0033: Create tournaments, tournament_participants, and guild_challenges tables

-- TOURNAMENTS
CREATE TABLE IF NOT EXISTS `tournaments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(200) NOT NULL,
  `description` text,
  `type` enum('weekly','monthly','seasonal','special'),
  `status` enum('upcoming','active','completed','cancelled'),
  `startDate` timestamp NULL,
  `endDate` timestamp NULL,
  `entryFee` int DEFAULT 0,
  `prizePool` int DEFAULT 0,
  `maxParticipants` int DEFAULT 100,
  `metric` varchar(50),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `tournament_status_idx` (`status`),
  INDEX `tournament_type_idx` (`type`)
);

-- TOURNAMENT PARTICIPANTS
CREATE TABLE IF NOT EXISTS `tournament_participants` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `tournamentId` int NOT NULL,
  `userId` int NOT NULL,
  `score` decimal(10,2) DEFAULT 0,
  `rank` int,
  `joinedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `tp_tournament_idx` (`tournamentId`),
  INDEX `tp_user_idx` (`userId`),
  UNIQUE INDEX `tp_tournament_user_idx` (`tournamentId`, `userId`),
  FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);

-- GUILD CHALLENGES
CREATE TABLE IF NOT EXISTS `guild_challenges` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `challengerGuildId` int,
  `defenderGuildId` int,
  `name` varchar(200),
  `description` text,
  `metric` varchar(50),
  `status` enum('pending','active','completed','declined'),
  `startDate` timestamp NULL,
  `endDate` timestamp NULL,
  `challengerScore` decimal(10,2) DEFAULT 0,
  `defenderScore` decimal(10,2) DEFAULT 0,
  `winnerId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `gc_challenger_idx` (`challengerGuildId`),
  INDEX `gc_defender_idx` (`defenderGuildId`),
  INDEX `gc_status_idx` (`status`)
);
