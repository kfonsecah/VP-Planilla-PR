import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureOutputDir() {
  const outDir = path.join(__dirname, 'src', 'frontend', 'public', 'samples');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  return outDir;
}

// Crear libro
const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Marcas Asistencia');

// Encabezados
ws.columns = [
  { header: 'employee_id', key: 'employee_id', width: 12 },
  { header: 'timestamp', key: 'timestamp', width: 20 },
  { header: 'log_type', key: 'log_type', width: 12 },
];

// Estilos de encabezado
ws.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4A5D3A' } // Verde institucional
};
ws.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

// Función helper para fecha ISO
function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:00`;
}

function addRecord(rows, empId, date, hour, minute, type) {
  const ts = new Date(date);
  ts.setHours(hour, minute, 0, 0);
  rows.push({
    employee_id: empId,
    timestamp: isoDate(ts),
    log_type: type
  });
}

const rows = [];

// Días laborables abril 2026 (lun–sáb)
const laborDays = [1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15];

/* Empleado 101: patrón regular, con 3 anomalías */
laborDays.forEach(day => {
  const date = new Date(2026, 3, day);
  addRecord(rows, 101, date, 8, 0, 'ENTRADA');
  addRecord(rows, 101, date, 12, 0, 'SALIDA');
  addRecord(rows, 101, date, 13, 0, 'ENTRADA');
  if (day !== 3) {
    addRecord(rows, 101, date, 17, 0, 'SALIDA'); // día 3 falta → huérfano
  }
  if (day === 8) {
    addRecord(rows, 101, date, 8, 5, 'ENTRADA'); // doble entrada
  }
});

/* Empleado 102: ligera tardanza, doble ENTRADA día 10 */
laborDays.forEach(day => {
  const date = new Date(2026, 3, day);
  addRecord(rows, 102, date, 8, 10, 'ENTRADA'); // 8:10
  addRecord(rows, 102, date, 12, 0, 'SALIDA');
  addRecord(rows, 102, date, 13, 0, 'ENTRADA');
  addRecord(rows, 102, date, 17, 5, 'SALIDA'); // 17:05
  if (day === 10) {
    addRecord(rows, 102, date, 8, 2, 'ENTRADA'); // entrada extra
  }
});

/* Empleado 103: días dispersos, patrón normal */
[2, 4, 8, 13, 15].forEach(day => {
  const date = new Date(2026, 3, day);
  addRecord(rows, 103, date, 8, 0, 'ENTRADA');
  addRecord(rows, 103, date, 12, 0, 'SALIDA');
  addRecord(rows, 103, date, 13, 0, 'ENTRADA');
  addRecord(rows, 103, date, 17, 0, 'SALIDA');
});

// Agregar filas a la hoja
rows.forEach(r => {
  ws.addRow(r);
});

// Formato de columna timestamp como texto para preservar formato
ws.getColumn('timestamp').numFmt = '@';

// Ajustar anchos automáticamente
ws.columns.forEach(col => {
  if (col.key === 'timestamp') col.width = 20;
  if (col.key === 'employee_id') col.width = 12;
  if (col.key === 'log_type') col.width = 12;
});

// Guardar archivo
const outDir = ensureOutputDir();
const outFile = path.join(outDir, 'attendance-sample-3emp-15days.xlsx');
await wb.xlsx.writeFile(outFile);

console.log(`✅ Excel generado: ${outFile}`);
console.log(`📊 Registros: ${rows.length}`);
console.log(`🗂️  Hojas: ${wb.worksheets.length}`);
console.log(`📌 Columnas: ${ws.columns.map(c => c.key).join(', ')}`);
