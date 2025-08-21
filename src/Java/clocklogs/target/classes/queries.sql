-- name: employee.findByName
SELECT e.employee_id FROM VPG_EMPLOYEES e WHERE (e.employee_first_name || ' ' || COALESCE(e.employee_last_name || ' ', '') || e.employee_middle_name) = ?;
