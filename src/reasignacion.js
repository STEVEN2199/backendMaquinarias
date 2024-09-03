import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Función para verificar solapamiento
function haySolapamiento(horaInicio1, horaFin1, horaInicio2, horaFin2) {
  return (horaInicio1 < horaFin2 && horaInicio2 < horaFin1);
}

// Función para obtener posibles horarios de reasignación
export async function obtenerPosiblesHorarios(actividadId) {
  // Obtener la actividad a reasignar
  const actividadActual = await prisma.actividad.findUnique({
    where: { id: actividadId },
    include: {
      historial: true
    }
  });

  if (!actividadActual) {
    throw new Error('Actividad no encontrada');
  }

  const { horaInicio, horaFin } = actividadActual;
  const duracion = (new Date(horaFin) - new Date(horaInicio)) / (1000 * 60 * 60); // Duración en horas

  // Obtener todas las actividades del mismo día
  const actividades = await prisma.actividad.findMany({
    where: {
      horaInicio: {
        gte: new Date(horaInicio.setHours(0, 0, 0, 0)), // Inicio del día
        lt: new Date(horaInicio.setHours(23, 59, 59, 999)) // Fin del día
      },
      NOT: { id: actividadId } // Excluir la actividad actual de la comparación
    },
    include: {
      historial: true
    }
  });

  // Calcular los posibles horarios
  const posiblesHorarios = [];
  let inicioPosible = new Date(horaInicio);
  let finPosible = new Date(horaFin);

  // Ordenar actividades por hora de inicio
  actividades.sort((a, b) => new Date(a.horaInicio) - new Date(b.horaInicio));

  // Revisar entre las actividades actuales
  for (const actividad of actividades) {
    const horaInicioActividad = new Date(actividad.horaInicio);
    const horaFinActividad = new Date(actividad.horaFin);

    if (!haySolapamiento(inicioPosible, finPosible, horaInicioActividad, horaFinActividad)) {
      // Verificar si el espacio disponible tiene la duración suficiente
      if ((finPosible - inicioPosible) >= duracion * (1000 * 60 * 60)) {
        posiblesHorarios.push({
          horaInicio: inicioPosible.toISOString(),
          horaFin: new Date(inicioPosible.getTime() + (duracion * (1000 * 60 * 60))).toISOString()
        });
      }
    }
    
    // Actualizar el tiempo posible para el siguiente intervalo
    inicioPosible = new Date(actividad.horaFin);
    finPosible = new Date(inicioPosible.getTime() + (duracion * (1000 * 60 * 60)));
  }

  // Revisar si hay un espacio disponible al final del día
  const finDelDia = new Date(horaInicio.setHours(23, 59, 59, 999));
  if (finPosible <= finDelDia) {
    posiblesHorarios.push({
      horaInicio: inicioPosible.toISOString(),
      horaFin: new Date(inicioPosible.getTime() + (duracion * (1000 * 60 * 60))).toISOString()
    });
  }

  // Verificar la disponibilidad de maquinarias
  const maquinariaIds = actividadActual.historial.map(h => h.maquinariaId);
  const maquinarias = await prisma.maquinaria.findMany({
    where: {
      id: { in: maquinariaIds },
      estado: 'activo'
    },
    include: {
      historial: {
        where: {
          horaInicioTrabajo: {
            gte: new Date(horaInicio.setHours(0, 0, 0, 0)), // Inicio del día
            lt: new Date(horaInicio.setHours(23, 59, 59, 999)) // Fin del día
          }
        }
      }
    }
  });

  // Filtrar horarios posibles en base a la disponibilidad de maquinarias
  const horariosFiltrados = posiblesHorarios.filter(horario => {
    return maquinarias.every(maquinaria => {
      return maquinaria.historial.every(hist => {
        return !haySolapamiento(
          new Date(horario.horaInicio),
          new Date(horario.horaFin),
          new Date(hist.horaInicioTrabajo),
          new Date(hist.horaFinTrabajo)
        );
      });
    });
  });

  return horariosFiltrados;
}
