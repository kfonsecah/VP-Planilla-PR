import { prisma } from '../lib/prisma';

export class MarkSuggestionService {
  static async suggestMissingMark(employeeId: number, date: string, existingMarks: any[]) {
    // Basic baseline dummy inference logic; a real version would deeply query history.
    const dayMarks = existingMarks || [];
    const hasIn = dayMarks.some(m => m.type === 'IN');
    const hasOut = dayMarks.some(m => m.type === 'OUT');
    
    if (hasIn && !hasOut) {
      return { suggestedType: 'OUT', suggestedTime: '17:00', confidence: 'MEDIUM', reason: 'Falta marca de salida.' };
    }
    if (!hasIn && hasOut) {
      return { suggestedType: 'IN', suggestedTime: '08:00', confidence: 'MEDIUM', reason: 'Falta marca de entrada.' };
    }
    return null;
  }
}
