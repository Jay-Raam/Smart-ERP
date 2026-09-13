import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition, TransitionChild } from '@headlessui/react';
import { X, Download, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { showAppToast } from '../../utils/handleApiError';

export interface ExportColumn<T = any> {
  key: string;
  label: string;
  transform?: (value: any, row: T) => string;
}

export interface ExportModalProps<T = any> {
  show: boolean;
  onClose: () => void;
  title: string;
  filenamePrefix: string;
  columns: ExportColumn<T>[];
  data: T[];
  dateField?: string;
  statusField?: string;
  statusOptions?: { value: string; label: string }[];
  fetchData?: (filters: { fromDate?: string; toDate?: string; status?: string }) => Promise<T[]>;
}

// ── PDF Table Styles ────────────────────────────────────────────────────────
const pdfStyles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  headerBanner: {
    marginBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#2563eb',
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  meta: {
    fontSize: 8.5,
    color: '#64748b',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
  },
  headerCell: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#cbd5e1',
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#1e3a8a',
  },
  cell: {
    flex: 1,
    borderStyle: 'solid',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    padding: 6,
    fontSize: 8,
    color: '#334155',
  },
  stripedRow: {
    backgroundColor: '#f8fafc',
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 4,
  },
});

// ── Generic Vector PDF Document ─────────────────────────────────────────────
interface ExportPdfDocumentProps {
  title: string;
  columns: { key: string; header: string }[];
  rows: Record<string, string>[];
  fromDate?: string;
  toDate?: string;
}

const ExportPdfDocument: React.FC<ExportPdfDocumentProps> = ({
  title,
  columns,
  rows,
  fromDate,
  toDate,
}) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <View style={pdfStyles.headerBanner}>
          <Text style={pdfStyles.title}>{title}</Text>
          <Text style={pdfStyles.meta}>
            Smart ERP • Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            {fromDate || toDate ? ` • Period: ${fromDate || 'Beginning'} to ${toDate || 'Present'}` : ''}
            {` • Total Records: ${rows.length}`}
          </Text>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.row}>
            {columns.map((col, idx) => (
              <Text key={idx} style={pdfStyles.headerCell}>
                {col.header}
              </Text>
            ))}
          </View>
          {rows.map((row, rIdx) => (
            <View
              key={rIdx}
              style={[pdfStyles.row, rIdx % 2 === 1 ? pdfStyles.stripedRow : {}]}
              wrap={false}
            >
              {columns.map((col, cIdx) => (
                <Text key={cIdx} style={pdfStyles.cell}>
                  {row[col.header] ?? '—'}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={pdfStyles.footer} fixed>
          <Text>Smart ERP Confidential • Financial & Operations Export</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};

// ── Helper CSV String Formatter ────────────────────────────────────────────
function generateCsv(
  columns: { key: string; label: string }[],
  rows: Record<string, string>[]
): string {
  const headerLine = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map((r) =>
    columns
      .map((c) => {
        const val = r[c.label] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [headerLine, ...rowLines].join('\r\n');
}

export function ExportModal<T = any>({
  show,
  onClose,
  title,
  filenamePrefix,
  columns,
  data,
  dateField,
  statusField,
  statusOptions,
  fetchData,
}: ExportModalProps<T>) {
  const [exportAs, setExportAs] = useState<'csv' | 'pdf'>('csv');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [checkedCols, setCheckedCols] = useState<Record<string, boolean>>(() =>
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (show) {
      setFromDate('');
      setToDate('');
      setStatusFilter('');
      setExportAs('csv');
      setCheckedCols(columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {}));
    }
  }, [show, columns]);

  const selectedCols = columns.filter((c) => checkedCols[c.key]);
  const allChecked = columns.every((c) => checkedCols[c.key]);
  const someChecked = columns.some((c) => checkedCols[c.key]);

  const toggleAll = (checked: boolean) => {
    setCheckedCols(columns.reduce((acc, col) => ({ ...acc, [col.key]: checked }), {}));
  };

  const transformRow = (row: any, cols: ExportColumn<T>[]) => {
    const out: Record<string, string> = {};
    cols.forEach((col) => {
      let raw = row[col.key];
      if (col.transform) {
        out[col.label] = col.transform(raw, row);
      } else if (raw === null || raw === undefined || raw === '') {
        out[col.label] = '—';
      } else if (typeof raw === 'number') {
        out[col.label] = raw.toLocaleString('en-IN');
      } else {
        out[col.label] = String(raw);
      }
    });
    return out;
  };

  const handleGenerate = async () => {
    if (selectedCols.length === 0) {
      showAppToast('Select at least one column to export', 'warning');
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      showAppToast('From Date cannot be later than To Date', 'warning');
      return;
    }

    setGenerating(true);
    try {
      let exportData: T[] = [];
      if (fetchData) {
        exportData = await fetchData({
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          status: statusFilter || undefined,
        });
      } else {
        // Client-side date and status filtering
        exportData = data.filter((row: any) => {
          if (statusField && statusFilter && statusFilter !== 'All') {
            if (String(row[statusField]).toLowerCase() !== statusFilter.toLowerCase()) {
              return false;
            }
          }

          if (dateField && (fromDate || toDate)) {
            const rawDate = row[dateField] || row.createdAt || row.date;
            if (rawDate) {
              const rowDateStr = String(rawDate).slice(0, 10);
              if (fromDate && rowDateStr < fromDate) return false;
              if (toDate && rowDateStr > toDate) return false;
            }
          }
          return true;
        });
      }

      if (!exportData || exportData.length === 0) {
        showAppToast('No data found for the selected period / filters', 'warning');
        setGenerating(false);
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const transformedRows = exportData.map((row) => transformRow(row, selectedCols));

      if (exportAs === 'csv') {
        const csvContent = generateCsv(
          selectedCols.map((c) => ({ key: c.key, label: c.label })),
          transformedRows
        );
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenamePrefix}-${today}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showAppToast(`Exported ${exportData.length} records to CSV successfully`, 'success');
        onClose();
      } else {
        const pdfBlob = await pdf(
          <ExportPdfDocument
            title={title}
            columns={selectedCols.map((c) => ({ key: c.key, header: c.label }))}
            rows={transformedRows}
            fromDate={fromDate}
            toDate={toDate}
          />
        ).toBlob();

        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenamePrefix}-${today}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showAppToast(`Exported ${exportData.length} records to PDF successfully`, 'success');
        onClose();
      }
    } catch (err: any) {
      showAppToast(err.message || 'Failed to generate export file', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Transition show={show} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                      <Download className="h-5 w-5" />
                    </div>
                    <div>
                      <Dialog.Title className="text-base font-bold text-slate-800">
                        {title}
                      </Dialog.Title>
                      <p className="text-xs text-slate-500">
                        Export formatted dataset as CSV spreadsheet or vector PDF
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="space-y-5 px-6 py-5">
                  {/* Date Range Selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                      Date Range Period
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[11px] text-slate-500 mb-1 font-medium">From Date</span>
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-500 mb-1 font-medium">To Date</span>
                        <input
                          type="date"
                          value={toDate}
                          min={fromDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Leave empty to export all available records.</p>
                  </div>

                  {/* Optional Status Filter */}
                  {statusOptions && statusOptions.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        Status Filter
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">All Statuses</option>
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Export Format Toggle */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                      Export Format
                    </label>
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-full">
                      <button
                        type="button"
                        onClick={() => setExportAs('csv')}
                        className={clsx(
                          'flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all',
                          exportAs === 'csv'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        CSV Spreadsheet
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportAs('pdf')}
                        className={clsx(
                          'flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all',
                          exportAs === 'pdf'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        <FileText className="h-4 w-4" />
                        Vector PDF Document
                      </button>
                    </div>
                  </div>

                  {/* Columns Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Columns to Export
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-blue-600 cursor-pointer font-medium hover:underline">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={(el) => {
                            if (el) el.indeterminate = someChecked && !allChecked;
                          }}
                          onChange={(e) => toggleAll(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        Select All
                      </label>
                    </div>

                    <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        {columns.map((col) => (
                          <label
                            key={col.key}
                            className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                          >
                            <input
                              type="checkbox"
                              checked={!!checkedCols[col.key]}
                              onChange={(e) =>
                                setCheckedCols((prev) => ({
                                  ...prev,
                                  [col.key]: e.target.checked,
                                }))
                              }
                              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="truncate">{col.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
                      <span>
                        <strong className="text-slate-800">{selectedCols.length}</strong> of{' '}
                        {columns.length} columns selected
                      </span>
                    </div>
                  </div>

                  {/* PDF Advisory Note */}
                  {exportAs === 'pdf' && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 border border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        <span className="font-semibold">Note:</span> For an optimal landscape PDF table layout, we recommend selecting <strong>4–6 key columns</strong> to ensure crisp, readable cell margins without truncating headers.
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-3.5 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating || selectedCols.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" />
                    {generating ? 'Generating Export…' : `Export ${exportAs.toUpperCase()}`}
                  </button>
                </div>
              </Dialog.Panel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
