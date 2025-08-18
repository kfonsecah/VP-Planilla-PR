import { Router } from "express";
import { EmployeeController } from "../controller/EmployeeController";

const router = Router();

/**
 * Create a new employee
 * POST /employee/create
 */
router.post("/employee/create", EmployeeController.createEmployee);
/**
 * Get an employee by ID
 * GET /employee/:id
 */
router.get("/employee/:id", EmployeeController.getEmployeeById);
/**
 * Update an employee by ID
 * PUT /employee/:id
 */
router.put("/employee/:id", EmployeeController.updateEmployee);
/**
 * Get all employees
 * GET /employee
 */
router.get("/employee", EmployeeController.getAllEmployees);

export default router;
