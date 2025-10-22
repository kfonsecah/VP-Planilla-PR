package com.verde.pradera.utils;

import java.io.*;
import java.util.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

public class TestFileGenerator {

    public static void generate(String fileName, List<Map<String, Object>> records) {
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(fileName))) {
            oos.writeObject(records);
            System.out.println("✅ .ser file: " + fileName);
        } catch (IOException e) {
            System.err.println("❌ Error .ser: " + fileName);
            e.printStackTrace();
        }
    }

    public static void generateCSV(String fileName, List<Map<String, Object>> records) {
        // Reunir todas las claves únicas de todos los registros
        Set<String> headers = new LinkedHashSet<>();
        for (Map<String, Object> record : records) headers.addAll(record.keySet());
        try (FileWriter writer = new FileWriter(fileName)) {
            writer.append(String.join(",", headers)).append("\n");
            for (Map<String, Object> record : records) {
                List<String> row = new ArrayList<>();
                for (String h : headers) row.add(String.valueOf(record.getOrDefault(h, "")));
                writer.append(String.join(",", row)).append("\n");
            }
            System.out.println("✅ .csv file: " + fileName);
        } catch (IOException e) {
            System.err.println("❌ Error .csv: " + fileName);
            e.printStackTrace();
        }
    }

    public static void generateXLS(String fileName, List<Map<String, Object>> records) {
        try (Workbook wb = new XSSFWorkbook()) {
            Set<String> headers = new LinkedHashSet<>();
            for (Map<String, Object> record : records) headers.addAll(record.keySet());
            Sheet sheet = wb.createSheet("Logs");
            Row headerRow = sheet.createRow(0);
            int col = 0;
            for (String h : headers) headerRow.createCell(col++).setCellValue(h);
            int rowIdx = 1;
            for (Map<String, Object> record : records) {
                Row row = sheet.createRow(rowIdx++);
                col = 0;
                for (String h : headers) row.createCell(col++).setCellValue(String.valueOf(record.getOrDefault(h, "")));
            }
            try (FileOutputStream fos = new FileOutputStream(fileName)) {
                wb.write(fos);
            }
            System.out.println("✅ .xlsx file: " + fileName);
        } catch (IOException e) {
            System.err.println("❌ Error .xlsx: " + fileName);
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        System.out.println("--- Generating Test .ser Files ---");

        // --- File 1: A standard record for Alejandro ---
        /*
         * record1.put("nombreEmpleado", "Kendall Fonseca Hidalgo");
         * List<Map<String, Object>> records1 = new ArrayList<>();
         * Map<String, Object> record1 = new HashMap<>();
         * record1.put("fecha", "22/08/2025");
         * record1.put("hora", "08:59");
         * record1.put("tipoMarca", "ENTRADA");
         * records1.add(record1);
         * generate("prueba3.ser", records1);
         * generateCSV("prueba3.csv", records1);
         * generateXLS("prueba3.xlsx", records1);
         */

        // --- File 2: Multiple records with different map keys to test flexibility ---
        List<Map<String, Object>> records2 = new ArrayList<>();
        Map<String, Object> record2a = new HashMap<>();

        record2a.put("nombreEmpleado", "Alejandro León Marín");
        record2a.put("fecha", "22/08/2025");
        record2a.put("hora", "09:15");
        record2a.put("tipoMarca", "ENTRADA");
        records2.add(record2a);

        Map<String, Object> record2b = new HashMap<>();
        record2b.put("empleado", "fas asf fae"); // Using "empleado" as key
        record2b.put("fecha", "22/08/2025");
        record2b.put("hora", "09:15");
        record2b.put("tipo", "ENTRADA"); // Using "tipo" as key
        records2.add(record2b);

        Map<String, Object> record2c = new HashMap<>();
        record2c.put("nombre", "Kendall Fonseca Hidalgo"); // Using "nombre" as key
        record2c.put("fecha", "22/08/2025");
        record2c.put("hora", "17:30");
        record2c.put("linea", "SALIDA"); // Using "linea" as key
        records2.add(record2c);
        generate("multi_log3.ser", records2);
        generateCSV("multi_log3.csv", records2);
        generateXLS("multi_log3.xlsx", records2);

        System.out.println("\n--- Finished ---");
        System.out.println("You can now move these .ser files into the '_incoming_files' directory to be processed.");
    }
}