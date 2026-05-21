import { useState, useEffect, useRef } from 'react';
import { format, getDay, differenceInDays, parse, isSameMonth } from 'date-fns';
import { arSA } from 'date-fns/locale/ar-SA';
import { Employee, getEmployees, getAttendance, saveAttendance, getSettings, AppSettings, AttendanceRecord } from '../store';
import { calculateHours, generateId } from '../utils';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function ReportsView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<string>('');
  
  const now = new Date();
  const firstDay = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
  const lastDay = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
  
  const [startDateStr, setStartDateStr] = useState<string>(firstDay);
  const [endDateStr, setEndDateStr] = useState<string>(lastDay);
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // New entry form state
  const [newEntryDate, setNewEntryDate] = useState<string>('');
  const [newEntryIn, setNewEntryIn] = useState<string>('');
  const [newEntryOut, setNewEntryOut] = useState<string>('');
  const [newEntryType, setNewEntryType] = useState<string>('');
  const [newEntryNotes, setNewEntryNotes] = useState<string>('');

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEmployees(getEmployees());
    setSettings(getSettings());
    setAttendance(getAttendance());
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const updateRecord = (recordId: string, dateStr: string, field: keyof AttendanceRecord, value: any) => {
    const currentEmp = employees.find(e => e.id === selectedEmp);
    if (!currentEmp) return;

    let current = [...attendance];
    let existingIdx = current.findIndex(a => a.id === recordId);
    
    if (existingIdx >= 0) {
      if (value === '' && (field === 'manualLate' || field === 'manualEarly' || field === 'manualDed' || field === 'manualOT')) {
        // Allow clearing overrides by deleting the key
        const updatedRec = { ...current[existingIdx] };
        delete updatedRec[field];
        current[existingIdx] = updatedRec;
      } else {
        current[existingIdx] = { ...current[existingIdx], [field]: value };
      }
    } else {
      current.push({
        id: recordId,
        employeeId: currentEmp.id,
        date: dateStr,
        timeIn: field === 'timeIn' ? value : '',
        timeOut: field === 'timeOut' ? value : '',
        notes: field === 'notes' ? value : '',
        isAbsent: false,
        [field]: value
      });
    }
    setAttendance(current);
    saveAttendance(current);
  };

  const parseMins = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
    }
    return 0;
  };

  const handleAddNewEntry = () => {
    if (!selectedEmp || !newEntryDate) return;
    const currentEmp = employees.find(e => e.id === selectedEmp);
    if (!currentEmp) return;

    let current = [...attendance];
    current.push({
      id: generateId(),
      employeeId: currentEmp.id,
      date: newEntryDate,
      timeIn: newEntryIn,
      timeOut: newEntryOut,
      notes: newEntryNotes,
      recordType: newEntryType,
      isAbsent: false
    });
    setAttendance(current);
    saveAttendance(current);
    setNewEntryIn('');
    setNewEntryOut('');
    setNewEntryType('');
    setNewEntryNotes('');
  };

  if (!settings) return null;

  const currentEmp = employees.find(e => e.id === selectedEmp);

  // Formatter for minutes to HH:mm
  const formatMins = (mins: number) => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const generateReportData = () => {
    if (!currentEmp || !startDateStr || !endDateStr || !settings) return [];

    let startD = parse(startDateStr, 'yyyy-MM-dd', new Date());
    let endD = parse(endDateStr, 'yyyy-MM-dd', new Date());
    
    if (isNaN(startD.getTime()) || isNaN(endD.getTime()) || startD > endD) {
      return [];
    }

    const daysCount = differenceInDays(endD, startD) + 1;
    const report: any[] = [];
    const ruleOccurrences: Record<string, number> = {};

    const empShiftStart = currentEmp.shiftStart || settings.defaultShiftStart;
    const empShiftEnd = currentEmp.shiftEnd || settings.defaultShiftEnd;

    let rowIndex = 1;

    for (let i = 0; i < daysCount; i++) {
      const currentDate = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i);
      const dayOfWeek = getDay(currentDate);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      const isWeekend = settings.weekendDays.includes(dayOfWeek);
      const dailyRecords = attendance.filter(a => a.employeeId === currentEmp.id && a.date === dateStr);

      const addRow = (record: AttendanceRecord | null, recIndex: number) => {
        const id = record ? record.id : `temp-${dateStr}-${recIndex}`;
        let row = {
          id,
          no: rowIndex++,
          acNo: currentEmp.empId,
          name: currentEmp.name,
          date: dateStr,
          dayName: format(currentDate, 'EEEE', { locale: arSA }),
          rawTimeIn: record?.timeIn || '',
          rawTimeOut: record?.timeOut || '',
          rawNotes: record?.notes || '',
          recordType: record?.recordType || '',
          total: isWeekend && !record ? '' : '0:00',
          lateStr: '',
          earlyStr: '',
          dedStr: '',
          otStr: '',
          lateMins: 0,
          earlyMins: 0,
          dedMins: 0,
          otMins: 0,
          status: record?.recordType ? record.recordType : (record ? 'حضور' : (isWeekend && !record ? 'عطلة' : 'غياب')),
          rowClass: isWeekend && !record ? 'bg-gray-100 print:bg-gray-100' : '',
          penaltyText: '',
          penaltyValue: 0,
          penaltyType: 'warning',
          matchedRuleName: '',
          occurrenceIndex: 0
        };

        if (record && !record.isAbsent) {
          row.rowClass = '';

          if (record.timeIn && record.timeOut) {
            row.total = calculateHours(record.timeIn, record.timeOut).formatted;
          }

          if (record.timeIn && empShiftStart && record.timeIn > empShiftStart) {
            row.lateMins = calculateHours(empShiftStart, record.timeIn).diffMinutes;
          }
          if (record.timeOut && empShiftEnd && record.timeOut < empShiftEnd) {
            row.earlyMins = calculateHours(record.timeOut, empShiftEnd).diffMinutes;
          }
          if (record.timeOut && empShiftEnd && record.timeOut > empShiftEnd) {
            row.otMins = calculateHours(empShiftEnd, record.timeOut).diffMinutes;
          }
        }
        
        row.dedMins = row.lateMins + row.earlyMins;

        // Apply manual string overrides for display
        row.lateStr = record?.manualLate !== undefined ? record.manualLate : (row.total ? formatMins(row.lateMins) : '');
        row.earlyStr = record?.manualEarly !== undefined ? record.manualEarly : (row.total ? formatMins(row.earlyMins) : '');
        row.dedStr = record?.manualDed !== undefined ? record.manualDed : (row.total ? formatMins(row.dedMins) : '');
        row.otStr = record?.manualOT !== undefined ? record.manualOT : (row.total ? formatMins(row.otMins) : '');

        // Lateness Policy Rules Calculations
        let currentLateMins = row.lateMins;
        if (record && record.manualLate !== undefined && record.manualLate !== null && record.manualLate !== '') {
          const parts = record.manualLate.trim().split(':');
          if (parts.length === 2) {
            currentLateMins = parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
          }
        }

        const isNotWorkingDay = record && (record.isAbsent || record.recordType === 'Annual' || record.recordType === 'Sick' || record.recordType === 'Discounted' || record.recordType === 'غياب' || record.recordType === 'إجازة');

        let penaltyText = '';
        let penaltyValue = 0;
        let penaltyType: 'hours' | 'days' | 'warning' = 'warning';
        let matchedRuleName = '';
        let occurrenceIndex = 0;

        if (settings.enableLatenessPolicy && currentLateMins > 0 && !isNotWorkingDay) {
          const rules = settings.latenessRules || [];
          const matchedRule = rules.find(r => currentLateMins >= r.minMins && currentLateMins <= r.maxMins);

          if (matchedRule) {
            ruleOccurrences[matchedRule.id] = (ruleOccurrences[matchedRule.id] || 0) + 1;
            occurrenceIndex = ruleOccurrences[matchedRule.id];
            matchedRuleName = matchedRule.name;

            if (occurrenceIndex === 1) {
              penaltyValue = matchedRule.p1Value;
              penaltyType = matchedRule.p1Type;
            } else if (occurrenceIndex === 2) {
              penaltyValue = matchedRule.p2Value;
              penaltyType = matchedRule.p2Type;
            } else if (occurrenceIndex === 3) {
              penaltyValue = matchedRule.p3Value;
              penaltyType = matchedRule.p3Type;
            } else {
              penaltyValue = matchedRule.p4Value;
              penaltyType = matchedRule.p4Type;
            }

            if (penaltyType === 'warning') {
              penaltyText = 'إنذار كتابي';
            } else if (penaltyType === 'days') {
              penaltyText = `خصم يومي (${penaltyValue} يوم)`;
            } else if (penaltyType === 'hours') {
              penaltyText = `خصم ساعاتي (${penaltyValue} ساعة)`;
            }
          }
        }

        row.penaltyText = penaltyText;
        row.penaltyValue = penaltyValue;
        row.penaltyType = penaltyType;
        row.matchedRuleName = matchedRuleName;
        row.occurrenceIndex = occurrenceIndex;

        report.push(row);
      };

      if (dailyRecords.length === 0) {
        addRow(null, 1);
      } else {
        dailyRecords.forEach((rec, idx) => addRow(rec, idx));
      }
    }
    return report;
  };

  const handleBulkAdd = () => {
    if (!currentEmp || !startDateStr || !endDateStr || !settings) return;
    
    let addedCount = 0;
    
    const startD = parse(startDateStr, 'yyyy-MM-dd', new Date());
    const endD = parse(endDateStr, 'yyyy-MM-dd', new Date());
    const daysCount = differenceInDays(endD, startD) + 1;
    
    let current = [...attendance];
    
    for (let i = 0; i < daysCount; i++) {
      const currentDate = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayOfWeek = getDay(currentDate);
      const isWeekend = settings.weekendDays.includes(dayOfWeek);
      
      if (!isWeekend) {
        const existing = current.find(a => a.employeeId === currentEmp.id && a.date === dateStr);
        if (!existing) {
          current.push({
            id: generateId(),
            employeeId: currentEmp.id,
            date: dateStr,
            timeIn: currentEmp.shiftStart || settings.defaultShiftStart,
            timeOut: currentEmp.shiftEnd || settings.defaultShiftEnd,
            notes: 'إضافة جماعية',
            isAbsent: false
          });
          addedCount++;
        }
      }
    }
    
    setAttendance(current);
    saveAttendance(current);
    alert(`تم إضافة ${addedCount} سجل حضور للموظف.`);
  };

  const handleBulkAddAllEmployees = () => {
    if (!startDateStr || !endDateStr || !settings) return;
    
    const startD = parse(startDateStr, 'yyyy-MM-dd', new Date());
    const endD = parse(endDateStr, 'yyyy-MM-dd', new Date());
    const daysCount = differenceInDays(endD, startD) + 1;
    
    let current = [...attendance];
    let totalAdded = 0;

    employees.forEach(emp => {
      for (let i = 0; i < daysCount; i++) {
        const currentDate = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dayOfWeek = getDay(currentDate);
        const isWeekend = settings.weekendDays.includes(dayOfWeek);
        
        if (!isWeekend) {
          const existing = current.find(a => a.employeeId === emp.id && a.date === dateStr);
          if (!existing) {
            current.push({
              id: generateId(),
              employeeId: emp.id,
              date: dateStr,
              timeIn: emp.shiftStart || settings.defaultShiftStart,
              timeOut: emp.shiftEnd || settings.defaultShiftEnd,
              notes: 'إضافة جماعية للمنظمة',
              isAbsent: false
            });
            totalAdded++;
          }
        }
      }
    });

    setAttendance(current);
    saveAttendance(current);
    alert(`تم إضافة ${totalAdded} سجل حضور لجميع الموظفين.`);
  };

  if (!settings) return null;

  const reportData = generateReportData();

  const parseFloatHours = (timeStr: string) => {
    if (!timeStr || timeStr === '0:00') return 0;
    const parts = timeStr.trim().split(':');
    if (parts.length === 2) {
      const h = parseInt(parts[0] || '0', 10);
      const m = parseInt(parts[1] || '0', 10);
      return Number((h + m / 60).toFixed(2));
    }
    return 0;
  };

  const chartData = reportData.map((row, index) => {
    let dayNum = '';
    try {
      dayNum = format(new Date(row.date), 'dd');
    } catch {
      dayNum = row.date;
    }

    const pastRows = reportData.slice(0, index + 1);
    const activeDays = pastRows.filter(r => r.status !== 'عطلة');
    const presentDays = activeDays.filter(
      r => r.status === 'حضور' || 
           r.recordType === 'Annual' || 
           r.recordType === 'Sick' || 
           r.recordType === 'Excuse' || 
           r.recordType === 'Mission'
    );
    
    const cumulativeRate = activeDays.length > 0 
      ? Math.round((presentDays.length / activeDays.length) * 100) 
      : 100;

    const workHours = parseFloatHours(row.total);

    return {
      day: dayNum,
      'نسبة الحضور (%)': cumulativeRate,
      'ساعات العمل': workHours,
    };
  });

  const summary = reportData.reduce((acc, curr) => {
    if (curr.status === 'حضور') acc.present++;
    if (curr.status === 'غياب') acc.absent++;
    if (curr.recordType === 'Annual') acc.annual++;
    if (curr.recordType === 'Sick') acc.sick++;
    if (curr.recordType === 'Discounted') acc.discounted++;
    if (curr.recordType === 'Excuse') acc.excuse++;
    if (curr.recordType === 'NT' || curr.recordType === 'Mission') acc.mission++;

    acc.totalLate += parseMins(curr.lateStr);
    acc.totalEarly += parseMins(curr.earlyStr);
    acc.totalOT += parseMins(curr.otStr);
    acc.totalDeduction += parseMins(curr.dedStr);

    if (settings && settings.enableLatenessPolicy && curr.penaltyType) {
      if (curr.penaltyType === 'warning' && curr.penaltyText) {
        acc.totalWarnings++;
      } else if (curr.penaltyType === 'days') {
        acc.totalDaysDeducted += curr.penaltyValue || 0;
      } else if (curr.penaltyType === 'hours') {
        acc.totalHoursDeducted += curr.penaltyValue || 0;
      }
    }
    
    return acc;
  }, { 
    present: 0, 
    absent: 0, 
    totalLate: 0, 
    totalEarly: 0, 
    totalOT: 0, 
    totalDeduction: 0, 
    annual: 0, 
    sick: 0, 
    discounted: 0, 
    excuse: 0, 
    mission: 0,
    totalWarnings: 0,
    totalDaysDeducted: 0,
    totalHoursDeducted: 0
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div>
          <label className="block text-sm font-medium mb-1">الموظف</label>
          <select 
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 min-w-[200px]"
          >
            <option value="">-- اختر الموظف --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.empId})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">من تاريخ (From)</label>
          <input 
            type="date" 
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
            className="border border-gray-300 rounded-lg p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">إلى تاريخ (To)</label>
          <input 
            type="date" 
            value={endDateStr}
            onChange={(e) => setEndDateStr(e.target.value)}
            className="border border-gray-300 rounded-lg p-2"
          />
        </div>
        <button 
          onClick={handlePrint}
          disabled={!currentEmp}
          className="bg-brand-blue text-white px-6 py-2 rounded-lg hover:bg-blue-900 disabled:opacity-50 flex gap-2 items-center"
        >
          طباعة التقرير
        </button>

        <button 
          onClick={handleBulkAdd}
          disabled={!currentEmp}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex gap-2 items-center text-sm"
          title="إضافة حضور لجميع أيام العمل في الفترة المختارة لهذا الموظف"
        >
          حضور جماعي للموظف
        </button>

        <button 
          onClick={handleBulkAddAllEmployees}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex gap-2 items-center text-sm"
          title="إضافة حضور لجميع الموظفين لجميع أيام العمل في الفترة المختارة"
        >
          حضور جماعي للكل
        </button>
      </div>

      {currentEmp && (
        <div ref={reportRef} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0 dir-rtl text-right font-sans">
          
          <div className="text-center mb-2 border-b-2 border-brand-blue pb-1 print:mb-1">
            <h1 className="text-lg font-bold text-gray-900 mb-0 tracking-tight print:text-sm">تقرير الحضور والانصراف الشهري</h1>
            <p className="text-[10px] text-gray-500 font-medium">تاريخ الطباعة: {format(new Date(), 'dd/MM/yyyy')}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2 text-[10px] font-bold text-gray-800 bg-gray-50 p-2 rounded-lg print:bg-white print:p-0 print:mb-1 print:border-b print:rounded-none">
            <div className="space-y-1">
              <p className="flex items-center gap-2">اسم الموظف: <span className="font-semibold text-brand-blue">{currentEmp.name}</span></p>
              <p className="flex items-center gap-2">رقم الموظف: <span className="font-semibold text-brand-blue">{currentEmp.empId}</span></p>
              {startDateStr && isSameMonth(parse(startDateStr, 'yyyy-MM-dd', new Date()), parse(endDateStr, 'yyyy-MM-dd', new Date())) && (
                <p className="flex items-center gap-2">الشهر: <span className="font-semibold text-brand-blue">{format(parse(startDateStr, 'yyyy-MM-dd', new Date()), 'MMMM yyyy', { locale: arSA })}</span></p>
              )}
            </div>
            <div className="space-y-1 text-left">
              <p>الفترة: <span className="font-semibold text-brand-blue" dir="ltr">{startDateStr ? format(parse(startDateStr, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : ''} - {endDateStr ? format(parse(endDateStr, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : ''}</span></p>
              <p>الوردية: <span className="font-semibold text-brand-blue">{currentEmp.shiftStart || settings.defaultShiftStart} - {currentEmp.shiftEnd || settings.defaultShiftEnd}</span></p>
            </div>
          </div>

          {/* Recharts Attendance Trend Line Chart */}
          <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl print:hidden">
            <h3 className="text-xs font-extrabold text-slate-800 mb-3 flex items-center gap-1.5 justify-start">
              <span>📈</span>
              <span>منحنى تطور نسبة الحضور اليومية وساعات العمل للموظف خلال الشهر</span>
            </h3>
            <div className="w-full h-64 font-sans text-[11px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#64748b" 
                    tickLine={false}
                    label={{ value: 'اليوم بالشهر', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#3b82f6" 
                    domain={[0, 100]}
                    tickLine={false}
                    label={{ value: 'نسبة الحضور (%)', angle: -90, position: 'insideLeft', fill: '#3b82f6', offset: 10 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#10b981" 
                    domain={[0, 'auto']}
                    tickLine={false}
                    label={{ value: 'ساعات العمل', angle: 90, position: 'insideRight', fill: '#10b981', offset: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', textAlign: 'right', direction: 'rtl' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="نسبة الحضور (%)" 
                    stroke="#2563eb" 
                    strokeWidth={2.5}
                    activeDot={{ r: 6 }} 
                    dot={{ r: 3 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="ساعات العمل" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-[10px] text-center border-collapse border border-gray-400 mb-2 min-w-[1000px] print:min-w-full print:text-[8pt]">
              <thead className="bg-gray-100 font-bold border-b-2 border-gray-400">
                <tr>
                  <th className="border border-gray-400 p-1 w-7 print:p-0.5">م</th>
                  <th className="border border-gray-400 p-1.5 print:hidden">الرقم</th>
                  <th className="border border-gray-400 p-1.5 print:hidden">الاسم</th>
                  <th className="border border-gray-400 p-1 w-18 print:p-0.5">التاريخ</th>
                  <th className="border border-gray-400 p-1 w-14 print:p-0.5">اليوم</th>
                  <th className="border border-gray-400 p-1 w-14 print:p-0.5">دخول</th>
                  <th className="border border-gray-400 p-1 w-14 print:p-0.5">خروج</th>
                  <th className="border border-gray-400 p-1 w-14 print:p-0.5">العمل</th>
                  <th className="border border-gray-400 p-1 w-14 print:p-0.5">تأخير</th>
                  {settings?.enableLatenessPolicy && (
                    <>
                      <th className="border border-gray-400 p-1 w-20 print:p-0.5 bg-rose-50 text-rose-900 font-extrabold text-[9px]">بند لائحة التأخير</th>
                      <th className="border border-gray-400 p-1 w-20 print:p-0.5 bg-rose-50 text-rose-900 font-extrabold text-[9px]">الجزاء المطبق</th>
                    </>
                  )}
                  <th className="border border-gray-400 p-1 w-14 print:p-0.5">مبكر</th>
                  <th className="border border-gray-400 p-1 w-14 print:p-0.5">خصم</th>
                  <th className="border border-gray-400 p-1 w-14 print:p-0.5">إضافي</th>
                  <th className="border border-gray-400 p-1 print:p-0.5">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row) => (
                  <tr key={row.id} className={`${row.rowClass} transition-colors hover:bg-slate-50`}>
                    <td className="border border-gray-400 p-1 font-bold">{row.no}</td>
                    <td className="border border-gray-400 p-1 print:hidden">{row.acNo}</td>
                    <td className="border border-gray-400 p-1 print:hidden">{row.name}</td>
                    <td className="border border-gray-400 p-1 font-medium whitespace-nowrap">{format(new Date(row.date), 'dd/MM/yy')}</td>
                    <td className="border border-gray-400 p-1 font-bold">{row.dayName}</td>
                    <td className="border border-gray-400 p-[2px]">
                      <input
                        type="time"
                        value={row.rawTimeIn}
                        onChange={(e) => updateRecord(row.id, row.date, 'timeIn', e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:ring-1 focus:ring-brand-blue outline-none rounded print:hidden text-xs"
                      />
                      <span className="hidden print:inline">{row.rawTimeIn || ''}</span>
                    </td>
                    <td className="border border-gray-400 p-[2px]">
                      <input
                        type="time"
                        value={row.rawTimeOut}
                        onChange={(e) => updateRecord(row.id, row.date, 'timeOut', e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:ring-1 focus:ring-brand-blue outline-none rounded print:hidden text-xs"
                      />
                      <span className="hidden print:inline">{row.rawTimeOut || ''}</span>
                    </td>
                    <td className="border border-gray-400 p-1.5 font-bold">{row.total}</td>
                    
                    {/* Manual Editable Calculated fields */}
                    <td className="border border-gray-400 p-[2px]">
                      <input type="text" value={row.lateStr}
                        onChange={(e) => updateRecord(row.id, row.date, 'manualLate', e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:ring-1 focus:ring-brand-blue outline-none rounded print:hidden text-xs font-mono" />
                      <span className="hidden print:inline">{row.lateStr}</span>
                    </td>
                    {settings?.enableLatenessPolicy && (
                      <>
                        <td className="border border-gray-400 p-1 bg-rose-50 text-rose-900 text-center font-medium">
                          {row.matchedRuleName ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-[9px] font-bold">
                              {row.matchedRuleName}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="border border-gray-400 p-1 bg-rose-50/70 text-center">
                          {row.penaltyText ? (
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <span className="text-red-700 font-extrabold text-[9px]">
                                {row.penaltyText}
                              </span>
                              <span className="text-[8px] text-red-500 font-mono leading-none">
                                (التكرار: #{row.occurrenceIndex})
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="border border-gray-400 p-[2px]">
                      <input type="text" value={row.earlyStr}
                        onChange={(e) => updateRecord(row.id, row.date, 'manualEarly', e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:ring-1 focus:ring-brand-blue outline-none rounded print:hidden text-xs font-mono" />
                      <span className="hidden print:inline">{row.earlyStr}</span>
                    </td>
                    <td className="border border-gray-400 p-[2px] bg-red-50 text-red-800">
                      <input type="text" value={row.dedStr}
                        onChange={(e) => updateRecord(row.id, row.date, 'manualDed', e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:ring-1 focus:ring-brand-blue outline-none rounded print:hidden text-xs font-mono font-bold" />
                      <span className="hidden print:inline">{row.dedStr}</span>
                    </td>
                    <td className="border border-gray-400 p-[2px] bg-blue-50 text-brand-blue">
                      <input type="text" value={row.otStr}
                        onChange={(e) => updateRecord(row.id, row.date, 'manualOT', e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:ring-1 focus:ring-brand-blue outline-none rounded print:hidden text-xs font-mono font-bold" />
                      <span className="hidden print:inline">{row.otStr}</span>
                    </td>

                    <td className="border border-gray-400 p-[2px] align-top">
                       <div className="flex flex-col gap-1 print:block">
                            <select 
                            value={row.recordType}
                            onChange={(e) => updateRecord(row.id, row.date, 'recordType', e.target.value)}
                            className="w-full text-xs bg-transparent border-none focus:ring-1 focus:ring-brand-blue outline-none rounded print:hidden dir-rtl font-arabic p-[2px]"
                          >
                            <option value="">-</option>
                            <option value="Annual">إجازة</option>
                            <option value="Sick">مرضي</option>
                            <option value="Discounted">خصم (Discounted)</option>
                            <option value="Excuse">إذن</option>
                            <option value="Mission">مأمورية</option>
                          </select>
                          <input
                            type="text"
                            value={row.rawNotes}
                            onChange={(e) => updateRecord(row.id, row.date, 'notes', e.target.value)}
                            className="w-full text-right font-arabic text-xs bg-transparent border-none focus:ring-1 focus:ring-brand-blue outline-none rounded print:hidden p-[2px]"
                            dir="rtl"
                            placeholder="ملاحظات..."
                          />
                          <span className="hidden print:block text-right text-[9px] px-1 dir-rtl font-arabic leading-tight">
                            {row.recordType === 'Annual' && 'إجازة'}
                            {row.recordType === 'Sick' && 'مرضي'}
                            {row.recordType === 'Discounted' && 'خصم'}
                            {row.recordType === 'Excuse' && 'إذن'}
                            {(row.recordType === 'Mission' || row.recordType === 'NT') && 'مأمورية'}
                            {row.recordType && row.rawNotes ? ' - ' : ''}
                            {row.rawNotes}
                          </span>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="print:hidden">
                <tr className="bg-gray-50 border-t-2 border-gray-400 font-medium">
                  <td colSpan={3} className="p-2 text-right">إضافة سجل يدوي:</td>
                  <td className="p-1"><input type="date" value={newEntryDate} onChange={e=>setNewEntryDate(e.target.value)} className="w-full text-xs p-1 rounded border border-gray-300" /></td>
                  <td className="p-1 text-center text-gray-400">-</td>
                  <td className="p-1"><input type="time" value={newEntryIn} onChange={e=>setNewEntryIn(e.target.value)} className="w-full text-xs p-1 rounded border border-gray-300 text-center" /></td>
                  <td className="p-1"><input type="time" value={newEntryOut} onChange={e=>setNewEntryOut(e.target.value)} className="w-full text-xs p-1 rounded border border-gray-300 text-center" /></td>
                  <td colSpan={settings?.enableLatenessPolicy ? 7 : 5}></td>
                  <td className="p-1 flex gap-1">
                    <select value={newEntryType} onChange={e => setNewEntryType(e.target.value)} className="w-1/3 text-xs p-1 rounded border border-gray-300 dir-rtl font-arabic">
                      <option value="">نوع السجل</option>
                      <option value="Annual">إجازة</option>
                      <option value="Sick">مرضي</option>
                      <option value="Discounted">خصم (Discounted)</option>
                      <option value="Excuse">إذن</option>
                      <option value="NT">NT</option>
                      <option value="Mission">مأمورية</option>
                    </select>
                    <input type="text" value={newEntryNotes} onChange={e=>setNewEntryNotes(e.target.value)} placeholder="ملاحظة..." className="w-1/3 text-xs p-1 rounded border border-gray-300 dir-rtl font-arabic" />
                    <button onClick={handleAddNewEntry} disabled={!newEntryDate} className="bg-brand-blue text-white px-3 py-1 rounded text-xs hover:bg-blue-800 disabled:opacity-50">إضافة</button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-2 mt-1 print:mt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto print:gap-1">
              <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded border border-gray-100 print:bg-white print:border-none print:p-0">
                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">أيام الحضور</p>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{summary.present}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded border border-gray-100 print:bg-white print:border-none print:p-0">
                <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">أيام الغياب</p>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{summary.absent}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded border border-gray-100 print:bg-white print:border-none print:p-0">
                <div className="w-1 h-6 bg-orange-400 rounded-full"></div>
                <div>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">إجمالي الخصم</p>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{formatMins(summary.totalDeduction)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded border border-gray-100 print:bg-white print:border-none print:p-0">
                <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                <div>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">صافي الإضافي</p>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{formatMins(summary.totalOT)}</p>
                </div>
              </div>
            </div>

            <div className="w-48 shrink-0 print:w-36">
              <table className="w-full text-[9px] border-collapse border border-gray-400 text-center bg-white print:border-gray-800 print:text-[7pt]">
                <thead className="bg-gray-100 font-bold print:bg-gray-200">
                  <tr>
                    <th className="border border-gray-400 print:border-gray-800 p-0.5">نوع المغادرة</th>
                    <th className="border border-gray-400 print:border-gray-800 p-0.5">العدد</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 print:border-gray-800 p-0.5 font-bold text-right">إجازة سنوية</td>
                    <td className="border border-gray-400 print:border-gray-800 p-0.5 font-semibold text-brand-blue">{summary.annual}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 print:border-gray-800 p-0.5 font-bold text-right">مرضي</td>
                    <td className="border border-gray-400 print:border-gray-800 p-0.5 font-semibold text-brand-blue">{summary.sick}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 print:border-gray-800 p-0.5 font-bold text-right">خصم</td>
                    <td className="border border-gray-400 print:border-gray-800 p-0.5 font-semibold text-brand-blue">{summary.discounted}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 print:border-gray-800 p-0.5 font-bold text-right">إذن خاص</td>
                    <td className="border border-gray-400 print:border-gray-800 p-0.5 font-semibold text-brand-blue">{summary.excuse}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 print:border-gray-800 p-0.5 font-bold text-right">مأمورية عمل</td>
                    <td className="border border-gray-400 print:border-gray-800 p-0.5 font-semibold text-brand-blue">{summary.mission}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {settings?.enableLatenessPolicy && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl font-sans text-right dir-rtl print:bg-white print:border-gray-300">
              <h4 className="text-xs font-extrabold text-rose-950 mb-2 flex items-center gap-1.5 justify-start">
                <span>📑</span>
                <span>ملخص لائحة الجزاءات والخصومات الأوتوماتيكية للتأخير:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-right">
                <div className="p-2.5 bg-white rounded-lg border border-rose-100/60 print:border-gray-300">
                  <p className="text-[9px] text-rose-800 font-extrabold mb-0.5">عدد الإنذارات الصادرة</p>
                  <p className="text-sm font-bold text-rose-950">{summary.totalWarnings || 0} إنذار خطي</p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-rose-100/60 print:border-gray-300">
                  <p className="text-[9px] text-rose-800 font-extrabold mb-0.5">إجمالي خصومات الأيام</p>
                  <p className="text-sm font-bold text-rose-950">{summary.totalDaysDeducted || 0} يوم خصم</p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-rose-100/60 print:border-gray-300">
                  <p className="text-[9px] text-rose-800 font-extrabold mb-0.5">إجمالي خصومات الساعات</p>
                  <p className="text-sm font-bold text-rose-950">{summary.totalHoursDeducted || 0} ساعة خصم</p>
                </div>
                <div className="p-2.5 bg-rose-950 text-white rounded-lg border border-rose-900 print:border-gray-300 print:bg-white print:text-black">
                  <p className="text-[9px] text-rose-200 font-extrabold mb-0.5 print:text-gray-500">القيمة النقدية للجزاءات</p>
                  <p className="text-sm font-bold text-rose-100 font-mono print:text-black">
                    {(() => {
                      const dailyRate = currentEmp?.salary ? (currentEmp.salary / 30) : 0;
                      const hourlyRate = currentEmp?.salary ? (currentEmp.salary / (30 * 8)) : 0;
                      const totalCashPen = (summary.totalDaysDeducted * dailyRate) + (summary.totalHoursDeducted * hourlyRate);
                      return totalCashPen > 0 ? `${totalCashPen.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س` : 'لا يوجد خصم مالي';
                    })()}
                  </p>
                  {currentEmp?.salary && currentEmp.salary > 0 && (
                    <p className="text-[8px] text-rose-300 mt-0.5 leading-none print:text-gray-500">(بناءً على الراتب الأساسي: {currentEmp.salary} ر.س)</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


