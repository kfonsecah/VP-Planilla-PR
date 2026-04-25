import { Request, Response } from "express";
import { EmployeeService } from "../service/EmployeeService";
import { AuditLogsService } from "../service/AuditLogsService";

export class EmployeeController {
  /**
   * Create a new employee in the system
   * POST /employee/create
   * @param req - Express request object containing employee data
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with created employee data or error
   */
  static async createEmployee(req: Request, res: Response): Promise<Response> {
    const rawData = req.body;

    // Map frontend fields to Employee model fields
    const employeeData = {
      name: rawData.employee_first_name || rawData.name,
      last_name: rawData.employee_last_name || rawData.last_name,
      middle_name: rawData.employee_middle_name || rawData.middle_name || '',
      national_id: rawData.employee_national_id || rawData.national_id || '',
      social_code: rawData.employee_social_code || rawData.social_code || '',
      email: rawData.employee_email || rawData.email,
      position_id: rawData.employee_position_id || rawData.position_id,
      hire_date: rawData.employee_hire_date || rawData.hire_date,
      phone: rawData.employee_phone ?? rawData.phone ?? null,
      gender: rawData.employee_gender ?? rawData.gender ?? null,
      required_hours_biweekly: rawData.employee_required_hours_biweekly || rawData.required_hours_biweekly || null,
      status: rawData.employee_status || rawData.status || 'active'
    };

    try {
      const newEmployee = await EmployeeService.createEmployee(employeeData as any);
      return res.status(201).json(newEmployee);
    } catch (error) {
      console.error("Error creating employee:", error);
      return res.status(500).json({ error: "Failed to create employee" });
    }
  }

  /**
   * Get employee by ID
   * GET /employee/:id
   * @param req - Express request object containing employee ID in params
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with employee data or error
   */
  static async getEmployeeById(req: Request, res: Response): Promise<Response> {
    const employeeId = req.params.id as string;

    if (!employeeId || isNaN(Number(employeeId))) {
      return res.status(400).json({ error: `Invalid employee ID` });
      console.log(employeeId);
    }

    // Convert employeeId to a number
    const employeeIdNumber = parseInt(employeeId, 10);

    try {
      const employee = await EmployeeService.getEmployeeById(employeeIdNumber);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      return res.status(200).json(employee);
    } catch (error) {
      console.error("Error retrieving employee:", error);
      return res.status(500).json({ error: "Failed to retrieve employee" });
    }
  }

  /**
   * Update an existing employee
   * PUT /employee/:id
   * @param req - Express request object containing employee ID in params and update data in body
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with updated employee data or error
   */
  static async updateEmployee(req: Request, res: Response): Promise<Response> {
    const employeeId = parseInt(req.params.id as string, 10);
    const rawData = req.body;

    // Map frontend fields to Employee model fields (support both prefixed and non-prefixed).
    // Use undefined (not null/empty) for missing fields so the service can distinguish
    // "field was sent" from "field was omitted" — omitted fields must not overwrite DB values.
    const resolve = (prefixed: unknown, plain: unknown) =>
      prefixed !== undefined ? prefixed : plain;

    const employeeData: Record<string, unknown> = {};
    const name = resolve(rawData.employee_first_name, rawData.name);
    if (name !== undefined) employeeData.name = name;
    const last_name = resolve(rawData.employee_last_name, rawData.last_name);
    if (last_name !== undefined) employeeData.last_name = last_name;
    const middle_name = resolve(rawData.employee_middle_name, rawData.middle_name);
    if (middle_name !== undefined) employeeData.middle_name = middle_name;
    const national_id = resolve(rawData.employee_national_id, rawData.national_id);
    if (national_id !== undefined) employeeData.national_id = national_id;
    const social_code = resolve(rawData.employee_social_code, rawData.social_code);
    if (social_code !== undefined) employeeData.social_code = social_code;
    const email = resolve(rawData.employee_email, rawData.email);
    if (email !== undefined) employeeData.email = email;
    const phone = resolve(rawData.employee_phone, rawData.phone);
    if (phone !== undefined) employeeData.phone = phone;
    const position_id = resolve(rawData.employee_position_id, rawData.position_id);
    if (position_id !== undefined) employeeData.position_id = position_id;
    const hire_date = resolve(rawData.employee_hire_date, rawData.hire_date);
    if (hire_date !== undefined) employeeData.hire_date = hire_date;
    const exit_date = resolve(rawData.employee_exit_date, rawData.exit_date);
    if (exit_date !== undefined) employeeData.exit_date = exit_date;
    const fired = resolve(rawData.employee_fired, rawData.fired);
    if (fired !== undefined) employeeData.fired = fired;
    const gender = resolve(rawData.employee_gender, rawData.gender);
    if (gender !== undefined) employeeData.gender = gender;
    const required_hours_biweekly = resolve(rawData.employee_required_hours_biweekly, rawData.required_hours_biweekly);
    if (required_hours_biweekly !== undefined) employeeData.required_hours_biweekly = required_hours_biweekly;
    const status = resolve(rawData.employee_status, rawData.status);
    if (status !== undefined) employeeData.status = status;
    const version = resolve(rawData.employee_version, rawData.version);
    if (version !== undefined) employeeData.version = version;

    try {
      const updatedEmployee = await EmployeeService.updateEmployee(
        employeeId,
        employeeData
      );
      if (!updatedEmployee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      if (rawData.employee_status || rawData.status) {
        await AuditLogsService.createAuditLog({
          userId: req.user.id,
          action: 'CHANGE_EMPLOYEE_STATUS',
          entity: 'employee',
          entityId: employeeId,
          details: `Employee ${employeeId} status changed to ${rawData.employee_status || rawData.status}`,
        });
      }
      return res.status(200).json(updatedEmployee);
    } catch (error) {
      console.error("Error updating employee:", error);
      return res.status(500).json({ error: "Failed to update employee" });
    }
  }

  /**
   * Get all employees from the system
   * GET /employee
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with array of employees or error
   */
  static async getAllEmployees(req: Request, res: Response): Promise<Response> {
    try {
      const employees = await EmployeeService.getAllEmployees();
      return res.status(200).json(employees);
    } catch (error) {
      console.error("Error retrieving employees:", error);
      return res.status(500).json({ error: "Failed to retrieve employees" });
    }
  }
}
