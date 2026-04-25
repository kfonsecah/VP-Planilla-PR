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
            employee_phone: data.phone ?? null,
            employee_gender: data.gender ?? null,
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
            phone: prismaEmployee.employee_phone ?? null,
            hire_date: prismaEmployee.employee_hire_date,
            fired: prismaEmployee.employee_fired,
            gender: prismaEmployee.employee_gender ?? null,
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
            where: { employee_id: id },
            include: { vpg_positions: true }
        });
        
        if (!prismaEmployee) {
            return null;
        }

        const fullName = `${prismaEmployee.employee_first_name} ${prismaEmployee.employee_middle_name} ${prismaEmployee.employee_last_name}`.replace(/\s+/g, ' ').trim();

        const employee: Employee = {
            id: prismaEmployee.employee_id,
            name: fullName,
            first_name: prismaEmployee.employee_first_name,
            last_name: prismaEmployee.employee_last_name,
            middle_name: prismaEmployee.employee_middle_name,
            national_id: prismaEmployee.employee_national_id,
            social_code: prismaEmployee.employee_social_code,
            email: prismaEmployee.employee_email,
            phone: prismaEmployee.employee_phone ?? null,
            hire_date: prismaEmployee.employee_hire_date,
            exit_date: prismaEmployee.employee_exit_date ?? null,
            fired: prismaEmployee.employee_fired,
            gender: prismaEmployee.employee_gender ?? null,
            status: prismaEmployee.employee_status,
            required_hours_biweekly: prismaEmployee.employee_required_hours_biweekly ? Number(prismaEmployee.employee_required_hours_biweekly) : undefined,
            version: prismaEmployee.employee_version,
            position_id: prismaEmployee.employee_position_id,
            position_name: prismaEmployee.vpg_positions?.position_name ?? null,
            position_base_salary: prismaEmployee.vpg_positions?.position_base_salary ? Number(prismaEmployee.vpg_positions.position_base_salary) : null,
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

        // Build update payload dynamically — only include fields present in the request.
        // This prevents omitted fields from overwriting existing DB values with defaults.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            employee_version: (data.version || 1) + 1,
        };
        if (data.name !== undefined)          updateData.employee_first_name = data.name;
        if (data.last_name !== undefined)     updateData.employee_last_name = data.last_name;
        if (data.middle_name !== undefined)   updateData.employee_middle_name = data.middle_name ?? '';
        if (data.national_id !== undefined)   updateData.employee_national_id = data.national_id ?? '';
        if (data.social_code !== undefined)   updateData.employee_social_code = data.social_code ?? '';
        if (data.email !== undefined)         updateData.employee_email = data.email;
        if (data.phone !== undefined)         updateData.employee_phone = data.phone || null;
        if (data.hire_date !== undefined)     updateData.employee_hire_date = data.hire_date;
        if (data.exit_date !== undefined)     updateData.employee_exit_date = data.exit_date || null;
        if (data.fired !== undefined)         updateData.employee_fired = data.fired;
        if (data.gender !== undefined)        updateData.employee_gender = data.gender || null;
        if (statusChar !== undefined)         updateData.employee_status = statusChar;
        if (data.required_hours_biweekly !== undefined) updateData.employee_required_hours_biweekly = data.required_hours_biweekly || null;
        if (data.position_id !== undefined)   updateData.employee_position_id = data.position_id;

        const prismaEmployee = await prisma.vpg_employees.update({
            where: { employee_id: id },
            data: updateData,
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
            phone: prismaEmployee.employee_phone ?? null,
            hire_date: prismaEmployee.employee_hire_date,
            fired: prismaEmployee.employee_fired,
            gender: prismaEmployee.employee_gender ?? null,
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
                phone: prismaEmployee.employee_phone ?? null,
                hire_date: prismaEmployee.employee_hire_date,
                fired: prismaEmployee.employee_fired,
                gender: prismaEmployee.employee_gender ?? null,
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
