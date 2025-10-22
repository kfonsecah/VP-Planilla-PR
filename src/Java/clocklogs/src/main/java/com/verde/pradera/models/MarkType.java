package com.verde.pradera.models;

public enum MarkType {
    ENTRADA, SALIDA, FERIADO; // “FE” del reporte lo mapeamos a FERIADO

    public static MarkType fromCodigo(String s) {
        String x = s == null ? "" : s.trim().toUpperCase();
        return switch (x) {
            case "E", "EN", "ENTRADA" -> ENTRADA;
            case "S", "SA", "SALIDA" -> SALIDA;
            case "FE", "FERIADO" -> FERIADO;
            default -> throw new IllegalArgumentException("Tipo de marca desconocido: " + s);
        };
    }
}
