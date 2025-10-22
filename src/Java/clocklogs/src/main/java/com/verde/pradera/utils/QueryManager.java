package com.verde.pradera.utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class QueryManager {

    protected HashMap<String, String> queries;
    private dbConnector connector;

    public QueryManager() {
        this.queries = new HashMap<>();
        this.connector = new dbConnector();
        loadQueries();
    }

    protected void loadQueries() {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(getClass().getResourceAsStream("/queries.sql")))) {

            StringBuilder queryBuilder = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                queryBuilder.append(line).append("\n");
            }

            String[] queriesArray = queryBuilder.toString().split("-- name:");
            for (String query : queriesArray) {
                String[] parts = query.split("\n", 2);
                if (parts.length == 2) {
                    String name = parts[0].trim();
                    String sql = parts[1].trim();
                    queries.put(name, sql);
                }
            }
        } catch (IOException | NullPointerException e) {
            throw new RuntimeException("Could not load /queries.sql. Is it in src/main/resources?", e);
        }
    }

    public String get(String name) {
        String sql = queries.get(name);
        if (sql == null) {
            throw new IllegalArgumentException("Query not found: " + name);
        }
        return sql;
    }

    /**
     * Executes a query and returns the results as a String.
     * @param queryName The name of the query to execute.
     * @param params The parameters for the query.
     * @return A String with the query results.
     */
    public String getResult(String queryName, Object... params) {
        String sql = get(queryName);
        StringBuilder result = new StringBuilder();

        try (Connection conn = connector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            for (int i = 0; i < params.length; i++) {
                pstmt.setObject(i + 1, params[i]);
            }

            ResultSet rs = pstmt.executeQuery();

            if (!rs.isBeforeFirst() && rs.getRow() == 0) {
                result.append("No results found.");
            } else {
                ResultSetMetaData rsmd = rs.getMetaData();
                int columnCount = rsmd.getColumnCount();
                List<String> rowResults = new ArrayList<>();

                while (rs.next()) {
                    List<String> columnPairs = new ArrayList<>();
                    for (int i = 1; i <= columnCount; i++) {
                        String columnName = rsmd.getColumnName(i);
                        String value = rs.getString(i);
                        columnPairs.add(columnName + " = " + (value != null ? value.trim() : "NULL"));
                    }
                    rowResults.add(String.join(", ", columnPairs));
                }
                result.append(String.join("\n", rowResults));
            }

        } catch (SQLException e) {
            System.err.println("Error executing query: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error executing query '" + queryName + "'", e);
        }

        System.out.println("Query result: " + result.toString());
        return result.toString();
    }

    /**
     * Executes an update (INSERT, UPDATE, DELETE) query.
     * @param queryName The name of the query to execute.
     * @param params The parameters for the query.
     * @return The number of rows affected.
     */
    public int executeUpdate(String queryName, Object... params) {
        String sql = get(queryName);
        try (Connection conn = connector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            for (int i = 0; i < params.length; i++) {
                pstmt.setObject(i + 1, params[i]);
            }

            return pstmt.executeUpdate();

        } catch (SQLException e) {
            System.err.println("Error executing update: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error executing update '" + queryName + "'", e);
        }
    }
}
