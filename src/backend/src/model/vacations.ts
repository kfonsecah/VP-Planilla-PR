export interface Vacation {
    id: number;
    employee_id: number;
    start_date: Date;
    end_date: Date;
    total_days?: number;
    paid: boolean;
    status: string;
    version: number;
}