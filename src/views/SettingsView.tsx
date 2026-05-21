import { useState, useEffect } from 'react';
import { AppSettings, Shift, getSettings, saveSettings } from '../store';
import { 
  Building2, 
  Settings, 
  CalendarRange, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3,
  Download,
  Percent,
  Check,
  Briefcase
} from 'lucide-react';

export default function SettingsView() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Shift creation/editing states
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftStart, setNewShiftStart] = useState('09:00');
  const [newShiftEnd, setNewShiftEnd] = useState('17:00');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Lateness Rules form state
  const [ruleName, setRuleName] = useState('');
  const [ruleMin, setRuleMin] = useState(0);
  const [ruleMax, setRuleMax] = useState(30);
  const [p1Val, setP1Val] = useState(0);
  const [p1Type, setP1Type] = useState<'hours' | 'days' | 'warning'>('warning');
  const [p2Val, setP2Val] = useState(0.25);
  const [p2Type, setP2Type] = useState<'hours' | 'days' | 'warning'>('hours');
  const [p3Val, setP3Val] = useState(0.5);
  const [p3Type, setP3Type] = useState<'hours' | 'days' | 'warning'>('hours');
  const [p4Val, setP4Val] = useState(1);
  const [p4Type, setP4Type] = useState<'hours' | 'days' | 'warning'>('hours');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleChange = (field: keyof AppSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSaveRule = () => {
    if (!settings || !ruleName.trim()) return;
    const currentRules = settings.latenessRules || [];

    const newRule = {
      id: editingRuleId || Date.now().toString(),
      name: ruleName,
      minMins: Number(ruleMin),
      maxMins: Number(ruleMax),
      p1Value: p1Type === 'warning' ? 0 : Number(p1Val),
      p1Type,
      p2Value: p2Type === 'warning' ? 0 : Number(p2Val),
      p2Type,
      p3Value: p3Type === 'warning' ? 0 : Number(p3Val),
      p3Type,
      p4Value: p4Type === 'warning' ? 0 : Number(p4Val),
      p4Type
    };

    let updatedRules;
    if (editingRuleId) {
      updatedRules = currentRules.map(r => r.id === editingRuleId ? newRule : r);
      setEditingRuleId(null);
    } else {
      updatedRules = [...currentRules, newRule];
    }

    handleChange('latenessRules', updatedRules);
    
    // reset rule form
    setRuleName('');
    setRuleMin(0);
    setRuleMax(30);
    setP1Val(0); setP1Type('warning');
    setP2Val(0.25); setP2Type('hours');
    setP3Val(0.5); setP3Type('hours');
    setP4Val(1); setP4Type('hours');
  };

  const handleEditRuleClick = (rule: any) => {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setRuleMin(rule.minMins);
    setRuleMax(rule.maxMins);
    setP1Val(rule.p1Value); setP1Type(rule.p1Type);
    setP2Val(rule.p2Value); setP2Type(rule.p2Type);
    setP3Val(rule.p3Value); setP3Type(rule.p3Type);
    setP4Val(rule.p4Value); setP4Type(rule.p4Type);
  };

  const handleDeleteRule = (id: string) => {
    if (!settings) return;
    const currentRules = settings.latenessRules || [];
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه المخالفة من نظام الخصومات التلقائي؟')) {
      handleChange('latenessRules', currentRules.filter(r => r.id !== id));
      if (editingRuleId === id) {
        setEditingRuleId(null);
        setRuleName('');
      }
    }
  };

  const handleResetRulesToDefault = () => {
    if (confirm('تنبيه: سيؤدي هذا إلى تهيئة وحذف التعديلات المخصصة لجدول الجزاءات وإعادة تعيين اللائحة القانونية والافتراضية للتأخير (ربع يوم، نصف يوم، يوم، ساعات). هل أنت متأكد؟')) {
      const DEFAULT_LATENESS_RULES = [
        {
          id: 'lr-1',
          name: 'تأخير بسيط (من 5 إلى 15 دقيقة)',
          minMins: 5,
          maxMins: 15,
          p1Value: 0, p1Type: 'warning' as const,
          p2Value: 0.25, p2Type: 'hours' as const,
          p3Value: 0.5, p3Type: 'hours' as const,
          p4Value: 1, p4Type: 'hours' as const
        },
        {
          id: 'lr-2',
          name: 'تأخير متوسط (من 16 إلى 30 دقيقة)',
          minMins: 16,
          maxMins: 30,
          p1Value: 0.25, p1Type: 'hours' as const,
          p2Value: 0.5, p2Type: 'hours' as const,
          p3Value: 1, p3Type: 'hours' as const,
          p4Value: 0.25, p4Type: 'days' as const
        },
        {
          id: 'lr-3',
          name: 'تأخير متقدم (من 31 إلى 60 دقيقة)',
          minMins: 31,
          maxMins: 60,
          p1Value: 0.5, p1Type: 'hours' as const,
          p2Value: 1, p2Type: 'hours' as const,
          p3Value: 0.25, p3Type: 'days' as const,
          p4Value: 0.5, p4Type: 'days' as const
        },
        {
          id: 'lr-4',
          name: 'تأخير جسيم (أكثر من 60 دقيقة)',
          minMins: 61,
          maxMins: 9999,
          p1Value: 0.25, p1Type: 'days' as const,
          p2Value: 0.5, p2Type: 'days' as const,
          p3Value: 1, p3Type: 'days' as const,
          p4Value: 2, p4Type: 'days' as const
        }
      ];
      handleChange('latenessRules', DEFAULT_LATENESS_RULES);
    }
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

  // Shift Actions
  const handleSaveShift = () => {
    if (!settings || !newShiftName.trim()) return;
    const currentShifts = settings.shifts || [];

    if (editingId) {
      // Edit existing shift
      const updatedShifts = currentShifts.map(s => 
        s.id === editingId 
          ? { ...s, name: newShiftName, start: newShiftStart, end: newShiftEnd }
          : s
      );
      handleChange('shifts', updatedShifts);
      setEditingId(null);
    } else {
      // Add new shift
      const newShiftObj: Shift = {
        id: Date.now().toString(),
        name: newShiftName,
        start: newShiftStart,
        end: newShiftEnd
      };
      handleChange('shifts', [...currentShifts, newShiftObj]);
    }

    // Reset shift form inputs
    setNewShiftName('');
    setNewShiftStart('09:00');
    setNewShiftEnd('17:00');
  };

  const handleEditShiftClick = (shift: Shift) => {
    setEditingId(shift.id);
    setNewShiftName(shift.name);
    setNewShiftStart(shift.start);
    setNewShiftEnd(shift.end);
  };

  const handleDeleteShift = (id: string) => {
    if (!settings) return;
    const currentShifts = settings.shifts || [];
    
    if (currentShifts.length <= 1) {
      alert('⚠️ يجب الإبقاء على شيفت (دوام) واحد على الأقل في النظام لتفادي حدوث مشاكل!');
      return;
    }

    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الدوام؟ جميع الموظفين المرتبطين به يمكنهم تعديله لاحقاً.')) {
      const updatedShifts = currentShifts.filter(s => s.id !== id);
      handleChange('shifts', updatedShifts);
      
      // If we deleted the shift we were editing, reset the form
      if (editingId === id) {
        setEditingId(null);
        setNewShiftName('');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewShiftName('');
    setNewShiftStart('09:00');
    setNewShiftEnd('17:00');
  };

  if (!settings) return null;

  const currentShifts = settings.shifts || [];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Settings Header */}
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-8 bg-indigo-600 rounded-full inline-block"></span>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          إعدادات النظام العامة والورديات
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: main system settings and weekend */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Company & General parameters */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Building2 className="text-indigo-600 w-5 h-5" />
              المعلومات الأساسية للمنشأة
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">اسم الشركة أو المنشأة</label>
                <input 
                  type="text" 
                  value={settings.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3 text-slate-700 font-medium transition duration-200"
                  placeholder="شركة التقنية الحديثة..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">أيام الإجازة والأعطال الأسبوعية</label>
                <div className="flex flex-wrap gap-2">
                  {days.map(day => {
                    const isActive = settings.weekendDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleDayToggle(day.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1 cursor-pointer
                          ${isActive 
                            ? 'bg-rose-50 border border-rose-200 text-rose-600 shadow-sm' 
                            : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {isActive && <Check size={14} className="stroke-[3]" />}
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Shifting Timings Management */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Briefcase className="text-indigo-600 w-5 h-5" />
              إدارية فترات العمل المتعددة (الورديات / Shifts)
            </h3>

            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              يمكنك هنا إضافة وتخصيص ورديات دوام متعددة ومختلفة بالشركة (صباحي، مسائي، جزئي)، ليتسنى لك ربط ودمج كل موظف على حدة بالشيفت المناسب له.
            </p>

            {/* List of current shifts */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">الورديات المفعلة حالياً في النظام</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentShifts.map((shift) => (
                  <div key={shift.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-indigo-50/50 hover:border-indigo-100 transition-all duration-300">
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-3 bg-indigo-600 rounded-full inline-block"></span>
                        {shift.name}
                      </p>
                      <p className="text-xs text-slate-400 dir-ltr text-right flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        <span>{shift.start} - {shift.end}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleEditShiftClick(shift)}
                        className="p-1.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition border border-slate-200/50 cursor-pointer" 
                        title="تعديل"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteShift(shift.id)}
                        className="p-1.5 bg-white text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition border border-slate-200/50 cursor-pointer" 
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Form to Add / Edit Shift */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Plus size={16} className="text-indigo-600" />
                {editingId ? 'تعديل بيانات الدوام' : 'إضافة دوام شيفت جديد للنظام'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1">مسمى الشيفت</label>
                  <input 
                    type="text" 
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-indigo-100"
                    placeholder="مثال: شيفت مسائي، رمضان..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1">وقت الحضور</label>
                  <input 
                    type="time" 
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1">وقت الانصراف</label>
                  <input 
                    type="time" 
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                {editingId && (
                  <button 
                    onClick={handleCancelEdit}
                    type="button" 
                    className="bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-300 transition cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveShift}
                  disabled={!newShiftName.trim()}
                  className={`font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer text-white flex items-center gap-1.5
                    ${newShiftName.trim() 
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10' 
                      : 'bg-slate-300 cursor-not-allowed'}`}
                >
                  {editingId ? 'تعديل وحفظ الشيفت' : 'إضافة الشيفت لقائمة النظام'}
                </button>
              </div>
            </div>

          </div>

          {/* Card: Lateness Policies / Company Penalty Rules */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Settings className="text-rose-600 w-5 h-5 animate-spin-slow" />
                لوائح وجدول جزاءات التأخير (أيام وساعات)
              </h3>
              
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <span className="text-[11px] font-black text-slate-500">تفعيل اللائحة التلقائية:</span>
                <button
                  type="button"
                  onClick={() => handleChange('enableLatenessPolicy', !settings.enableLatenessPolicy)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                    settings.enableLatenessPolicy ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 transform ${
                    settings.enableLatenessPolicy ? 'translate-x-[0px]' : 'translate-x-[16px]'
                  }`} />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-505 leading-relaxed font-bold text-slate-400">
              تتيح لك اللائحة معاقبة التأخير بشكل تتابعي متدرج في نفس الشهر لكل موظف طبقاً لقانون العمل بالشركة (المخالفة الأولى، الثانية، الثالثة، الرابعة وتتعلق بنوع الخصم أيام أو ساعات أو إنذار كتابي). يتم تطبيق الحسبة تلقائياً في صفحة التقارير.
            </p>

            {settings.enableLatenessPolicy && (
              <div className="space-y-6">
                
                {/* Rules List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">مصفوفة القواعد المطبقة حالياً</label>
                    <button
                      type="button"
                      onClick={handleResetRulesToDefault}
                      className="text-[10px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      🔄 إعادة تعيين للائحة الافتراضية
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {(settings.latenessRules || []).map((rule) => {
                      const displayPenalty = (val: number, type: string) => {
                        if (type === 'warning') return 'تنبيه كتابي';
                        return `${val} ${type === 'days' ? 'يوم' : 'ساعة'}`;
                      };

                      return (
                        <div key={rule.id} className="p-4 bg-slate-50/70 border border-slate-100/80 rounded-2xl space-y-3 hover:bg-slate-50 transition-all duration-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                {rule.name}
                              </h5>
                              <p className="text-[10px] font-bold text-slate-400 mt-1">
                                للمدة من {rule.minMins} إلى {rule.maxMins === 9999 ? 'ما فوق' : `${rule.maxMins} دقيقة تأخير`}
                              </p>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditRuleClick(rule)}
                                className="p-1 px-2.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white text-[10px] font-black rounded-lg transition border border-slate-200/40 cursor-pointer"
                              >
                                تعديل
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-1 px-2.5 bg-white text-rose-600 hover:bg-rose-600 hover:text-white text-[10px] font-black rounded-lg transition border border-slate-200/40 cursor-pointer"
                              >
                                حذف
                              </button>
                            </div>
                          </div>

                          {/* 4 Steps timeline grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-xl border border-slate-100/60 text-center text-[10px]" dir="rtl">
                            <div className="p-1 border-l border-slate-100">
                              <p className="text-slate-400 font-bold mb-0.5">المرة الأولى</p>
                              <p className="font-extrabold text-slate-800">{displayPenalty(rule.p1Value, rule.p1Type)}</p>
                            </div>
                            <div className="p-1 border-l border-slate-100">
                              <p className="text-slate-400 font-bold mb-0.5">المرة الثانية</p>
                              <p className="font-extrabold text-slate-800">{displayPenalty(rule.p2Value, rule.p2Type)}</p>
                            </div>
                            <div className="p-1 border-l border-slate-100">
                              <p className="text-slate-400 font-bold mb-0.5">المرة الثالثة</p>
                              <p className="font-extrabold text-slate-800">{displayPenalty(rule.p3Value, rule.p3Type)}</p>
                            </div>
                            <div className="p-1">
                              <p className="text-slate-450 font-bold mb-0.5">الكرّة الرابعة+</p>
                              <p className="font-extrabold text-rose-600">{displayPenalty(rule.p4Value, rule.p4Type)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rules Form */}
                <div className="bg-slate-50 border border-slate-100/80 p-5 rounded-3xl space-y-4">
                  <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Plus size={14} className="text-indigo-600" />
                    {editingRuleId ? 'تعديل قاعدة خصم التأخير حالياً' : 'إضافة شريحة مخالفة جديدة للائحة'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1">اسم الشريحة</label>
                      <input 
                        type="text" 
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold focus:ring-1 focus:ring-indigo-100 text-slate-700"
                        placeholder="مثال: من ربع لنصف ساعة"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1">الحد الأدنى للتأخير (دقائق)</label>
                      <input 
                        type="number" 
                        value={ruleMin}
                        onChange={(e) => setRuleMin(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:ring-1 focus:ring-indigo-100 text-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1">الحد الأقصى للتأخير (دقائق)</label>
                      <input 
                        type="number" 
                        value={ruleMax}
                        onChange={(e) => setRuleMax(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:ring-1 focus:ring-indigo-100 text-slate-700 font-mono"
                        placeholder="9999 تعني غير محدودة"
                      />
                    </div>
                  </div>

                  {/* Progressive penalties editor */}
                  <div className="space-y-3 pt-2">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">تحديد الجزاء لقيمة التكرار الشهري:</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-2xl border border-slate-100/70">
                      
                      {/* Occurrence 1 */}
                      <div className="space-y-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/50">
                        <label className="block text-[10px] font-extrabold text-slate-500">التكرار الأول</label>
                        <select
                          value={p1Type}
                          onChange={(e) => setP1Type(e.target.value as any)}
                          className="w-full text-[11px] bg-white border border-slate-205 rounded-xl p-1.5 font-bold text-slate-700"
                        >
                          <option value="warning">تنبيه كتابي</option>
                          <option value="hours">ساعات خصم</option>
                          <option value="days">أيام خصم</option>
                        </select>
                        {p1Type !== 'warning' && (
                          <input
                            type="number"
                            step="0.125"
                            value={p1Val}
                            onChange={(e) => setP1Val(parseFloat(e.target.value) || 0)}
                            className="w-full text-[11px] bg-white border border-slate-205 rounded-xl p-1.5 font-bold text-center text-slate-750 font-mono"
                            placeholder="عدد"
                          />
                        )}
                      </div>

                      {/* Occurrence 2 */}
                      <div className="space-y-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/50">
                        <label className="block text-[10px] font-extrabold text-slate-500">التكرار الثاني</label>
                        <select
                          value={p2Type}
                          onChange={(e) => setP2Type(e.target.value as any)}
                          className="w-full text-[11px] bg-white border border-slate-205 rounded-xl p-1.5 font-bold text-slate-700"
                        >
                          <option value="warning">تنبيه كتابي</option>
                          <option value="hours">ساعات خصم</option>
                          <option value="days">أيام خصم</option>
                        </select>
                        {p2Type !== 'warning' && (
                          <input
                            type="number"
                            step="0.125"
                            value={p2Val}
                            onChange={(e) => setP2Val(parseFloat(e.target.value) || 0)}
                            className="w-full text-[11px] bg-white border border-slate-205 rounded-xl p-1.5 font-bold text-center text-slate-750 font-mono"
                            placeholder="عدد"
                          />
                        )}
                      </div>

                      {/* Occurrence 3 */}
                      <div className="space-y-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/50">
                        <label className="block text-[10px] font-extrabold text-slate-500">التكرار الثالث</label>
                        <select
                          value={p3Type}
                          onChange={(e) => setP3Type(e.target.value as any)}
                          className="w-full text-[11px] bg-white border border-slate-205 rounded-xl p-1.5 font-bold text-slate-700"
                        >
                          <option value="warning">تنبيه كتابي</option>
                          <option value="hours">ساعات خصم</option>
                          <option value="days">أيام خصم</option>
                        </select>
                        {p3Type !== 'warning' && (
                          <input
                            type="number"
                            step="0.125"
                            value={p3Val}
                            onChange={(e) => setP3Val(parseFloat(e.target.value) || 0)}
                            className="w-full text-[11px] bg-white border border-slate-205 rounded-xl p-1.5 font-bold text-center text-slate-755 font-mono"
                            placeholder="عدد"
                          />
                        )}
                      </div>

                      {/* Occurrence 4 */}
                      <div className="space-y-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/50">
                        <label className="block text-[10px] font-extrabold text-slate-500">التكرار الرابع فما فوق</label>
                        <select
                          value={p4Type}
                          onChange={(e) => setP4Type(e.target.value as any)}
                          className="w-full text-[11px] bg-white border border-slate-205 rounded-xl p-1.5 font-bold text-slate-700"
                        >
                          <option value="warning">تنبيه كتابي</option>
                          <option value="hours">ساعات خصم</option>
                          <option value="days">أيام خصم</option>
                        </select>
                        {p4Type !== 'warning' && (
                          <input
                            type="number"
                            step="0.125"
                            value={p4Val}
                            onChange={(e) => setP4Val(parseFloat(e.target.value) || 0)}
                            className="w-full text-[11px] bg-white border border-slate-205 rounded-xl p-1.5 font-bold text-center text-slate-755 font-mono"
                            placeholder="عدد"
                          />
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Form Submission Buttons */}
                  <div className="flex gap-2 justify-end pt-1">
                    {editingRuleId && (
                      <button 
                        onClick={() => {
                          setEditingRuleId(null);
                          setRuleName('');
                        }}
                        type="button" 
                        className="bg-slate-200 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-xl hover:bg-slate-350 transition cursor-pointer"
                      >
                        إلغاء التعديل
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveRule}
                      disabled={!ruleName.trim()}
                      className={`font-bold text-[11px] px-4 py-2.5 rounded-xl transition cursor-pointer text-white flex items-center gap-1.5
                        ${ruleName.trim() 
                          ? 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/10' 
                          : 'bg-slate-300 cursor-not-allowed'}`}
                    >
                      {editingRuleId ? 'حفظ الشريحة المعدلة' : 'تأكيد وإضافة قاعدة المخالفة'}
                    </button>
                  </div>

                </div>

              </div>
            )}
          </div>

        </div>

        {/* Right Column: Other Settings Parameters / Local Backup Download */}
        <div className="space-y-6">
          
          {/* Card: Financial calculations */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Percent className="text-indigo-600 w-5 h-5" />
              المعاملات المالية والخصم
            </h3>
            
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">معدل مضاعف الخصم للتأخير</label>
              <input 
                type="number" 
                step="0.1"
                value={settings.lateDeductionRate}
                onChange={(e) => handleChange('lateDeductionRate', parseFloat(e.target.value) || 1)}
                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-slate-700 font-medium transition duration-200"
              />
              <p className="text-[11px] text-slate-400 mt-2 font-medium leading-normal">
                معدّل الضرب لساعات التأخير في حسابات الراتب (الافتراضي: 1.0 يعني خصم ساعة مقابل ساعة تأخير).
              </p>
            </div>
          </div>

          {/* Card: Offline Backup HTML */}
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-3">
              <Download className="text-indigo-400 w-5 h-5 animate-bounce" />
              النظام المستقل (HTML)
            </h3>
            
            <p className="text-xs text-indigo-100/90 leading-relaxed font-semibold mb-6">
              يُمكنك تصدير وتنزيل تطبيق إدارة الحضور بالكامل كملف مستقل واحد يعمل بالكامل دون حاجة للاتصال بالإنترنت! بياناتك مخزنة بأمان.
            </p>

            <a 
              href="/dist/attendance-system.html" 
              download="Attendance-System.html"
              className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black text-xs p-4 rounded-2xl transition duration-300 shadow-lg shadow-indigo-600/20"
            >
              📥 تحميل الموقع كملف واحد دائم
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
