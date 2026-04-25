import { http } from './http';

export interface CRHoliday {
  date: Date;
  name: string;
  isMandatoryPay: boolean;
}

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
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/** Generates Costa Rica national holidays for a given year (Meeus/Jones/Butcher algorithm for Easter). */
export function getCostaRicaHolidays(year: number): CRHoliday[] {
  const easter = getEasterSunday(year);
  const juevesSanto = new Date(easter); juevesSanto.setDate(easter.getDate() - 3);
  const viernesSanto = new Date(easter); viernesSanto.setDate(easter.getDate() - 2);
  return [
    { date: new Date(year, 0, 1),  name: 'Año Nuevo',                          isMandatoryPay: true },
    { date: juevesSanto,            name: 'Jueves Santo',                        isMandatoryPay: true },
    { date: viernesSanto,           name: 'Viernes Santo',                       isMandatoryPay: true },
    { date: new Date(year, 3, 11), name: 'Día de Juan Santamaría',              isMandatoryPay: true },
    { date: new Date(year, 4, 1),  name: 'Día del Trabajador',                  isMandatoryPay: true },
    { date: new Date(year, 6, 25), name: 'Día de la Anexión de Guanacaste',     isMandatoryPay: true },
    { date: new Date(year, 7, 15), name: 'Día de la Madre',                     isMandatoryPay: true },
    { date: new Date(year, 8, 15), name: 'Día de la Independencia',             isMandatoryPay: true },
    { date: new Date(year, 11, 25), name: 'Navidad',                            isMandatoryPay: true },
    { date: new Date(year, 7, 2),  name: 'Día de la Virgen de los Angeles',     isMandatoryPay: false },
    { date: new Date(year, 9, 12), name: 'Día de las Culturas',                 isMandatoryPay: false },
  ];
}

export interface CompanyHoliday {
  company_holidays_id: number;
  company_holidays_date: string;
  company_holidays_name: string;
  company_holidays_is_mandatory: boolean;
  company_holidays_is_triple: boolean;
  company_holidays_status: string;
}

export const holidaysService = {
  /**
   * Retrieves all active holidays, optionally filtered by year
   */
  getAll: (year?: number): Promise<CompanyHoliday[]> => {
    return http.get(year ? `/company-holidays?year=${year}` : '/company-holidays');
  },

  /**
   * Retrieves a specific holiday by ID
   */
  getById: (id: number): Promise<CompanyHoliday> => {
    return http.get(`/company-holidays/${id}`);
  },

  /**
   * Creates a new holiday record
   */
  create: (data: Partial<CompanyHoliday>): Promise<CompanyHoliday> => {
    return http.post('/company-holidays', data);
  },

  /**
   * Creates multiple holiday records in a batch
   */
  createMany: (data: Partial<CompanyHoliday>[]): Promise<{ count: number }> => {
    return http.post('/company-holidays/batch', data);
  },

  /**
   * Updates an existing holiday
   */
  update: (id: number, data: Partial<CompanyHoliday>): Promise<CompanyHoliday> => {
    return http.put(`/company-holidays/${id}`, data);
  },

  /**
   * Deletes a holiday
   */
  delete: (id: number): Promise<CompanyHoliday> => {
    return http.delete(`/company-holidays/${id}`);
  }
};
