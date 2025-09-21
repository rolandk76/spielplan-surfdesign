-- MySQL schema converted from PostgreSQL dump (neon_backup.sql)
-- Target: MySQL 8.0+

-- Note:
-- - PostgreSQL jsonb -> MySQL JSON
-- - timestamp with time zone -> DATETIME(6)
-- - uuid -> CHAR(36) (supply UUIDs from app / migration)
-- - DEFAULT now() -> CURRENT_TIMESTAMP(6)
-- - Removed schema qualifiers (public.) and casts (::jsonb)

CREATE TABLE IF NOT EXISTS `tournaments` (
  `id` VARCHAR(255) NOT NULL,
  `name` TEXT NOT NULL,
  `settings` JSON NOT NULL,
  `matches` JSON NOT NULL,
  `last_modified` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `owner_id` VARCHAR(255) NULL,
  `versions` JSON NOT NULL DEFAULT (JSON_ARRAY()),
  `audit_log` JSON NOT NULL DEFAULT (JSON_ARRAY()),
  PRIMARY KEY (`id`),
  KEY `idx_tournaments_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` TEXT NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'user',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `idx_users_email_lower` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
