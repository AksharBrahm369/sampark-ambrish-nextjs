import { AttendanceRecord } from '@/types';
import * as XLSX from 'xlsx';

export function generateAttendanceCSV(records: AttendanceRecord[]): string {
  if (records.length === 0) {
    return 'id(#),Name,Middle Name,Last Name,Mobile,Area,Present';
  }

  const headers = ['id(#)', 'Name', 'Middle Name', 'Last Name', 'Mobile', 'Area', 'Present'];

  const lines: string[] = [];
  lines.push(headers.map(escapeCsvValue).join(','));

  records.forEach((record, index) => {
    const row = [
      escapeCsvValue(record.id ?? String(index + 1)),
      escapeCsvValue(record.name ?? ''),
      escapeCsvValue(record.middleName ?? ''),
      escapeCsvValue(record.lastName ?? ''),
      escapeCsvValue(record.mobile ?? ''),
      escapeCsvValue(record.area ?? ''),
      escapeCsvValue(record.status === 'present' ? 'Yes' : 'No')
    ];
    lines.push(row.join(','));
  });

  return lines.join('\n');
}

export function downloadExcel(records: AttendanceRecord[], filename: string): void {
  const data = records.map((record, index) => ({
    'id(#)': record.id ?? String(index + 1),
    'Name': record.name ?? '',
    'Middle Name': record.middleName ?? '',
    'Last Name': record.lastName ?? '',
    'Mobile': record.mobile ?? '',
    'Area': record.area ?? '',
    'Present': record.status === 'present' ? 'Yes' : 'No'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  XLSX.writeFile(workbook, filename);
}

function escapeCsvValue(value: string): string {
  const stringValue = String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function downloadCSV(content: string, filename: string): void {
  const normalizedContent = `\ufeff${content.replace(/\n/g, '\r\n')}`;
  const blob = new Blob([normalizedContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
