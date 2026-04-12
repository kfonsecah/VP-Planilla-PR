package com.verde.pradera.controller;

import com.verde.pradera.models.clockLogsDB;
import com.verde.pradera.utils.QueryManager;
import com.verde.pradera.utils.fileReader;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;

/**
 * Watches a directory for new .ser files, processes them, and saves them to the
 * database.
 */
public class ClockLogProcessor {

    private final fileReader reader;

    public ClockLogProcessor() {
        this(new fileReader());
    }

    public ClockLogProcessor(fileReader reader) {
        this.reader = reader;
    }

    /**
     * Starts watching the specified directory for new .ser files indefinitely.
     * 
     * @param directoryPath The path to the directory to watch.
     */
    public void startWatching(Path directoryPath) {
        System.out.println("▶️ Starting watch service for directory: " + directoryPath);
        try (WatchService watchService = FileSystems.getDefault().newWatchService()) {
            // Register the directory to watch for ENTRY_CREATE events.
            directoryPath.register(watchService, StandardWatchEventKinds.ENTRY_CREATE);

            // Create a sub-directory for failed files.
            Path errorDir = directoryPath.resolve("processed_error");
            Files.createDirectories(errorDir);

            // Infinite loop to wait for events.
            while (true) {
                WatchKey key;
                try {
                    // Wait for a key to be signaled.
                    key = watchService.take();
                } catch (InterruptedException e) {
                    System.err.println("Watch service interrupted.");
                    Thread.currentThread().interrupt();
                    return;
                }

                for (WatchEvent<?> event : key.pollEvents()) {
                    WatchEvent.Kind<?> kind = event.kind();
                    if (kind == StandardWatchEventKinds.OVERFLOW) continue;
                    @SuppressWarnings("unchecked")
                    WatchEvent<Path> ev = (WatchEvent<Path>) event;
                    Path fileName = ev.context();
                    Path fullPath = directoryPath.resolve(fileName);

                    List<clockLogsDB> clockLogs = null;
                    try {
                        if (fileName.toString().endsWith(".ser")) {
                            System.out.println("\n✅ New .ser file detected: " + fileName);
                            clockLogs = reader.readAndProcess(fullPath.toFile());
                        } else if (fileName.toString().endsWith(".csv")) {
                            System.out.println("\n✅ New .csv file detected: " + fileName);
                            clockLogs = reader.readCSV(fullPath.toFile());
                        } else if (fileName.toString().endsWith(".xlsx") || fileName.toString().endsWith(".xls")) {
                            System.out.println("\n✅ New .xls file detected: " + fileName);
                            clockLogs = reader.readXLS(fullPath.toFile());
                        }
                        if (clockLogs != null && !clockLogs.isEmpty()) {
                            printProcessedLogs(clockLogs);
                            saveClockLogsToDatabase(clockLogs);
                            fullPath.toFile().delete();
                        }
                    } catch (Exception e) {
                        System.err.println("❌ Failed to process file '" + fileName + "'.");
                        e.printStackTrace();
                        Path targetPath = errorDir.resolve(fileName);
                        Files.move(fullPath, targetPath, StandardCopyOption.REPLACE_EXISTING);
                        System.out.println("❌ Moved failed file to: " + targetPath);
                    }
                }

                // Reset the key -- this is crucial to receive further watch events.
                boolean valid = key.reset();
                if (!valid) {
                    break; // Exit loop if the key is no longer valid.
                }
            }
        } catch (IOException e) {
            System.err.println("A critical I/O error occurred in the watch service: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void printProcessedLogs(List<clockLogsDB> clockLogs) {
        System.out.println("\n--- Clock-in/out Records Processed Successfully ---");
        for (clockLogsDB log : clockLogs) {
            System.out.printf(
                    "Employee ID: %-5d | Timestamp: %s | Type: %-10s | Remarks: %s%n",
                    log.getClock_logs_employee_id(),
                    log.getClock_logs_timestamp(),
                    log.getClock_logs_log_type(),
                    log.getClock_logs_remarks());
        }
        System.out.println("----------------------------------------------------");
        System.out.println("Total records processed: " + clockLogs.size());
    }

    private void saveClockLogsToDatabase(List<clockLogsDB> clockLogs) {
        if (clockLogs == null || clockLogs.isEmpty()) {
            return;
        }
        System.out.println("\n--- Starting Database Insertion ---");
        QueryManager queryManager = new QueryManager();
        int successCount = 0;
        int failureCount = 0;

        for (clockLogsDB log : clockLogs) {
            try {
                int affectedRows = queryManager.executeUpdate("clock_logs.insert",
                        log.getClock_logs_employee_id(),
                        log.getClock_logs_timestamp(),
                        log.getClock_logs_log_type(),
                        log.getClock_logs_remarks(),
                        log.getClock_logs_version());
                if (affectedRows > 0) {
                    successCount++;
                } else {
                    failureCount++;
                }
            } catch (Exception e) {
                failureCount++;
                System.err.println(
                        "An error occurred while inserting log for employee ID: " + log.getClock_logs_employee_id());
            }
        }
        System.out.println("-----------------------------------");
        System.out.printf("✅ Successfully inserted: %d records.%n", successCount);
        if (failureCount > 0) {
            System.out.printf("❌ Failed to insert: %d records.%n", failureCount);
        }
    }
}
