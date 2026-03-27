import { prisma } from '../lib/prisma';
import { Employee } from '../model/employee';


export class EmployeeService {

    /** 
     * Create a new employee
     * @param data - Employee data to create
     * @returns The created employee
     * @throws Error if the employee creation fails
     */
    static async createEmployee(data: Employee): Promise<Employee> {
        // Ensure required non-nullable fields have sensible defaults to avoid Prisma validation errors
        const middleName = data.middle_name ?? '';
        const socialCode = data.social_code ?? '';
        const hireDate = data.hire_date ? new Date(data.hire_date as any) : new Date();
        const positionId = data.position_id ?? null;

        // Map frontend status strings to single-char DB values (schema uses Char(1))
        const statusMap: Record<string, string> = {
            active: 'A',
            vacation: 'V',
            incomplete_assistance: 'I',
            incapacity_maternity: 'M'
        };
        const statusChar = (typeof data.status === 'string' && data.status.length === 1)
            ? data.status
            : statusMap[data.status as string] ?? 'A';

        // Build create payload. If positionId is provided, connect the relation (do NOT also provide the scalar field).
        const createPayload: any = {
            employee_first_name: data.name,
            employee_last_name: data.last_name,
            employee_middle_name: middleName,
            employee_national_id: data.national_id,
            employee_social_code: socialCode,
            employee_email: data.email,
            employee_hire_date: hireDate,
            employee_exit_date: null,
            employee_fired: false,
            employee_status: statusChar,
            employee_required_hours_biweekly: data.required_hours_biweekly || null,
            employee_version: 1
        };

        if (positionId) {
            createPayload.vpg_positions = { connect: { position_id: positionId } };
        }

        const prismaEmployee = await prisma.vpg_employees.create({

            data: createPayload

        });

        const fullName = `${prismaEmployee.employee_first_name} ${prismaEmployee.employee_middle_name} ${prismaEmployee.employee_last_name}`.replace(/\s+/g, ' ').trim();

        const employee: Employee = {
            id: prismaEmployee.employee_id,
            name: fullName,
            last_name: prismaEmployee.employee_last_name,
            middle_name: prismaEmployee.employee_middle_name,
            national_id: prismaEmployee.employee_national_id,
            social_code: prismaEmployee.employee_social_code,
            email: prismaEmployee.employee_email,
            hire_date: prismaEmployee.employee_hire_date,
            fired: prismaEmployee.employee_fired,
            status: prismaEmployee.employee_status,
            required_hours_biweekly: prismaEmployee.employee_required_hours_biweekly ? Number(prismaEmployee.employee_required_hours_biweekly) : undefined,
            version: prismaEmployee.employee_version,
            position_id: prismaEmployee.employee_position_id
        };

        return employee;
    }
    /**
     * Get an employee by ID
     * @param id - The ID of the employee to retrieve
     * @returns The employee with the specified ID, or null if not found
     */
    static async getEmployeeById(id: number): Promise<Employee | null> {
        const prismaEmployee = await prisma.vpg_employees.findUnique({
            where: { employee_id: id }
        });
        
        if (!prismaEmployee) {
            return null;
        }

        const fullName = `${prismaEmployee.employee_first_name} ${prismaEmployee.employee_middle_name} ${prismaEmployee.employee_last_name}`.replace(/\s+/g, ' ').trim();

        const employee: Employee = {
            id: prismaEmployee.employee_id,
            name: fullName,
            last_name: prismaEmployee.employee_last_name,
            middle_name: prismaEmployee.employee_middle_name,
            national_id: prismaEmployee.employee_national_id,
            social_code: prismaEmployee.employee_social_code,
            email: prismaEmployee.employee_email,
            hire_date: prismaEmployee.employee_hire_date,
            fired: prismaEmployee.employee_fired,
            status: prismaEmployee.employee_status,
            required_hours_biweekly: prismaEmployee.employee_required_hours_biweekly ? Number(prismaEmployee.employee_required_hours_biweekly) : undefined,
            version: prismaEmployee.employee_version,
            position_id: prismaEmployee.employee_position_id
        };

        return employee;
    }

    /**
     * Update an employee by ID
     * @param id - The ID of the employee to update
     * @param data - The updated employee data
     * @returns The updated employee, or null if not found
     */
    static async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee | null> {
        // Map frontend status strings to single-char DB values (schema uses Char(1)).
        // Mirrors the same mapping used in createEmployee.
        const statusMap: Record<string, string> = {
            active: 'A',
            vacation: 'V',
            incomplete_assistance: 'I',
            incapacity_maternity: 'M'
        };
        const statusChar = data.status !== undefined
            ? ((typeof data.status === 'string' && data.status.length === 1)
                ? data.status
                : statusMap[data.status as string] ?? data.status)
            : undefined;

        const prismaEmployee = await prisma.vpg_employees.update({
            where: { employee_id: id },
            data: {
                employee_first_name: data.name,
                employee_last_name: data.last_name,
                employee_middle_name: data.middle_name || '',
                employee_national_id: data.national_id || '',
                employee_social_code: data.social_code || '',
                employee_email: data.email,
                employee_hire_date: data.hire_date,
                employee_exit_date: data.exit_date || null,
                employee_fired: data.fired || false,
                employee_status: statusChar,
                employee_required_hours_biweekly: data.required_hours_biweekly || null,
                employee_version: (data.version || 1) + 1, // Increment version
                employee_position_id: data.position_id
            }
        });

        if (!prismaEmployee) {
            return null;
        }

        const fullName = `${prismaEmployee.employee_first_name} ${prismaEmployee.employee_middle_name} ${prismaEmployee.employee_last_name}`.replace(/\s+/g, ' ').trim();

        const employee: Employee = {
            id: prismaEmployee.employee_id,
            name: fullName,
            last_name: prismaEmployee.employee_last_name,
            middle_name: prismaEmployee.employee_middle_name,
            national_id: prismaEmployee.employee_national_id,
            social_code: prismaEmployee.employee_social_code,
            email: prismaEmployee.employee_email,
            hire_date: prismaEmployee.employee_hire_date,
            fired: prismaEmployee.employee_fired,
            status: prismaEmployee.employee_status,
            required_hours_biweekly: prismaEmployee.employee_required_hours_biweekly ? Number(prismaEmployee.employee_required_hours_biweekly) : undefined,
            version: prismaEmployee.employee_version,
            position_id: prismaEmployee.employee_position_id
        };

        return employee;
    }

    /**
     * Get all employees
     * @returns A list of all employees
     */
    static async getAllEmployees(): Promise<Employee[]> {
        const prismaEmployees = await prisma.vpg_employees.findMany();

        const employees: Employee[] = prismaEmployees.map(prismaEmployee => {
            const fullName = `${prismaEmployee.employee_first_name} ${prismaEmployee.employee_middle_name} ${prismaEmployee.employee_last_name}`.replace(/\s+/g, ' ').trim();
            return {
                id: prismaEmployee.employee_id,
                name: fullName,
                last_name: prismaEmployee.employee_last_name,
                middle_name: prismaEmployee.employee_middle_name,
                national_id: prismaEmployee.employee_national_id,
                social_code: prismaEmployee.employee_social_code,
                email: prismaEmployee.employee_email,
                hire_date: prismaEmployee.employee_hire_date,
                fired: prismaEmployee.employee_fired,
                status: prismaEmployee.employee_status,
                required_hours_biweekly: prismaEmployee.employee_required_hours_biweekly ? Number(prismaEmployee.employee_required_hours_biweekly) : undefined,
                version: prismaEmployee.employee_version,
                position_id: prismaEmployee.employee_position_id
            };
        });

        return employees;
    }

    /**
     * Get employees that should be considered for payroll within a period
     * Rules (assumptions):
     *  - Not fired (employee_fired = false)
     *  - Status is Active or Vacation (DB stores Char(1): 'A' active, 'V' vacation)
     *  - Hired on/before endDate
     *  - Exit date is null OR exit date is on/after startDate
     */
    static async getActiveEmployeesForPeriod(startDate: Date, endDate: Date): Promise<Employee[]> {
        const prismaEmployees = await prisma.vpg_employees.findMany({
            where: {
                employee_fired: false,
                employee_status: { in: ['A', 'V'] },
                employee_hire_date: { lte: endDate },
                OR: [
                    { employee_exit_date: null },
                    { employee_exit_date: { gte: startDate } }
                ]
            }
        });

        const employees: Employee[] = prismaEmployees.map(prismaEmployee => {
            const fullName = `${prismaEmployee.employee_first_name} ${prismaEmployee.employee_middle_name} ${prismaEmployee.employee_last_name}`.replace(/\s+/g, ' ').trim();
            return {
                id: prismaEmployee.employee_id,
                name: fullName,
                last_name: prismaEmployee.employee_last_name,
                middle_name: prismaEmployee.employee_middle_name,
                national_id: prismaEmployee.employee_national_id,
                social_code: prismaEmployee.employee_social_code,
                email: prismaEmployee.employee_email,
                hire_date: prismaEmployee.employee_hire_date,
                fired: prismaEmployee.employee_fired,
                status: prismaEmployee.employee_status,
                required_hours_biweekly: prismaEmployee.employee_required_hours_biweekly ? Number(prismaEmployee.employee_required_hours_biweekly) : undefined,
                version: prismaEmployee.employee_version,
                position_id: prismaEmployee.employee_position_id
            };
        });

        return employees;
    }

}
