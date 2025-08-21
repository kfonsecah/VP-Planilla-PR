package com.verde.pradera;

import com.verde.pradera.utils.QueryManager;
import com.verde.pradera.utils.dbConnector;

public class Main {
    public static void main(String[] args) {
        dbConnector connector = new dbConnector();
        connector.connect();

        String name = "Alejandro León Marín";

        QueryManager queryManager = new QueryManager();
        queryManager.get("employee.findByName");
        queryManager.getResult("employee.findByName", name);

    }
}