'use client';

import { useState, useRef } from 'react';
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateAttendanceCSV, downloadCSV, downloadExcel } from '@/lib/csvUtils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { AttendanceRecord } from '@/types';

export default function HistoryPage() {
  const { history, deleteWeek } = useAttendanceData();
  const [openDownload, setOpenDownload] = useState<string | null>(null);
  const downloadRefs = useRef<Record<string, HTMLDivElement | null>>({});

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">No attendance history yet</h2>
        <p className="text-gray-500 mt-2 text-sm">Mark attendance and save a week to see it here.</p>
      </div>
    );
  }

  const handleDownload = (weekLabel: string, records: AttendanceRecord[]) => {
    const csvContent = generateAttendanceCSV(records);
    downloadCSV(csvContent, `attendance_${weekLabel.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
    toast.success('Downloaded as CSV');
  };

  const handleDownloadExcel = (weekLabel: string, records: AttendanceRecord[]) => {
    downloadExcel(records, `attendance_${weekLabel.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`);
    toast.success('Downloaded as Excel');
  };

  const handleDelete = (weekLabel: string) => {
    if (window.confirm("Delete this week's record? This cannot be undone.")) {
      deleteWeek(weekLabel);
      toast.success('Record deleted');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-0 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Attendance History</h1>

      <div className="grid gap-4 sm:gap-6">
        {history.map((record) => {
          const presentCount = record.records.filter(r => r.status === 'present').length;
          const absentCount = record.records.filter(r => r.status === 'absent').length;
          const totalCount = record.records.length;
          const rate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '0';
          const isDropdownOpen = openDownload === record.weekLabel;

          return (
            <Card key={record.weekLabel} className="overflow-hidden">
              {/* Card Header */}
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex flex-col gap-3">
                  {/* Title + Date */}
                  <div>
                    <CardTitle className="text-base sm:text-xl leading-tight">{record.weekLabel}</CardTitle>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      Saved on {format(new Date(record.date), 'dd MMM yyyy, h:mm a')}
                    </p>
                  </div>

                  {/* Stats + Actions Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    {/* Stats pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-green-100/50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-md border border-green-200 dark:border-green-900/50">
                        <span className="text-sm font-bold">✓</span>
                        <span className="text-xs font-bold uppercase tracking-wider">{presentCount} Present</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-red-100/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900/50">
                        <span className="text-sm font-bold">✗</span>
                        <span className="text-xs font-bold uppercase tracking-wider">{absentCount} Absent</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-indigo-100/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-md border border-indigo-200 dark:border-indigo-900/50">
                        <span className="text-xs font-bold uppercase tracking-wider">{rate}%</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {/* Download dropdown */}
                      <div
                        className="relative flex-1 md:flex-none"
                        ref={el => { downloadRefs.current[record.weekLabel] = el; }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center justify-center gap-2 w-full md:w-32 h-9 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-xs font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => setOpenDownload(isDropdownOpen ? null : record.weekLabel)}
                        >
                          Download <ChevronDown className="h-4 w-4" />
                        </Button>
                        {isDropdownOpen && (
                          <div className="absolute right-0 bottom-full md:bottom-auto md:top-full mb-2 md:mb-0 md:mt-1 w-48 rounded-md shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-[100] overflow-hidden border border-gray-200 dark:border-gray-700">
                            <button
                              className="w-full text-left px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2"
                              onClick={() => { handleDownload(record.weekLabel, record.records); setOpenDownload(null); }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Download as CSV
                            </button>
                            <button
                              className="w-full text-left px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition border-t border-gray-100 dark:border-gray-700 flex items-center gap-2"
                              onClick={() => { handleDownloadExcel(record.weekLabel, record.records); setOpenDownload(null); }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Download as Excel
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Delete */}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 md:flex-none md:w-24 h-9 text-xs font-semibold shadow-sm"
                        onClick={() => handleDelete(record.weekLabel)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Absent Table */}
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                  {absentCount === 0 ? (
                    <div className="text-center py-3 text-green-600 font-semibold text-sm bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      🎉 100% Attendance this week!
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Absent Ambrish <span className="text-red-500 normal-case font-bold">({absentCount})</span>
                      </h4>

                      {/* Desktop table */}
                      <div className="hidden sm:block max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm border-collapse">
                          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-10">#</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">Name</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">Mobile</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">Area</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.records.filter(r => r.status === 'absent').map((r, index) => {
                              const fullName = [r.name, r.middleName, r.lastName].filter(Boolean).join(' ');
                              return (
                                <tr
                                  key={`${record.weekLabel}-${r.id || r.name}-${index}`}
                                  className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors"
                                >
                                  <td className="px-3 py-2 text-gray-400 text-xs">{index + 1}</td>
                                  <td className="px-3 py-2 font-medium text-red-600 dark:text-red-400">{fullName || '(No Name)'}</td>
                                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{r.mobile || '—'}</td>
                                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{r.area || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile card list */}
                      <div className="sm:hidden max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        {record.records.filter(r => r.status === 'absent').map((r, index) => {
                          const fullName = [r.name, r.middleName, r.lastName].filter(Boolean).join(' ');
                          return (
                            <div
                              key={`${record.weekLabel}-${r.id || r.name}-${index}-mobile`}
                              className="flex items-start gap-3 px-3 py-2.5 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors"
                            >
                              <span className="text-xs text-gray-400 font-medium mt-0.5 w-5 shrink-0">{index + 1}.</span>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-red-600 dark:text-red-400 leading-tight truncate">{fullName || '(No Name)'}</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                  {r.mobile && <span className="text-xs text-gray-500 dark:text-gray-400">{r.mobile}</span>}
                                  {r.area && <span className="text-xs text-gray-400 dark:text-gray-500">{r.area}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
