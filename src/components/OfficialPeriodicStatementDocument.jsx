import React, { useMemo } from 'react';
import { formatINR } from '../utils/currency.js';
import { paginatePeriodicStatement } from '../utils/periodicStatementPagination.js';

export default function OfficialPeriodicStatementDocument({ statementData }) {
  const pages = useMemo(() => {
    if (!statementData) return [];
    return paginatePeriodicStatement(statementData);
  }, [statementData]);

  if (!statementData || pages.length === 0) return null;

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

  const logoUrl = `${import.meta.env.BASE_URL || './'}silver_logo.png`;

  return (
    <div className="a4-document-wrapper flex flex-col items-start sm:items-center gap-6 sm:gap-8 print:block print:gap-0">
      {pages.map((page, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;

        return (
          <div
            key={page.pageNumber}
            className={`a4-statement-page bg-white text-[#161B18] min-w-[680px] sm:min-w-0 w-full max-w-[210mm] min-h-[297mm] p-[10mm] sm:p-[12mm] shadow-[0_6px_30px_rgba(0,0,0,0.12)] border border-[#D1D5DB] flex flex-col justify-between box-border print:min-w-0 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:min-h-[273mm] ${
              !isLastPage ? 'print-page-break' : ''
            }`}
          >
            <div className="space-y-4">
              {!page.isContinuation ? (
                <header className="pb-3 border-b border-[#161B18]">
                  <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#D1D5DB]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-lg border border-[#D1D5DB] bg-white p-1 flex items-center justify-center shrink-0">
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
                        <h1 className="text-xl font-bold tracking-[0.06em] text-[#111827] uppercase leading-tight">
                          SILVER CATERING
                        </h1>
                        <p className="text-[10px] font-semibold tracking-[0.18em] text-[#4B5563] uppercase mt-0.5">
                          PREMIUM CATERING SERVICES IN KERALA
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10.5px] text-[#4B5563] leading-relaxed">
                      <div className="font-semibold text-[#111827]">www.silvercatering.in</div>
                      <div>Valanchery, Kerala • +91 98464 15767</div>
                      <div>Silvereventsandcaters@gmail.com</div>
                    </div>
                  </div>

                  <div className="pt-2.5 flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-bold tracking-[0.12em] uppercase text-[#111827]">
                        {periodTitle}
                      </h2>
                      <p className="text-[11px] font-semibold text-[#9D8050] tracking-wider uppercase mt-0.5">
                        Statement Period: {periodSubtitle}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-[#374151] text-right">
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
                <header className="pb-2.5 border-b border-[#9CA3AF]">
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
                          {periodSubtitle} FINANCIAL STATEMENT
                        </span>
                      </div>
                    </div>

                    <span className="text-[9.5px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 border border-[#9CA3AF] text-[#374151] rounded-xs">
                      CONTINUED
                    </span>
                  </div>

                  <div className="mt-1.5 pt-1.5 border-t border-[#E5E7EB] flex items-center justify-between text-[10.5px] text-[#4B5563]">
                    <div>
                      <span className="text-[#6B7280]">Document: </span>
                      <span className="font-mono font-semibold text-[#111827]">{documentNo}</span>
                      <span className="mx-2 text-[#D1D5DB]">•</span>
                      <span className="text-[#6B7280]">Events Count: </span>
                      <span className="font-semibold text-[#111827]">{eventsCount}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Generated: </span>
                      <span className="font-semibold text-[#111827]">{generatedDate}</span>
                    </div>
                  </div>
                </header>
              )}

              {/* Page 1 Executive Summary Cards */}
              {page.showExecutiveSummary && (
                <section className="print-avoid-break">
                  <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#111827] mb-1.5">
                    EXECUTIVE PERIOD SUMMARY
                  </div>
                  <div className="border border-[#D1D5DB] bg-[#FAFAFA] p-3 grid grid-cols-4 gap-3 text-center">
                    <div className="border-r border-[#E5E7EB] pr-2">
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Events Held</div>
                      <div className="text-base font-bold text-[#111827] mt-0.5">{eventsCount}</div>
                    </div>
                    <div className="border-r border-[#E5E7EB] pr-2">
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Total Revenue</div>
                      <div className="text-sm font-bold text-[#1F3D2B] mt-0.5">{formatINR(totalIncome)}</div>
                    </div>
                    <div className="border-r border-[#E5E7EB] pr-2">
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Total Expense</div>
                      <div className="text-sm font-bold text-red-700 mt-0.5">{formatINR(totalExpense)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#6B7280]">Net Profit / Balance</div>
                      <div className={`text-sm font-bold mt-0.5 ${netBalance >= 0 ? 'text-[#1F3D2B]' : 'text-red-700'}`}>
                        {formattedNetBalance}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Sections for this Page */}
              {page.sections.map((section, sIdx) => {
                if (section.type === 'emptyEvents') {
                  return (
                    <div key={sIdx} className="p-4 border border-[#D1D5DB] bg-[#FAF9F6] text-center text-xs text-[#6B7280]">
                      {section.message}
                    </div>
                  );
                }

                if (section.type === 'eventsTable') {
                  return (
                    <section key={sIdx} className="pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#111827]">
                          {section.isContinued ? 'EVENTS FINANCIAL BREAKDOWN — CONTINUED' : 'EVENTS FINANCIAL BREAKDOWN'}
                        </h3>
                        <span className="text-[10px] text-[#6B7280]">Amount in INR (₹)</span>
                      </div>

                      <table className="w-full border-collapse border border-[#D1D5DB] text-[10.5px]">
                        <thead>
                          <tr className="bg-[#F3F4F6] text-[#111827] border-b border-[#9CA3AF]">
                            <th className="py-1.5 px-2 text-center font-bold border-r border-[#D1D5DB] w-[34px]">No.</th>
                            <th className="py-1.5 px-2 text-left font-bold border-r border-[#D1D5DB]">Event & ID</th>
                            <th className="py-1.5 px-2 text-left font-bold border-r border-[#D1D5DB]">Client / Host</th>
                            <th className="py-1.5 px-2 text-center font-bold border-r border-[#D1D5DB] w-[75px]">Date</th>
                            <th className="py-1.5 px-2 text-left font-bold border-r border-[#D1D5DB]">Venue</th>
                            <th className="py-1.5 px-2 text-right font-bold border-r border-[#D1D5DB] w-[80px]">Income</th>
                            <th className="py-1.5 px-2 text-right font-bold border-r border-[#D1D5DB] w-[80px]">Expense</th>
                            <th className="py-1.5 px-2 text-right font-bold w-[85px]">Net Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                          {section.rows.map((row, rIdx) => (
                            <tr key={row.id || rIdx} className="print-avoid-break bg-white even:bg-[#FAFAFA]">
                              <td className="py-1.5 px-2 text-center font-mono text-[10px] text-[#4B5563] border-r border-[#E5E7EB]">
                                {row.rowNo}
                              </td>
                              <td className="py-1.5 px-2 border-r border-[#E5E7EB]">
                                <div className="font-semibold text-[#111827]">{row.name}</div>
                                <div className="text-[9.5px] font-mono text-[#6B7280]">{row.id}</div>
                              </td>
                              <td className="py-1.5 px-2 text-[#4B5563] border-r border-[#E5E7EB]">
                                {row.clientName}
                              </td>
                              <td className="py-1.5 px-2 text-center text-[#4B5563] border-r border-[#E5E7EB] whitespace-nowrap">
                                {row.date}
                              </td>
                              <td className="py-1.5 px-2 text-[#4B5563] border-r border-[#E5E7EB]">
                                {row.venue}
                              </td>
                              <td className="py-1.5 px-2 text-right font-medium text-[#1F3D2B] border-r border-[#E5E7EB] whitespace-nowrap">
                                {formatINR(row.income)}
                              </td>
                              <td className="py-1.5 px-2 text-right font-medium text-red-700 border-r border-[#E5E7EB] whitespace-nowrap">
                                {formatINR(row.expense)}
                              </td>
                              <td className={`py-1.5 px-2 text-right font-bold whitespace-nowrap ${row.netBalance >= 0 ? 'text-[#111827]' : 'text-red-700'}`}>
                                {row.netBalance < 0 ? `-${formatINR(Math.abs(row.netBalance))}` : formatINR(row.netBalance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {section.showTotal && (
                        <div className="flex justify-end mt-1.5 print-avoid-break">
                          <div className="border border-[#111827] bg-[#F9FAFB] px-4 py-1.5 min-w-[280px] flex items-center justify-between gap-6 text-xs">
                            <span className="font-bold uppercase tracking-wider text-[#374151]">Total ({eventsCount} Events):</span>
                            <span className="font-bold text-[#111827]">
                              In: {formatINR(totalIncome)} | Out: {formatINR(totalExpense)}
                            </span>
                          </div>
                        </div>
                      )}
                    </section>
                  );
                }

                if (section.type === 'monthlyBreakdownTable') {
                  return (
                    <section key={sIdx} className="pt-2 print-avoid-break">
                      <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#111827] mb-1.5">
                        MONTH-BY-MONTH ANNUAL SUMMARY
                      </div>
                      <table className="w-full border-collapse border border-[#D1D5DB] text-[10.5px]">
                        <thead>
                          <tr className="bg-[#F3F4F6] text-[#111827] border-b border-[#9CA3AF]">
                            <th className="py-1.5 px-2 text-left font-bold border-r border-[#D1D5DB]">Month</th>
                            <th className="py-1.5 px-2 text-center font-bold border-r border-[#D1D5DB] w-[60px]">Events</th>
                            <th className="py-1.5 px-2 text-right font-bold border-r border-[#D1D5DB] w-[90px]">Gross Inflow</th>
                            <th className="py-1.5 px-2 text-right font-bold border-r border-[#D1D5DB] w-[90px]">Total Outflow</th>
                            <th className="py-1.5 px-2 text-right font-bold w-[95px]">Net Margin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                          {section.rows.map((m) => (
                            <tr key={m.monthNo} className="bg-white even:bg-[#FAFAFA]">
                              <td className="py-1 px-2 font-medium text-[#111827] border-r border-[#E5E7EB]">
                                {m.monthName}
                              </td>
                              <td className="py-1 px-2 text-center text-[#4B5563] border-r border-[#E5E7EB]">
                                {m.eventsCount}
                              </td>
                              <td className="py-1 px-2 text-right text-[#1F3D2B] font-medium border-r border-[#E5E7EB]">
                                {formatINR(m.income)}
                              </td>
                              <td className="py-1 px-2 text-right text-red-700 font-medium border-r border-[#E5E7EB]">
                                {formatINR(m.expense)}
                              </td>
                              <td className={`py-1 px-2 text-right font-bold ${m.netBalance >= 0 ? 'text-[#111827]' : 'text-red-700'}`}>
                                {m.netBalance < 0 ? `-${formatINR(Math.abs(m.netBalance))}` : formatINR(m.netBalance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  );
                }

                if (section.type === 'categoriesBreakdown') {
                  return (
                    <section key={sIdx} className="pt-2 print-avoid-break">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Income Categories */}
                        <div>
                          <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#1F3D2B] mb-1">
                            INCOME BY CATEGORY
                          </div>
                          <div className="border border-[#D1D5DB] bg-white divide-y divide-[#E5E7EB] text-[10px]">
                            {section.incomeCategories.slice(0, 6).map((c, idx) => (
                              <div key={idx} className="p-1.5 flex items-center justify-between">
                                <span className="font-medium text-[#111827] truncate">{c.category}</span>
                                <div className="text-right shrink-0">
                                  <span className="font-bold text-[#1F3D2B]">{formatINR(c.amount)}</span>
                                  <span className="text-gray-400 text-[9px] ml-1">({c.percentage}%)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Expense Categories */}
                        <div>
                          <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-red-700 mb-1">
                            EXPENSES BY CATEGORY
                          </div>
                          <div className="border border-[#D1D5DB] bg-white divide-y divide-[#E5E7EB] text-[10px]">
                            {section.expenseCategories.slice(0, 6).map((c, idx) => (
                              <div key={idx} className="p-1.5 flex items-center justify-between">
                                <span className="font-medium text-[#111827] truncate">{c.category}</span>
                                <div className="text-right shrink-0">
                                  <span className="font-bold text-red-700">{formatINR(c.amount)}</span>
                                  <span className="text-gray-400 text-[9px] ml-1">({c.percentage}%)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                }

                if (section.type === 'financialSummary') {
                  return (
                    <section key="financialSummary" className="pt-2 print-avoid-break">
                      <div className="border border-[#111827] bg-[#FAFAFA] p-3.5">
                        <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-2 mb-2.5">
                          <h3 className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#111827]">
                            PERIOD FINANCIAL SUMMARY
                          </h3>
                          <span className="text-[10px] font-bold tracking-[0.12em] uppercase px-2.5 py-0.5 border border-[#111827] bg-white text-[#111827]">
                            {balanceStatusText}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between py-0.5 text-[#374151]">
                            <span className="font-medium">Total Events Revenue</span>
                            <span className="font-semibold text-[#111827]">{formatINR(totalIncome)}</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5 text-[#374151]">
                            <span className="font-medium">Total Operating Expenses</span>
                            <span className="font-semibold text-[#111827]">{formatINR(totalExpense)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#111827] text-sm font-bold text-[#111827]">
                            <span className="tracking-[0.06em] uppercase">NET BALANCE / PROFIT</span>
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
                        AUDIT NOTES & REMARKS
                      </div>
                      {notes && notes.trim() ? (
                        <div className="text-[11px] text-[#374151] leading-relaxed border-b border-[#D1D5DB] pb-2 whitespace-pre-wrap">
                          {notes}
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
                    <section key="signatures" className="pt-3 print-avoid-break">
                      <div className="grid grid-cols-4 gap-5 pt-5 text-[11px] text-[#111827]">
                        <div>
                          <div className="text-[#4B5563] font-medium mb-6">
                            Prepared By: {preparedBy ? <span className="text-[#111827] font-semibold">{preparedBy}</span> : ''}
                          </div>
                          <div className="border-b border-[#374151] w-full" />
                        </div>

                        <div>
                          <div className="text-[#4B5563] font-medium mb-6">Checked By:</div>
                          <div className="border-b border-[#374151] w-full" />
                        </div>

                        <div>
                          <div className="text-[#4B5563] font-medium mb-6">Authorized Signature:</div>
                          <div className="border-b border-[#374151] w-full" />
                        </div>

                        <div>
                          <div className="text-[#4B5563] font-medium mb-6">Date:</div>
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