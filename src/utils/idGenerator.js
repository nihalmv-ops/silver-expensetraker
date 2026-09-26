/**
 * Generates sequential event IDs in the format: EVT-YYYY-XXXX
 * e.g., EVT-2026-0001, EVT-2026-0002
 */

export function generateEventId(existingEvents = [], yearOverride = null) {
  const currentYear = yearOverride || new Date().getFullYear();
  const yearPrefix = `EVT-${currentYear}-`;

  let maxSequence = 0;

  if (Array.isArray(existingEvents)) {
    existingEvents.forEach((evt) => {
      if (evt && evt.id && typeof evt.id === 'string' && evt.id.startsWith(yearPrefix)) {
        const seqPart = evt.id.substring(yearPrefix.length);
        const seqNum = parseInt(seqPart, 10);
        if (!isNaN(seqNum) && seqNum > maxSequence) {
          maxSequence = seqNum;
        }
      }
    });
  }

  const nextSeq = String(maxSequence + 1).padStart(4, '0');
  return `${yearPrefix}${nextSeq}`;
}

export function generateUniqueId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

