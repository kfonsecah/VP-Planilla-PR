import { http } from './http';

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
