package com.verde.pradera.utils;

import com.verde.pradera.models.MarkType;
import com.verde.pradera.models.clockLogsDB;

import java.io.*;
import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Utility class to read serialized (.ser) files containing employee clock log records.
 * This class deserializes the file, converts the objects into a List of clockLogsDB,
 * and looks up the employee ID from the database using the employee's name.
 */
public class fileReader {

    private final QueryManager queryManager;

    public fileReader() {
        this.queryManager = new QueryManager();
    }

    /**
     * Reads and processes a Java serialized file.
     * @param serFile The .ser file to process.
     * @return A list of processed clockLogsDB objects.
     * @throws IOException If an I/O error occurs.
     * @throws ClassNotFoundException If the class of a serialized object cannot be found.
     */
    public List<clockLogsDB> readAndProcess(File serFile) throws IOException, ClassNotFoundException {
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(serFile))) {
            Object readObject = ois.readObject();

            if (readObject instanceof List<?> list) {
                if (list.isEmpty()) {
                    return List.of();
                }
                // Process each item, convert it to a clockLog, and filter out any nulls.
                return list.stream()
                           .map(this::convertToClockLog)
                           .filter(Objects::nonNull)
                           .collect(Collectors.toList());
            }
            throw new IOException("The .ser file is expected to contain a List, but found: " + readObject.getClass().getName());
        }
    }

    /**
     * Converts a generic object (Map or POJO) into a clockLogsDB object.
     */
    private clockLogsDB convertToClockLog(Object rawObject) {
        if (rawObject instanceof Map<?, ?> map) {
            String name = str(map.get("nombreEmpleado"), map.get("empleado"), map.get("nombre"));
            String dateStr = str(map.get("fecha"));
            String timeStr = str(map.get("hora"));
            String typeStr = str(map.get("tipoMarca"), map.get("tipo"), map.get("linea"));
            return buildClockLog(name, dateStr, timeStr, typeStr);
        }

        // Fallback: try reflection for POJOs with getters.
        String name = invokeString(rawObject, "getNombreEmpleado", "getEmpleado", "getNombre");
        String dateStr = invokeString(rawObject, "getFecha", "getDia");
        String timeStr = invokeString(rawObject, "getHora");
        String typeStr = invokeString(rawObject, "getTipoMarca", "getTipo", "getLinea");

        return buildClockLog(name, dateStr, timeStr, typeStr);
    }

    /**
     * Builds a clockLogsDB object from parsed values and by fetching the employee ID.
     */
    private clockLogsDB buildClockLog(String name, String dateStr, String timeStr, String typeStr) {
        if (name == null || name.isBlank()) {
            System.err.println("Skipping record due to missing employee name.");
            return null;
        }

        // 1. Find employee ID by calling getResult and parsing its string output.
        String resultString = queryManager.getResult("employee.findByName", name.trim());
        Integer employeeId = null;

        // Parse the string "employee_id = 2" to get the ID.
        if (resultString != null && !resultString.contains("No results found.")) {
            try {
                String[] parts = resultString.split("=");
                if (parts.length > 1) {
                    String idValue = parts[1].trim(); // Get the part after "=".
                    employeeId = Integer.parseInt(idValue);
                }
            } catch (NumberFormatException e) {
                System.err.println("Failed to parse employee ID from string: '" + resultString + "' for name: '" + name + "'.");
                return null;
            }
        }

        if (employeeId == null) {
            System.err.println("Could not find employee ID for: '" + name + "'. Skipping record.");
            return null;
        }

        // 2. Parse other fields.
        LocalDate date = parseDate(dateStr);
        LocalTime time = parseTime(timeStr);
        MarkType type = MarkType.fromCodigo(typeStr != null && typeStr.contains("/") ? "ENTRADA" : typeStr);

        if (date == null || time == null || type == null) {
            System.err.println("Skipping record for '" + name + "' due to missing date, time, or type.");
            return null;
        }

        // 3. Create and populate the clockLogsDB object.
        clockLogsDB log = new clockLogsDB();
        log.setClock_logs_employee_id(employeeId);
        log.setClock_logs_timestamp(Timestamp.valueOf(LocalDateTime.of(date, time)));
        log.setClock_logs_log_type(type.name());
        log.setClock_logs_remarks("Original name from file: " + name);
        log.setClock_logs_version(1); // Default version.

        return log;
    }

    // --- Parsing Utilities ---

    private static LocalDate parseDate(String s) {
        if (s == null) return null;
        try {
            if (s.contains("/")) { // dd/MM/yyyy format
                String[] p = s.split("/");
                return LocalDate.of(Integer.parseInt(p[2]), Integer.parseInt(p[1]), Integer.parseInt(p[0]));
            }
            return LocalDate.parse(s.trim()); // ISO format (yyyy-MM-dd)
        } catch (Exception e) {
            System.err.println("Could not parse date: " + s);
            return null;
        }
    }

    private static LocalTime parseTime(String s) {
        if (s == null) return null;
        try {
            return LocalTime.parse(s.trim());
        } catch (Exception e) {
            System.err.println("Could not parse time: " + s);
            return null;
        }
    }

    private static String str(Object... options) {
        for (Object opt : options) {
            if (opt != null) return String.valueOf(opt);
        }
        return null;
    }

    private static String invokeString(Object obj, String... getterMethodNames) {
        for (String methodName : getterMethodNames) {
            try {
                Method method = obj.getClass().getMethod(methodName);
                Object value = method.invoke(obj);
                if (value != null) return String.valueOf(value);
            } catch (NoSuchMethodException ignored) {
                // Try next getter.
            } catch (Exception e) {
                throw new RuntimeException("Error invoking " + methodName, e);
            }
        }
        return null;
    }
}
