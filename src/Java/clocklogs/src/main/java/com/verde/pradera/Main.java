package com.verde.pradera;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import com.verde.pradera.controller.ClockLogProcessor;

/**
 * Main entry point for the clock log processing application.
 */
public class Main {

    /**
     * Determines the base directory of the application. If running from a JAR, it's the
     * directory containing the JAR. If running from an IDE, it's the target/classes directory.
     * @return The base path of the application.
     * @throws URISyntaxException if the location URL is not a valid URI.
     */
    private static Path getApplicationBaseDir() throws URISyntaxException {
        // This gets the location of the code that is currently running.
        Path codeSourcePath = Paths.get(Main.class.getProtectionDomain().getCodeSource().getLocation().toURI());
        
        // If the path points to a file, it's a JAR. We want its parent directory.
        if (Files.isRegularFile(codeSourcePath)) {
            return codeSourcePath.getParent();
        }
        // Otherwise, we are likely running from an IDE (e.g., in the target/classes folder).
        // We'll use the project root as the base in this case.
        return Paths.get(".");
    }

    public static void main(String[] args) {
        System.out.println("--- Clock Log Monitoring Service ---");

        try {
            // 1. Determine the application's base directory (where the JAR is).
            Path baseDirectory = getApplicationBaseDir();
            Path watchDirectory = baseDirectory.resolve("_incoming_files");

            // 2. Create the directory if it doesn't exist.
            Files.createDirectories(watchDirectory);
            
            // 3. Print the absolute path for clarity.
            System.out.println("✅ Service started successfully.");
            System.out.println("▶️  Please drop your .ser files in the following directory:");
            System.out.println("    " + watchDirectory.toAbsolutePath().normalize());
            
            // 4. Start the processor.
            ClockLogProcessor processor = new ClockLogProcessor();
            processor.startWatching(watchDirectory);

        } catch (IOException | URISyntaxException e) {
            System.err.println("❌ Critical error: Could not determine application path or create watch directory.");
            e.printStackTrace();
        }
    }
}