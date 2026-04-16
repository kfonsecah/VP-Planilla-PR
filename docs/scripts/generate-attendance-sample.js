const fs = require('fs');
const path = require('path');

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:00`;
}

function addRecord(records, empId, date, hour, minute, type) {
  const ts = new Date(date);
  ts.setHours(hour, minute, 0, 0);
  records.push({
    employee_id: empId,
    timestamp: isoDate(ts),
    log_type: type
  });
}

const records = [];

// Días laborables de abril 2026 (lunes–sábado, excluyendo domingos)
// 1(mié), 2(jue), 3(vie), 6(lun), 7(mar), 8(mié), 9(jue), 10(vie), 13(lun), 14(mar), 15(mié)
const laborDays = [1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15];

/* Empleado 101: patrón regular, con 3 anomalías */
laborDays.forEach(day => {
  const date = new Date(2026, 3, day); // mes 3 = abril
  // Entrada mañana
  addRecord(records, 101, date, 8, 0, 'ENTRADA');
  addRecord(records, 101, date, 12, 0, 'SALIDA');
  addRecord(records, 101, date, 13, 0, 'ENTRADA');
  // Salida tarde: omitida el día 3 para generar huérfano
  if (day !== 3) {
    addRecord(records, 101, date, 17, 0, 'SALIDA');
  }
  // Anomalía día 8: doble ENTRADA (8:00 y 8:05)
  if (day === 8) {
    addRecord(records, 101, date, 8, 5, 'ENTRADA');
  }
});

/* Empleado 102: ligera tardanza, doble ENTRADA día 10 */
laborDays.forEach(day => {
  const date = new Date(2026, 3, day);
  addRecord(records, 102, date, 8, 10, 'ENTRADA'); // 8:10
  addRecord(records, 102, date, 12, 0, 'SALIDA');
  addRecord(records, 102, date, 13, 0, 'ENTRADA');
  addRecord(records, 102, date, 17, 5, 'SALIDA'); // 17:05
  if (day === 10) {
    addRecord(records, 102, date, 8, 2, 'ENTRADA'); // entrada extra
  }
});

/* Empleado 103: solo días dispersos, patrón normal */
[2, 4, 8, 13, 15].forEach(day => {
  const date = new Date(2026, 3, day);
  addRecord(records, 103, date, 8, 0, 'ENTRADA');
  addRecord(records, 103, date, 12, 0, 'SALIDA');
  addRecord(records, 103, date, 13, 0, 'ENTRADA');
  addRecord(records, 103, date, 17, 0, 'SALIDA');
});

// Escribir CSV
const headers = ['employee_id','timestamp','log_type'];
const csvRows = [headers.join(',')];
records.forEach(r => {
  // Escapar timestamp entre comillas por si contiene espacios
  csvRows.push([r.employee_id, `"${r.timestamp}"`, r.log_type].join(','));
});

const outDir = path.join(__dirname, 'src', 'frontend', 'public', 'samples');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outFile = path.join(outDir, 'attendance-sample-3emp-15days.csv');
fs.writeFileSync(outFile, csvRows.join('\n'), 'utf8');

console.log(`✅ Muestra generada: ${outFile}`);
console.log(`📊 Registros totales: ${records.length}`);
