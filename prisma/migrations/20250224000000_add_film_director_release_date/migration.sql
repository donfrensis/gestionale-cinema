-- AddColumn Film.director
ALTER TABLE `Film` ADD COLUMN `director` VARCHAR(191) NULL;

-- AddColumn Film.italianReleaseDate
ALTER TABLE `Film` ADD COLUMN `italianReleaseDate` DATETIME(3) NULL;
