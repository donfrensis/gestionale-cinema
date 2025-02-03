/*
  Warnings:

  - You are about to drop the `cash_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `films` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shows` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `cash_reports` DROP FOREIGN KEY `cash_reports_ibfk_1`;

-- DropForeignKey
ALTER TABLE `cash_reports` DROP FOREIGN KEY `cash_reports_ibfk_2`;

-- DropForeignKey
ALTER TABLE `shows` DROP FOREIGN KEY `fk_film`;

-- DropForeignKey
ALTER TABLE `shows` DROP FOREIGN KEY `shows_ibfk_1`;

-- DropTable
DROP TABLE `cash_reports`;

-- DropTable
DROP TABLE `films`;

-- DropTable
DROP TABLE `shows`;

-- DropTable
DROP TABLE `users`;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `firstAccess` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Film` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `bolId` INTEGER NULL,
    `cinetelId` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `importedFrom` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Show` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `time` TIME NOT NULL,
    `filmId` INTEGER NOT NULL,
    `operatorId` INTEGER NULL,
    `bolId` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Availability` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `showId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Availability_showId_userId_key`(`showId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CashReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `showId` INTEGER NOT NULL,
    `operatorId` INTEGER NOT NULL,
    `openingCash` JSON NOT NULL,
    `openingDateTime` DATETIME(3) NOT NULL,
    `closingCash` JSON NULL,
    `closingDateTime` DATETIME(3) NULL,
    `posTotal` DECIMAL(10, 2) NULL,
    `ticketTotal` DECIMAL(10, 2) NULL,
    `subscriptionTotal` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CashReport_showId_key`(`showId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Withdrawal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(10, 2) NOT NULL,
    `adminId` INTEGER NOT NULL,
    `depositId` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BankDeposit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(10, 2) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `adminId` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Show` ADD CONSTRAINT `Show_filmId_fkey` FOREIGN KEY (`filmId`) REFERENCES `Film`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Show` ADD CONSTRAINT `Show_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Availability` ADD CONSTRAINT `Availability_showId_fkey` FOREIGN KEY (`showId`) REFERENCES `Show`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Availability` ADD CONSTRAINT `Availability_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashReport` ADD CONSTRAINT `CashReport_showId_fkey` FOREIGN KEY (`showId`) REFERENCES `Show`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashReport` ADD CONSTRAINT `CashReport_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Withdrawal` ADD CONSTRAINT `Withdrawal_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Withdrawal` ADD CONSTRAINT `Withdrawal_depositId_fkey` FOREIGN KEY (`depositId`) REFERENCES `BankDeposit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
