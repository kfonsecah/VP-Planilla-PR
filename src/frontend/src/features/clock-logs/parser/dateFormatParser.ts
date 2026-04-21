export function parseDateTime(dateVal: any, timeVal?: any): Date | null {
  if (!dateVal) return null;

  // Handle Excel Serial Dates
  const excelDateToJs = (serial: number) => {
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
  };

  let date: Date;
  if (typeof dateVal === 'number') {
    date = excelDateToJs(dateVal);
  } else if (dateVal instanceof Date) {
    date = dateVal;
  } else {
    // String parsing
    const s = String(dateVal).trim();
    if (s.includes('T')) {
      date = new Date(s);
    } else {
      // Try common formats
      const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if (dmy) {
        const year = dmy[3].length === 2 ? 2000 + parseInt(dmy[3]) : parseInt(dmy[3]);
        date = new Date(year, parseInt(dmy[2]) - 1, parseInt(dmy[1]));
      } else {
        date = new Date(s);
      }
    }
  }

  if (timeVal != null && isNaN(date.getTime()) === false) {
    if (typeof timeVal === 'number') {
      const totalSeconds = Math.round(timeVal * 86400);
      date.setHours(Math.floor(totalSeconds / 3600), Math.floor((totalSeconds % 3600) / 60), totalSeconds % 60);
    } else if (typeof timeVal === 'string' && timeVal.includes(':')) {
      const p = timeVal.split(':');
      date.setHours(parseInt(p[0]), parseInt(p[1]), p[2] ? parseInt(p[2]) : 0);
    }
  }

  return isNaN(date.getTime()) ? null : date;
}
