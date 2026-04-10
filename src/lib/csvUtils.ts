import { AttendanceRecord } from '@/types';

export function generateAttendanceCSV(records: AttendanceRecord[]): string {
  // Extract names for present and absent
  const present = records.filter(r => r.status === 'present').map(r => r.name);
  const absent = records.filter(r => r.status === 'absent').map(r => r.name);
  
  const lines: string[] = [];
  
  // Create exact format requested by user
  lines.push('Presents');
  present.forEach(name => lines.push(name));
  
  // One blank line as spacer
  lines.push('');
  
  lines.push('Absent');
  absent.forEach(name => lines.push(name));
  
  return lines.join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
