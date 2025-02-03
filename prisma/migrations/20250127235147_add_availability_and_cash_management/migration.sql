-- CreateTable
CREATE TABLE `cash_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `show_id` INTEGER NOT NULL,
    `operator_id` INTEGER NOT NULL,
    `opening_50` INTEGER NOT NULL DEFAULT 0,
    `opening_20` INTEGER NOT NULL DEFAULT 0,
    `opening_10` INTEGER NOT NULL DEFAULT 0,
    `opening_5` INTEGER NOT NULL DEFAULT 0,
    `opening_2` INTEGER NOT NULL DEFAULT 0,
    `opening_1` INTEGER NOT NULL DEFAULT 0,
    `opening_050` INTEGER NOT NULL DEFAULT 0,
    `opening_other` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `opening_datetime` DATETIME(0) NOT NULL,
    `closing_50` INTEGER NULL,
    `closing_20` INTEGER NULL,
    `closing_10` INTEGER NULL,
    `closing_5` INTEGER NULL,
    `closing_2` INTEGER NULL,
    `closing_1` INTEGER NULL,
    `closing_050` INTEGER NULL,
    `closing_other` DECIMAL(10, 2) NULL,
    `closing_datetime` DATETIME(0) NULL,
    `ticket_system_total` DECIMAL(10, 2) NULL,
    `pos_total` DECIMAL(10, 2) NULL,
    `subscription_sold` DECIMAL(10, 2) NULL,
    `cash_handed_over` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `operator_id`(`operator_id`),
    INDEX `show_id`(`show_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `films` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `duration` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `time` TIME(0) NOT NULL,
    `operator_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `film_id` INTEGER NOT NULL,

    INDEX `fk_film`(`film_id`),
    INDEX `idx_date_time`(`date`, `time`),
    INDEX `operator_id`(`operator_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_admin` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `username`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cash_reports` ADD CONSTRAINT `cash_reports_ibfk_1` FOREIGN KEY (`show_id`) REFERENCES `shows`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cash_reports` ADD CONSTRAINT `cash_reports_ibfk_2` FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `shows` ADD CONSTRAINT `fk_film` FOREIGN KEY (`film_id`) REFERENCES `films`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `shows` ADD CONSTRAINT `shows_ibfk_1` FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
