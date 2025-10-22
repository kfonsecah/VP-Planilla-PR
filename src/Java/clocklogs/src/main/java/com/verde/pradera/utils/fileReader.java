package com.verde.pradera.utils;

import com.verde.pradera.models.MarkType;
import com.verde.pradera.models.clockLogsDB;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.*;
import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Utility class to read serialized (.ser), CSV (.csv), and Excel (.xlsx) files
 * containing employee clock log records.
 */
public class fileReader {

    private final QueryManager queryManager;

    public fileReader() {
        this.queryManager = new QueryManager();
    }

    /**
     * Reads and processes a Java serialized file.
     */
    public List<clockLogsDB> readAndProcess(File serFile) throws IOException, ClassNotFoundException {
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(serFile))) {
            Object readObject = ois.readObject();

            if (readObject instanceof List<?> list) {
                return list.stream()
                        .map(this::convertToClockLog)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
            }
            throw new IOException(
                    "The .ser file is expected to contain a List, but found: " + readObject.getClass().getName());
        }
    }

    /**
     * Reads and processes a CSV file.
     */
    public List<clockLogsDB> readCSV(File csvFile) throws IOException {
        List<clockLogsDB> result = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(csvFile))) {
            String[] headers = br.readLine().split(",");
            String line;
            while ((line = br.readLine()) != null) {
                String[] values = line.split(",", -1); // Use -1 to include trailing empty strings
                Map<String, Object> map = new HashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    // Always put the value, even if it's an empty string.
                    map.put(headers[i], i < values.length ? values[i] : "");
                }
                clockLogsDB log = convertToClockLog(map);
                if (log != null) {
                    result.add(log);
                }
            }
        }
        return result;
    }

    /**
     * Reads and processes an Excel (.xlsx) file.
     */
    public List<clockLogsDB> readXLS(File xlsFile) throws IOException {
        List<clockLogsDB> result = new ArrayList<>();
        try (FileInputStream fis = new FileInputStream(xlsFile);
                Workbook wb = new XSSFWorkbook(fis)) {
            Sheet sheet = wb.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return result;

            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) {
                headers.add(cell.getStringCellValue());
            }

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                Map<String, Object> map = new HashMap<>();
                for (int c = 0; c < headers.size(); c++) {
                    Cell cell = row.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    // Always put the value, even if it's an empty string.
                    map.put(headers.get(c), cell == null ? "" : cell.toString());
                }
                clockLogsDB log = convertToClockLog(map);
                if (log != null) {
                    result.add(log);
                }
            }
        }
        return result;
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

        // Fallback for other object types
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

        String resultString = queryManager.getResult("employee.findByName", name.trim());
        Integer employeeId = null;

        if (resultString != null && !resultString.contains("No results found.")) {
            try {
                String idValue = resultString.split("=")[1].trim();
                employeeId = Integer.parseInt(idValue);
            } catch (Exception e) {
                System.err.println("Failed to parse employee ID from: '" + resultString + "' for name: '" + name + "'.");
                return null;
            }
        }

        if (employeeId == null) {
            System.err.println("Could not find employee ID for: '" + name + "'. Skipping record.");
            return null;
        }

        LocalDate date = parseDate(dateStr);
        LocalTime time = parseTime(timeStr);
        MarkType type = MarkType.fromCodigo(typeStr);

        if (date == null || time == null || type == null) {
            System.err.println("Skipping record for '" + name + "' due to missing date, time, or type.");
            return null;
        }

        clockLogsDB log = new clockLogsDB();
        log.setClock_logs_employee_id(employeeId);
        log.setClock_logs_timestamp(Timestamp.valueOf(LocalDateTime.of(date, time)));
        log.setClock_logs_log_type(type.name());
        log.setClock_logs_remarks("Original name from file: " + name);
        log.setClock_logs_version(1);

        return log;
    }

    // --- Parsing and Helper Utilities ---

    private static LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            if (s.contains("/")) {
                String[] p = s.split("/");
                return LocalDate.of(Integer.parseInt(p[2]), Integer.parseInt(p[1]), Integer.parseInt(p[0]));
            }
            return LocalDate.parse(s.trim());
        } catch (Exception e) {
            System.err.println("Could not parse date: " + s);
            return null;
        }
    }

    private static LocalTime parseTime(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalTime.parse(s.trim());
        } catch (Exception e) {
            System.err.println("Could not parse time: " + s);
            return null;
        }
    }

    private static String str(Object... options) {
        for (Object opt : options) {
            if (opt != null && !String.valueOf(opt).isBlank()) {
                return String.valueOf(opt);
            }
        }
        return null;
    }

    private static String invokeString(Object obj, String... getterMethodNames) {
        for (String methodName : getterMethodNames) {
            try {
                Method method = obj.getClass().getMethod(methodName);
                Object value = method.invoke(obj);
                if (value != null && !String.valueOf(value).isBlank()) {
                    return String.valueOf(value);
                }
            } catch (NoSuchMethodException ignored) {
            } catch (Exception e) {
                throw new RuntimeException("Error invoking " + methodName, e);
            }
        }
        return null;
    }
}
