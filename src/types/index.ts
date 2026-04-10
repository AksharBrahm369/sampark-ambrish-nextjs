export type AttendanceRecord = {
  id: string;
  name: string;
  mobile?: string;
  area?: string;
  [key: string]: string | undefined;
  status: 'present' | 'absent';
};

export type WeekRecord = {
  weekLabel: string;
  date: string; // ISO string
  records: AttendanceRecord[];
};
