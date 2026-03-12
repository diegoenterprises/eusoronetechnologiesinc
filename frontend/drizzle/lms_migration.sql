-- LMS Migration: Add country fields to users + create 11 new LMS tables

-- 1. Add country/province fields to users
ALTER TABLE `users` ADD COLUMN `country` ENUM('US','CA','MX') DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN `countrySetAt` TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN `provinceId` INT DEFAULT NULL;

-- 2. Countries
CREATE TABLE IF NOT EXISTS `countries` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(2) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `regulatoryBody` VARCHAR(255) DEFAULT NULL,
  `regulatoryFramework` VARCHAR(255) DEFAULT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `metadata` JSON DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `countries_code_idx` (`code`),
  KEY `countries_active_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Provinces
CREATE TABLE IF NOT EXISTS `provinces` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `countryId` INT NOT NULL,
  `code` VARCHAR(5) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `abbreviation` VARCHAR(10) DEFAULT NULL,
  `regionType` ENUM('state','province','territory','federal_entity') DEFAULT NULL,
  `hazmatSpecificRules` TEXT DEFAULT NULL,
  `specialRegulations` JSON DEFAULT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `metadata` JSON DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `provinces_country_idx` (`countryId`),
  UNIQUE KEY `provinces_country_code_idx` (`countryId`, `code`),
  KEY `provinces_active_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Training Courses
CREATE TABLE IF NOT EXISTS `training_courses` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `longDescription` TEXT DEFAULT NULL,
  `category` ENUM('compliance','safety','hazmat','equipment','wellness','regulatory','specialized') DEFAULT NULL,
  `countryScope` JSON NOT NULL,
  `provinceScope` JSON DEFAULT NULL,
  `difficultyLevel` ENUM('beginner','intermediate','advanced') DEFAULT NULL,
  `estimatedDurationMinutes` INT NOT NULL,
  `moduleCount` INT NOT NULL,
  `isMandatory` BOOLEAN DEFAULT FALSE,
  `mandatoryForRoles` JSON DEFAULT NULL,
  `renewalIntervalMonths` INT DEFAULT NULL,
  `regulatoryReference` VARCHAR(500) DEFAULT NULL,
  `hazmatSpecific` BOOLEAN DEFAULT FALSE,
  `crossBorder` BOOLEAN DEFAULT FALSE,
  `status` ENUM('active','draft','archived') DEFAULT 'draft',
  `passingScore` INT DEFAULT 80,
  `thumbnailUrl` TEXT DEFAULT NULL,
  `tags` JSON DEFAULT NULL,
  `keywords` JSON DEFAULT NULL,
  `enrollmentCount` INT DEFAULT 0,
  `averageRating` DECIMAL(3,2) DEFAULT NULL,
  `completionRate` DECIMAL(5,2) DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `publishedAt` TIMESTAMP NULL DEFAULT NULL,
  `archivedAt` TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY `tc_slug_idx` (`slug`),
  KEY `tc_category_idx` (`category`),
  KEY `tc_status_idx` (`status`),
  KEY `tc_mandatory_idx` (`isMandatory`),
  KEY `tc_hazmat_idx` (`hazmatSpecific`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. LMS Modules (named lms_modules to avoid conflict with legacy training_modules)
CREATE TABLE IF NOT EXISTS `lms_modules` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `courseId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `orderIndex` INT NOT NULL,
  `contentType` ENUM('video','text','interactive','quiz','case_study') DEFAULT NULL,
  `estimatedDurationMinutes` INT DEFAULT NULL,
  `contentData` JSON DEFAULT NULL,
  `status` ENUM('draft','active','archived') DEFAULT 'active',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `lmsm_course_idx` (`courseId`),
  KEY `lmsm_course_order_idx` (`courseId`, `orderIndex`),
  KEY `lmsm_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Training Lessons
CREATE TABLE IF NOT EXISTS `training_lessons` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `moduleId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `contentHtml` TEXT DEFAULT NULL,
  `orderIndex` INT NOT NULL,
  `lessonType` ENUM('reading','video','interactive','case_study') DEFAULT NULL,
  `estimatedDurationMinutes` INT DEFAULT NULL,
  `keyRegulations` JSON DEFAULT NULL,
  `provinceSpecific` JSON DEFAULT NULL,
  `learningAids` JSON DEFAULT NULL,
  `status` ENUM('draft','active','archived') DEFAULT 'active',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `tl_module_idx` (`moduleId`),
  KEY `tl_module_order_idx` (`moduleId`, `orderIndex`),
  KEY `tl_type_idx` (`lessonType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Training Quizzes
CREATE TABLE IF NOT EXISTS `training_quizzes` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `moduleId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `passingScore` INT DEFAULT 80,
  `timeLimitMinutes` INT DEFAULT NULL,
  `questionCount` INT DEFAULT NULL,
  `randomizeQuestions` BOOLEAN DEFAULT TRUE,
  `showAnswersImmediately` BOOLEAN DEFAULT FALSE,
  `allowRetakes` BOOLEAN DEFAULT TRUE,
  `maxRetakes` INT DEFAULT NULL,
  `status` ENUM('draft','active','archived') DEFAULT 'active',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `tqz_module_idx` (`moduleId`),
  KEY `tqz_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Training Quiz Questions
CREATE TABLE IF NOT EXISTS `training_quiz_questions` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `quizId` INT NOT NULL,
  `questionText` TEXT NOT NULL,
  `questionType` ENUM('multiple_choice','true_false','scenario') DEFAULT NULL,
  `options` JSON DEFAULT NULL,
  `correctAnswer` VARCHAR(255) DEFAULT NULL,
  `explanation` TEXT DEFAULT NULL,
  `difficulty` ENUM('easy','medium','hard') DEFAULT NULL,
  `regulationReference` VARCHAR(255) DEFAULT NULL,
  `provinceSpecific` JSON DEFAULT NULL,
  `orderIndex` INT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `tqq_quiz_idx` (`quizId`),
  KEY `tqq_type_idx` (`questionType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. User Course Enrollments
CREATE TABLE IF NOT EXISTS `user_course_enrollments` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `courseId` INT NOT NULL,
  `enrolledAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `startedAt` TIMESTAMP NULL DEFAULT NULL,
  `completedAt` TIMESTAMP NULL DEFAULT NULL,
  `status` ENUM('enrolled','in_progress','completed','failed','expired') DEFAULT 'enrolled',
  `currentModuleId` INT DEFAULT NULL,
  `currentLessonId` INT DEFAULT NULL,
  `progressPercentage` INT DEFAULT 0,
  `totalTimeSpentMinutes` INT DEFAULT 0,
  `certificateId` INT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `uce_user_idx` (`userId`),
  KEY `uce_course_idx` (`courseId`),
  KEY `uce_status_idx` (`status`),
  UNIQUE KEY `uce_user_course_idx` (`userId`, `courseId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. User Module Progress
CREATE TABLE IF NOT EXISTS `user_module_progress` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `enrollmentId` INT NOT NULL,
  `moduleId` INT NOT NULL,
  `startedAt` TIMESTAMP NULL DEFAULT NULL,
  `completedAt` TIMESTAMP NULL DEFAULT NULL,
  `status` ENUM('not_started','in_progress','completed') DEFAULT 'not_started',
  `quizScore` INT DEFAULT NULL,
  `quizAttempts` INT DEFAULT 0,
  `lastQuizAttemptAt` TIMESTAMP NULL DEFAULT NULL,
  `timeSpentMinutes` INT DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `ump_enrollment_idx` (`enrollmentId`),
  KEY `ump_module_idx` (`moduleId`),
  KEY `ump_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. User Lesson Progress
CREATE TABLE IF NOT EXISTS `user_lesson_progress` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `enrollmentId` INT NOT NULL,
  `lessonId` INT NOT NULL,
  `startedAt` TIMESTAMP NULL DEFAULT NULL,
  `completedAt` TIMESTAMP NULL DEFAULT NULL,
  `status` ENUM('not_started','in_progress','completed') DEFAULT 'not_started',
  `timeSpentMinutes` INT DEFAULT 0,
  `lessonData` JSON DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `ulp_enrollment_idx` (`enrollmentId`),
  KEY `ulp_lesson_idx` (`lessonId`),
  KEY `ulp_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. User Certificates
CREATE TABLE IF NOT EXISTS `user_certificates` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `courseId` INT NOT NULL,
  `enrollmentId` INT DEFAULT NULL,
  `certificateNumber` VARCHAR(255) NOT NULL,
  `issuedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` TIMESTAMP NULL DEFAULT NULL,
  `verificationCode` VARCHAR(100) DEFAULT NULL,
  `verificationUrl` TEXT DEFAULT NULL,
  `status` ENUM('active','expired','revoked') DEFAULT 'active',
  `pdfUrl` TEXT DEFAULT NULL,
  `renewalReminderSent` BOOLEAN DEFAULT FALSE,
  `renewalReminderSentAt` TIMESTAMP NULL DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `ucert_user_idx` (`userId`),
  KEY `ucert_course_idx` (`courseId`),
  KEY `ucert_status_idx` (`status`),
  UNIQUE KEY `ucert_certnum_idx` (`certificateNumber`),
  KEY `ucert_expiry_idx` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
