-- Modifica la constraint della tabella Availability per aggiungere ON DELETE CASCADE
ALTER TABLE `Availability` DROP FOREIGN KEY `Availability_showId_fkey`;
ALTER TABLE `Availability` ADD CONSTRAINT `Availability_showId_fkey` FOREIGN KEY (`showId`) REFERENCES `Show`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;