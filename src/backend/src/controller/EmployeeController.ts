import { Request, Response } from "express";
import { EmployeeService } from "../service/EmployeeService";

export class EmployeeController {
  /**
   * Create a new employee
   * POST /employee/create
   */

  static async createEmployee(req: Request, res: Response): Promise<Response> {
    const employeeData = req.body;

    try {
      const newEmployee = await EmployeeService.createEmployee(employeeData);
      return res.status(201).json(newEmployee);
    } catch (error) {
      console.error("Error creating employee:", error);
      return res.status(500).json({ error: "Failed to create employee" });
    }
  }

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

  static async updateEmployee(req: Request, res: Response): Promise<Response> {
    const employeeId = parseInt(req.params.id, 10);
    const employeeData = req.body;

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
