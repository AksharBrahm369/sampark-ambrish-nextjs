'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner'; 

export default function Dashboard() {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const { master, history, saveMaster, clearMaster } = useAttendanceData();

  const handleClearMaster = () => {
    const success = clearMaster();
    if (success) {
      toast.success('Master data removed successfully');
      setShowClearDialog(false);
    } else {
      toast.error('Failed to remove master data');
    }
  };

  const mostRecentWeek = history[0];
  const presentThisWeek = mostRecentWeek
    ? mostRecentWeek.records.filter((r) => r.status === 'present').length
    : 0;
  const absentThisWeek = mostRecentWeek
    ? mostRecentWeek.records.filter((r) => r.status === 'absent').length
    : 0;
  const totalAmbrish = master.length;
  const attendanceRate = totalAmbrish
    ? ((presentThisWeek / totalAmbrish) * 100).toFixed(1)
    : '0.0';

  const normalizeMasterRows = (data: Record<string, string>[]) => {
    // Helper to clean column key names
    const cleanKey = (key: string): string => {
      return key
        .toLowerCase()
        .trim()
        .replace(/[\s_-]+/g, ''); // Remove spaces, underscores, hyphens
    };

    // Helper to detect if a value looks like a phone number
    const isPhoneNumber = (value: string): boolean => {
      return /^\d{7,}$/.test(value.replace(/\D/g, ''));
    };

    // Helper to detect if a value looks like a number/ID
    const isNumericId = (value: string): boolean => {
      return /^\d+$/.test(value.trim());
    };

    // Helper to detect if a value looks like a location/area
    const isAreaName = (value: string): boolean => {
      // If it contains spaces and common area keywords, likely an area
      return (
        value.length > 3 &&
        (value.includes('Nagar') ||
          value.includes('Wadi') ||
          value.includes('Village') ||
          value.includes('Road') ||
          value.includes('Area') ||
          value.includes('nagar') ||
          value.includes('wadi') ||
          value.includes('village') ||
          /\s/.test(value)) // Has spaces
      );
    };

    // Log first row to debug column structure
    if (data.length > 0) {
      console.log('📋 Excel/CSV Columns:', Object.keys(data[0]));
      console.log('📊 First Row Raw Data:', data[0]);
    }

    return data.map((row, rowIndex) => {
      const entries = Object.entries(row);
      const cleaned: {
        id: string;
        name: string;
        middleName: string;
        lastName: string;
        mobile: string;
        area: string;
      } = {
        id: '',
        name: '',
        middleName: '',
        lastName: '',
        mobile: '',
        area: '',
      };

      // Debug: Log all values from this row
      if (rowIndex === 0) {
        console.log('🔍 Row 1 Detailed Values:');
        entries.forEach(([k, v]) => {
          console.log(`  ${k}: "${v}"`);
        });
      }

      // First pass: Try to match columns by header name
      entries.forEach(([key, value]) => {
        const keyLower = cleanKey(key);
        const valueTrimmed = String(value ?? '').trim();

        if (!valueTrimmed) return; // Skip empty values

        if (
          keyLower === 'id' ||
          keyLower === 'srno' ||
          keyLower === 'serialno'
        ) {
          if (!cleaned.id) cleaned.id = valueTrimmed;
        } else if (
          keyLower.includes('middle')
        ) {
          if (!cleaned.middleName) cleaned.middleName = valueTrimmed;
        } else if (
          keyLower.includes('last') ||
          keyLower.includes('surname')
        ) {
          if (!cleaned.lastName) cleaned.lastName = valueTrimmed;
        } else if (
          keyLower.includes('name') ||
          keyLower.includes('first') ||
          keyLower.includes('ambrish') ||
          keyLower.includes('member')
        ) {
          if (!cleaned.name) cleaned.name = valueTrimmed;
        } else if (
          keyLower.includes('mobile') ||
          keyLower.includes('phone') ||
          keyLower.includes('contact')
        ) {
          if (!cleaned.mobile) cleaned.mobile = valueTrimmed;
        } else if (
          keyLower.includes('area') ||
          keyLower.includes('location') ||
          keyLower.includes('region') ||
          keyLower.includes('address')
        ) {
          if (!cleaned.area) cleaned.area = valueTrimmed;
        }
      });

      // Second pass: Intelligent detection if fields are still empty
      if (!cleaned.name || !cleaned.mobile || !cleaned.area) {
        entries.forEach(([colName, value]) => {
          const valueTrimmed = String(value ?? '').trim();
          if (!valueTrimmed) return;

          if (!cleaned.mobile && isPhoneNumber(valueTrimmed)) {
            cleaned.mobile = valueTrimmed;
          } else if (!cleaned.id && isNumericId(valueTrimmed) && valueTrimmed.length <= 4) {
            cleaned.id = valueTrimmed;
          } else if (!cleaned.area && isAreaName(valueTrimmed)) {
            cleaned.area = valueTrimmed;
          }
        });
      }

      // Third pass: If name is still empty, use any unmapped text column
      if (!cleaned.name || !cleaned.middleName || !cleaned.lastName) {
        entries.forEach(([colName, value]) => {
          const valueTrimmed = String(value ?? '').trim();
          const keyLower = cleanKey(colName);
          
          // Skip columns we already explicitly matched to mobile/area/id
          if (
            keyLower.includes('mobile') ||
            keyLower.includes('phone') ||
            keyLower.includes('contact') ||
            keyLower.includes('area') ||
            keyLower.includes('location') ||
            keyLower.includes('region') ||
            keyLower.includes('address') ||
            keyLower === 'id' ||
            keyLower === 'srno' ||
            keyLower === 'no' ||
            keyLower === 'serialno'
          ) {
            return;
          }

          // If it's an unrecognized text column, use it!
          if (valueTrimmed && !isPhoneNumber(valueTrimmed) && !isNumericId(valueTrimmed)) {
            // Assign to first empty name slot in order: (Name, Middle, Last)
            // But skip if it's already the explicitly matched one
            if (!cleaned.name && keyLower !== 'middlename' && keyLower !== 'lastname') {
              cleaned.name = valueTrimmed;
            } else if (!cleaned.middleName && valueTrimmed !== cleaned.name && valueTrimmed !== cleaned.lastName) {
              cleaned.middleName = valueTrimmed;
            } else if (!cleaned.lastName && valueTrimmed !== cleaned.name && valueTrimmed !== cleaned.middleName) {
              cleaned.lastName = valueTrimmed;
            }
          }
        });
      }

      // Auto-split full names into First/Middle/Last if Name is long and Middle/Last are empty
      if (cleaned.name && !cleaned.middleName && !cleaned.lastName && cleaned.name.includes(' ')) {
        const parts = cleaned.name.split(/\s+/).filter(Boolean);
        if (parts.length === 2) {
          cleaned.name = parts[0];
          cleaned.lastName = parts[1];
        } else if (parts.length >= 3) {
          cleaned.name = parts[0];
          cleaned.lastName = parts[parts.length - 1];
          cleaned.middleName = parts.slice(1, parts.length - 1).join(' ');
        }
      }

      if (rowIndex === 0) {
        console.log(`✅ Row 1 Parsed Result:`, cleaned);
      }

      return {
        id: cleaned.id || '',
        name: cleaned.name || '',
        middleName: cleaned.middleName || '',
        lastName: cleaned.lastName || '',
        mobile: cleaned.mobile || '',
        area: cleaned.area || '',
        status: 'present' as const,
      };
    });
  };

  const onMasterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith('.csv');
    const isXlsx = fileName.endsWith('.xlsx');

    if (!isCsv && !isXlsx) {
      toast.error('Please upload a valid .xlsx or .csv file');
      e.target.value = '';
      return;
    }

    let data: Record<string, string>[] = [];

    if (isCsv) {
      const text = await file.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      }) as Papa.ParseResult<Record<string, string>>;

      if (parsed.errors.length > 0) {
        toast.error('Failed to parse CSV file');
        e.target.value = '';
        return;
      }

      data = parsed.data;
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        toast.error('Uploaded file is empty or invalid');
        e.target.value = '';
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
        defval: '',
        raw: false,
      });
    }

    if (!data.length) {
      toast.error('Uploaded file is empty or invalid');
      e.target.value = '';
      return;
    }

    const normalized = normalizeMasterRows(data);
    const success = saveMaster(normalized as any);
    if (success) {
      toast.success(`Ambrish master loaded - ${normalized.length} records`);
    } else {
      toast.error('Storage full. Please delete old history records.');
    }

    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 w-full">
        <Card>
          <CardHeader className="p-4 sm:py-6 text-center sm:text-left">
            <CardTitle className="text-sm sm:text-base text-gray-500">Total Ambrish</CardTitle>
            <div className="text-3xl font-bold">{totalAmbrish}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 sm:py-6 text-center sm:text-left">
            <CardTitle className="text-sm sm:text-base text-gray-500">Present (Latest)</CardTitle>
            <div className="text-3xl font-bold text-green-600">{presentThisWeek}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 sm:py-6 text-center sm:text-left">
            <CardTitle className="text-sm sm:text-base text-gray-500">Absent (Latest)</CardTitle>
            <div className="text-3xl font-bold text-red-600">{absentThisWeek}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 sm:py-6 text-center sm:text-left">
            <CardTitle className="text-sm sm:text-base text-gray-500">Attendance %</CardTitle>
            <div className="text-3xl font-bold">{attendanceRate}%</div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 w-full">
        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Upload Ambrish XLSX / CSV</CardTitle>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Status: {master.length ? `${master.length} loaded` : 'Not loaded'}
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
            <Input type="file" accept=".xlsx,.csv" onChange={onMasterUpload} />
            {master.length > 0 && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowClearDialog(true)}
              >
                Remove Data
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Master Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all {master.length} Ambrish records? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearMaster}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
