function excelDateToJs(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  total_seconds -= seconds;
  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

function parseStringDate(s: string): Date {
  if (s.includes('T')) {
    return new Date(s);
  }
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + parseInt(dmy[3]) : parseInt(dmy[3]);
    return new Date(year, parseInt(dmy[2]) - 1, parseInt(dmy[1]));
  }
  const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) {
    return new Date(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]));
  }
  return new Date(s);
}

function parseDateValue(dateVal: unknown): Date {
  if (typeof dateVal === 'number') {
    return excelDateToJs(dateVal);
  }
  if (dateVal instanceof Date) {
    // ExcelJS parses dates using UTC. For example "2026-04-01" becomes "2026-04-01T00:00:00.000Z".
    // If we use this directly in a UTC-6 timezone, its local date is March 31.
    // We must reconstruct it as a local date using the UTC components.
    return new Date(
      dateVal.getUTCFullYear(),
      dateVal.getUTCMonth(),
      dateVal.getUTCDate(),
      dateVal.getUTCHours(),
      dateVal.getUTCMinutes(),
      dateVal.getUTCSeconds()
    );
  }
  return parseStringDate(String(dateVal).trim());
}

function applyTimeValue(date: Date, timeVal: unknown): void {
  if (typeof timeVal === 'number') {
    const totalSeconds = Math.round(timeVal * 86400);
    date.setHours(Math.floor(totalSeconds / 3600), Math.floor((totalSeconds % 3600) / 60), totalSeconds % 60);
  } else if (typeof timeVal === 'string' && timeVal.includes(':')) {
    const p = timeVal.split(':');
    date.setHours(parseInt(p[0]), parseInt(p[1]), p[2] ? parseInt(p[2]) : 0);
  } else if (timeVal instanceof Date) {
    date.setHours(timeVal.getUTCHours(), timeVal.getUTCMinutes(), timeVal.getUTCSeconds());
  }
}

export function parseDateTime(dateVal: unknown, timeVal?: unknown): Date | null {
  if (!dateVal) return null;

  const date = parseDateValue(dateVal);

  if (timeVal != null && !isNaN(date.getTime())) {
    applyTimeValue(date, timeVal);
  }

  return isNaN(date.getTime()) ? null : date;
}
