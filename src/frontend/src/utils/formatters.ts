// Utilities to format common form values as the user types

export const formatNationalId = (value: string): string => {
  // Target format: X-XXXX-XXXX (9 digits)
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits.slice(0,1)}-${digits.slice(1)}`;
  return `${digits.slice(0,1)}-${digits.slice(1,5)}-${digits.slice(5)}`;
};

export const formatSocialCode = (value: string): string => {
  // Only digits, max 12
  return value.replace(/\D/g, '').slice(0, 12);
};

export const formatPhone = (value: string): string => {
  // Target format: 1234-1234 (8 digits)
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0,4)}-${digits.slice(4)}`;
};

export const normalizeDateInput = (value: string): string => {
  // Normalize common user inputs into YYYY-MM-DD expected by <input type="date">
  // If value already in YYYY-MM-DD, return as is (slice to 10)
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  // Try MM/DD/YYYY or DD/MM/YYYY (detect by first number >12 => day first)
  const parts = value.split(/[\/\-\.\s]/).filter(Boolean);
  if (parts.length === 3) {
    const [p1, p2, p3] = parts;
    // if p3 has length 4 assume it's year
    if (p3.length === 4) {
      let month = p1.padStart(2, '0');
      let day = p2.padStart(2, '0');
      // if first part >12, swap (user probably typed DD/MM/YYYY)
      if (parseInt(p1, 10) > 12) {
        month = p2.padStart(2, '0');
        day = p1.padStart(2, '0');
      }
      return `${p3}-${month}-${day}`;
    }
  }

  // Fallback: return empty or raw truncated to 10
  return value.slice(0, 10);
};

/**
 * Formatea una fecha para visualización ejecutiva en formato "DD mes YYYY"
 * Ejemplo: "04 mayo 2026"
 * @param dateString - Fecha en formato string (ISO/YYYY-MM-DD) o Date object
 * @param includeYear - Si debe incluir el año (default true)
 * @returns String formateado "04 mayo 2026"
 */
export const formatDateDisplay = (dateString: string | Date | null | undefined, includeYear = true): string => {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  
  // Usamos UTC para evitar problemas de desfase por zona horaria
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = date.toLocaleString('es-CR', { month: 'long', timeZone: 'UTC' }).toLowerCase();
  const year = date.getUTCFullYear();
  
  return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
};
