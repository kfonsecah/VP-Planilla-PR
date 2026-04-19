export interface CompanyHoliday {
  company_holidays_id?: number;
  company_holidays_name: string;
  company_holidays_date: Date;
  company_holidays_is_mandatory?: boolean;
  company_holidays_is_triple?: boolean;
  company_holidays_status?: string;
  company_holidays_version?: number;
}
