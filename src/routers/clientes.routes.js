import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { asignarVehiculosYCalcularHoras } from "../scheduler.js";

const router = Router();
const prisma = new PrismaClient();

// Función para convertir UTC a hora local
const convertirAHoraLocal = (fecha) => {
  const fechaLocal = new Date(fecha);
  const offset = fechaLocal.getTimezoneOffset();
  fechaLocal.setMinutes(fechaLocal.getMinutes() - offset);
  return fechaLocal;
};

// Endpoint para crear actividades y asociarlas al cliente
// Endpoint para crear actividades y asociarlas al cliente
router.post("/clienteAct", async (req, res) => {
  const clienteId = req.body.Id;
  const actividades = req.body.actividades;

  const updatedActividades = [];

  for (const actividad of actividades) {
    if (!actividad.horaInicio) {
      return res
        .status(400)
        .json({ error: "La hora de inicio es obligatoria." });
    }

    const horaInicioLocal = convertirAHoraLocal(actividad.horaInicio);

    // 1. Verificar disponibilidad de maquinarias antes de intentar crear la actividad
    const maquinariasDisponibles = await prisma.maquinaria.findMany({
      where: {
        estado: "activo",
        OR: [
          { horaDisponible: null }, // Maquinarias sin horaDisponible (es decir, disponibles)
          { horaDisponible: { lte: horaInicioLocal } }, // Maquinarias disponibles antes de la hora de inicio
        ],
      },
    });

    const cantidadVehiculosNecesarios = Math.ceil(
      actividad.cantidadMaterial / 7
    ); // Ejemplo: 14 -> 2 vehículos

    if (maquinariasDisponibles.length < cantidadVehiculosNecesarios) {
      return res.status(400).json({
        error: `No hay suficientes maquinarias disponibles para la actividad. Se requieren ${cantidadVehiculosNecesarios}, pero solo hay ${maquinariasDisponibles.length}.`,
      });
    }

    let actividadExistente;
    try {
      // Crear la actividad si pasa la validación
      actividadExistente = await prisma.actividad.create({
        data: {
          descripcion: actividad.Descripción,
          direccion: actividad.Dirección,
          cantidadMaterial: actividad.cantidadMaterial,
          horaInicio: horaInicioLocal,
          clienteId: clienteId,
        },
      });

      // 2. Asignar vehículos y calcular horas usando el algoritmo
      const { actividad: updatedActividad, registrosHistorial } =
        await asignarVehiculosYCalcularHoras(actividadExistente);

      updatedActividades.push(updatedActividad);

      // Actualizar la actividad con las nuevas horas calculadas
      await prisma.actividad.update({
        where: { id: updatedActividad.id },
        data: {
          horaInicio: new Date(updatedActividad.horaInicio),
          horaFin: new Date(updatedActividad.horaFin),
        },
      });

      // Crear registros en la tabla de historial
      for (const registro of registrosHistorial) {
        await prisma.historial.create({
          data: {
            actividadId: registro.actividadId,
            maquinariaId: registro.maquinariaId,
            horaInicioTrabajo: new Date(registro.horaInicioTrabajo),
            horaFinTrabajo: new Date(registro.horaFinTrabajo),
          },
        });
      }
    } catch (error) {
      console.error("Error al crear la actividad:", error.message);
      return res.status(500).json({
        error:
          "Ocurrió un error al intentar crear la actividad. Por favor, intente de nuevo más tarde.",
      });
    }
  }

  res.json({ clienteId, actividades: updatedActividades });
});

// Endpoint para crear clientes
router.post("/crearCliente", async (req, res) => {
  const { nombre, direccion, telefono, cedula, email } = req.body;

  try {
    const newClient = await prisma.cliente.create({
      data: {
        nombre,
        direccion,
        telefono,
        cedula,
        email,
      },
    });
    res.json(newClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/actualizarCliente/:id", async (req, res) => {
  const clienteId = parseInt(req.params.id, 10);
  const { nombre, direccion, telefono, cedula, email } = req.body;

  try {
    const clienteActualizado = await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        nombre,
        direccion,
        telefono,
        cedula,
        email,
      },
    });

    res.json(clienteActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/eliminarCliente/:id", async (req, res) => {
  const clienteId = parseInt(req.params.id);

  try {
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!clienteExistente) {
      return res
        .status(404)
        .json({ error: "Cliente with id ${clienteId} not found" });
    }

    await prisma.cliente.delete({
      where: { id: clienteId },
    });

    res.json({
      message: `Cliente with id ${clienteId} has been deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/clientes", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        direccion: true,
      },
    });

    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
