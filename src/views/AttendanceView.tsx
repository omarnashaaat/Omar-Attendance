import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Employee, AttendanceRecord, getEmployees, getAttendance, saveAttendance } from '../store';
import { generateId } from '../utils';

export default function AttendanceView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    setEmployees(getEmployees());
    setAttendance(getAttendance());
  }, []);

  const handleSaveRecord = (empId: string, updates: Partial<AttendanceRecord>) => {
    let current = [...attendance];
    const existingIdx = current.findIndex(a => a.employeeId === empId && a.date === date);
    
    if (existingIdx >= 0) {
      current[existingIdx] = { ...current[existingIdx], ...updates };
    } else {
      current.push({
        id: generateId(),
        employeeId: empId,
        date: date,
        timeIn: '',
        timeOut: '',
        notes: '',
        isAbsent: false,
        ...updates
      });
    }
    setAttendance(current);
    saveAttendance(current);
  };

  const currentRecords = employees.map(emp => {
    const record = attendance.find(a => a.employeeId === emp.id && a.date === date);
    return { emp, record: record || { timeIn: '', timeOut: '', notes: '', isAbsent: false } };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">سجل الحضور اليومي</h2>
        <div className="flex items-center gap-2">
          <label className="text-gray-600 font-medium whitespace-nowrap">التاريخ:</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="p-4 font-semibold text-start">الموظف</th>
                <th className="p-4 font-semibold text-start">القسم</th>
                <th className="p-4 font-semibold text-start">وقت الدخول</th>
                <th className="p-4 font-semibold text-start">وقت الخروج</th>
                <th className="p-4 font-semibold text-start">غياب؟</th>
                <th className="p-4 font-semibold text-start">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentRecords.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">لا يوجد موظفين مسجلين</td></tr>
              ) : currentRecords.map(({ emp, record }) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold">{emp.name}</div>
                    <div className="text-xs text-gray-500">{emp.empId}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{emp.department}</td>
                  <td className="p-4">
                    <input 
                      type="time" 
                      value={record.timeIn}
                      onChange={(e) => handleSaveRecord(emp.id, { timeIn: e.target.value, isAbsent: false })}
                      disabled={record.isAbsent}
                      className="border border-gray-300 rounded p-1.5 focus:ring-brand-blue disabled:bg-gray-100 disabled:opacity-50"
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="time" 
                      value={record.timeOut}
                      onChange={(e) => handleSaveRecord(emp.id, { timeOut: e.target.value, isAbsent: false })}
                      disabled={record.isAbsent}
                      className="border border-gray-300 rounded p-1.5 focus:ring-brand-blue disabled:bg-gray-100 disabled:opacity-50"
                    />
                  </td>
                  <td className="p-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={record.isAbsent}
                        onChange={(e) => handleSaveRecord(emp.id, { 
                          isAbsent: e.target.checked,
                          timeIn: e.target.checked ? '' : record.timeIn,
                          timeOut: e.target.checked ? '' : record.timeOut
                        })}
                        className="w-5 h-5 rounded text-brand-red focus:ring-brand-red"
                      />
                      <span className={record.isAbsent ? 'text-brand-red font-bold' : 'text-gray-500'}>غياب</span>
                    </label>
                  </td>
                  <td className="p-4">
                    <input 
                      type="text" 
                      value={record.notes}
                      onChange={(e) => handleSaveRecord(emp.id, { notes: e.target.value })}
                      placeholder="ملاحظات..."
                      className="border border-gray-300 rounded p-1.5 w-full focus:ring-brand-blue"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
