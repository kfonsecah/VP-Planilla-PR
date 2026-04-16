import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureOutputDir() {
  const outDir = path.join(__dirname, '..', 'src', 'frontend', 'public', 'samples');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  return outDir;
}

// Crear libro
const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Marcas Asistencia');

// Encabezados (Formato Clásico: ID Empleado, Fecha, Hora, Tipo)
ws.columns = [
  { header: 'ID Empleado', key: 'id', width: 15 },
  { header: 'Fecha', key: 'fecha', width: 15 },
  { header: 'Hora', key: 'hora', width: 15 },
  { header: 'Tipo Marca', key: 'tipo', width: 15 },
];

// Estilos de encabezado
ws.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4A5D3A' }
};
ws.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

function addRecord(ws, empId, dateStr, timeStr, type) {
  ws.addRow({
    id: empId,
    fecha: dateStr,
    hora: timeStr,
    tipo: type
  });
}

// Generar 14 días consecutivos empezando el 20 de Julio 2025
for (let i = 0; i < 14; i++) {
  const date = new Date(2025, 6, 20 + i);
  const dayOfWeek = date.getDay();
  
  // Formato DD/MM/YYYY
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const dateStr = `${day}/${month}/${year}`;

  if (dayOfWeek === 0) continue; // Omitir domingos para marcas normales

  // Empleado 101: Normal
  addRecord(ws, 101, dateStr, '08:00', 'ENTRADA');
  addRecord(ws, 101, dateStr, '12:00', 'SALIDA');
  addRecord(ws, 101, dateStr, '13:00', 'ENTRADA');
  addRecord(ws, 101, dateStr, '17:00', 'SALIDA');

  // Empleado 102: Con huérfanas (falta una salida cada 3 días)
  addRecord(ws, 102, dateStr, '08:05', 'ENTRADA');
  if (i % 3 !== 0) {
    addRecord(ws, 102, dateStr, '17:10', 'SALIDA');
  }
}

// Guardar archivo
const outDir = ensureOutputDir();
const outFile = path.join(outDir, 'attendance-uat-2025.xlsx');
await wb.xlsx.writeFile(outFile);

console.log(`✅ Excel UAT (Formato Clásico) generado: ${outFile}`);
