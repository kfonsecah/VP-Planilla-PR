import { TimeWindow } from '../../../services/timeWindowService';

export type MarkType = 'IN' | 'OUT';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ClassificationResult {
  type: MarkType;
  confidence: ConfidenceLevel;
  windowName: string;
}

/**
 * Converts an HH:MM or HH:MM:SS string to total minutes since midnight.
 */
function toMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0] ?? '0', 10);
  const minutes = parseInt(parts[1] ?? '0', 10);
  return hours * 60 + minutes;
}

/**
 * Extracts HH:MM from a time string, Date, or ISO timestamp.
 * Returns null if unparseable.
 */
function extractHHMM(time: string): string | null {
  if (!time) return null;

  // ISO timestamp or datetime string — extract time portion
  if (time.includes('T')) {
    const parts = time.split('T');
    const timePart = parts[1];
    if (!timePart) return null;
    return timePart.substring(0, 5);
  }

  // Already HH:MM or HH:MM:SS
  if (/^\d{1,2}:\d{2}/.test(time)) {
    return time.substring(0, 5);
  }

  return null;
}

/**
 * Classifies a clock mark by matching its time against configured time windows.
 *
 * Confidence rules:
 * - HIGH: time falls clearly within a single window (more than 15 min from boundary)
 * - MEDIUM: time is within 15 min of a window boundary (could belong to adjacent window)
 * - LOW: time falls outside all windows or in overlap between two windows
 *
 * When no windows are configured, falls back to a simple heuristic:
 * - 04:00–12:59 → IN (morning entry)
 * - 13:00–23:59 → OUT (afternoon/evening exit)
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function classifyByTimeWindow(time: string, windows: TimeWindow[]): ClassificationResult {
  const BOUNDARY_MARGIN_MINUTES = 15;

  const hhmm = extractHHMM(time);
  if (!hhmm) {
    return { type: 'IN', confidence: 'LOW', windowName: 'Sin ventana' };
  }

  const markMinutes = toMinutes(hhmm);

  // No windows configured — use simple heuristic
  if (!windows || windows.length === 0) {
    const type: MarkType = markMinutes < 13 * 60 ? 'IN' : 'OUT';
    return { type, confidence: 'LOW', windowName: 'Sin ventana' };
  }

  // Find all windows this mark falls into
  const matching = windows.filter((w) => {
    const start = toMinutes(w.time_window_start_hour);
    const end = toMinutes(w.time_window_end_hour);
    // Handle overnight windows (e.g. 22:00–06:00)
    if (start <= end) {
      return markMinutes >= start && markMinutes < end;
    } else {
      return markMinutes >= start || markMinutes < end;
    }
  });

  // No window matched → LOW confidence, guess from hour
  if (matching.length === 0) {
    const type: MarkType = markMinutes < 13 * 60 ? 'IN' : 'OUT';
    return { type, confidence: 'LOW', windowName: 'Fuera de ventana' };
  }

  // Multiple windows matched (overlap) → LOW confidence, use first
  if (matching.length > 1) {
    const w = matching[0]!;
    const type: MarkType = w.time_window_type.toUpperCase() === 'OUT' ? 'OUT' : 'IN';
    return { type, confidence: 'LOW', windowName: w.time_window_name };
  }

  // Exactly one window matched
  const w = matching[0]!;
  const type: MarkType = w.time_window_type.toUpperCase() === 'OUT' ? 'OUT' : 'IN';

  // Determine confidence based on distance from boundaries
  const start = toMinutes(w.time_window_start_hour);
  const end = toMinutes(w.time_window_end_hour);

  let distToStart: number;
  let distToEnd: number;

  if (start <= end) {
    distToStart = markMinutes - start;
    distToEnd = end - markMinutes;
  } else {
    // Overnight: calculate distances considering wrap-around
    const totalMinutes = 24 * 60;
    distToStart = markMinutes >= start ? markMinutes - start : markMinutes + totalMinutes - start;
    distToEnd = markMinutes < end ? end - markMinutes : totalMinutes - markMinutes + end;
  }

  const minDist = Math.min(distToStart, distToEnd);
  const confidence: ConfidenceLevel = minDist >= BOUNDARY_MARGIN_MINUTES ? 'HIGH' : 'MEDIUM';

  return { type, confidence, windowName: w.time_window_name };
}
