package com.verde.pradera.utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import io.github.cdimascio.dotenv.Dotenv;

public class dbConnector {

    private String dbUrl;

    public dbConnector(String dbUrl) {
        this.dbUrl = dbUrl;
        Dotenv dotenv = Dotenv.load();
        this.dbUrl = dotenv.get("DB_URL");
    }

    public dbConnector(){
        Dotenv dotenv = Dotenv.load();
        this.dbUrl = dotenv.get("DB_URL");
        if(this.dbUrl == null || this.dbUrl.isEmpty()) {
            System.out.println("DB_URL environment variable is not set or .env not found");
            throw new IllegalArgumentException("DB_URL environment variable is not set");
        }
    }

    public void connect() {
        try (Connection connection = DriverManager.getConnection(dbUrl);
                Statement stmt = connection.createStatement()) {

            if (connection != null) {
                System.out.println("✅ Connected to the database!");

                // Force the use of the schema
                stmt.execute("SET search_path TO verdepradera");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public String getDbUrl() {
        return dbUrl;
    }

    public void setDbUrl(String dbUrl) {
        this.dbUrl = dbUrl;
    }

    public Connection getConnection() throws SQLException {
        Connection connection = DriverManager.getConnection(dbUrl);
        if (connection != null) {
            // Used a Statement to configure the search_path for this connection
            try (Statement stmt = connection.createStatement()) {
                stmt.execute("SET search_path TO verdepradera");
            }
            System.out.println("✅ Connection established and schema set to verdepradera.");
        }
        return connection;
    }
}
