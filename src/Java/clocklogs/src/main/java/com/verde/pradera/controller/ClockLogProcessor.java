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
        this.reader = new fileReader();
        new QueryManager();
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

                    if (kind == StandardWatchEventKinds.OVERFLOW) {
                        continue;
                    }

                    // The filename is the context of the event.
                    @SuppressWarnings("unchecked")
                    WatchEvent<Path> ev = (WatchEvent<Path>) event;
                    Path fileName = ev.context();

                    if (fileName.toString().endsWith(".ser")) {
                        Path fullPath = directoryPath.resolve(fileName);
                        System.out.println("\n✅ New .ser file detected: " + fileName);
                        processFile(fullPath.toFile(), errorDir);
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

    /**
     * Processes a single .ser file. After processing, the file is deleted if
     * successful,
     * or moved to an error directory if it fails.
     * 
     * @param serFile  The file to process.
     * @param errorDir The directory to move failed files to.
     */
    private void processFile(File serFile, Path errorDir) {
        boolean success = false;
        try {
            // Give the file system a moment to finish writing the file.
            Thread.sleep(500);

            List<clockLogsDB> clockLogs = reader.readAndProcess(serFile);
            if (!clockLogs.isEmpty()) {
                printProcessedLogs(clockLogs);
                saveClockLogsToDatabase(clockLogs);
            }
            success = true;
        } catch (Exception e) {
            System.err.println("❌ Failed to process file '" + serFile.getName() + "'. See error below:");
            e.printStackTrace();
        } finally {
            if (success) {
                if (serFile.delete()) {
                    System.out.println("✅ Successfully processed and deleted file: " + serFile.getName());
                }
            } else {
                try {
                    Path targetPath = errorDir.resolve(serFile.getName());
                    Files.move(serFile.toPath(), targetPath, StandardCopyOption.REPLACE_EXISTING);
                    System.out.println("❌ Moved failed file to: " + targetPath);
                } catch (IOException e) {
                    System.err.println("Could not move failed file: " + serFile.getName());
                }
            }
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
