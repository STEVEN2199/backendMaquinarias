-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "cantidadMaterial" INTEGER NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaFin" TIMESTAMP(3) NOT NULL,
    "clienteId" INTEGER NOT NULL,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maquinarias" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "horaInicioTrabajo" TIMESTAMP(3) NOT NULL,
    "horaFinTrabajo" TIMESTAMP(3) NOT NULL,
    "empleadoId" INTEGER NOT NULL,

    CONSTRAINT "maquinarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ActividadToMaquinaria" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_nombre_key" ON "clientes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_email_key" ON "empleados"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_ActividadToMaquinaria_AB_unique" ON "_ActividadToMaquinaria"("A", "B");

-- CreateIndex
CREATE INDEX "_ActividadToMaquinaria_B_index" ON "_ActividadToMaquinaria"("B");

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquinarias" ADD CONSTRAINT "maquinarias_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActividadToMaquinaria" ADD CONSTRAINT "_ActividadToMaquinaria_A_fkey" FOREIGN KEY ("A") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActividadToMaquinaria" ADD CONSTRAINT "_ActividadToMaquinaria_B_fkey" FOREIGN KEY ("B") REFERENCES "maquinarias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
