'use client';

import { useState, useEffect } from 'react';
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateAttendanceCSV, downloadCSV, downloadExcel } from '@/lib/csvUtils';
import { toast } from 'sonner';
import { AttendanceRecord } from '@/types';

export default function MarkAttendance() {
  const { master, saveWeek } = useAttendanceData();
  const [weekLabel, setWeekLabel] = useState(`Sabha - ${format(new Date(), 'dd MMM yyyy')}`);
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [search, setSearch] = useState('');
  
  // Local state for edits
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    // Reset to master when loaded
    if (master.length > 0 && records.length === 0) {
      setRecords(master.map(m => ({ ...m, status: 'absent' as const })));
    }
  }, [master]);

  const setStatus = (recordIndex: number, isPresent: boolean) => {
    setRecords(
      records.map((r, idx) =>
        idx === recordIndex
          ? { ...r, status: isPresent ? 'present' : 'absent' }
          : r
      )
    );
  };

  const markAll = (status: 'present' | 'absent') => {
    setRecords(records.map(r => ({ ...r, status })));
  };

  const handleSave = () => {
    if (!weekLabel.trim()) {
      toast.error('Please enter a week label');
      return;
    }
    const success = saveWeek(weekLabel, records);
    if (success) toast.success('Attendance saved for ' + weekLabel);
    else toast.error('Error saving data');
  };

  const handleDownload = () => {
    const csvContent = generateAttendanceCSV(records);
    downloadCSV(
      csvContent,
      `attendance_${weekLabel.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`
    );
    toast.success('Downloaded CSV exported');
  };

  const handleDownloadExcel = () => {
    downloadExcel(
      records,
      `attendance_${weekLabel.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`
    );
    toast.success('Downloaded Excel exported');
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

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Mark Attendance</h1>
        <Input 
          className="w-full sm:max-w-xs font-bold" 
          value={weekLabel} 
          onChange={e => setWeekLabel(e.target.value)} 
          placeholder="Week Label..."
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap flex-1 gap-2 lg:border-r border-gray-200 dark:border-gray-700 lg:pr-4">
          <Button className="flex-1 sm:flex-none" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
          <Button className="flex-1 sm:flex-none" variant={filter === 'present' ? 'default' : 'outline'} onClick={() => setFilter('present')}>Presents</Button>
          <Button className="flex-1 sm:flex-none" variant={filter === 'absent' ? 'default' : 'outline'} onClick={() => setFilter('absent')}>Absents</Button>
        </div>
        <div className="flex flex-1 gap-4 w-full lg:w-auto">
          <Input className="w-full" placeholder="Search name or area..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full lg:w-auto mt-2 lg:mt-0">
          <Button variant="outline" onClick={() => markAll('present')} className="flex-1 lg:flex-none text-green-600">Mark All Present</Button>
          <Button variant="outline" onClick={() => markAll('absent')} className="flex-1 lg:flex-none text-red-600">Mark All Absent</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-x-auto w-full mb-24">
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
            {filteredRecords.map(({ record: r, index }, i) => (
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
          {filteredRecords.map(({ record: r, index }, i) => (
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
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t sm:p-4 p-3 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 z-50">
        <div className="font-semibold text-base sm:text-lg flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start">
          <span className="text-green-600">{presentCount} <span className="hidden sm:inline">Present</span><span className="sm:hidden">P</span></span>
          <span className="text-gray-300">|</span>
          <span className="text-red-600">{absentCount} <span className="hidden sm:inline">Absent</span><span className="sm:hidden">A</span></span>
        </div>
        <div className="flex flex-col sm:flex-row flex-1 sm:flex-none justify-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar shrink-0">
          <Button variant="outline" size="sm" onClick={handleDownload} className="whitespace-nowrap w-full sm:w-auto">CSV</Button>
          <Button variant="outline" size="sm" onClick={handleDownloadExcel} className="whitespace-nowrap w-full sm:w-auto">Excel</Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap w-full sm:w-auto" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
