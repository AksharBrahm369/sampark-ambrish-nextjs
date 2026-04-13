'use client';

import { useState, useEffect, useRef } from 'react';
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateAttendanceCSV, downloadCSV, downloadExcel } from '@/lib/csvUtils';
import { toast } from 'sonner';
import { AttendanceRecord } from '@/types';
import { ChevronDown } from 'lucide-react';

export default function MarkAttendance() {
  const { master, saveWeek } = useAttendanceData();
  const [weekLabel, setWeekLabel] = useState(`Sabha - ${format(new Date(), 'dd MMM yyyy')}`);
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. If you refresh, your new attendance data will be lost.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setIsDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  // Track if we've initialized from master already
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isClient, setIsClient] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const draft = localStorage.getItem('attendanceDraft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(parsed);
          initializedRef.current = true;
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
  }, []);

  // If no draft was found, initialize from master once it loads
  useEffect(() => {
    if (isClient && !initializedRef.current && master.length > 0 && records.length === 0) {
      initializedRef.current = true;
      setRecords(master.map(m => ({ ...m, status: 'absent' as const })));
    }
  }, [isClient, master, records.length]);

  const setStatus = (recordIndex: number, isPresent: boolean) => {
    const updatedRecords: AttendanceRecord[] = records.map((r, idx) =>
      idx === recordIndex
        ? { ...r, status: isPresent ? 'present' : 'absent' }
        : r
    );
    setRecords(updatedRecords);
    setHasUnsavedChanges(true);
    localStorage.setItem('attendanceDraft', JSON.stringify(updatedRecords));
  };

  const markAll = (status: 'present' | 'absent') => {
    const updatedRecords: AttendanceRecord[] = records.map(r => ({ ...r, status }));
    setRecords(updatedRecords);
    setHasUnsavedChanges(true);
    localStorage.setItem('attendanceDraft', JSON.stringify(updatedRecords));
  };

  const handleSave = () => {
    if (!weekLabel.trim()) {
      toast.error('Please enter a week label');
      return;
    }
    const success = saveWeek(weekLabel, records);
    if (success) {
      toast.success('Attendance saved for ' + weekLabel);
      setHasUnsavedChanges(false);
      localStorage.removeItem('attendanceDraft');
    } else {
      toast.error('Error saving data');
    }
  };

  const getExportRecords = () => {
    if (filter === 'all') return records;
    return records.filter(r => r.status === filter);
  };

  const handleDownload = () => {
    const exportRecords = getExportRecords();
    if (exportRecords.length === 0) {
      toast.error(`No ${filter === 'all' ? '' : filter + ' '}members to download.`);
      return;
    }
    const filterLabel = filter !== 'all' ? `_${filter}` : '';
    const csvContent = generateAttendanceCSV(exportRecords);
    downloadCSV(
      csvContent,
      `attendance${filterLabel}_${weekLabel.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`
    );
    toast.success(`Downloaded ${exportRecords.length} ${filter !== 'all' ? filter : ''} members as CSV.`);
  };

  const handleDownloadExcel = () => {
    const exportRecords = getExportRecords();
    if (exportRecords.length === 0) {
      toast.error(`No ${filter === 'all' ? '' : filter + ' '}members to download.`);
      return;
    }
    const filterLabel = filter !== 'all' ? `_${filter}` : '';
    downloadExcel(
      exportRecords,
      `attendance${filterLabel}_${weekLabel.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`
    );
    toast.success(`Downloaded ${exportRecords.length} ${filter !== 'all' ? filter : ''} members as Excel.`);
  };

  const filteredRecords = records
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => {
      if (filter !== 'all' && record.status !== filter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesName = record.name?.toLowerCase().includes(searchLower) ||
          record.middleName?.toLowerCase().includes(searchLower) ||
          record.lastName?.toLowerCase().includes(searchLower);
        const matchesArea = record.area?.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesArea) return false;
      }
      return true;
    });

  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent').length;

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Mark Attendance</h1>
        <Input
          className="w-full sm:max-w-xs font-bold"
          value={weekLabel}
          onChange={e => setWeekLabel(e.target.value)}
          placeholder="Week Label..."
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap flex-1 gap-2 lg:border-r border-gray-100 dark:border-gray-700 lg:pr-4">
          <Button size="sm" className="flex-1 sm:flex-none h-9" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
          <Button size="sm" className="flex-1 sm:flex-none h-9" variant={filter === 'present' ? 'default' : 'outline'} onClick={() => setFilter('present')}>Presents</Button>
          <Button size="sm" className="flex-1 sm:flex-none h-9" variant={filter === 'absent' ? 'default' : 'outline'} onClick={() => setFilter('absent')}>Absents</Button>
        </div>
        <div className="flex flex-1 gap-4 w-full lg:w-auto">
          <Input className="w-full h-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none focus-visible:ring-indigo-500" placeholder="Search name or area..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full lg:w-auto mt-2 lg:mt-0">
          <Button variant="outline" size="sm" onClick={() => markAll('present')} className="flex-1 lg:flex-none text-green-600 border-green-200 hover:bg-green-50 h-9">Mark All Present</Button>
          <Button variant="outline" size="sm" onClick={() => markAll('absent')} className="flex-1 lg:flex-none text-red-600 border-red-200 hover:bg-red-50 h-9">Mark All Absent</Button>
        </div>
      </div>

      {/* Action Bar (Above Table) */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 sm:p-4 p-3 shadow-md rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 sticky top-0 sm:static z-20">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-900/50">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse hidden sm:block"></span>
            <span className="text-sm font-bold">{isClient ? presentCount : 0} <span className="hidden sm:inline ml-0.5">Present</span><span className="sm:hidden">P</span></span>
          </div>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
          <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/50">
            <span className="w-2 h-2 rounded-full bg-red-500 hidden sm:block"></span>
            <span className="text-sm font-bold">{isClient ? absentCount : 0} <span className="hidden sm:inline ml-0.5">Absent</span><span className="sm:hidden">A</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none" ref={downloadRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              className="w-full sm:w-36 flex items-center justify-center gap-2 h-10 font-semibold bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow-sm"
            >
              Download <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
            {isDownloadOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-full sm:w-48 rounded-xl shadow-2xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
                <button
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                  onClick={() => { handleDownload(); setIsDownloadOpen(false); }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Download as CSV
                </button>
                <button
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-t border-gray-100 dark:border-gray-700 flex items-center gap-2"
                  onClick={() => { handleDownloadExcel(); setIsDownloadOpen(false); }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Download as Excel
                </button>
              </div>
            )}
          </div>
          <Button
            size="sm"
            className="flex-1 sm:w-32 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 shadow-lg shadow-indigo-500/20"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-x-auto w-full">
        {/* Desktop / Tablet Table View */}
        <Table className="w-full min-w-[600px] hidden md:table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center whitespace-nowrap">#</TableHead>
              <TableHead className="min-w-[120px] whitespace-nowrap">Name</TableHead>
              <TableHead className="min-w-[120px] whitespace-nowrap">Middle Name</TableHead>
              <TableHead className="min-w-[120px] whitespace-nowrap">Last Name</TableHead>
              <TableHead className="min-w-[120px] whitespace-nowrap">Mobile</TableHead>
              <TableHead className="min-w-[120px] whitespace-nowrap">Area</TableHead>
              <TableHead className="w-20 text-center whitespace-nowrap">Present</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map(({ record: r, index }, i) => (
              <TableRow key={`${r.id || 'row'}-${index}`} className={r.status === 'present' ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}>
                <TableCell className="text-center">{i + 1}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">{r.name || '(No Name)'}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">{r.middleName || '-'}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">{r.lastName || '-'}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">{r.mobile || '-'}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">{r.area || '-'}</TableCell>
                <TableCell className="text-center">
                  <input
                    type="checkbox"
                    checked={r.status === 'present'}
                    onChange={(e) => setStatus(index, e.target.checked)}
                    className="h-5 w-5 cursor-pointer accent-green-600"
                    aria-label={`Mark ${r.name} present`}
                  />
                </TableCell>
              </TableRow>
            ))}
            {filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">No ambrish found matching criteria.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
          {paginatedRecords.map(({ record: r, index }, i) => (
            <div
              key={`${r.id || 'row'}-${index}-mobile`}
              className={`flex items-center justify-between p-4 ${r.status === 'present' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}
              onClick={() => setStatus(index, r.status !== 'present')}
            >
              <div className="flex flex-col gap-1.5 w-full overflow-hidden mr-4">
                <div className="font-semibold text-base sm:text-lg flex items-center gap-2 truncate">
                  <span className="text-gray-400 text-xs sm:text-sm font-normal">#{i + 1}</span>
                  <span className="truncate">{r.name} {r.middleName} {r.lastName}</span>
                </div>
                {(r.mobile || r.area) && (
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1 items-center">
                    {r.mobile && <span>{r.mobile}</span>}
                    {r.area && <span>{r.area}</span>}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center justify-center pointer-events-none">
                <input
                  type="checkbox"
                  checked={r.status === 'present'}
                  readOnly
                  className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer accent-green-600 rounded-md border-gray-300 dark:border-gray-600"
                  aria-label={`Mark ${r.name} present`}
                />
              </div>
            </div>
          ))}
          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">No ambrish found matching criteria.</div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <div className="text-sm font-medium whitespace-nowrap">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
