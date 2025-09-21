-- MariaDB 10.4 compatible schema for 'spielplan'
-- Differences vs MySQL 8 schema:
-- - Use LONGTEXT instead of JSON (MariaDB 10.4 has JSON as alias to LONGTEXT, but avoid JSON defaults)
-- - Use utf8mb4_unicode_ci collation
-- - Avoid JSON default expressions
-- - DATETIME(6) retained

CREATE TABLE IF NOT EXISTS `tournaments` (
  `id` VARCHAR(255) NOT NULL,
  `name` TEXT NOT NULL,
  `settings` LONGTEXT NOT NULL, -- JSON string
  `matches` LONGTEXT NOT NULL,  -- JSON string
  `last_modified` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `owner_id` VARCHAR(255) NULL,
  `versions` LONGTEXT NULL,
  `audit_log` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tournaments_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` TEXT NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'user',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `idx_users_email_lower` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
