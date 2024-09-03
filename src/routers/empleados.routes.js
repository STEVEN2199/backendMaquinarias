import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/maquinariaEmpleado", async (req, res) => {
    const { nombre, telefono, cedula, email, rol, password, maquinarias } = req.body;

    try {
        const newEmpleadoMaquinaria = await prisma.empleado.create({
            data: {
                nombre,
                telefono,
                cedula,
                email,
                rol,
                password,
                maquinarias: {
                    create: maquinarias
                }
            },
        });
        res.json(newEmpleadoMaquinaria);
    } catch (error) {
        res.status(500).json({ error: error.message, details: error });
    }
});


export default router;
