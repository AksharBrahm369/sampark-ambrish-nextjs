'use client';

import { useAttendanceData } from '@/hooks/useAttendanceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateAttendanceCSV, downloadCSV, downloadExcel } from '@/lib/csvUtils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function HistoryPage() {
  const { history, deleteWeek } = useAttendanceData();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">No attendance history yet</h2>
        <p className="text-gray-500 mt-2">Mark attendance and save a week to see it here.</p>
      </div>
    );
  }

  const handleDownload = (weekLabel: string, records: any) => {
    const csvContent = generateAttendanceCSV(records);
    downloadCSV(
      csvContent,
      `attendance_${weekLabel.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`
    );
  };

  const handleDownloadExcel = (weekLabel: string, records: any) => {
    downloadExcel(
      records,
      `attendance_${weekLabel.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`
    );
  };

  const handleDelete = (weekLabel: string) => {
    if (window.confirm('Delete this week\'s record? This cannot be undone.')) {
      deleteWeek(weekLabel);
      toast.success('Record deleted');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance History</h1>
      
      <div className="grid gap-6">
        {history.map((record) => {
          const presentCount = record.records.filter(r => r.status === 'present').length;
          const totalCount = record.records.length;
          const rate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '0';

          return (
            <Card key={record.weekLabel}>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="w-full sm:w-auto">
                  <CardTitle className="text-xl">{record.weekLabel}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Saved on {format(new Date(record.date), 'dd MMM yyyy, h:mm a')}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <div className="flex sm:block justify-between w-full sm:w-auto sm:text-right mr-0 sm:mr-4 border-b sm:border-none pb-2 sm:pb-0">
                    <div className="text-sm font-semibold">{presentCount} Present <span className="mx-1">•</span> {totalCount - presentCount} Absent</div>
                    <div className="text-xs text-gray-500">{rate}%</div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(record.weekLabel, record.records)} className="flex-1 sm:flex-none">
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadExcel(record.weekLabel, record.records)} className="flex-1 sm:flex-none">
                      Excel
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(record.weekLabel)} className="flex-1 sm:flex-none">
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 max-h-48 overflow-auto mt-4">
                  <h4 className="font-semibold mb-2">Absent Ambrish:</h4>
                  <ul className="list-disc pl-5 text-sm text-red-600 dark:text-red-400">
                    {record.records.filter(r => r.status === 'absent').map((r, index) => {
                      const fullName = [r.name, r.middleName, r.lastName].filter(Boolean).join(' ');
                      return (
                        <li key={`${record.weekLabel}-${r.id || r.name || 'record'}-${index}`}>
                          {fullName || '(No Name)'} {r.area ? `(${r.area})` : ''}
                        </li>
                      );
                    })}
                    {record.records.filter(r => r.status === 'absent').length === 0 && (
                      <li className="text-green-600 list-none font-medium">100% Attendance this week!</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
