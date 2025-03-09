/*
  Warnings:

  - You are about to drop the column `date` on the `Show` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Show` table. All the data in the column will be lost.
  - Added the required column `datetime` to the `Show` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Film` MODIFY `duration` INTEGER NULL;

-- AlterTable
ALTER TABLE `Show` DROP COLUMN `date`,
    DROP COLUMN `time`,
    ADD COLUMN `datetime` DATETIME(3) NOT NULL;
