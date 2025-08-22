package com.verde.pradera;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import com.verde.pradera.controller.ClockLogProcessor;

/**
 * Main entry point for the clock log processing application.
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("--- Clock Log Monitoring Service ---");

        // 1. Define a dedicated directory for incoming files.
        Path watchDirectory = Paths.get("_incoming_files");

        // 2. Create the directory if it doesn't exist.
        try {
            Files.createDirectories(watchDirectory);
        } catch (IOException e) {
            System.err.println("❌ Critical error: Could not create watch directory at " + watchDirectory.toAbsolutePath());
            e.printStackTrace();
            return;
        }
        
        // 3. Print the absolute path for clarity.
        System.out.println("✅ Service started successfully.");
        System.out.println("▶️  Please drop your .ser files in the following directory:");
        System.out.println("    " + watchDirectory.toAbsolutePath().normalize());
        
        // 4. Start the processor.
        ClockLogProcessor processor = new ClockLogProcessor();
        processor.startWatching(watchDirectory);
    }
}