import { jsPDF } from 'jspdf';
import { formatINR } from './currency.js';
import {
  paginateEventStatement,
  formatFullDate,
  getDocumentNo,
} from './statementPagination.js';
import { paginatePeriodicStatement } from './periodicStatementPagination.js';

/**
 * Converts an image URL into a clean base64 DataURL for embedding in jsPDF
 */
async function getBase64ImageFromUrl(imageUrl) {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const maxDim = 360;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 0.95));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  } catch {
    return null;
  }
}

/**
 * Loads the Outfit TTF font for native Rupee (₹) symbol rendering
 */
async function loadOutfitFont() {
  try {
    const baseUrl = import.meta.env.BASE_URL || './';
    const res = await fetch(`${baseUrl}fonts/Outfit.ttf`);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } catch {
    return null;
  }
}

/**
 * Builds the jsPDF document using the exact same Smart A4 Pagination engine
 * (`paginateEventStatement`) and visual design as `OfficialStatementDocument.jsx`.
 */
async function buildStatementPdfDoc(event, options = {}) {
  if (!event) throw new Error('Event data is required to generate PDF');

  const { layoutMode = 'singlePage' } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = layoutMode === 'singlePage' ? 10 : 12; // 10mm for singlePage to ensure perfect breathing room
  const contentWidth = pageWidth - margin * 2;
  const rightEdge = pageWidth - margin;

  // Load Outfit font for ₹ symbol
  const base64Font = await loadOutfitFont();
  let fontFamily = 'helvetica';
  if (base64Font) {
    doc.addFileToVFS('Outfit.ttf', base64Font);
    doc.addFont('Outfit.ttf', 'Outfit', 'normal');
    doc.addFont('Outfit.ttf', 'Outfit', 'bold');
    doc.setFont('Outfit', 'normal');
    fontFamily = 'Outfit';
  }

  const baseUrl = import.meta.env.BASE_URL || './';
  const logoData = await getBase64ImageFromUrl(`${baseUrl}silver_logo.png`);

  const totalIncome = (event.incomeEntries || []).reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const totalExpense = (event.expenseEntries || []).reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const netBalance = totalIncome - totalExpense;

  const formattedNetBalance =
    netBalance < 0
      ? `-${formatINR(Math.abs(netBalance))}`
      : formatINR(netBalance);

  let balanceStatusText = 'BREAK EVEN';
  if (netBalance > 0) {
    balanceStatusText = 'POSITIVE BALANCE';
  } else if (netBalance < 0) {
    balanceStatusText = 'NEGATIVE BALANCE';
  }

  const documentNo = getDocumentNo(event.id);
  const generatedDate = formatFullDate(new Date());
  const eventDateFormatted = formatFullDate(event.date);

  const pages = paginateEventStatement(event, { layoutMode });

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage('a4', 'portrait');
    }

    let y = margin;

    // ==================================================
    // 1. HEADER (Page 1 Full Header vs Page 2+ Continuation Header)
    // ==================================================
    if (!page.isContinuation) {
      // Logo Box (14mm x 14mm)
      doc.setDrawColor(209, 213, 219);
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin, y, 14, 14, 1.5, 1.5, 'FD');

      if (logoData) {
        try {
          doc.addImage(logoData, 'PNG', margin + 1, y + 1, 12, 12);
        } catch {
          // fallback if image fails
        }
      }

      const brandX = margin + 17;
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('SILVER CATERING', brandX, y + 6.5);

      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      doc.text('PREMIUM CATERING SERVICES IN KERALA', brandX, y + 11.2);

      // Right contact details
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text('www.silvercatering.in', rightEdge, y + 4.2, { align: 'right' });

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(75, 85, 99);
      doc.text('Valanchery, Kerala  •  +91 98464 15767', rightEdge, y + 8.2, { align: 'right' });
      doc.text('Silvereventsandcaters@gmail.com', rightEdge, y + 12, { align: 'right' });

      y += 16.5;

      // Thin divider line
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.25);
      doc.line(margin, y, rightEdge, y);

      y += 5.5;

      // Document Title + Document No + Generated Date
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text('EVENT FINANCIAL STATEMENT', margin, y);

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(55, 65, 81);
      doc.text(
        `Document No: ${documentNo}      Generated Date: ${generatedDate}`,
        rightEdge,
        y,
        { align: 'right' }
      );

      y += 3.5;
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(0.4);
      doc.line(margin, y, rightEdge, y);
      y += 5;
    } else {
      // SMALLER PAGE 2+ CONTINUATION HEADER
      if (logoData) {
        try {
          doc.addImage(logoData, 'PNG', margin, y, 6.5, 6.5);
        } catch {
          // ignore
        }
      }

      const contX = logoData ? margin + 8.5 : margin;
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(17, 24, 39);
      doc.text('SILVER CATERING   |   EVENT FINANCIAL STATEMENT', contX, y + 4.5);

      // CONTINUED badge on right
      doc.setDrawColor(156, 163, 175);
      doc.setLineWidth(0.25);
      doc.rect(rightEdge - 22, y + 0.8, 22, 5, 'S');
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(7);
      doc.setTextColor(55, 65, 81);
      doc.text('CONTINUED', rightEdge - 11, y + 4.2, { align: 'center' });

      y += 8;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.line(margin, y, rightEdge, y);

      y += 4.2;
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      const clientPart = event.clientName ? `   •   Client: ${event.clientName}` : '';
      doc.text(`Event: ${event.name || '—'}${clientPart}`, margin, y);
      doc.text(`Event ID: ${event.id || '—'}`, rightEdge, y, { align: 'right' });

      y += 2.8;
      doc.setDrawColor(156, 163, 175);
      doc.setLineWidth(0.3);
      doc.line(margin, y, rightEdge, y);
      y += 4.5;
    }

    // ==================================================
    // 2. EVENT DETAILS (Page 1 Only, Clean 2-Column Section)
    // ==================================================
    if (page.showEventDetails) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(17, 24, 39);
      doc.text('EVENT DETAILS', margin, y);
      y += 2;

      const boxH = 19.5;
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.25);
      doc.rect(margin, y, contentWidth, boxH, 'FD');

      const colW = (contentWidth - 10) / 2;
      const leftColX = margin + 3.5;
      const rightColX = margin + 3.5 + colW + 3;

      const drawDetailRow = (colX, rowY, label, val, hasBottomBorder = true) => {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(label, colX, rowY);

        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(17, 24, 39);
        doc.text(String(val || '—'), colX + colW - 2, rowY, { align: 'right' });

        if (hasBottomBorder) {
          doc.setDrawColor(229, 231, 235);
          doc.setLineWidth(0.15);
          doc.line(colX, rowY + 1.6, colX + colW - 2, rowY + 1.6);
        }
      };

      const r1Y = y + 5;
      const r2Y = y + 11;
      const r3Y = y + 16.8;

      drawDetailRow(leftColX, r1Y, 'Event Name:', event.name || '—', true);
      drawDetailRow(leftColX, r2Y, 'Client:', event.clientName || '—', true);
      drawDetailRow(leftColX, r3Y, 'Event Date:', eventDateFormatted, false);

      drawDetailRow(rightColX, r1Y, 'Venue:', event.venue || '—', true);
      drawDetailRow(rightColX, r2Y, 'Event ID:', event.id || '—', true);
      const coordVal =
        event.coordinator && event.coordinator.trim()
          ? event.coordinator.trim()
          : '____________________';
      drawDetailRow(rightColX, r3Y, 'Coordinator:', coordVal, false);

      y += boxH + 5;
    }

    // ==================================================
    // 3. SECTIONS (SIDE-BY-SIDE TABLES, INCOME TABLE, EXPENSE TABLE, SUMMARY, NOTES, SIGNATURES)
    // ==================================================
    page.sections.forEach((section) => {
      // 1-PAGE A4 MASTER MODEL: SIDE-BY-SIDE DUAL TABLES
      if (section.type === 'sideBySideTables') {
        const incomeList = section.incomeEntries || [];
        const expenseList = section.expenseEntries || [];

        const colGap = 4;
        const tableW = (contentWidth - colGap) / 2; // 93mm in singlePage
        const leftX = margin;
        const rightX = margin + tableW + colGap;

        const maxCount = Math.max(incomeList.length, expenseList.length);
        const rowH = maxCount > 15 ? 4.6 : maxCount > 8 ? 5.2 : 5.8;

        let leftY = y;
        let rightY = y;
        const bannerH = 5.2;
        const theadH = 4.8;
        const totBarH = 5.8;

        // ----------------------------------------------------
        // LEFT: INCOME TABLE (Emerald Brand Theme)
        // ----------------------------------------------------
        // Header Banner
        doc.setFillColor(31, 61, 43); // #1F3D2B
        doc.rect(leftX, leftY, tableW, bannerH, 'F');
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`INCOME DETAILS (${incomeList.length})`, leftX + 2.5, leftY + 3.7);
        doc.setFontSize(6.8);
        doc.setTextColor(163, 217, 181);
        doc.text('Amount in INR (₹)', leftX + tableW - 2.5, leftY + 3.7, { align: 'right' });
        leftY += bannerH;

        // Column widths for Income: No (8) | Item & Desc (tableW - 44) | Qty (14) | Amount (22)
        const incCols = [8, tableW - 44, 14, 22];
        const incColX = [leftX];
        for (let i = 0; i < incCols.length; i++) {
          incColX.push(incColX[i] + incCols[i]);
        }

        // Table Header
        doc.setFillColor(243, 244, 246);
        doc.setDrawColor(209, 213, 219);
        doc.setLineWidth(0.2);
        doc.rect(leftX, leftY, tableW, theadH, 'FD');

        const incHeaders = ['#', 'Item', 'Qty', 'Amount'];
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7);
        doc.setTextColor(55, 65, 81);
        doc.text(incHeaders[0], incColX[0] + incCols[0] / 2, leftY + 3.3, { align: 'center' });
        doc.text(incHeaders[1], incColX[1] + 2, leftY + 3.3);
        doc.text(incHeaders[2], incColX[2] + incCols[2] / 2, leftY + 3.3, { align: 'center' });
        doc.text(incHeaders[3], incColX[3] + incCols[3] - 2, leftY + 3.3, { align: 'right' });
        leftY += theadH;

        // Rows
        if (incomeList.length === 0) {
          doc.setFillColor(255, 255, 255);
          doc.rect(leftX, leftY, tableW, 7, 'FD');
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(7);
          doc.setTextColor(156, 163, 175);
          doc.text('No income entries recorded', leftX + tableW / 2, leftY + 4.5, { align: 'center' });
          leftY += 7;
        } else {
          incomeList.forEach((row, idx) => {
            doc.setFillColor(idx % 2 === 1 ? 250 : 255, idx % 2 === 1 ? 250 : 255, idx % 2 === 1 ? 250 : 255);
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.15);
            doc.rect(leftX, leftY, tableW, rowH, 'FD');

            for (let c = 1; c < incCols.length; c++) {
              doc.line(incColX[c], leftY, incColX[c], leftY + rowH);
            }

            const rY = leftY + rowH - 1.6;
            // No
            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(6.8);
            doc.setTextColor(107, 114, 128);
            doc.text(String(row.rowNo || idx + 1), incColX[0] + incCols[0] / 2, rY, { align: 'center' });

            // Item
            doc.setFont(fontFamily, 'bold');
            doc.setFontSize(7);
            doc.setTextColor(17, 24, 39);
            const itemStr = doc.splitTextToSize(String(row.item || '—'), incCols[1] - 3)[0] || row.item;
            doc.text(itemStr, incColX[1] + 1.5, rY);

            // Qty
            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(6.8);
            doc.setTextColor(75, 85, 99);
            const qtyStr = row.quantity ? `${row.quantity}${row.unit ? ' ' + row.unit : ''}` : '—';
            const qtyTrunc = doc.splitTextToSize(qtyStr, incCols[2] - 2)[0] || qtyStr;
            doc.text(qtyTrunc, incColX[2] + incCols[2] / 2, rY, { align: 'center' });

            // Amount
            doc.setFont(fontFamily, 'bold');
            doc.setFontSize(7.2);
            doc.setTextColor(31, 61, 43);
            doc.text(formatINR(row.amount), incColX[3] + incCols[3] - 1.5, rY, { align: 'right' });

            leftY += rowH;
          });
        }

        // Total Bar
        doc.setFillColor(235, 245, 238);
        doc.setDrawColor(31, 61, 43);
        doc.setLineWidth(0.25);
        doc.rect(leftX, leftY, tableW, totBarH, 'FD');
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7);
        doc.setTextColor(31, 61, 43);
        doc.text('TOTAL INCOME', leftX + 2.5, leftY + 3.8);
        doc.setFontSize(7.8);
        doc.text(formatINR(totalIncome), leftX + tableW - 2.5, leftY + 3.8, { align: 'right' });
        leftY += totBarH;

        // ----------------------------------------------------
        // RIGHT: EXPENSE TABLE (Crimson Brand Theme)
        // ----------------------------------------------------
        // Header Banner
        doc.setFillColor(153, 27, 27); // #991B1B
        doc.rect(rightX, rightY, tableW, bannerH, 'F');
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`EXPENSE DETAILS (${expenseList.length})`, rightX + 2.5, rightY + 3.7);
        doc.setFontSize(6.8);
        doc.setTextColor(254, 202, 202);
        doc.text('Amount in INR (₹)', rightX + tableW - 2.5, rightY + 3.7, { align: 'right' });
        rightY += bannerH;

        // Column widths for Expense: No (8) | Item & Desc (tableW - 46) | Category (16) | Amount (22)
        const expCols = [8, tableW - 46, 16, 22];
        const expColX = [rightX];
        for (let i = 0; i < expCols.length; i++) {
          expColX.push(expColX[i] + expCols[i]);
        }

        // Table Header
        doc.setFillColor(243, 244, 246);
        doc.setDrawColor(209, 213, 219);
        doc.setLineWidth(0.2);
        doc.rect(rightX, rightY, tableW, theadH, 'FD');

        const expHeaders = ['#', 'Expense Item', 'Category', 'Amount'];
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7);
        doc.setTextColor(55, 65, 81);
        doc.text(expHeaders[0], expColX[0] + expCols[0] / 2, rightY + 3.3, { align: 'center' });
        doc.text(expHeaders[1], expColX[1] + 2, rightY + 3.3);
        doc.text(expHeaders[2], expColX[2] + expCols[2] / 2, rightY + 3.3, { align: 'center' });
        doc.text(expHeaders[3], expColX[3] + expCols[3] - 2, rightY + 3.3, { align: 'right' });
        rightY += theadH;

        // Rows
        if (expenseList.length === 0) {
          doc.setFillColor(255, 255, 255);
          doc.rect(rightX, rightY, tableW, 7, 'FD');
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(7);
          doc.setTextColor(156, 163, 175);
          doc.text('No expense entries recorded', rightX + tableW / 2, rightY + 4.5, { align: 'center' });
          rightY += 7;
        } else {
          expenseList.forEach((row, idx) => {
            doc.setFillColor(idx % 2 === 1 ? 250 : 255, idx % 2 === 1 ? 250 : 255, idx % 2 === 1 ? 250 : 255);
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.15);
            doc.rect(rightX, rightY, tableW, rowH, 'FD');

            for (let c = 1; c < expCols.length; c++) {
              doc.line(expColX[c], rightY, expColX[c], rightY + rowH);
            }

            const rY = rightY + rowH - 1.6;
            // No
            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(6.8);
            doc.setTextColor(107, 114, 128);
            doc.text(String(row.rowNo || idx + 1), expColX[0] + expCols[0] / 2, rY, { align: 'center' });

            // Item
            doc.setFont(fontFamily, 'bold');
            doc.setFontSize(7);
            doc.setTextColor(17, 24, 39);
            const itemStr = doc.splitTextToSize(String(row.item || '—'), expCols[1] - 3)[0] || row.item;
            doc.text(itemStr, expColX[1] + 1.5, rY);

            // Category
            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(107, 114, 128);
            const catStr = doc.splitTextToSize(String(row.category || '—'), expCols[2] - 2)[0] || (row.category || '—');
            doc.text(catStr, expColX[2] + expCols[2] / 2, rY, { align: 'center' });

            // Amount
            doc.setFont(fontFamily, 'bold');
            doc.setFontSize(7.2);
            doc.setTextColor(185, 28, 28);
            doc.text(formatINR(row.amount), expColX[3] + expCols[3] - 1.5, rY, { align: 'right' });

            rightY += rowH;
          });
        }

        // Total Bar
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(153, 27, 27);
        doc.setLineWidth(0.25);
        doc.rect(rightX, rightY, tableW, totBarH, 'FD');
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7);
        doc.setTextColor(153, 27, 27);
        doc.text('TOTAL EXPENSE', rightX + 2.5, rightY + 3.8);
        doc.setFontSize(7.8);
        doc.text(formatINR(totalExpense), rightX + tableW - 2.5, rightY + 3.8, { align: 'right' });
        rightY += totBarH;

        y = Math.max(leftY, rightY) + 3;
      }

      if (section.type === 'incomeTable' || section.type === 'expenseTable') {
        const isIncome = section.type === 'incomeTable';
        const baseTitle = isIncome ? 'INCOME DETAILS' : 'EXPENSE DETAILS';
        const sectionTitle = section.isContinued ? `${baseTitle} — CONTINUED` : baseTitle;
        const itemHeader = isIncome ? 'Income Item' : 'Expense Item';
        const totalLabel = isIncome ? 'TOTAL INCOME' : 'TOTAL EXPENSE';
        const totalValue = isIncome ? totalIncome : totalExpense;

        // Section Heading
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(17, 24, 39);
        doc.text(sectionTitle, margin, y);

        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128);
        doc.text('Amount in INR (₹)', rightEdge, y, { align: 'right' });

        y += 2;

        const colWidths = [11, 46, 61, 14, 15, 19, 20];
        const colX = [margin];
        for (let i = 0; i < colWidths.length; i++) {
          colX.push(colX[i] + colWidths[i]);
        }

        if (section.rows.length > 0) {
          const headH = 6.8;
          doc.setFillColor(243, 244, 246);
          doc.setDrawColor(156, 163, 175);
          doc.setLineWidth(0.25);
          doc.rect(margin, y, contentWidth, headH, 'FD');

          const headers = ['No.', itemHeader, 'Description', 'Qty', 'Unit', 'Rate', 'Amount'];
          doc.setFont(fontFamily, 'bold');
          doc.setFontSize(8);
          doc.setTextColor(17, 24, 39);

          headers.forEach((hText, cIdx) => {
            const cellLeft = colX[cIdx];
            const cellW = colWidths[cIdx];
            const textY = y + 4.6;

            if (cIdx === 0 || cIdx === 3 || cIdx === 4) {
              doc.text(hText, cellLeft + cellW / 2, textY, { align: 'center' });
            } else if (cIdx === 5 || cIdx === 6) {
              doc.text(hText, cellLeft + cellW - 2, textY, { align: 'right' });
            } else {
              doc.text(hText, cellLeft + 2, textY);
            }

            if (cIdx < headers.length - 1) {
              doc.setDrawColor(209, 213, 219);
              doc.setLineWidth(0.2);
              doc.line(colX[cIdx + 1], y, colX[cIdx + 1], y + headH);
            }
          });

          y += headH;

          section.rows.forEach((row, rIdx) => {
            doc.setFont(fontFamily, row.isEmptyPlaceholder ? 'normal' : 'bold');
            doc.setFontSize(8);
            const itemLines = doc.splitTextToSize(String(row.item || '—'), colWidths[1] - 4);

            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(8);
            const descLines = doc.splitTextToSize(String(row.description || '—'), colWidths[2] - 4);

            const lineCount = Math.max(1, itemLines.length, descLines.length);
            const rowH = Math.max(6.8, 3.4 + lineCount * 3.4);

            if (rIdx % 2 === 1) {
              doc.setFillColor(250, 250, 250);
            } else {
              doc.setFillColor(255, 255, 255);
            }

            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.2);
            doc.rect(margin, y, contentWidth, rowH, 'FD');

            for (let cIdx = 1; cIdx < colWidths.length; cIdx++) {
              doc.line(colX[cIdx], y, colX[cIdx], y + rowH);
            }

            const firstLineY = y + 4.5;

            // Col 0: No.
            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(7.8);
            doc.setTextColor(75, 85, 99);
            doc.text(String(row.rowNo || '—'), colX[0] + colWidths[0] / 2, firstLineY, {
              align: 'center',
            });

            // Col 1: Item
            doc.setFont(fontFamily, row.isEmptyPlaceholder ? 'normal' : 'bold');
            doc.setFontSize(8);
            doc.setTextColor(row.isEmptyPlaceholder ? 107 : 17, row.isEmptyPlaceholder ? 114 : 24, row.isEmptyPlaceholder ? 128 : 39);
            doc.text(itemLines, colX[1] + 2, firstLineY);

            // Col 2: Description
            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(7.8);
            doc.setTextColor(75, 85, 99);
            doc.text(descLines, colX[2] + 2, firstLineY);

            // Col 3: Qty
            const qtyStr =
              row.quantity !== '' && row.quantity !== null && row.quantity !== undefined
                ? String(row.quantity)
                : '—';
            doc.setTextColor(55, 65, 81);
            doc.text(qtyStr, colX[3] + colWidths[3] / 2, firstLineY, { align: 'center' });

            // Col 4: Unit
            doc.setTextColor(75, 85, 99);
            doc.text(String(row.unit || '—'), colX[4] + colWidths[4] / 2, firstLineY, {
              align: 'center',
            });

            // Col 5: Rate
            const rateStr =
              row.rate !== '' &&
              row.rate !== null &&
              row.rate !== undefined &&
              Number(row.rate) > 0
                ? formatINR(row.rate)
                : '—';
            doc.setTextColor(55, 65, 81);
            doc.text(rateStr, colX[5] + colWidths[5] - 2, firstLineY, { align: 'right' });

            // Col 6: Amount
            doc.setFont(fontFamily, 'bold');
            doc.setFontSize(8);
            doc.setTextColor(17, 24, 39);
            doc.text(formatINR(row.amount), colX[6] + colWidths[6] - 2, firstLineY, {
              align: 'right',
            });

            y += rowH;
          });
        }

        // Bottom-Right Section Total Box
        if (section.showTotal) {
          y += 1.8;
          const totBoxW = 68;
          const totBoxH = 7.2;
          const totBoxX = rightEdge - totBoxW;

          doc.setFillColor(249, 250, 251);
          doc.setDrawColor(17, 24, 39);
          doc.setLineWidth(0.3);
          doc.rect(totBoxX, y, totBoxW, totBoxH, 'FD');

          doc.setFont(fontFamily, 'bold');
          doc.setFontSize(7.8);
          doc.setTextColor(55, 65, 81);
          doc.text(totalLabel, totBoxX + 3, y + 4.8);

          doc.setFont(fontFamily, 'bold');
          doc.setFontSize(8.8);
          doc.setTextColor(17, 24, 39);
          doc.text(formatINR(totalValue), rightEdge - 3, y + 4.8, { align: 'right' });

          y += totBoxH + 4.5;
        } else {
          y += 3;
        }
      }

      // 4. FINANCIAL SUMMARY (Atomic Block)
      if (section.type === 'financialSummary') {
        const isSingle = layoutMode === 'singlePage';
        y += 1;
        const sumH = isSingle ? 21 : 26;
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.35);
        doc.rect(margin, y, contentWidth, sumH, 'FD');

        // Header line inside summary box
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(isSingle ? 8 : 8.5);
        doc.setTextColor(17, 24, 39);
        doc.text('FINANCIAL SUMMARY', margin + 3.5, y + (isSingle ? 4.5 : 5.5));

        // Status badge on right
        const badgeW = isSingle ? 36 : 38;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.25);
        doc.rect(rightEdge - badgeW - 3.5, y + (isSingle ? 1.5 : 2), badgeW, isSingle ? 4.2 : 4.8, 'FD');
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(isSingle ? 6.5 : 6.8);
        doc.text(balanceStatusText, rightEdge - 3.5 - badgeW / 2, y + (isSingle ? 4.5 : 5.3), { align: 'center' });

        doc.setDrawColor(209, 213, 219);
        doc.setLineWidth(0.2);
        doc.line(margin + 3.5, y + (isSingle ? 6.8 : 8), rightEdge - 3.5, y + (isSingle ? 6.8 : 8));

        // Total Income Row
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(isSingle ? 7.8 : 8.2);
        doc.setTextColor(55, 65, 81);
        doc.text('Total Income', margin + 3.5, y + (isSingle ? 10.5 : 12.5));
        doc.setFont(fontFamily, 'bold');
        doc.setTextColor(31, 61, 43);
        doc.text(formatINR(totalIncome), rightEdge - 3.5, y + (isSingle ? 10.5 : 12.5), { align: 'right' });

        // Total Expense Row
        doc.setFont(fontFamily, 'normal');
        doc.setTextColor(55, 65, 81);
        doc.text('Total Expense', margin + 3.5, y + (isSingle ? 14 : 17));
        doc.setFont(fontFamily, 'bold');
        doc.setTextColor(185, 28, 28);
        doc.text(formatINR(totalExpense), rightEdge - 3.5, y + (isSingle ? 14 : 17), { align: 'right' });

        // Divider before NET BALANCE
        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.3);
        doc.line(margin + 3.5, y + (isSingle ? 15.8 : 19.2), rightEdge - 3.5, y + (isSingle ? 15.8 : 19.2));

        // NET BALANCE Row
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(isSingle ? 8.8 : 9.5);
        doc.setTextColor(17, 24, 39);
        doc.text('NET BALANCE', margin + 3.5, y + (isSingle ? 19.5 : 23.8));
        doc.setFontSize(isSingle ? 9.8 : 10.5);
        doc.setTextColor(netBalance >= 0 ? 31 : 185, netBalance >= 0 ? 61 : 28, netBalance >= 0 ? 43 : 28);
        doc.text(formattedNetBalance, rightEdge - 3.5, y + (isSingle ? 19.5 : 23.8), { align: 'right' });

        y += sumH + (isSingle ? 3 : 4.5);
      }

      // 5. NOTES SECTION (Atomic Block)
      if (section.type === 'notes') {
        const isSingle = layoutMode === 'singlePage';
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(isSingle ? 7.8 : 8.2);
        doc.setTextColor(17, 24, 39);
        doc.text('NOTES', margin, y + 2.5);
        y += isSingle ? 4 : 5;

        if (event.notes && event.notes.trim()) {
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(isSingle ? 7.5 : 8);
          doc.setTextColor(55, 65, 81);
          const noteLines = doc.splitTextToSize(event.notes.trim(), contentWidth);
          const maxLines = isSingle ? Math.min(2, noteLines.length) : noteLines.length;
          for (let i = 0; i < maxLines; i++) {
            doc.text(noteLines[i], margin, y + 2.5 + i * 3.5);
          }
          y += maxLines * 3.5 + 1.5;
          doc.setDrawColor(209, 213, 219);
          doc.setLineWidth(0.2);
          doc.line(margin, y, rightEdge, y);
          y += isSingle ? 2.5 : 4;
        } else {
          doc.setDrawColor(156, 163, 175);
          doc.setLineWidth(0.2);
          doc.line(margin, y + 3, rightEdge, y + 3);
          if (!isSingle) {
            doc.line(margin, y + 8, rightEdge, y + 8);
            y += 12;
          } else {
            y += 5.5;
          }
        }
      }

      // 6. SIGNATURE SECTION (Atomic Block)
      if (section.type === 'signatures') {
        const isSingle = layoutMode === 'singlePage';
        y += isSingle ? 2 : 4;
        const sigCols = ['Prepared By:', 'Checked By:', 'Authorized Signature:', 'Date:'];
        const gap = 5;
        const sigW = (contentWidth - gap * 3) / 4;

        sigCols.forEach((label, idx) => {
          const sx = margin + idx * (sigW + gap);
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(isSingle ? 7.2 : 8);
          doc.setTextColor(75, 85, 99);
          doc.text(label, sx, y + 3.5);

          // Generous space for handwritten signature
          doc.setDrawColor(55, 65, 81);
          doc.setLineWidth(0.25);
          doc.line(sx, y + (isSingle ? 12 : 16), sx + sigW, y + (isSingle ? 12 : 16));
        });

        y += isSingle ? 14 : 20;
      }
    });

    // ==================================================
    // 7. BOTTOM CONTINUATION NOTICE & OFFICIAL FOOTER
    // ==================================================
    const footerTopY = pageHeight - margin - 10;

    if (page.continuesOnNextPage) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      doc.text('CONTINUES ON NEXT PAGE ->', rightEdge, footerTopY - 2.5, { align: 'right' });
    }

    // Subtle divider above footer
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.25);
    doc.line(margin, footerTopY, rightEdge, footerTopY);

    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 24, 39);
    doc.text(
      'SILVER CATERING — Premium Catering Services in Kerala',
      margin,
      footerTopY + 4.2
    );

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(75, 85, 99);
    doc.text(
      'www.silvercatering.in   |   Phone: +91 98464 15767   |   Email: Silvereventsandcaters@gmail.com',
      margin,
      footerTopY + 8.2
    );

    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text(
      `Page ${page.pageNumber} of ${page.totalPages}`,
      rightEdge,
      footerTopY + 6.5,
      { align: 'right' }
    );
  });

  return doc;
}

/**
 * Generates and downloads the official A4 PDF statement
 */
export async function generateEventFinancialPDF(event, options = {}) {
  const doc = await buildStatementPdfDoc(event, options);
  const cleanEventName = (event.name || 'Event')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/__+/g, '_');
  const filename = `Silver_Catering_Event_Financial_Statement_${cleanEventName}.pdf`;
  doc.save(filename);
  return { success: true, filename };
}

/**
 * Generates a live Blob URL for the official A4 PDF statement
 */
export async function generateEventPDFBlobUrl(event, options = {}) {
  const doc = await buildStatementPdfDoc(event, options);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

/**
 * Builds the jsPDF document for Periodic Statements (Monthly, Yearly, All-Time)
 */
async function buildPeriodicStatementPdfDoc(statementData, options = {}) {
  if (!statementData) throw new Error('Statement data is required to generate PDF');

  const { layoutMode = 'singlePage' } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = layoutMode === 'singlePage' ? 10 : 12;
  const contentWidth = pageWidth - margin * 2;
  const rightEdge = pageWidth - margin;

  // Load Outfit font for ₹ symbol
  const base64Font = await loadOutfitFont();
  let fontFamily = 'helvetica';
  if (base64Font) {
    doc.addFileToVFS('Outfit.ttf', base64Font);
    doc.addFont('Outfit.ttf', 'Outfit', 'normal');
    doc.addFont('Outfit.ttf', 'Outfit', 'bold');
    doc.setFont('Outfit', 'normal');
    fontFamily = 'Outfit';
  }

  const baseUrl = import.meta.env.BASE_URL || './';
  const logoData = await getBase64ImageFromUrl(`${baseUrl}silver_logo.png`);

  const {
    periodTitle,
    documentNo,
    periodSubtitle,
    generatedDate,
    eventsCount,
    totalIncome,
    totalExpense,
    netBalance,
    notes,
    preparedBy,
  } = statementData;

  const formattedNetBalance =
    netBalance < 0
      ? `-${formatINR(Math.abs(netBalance))}`
      : formatINR(netBalance);

  let balanceStatusText = 'BREAK EVEN';
  if (netBalance > 0) {
    balanceStatusText = 'POSITIVE BALANCE';
  } else if (netBalance < 0) {
    balanceStatusText = 'NEGATIVE BALANCE';
  }

  const pages = paginatePeriodicStatement(statementData, { layoutMode });

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage('a4', 'portrait');
    }

    let y = margin;

    // Header
    if (!page.isContinuation) {
      // Logo Box
      doc.setDrawColor(209, 213, 219);
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin, y, 14, 14, 1.5, 1.5, 'FD');

      if (logoData) {
        try {
          doc.addImage(logoData, 'PNG', margin + 1, y + 1, 12, 12);
        } catch {
          // ignore
        }
      }

      const brandX = margin + 17;
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('SILVER CATERING', brandX, y + 6.5);

      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      doc.text('PREMIUM CATERING SERVICES IN KERALA', brandX, y + 11.2);

      // Contact details
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text('www.silvercatering.in', rightEdge, y + 4.2, { align: 'right' });

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(75, 85, 99);
      doc.text('Valanchery, Kerala  •  +91 98464 15767', rightEdge, y + 8.2, { align: 'right' });
      doc.text('Silvereventsandcaters@gmail.com', rightEdge, y + 12, { align: 'right' });

      y += 16.5;

      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.25);
      doc.line(margin, y, rightEdge, y);

      y += 5.5;

      // Period Title + Doc No
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      doc.text(periodTitle, margin, y);

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(55, 65, 81);
      doc.text(
        `Doc No: ${documentNo}      Date: ${generatedDate}`,
        rightEdge,
        y,
        { align: 'right' }
      );

      y += 3.5;
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(0.4);
      doc.line(margin, y, rightEdge, y);
      y += 4.5;
    } else {
      // Continuation Header
      if (logoData) {
        try {
          doc.addImage(logoData, 'PNG', margin, y, 6.5, 6.5);
        } catch {
          // ignore
        }
      }

      const contX = logoData ? margin + 8.5 : margin;
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      doc.text(`SILVER CATERING   |   ${periodSubtitle.toUpperCase()} STATEMENT`, contX, y + 4.5);

      doc.setDrawColor(156, 163, 175);
      doc.setLineWidth(0.25);
      doc.rect(rightEdge - 22, y + 0.8, 22, 5, 'S');
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(7);
      doc.setTextColor(55, 65, 81);
      doc.text('CONTINUED', rightEdge - 11, y + 4.2, { align: 'center' });

      y += 8;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.line(margin, y, rightEdge, y);

      y += 4.2;
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      doc.text(`Document: ${documentNo}   •   Events Count: ${eventsCount}`, margin, y);
      doc.text(`Generated: ${generatedDate}`, rightEdge, y, { align: 'right' });

      y += 2.8;
      doc.setDrawColor(156, 163, 175);
      doc.setLineWidth(0.3);
      doc.line(margin, y, rightEdge, y);
      y += 4.5;
    }

    // Page 1 Executive Summary Box
    if (page.showExecutiveSummary) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text('EXECUTIVE PERIOD SUMMARY', margin, y);
      y += 2;

      const sumH = 14;
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.25);
      doc.rect(margin, y, contentWidth, sumH, 'FD');

      const colW = contentWidth / 4;
      const drawMetric = (colIdx, title, val, color) => {
        const cx = margin + colIdx * colW;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.text(title.toUpperCase(), cx + colW / 2, y + 4.5, { align: 'center' });

        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(String(val), cx + colW / 2, y + 10.5, { align: 'center' });

        if (colIdx < 3) {
          doc.setDrawColor(229, 231, 235);
          doc.setLineWidth(0.2);
          doc.line(cx + colW, y, cx + colW, y + sumH);
        }
      };

      drawMetric(0, 'Events Held', eventsCount, [17, 24, 39]);
      drawMetric(1, 'Total Revenue', formatINR(totalIncome), [31, 61, 43]);
      drawMetric(2, 'Total Expense', formatINR(totalExpense), [185, 28, 28]);
      drawMetric(3, 'Net Profit', formattedNetBalance, netBalance >= 0 ? [31, 61, 43] : [185, 28, 28]);

      y += sumH + 5;
    }

    // Sections
    page.sections.forEach((section) => {
      if (section.type === 'eventsTable') {
        const sectionTitle = section.isContinued
          ? 'EVENTS FINANCIAL BREAKDOWN — CONTINUED'
          : 'EVENTS FINANCIAL BREAKDOWN';

        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(17, 24, 39);
        doc.text(sectionTitle, margin, y);

        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128);
        doc.text('Amount in INR (₹)', rightEdge, y, { align: 'right' });

        y += 2;

        // Columns: No. (9) | Event & ID (40) | Client (33) | Date (22) | Venue (26) | Income (19) | Expense (18) | Net (19)
        const colWidths = [9, 40, 33, 22, 26, 19, 18, 19];
        const colX = [margin];
        for (let i = 0; i < colWidths.length; i++) {
          colX.push(colX[i] + colWidths[i]);
        }

        if (section.rows.length > 0) {
          const headH = 6.5;
          doc.setFillColor(243, 244, 246);
          doc.setDrawColor(156, 163, 175);
          doc.setLineWidth(0.25);
          doc.rect(margin, y, contentWidth, headH, 'FD');

          const headers = ['No.', 'Event & ID', 'Client / Host', 'Date', 'Venue', 'Income', 'Expense', 'Net Balance'];
          doc.setFont(fontFamily, 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(17, 24, 39);

          headers.forEach((hText, cIdx) => {
            const cellLeft = colX[cIdx];
            const cellW = colWidths[cIdx];
            const textY = y + 4.4;

            if (cIdx === 0 || cIdx === 3) {
              doc.text(hText, cellLeft + cellW / 2, textY, { align: 'center' });
            } else if (cIdx >= 5) {
              doc.text(hText, cellLeft + cellW - 2, textY, { align: 'right' });
            } else {
              doc.text(hText, cellLeft + 2, textY);
            }

            if (cIdx < headers.length - 1) {
              doc.setDrawColor(209, 213, 219);
              doc.setLineWidth(0.2);
              doc.line(colX[cIdx + 1], y, colX[cIdx + 1], y + headH);
            }
          });

          y += headH;

          section.rows.forEach((row, rIdx) => {
            const rowH = 7.2;

            if (rIdx % 2 === 1) {
              doc.setFillColor(250, 250, 250);
            } else {
              doc.setFillColor(255, 255, 255);
            }

            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.2);
            doc.rect(margin, y, contentWidth, rowH, 'FD');

            for (let cIdx = 1; cIdx < colWidths.length; cIdx++) {
              doc.line(colX[cIdx], y, colX[cIdx], y + rowH);
            }

            const textY = y + 4.8;

            // No.
            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(75, 85, 99);
            doc.text(String(row.rowNo), colX[0] + colWidths[0] / 2, textY, { align: 'center' });

            // Event & ID
            doc.setFont(fontFamily, 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(17, 24, 39);
            const nameTrunc = doc.splitTextToSize(row.name, colWidths[1] - 4)[0] || row.name;
            doc.text(nameTrunc, colX[1] + 2, textY - 1);
            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(107, 114, 128);
            doc.text(row.id, colX[1] + 2, textY + 2);

            // Client
            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(75, 85, 99);
            const clientTrunc = doc.splitTextToSize(row.clientName || '—', colWidths[2] - 4)[0] || row.clientName;
            doc.text(clientTrunc, colX[2] + 2, textY);

            // Date
            doc.text(String(row.date || '—'), colX[3] + colWidths[3] / 2, textY, { align: 'center' });

            // Venue
            const venueTrunc = doc.splitTextToSize(row.venue || '—', colWidths[4] - 4)[0] || row.venue;
            doc.text(venueTrunc, colX[4] + 2, textY);

            // Income
            doc.setTextColor(31, 61, 43);
            doc.text(formatINR(row.income), colX[5] + colWidths[5] - 2, textY, { align: 'right' });

            // Expense
            doc.setTextColor(185, 28, 28);
            doc.text(formatINR(row.expense), colX[6] + colWidths[6] - 2, textY, { align: 'right' });

            // Net
            doc.setFont(fontFamily, 'bold');
            doc.setTextColor(row.netBalance >= 0 ? 17 : 185, row.netBalance >= 0 ? 24 : 28, row.netBalance >= 0 ? 39 : 28);
            const netStr = row.netBalance < 0 ? `-${formatINR(Math.abs(row.netBalance))}` : formatINR(row.netBalance);
            doc.text(netStr, colX[7] + colWidths[7] - 2, textY, { align: 'right' });

            y += rowH;
          });
        }

        if (section.showTotal) {
          y += 1.8;
          const totW = 95;
          const totH = 6.8;
          const totX = rightEdge - totW;

          doc.setFillColor(249, 250, 251);
          doc.setDrawColor(17, 24, 39);
          doc.setLineWidth(0.3);
          doc.rect(totX, y, totW, totH, 'FD');

          doc.setFont(fontFamily, 'bold');
          doc.setFontSize(7.2);
          doc.setTextColor(55, 65, 81);
          doc.text(`TOTAL (${eventsCount} EVENTS):`, totX + 3, y + 4.5);

          doc.setFont(fontFamily, 'bold');
          doc.setFontSize(7.8);
          doc.setTextColor(17, 24, 39);
          doc.text(`In: ${formatINR(totalIncome)}  |  Out: ${formatINR(totalExpense)}`, rightEdge - 3, y + 4.5, { align: 'right' });

          y += totH + 4;
        } else {
          y += 3;
        }
      }

      if (section.type === 'monthlyBreakdownTable') {
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(17, 24, 39);
        doc.text('MONTH-BY-MONTH ANNUAL SUMMARY', margin, y);
        y += 2;

        const mColWidths = [42, 22, 40, 40, 42];
        const mColX = [margin];
        for (let i = 0; i < mColWidths.length; i++) {
          mColX.push(mColX[i] + mColWidths[i]);
        }

        const headH = 6.2;
        doc.setFillColor(243, 244, 246);
        doc.setDrawColor(156, 163, 175);
        doc.setLineWidth(0.25);
        doc.rect(margin, y, contentWidth, headH, 'FD');

        const mHeaders = ['Month', 'Events', 'Gross Inflow', 'Total Outflow', 'Net Margin'];
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(17, 24, 39);

        mHeaders.forEach((h, cIdx) => {
          const cx = mColX[cIdx];
          const cw = mColWidths[cIdx];
          const ty = y + 4.2;
          if (cIdx === 1) {
            doc.text(h, cx + cw / 2, ty, { align: 'center' });
          } else if (cIdx >= 2) {
            doc.text(h, cx + cw - 2, ty, { align: 'right' });
          } else {
            doc.text(h, cx + 2, ty);
          }
        });

        y += headH;

        section.rows.forEach((m, rIdx) => {
          const rH = 5.8;
          doc.setFillColor(rIdx % 2 === 1 ? 250 : 255, rIdx % 2 === 1 ? 250 : 255, rIdx % 2 === 1 ? 250 : 255);
          doc.setDrawColor(229, 231, 235);
          doc.setLineWidth(0.2);
          doc.rect(margin, y, contentWidth, rH, 'FD');

          const ty = y + 4;
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(17, 24, 39);
          doc.text(m.monthName, mColX[0] + 2, ty);

          doc.setTextColor(75, 85, 99);
          doc.text(String(m.eventsCount), mColX[1] + mColWidths[1] / 2, ty, { align: 'center' });

          doc.setTextColor(31, 61, 43);
          doc.text(formatINR(m.income), mColX[2] + mColWidths[2] - 2, ty, { align: 'right' });

          doc.setTextColor(185, 28, 28);
          doc.text(formatINR(m.expense), mColX[3] + mColWidths[3] - 2, ty, { align: 'right' });

          doc.setFont(fontFamily, 'bold');
          doc.setTextColor(m.netBalance >= 0 ? 17 : 185, m.netBalance >= 0 ? 24 : 28, m.netBalance >= 0 ? 39 : 28);
          const netM = m.netBalance < 0 ? `-${formatINR(Math.abs(m.netBalance))}` : formatINR(m.netBalance);
          doc.text(netM, mColX[4] + mColWidths[4] - 2, ty, { align: 'right' });

          y += rH;
        });

        y += 4;
      }

      if (section.type === 'categoriesBreakdown') {
        const catBoxW = (contentWidth - 6) / 2;
        const leftX = margin;
        const rightX = margin + catBoxW + 6;

        // Income Categories
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(31, 61, 43);
        doc.text('INCOME BY CATEGORY', leftX, y);

        // Expense Categories
        doc.setTextColor(185, 28, 28);
        doc.text('EXPENSES BY CATEGORY', rightX, y);
        y += 2.5;

        const maxCats = Math.max(
          Math.min(5, section.incomeCategories.length),
          Math.min(5, section.expenseCategories.length)
        );

        for (let i = 0; i < maxCats; i++) {
          const rH = 5.6;
          const ty = y + 4;

          // Income Item
          if (section.incomeCategories[i]) {
            const inc = section.incomeCategories[i];
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(229, 231, 235);
            doc.rect(leftX, y, catBoxW, rH, 'FD');

            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(7.2);
            doc.setTextColor(17, 24, 39);
            const catName = doc.splitTextToSize(inc.category, catBoxW - 32)[0] || inc.category;
            doc.text(catName, leftX + 2, ty);

            doc.setFont(fontFamily, 'bold');
            doc.setTextColor(31, 61, 43);
            doc.text(`${formatINR(inc.amount)} (${inc.percentage}%)`, leftX + catBoxW - 2, ty, { align: 'right' });
          }

          // Expense Item
          if (section.expenseCategories[i]) {
            const exp = section.expenseCategories[i];
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(229, 231, 235);
            doc.rect(rightX, y, catBoxW, rH, 'FD');

            doc.setFont(fontFamily, 'normal');
            doc.setFontSize(7.2);
            doc.setTextColor(17, 24, 39);
            const catName = doc.splitTextToSize(exp.category, catBoxW - 32)[0] || exp.category;
            doc.text(catName, rightX + 2, ty);

            doc.setFont(fontFamily, 'bold');
            doc.setTextColor(185, 28, 28);
            doc.text(`${formatINR(exp.amount)} (${exp.percentage}%)`, rightX + catBoxW - 2, ty, { align: 'right' });
          }

          y += rH;
        }

        y += 4;
      }

      if (section.type === 'financialSummary') {
        const isSingle = layoutMode === 'singlePage';
        y += 1;
        const sumH = isSingle ? 21 : 26;
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.35);
        doc.rect(margin, y, contentWidth, sumH, 'FD');

        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(isSingle ? 8 : 8.5);
        doc.setTextColor(17, 24, 39);
        doc.text('PERIOD FINANCIAL SUMMARY', margin + 3.5, y + (isSingle ? 4.5 : 5.5));

        const badgeW = isSingle ? 36 : 38;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.25);
        doc.rect(rightEdge - badgeW - 3.5, y + (isSingle ? 1.5 : 2), badgeW, isSingle ? 4.2 : 4.8, 'FD');
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(isSingle ? 6.5 : 6.8);
        doc.text(balanceStatusText, rightEdge - 3.5 - badgeW / 2, y + (isSingle ? 4.5 : 5.3), { align: 'center' });

        doc.setDrawColor(209, 213, 219);
        doc.setLineWidth(0.2);
        doc.line(margin + 3.5, y + (isSingle ? 6.8 : 8), rightEdge - 3.5, y + (isSingle ? 6.8 : 8));

        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(isSingle ? 7.8 : 8.2);
        doc.setTextColor(55, 65, 81);
        doc.text('Total Events Revenue', margin + 3.5, y + (isSingle ? 10.5 : 12.5));
        doc.setFont(fontFamily, 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(formatINR(totalIncome), rightEdge - 3.5, y + (isSingle ? 10.5 : 12.5), { align: 'right' });

        doc.setFont(fontFamily, 'normal');
        doc.setTextColor(55, 65, 81);
        doc.text('Total Operating Expenses', margin + 3.5, y + (isSingle ? 14 : 17));
        doc.setFont(fontFamily, 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(formatINR(totalExpense), rightEdge - 3.5, y + (isSingle ? 14 : 17), { align: 'right' });

        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.3);
        doc.line(margin + 3.5, y + (isSingle ? 15.8 : 19.2), rightEdge - 3.5, y + (isSingle ? 15.8 : 19.2));

        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(isSingle ? 8.8 : 9.5);
        doc.setTextColor(17, 24, 39);
        doc.text('NET BALANCE / PROFIT', margin + 3.5, y + (isSingle ? 19.5 : 23.8));
        doc.setFontSize(isSingle ? 9.8 : 10.5);
        doc.text(formattedNetBalance, rightEdge - 3.5, y + (isSingle ? 19.5 : 23.8), { align: 'right' });

        y += sumH + (isSingle ? 3 : 4.5);
      }

      if (section.type === 'notes') {
        const isSingle = layoutMode === 'singlePage';
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(isSingle ? 7.8 : 8.2);
        doc.setTextColor(17, 24, 39);
        doc.text('AUDIT NOTES & REMARKS', margin, y + 2.5);
        y += isSingle ? 4 : 5;

        if (notes && notes.trim()) {
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(isSingle ? 7.5 : 8);
          doc.setTextColor(55, 65, 81);
          const noteLines = doc.splitTextToSize(notes.trim(), contentWidth);
          const maxLines = isSingle ? Math.min(2, noteLines.length) : noteLines.length;
          for (let i = 0; i < maxLines; i++) {
            doc.text(noteLines[i], margin, y + 2.5 + i * 3.5);
          }
          y += maxLines * 3.5 + 1.5;
          doc.setDrawColor(209, 213, 219);
          doc.setLineWidth(0.2);
          doc.line(margin, y, rightEdge, y);
          y += isSingle ? 2.5 : 4;
        } else {
          doc.setDrawColor(156, 163, 175);
          doc.setLineWidth(0.2);
          doc.line(margin, y + 3, rightEdge, y + 3);
          if (!isSingle) {
            doc.line(margin, y + 8, rightEdge, y + 8);
            y += 12;
          } else {
            y += 5.5;
          }
        }
      }

      if (section.type === 'signatures') {
        const isSingle = layoutMode === 'singlePage';
        y += isSingle ? 2 : 4;
        const prepStr = preparedBy ? `Prepared By: ${preparedBy}` : 'Prepared By:';
        const sigCols = [prepStr, 'Checked By:', 'Authorized Signature:', 'Date:'];
        const gap = 5;
        const sigW = (contentWidth - gap * 3) / 4;

        sigCols.forEach((label, idx) => {
          const sx = margin + idx * (sigW + gap);
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(isSingle ? 7.2 : 7.8);
          doc.setTextColor(75, 85, 99);
          doc.text(label, sx, y + 3.5);

          doc.setDrawColor(55, 65, 81);
          doc.setLineWidth(0.25);
          doc.line(sx, y + (isSingle ? 12 : 16), sx + sigW, y + (isSingle ? 12 : 16));
        });

        y += isSingle ? 14 : 20;
      }
    });

    // Continuation notice & footer
    const footerTopY = pageHeight - margin - 8;

    if (page.continuesOnNextPage) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      doc.text('CONTINUES ON NEXT PAGE ->', rightEdge, footerTopY - 2.5, { align: 'right' });
    }

    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.25);
    doc.line(margin, footerTopY, rightEdge, footerTopY);

    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 24, 39);
    doc.text('SILVER CATERING — Premium Catering Services in Kerala', margin, footerTopY + 4.2);

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(75, 85, 99);
    doc.text(
      'www.silvercatering.in   |   Phone: +91 98464 15767   |   Email: Silvereventsandcaters@gmail.com',
      margin,
      footerTopY + 8.2
    );

    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text(`Page ${page.pageNumber} of ${page.totalPages}`, rightEdge, footerTopY + 6.5, { align: 'right' });
  });

  return doc;
}

/**
 * Generates and downloads the official A4 PDF statement for Monthly / Yearly / All periods
 */
export async function generatePeriodicFinancialPDF(statementData, options = {}) {
  const doc = await buildPeriodicStatementPdfDoc(statementData, options);
  const cleanTitle = (statementData.periodTitle || 'Periodic_Statement')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/__+/g, '_');
  const filename = `Silver_Catering_${cleanTitle}.pdf`;
  doc.save(filename);
  return { success: true, filename };
}


