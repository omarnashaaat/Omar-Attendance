import { useState, useEffect } from 'react';
import { Employee, Shift, getEmployees, saveEmployees, getSettings } from '../store';
import { generateId } from '../utils';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Building, 
  DollarSign, 
  Clock, 
  X, 
  Check, 
  Search,
  Briefcase
} from 'lucide-react';

export default function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setEmployees(getEmployees());
    setShifts(getSettings().shifts || []);
  }, []);

  const openForm = (emp?: Employee) => {
    // Reload latest shifts from settings
    const currentShifts = getSettings().shifts || [];
    setShifts(currentShifts);

    if (emp) {
      setFormData(emp);
      setEditingId(emp.id);
    } else {
      const settings = getSettings();
      setFormData({
        empId: '', 
        name: '', 
        department: '',
        shiftStart: settings.defaultShiftStart,
        shiftEnd: settings.defaultShiftEnd,
        salary: 0
      });
      setEditingId(null);
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.empId) {
      alert('يرجى ملء الحقول الإلزامية: الرقم الوظيفي والاسم.');
      return;
    }
    
    let updated: Employee[];
    if (editingId) {
      updated = employees.map(e => e.id === editingId ? { ...formData, id: editingId } as Employee : e);
    } else {
      // Check if ID already exists
      if (employees.some(e => e.empId === formData.empId)) {
        alert('⚠️ الرقم الوظيفي الذي أدخلته مسجل بالفعل لموظف آخر!');
        return;
      }
      updated = [...employees, { ...formData, id: generateId() } as Employee];
    }
    
    setEmployees(updated);
    saveEmployees(updated);
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟ سيتم إلغاء أرشفته من قائمة الموظفين النشطين.')) return;
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    saveEmployees(updated);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-2.5 h-7 bg-indigo-600 rounded-full inline-block"></span>
            إدارة شؤون الموظفين
          </h2>
          <p className="text-slate-500 font-medium mt-1">إضافة، تعديل وتعيين الورديات وساعات الدوام للموظفين</p>
        </div>
        <button 
          onClick={() => openForm()}
          className="bg-indigo-600 text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/10 transition-all duration-300 flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <UserPlus size={18} />
          إضافة موظف جديد
        </button>
      </div>

      {/* Searchbar */}
      <div className="relative">
        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
          <Search size={18} />
        </span>
        <input 
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="ابحث بالاسم، الرقم الوظيفي، أو القسم الكلي..."
          className="w-full bg-white border border-slate-100 placeholder-slate-400 text-slate-700 rounded-2xl pr-11 pl-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-sm"
        />
      </div>

      {/* Editor Modal / Form Container */}
      {isFormOpen && (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-indigo-100 shadow-md space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span className="w-2 h-5 bg-emerald-500 rounded-full"></span>
              {editingId ? 'تعديل بيانات ملف الموظف' : 'تسجيل ملف موظف جديد بالشركة'}
            </h3>
            <button 
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">الرقم الوظيفي (مطلوب)</label>
              <input 
                type="text" 
                value={formData.empId || ''} 
                onChange={e => setFormData({...formData, empId: e.target.value})} 
                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition" 
                placeholder="مثال: EMP-101"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">الاسم الكامل للموظف (مطلوب)</label>
              <input 
                type="text" 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition"
                placeholder="مثال: أحمد محمد علي"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">القسم / الإدارة</label>
              <input 
                type="text" 
                value={formData.department || ''} 
                onChange={e => setFormData({...formData, department: e.target.value})} 
                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition"
                placeholder="مثال: المبيعات، المحاسبة..."
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">الراتب الأساسي</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold text-xs pointer-events-none">ريال</span>
                <input 
                  type="number" 
                  value={formData.salary || 0} 
                  onChange={e => setFormData({...formData, salary: parseInt(e.target.value) || 0})} 
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition pl-12" 
                />
              </div>
            </div>

            {/* Quick Shift Selector to populate values dynamically */}
            <div className="md:col-span-2 bg-slate-50/50 p-4 border border-dashed border-slate-200 rounded-2xl space-y-3">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-0.5">اختيار وتطبيق وردية العمل الجاهزة (Shift)</label>
              
              <select 
                onChange={e => {
                  const selectedId = e.target.value;
                  if (selectedId && selectedId !== 'custom') {
                    const found = shifts.find(s => s.id === selectedId);
                    if (found) {
                      setFormData({
                        ...formData,
                        shiftStart: found.start,
                        shiftEnd: found.end
                      });
                    }
                  }
                }}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-extrabold text-slate-700 bg-white shadow-sm"
              >
                <option value="">-- اضغط هنا لاختيار وردية العمل لتعبئة الأوقات بالأسفل تلقائياً --</option>
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (من {s.start} إلى {s.end})
                  </option>
                ))}
                <option value="custom">⚙️ ساعات دوام مخصصة ومعدلة يدوياً</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">بداية الدوام اليومي</label>
              <input 
                type="time" 
                value={formData.shiftStart || ''} 
                onChange={e => setFormData({...formData, shiftStart: e.target.value})} 
                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition" 
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">نهاية الدوام اليومي</label>
              <input 
                type="time" 
                value={formData.shiftEnd || ''} 
                onChange={e => setFormData({...formData, shiftEnd: e.target.value})} 
                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition" 
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-2 justify-end">
            <button 
              onClick={() => setIsFormOpen(false)} 
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-5 py-3 rounded-xl transition cursor-pointer"
            >
              إلغاء
            </button>
            <button 
              onClick={handleSave} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md shadow-indigo-600/10 transition cursor-pointer flex items-center gap-1"
            >
              <Check size={14} className="stroke-[3]" />
              حفظ الملف
            </button>
          </div>
        </div>
      )}

      {/* Employees grid/table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 bg-slate-50/20">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">قائمة الموظفين المفعلين بالمنشأة</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs font-black">
              <tr>
                <th className="p-4 text-start">الرقم الوظيفي</th>
                <th className="p-4 text-start">اسم الموظف</th>
                <th className="p-4 text-start">القسم</th>
                <th className="p-4 text-start">ساعات الدوام اليومي</th>
                <th className="p-4 text-start">الراتب الأساسي</th>
                <th className="p-4 text-start">الوردية المقاربة</th>
                <th className="p-4 text-center">الإجراءات والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    لا يوجد أي موظف مطابق للبحث أو مضاف حالياً. اضغط على "إضافة موظف جديد" للبدء.
                  </td>
                </tr>
              ) : filteredEmployees.map(emp => {
                // Find matching shift name for decoration/reference
                const matchedShift = shifts.find(s => s.start === emp.shiftStart && s.end === emp.shiftEnd);

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="p-4 font-black text-slate-700 text-sm">{emp.empId}</td>
                    <td className="p-4 font-black text-slate-800 text-sm">{emp.name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold inline-block">
                        {emp.department || '-'}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-600 dir-ltr text-right">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
                        {emp.shiftStart} - {emp.shiftEnd}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-slate-700 text-sm">
                      {emp.salary ? `${emp.salary.toLocaleString()} ريال` : '0 ريال'}
                    </td>
                    <td className="p-4">
                      {matchedShift ? (
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-[11px] font-black">
                          {matchedShift.name}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-lg text-[11px] font-black">
                          دوام خاص
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openForm(emp)} 
                          className="px-3 py-1.5 bg-slate-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} />
                          تعديل
                        </button>
                        <button 
                          onClick={() => handleDelete(emp.id)} 
                          className="px-3 py-1.5 bg-slate-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
