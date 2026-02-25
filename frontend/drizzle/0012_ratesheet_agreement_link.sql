-- Migration: Link rate sheets to agreements bidirectionally
-- documents.agreementId → agreements.id (rate sheet knows its agreement)
-- agreements.rateSheetDocumentId → documents.id (agreement knows its Schedule A)

ALTER TABLE `documents` ADD COLUMN `agreementId` INT NULL AFTER `loadId`;
ALTER TABLE `documents` ADD INDEX `document_agreement_idx` (`agreementId`);

ALTER TABLE `agreements` ADD COLUMN `rateSheetDocumentId` INT NULL AFTER `accessorialSchedule`;
