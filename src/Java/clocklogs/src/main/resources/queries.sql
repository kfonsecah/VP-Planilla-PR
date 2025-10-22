-- name: employee.findByName
SELECT e.employee_id FROM VPG_EMPLOYEES e WHERE (e.employee_first_name || ' ' || COALESCE(e.employee_last_name || ' ', '') || e.employee_middle_name) = ?;

-- name: clock_logs.insert
INSERT INTO vpg_clock_logs (
    clock_logs_employee_id,
    clock_logs_timestamp,
    clock_logs_log_type,
    clock_logs_remarks,
    clock_logs_version
) VALUES (?, ?, ?, ?, ?);
