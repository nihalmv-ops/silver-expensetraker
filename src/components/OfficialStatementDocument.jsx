import React, { useMemo } from 'react';
import { formatINR } from '../utils/currency.js';
import {
  paginateEventStatement,
  formatFullDate,
  getDocumentNo,
} from '../utils/statementPagination.js';

export default function OfficialStatementDocument({ event, layoutMode = 'singlePage' }) {
  const pages = useMemo(() => {
    if (!event) return [];
    return paginateEventStatement(event, { layoutMode });
  }, [event, layoutMode]);

  if (!event || pages.length === 0) return null;

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
  const logoUrl = `${import.meta.env.BASE_URL || './'}silver_logo.png`;

  return (
    <div className="a4-document-wrapper flex flex-col items-start sm:items-center gap-6 sm:gap-8 print:block print:gap-0">
      {pages.map((page, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;

        return (
          <div
            key={page.pageNumber}
            className={`a4-statement-page bg-white text-[#161B18] min-w-[680px] sm:min-w-0 w-full max-w-[210mm] min-h-[297mm] p-[8mm] sm:p-[10mm] shadow-[0_6px_30px_rgba(0,0,0,0.12)] border border-[#D1D5DB] flex flex-col justify-between box-border print:min-w-0 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:min-h-[277mm] ${
              !isLastPage ? 'print-page-break' : ''
            }`}
          >
            <div className="space-y-3 sm:space-y-3.5">
              {!page.isContinuation ? (
                <header className="pb-2.5 border-b border-[#161B18]">
                  <div className="flex items-center justify-between gap-4 pb-2.5 border-b border-[#D1D5DB]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg border border-[#D1D5DB] bg-white p-1 flex items-center justify-center shrink-0">
                        <img
                          src={logoUrl}
                          alt="Silver Catering Logo"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <h1 className="text-lg font-bold tracking-[0.06em] text-[#111827] uppercase leading-tight">
                          SILVER CATERING
                        </h1>
                        <p className="text-[9.5px] font-semibold tracking-[0.16em] text-[#4B5563] uppercase mt-0.5">
                          PREMIUM CATERING SERVICES IN KERALA
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-[#4B5563] leading-relaxed">
                      <div className="font-semibold text-[#111827]">www.silvercatering.in</div>
                      <div>Valanchery, Kerala • +91 98464 15767</div>
                      <div>Silvereventsandcaters@gmail.com</div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <h2 className="text-xs sm:text-sm font-bold tracking-[0.12em] uppercase text-[#111827]">
                      EVENT FINANCIAL STATEMENT
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[10.5px] text-[#374151]">
                      <div>
                        <span className="text-[#6B7280] font-medium">Document No: </span>
                        <span className="font-mono font-bold text-[#111827]">{documentNo}</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] font-medium">Generated Date: </span>
                        <span className="font-semibold text-[#111827]">{generatedDate}</span>
                      </div>
                    </div>
                  </div>
                </header>
              ) : (
                <header className="pb-2 border-b border-[#9CA3AF]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={logoUrl}
                        alt="Silver Catering"
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div>
                        <span className="text-xs font-bold tracking-[0.08em] text-[#111827] uppercase">
                          SILVER CATERING
                        </span>
                        <span className="mx-2 text-[#9CA3AF]">|</span>
                        <span className="text-[11px] font-semibold tracking-[0.08em] text-[#374151] uppercase">
                          EVENT FINANCIAL STATEMENT
                        </span>
                      </div>
                    </div>

                    <span className="text-[9.5px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 border border-[#9CA3AF] text-[#374151] rounded-xs">
                      CONTINUED
                    </span>
                  </div>

                  <div className="mt-1.5 pt-1.5 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] text-[#4B5563]">
                    <div>
                      <span className="text-[#6B7280]">Event: </span>
                      <span className="font-semibold text-[#111827]">{event.name}</span>
                      {event.clientName && (
                        <>
                          <span className="mx-2 text-[#D1D5DB]">•</span>
                          <span className="text-[#6B7280]">Client: </span>
                          <span className="font-medium text-[#111827]">{event.clientName}</span>
                        </>
                      )}
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Event ID: </span>
                      <span className="font-mono font-semibold text-[#111827]">{event.id}</span>
                    </div>
                  </div>
                </header>
              )}

              {page.showEventDetails && (
                <section className="print-avoid-break">
                  <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#111827] mb-1">
                    EVENT DETAILS
                  </div>
                  <div className="border border-[#D1D5DB] bg-[#FAFAFA] px-3.5 py-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2 border-b border-[#E5E7EB] pb-0.5">
                        <span className="text-[#6B7280] font-medium shrink-0">Event Name:</span>
                        <span className="font-bold text-[#111827] text-right truncate">{event.name || '—'}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2 border-b border-[#E5E7EB] pb-0.5">
                        <span className="text-[#6B7280] font-medium shrink-0">Client:</span>
                        <span className="font-semibold text-[#111827] text-right truncate">{event.clientName || '—'}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[#6B7280] font-medium shrink-0">Event Date:</span>
                        <span className="font-medium text-[#111827] text-right">{eventDateFormatted}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2 border-b border-[#E5E7EB] pb-0.5">
                        <span className="text-[#6B7280] font-medium shrink-0">Venue:</span>
                        <span className="font-medium text-[#111827] text-right truncate">{event.venue || '—'}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2 border-b border-[#E5E7EB] pb-0.5">
                        <span className="text-[#6B7280] font-medium shrink-0">Event ID:</span>
                        <span className="font-mono font-semibold text-[#111827] text-right">{event.id || '—'}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[#6B7280] font-medium shrink-0">Coordinator:</span>
                        <span className="font-medium text-[#111827] text-right truncate">
                          {event.coordinator && event.coordinator.trim()
                            ? event.coordinator
                            : '____________________'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {page.sections.map((section, sIdx) => {
                // 1-PAGE A4 MASTER MODEL: SIDE-BY-SIDE DUAL TABLES (Guaranteed 1 A4 Page)
                if (section.type === 'sideBySideTables') {
                  const incomeList = section.incomeEntries || [];
                  const expenseList = section.expenseEntries || [];

                  return (
                    <section key={`sideBySide-${sIdx}`} className="pt-0.5 print-avoid-break">
                      <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3">
                        {/* LEFT: INCOME TABLE */}
                        <div className="border border-[#D1D5DB] bg-white flex flex-col justify-between">
                          <div>
                            <div className="bg-[#1F3D2B] text-white px-2.5 py-1 flex items-center justify-between">
                              <span className="text-[9.5px] font-bold tracking-[0.12em] uppercase">
                                INCOME DETAILS ({incomeList.length})
                              </span>
                              <span className="text-[9px] text-[#A3D9B5] font-mono">Amount (₹)</span>
                            </div>
                            <table className="w-full border-collapse text-[10px]">
                              <thead>
                                <tr className="bg-[#F3F4F6] text-[#374151] border-b border-[#D1D5DB]">
                                  <th className="py-1 px-1 text-center font-bold border-r border-[#E5E7EB] w-[24px]">#</th>
                                  <th className="py-1 px-1.5 text-left font-bold border-r border-[#E5E7EB]">Item</th>
                                  <th className="py-1 px-1 text-center font-bold border-r border-[#E5E7EB] w-[40px]">Qty</th>
                                  <th className="py-1 px-1.5 text-right font-bold w-[65px]">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E5E7EB]">
                                {incomeList.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="py-3 text-center text-gray-400 italic text-[9.5px]">
                                      No income entries recorded
                                    </td>
                                  </tr>
                                ) : (
                                  incomeList.map((row, idx) => (
                                    <tr key={row.id || idx} className="even:bg-[#FAFAFA]">
                                      <td className="py-1 px-1 text-center font-mono text-[9px] text-gray-500 border-r border-[#E5E7EB]">
                                        {row.rowNo || String(idx + 1).padStart(2, '0')}
                                      </td>
                                      <td className="py-1 px-1.5 border-r border-[#E5E7EB]">
                                        <div className="font-semibold text-[#111827] leading-tight text-[10px]">{row.item}</div>
                                        {row.description && (
                                          <div className="text-[8.5px] text-gray-500 truncate max-w-[140px]">{row.description}</div>
                                        )}
                                      </td>
                                      <td className="py-1 px-1 text-center text-gray-600 border-r border-[#E5E7EB] text-[9px]">
                                        {row.quantity ? `${row.quantity} ${row.unit || ''}` : '—'}
                                      </td>
                                      <td className="py-1 px-1.5 text-right font-bold text-[#1F3D2B] whitespace-nowrap text-[10px]">
                                        {formatINR(row.amount)}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>

                          <div className="border-t border-[#1F3D2B] bg-[#EBF5EE] px-2.5 py-1 flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-[#1F3D2B] uppercase tracking-wider">TOTAL INCOME</span>
                            <span className="text-[11px] font-bold text-[#1F3D2B]">{formatINR(totalIncome)}</span>
                          </div>
                        </div>

                        {/* RIGHT: EXPENSE TABLE */}
                        <div className="border border-[#D1D5DB] bg-white flex flex-col justify-between">
                          <div>
                            <div className="bg-[#991B1B] text-white px-2.5 py-1 flex items-center justify-between">
                              <span className="text-[9.5px] font-bold tracking-[0.12em] uppercase">
                                EXPENSE DETAILS ({expenseList.length})
                              </span>
                              <span className="text-[9px] text-red-200 font-mono">Amount (₹)</span>
                            </div>
                            <table className="w-full border-collapse text-[10px]">
                              <thead>
                                <tr className="bg-[#F3F4F6] text-[#374151] border-b border-[#D1D5DB]">
                                  <th className="py-1 px-1 text-center font-bold border-r border-[#E5E7EB] w-[24px]">#</th>
                                  <th className="py-1 px-1.5 text-left font-bold border-r border-[#E5E7EB]">Expense Item</th>
                                  <th className="py-1 px-1 text-center font-bold border-r border-[#E5E7EB] w-[48px]">Category</th>
                                  <th className="py-1 px-1.5 text-right font-bold w-[65px]">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E5E7EB]">
                                {expenseList.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="py-3 text-center text-gray-400 italic text-[9.5px]">
                                      No expense entries recorded
                                    </td>
                                  </tr>
                                ) : (
                                  expenseList.map((row, idx) => (
                                    <tr key={row.id || idx} className="even:bg-[#FAFAFA]">
                                      <td className="py-1 px-1 text-center font-mono text-[9px] text-gray-500 border-r border-[#E5E7EB]">
                                        {row.rowNo || String(idx + 1).padStart(2, '0')}
                                      </td>
                                      <td className="py-1 px-1.5 border-r border-[#E5E7EB]">
                                        <div className="font-semibold text-[#111827] leading-tight text-[10px]">{row.item}</div>
                                        {row.description && (
                                          <div className="text-[8.5px] text-gray-500 truncate max-w-[140px]">{row.description}</div>
                                        )}
                                      </td>
                                      <td className="py-1 px-1 text-center text-gray-600 border-r border-[#E5E7EB] text-[8.5px]">
                                        <span className="px-1 py-0.5 rounded bg-gray-100 text-gray-600 truncate block max-w-[48px]">
                                          {row.category || '—'}
                                        </span>
                                      </td>
                                      <td className="py-1 px-1.5 text-right font-bold text-red-700 whitespace-nowrap text-[10px]">
                                        {formatINR(row.amount)}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>

                          <div className="border-t border-[#991B1B] bg-red-50 px-2.5 py-1 flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-red-800 uppercase tracking-wider">TOTAL EXPENSE</span>
                            <span className="text-[11px] font-bold text-red-700">{formatINR(totalExpense)}</span>
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                }

                if (section.type === 'incomeTable' || section.type === 'expenseTable') {
                  const isIncome = section.type === 'incomeTable';
                  const baseTitle = isIncome ? 'INCOME DETAILS' : 'EXPENSE DETAILS';
                  const sectionTitle = section.isContinued
                    ? `${baseTitle} — CONTINUED`
                    : baseTitle;
                  const itemColumnHeader = isIncome ? 'Income Item' : 'Expense Item';
                  const totalLabel = isIncome ? 'TOTAL INCOME' : 'TOTAL EXPENSE';
                  const totalValue = isIncome ? totalIncome : totalExpense;

                  return (
                    <section key={`${section.type}-${sIdx}`} className="pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#111827]">
                          {sectionTitle}
                        </h3>
                        <span className="text-[10px] text-[#6B7280]">
                          Amount in INR (₹)
                        </span>
                      </div>

                      {section.rows.length > 0 && (
                        <table className="w-full border-collapse border border-[#D1D5DB] text-[11px]">
                          <thead>
                            <tr className="bg-[#F3F4F6] text-[#111827] border-b border-[#9CA3AF]">
                              <th className="py-1.5 px-2 text-center font-bold border-r border-[#D1D5DB] w-[36px]">
                                No.
                              </th>
                              <th className="py-1.5 px-2.5 text-left font-bold border-r border-[#D1D5DB] w-[26%]">
                                {itemColumnHeader}
                              </th>
                              <th className="py-1.5 px-2.5 text-left font-bold border-r border-[#D1D5DB]">
                                Description
                              </th>
                              <th className="py-1.5 px-2 text-center font-bold border-r border-[#D1D5DB] w-[46px]">
                                Qty
                              </th>
                              <th className="py-1.5 px-2 text-center font-bold border-r border-[#D1D5DB] w-[54px]">
                                Unit
                              </th>
                              <th className="py-1.5 px-2.5 text-right font-bold border-r border-[#D1D5DB] w-[78px]">
                                Rate
                              </th>
                              <th className="py-1.5 px-2.5 text-right font-bold w-[92px]">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E7EB]">
                            {section.rows.map((row, rIdx) => (
                              <tr
                                key={row.id || rIdx}
                                className="print-avoid-break bg-white even:bg-[#FAFAFA]"
                              >
                                <td className="py-1.5 px-2 text-center font-mono text-[10.5px] text-[#4B5563] border-r border-[#E5E7EB]">
                                  {row.rowNo}
                                </td>
                                <td
                                  className={`py-1.5 px-2.5 border-r border-[#E5E7EB] ${
                                    row.isEmptyPlaceholder
                                      ? 'italic text-[#6B7280]'
                                      : 'font-semibold text-[#111827]'
                                  }`}
                                >
                                  {row.item}
                                </td>
                                <td className="py-1.5 px-2.5 text-[#4B5563] border-r border-[#E5E7EB]">
                                  {row.description || '—'}
                                </td>
                                <td className="py-1.5 px-2 text-center text-[#374151] border-r border-[#E5E7EB]">
                                  {row.quantity !== '' && row.quantity !== null && row.quantity !== undefined
                                    ? row.quantity
                                    : '—'}
                                </td>
                                <td className="py-1.5 px-2 text-center text-[#4B5563] border-r border-[#E5E7EB]">
                                  {row.unit || '—'}
                                </td>
                                <td className="py-1.5 px-2.5 text-right text-[#374151] border-r border-[#E5E7EB] whitespace-nowrap">
                                  {row.rate !== '' && row.rate !== null && row.rate !== undefined && Number(row.rate) > 0
                                    ? formatINR(row.rate)
                                    : '—'}
                                </td>
                                <td className="py-1.5 px-2.5 text-right font-bold text-[#111827] whitespace-nowrap">
                                  {formatINR(row.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {section.showTotal && (
                        <div className="flex justify-end mt-1.5 print-avoid-break">
                          <div className="border border-[#111827] bg-[#F9FAFB] px-4 py-1.5 min-w-[220px] flex items-center justify-between gap-6">
                            <span className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-[#374151]">
                              {totalLabel}
                            </span>
                            <span className="text-xs font-bold text-[#111827] whitespace-nowrap">
                              {formatINR(totalValue)}
                            </span>
                          </div>
                        </div>
                      )}
                    </section>
                  );
                }

                if (section.type === 'financialSummary') {
                  return (
                    <section key="financialSummary" className="pt-2 print-avoid-break">
                      <div className="border border-[#111827] bg-[#FAFAFA] p-3.5">
                        <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-2 mb-2.5">
                          <h3 className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#111827]">
                            FINANCIAL SUMMARY
                          </h3>
                          <span className="text-[10px] font-bold tracking-[0.12em] uppercase px-2.5 py-0.5 border border-[#111827] bg-white text-[#111827]">
                            {balanceStatusText}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between py-0.5 text-[#374151]">
                            <span className="font-medium">Total Income</span>
                            <span className="font-semibold text-[#111827]">{formatINR(totalIncome)}</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5 text-[#374151]">
                            <span className="font-medium">Total Expense</span>
                            <span className="font-semibold text-[#111827]">{formatINR(totalExpense)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#111827] text-sm font-bold text-[#111827]">
                            <span className="tracking-[0.06em] uppercase">NET BALANCE</span>
                            <span className="text-base">{formattedNetBalance}</span>
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                }

                if (section.type === 'notes') {
                  return (
                    <section key="notes" className="pt-1.5 print-avoid-break">
                      <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#111827] mb-1.5">
                        NOTES
                      </div>
                      {event.notes && event.notes.trim() ? (
                        <div className="text-[11px] text-[#374151] leading-relaxed border-b border-[#D1D5DB] pb-2 whitespace-pre-wrap">
                          {event.notes}
                        </div>
                      ) : (
                        <div className="space-y-4 pt-2">
                          <div className="border-b border-[#9CA3AF] w-full" />
                          <div className="border-b border-[#9CA3AF] w-full" />
                        </div>
                      )}
                    </section>
                  );
                }

                if (section.type === 'signatures') {
                  return (
                    <section key="signatures" className="pt-4 print-avoid-break">
                      <div className="grid grid-cols-4 gap-5 pt-6 text-[11px] text-[#111827]">
                        <div>
                          <div className="text-[#4B5563] font-medium mb-7">Prepared By:</div>
                          <div className="border-b border-[#374151] w-full" />
                        </div>

                        <div>
                          <div className="text-[#4B5563] font-medium mb-7">Checked By:</div>
                          <div className="border-b border-[#374151] w-full" />
                        </div>

                        <div>
                          <div className="text-[#4B5563] font-medium mb-7">Authorized Signature:</div>
                          <div className="border-b border-[#374151] w-full" />
                        </div>

                        <div>
                          <div className="text-[#4B5563] font-medium mb-7">Date:</div>
                          <div className="border-b border-[#374151] w-full" />
                        </div>
                      </div>
                    </section>
                  );
                }

                return null;
              })}
            </div>

            <div className="pt-3 mt-4">
              {page.continuesOnNextPage && (
                <div className="text-right text-[10px] font-bold tracking-[0.12em] uppercase text-[#4B5563] mb-2">
                  CONTINUES ON NEXT PAGE →
                </div>
              )}

              <footer className="pt-2.5 border-t border-[#D1D5DB] flex items-end justify-between gap-4 text-[10px] text-[#4B5563]">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#111827] tracking-[0.06em] uppercase">
                    SILVER CATERING — Premium Catering Services in Kerala
                  </div>
                  <div>
                    www.silvercatering.in &nbsp;|&nbsp; Phone: +91 98464 15767 &nbsp;|&nbsp; Email: Silvereventsandcaters@gmail.com
                  </div>
                </div>

                <div className="font-bold text-[#111827] whitespace-nowrap text-[10.5px]">
                  Page {page.pageNumber} of {page.totalPages}
                </div>
              </footer>
            </div>
          </div>
        );
      })}
    </div>
  );
}