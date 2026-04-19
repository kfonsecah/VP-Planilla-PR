/**
 * Utilidades para calcular los días feriados de Costa Rica.
 * Incluye cálculo dinámico de Semana Santa (Jueves y Viernes Santo).
 */

export interface Holiday {
  date: Date;
  name: string;
  isMandatoryPay: boolean;
}

/**
 * Calcula la fecha del Domingo de Resurrección para un año dado
 * usando el algoritmo de Meeus/Jones/Butcher.
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed month
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/**
 * Retorna todos los feriados de Costa Rica para un año específico.
 */
export function getCostaRicaHolidays(year: number): Holiday[] {
  const easterSunday = getEasterSunday(year);
  
  // Jueves Santo (3 días antes del Domingo de Resurrección)
  const juevesSanto = new Date(easterSunday);
  juevesSanto.setDate(easterSunday.getDate() - 3);
  
  // Viernes Santo (2 días antes del Domingo de Resurrección)
  const viernesSanto = new Date(easterSunday);
  viernesSanto.setDate(easterSunday.getDate() - 2);

  return [
    // Feriados de Pago Obligatorio
    { date: new Date(year, 0, 1), name: 'Año Nuevo', isMandatoryPay: true }, // 1 Enero
    { date: juevesSanto, name: 'Jueves Santo', isMandatoryPay: true },
    { date: viernesSanto, name: 'Viernes Santo', isMandatoryPay: true },
    { date: new Date(year, 3, 11), name: 'Día de Juan Santamaría', isMandatoryPay: true }, // 11 Abril
    { date: new Date(year, 4, 1), name: 'Día del Trabajador', isMandatoryPay: true }, // 1 Mayo
    { date: new Date(year, 6, 25), name: 'Anexión del Partido de Nicoya', isMandatoryPay: true }, // 25 Julio
    { date: new Date(year, 7, 15), name: 'Día de la Madre', isMandatoryPay: true }, // 15 Agosto
    { date: new Date(year, 8, 15), name: 'Día de la Independencia', isMandatoryPay: true }, // 15 Septiembre
    { date: new Date(year, 11, 25), name: 'Navidad', isMandatoryPay: true }, // 25 Diciembre

    // Feriados de Pago No Obligatorio
    { date: new Date(year, 7, 2), name: 'Día de la Virgen de los Ángeles', isMandatoryPay: false }, // 2 Agosto
    { date: new Date(year, 7, 31), name: 'Día de la Persona Negra y Cultura Afrocostarricense', isMandatoryPay: false }, // 31 Agosto
    { date: new Date(year, 11, 1), name: 'Día de la Abolición del Ejército', isMandatoryPay: false }, // 1 Diciembre
  ];
}
