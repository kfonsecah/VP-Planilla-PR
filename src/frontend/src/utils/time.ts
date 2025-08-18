/**
 * @file dateUtils.ts
 * @brief Utility file for date operations.
 */

/**
 * Gets the current date formatted according to the user's local timezone.
 *
 * @returns {string} The current date as a string (e.g., "06/11/2025").
 */
export function getCurrentLocalDateString(): string {
  // Create a new Date object. By default, this uses the local timezone of the user's PC.
  const today = new Date();

  // Options for formatting the date.
  // 'numeric' for day, month, and year ensures they are represented as numbers.
  // This will format the date to match the user's locale settings for a short date format
  // (e.g., MM/DD/YYYY or DD/MM/YYYY depending on the user's region).
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  };

  // Use toLocaleDateString() to format the date according to the user's locale settings.
  // If 'locale' (first argument) is not specified (undefined), it defaults to the user's environment setting.
  // The second argument specifies the formatting options.
  return today.toLocaleDateString(undefined, options);
}

/**
 * Gets the current date and time formatted according to the user's local timezone.
 *
 * @returns {string} The current date and time as a string (e.g., "06/11/2025, 23:04:30").
 */
export function getCurrentLocalDateTimeString(): string {
  const now = new Date();

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',   // Ensures hour is two digits (e.g., "01" instead of "1")
    minute: '2-digit', // Ensures minute is two digits (e.g., "05" instead of "5")
    second: '2-digit', // Ensures second is two digits (e.g., "09" instead of "9")
    // The `timeZone` property is omitted or set to `undefined` to explicitly use the system's local timezone.
    // Setting `timeZone: 'current'` is not a valid value for this API; the default behavior already uses the system's timezone.
  };

  // Combine the localized date string and localized time string.
  // A comma and space are added for readability between date and time.
  return now.toLocaleDateString(undefined, options) + ', ' + now.toLocaleTimeString(undefined, options);
}

/**
 * Gets the current date formatted in a specific Spanish style: "DayOfWeek Day-Month-Year".
 * E.g., "Miércoles 11-06-2025"
 *
 * @returns {string} The current date formatted as "DayOfWeek Day-Month-Year".
 */
export function getCurrentSpanishFormattedDateString(): string {
  const today = new Date();

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long', // Full name of the day of the week (e.g., "Miércoles")
    day: '2-digit',    // Day of the month (e.g., "11")
    month: '2-digit',  // Month (e.g., "06")
    year: 'numeric',   // Full year (e.g., "2025")
  };

  // Format the date using the 'es-ES' locale for Spanish day names and formatting.
  // We manually join the parts to get "DayOfWeek Day-Month-Year".
  const parts = new Intl.DateTimeFormat('es-ES', options).formatToParts(today);

  const weekday = parts.find(p => p.type === 'weekday')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const year = parts.find(p => p.type === 'year')?.value || '';

  // Capitalize the first letter of the weekday
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return `${capitalizedWeekday} ${day}-${month}-${year}`;
}