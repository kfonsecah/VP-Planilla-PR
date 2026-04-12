package com.verde.pradera.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.verde.pradera.models.clockLogsDB;
import com.verde.pradera.utils.QueryManager;
import com.verde.pradera.utils.fileReader;

public class ClockLogProcessorTest {

    private QueryManager mockQueryManager;
    private fileReader reader;
    
    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        mockQueryManager = mock(QueryManager.class);
        reader = new fileReader(mockQueryManager);
    }

    @Test
    void testCSVParsing_Successful() throws IOException {
        // Prepare CSV file
        File csvFile = tempDir.resolve("test.csv").toFile();
        try (FileWriter writer = new FileWriter(csvFile)) {
            writer.write("nombreEmpleado,fecha,hora,tipoMarca\n");
            writer.write("Juan Perez,2024-03-20,08:00:00,ENTRADA\n");
            writer.write("Juan Perez,2024-03-20,17:00:00,SALIDA\n");
        }

        // Mock employee lookup
        when(mockQueryManager.getResult(eq("employee.findByName"), anyString()))
            .thenReturn("id = 1");

        // Execute
        List<clockLogsDB> logs = reader.readCSV(csvFile);

        // Verify
        assertEquals(2, logs.size());
        assertEquals(1, logs.get(0).getClock_logs_employee_id());
        assertEquals("ENTRADA", logs.get(0).getClock_logs_log_type());
        assertEquals("SALIDA", logs.get(1).getClock_logs_log_type());
    }

    @Test
    void testInvalidDateFormat_SkipsRecord() throws IOException {
        File csvFile = tempDir.resolve("invalid_date.csv").toFile();
        try (FileWriter writer = new FileWriter(csvFile)) {
            writer.write("nombreEmpleado,fecha,hora,tipoMarca\n");
            writer.write("Juan Perez,invalid-date,08:00:00,ENTRADA\n");
        }

        when(mockQueryManager.getResult(eq("employee.findByName"), anyString()))
            .thenReturn("id = 1");

        List<clockLogsDB> logs = reader.readCSV(csvFile);

        assertTrue(logs.isEmpty(), "Should skip record with invalid date");
    }

    @Test
    void testUnknownEmployee_SkipsRecord() throws IOException {
        File csvFile = tempDir.resolve("unknown_emp.csv").toFile();
        try (FileWriter writer = new FileWriter(csvFile)) {
            writer.write("nombreEmpleado,fecha,hora,tipoMarca\n");
            writer.write("Unknown User,2024-03-20,08:00:00,ENTRADA\n");
        }

        when(mockQueryManager.getResult(eq("employee.findByName"), anyString()))
            .thenReturn("No results found.");

        List<clockLogsDB> logs = reader.readCSV(csvFile);

        assertTrue(logs.isEmpty(), "Should skip record with unknown employee");
    }
    
    @Test
    void testAlternativeHeadersAndTypes_Normalized() throws IOException {
        File csvFile = tempDir.resolve("alt_headers.csv").toFile();
        try (FileWriter writer = new FileWriter(csvFile)) {
            writer.write("empleado,fecha,hora,tipo\n");
            writer.write("Juan Perez,2024-03-20,08:00:00,E\n");
            writer.write("Juan Perez,2024-03-20,17:00:00,S\n");
        }

        when(mockQueryManager.getResult(eq("employee.findByName"), anyString()))
            .thenReturn("id = 1");

        List<clockLogsDB> logs = reader.readCSV(csvFile);

        assertEquals(2, logs.size());
        assertEquals("ENTRADA", logs.get(0).getClock_logs_log_type());
        assertEquals("SALIDA", logs.get(1).getClock_logs_log_type());
    }

    @Test
    void testEmptyFile_ReturnsEmptyList() throws IOException {
        File csvFile = tempDir.resolve("empty.csv").toFile();
        try (FileWriter writer = new FileWriter(csvFile)) {
            writer.write("nombreEmpleado,fecha,hora,tipoMarca\n");
        }

        List<clockLogsDB> logs = reader.readCSV(csvFile);

        assertTrue(logs.isEmpty());
    }
}
