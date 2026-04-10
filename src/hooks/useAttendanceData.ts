'use client';

import { useState, useEffect } from 'react';
import { AttendanceRecord, WeekRecord } from '@/types';

export function useAttendanceData() {
  const [master, setMaster] = useState<AttendanceRecord[]>([]);
  const [history, setHistory] = useState<WeekRecord[]>([]);

  const loadData = () => {
    try {
      const savedMaster = localStorage.getItem('ambrish_master');
      const savedHistory = localStorage.getItem('ambrish_history');
      if (savedMaster) setMaster(JSON.parse(savedMaster));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (e) {
      console.error('Local Storage Error', e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('master-updated', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('master-updated', loadData);
    };
  }, []);

  const saveMaster = (newMaster: AttendanceRecord[]) => {
    try {
      localStorage.setItem('ambrish_master', JSON.stringify(newMaster));
      setMaster(newMaster);
      window.dispatchEvent(new Event('master-updated'));
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (err) {
      return false; // likely quota exceeded
    }
  };

  const saveWeek = (weekLabel: string, records: AttendanceRecord[]) => {
    try {
       const newRecord: WeekRecord = { weekLabel, date: new Date().toISOString(), records };
       const newHistory = [newRecord, ...history.filter(h => h.weekLabel !== weekLabel)];
       localStorage.setItem('ambrish_history', JSON.stringify(newHistory));
       setHistory(newHistory);
       window.dispatchEvent(new Event('storage'));
       return true;
    } catch {
       return false;
    }
  };

  const deleteWeek = (weekLabel: string) => {
    const newHistory = history.filter(h => h.weekLabel !== weekLabel);
    localStorage.setItem('ambrish_history', JSON.stringify(newHistory));
    setHistory(newHistory);
    window.dispatchEvent(new Event('storage'));
  };

  return { master, history, saveMaster, saveWeek, deleteWeek };
}
