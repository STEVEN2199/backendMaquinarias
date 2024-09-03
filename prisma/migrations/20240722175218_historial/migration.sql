/*
  Warnings:

  - You are about to drop the column `horaFinTrabajo` on the `maquinarias` table. All the data in the column will be lost.
  - You are about to drop the column `horaInicioTrabajo` on the `maquinarias` table. All the data in the column will be lost.
  - Added the required column `placa` to the `maquinarias` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "maquinarias" DROP COLUMN "horaFinTrabajo",
DROP COLUMN "horaInicioTrabajo",
ADD COLUMN     "placa" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "historial" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "maquinariaId" INTEGER NOT NULL,
    "horaInicioTrabajo" TIMESTAMP(3) NOT NULL,
    "horaFinTrabajo" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historial_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "historial" ADD CONSTRAINT "historial_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial" ADD CONSTRAINT "historial_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "maquinarias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
