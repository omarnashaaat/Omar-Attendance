import { useState, useEffect } from 'react';
import { AppSettings, getSettings, saveSettings } from '../store';

export default function SettingsView() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleChange = (field: keyof AppSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const days = [
    { id: 0, label: 'الأحد' },
    { id: 1, label: 'الإثنين' },
    { id: 2, label: 'الثلاثاء' },
    { id: 3, label: 'الأربعاء' },
    { id: 4, label: 'الخميس' },
    { id: 5, label: 'الجمعة' },
    { id: 6, label: 'السبت' },
  ];

  const handleDayToggle = (dayId: number) => {
    if (!settings) return;
    const newDays = settings.weekendDays.includes(dayId)
      ? settings.weekendDays.filter(d => d !== dayId)
      : [...settings.weekendDays, dayId];
    handleChange('weekendDays', newDays);
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800">الإعدادات</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة</label>
          <input 
            type="text" 
            value={settings.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-brand-blue focus:border-brand-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">أيام الإجازة الأسبوعية</label>
          <div className="flex flex-wrap gap-2">
            {days.map(day => (
              <button
                key={day.id}
                onClick={() => handleDayToggle(day.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                  ${settings.weekendDays.includes(day.id) 
                    ? 'bg-brand-blue text-white border-brand-blue' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">بداية الدوام الافتراضي</label>
            <input 
              type="time" 
              value={settings.defaultShiftStart}
              onChange={(e) => handleChange('defaultShiftStart', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نهاية الدوام الافتراضي</label>
            <input 
              type="time" 
              value={settings.defaultShiftEnd}
              onChange={(e) => handleChange('defaultShiftEnd', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">معدل الخصم للتأخير (مضاعف)</label>
          <input 
            type="number" 
            step="0.1"
            value={settings.lateDeductionRate}
            onChange={(e) => handleChange('lateDeductionRate', parseFloat(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6 text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">تنزيل النظام الدائم (النسخة المستقلة)</h3>
        <p className="text-sm text-gray-600 mb-4">
          يمكنك تحميل الموقع بأكمله كملف HTML واحد يعمل بدون انترنت للإحتفاظ ببياناتك على جهازك.
        </p>
        <a 
          href="/dist/attendance-system.html" 
          download="Attendance-System.html"
          className="inline-block bg-green-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-green-700 transition"
        >
          📥 تنزيل النظام (ملف واحد)
        </a>
      </div>
    </div>
  );
}
