import { Request, Response } from "express";
import { EmployeeService } from "../service/EmployeeService";

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
      required_hours_biweekly: rawData.employee_required_hours_biweekly || rawData.required_hours_biweekly || null,
      status: rawData.employee_status || rawData.status || 'active'
    };

    try {
      const newEmployee = await EmployeeService.createEmployee(employeeData);
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
    const employeeId = req.params.id;

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
    const employeeId = parseInt(req.params.id, 10);
    const rawData = req.body;

    // Map frontend fields to Employee model fields (support both prefixed and non-prefixed)
    const employeeData = {
      name: rawData.employee_first_name || rawData.name,
      last_name: rawData.employee_last_name || rawData.last_name,
      middle_name: rawData.employee_middle_name || rawData.middle_name || '',
      national_id: rawData.employee_national_id || rawData.national_id || '',
      social_code: rawData.employee_social_code || rawData.social_code || '',
      email: rawData.employee_email || rawData.email,
      position_id: rawData.employee_position_id ?? rawData.position_id,
      hire_date: rawData.employee_hire_date || rawData.hire_date,
      exit_date: rawData.employee_exit_date || rawData.exit_date,
      fired: rawData.employee_fired ?? rawData.fired ?? false,
      required_hours_biweekly: rawData.employee_required_hours_biweekly ?? rawData.required_hours_biweekly ?? null,
      status: rawData.employee_status || rawData.status,
      version: rawData.employee_version || rawData.version
    };

    try {
      const updatedEmployee = await EmployeeService.updateEmployee(
        employeeId,
        employeeData
      );
      if (!updatedEmployee) {
        return res.status(404).json({ error: "Employee not found" });
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
