import { useState, useEffect } from 'react';
import { getEmployees, getAttendance } from '../store';

export default function DashboardView() {
  const [stats, setStats] = useState({ totalEmps: 0, thisMonthAttendance: 0 });

  useEffect(() => {
    setStats({
      totalEmps: getEmployees().length,
      thisMonthAttendance: getAttendance().length,
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">لوحة القيادة</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-start justify-center transition-shadow hover:shadow-md">
          <span className="text-slate-500 text-sm font-medium mb-2">إجمالي الموظفين</span>
          <span className="text-4xl font-bold text-slate-900">{stats.totalEmps}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-start justify-center transition-shadow hover:shadow-md">
          <span className="text-slate-500 text-sm font-medium mb-2">سجلات الحضور (الكل)</span>
          <span className="text-4xl font-bold text-slate-900">{stats.thisMonthAttendance}</span>
        </div>
      </div>
    </div>
  );
}
