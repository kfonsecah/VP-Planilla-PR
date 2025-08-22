package com.verde.pradera.models;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class Serializer implements Serializable {

    private static final long serialVersionUID = 1L;

    private String employeeName; // "Adriana Campos"
    private LocalDate date; // 2018-07-02
    private LocalTime time; // 08:36
    private MarkType type; // ENTRADA | SALIDA | FERIADO

    // Derivado (útil para DB):
    public LocalDateTime getTimestamp() {
        return LocalDateTime.of(date, time);
    }

    public Serializer(String employeeName, LocalDate date, LocalTime time, MarkType type) {
        this.employeeName = employeeName;
        this.date = date;
        this.time = time;
        this.type = type;
    }

    // Getters/Setters
    public String getEmployeeName() {
        return employeeName;
    }

    public LocalDate getDate() {
        return date;
    }

    public LocalTime getTime() {
        return time;
    }

    public MarkType getType() {
        return type;
    }

    public void setEmployeeName(String v) {
        this.employeeName = v;
    }

    public void setDate(LocalDate v) {
        this.date = v;
    }

    public void setTime(LocalTime v) {
        this.time = v;
    }

    public void setType(MarkType v) {
        this.type = v;
    }

    @Override
    public String toString() {
        return "%s | %s %s | %s".formatted(employeeName, date, time, type);
    }

}
