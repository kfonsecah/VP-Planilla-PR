export function detectColumns(headerRow: unknown[]) {
  const headers = headerRow.map(h => String(h || '').toLowerCase().trim());
  
  const idIdx = headers.findIndex(h => /empleado|employee|id|código|cod/i.test(h));
  const dateIdx = headers.findIndex(h => /^fecha$|^date$|^día$|^day$/i.test(h));
  const timeIdx = headers.findIndex(h => /^hora$|^time$/i.test(h));
  const timestampIdx = headers.findIndex(h => /timestamp|fecha_hora|date_time/i.test(h));
  const machineIdx = headers.findIndex(h => /máquina|reloj|equipo|device|terminal/i.test(h));
  const typeIdx = headers.findIndex(h => /tipo|marca|log_type|acción|event/i.test(h));

  return { 
    idIdx: idIdx !== -1 ? idIdx : 0, 
    dateIdx: dateIdx !== -1 ? dateIdx : (timestampIdx !== -1 ? timestampIdx : 1), 
    timeIdx: timeIdx !== -1 ? timeIdx : (timestampIdx !== -1 ? timestampIdx : 2), 
    machineIdx: machineIdx !== -1 ? machineIdx : -1,
    typeIdx: typeIdx !== -1 ? typeIdx : -1
  };
}
