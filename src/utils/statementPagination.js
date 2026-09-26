/**
 * Smart A4 Pagination & Formatting Engine for Silver Catering Financial Statements
 * Shared by both the HTML A4 Print/Preview Template and the Vector PDF Generator (jsPDF)
 * so that PRINT STATEMENT and SAVE AS PDF produce 100% identical A4 layouts.
 */

export function formatFullDate(dateInput) {
  if (!dateInput) return '—';
  try {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      const [year, month, day] = dateInput.trim().split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

export function getDocumentNo(eventId) {
  if (!eventId) return 'FIN-2026-0001';
  if (eventId.startsWith('EVT-')) {
    return eventId.replace(/^EVT-/, 'FIN-');
  }
  if (eventId.startsWith('FIN-')) {
    return eventId;
  }
  return `FIN-${eventId}`;
}

export function formatRowNo(num) {
  return String(num).padStart(2, '0');
}

function estimateRowHeightMm(entry) {
  const itemLen = (entry?.item || '').length;
  const descLen = (entry?.description || '').length;

  const itemLines = Math.max(1, Math.ceil(itemLen / 28));
  const descLines = Math.max(1, Math.ceil(descLen / 42));
  const maxLines = Math.max(itemLines, descLines);

  return 6.8 + (maxLines - 1) * 3.4;
}

function estimateNotesHeightMm(notesText) {
  if (!notesText || !notesText.trim()) {
    return 16;
  }
  const lines = notesText.trim().split('\n');
  let totalWrappedLines = 0;
  lines.forEach((line) => {
    totalWrappedLines += Math.max(1, Math.ceil(line.length / 85));
  });
  return Math.max(16, 9 + totalWrappedLines * 4);
}

export function paginateEventStatement(event) {
  const MAX_CONTENT_HEIGHT_MM = 259;
  const PAGE1_HEADER_AND_DETAILS_MM = 55;
  const CONTINUATION_HEADER_MM = 20;

  const TABLE_TITLE_AND_HEAD_MM = 11;
  const TABLE_TOTAL_BAR_MM = 8.5;
  const SECTION_GAP_MM = 3.5;

  const FINANCIAL_SUMMARY_MM = 29;
  const NOTES_MM = estimateNotesHeightMm(event?.notes);
  const SIGNATURES_MM = 22;

  const incomeEntries = (event?.incomeEntries || []).map((entry, idx) => ({
    ...entry,
    rowNo: formatRowNo(idx + 1),
    rowHeightMm: estimateRowHeightMm(entry),
  }));

  const expenseEntries = (event?.expenseEntries || []).map((entry, idx) => ({
    ...entry,
    rowNo: formatRowNo(idx + 1),
    rowHeightMm: estimateRowHeightMm(entry),
  }));

  const pages = [];
  let currentPage = {
    isContinuation: false,
    showEventDetails: true,
    sections: [],
    usedHeightMm: PAGE1_HEADER_AND_DETAILS_MM,
    continuesOnNextPage: false,
  };
  pages.push(currentPage);

  const startNewPage = (markPreviousContinues = true) => {
    if (markPreviousContinues) {
      currentPage.continuesOnNextPage = true;
    }
    currentPage = {
      isContinuation: true,
      showEventDetails: false,
      sections: [],
      usedHeightMm: CONTINUATION_HEADER_MM,
      continuesOnNextPage: false,
    };
    pages.push(currentPage);
  };

  const remainingSpace = () => MAX_CONTENT_HEIGHT_MM - currentPage.usedHeightMm;

  const placeTable = (tableType, rows) => {
    const effectiveRows =
      rows.length > 0
        ? rows
        : [
            {
              id: `empty-${tableType}`,
              rowNo: '—',
              item: tableType === 'incomeTable' ? 'No income entries recorded' : 'No expense entries recorded',
              description: '—',
              quantity: '',
              unit: '',
              rate: '',
              amount: 0,
              isEmptyPlaceholder: true,
              rowHeightMm: 6.8,
            },
          ];

    let rowIndex = 0;
    let isContinued = false;

    while (rowIndex < effectiveRows.length) {
      const firstRowHeight = effectiveRows[rowIndex].rowHeightMm;
      const minRequiredToStartTable = TABLE_TITLE_AND_HEAD_MM + firstRowHeight + 4;

      if (remainingSpace() < minRequiredToStartTable) {
        startNewPage(true);
      }

      const chunkRows = [];
      currentPage.usedHeightMm += TABLE_TITLE_AND_HEAD_MM;

      while (rowIndex < effectiveRows.length) {
        const row = effectiveRows[rowIndex];
        const isLastRow = rowIndex === effectiveRows.length - 1;
        const extraReserve = isLastRow ? 0 : 4.5;

        if (remainingSpace() >= row.rowHeightMm + extraReserve || chunkRows.length === 0) {
          chunkRows.push(row);
          currentPage.usedHeightMm += row.rowHeightMm;
          rowIndex++;
        } else {
          break;
        }
      }

      const finishedAllRows = rowIndex >= effectiveRows.length;
      let showTotalOnThisPage = false;

      if (finishedAllRows) {
        if (remainingSpace() >= TABLE_TOTAL_BAR_MM) {
          showTotalOnThisPage = true;
          currentPage.usedHeightMm += TABLE_TOTAL_BAR_MM + SECTION_GAP_MM;
        }
      }

      const sectionBlock = {
        type: tableType,
        isContinued,
        rows: chunkRows,
        showTotal: showTotalOnThisPage,
        continuesNextPage: !finishedAllRows || !showTotalOnThisPage,
      };
      currentPage.sections.push(sectionBlock);

      if (!finishedAllRows) {
        isContinued = true;
        startNewPage(true);
      } else if (!showTotalOnThisPage) {
        startNewPage(true);
        currentPage.sections.push({
          type: tableType,
          isContinued: true,
          rows: [],
          showTotal: true,
          continuesNextPage: false,
        });
        currentPage.usedHeightMm += TABLE_TITLE_AND_HEAD_MM + TABLE_TOTAL_BAR_MM + SECTION_GAP_MM;
      }
    }
  };

  placeTable('incomeTable', incomeEntries);
  placeTable('expenseTable', expenseEntries);

  const totalClosingHeight = FINANCIAL_SUMMARY_MM + NOTES_MM + SIGNATURES_MM;

  if (remainingSpace() < totalClosingHeight) {
    startNewPage(true);
  }

  currentPage.sections.push({ type: 'financialSummary' });
  currentPage.usedHeightMm += FINANCIAL_SUMMARY_MM;

  currentPage.sections.push({ type: 'notes' });
  currentPage.usedHeightMm += NOTES_MM;

  currentPage.sections.push({ type: 'signatures' });
  currentPage.usedHeightMm += SIGNATURES_MM;

  const totalPages = pages.length;
  return pages.map((p, idx) => ({
    ...p,
    pageNumber: idx + 1,
    totalPages,
  }));
}