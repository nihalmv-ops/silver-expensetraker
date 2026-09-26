import { jsPDF } from 'jspdf';
import { formatINR } from './currency.js';
import {
  paginateEventStatement,
  formatFullDate,
  getDocumentNo,
} from './statementPagination.js';

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
async function buildStatementPdfDoc(event) {
  if (!event) throw new Error('Event data is required to generate PDF');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12; // @page { size: A4; margin: 12mm; }
  const contentWidth = pageWidth - margin * 2; // 186mm
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

  const pages = paginateEventStatement(event);

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
    // 3. SECTIONS (INCOME TABLE, EXPENSE TABLE, SUMMARY, NOTES, SIGNATURES)
    // ==================================================
    page.sections.forEach((section) => {
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

        // Column widths (sum = 186mm):
        // No. (11) | Item (46) | Description (61) | Qty (14) | Unit (15) | Rate (19) | Amount (20)
        const colWidths = [11, 46, 61, 14, 15, 19, 20];
        const colX = [margin];
        for (let i = 0; i < colWidths.length; i++) {
          colX.push(colX[i] + colWidths[i]);
        }

        if (section.rows.length > 0) {
          // Table Header Row
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

          // Table Body Rows
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

            // Vertical cell dividers
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
        y += 1;
        const sumH = 26;
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.35);
        doc.rect(margin, y, contentWidth, sumH, 'FD');

        // Header line inside summary box
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(17, 24, 39);
        doc.text('FINANCIAL SUMMARY', margin + 4, y + 5.5);

        // Status badge on right
        const badgeW = 38;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.25);
        doc.rect(rightEdge - badgeW - 4, y + 2, badgeW, 4.8, 'FD');
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(6.8);
        doc.text(balanceStatusText, rightEdge - 4 - badgeW / 2, y + 5.3, { align: 'center' });

        doc.setDrawColor(209, 213, 219);
        doc.setLineWidth(0.2);
        doc.line(margin + 4, y + 8, rightEdge - 4, y + 8);

        // Total Income Row
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8.2);
        doc.setTextColor(55, 65, 81);
        doc.text('Total Income', margin + 4, y + 12.5);
        doc.setFont(fontFamily, 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(formatINR(totalIncome), rightEdge - 4, y + 12.5, { align: 'right' });

        // Total Expense Row
        doc.setFont(fontFamily, 'normal');
        doc.setTextColor(55, 65, 81);
        doc.text('Total Expense', margin + 4, y + 17);
        doc.setFont(fontFamily, 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(formatINR(totalExpense), rightEdge - 4, y + 17, { align: 'right' });

        // Divider before NET BALANCE
        doc.setDrawColor(17, 24, 39);
        doc.setLineWidth(0.3);
        doc.line(margin + 4, y + 19.2, rightEdge - 4, y + 19.2);

        // NET BALANCE Row
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(17, 24, 39);
        doc.text('NET BALANCE', margin + 4, y + 23.8);
        doc.setFontSize(10.5);
        doc.text(formattedNetBalance, rightEdge - 4, y + 23.8, { align: 'right' });

        y += sumH + 4.5;
      }

      // 5. NOTES SECTION (Atomic Block)
      if (section.type === 'notes') {
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(17, 24, 39);
        doc.text('NOTES', margin, y + 3);
        y += 5;

        if (event.notes && event.notes.trim()) {
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(8);
          doc.setTextColor(55, 65, 81);
          const noteLines = doc.splitTextToSize(event.notes.trim(), contentWidth);
          doc.text(noteLines, margin, y + 3);
          y += noteLines.length * 4 + 2;
          doc.setDrawColor(209, 213, 219);
          doc.setLineWidth(0.2);
          doc.line(margin, y, rightEdge, y);
          y += 4;
        } else {
          doc.setDrawColor(156, 163, 175);
          doc.setLineWidth(0.2);
          doc.line(margin, y + 4, rightEdge, y + 4);
          doc.line(margin, y + 10, rightEdge, y + 10);
          y += 14;
        }
      }

      // 6. SIGNATURE SECTION (Atomic Block)
      if (section.type === 'signatures') {
        y += 4;
        const sigCols = ['Prepared By:', 'Checked By:', 'Authorized Signature:', 'Date:'];
        const gap = 6;
        const sigW = (contentWidth - gap * 3) / 4;

        sigCols.forEach((label, idx) => {
          const sx = margin + idx * (sigW + gap);
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(8);
          doc.setTextColor(75, 85, 99);
          doc.text(label, sx, y + 4);

          // Generous space for handwritten signature
          doc.setDrawColor(55, 65, 81);
          doc.setLineWidth(0.25);
          doc.line(sx, y + 16, sx + sigW, y + 16);
        });

        y += 20;
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
export async function generateEventFinancialPDF(event) {
  const doc = await buildStatementPdfDoc(event);
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
export async function generateEventPDFBlobUrl(event) {
  const doc = await buildStatementPdfDoc(event);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

