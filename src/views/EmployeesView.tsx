import { useState, useEffect } from 'react';
import { Employee, getEmployees, saveEmployees, getSettings } from '../store';
import { generateId } from '../utils';

export default function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    setEmployees(getEmployees());
  }, []);

  const openForm = (emp?: Employee) => {
    if (emp) {
      setFormData(emp);
      setEditingId(emp.id);
    } else {
      const settings = getSettings();
      setFormData({
        empId: '', name: '', department: '',
        shiftStart: settings.defaultShiftStart,
        shiftEnd: settings.defaultShiftEnd,
        salary: 0
      });
      setEditingId(null);
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.empId) return;
    
    let updated: Employee[];
    if (editingId) {
      updated = employees.map(e => e.id === editingId ? { ...formData, id: editingId } as Employee : e);
    } else {
      updated = [...employees, { ...formData, id: generateId() } as Employee];
    }
    
    setEmployees(updated);
    saveEmployees(updated);
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    saveEmployees(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">إدارة الموظفين</h2>
        <button 
          onClick={() => openForm()}
          className="bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
        >
          إضافة موظف جديد
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-xl font-bold mb-4">{editingId ? 'تعديل موظف' : 'إضافة موظف'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الرقم الوظيفي</label>
              <input type="text" value={formData.empId || ''} onChange={e => setFormData({...formData, empId: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الاسم</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">القسم</label>
              <input type="text" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الراتب الأساسي</label>
              <input type="number" value={formData.salary || 0} onChange={e => setFormData({...formData, salary: parseInt(e.target.value) || 0})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">بداية الدوام</label>
              <input type="time" value={formData.shiftStart || ''} onChange={e => setFormData({...formData, shiftStart: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نهاية الدوام</label>
              <input type="time" value={formData.shiftEnd || ''} onChange={e => setFormData({...formData, shiftEnd: e.target.value})} className="w-full border p-2 rounded" />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <button onClick={handleSave} className="bg-brand-green text-white px-4 py-2 rounded-lg">حفظ</button>
            <button onClick={() => setIsFormOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">إلغاء</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-start">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
            <tr>
              <th className="p-4 font-semibold text-start">الرقم</th>
              <th className="p-4 font-semibold text-start">الاسم</th>
              <th className="p-4 font-semibold text-start">القسم</th>
              <th className="p-4 font-semibold text-start">أوقات الدوام</th>
              <th className="p-4 font-semibold text-start">الراتب</th>
              <th className="p-4 font-semibold text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">لا يوجد موظفين حالياً</td></tr>
            ) : employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="p-4">{emp.empId}</td>
                <td className="p-4 font-medium">{emp.name}</td>
                <td className="p-4">{emp.department}</td>
                <td className="p-4 dir-ltr text-end">{emp.shiftStart} - {emp.shiftEnd}</td>
                <td className="p-4">{emp.salary}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => openForm(emp)} className="text-brand-blue hover:text-blue-900 text-sm">تعديل</button>
                  <button onClick={() => handleDelete(emp.id)} className="text-brand-red hover:text-red-800 text-sm">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
