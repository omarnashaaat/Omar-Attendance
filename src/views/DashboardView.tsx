import { useState, useEffect } from 'react';
import { getEmployees, getAttendance, getSettings } from '../store';
import { calculateHours } from '../utils';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock, 
  Briefcase,
  PlusCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Settings,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

export default function DashboardView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEmps: 0,
    attendance: 0,
    absent: 0,
    leaves: 0,
    excuses: 0,
    missions: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  useEffect(() => {
    const emps = getEmployees();
    const atts = getAttendance();
    setEmployees(emps);
    setAttendance(atts);

    // Calculate dynamic stats
    const presentCount = atts.filter(a => !a.isAbsent && (!a.recordType || a.recordType === "حضور" || a.recordType === "")).length;
    const absentCount = atts.filter(a => a.isAbsent || a.recordType === "غياب").length;
    const leavesCount = atts.filter(a => a.recordType === "إجازة" || a.recordType === "مرضي").length;
    const excusesCount = atts.filter(a => a.recordType === "إذن").length;
    const missionsCount = atts.filter(a => a.recordType === "مأمورية").length;

    setStats({
      totalEmps: emps.length,
      attendance: presentCount,
      absent: absentCount,
      leaves: leavesCount,
      excuses: excusesCount,
      missions: missionsCount
    });
  }, []);

  const todayStr = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // Calculate lateness stats for each employee during the selected month based on assigned shifts
  const getLatenessStats = () => {
    const settings = getSettings();
    const monthRecords = attendance.filter(a => a.date && a.date.startsWith(selectedMonth));

    const stats = employees.map(emp => {
      const empRecords = monthRecords.filter(a => a.employeeId === emp.id);
      let totalLateMins = 0;
      let delayDaysCount = 0;

      const empShiftStart = emp.shiftStart || settings.defaultShiftStart;

      empRecords.forEach(record => {
        // Skip if marked as absent or having a non-work status
        if (record.isAbsent || record.recordType === 'غياب' || record.recordType === 'إجازة' || record.recordType === 'مرضي') {
          return;
        }

        let lateMins = 0;
        if (record.manualLate !== undefined && record.manualLate !== null && record.manualLate !== '') {
          const parts = record.manualLate.trim().split(':');
          if (parts.length === 2) {
            lateMins = parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
          }
        } else if (record.timeIn && empShiftStart && record.timeIn > empShiftStart) {
          lateMins = calculateHours(empShiftStart, record.timeIn).diffMinutes;
        }

        if (lateMins > 0) {
          totalLateMins += lateMins;
          delayDaysCount++;
        }
      });

      // Match shift label if any
      const shiftLabel = settings.shifts?.find(s => s.start === empShiftStart && s.end === (emp.shiftEnd || settings.defaultShiftEnd))?.name || 'مخصصة/افتراضية';

      return {
        employee: emp,
        totalLateMins,
        delayDaysCount,
        shiftStart: empShiftStart,
        shiftEnd: emp.shiftEnd || settings.defaultShiftEnd,
        shiftLabel
      };
    });

    return stats
      .filter(s => s.totalLateMins > 0)
      .sort((a, b) => b.totalLateMins - a.totalLateMins);
  };

  const topDelayed = getLatenessStats();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section with Integrated Real-time Live Clock & Today's Date */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 bg-indigo-500/10 w-64 h-64 rounded-full blur-2xl"></div>
        <div className="relative z-10 animate-slideUp">
          <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 inline-block mb-3 animate-pulse">
            لوحة الأدوات والتحكم النشطة
          </span>
          <h2 className="text-3xl font-black tracking-tight">
            لوحة قيادة النظام والتحضير الذكي
          </h2>
          <p className="text-slate-300 font-medium mt-1 text-sm">
            إحصائيات فورية، فحص ومطابقة البصمة، وإدارة كادر الموظفين دون تعقيد
          </p>
        </div>

        {/* Live widgets combo */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 self-start md:self-center">
          {/* Ticking Digital Clock Card */}
          <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-inner">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">الوقت الآني</p>
              <p className="font-mono text-emerald-400 text-base font-black leading-none mt-0.5" dir="ltr">{timeString}</p>
            </div>
          </div>

          {/* Gregorian Date Card */}
          <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-inner">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">تاريخ اليوم</p>
              <p className="text-xs font-black text-slate-200 mt-0.5 leading-none">{todayStr}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Gateway Cards (Icons Control Dashboard) */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5 px-1">
          <span className="w-2.5 h-6 bg-indigo-600 rounded-full inline-block"></span>
          بوابات التحكّم وموديولات النظام الرئيسي
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Gate 1: Attendance Schedule Register */}
          <button 
            onClick={() => onNavigate?.('attendance')}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-right cursor-pointer group flex flex-col justify-between min-h-[170px]"
          >
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <Calendar size={28} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-850 text-lg group-hover:text-indigo-600 transition-colors">الدفتر اليومي للتحضير</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">تسجيل وتعديل حضور وغياب الموظفين وإضافة رصد البصمات والأذونات</p>
            </div>
          </button>

          {/* Gate 2: Employees Directory */}
          <button 
            onClick={() => onNavigate?.('employees')}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-right cursor-pointer group flex flex-col justify-between min-h-[170px]"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <Users size={28} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-850 text-lg group-hover:text-indigo-600 transition-colors">إدارية الموظفين</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">إضافة وتعديل بيانات الموظفين وتعيين البصمات والرواتب الأساسية</p>
            </div>
          </button>

          {/* Gate 3: Excel Import Engine */}
          <button 
            onClick={() => onNavigate?.('import')}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-right cursor-pointer group flex flex-col justify-between min-h-[170px]"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-850 text-lg group-hover:text-indigo-600 transition-colors">استيراد البصمة (Excel)</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">رفع وتفريغ ملف البصمة الشهري لتحديث مواقيت الحضور ذاتياً</p>
            </div>
          </button>

          {/* Gate 4: Reports Generator */}
          <button 
            onClick={() => onNavigate?.('reports')}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-right cursor-pointer group flex flex-col justify-between min-h-[170px]"
          >
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <FileText size={28} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-850 text-lg group-hover:text-indigo-600 transition-colors">التقارير والكشوفات</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">تصدير مسيرات الرواتب واحتساب الخصومات الإجمالية وطباعة PDF</p>
            </div>
          </button>

          {/* Gate 5: Shift Settings */}
          <button 
            onClick={() => onNavigate?.('settings')}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-right cursor-pointer group flex flex-col justify-between min-h-[170px]"
          >
            <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-slate-700 group-hover:text-white transition-all duration-300 shadow-sm">
              <Settings size={28} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-850 text-lg group-hover:text-indigo-600 transition-colors">الإعدادات والورديات</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">تعديل اسم الشركة، مواقيت الورديات وقواعد التأخير والخصم</p>
            </div>
          </button>
        </div>
      </div>

      {/* 6 Quick Stats Counters Bento Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5 px-1 font-sans">
          <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
          التحليلات والمؤشرات الإحصائية الحالية
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Card 1: Employees */}
          <div 
            onClick={() => onNavigate?.('employees')}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-md cursor-pointer"
          >
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100/50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-slate-400 font-bold text-xs">إجمالي الموظفين</h3>
                <p className="text-3xl font-black text-slate-800 mt-1">{stats.totalEmps}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Attendance */}
          <div 
            onClick={() => onNavigate?.('attendance')}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-md cursor-pointer"
          >
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100/50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <CheckCircle size={18} />
              </div>
              <div>
                <h3 className="text-slate-400 font-bold text-xs">أيام الحضور</h3>
                <p className="text-3xl font-black text-slate-800 mt-1">{stats.attendance}</p>
              </div>
            </div>
          </div>

          {/* Card 3: Absence */}
          <div 
            onClick={() => onNavigate?.('attendance')}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-md cursor-pointer"
          >
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-10 h-10 bg-rose-50 border border-rose-100/50 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                <XCircle size={18} />
              </div>
              <div>
                <h3 className="text-slate-400 font-bold text-xs">أيام الغياب</h3>
                <p className="text-3xl font-black text-rose-600 mt-1">{stats.absent}</p>
              </div>
            </div>
          </div>

          {/* Card 4: Leaves */}
          <div 
            onClick={() => onNavigate?.('attendance')}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-md cursor-pointer"
          >
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-10 h-10 bg-amber-50 border border-amber-100/50 text-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="text-slate-400 font-bold text-xs">الإجازات والعطلات</h3>
                <p className="text-3xl font-black text-amber-600 mt-1">{stats.leaves}</p>
              </div>
            </div>
          </div>

          {/* Card 5: Excuses */}
          <div 
            onClick={() => onNavigate?.('attendance')}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-md cursor-pointer"
          >
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyan-50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-10 h-10 bg-cyan-50 border border-cyan-100/50 text-cyan-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-slate-400 font-bold text-xs">الأذونات والتصاريح</h3>
                <p className="text-3xl font-black text-cyan-600 mt-1">{stats.excuses}</p>
              </div>
            </div>
          </div>

          {/* Card 6: Missions */}
          <div 
            onClick={() => onNavigate?.('attendance')}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-md cursor-pointer"
          >
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-10 h-10 bg-purple-50 border border-purple-100/50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <Briefcase size={18} />
              </div>
              <div>
                <h3 className="text-slate-400 font-bold text-xs">المأموريات والمهام</h3>
                <p className="text-3xl font-black text-purple-600 mt-1">{stats.missions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Lateness and Shifts Delay Highlights Section */}
      <div className="space-y-5 animate-slideUp">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 leading-tight">
                كاشف ومطابق تأخير الورديات للشهر الحالي
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                تحديد تلقائي للموظفين الأكثر تأخيراً عن توقيت الورديات النشطة ودرجات الامتثال
              </p>
            </div>
          </div>
          
          {/* Elegant Month Picker Input */}
          <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm shrink-0 self-start sm:self-center">
            <span className="text-xs font-black text-slate-500">اختر الشهر للتصفية:</span>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="font-mono text-xs font-black text-rose-600 focus:outline-none cursor-pointer bg-transparent"
            />
          </div>
        </div>

        {topDelayed.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[2rem] p-12 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
              <CheckCircle size={32} />
            </div>
            <h4 className="font-extrabold text-slate-800 text-lg">انضباط كلي مثالي!</h4>
            <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed font-semibold">
              لا توجد حالات تأخير متبجحة أو مسجلة للموظفين بناءً على وردياتهم خلال الشهر المختار ({selectedMonth}). كادر الموظفين في غاية الالتزام بمواعيد الحضور والافتراضيات.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topDelayed.slice(0, 6).map((item, index) => {
              const hours = Math.floor(item.totalLateMins / 60);
              const mins = item.totalLateMins % 60;
              const formattedDuration = hours > 0 
                ? `${hours} ${hours >= 11 ? 'ساعة' : (hours >= 3 && hours <= 10 ? 'ساعات' : 'ساعة')} و ${mins} دقيقة` 
                : `${mins} دقيقة`;
              
              const rankBadgeStyles = [
                "bg-rose-500 text-white border-rose-600 ring-rose-100", // #1
                "bg-orange-500 text-white border-orange-600 ring-orange-100", // #2
                "bg-amber-500 text-white border-amber-600 ring-amber-100", // #3
              ][index] || "bg-slate-100 text-slate-600 border-slate-200 ring-slate-50";

              const maxLateVal = topDelayed[0]?.totalLateMins || 1;
              const latePercent = Math.min(100, Math.round((item.totalLateMins / maxLateVal) * 100));

              // Severity class
              const severityBg = index === 0 ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100';

              return (
                <div 
                  key={item.employee.id}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:border-rose-100 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Section */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 font-black text-lg shrink-0 group-hover:bg-rose-50 group-hover:text-rose-600 group-hover:border-rose-100 transition-all duration-300">
                          {item.employee.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-800 text-base truncate pr-1">{item.employee.name}</h4>
                          <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                            <span>كود: {item.employee.empId}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full inline-block"></span>
                            <span className="truncate">{item.employee.department || 'بدون قسم'}</span>
                          </p>
                        </div>
                      </div>

                      <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs shadow-sm ring-4 ${rankBadgeStyles}`} dir="ltr">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Meta Stats Content */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-50 text-xs font-bold text-slate-600">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 text-xs">الوردية المعيّنة:</span>
                        <div className="flex flex-col items-end">
                          <span className="text-indigo-600 text-xs font-extrabold">{item.shiftLabel}</span>
                          <span className="text-[10px] text-slate-400 font-medium font-mono" dir="ltr">{item.shiftStart} - {item.shiftEnd}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">مرات التأخير:</span>
                        <span className="text-rose-600 bg-rose-50/85 px-2.5 py-0.5 rounded-lg border border-rose-100/40 text-[11px] font-extrabold">
                          {item.delayDaysCount} {item.delayDaysCount >= 3 && item.delayDaysCount <= 10 ? 'أيام' : 'يوم'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">إجمالي مدة الفقد:</span>
                        <span className="text-slate-800 bg-slate-100/85 px-2.5 py-0.5 rounded-lg border border-slate-200/40 font-black text-[11px]">
                          {formattedDuration}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Relative gauge and Quick view action */}
                  <div className="mt-5 pt-4 border-t border-slate-50 space-y-3.5">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400">
                        <span>المرتبة النسبية للتأخير</span>
                        <span>{latePercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            index === 0 ? 'bg-rose-500' : index === 1 ? 'bg-orange-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${latePercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('reports');
                        }
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${severityBg}`}
                    >
                      <span>استعراض كشف الحضور المفصل</span>
                      <span className="text-sm font-black">←</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        <div className="flex-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm col-span-2">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <span className="w-2 h-7 bg-emerald-500 rounded-full inline-block font-sans"></span>
            تحليل الأداء العام الأسبوعي
          </h3>
          <div className="flex items-center justify-center py-10 text-slate-400 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
            <div className="text-center space-y-1 bg-transparent">
              <TrendingUp size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">مؤشرات الأداء تعمل بشكل ممتاز</p>
              <p className="text-xs text-slate-400">انقر على أي موديول من بوابات التحكم أعلاه لاستعراض أو تعديل بياناته مباشرة</p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <HelpCircle size={100} />
            </div>
            <h3 className="text-xl font-black mb-4 relative z-10">البيانات المحلية الآمنة</h3>
            <p className="text-indigo-200/90 text-sm leading-relaxed relative z-10 mb-6 font-medium">
              تُحفَظ جميع إحصائيات الدوان وكشوف البصمات ومعلومات الموظفين بشكل مشفر كلياً داخل المتصفح (Offline HTML5 Store). ننصح دائماً بعمل تصدير دوري.
            </p>
            <button 
              onClick={() => onNavigate?.('settings')}
              className="w-full bg-white/10 hover:bg-white text-white hover:text-indigo-950 p-3.5 rounded-2xl font-black text-sm transition-all duration-300 relative z-10 hover:shadow-lg cursor-pointer"
            >
              الذهاب لإعدادات النسخ الاحتياطي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
