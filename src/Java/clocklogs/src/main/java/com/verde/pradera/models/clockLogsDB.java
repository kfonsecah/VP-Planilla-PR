package com.verde.pradera.models;

import java.sql.Timestamp;

public class clockLogsDB {
    private int clock_logs_id;
    private int clock_logs_employee_id;
    private Timestamp clock_logs_timestamp;
    private String clock_logs_log_type;
    private String clock_logs_remarks;
    private int clock_logs_version;

    // Getters and Setters

    public int getClock_logs_id() {
        return clock_logs_id;
    }

    public void setClock_logs_id(int clock_logs_id) {
        this.clock_logs_id = clock_logs_id;
    }

    public int getClock_logs_employee_id() {
        return clock_logs_employee_id;
    }

    public void setClock_logs_employee_id(int clock_logs_employee_id) {
        this.clock_logs_employee_id = clock_logs_employee_id;
    }

    public Timestamp getClock_logs_timestamp() {
        return clock_logs_timestamp;
    }

    public void setClock_logs_timestamp(Timestamp clock_logs_timestamp) {
        this.clock_logs_timestamp = clock_logs_timestamp;
    }

    public String getClock_logs_log_type() {
        return clock_logs_log_type;
    }

    public void setClock_logs_log_type(String clock_logs_log_type) {
        this.clock_logs_log_type = clock_logs_log_type;
    }

    public String getClock_logs_remarks() {
        return clock_logs_remarks;
    }

    public void setClock_logs_remarks(String clock_logs_remarks) {
        this.clock_logs_remarks = clock_logs_remarks;
    }

    public int getClock_logs_version() {
        return clock_logs_version;
    }

    public void setClock_logs_version(int clock_logs_version) {
        this.clock_logs_version = clock_logs_version;
    }
}
