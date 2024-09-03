/*
  Warnings:

  - Added the required column `horaDisponible` to the `maquinarias` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "maquinarias" ADD COLUMN     "horaDisponible" TIMESTAMP(3) NOT NULL;
