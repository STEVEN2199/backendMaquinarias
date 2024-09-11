import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TIEMPO_LAVADO = 20; // minutos
const TIEMPO_EXTRA = 10; // minutos

const TIEMPOS_DESPACHO = {
  piso: 30, // minutos
  muro: 45,
  columna: 75,
  piso: 30,
  zapata: 45,
  plinton: 30,
  cisterna: 45,
  piscina: 45,
  // Otros tipos de actividades y sus tiempos de despacho pueden ser añadidos aquí
};

//TODO: ESTIMAR TIEMPO con google maps
// GET
const TIEMPOS_VIAJE = {
  "la libertad": 15,
  // otros tiempos de viaje
};

export const asignarVehiculosYCalcularHoras = async (actividad) => {
  try {
    const { direccion, cantidadMaterial, horaInicio, descripcion } = actividad;
    const tiempoViaje = TIEMPOS_VIAJE[direccion.toLowerCase()] || 0;
    const tiempoDespacho = TIEMPOS_DESPACHO[descripcion.toLowerCase()] || 0;
    const cantidadVehiculos = Math.ceil(cantidadMaterial / 7); // Asumimos que cada vehículo transporta 7 unidades de material

    let horaInicioTrabajo = new Date(horaInicio);
    console.log("Hora inicio trabajo:", horaInicioTrabajo);
    let registrosHistorial = [];

    // Obtener las maquinarias disponibles para la fecha y hora especificada
    const actividadesExistentesResponse = await axios.get(
      "http://localhost:3000/api/actividadesPorFechaHora",
      {
        params: {
          fecha: horaInicioTrabajo.toISOString().split("T")[0],
          hora: horaInicioTrabajo.toISOString().split("T")[1].slice(0, 5),
        },
      }
    );
    const actividadesExistentes = actividadesExistentesResponse.data;

    let maquinariasDisponibles = [];
    if (actividadesExistentes.length > 0) {
      const maquinariasPorFechaResponse = await axios.get(
        "http://localhost:3000/api/maquinariasPorFecha",
        {
          params: {
            fecha: horaInicioTrabajo.toISOString().split("T")[0],
          },
        }
      );
      const maquinariasPorFecha = maquinariasPorFechaResponse.data;

      if (maquinariasPorFecha.length === 0) {
        const maquinariasTotalResponse = await axios.get(
          "http://localhost:3000/api/maquinariasTotal"
        );
        maquinariasDisponibles = maquinariasTotalResponse.data.filter(
          (maquinaria) =>
            maquinaria.estado === "activo" &&
            (!maquinaria.horaDisponible ||
              new Date(maquinaria.horaDisponible) <= horaInicioTrabajo)
        );
      } else {
        maquinariasDisponibles = maquinariasPorFecha.filter(
          (maquinaria) =>
            maquinaria.estado === "activo" &&
            (!maquinaria.horaDisponible ||
              new Date(maquinaria.horaDisponible) <= horaInicioTrabajo)
        );
      }
    } else {
      const maquinariasTotalResponse = await axios.get(
        "http://localhost:3000/api/maquinariasTotal"
      );
      maquinariasDisponibles = maquinariasTotalResponse.data.filter(
        (maquinaria) =>
          maquinaria.estado === "activo" &&
          (!maquinaria.horaDisponible ||
            new Date(maquinaria.horaDisponible) <= horaInicioTrabajo)
      );
    }

    // Verificación final: Si no hay suficientes maquinarias, lanzar un error
    if (maquinariasDisponibles.length < cantidadVehiculos) {
      console.log(
        `Error: No hay suficientes maquinarias disponibles. Se necesitan ${cantidadVehiculos}, pero solo hay ${maquinariasDisponibles.length}.`
      );
      throw new Error(
        "No hay suficientes maquinarias disponibles para esta actividad."
      );
    }

    // Calcular las horas necesarias y actualizar el historial
    for (let i = 0; i < cantidadVehiculos; i++) {
      const maquinaria = maquinariasDisponibles[i];

      const horaSalida = new Date(
        horaInicioTrabajo.getTime() - tiempoViaje * 60000
      );
      console.log("Hora salida:", horaSalida);
      const horaDespacho = new Date(
        horaInicioTrabajo.getTime() + tiempoDespacho * 60000
      );
      console.log("Hora despacho:", horaDespacho);
      const horaFinTrabajo = new Date(
        horaDespacho.getTime() +
          (TIEMPO_LAVADO + tiempoViaje + TIEMPO_EXTRA) * 60000
      );
      console.log("Hora fin trabajo:", horaFinTrabajo);

      registrosHistorial.push({
        actividadId: actividad.id,
        maquinariaId: maquinaria.id,
        horaInicioTrabajo: horaInicioTrabajo,
        horaFinTrabajo: horaFinTrabajo,
      });

      // Actualizar el estado del vehículo y su horaDisponible
      await prisma.maquinaria.update({
        where: { id: maquinaria.id },
        data: { horaDisponible: horaFinTrabajo },
      });

      // Preparar la hora de inicio para el próximo vehículo
      horaInicioTrabajo = horaDespacho;
    }

    if (registrosHistorial.length > 0) {
      const horaFinActividad =
        registrosHistorial[registrosHistorial.length - 1].horaFinTrabajo;
      actividad.horaFin = horaFinActividad;
    } else {
      actividad.horaFin = actividad.horaInicio; // En caso de que no haya registros de trabajo, se mantiene la hora de inicio
    }

    return { actividad, registrosHistorial };
  } catch (error) {
    console.error("Error en asignarVehiculosYCalcularHoras:", error);
    throw error;
  }
};
