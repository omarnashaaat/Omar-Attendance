import { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { getEmployees, getAttendance, saveAttendance, saveEmployees, getSettings, AttendanceRecord } from '../store';
import { generateId } from '../utils';
import { format, parse } from 'date-fns';

interface ImportedPreview {
  empId: string;
  name: string;
  date: string;
  in: string;
  out: string;
}

export default function ImportView() {
  const [logs, setLogs] = useState<string[]>([]);
  const [importedRecords, setImportedRecords] = useState<ImportedPreview[]>([]);
  
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogs(["جاري قراءة الملف..."]);
    setImportedRecords([]);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Data format usually expected: EmployeeID, Date(YYYY-MM-DD), TimeIn(HH:mm), TimeOut(HH:mm)
        // Adjust standard format for demo: 
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        processImportedData(data);
      } catch (err) {
        setLogs(prev => [...prev, "حدث خطأ أثناء قراءة الملف. يرجى التأكد من التنسيق."]);
      }
    };
    reader.readAsBinaryString(file);
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const processImportedData = (data: any[]) => {
    const employees = getEmployees();
    const settings = getSettings();
    let currentAttendance = getAttendance();
    let added = 0;
    let skipped = 0;
    let newEmployeesCount = 0;
    let empsUpdated = false;
    const previewData: ImportedPreview[] = [];
    
    setLogs(prev => [...prev, `تم العثور على ${data.length} سجل. جاري المعالجة...`]);

    if (data.length > 0) {
      setLogs(prev => [...prev, `الأعمدة المكتشفة في الملف: ${Object.keys(data[0]).join(', ')}`]);
    }

    data.forEach((row, index) => {
      const rowKeys = Object.keys(row);
      
      const findValue = (possibleKeys: string[]) => {
        const key = rowKeys.find(k => 
          possibleKeys.includes(k.trim().toLowerCase())
        );
        return key ? row[key] : '';
      };

      const empIdRaw = findValue(['id', 'رقم الموظف', 'employeeid', 'empid', 'رقم', 'رقم البصمة', 'code']);
      const dateRawVal = findValue(['date', 'التاريخ', 'يوم', 'day', 'تاريخ']);
      const inRaw = findValue(['in', 'تسجيل الدخول', 'timein', 'تسجيل دخول', 'دخول', 'حضور']);
      const outRaw = findValue(['out', 'تسجيل الخروج', 'timeout', 'تسجيل خروج', 'خروج', 'انصراف']);
      const nameRaw = findValue(['name', 'اسم الموظف', 'اسم', 'الموظف', 'emp name']);

      const empIdStr = String(empIdRaw || '').trim();
      const dateRaw = String(dateRawVal || '').trim();
      const timeInStr = String(inRaw || '').trim();
      const timeOutStr = String(outRaw || '').trim();
      const empNameRaw = String(nameRaw || '').trim() || empIdStr;

      if (!empIdStr || !dateRaw || empIdStr === 'undefined' || dateRaw === 'undefined') {
        if (skipped < 3) {
          setLogs(prev => [...prev, `تخطي السطر ${index + 2}: رقم الموظف أو التاريخ مفقود. (موجود: ${JSON.stringify(row)})`]);
        }
        skipped++;
        return;
      }

      let emp = employees.find(e => e.empId === empIdStr);
      if (!emp) {
        emp = {
          id: generateId(),
          empId: empIdStr,
          name: empNameRaw || `موظف ${empIdStr}`,
          department: '-',
          shiftStart: settings.defaultShiftStart,
          shiftEnd: settings.defaultShiftEnd,
          salary: 0
        };
        employees.push(emp);
        empsUpdated = true;
        newEmployeesCount++;
      }

      // Try parsing date. Excel might give MM/DD/YYYY or Excel date number
      let formattedDate = "";
      try {
        if (!isNaN(Number(dateRawVal))) {
          // Excel date serial format parsing
          const excelDate = new Date(Math.round((Number(dateRawVal) - 25569) * 86400 * 1000));
          formattedDate = format(excelDate, 'yyyy-MM-dd');
        } else {
          const dateOnly = dateRaw.split(' ')[0] || dateRaw;
          const ymdMatch = dateOnly.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
          if (ymdMatch) {
            formattedDate = `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
          } else {
            const dmyMatch = dateOnly.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
            if (dmyMatch) {
              formattedDate = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
            } else {
              let d = new Date(dateRaw);
              if (isNaN(d.getTime())) throw new Error("Invalid date");
              // Use getUTCFullYear, getUTCMonth, getUTCDate to avoid timezone shifts if initialized via new Date('YYYY-MM-DD')
              formattedDate = d.toISOString().split('T')[0];
            }
          }
        }
      } catch (e) {
         if (skipped < 3) {
           setLogs(prev => [...prev, `تخطي السطر ${index + 2}: تنسيق تاريخ غير صالح "${dateRaw}".`]);
         }
         skipped++;
         return;
      }

      // Process Time format
      const cleanTime = (tString: string) => {
        if (!tString || tString === 'undefined' || tString === 'null') return '';
        if (!isNaN(Number(tString))) {
            const totalSeconds = Math.round(Number(tString) * 86400);
            const hh = Math.floor(totalSeconds / 3600);
            const mm = Math.floor((totalSeconds % 3600) / 60);
            return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        }
        // Basic match for HH:mm or HH:mm:ss
        const match = tString.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          return `${match[1].padStart(2, '0')}:${match[2]}`;
        }
        // Fallback AM PM maybe?
        if (tString.toLowerCase().includes('pm') || tString.toLowerCase().includes('am')) {
           const [time, modifier] = tString.split(' ');
           let [hours, minutes] = time.split(':');
           if (hours === '12') {
             hours = '00';
           }
           if (modifier.toLowerCase() === 'pm') {
             hours = String(parseInt(hours, 10) + 12);
           }
           return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
        return tString.substring(0, 5); // Fallback
      };

      const inTime = cleanTime(timeInStr);
      const outTime = cleanTime(timeOutStr);

      if (!inTime && !outTime) {
        if (skipped < 3) {
          setLogs(prev => [...prev, `تخطي السطر ${index + 2}: لا يوجد وقت دخول أو خروج.`]);
        }
        skipped++;
        return;
      }

      const existingIdx = currentAttendance.findIndex(a => a.employeeId === emp!.id && a.date === formattedDate);
      if (existingIdx >= 0) {
        // Update
        currentAttendance[existingIdx].timeIn = inTime || currentAttendance[existingIdx].timeIn;
        currentAttendance[existingIdx].timeOut = outTime || currentAttendance[existingIdx].timeOut;
        currentAttendance[existingIdx].isAbsent = false;
      } else {
        // Add
        currentAttendance.push({
          id: generateId(),
          employeeId: emp!.id,
          date: formattedDate,
          timeIn: inTime,
          timeOut: outTime,
          notes: 'مستورد من إكسيل',
          isAbsent: false 
        });
      }
      
      previewData.push({
        empId: emp!.empId,
        name: emp!.name,
        date: formattedDate,
        in: inTime,
        out: outTime
      });
      
      added++;
    });

    if (empsUpdated) {
      saveEmployees(employees);
    }
    saveAttendance(currentAttendance);
    setImportedRecords(previewData);
    
    setLogs(prev => [...prev, `اكتمل بنجاح. تم إضافة/تحديث ${added} سجل حضور.`]);
    if (skipped > 0) {
      setLogs(prev => [...prev, `تم تخطي ${skipped} سجل لوجود بيانات ناقصة أو غير صحيحة.`]);
    }
    if (newEmployeesCount > 0) {
      setLogs(prev => [...prev, `تم تسجيل ${newEmployeesCount} موظف جديد تلقائياً.`]);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800">استيراد بيانات البصمة</h2>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-brand-blue border-dashed text-center">
        <label className="flex flex-col items-center justify-center cursor-pointer space-y-4">
          <div className="bg-blue-50 p-4 rounded-full text-brand-blue">
            <FileSpreadsheet size={48} />
          </div>
          <h3 className="text-xl font-bold">ارفع ملف Excel أو CSV</h3>
          <p className="text-gray-500 max-w-sm">
            يمكن أن يحتوي الملف على الأعمدة التالية (إنجليزي أو عربي):<br/>
            <span className="font-mono text-brand-blue">id, name, date, in, out</span>
          </p>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
          <div className="mt-4 px-6 py-2 bg-brand-blue text-white rounded-lg inline-flex items-center gap-2 hover:bg-blue-900 transition-colors">
            <Upload size={18} />
            اختيار ملف
          </div>
        </label>
      </div>

      {logs.length > 0 && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-xl shadow-inner font-mono text-sm max-h-32 overflow-y-auto w-full text-left dir-ltr">
          {logs.map((log, i) => (
            <div key={i} className="mb-1">{"> "} {log}</div>
          ))}
        </div>
      )}

      {importedRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">البيانات المستوردة</h3>
            <span className="bg-brand-blue text-white px-3 py-1 rounded-full text-sm font-medium">
              {importedRecords.length} سجل
            </span>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-start whitespace-nowrap">
              <thead className="bg-white text-gray-600 sticky top-0 shadow-sm">
                <tr>
                  <th className="p-4 font-semibold text-start">الرقم</th>
                  <th className="p-4 font-semibold text-start">الاسم</th>
                  <th className="p-4 font-semibold text-start">التاريخ</th>
                  <th className="p-4 font-semibold text-start">الدخول</th>
                  <th className="p-4 font-semibold text-start">الخروج</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {importedRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm">{r.empId}</td>
                    <td className="p-4 font-medium">{r.name}</td>
                    <td className="p-4 text-sm text-gray-600">{r.date}</td>
                    <td className="p-4 text-green-600 font-medium dir-ltr text-end">{r.in || '-'}</td>
                    <td className="p-4 text-orange-600 font-medium dir-ltr text-end">{r.out || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
