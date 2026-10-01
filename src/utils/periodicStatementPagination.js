/**
 * Smart A4 Pagination & Formatting Engine for Silver Catering Periodic Statements
 * (Monthly Statements, Yearly Statements, and Custom Period Statements)
 */
import { formatINR } from './currency.js';
import { formatFullDate, formatRowNo } from './statementPagination.js';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getAvailableYears(events = []) {
  const yearsSet = new Set();
  const currentYear = new Date().getFullYear();
  yearsSet.add(currentYear);
  yearsSet.add(currentYear - 1);
  yearsSet.add(currentYear + 1);

  events.forEach((evt) => {
    if (evt.date && typeof evt.date === 'string') {
      const yr = parseInt(evt.date.slice(0, 4), 10);
      if (!isNaN(yr)) yearsSet.add(yr);
    }
  });

  return Array.from(yearsSet).sort((a, b) => b - a);
}

export function filterEventsByPeriod(events = [], periodConfig = {}) {
  const { periodType = 'monthly', selectedYear = new Date().getFullYear(), selectedMonth = new Date().getMonth() + 1, startDate = '', endDate = '' } = periodConfig;

  return events.filter((evt) => {
    if (!evt.date) return false;
    const evtDate = evt.date.slice(0, 10);

    if (periodType === 'monthly') {
      const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      return evtDate.startsWith(monthPrefix);
    }

    if (periodType === 'yearly') {
      return evtDate.startsWith(`${selectedYear}-`);
    }

    if (periodType === 'custom') {
      if (startDate && evtDate < startDate) return false;
      if (endDate && evtDate > endDate) return false;
      return true;
    }

    return true; // 'all'
  });
}

export function buildPeriodicStatementData(events = [], periodConfig = {}) {
  const {
    periodType = 'monthly', // 'monthly' | 'yearly' | 'all' | 'custom'
    selectedYear = new Date().getFullYear(),
    selectedMonth = new Date().getMonth() + 1,
    startDate = '',
    endDate = '',
    preparedBy = '',
    notes = '',
  } = periodConfig;

  const filteredEvents = filterEventsByPeriod(events, periodConfig).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  let periodTitle = '';
  let documentNo = '';
  let periodSubtitle = '';

  if (periodType === 'monthly') {
    const monthName = MONTH_NAMES[selectedMonth - 1] || 'Month';
    periodTitle = `MONTHLY FINANCIAL STATEMENT — ${monthName.toUpperCase()} ${selectedYear}`;
    documentNo = `STM-M-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    periodSubtitle = `${monthName} ${selectedYear}`;
  } else if (periodType === 'yearly') {
    periodTitle = `ANNUAL FINANCIAL STATEMENT — YEAR ${selectedYear}`;
    documentNo = `STM-Y-${selectedYear}`;
    periodSubtitle = `Calendar Year ${selectedYear}`;
  } else if (periodType === 'custom') {
    periodTitle = `PERIODIC FINANCIAL STATEMENT (${startDate || 'Start'} to ${endDate || 'End'})`;
    documentNo = `STM-C-${(startDate || '').replace(/-/g, '')}-${(endDate || '').replace(/-/g, '')}`;
    periodSubtitle = `${formatFullDate(startDate)} – ${formatFullDate(endDate)}`;
  } else {
    periodTitle = 'ALL-TIME COMPREHENSIVE FINANCIAL STATEMENT';
    documentNo = `STM-ALL-${selectedYear}`;
    periodSubtitle = 'All Recorded Catering Events';
  }

  let totalIncome = 0;
  let totalExpense = 0;

  const eventRows = filteredEvents.map((evt, idx) => {
    const evtIncome = (evt.incomeEntries || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const evtExpense = (evt.expenseEntries || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const net = evtIncome - evtExpense;

    totalIncome += evtIncome;
    totalExpense += evtExpense;

    return {
      rowNo: formatRowNo(idx + 1),
      id: evt.id,
      name: evt.name,
      clientName: evt.clientName || '—',
      date: evt.date,
      venue: evt.venue || '—',
      income: evtIncome,
      expense: evtExpense,
      netBalance: net,
      rowHeightMm: 7.2,
    };
  });

  const netBalance = totalIncome - totalExpense;

  // Aggregate by Income Category
  const incomeCategoryMap = {};
  filteredEvents.forEach((evt) => {
    (evt.incomeEntries || []).forEach((item) => {
      const cat = item.category || 'Other / General';
      if (!incomeCategoryMap[cat]) incomeCategoryMap[cat] = { count: 0, amount: 0 };
      incomeCategoryMap[cat].count += 1;
      incomeCategoryMap[cat].amount += Number(item.amount) || 0;
    });
  });

  const incomeCategories = Object.entries(incomeCategoryMap)
    .map(([category, data]) => ({
      category,
      count: data.count,
      amount: data.amount,
      percentage: totalIncome > 0 ? ((data.amount / totalIncome) * 100).toFixed(1) : '0.0',
      rowHeightMm: 6.8,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Aggregate by Expense Category
  const expenseCategoryMap = {};
  filteredEvents.forEach((evt) => {
    (evt.expenseEntries || []).forEach((item) => {
      const cat = item.category || 'Other / General';
      if (!expenseCategoryMap[cat]) expenseCategoryMap[cat] = { count: 0, amount: 0 };
      expenseCategoryMap[cat].count += 1;
      expenseCategoryMap[cat].amount += Number(item.amount) || 0;
    });
  });

  const expenseCategories = Object.entries(expenseCategoryMap)
    .map(([category, data]) => ({
      category,
      count: data.count,
      amount: data.amount,
      percentage: totalExpense > 0 ? ((data.amount / totalExpense) * 100).toFixed(1) : '0.0',
      rowHeightMm: 6.8,
    }))
    .sort((a, b) => b.amount - a.amount);

  // If Yearly or All, compute 12-month summary breakdown
  let monthlyBreakdown = [];
  if (periodType === 'yearly' || periodType === 'all') {
    monthlyBreakdown = MONTH_NAMES.map((mName, mIdx) => {
      const mNum = mIdx + 1;
      const mPrefix = periodType === 'yearly' ? `${selectedYear}-${String(mNum).padStart(2, '0')}` : `-${String(mNum).padStart(2, '0')}-`;

      let mEventsCount = 0;
      let mIncome = 0;
      let mExpense = 0;

      filteredEvents.forEach((evt) => {
        if (evt.date && evt.date.includes(mPrefix)) {
          mEventsCount += 1;
          (evt.incomeEntries || []).forEach((i) => { mIncome += Number(i.amount) || 0; });
          (evt.expenseEntries || []).forEach((e) => { mExpense += Number(e.amount) || 0; });
        }
      });

      return {
        monthNo: mNum,
        monthName: mName,
        eventsCount: mEventsCount,
        income: mIncome,
        expense: mExpense,
        netBalance: mIncome - mExpense,
        rowHeightMm: 6.6,
      };
    });
  }

  return {
    periodType,
    selectedYear,
    selectedMonth,
    periodTitle,
    documentNo,
    periodSubtitle,
    generatedDate: formatFullDate(new Date()),
    eventsCount: filteredEvents.length,
    eventRows,
    totalIncome,
    totalExpense,
    netBalance,
    incomeCategories,
    expenseCategories,
    monthlyBreakdown,
    preparedBy,
    notes,
  };
}

/**
 * Paginates the periodic statement data into smart A4 pages.
 */
export function paginatePeriodicStatement(statementData) {
  const MAX_CONTENT_HEIGHT_MM = 259;
  const PAGE1_HEADER_AND_SUMMARY_MM = 65;
  const CONTINUATION_HEADER_MM = 22;

  const TABLE_TITLE_AND_HEAD_MM = 11;
  const TABLE_TOTAL_BAR_MM = 8.5;
  const SECTION_GAP_MM = 4;

  const FINANCIAL_SUMMARY_MM = 29;
  const NOTES_MM = 18;
  const SIGNATURES_MM = 22;

  const pages = [];
  let currentPage = {
    isContinuation: false,
    showExecutiveSummary: true,
    sections: [],
    usedHeightMm: PAGE1_HEADER_AND_SUMMARY_MM,
    continuesOnNextPage: false,
  };
  pages.push(currentPage);

  const startNewPage = (markPreviousContinues = true) => {
    if (markPreviousContinues) {
      currentPage.continuesOnNextPage = true;
    }
    currentPage = {
      isContinuation: true,
      showExecutiveSummary: false,
      sections: [],
      usedHeightMm: CONTINUATION_HEADER_MM,
      continuesOnNextPage: false,
    };
    pages.push(currentPage);
  };

  const remainingSpace = () => MAX_CONTENT_HEIGHT_MM - currentPage.usedHeightMm;

  // 1. Place Events Table
  const eventRows = statementData.eventRows || [];
  if (eventRows.length === 0) {
    currentPage.sections.push({
      type: 'emptyEvents',
      message: 'No catering events found in this statement period.',
    });
    currentPage.usedHeightMm += 14;
  } else {
    let rowIndex = 0;
    let isContinued = false;

    while (rowIndex < eventRows.length) {
      const firstRowH = eventRows[rowIndex].rowHeightMm;
      if (remainingSpace() < TABLE_TITLE_AND_HEAD_MM + firstRowH + 4) {
        startNewPage(true);
      }

      const chunkRows = [];
      currentPage.usedHeightMm += TABLE_TITLE_AND_HEAD_MM;

      while (rowIndex < eventRows.length) {
        const row = eventRows[rowIndex];
        if (remainingSpace() >= row.rowHeightMm + 2 || chunkRows.length === 0) {
          chunkRows.push(row);
          currentPage.usedHeightMm += row.rowHeightMm;
          rowIndex++;
        } else {
          break;
        }
      }

      const finishedAllRows = rowIndex >= eventRows.length;
      let showTotalOnThisPage = false;

      if (finishedAllRows && remainingSpace() >= TABLE_TOTAL_BAR_MM) {
        showTotalOnThisPage = true;
        currentPage.usedHeightMm += TABLE_TOTAL_BAR_MM + SECTION_GAP_MM;
      }

      currentPage.sections.push({
        type: 'eventsTable',
        isContinued,
        rows: chunkRows,
        showTotal: showTotalOnThisPage,
      });

      if (!finishedAllRows) {
        isContinued = true;
        startNewPage(true);
      } else if (!showTotalOnThisPage) {
        startNewPage(true);
        currentPage.sections.push({
          type: 'eventsTable',
          isContinued: true,
          rows: [],
          showTotal: true,
        });
        currentPage.usedHeightMm += TABLE_TITLE_AND_HEAD_MM + TABLE_TOTAL_BAR_MM + SECTION_GAP_MM;
      }
    }
  }

  // 2. If Yearly, place Monthly Breakdown Table
  if (statementData.monthlyBreakdown && statementData.monthlyBreakdown.length > 0) {
    const monthlyRows = statementData.monthlyBreakdown;
    const requiredH = TABLE_TITLE_AND_HEAD_MM + monthlyRows.length * 6.6 + TABLE_TOTAL_BAR_MM + SECTION_GAP_MM;

    if (remainingSpace() < 45) {
      startNewPage(true);
    }

    currentPage.sections.push({
      type: 'monthlyBreakdownTable',
      rows: monthlyRows,
    });
    currentPage.usedHeightMm += Math.min(requiredH, remainingSpace());
  }

  // 3. Place Category Breakdown Section (Income & Expense categories side-by-side or stacked)
  if (statementData.incomeCategories?.length > 0 || statementData.expenseCategories?.length > 0) {
    if (remainingSpace() < 35) {
      startNewPage(true);
    }

    currentPage.sections.push({
      type: 'categoriesBreakdown',
      incomeCategories: statementData.incomeCategories || [],
      expenseCategories: statementData.expenseCategories || [],
    });
    currentPage.usedHeightMm += 34;
  }

  // 4. Closing blocks: Financial Summary, Notes, Signatures
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