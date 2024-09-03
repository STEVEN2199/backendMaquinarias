import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get('/actividadesPorFecha', async (req, res) => {
    const fecha = req.query.fecha;

    try {
        const actividades = await prisma.actividad.findMany({
            where: {
                horaInicio: {
                    gte: new Date(`${fecha}T00:00:00.000Z`),
                    lte: new Date(`${fecha}T23:59:59.999Z`)
                }
            },
            include: {
                clientes: true,
                historial: {
                    include: {
                        maquinarias: true
                    }
                }
            }
        });

        res.json(actividades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/actividadesPorFechaHora', async (req, res) => {
    const { fecha, hora } = req.query;

    // Combina la fecha y la hora en un objeto Date
    const fechaHora = new Date(`${fecha}T${hora}:00.000Z`);

    try {
        const actividades = await prisma.actividad.findMany({
            where: {
                horaInicio: {
                    gte: new Date(`${fecha}T00:00:00.000Z`),
                    lte: fechaHora
                }
            },
            include: {
                clientes: true,
                historial: {
                    include: {
                        maquinarias: true
                    }
                }
            }
        });

        res.json(actividades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/maquinariasPorFecha', async (req, res) => {
    const { fecha } = req.query;

    if (!fecha) {
        return res.status(400).json({ error: 'La fecha es un parámetro obligatorio.' });
    }

    try {
        // Convertir la fecha a un objeto Date para manejar la comparación en la consulta
        const fechaDate = new Date(fecha);
        if (isNaN(fechaDate.getTime())) {
            return res.status(400).json({ error: 'La fecha proporcionada no es válida.' });
        }

        // Obtener todas las maquinarias sin relaciones y filtrar por la fecha
        const maquinarias = await prisma.maquinaria.findMany({
            where: {
                horaDisponible: {
                    gte: new Date(`${fecha}T00:00:00.000Z`),
                    lte: new Date(`${fecha}T23:59:59.999Z`)
                }
            },
            select: {
                id: true,
                tipo: true,
                estado: true,
                placa: true,
                horaDisponible: true
            }
        });

        res.json(maquinarias);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/maquinariasTotal', async (req, res) => {
    try {
        // Consulta para obtener todas las maquinarias, seleccionando solo los campos propios de la entidad
        const maquinarias = await prisma.maquinaria.findMany({
            select: {
                id: true,
                tipo: true,
                estado: true,
                empleadoId: true,
                placa: true,
                horaDisponible: true
            }
        });

        // Enviar la respuesta en formato JSON
        res.json(maquinarias);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
