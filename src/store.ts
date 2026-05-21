export interface Employee {
  id: string;
  empId: string;
  name: string;
  department: string;
  shiftStart: string;
  shiftEnd: string;
  salary: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  timeIn: string; // HH:mm
  timeOut: string; // HH:mm
  notes: string;
  isAbsent: boolean;
  manualLate?: string;
  manualEarly?: string;
  manualDed?: string;
  manualOT?: string;
  recordType?: string;
}

export interface Shift {
  id: string;
  name: string;
  start: string;
  end: string;
}

export interface LatenessRule {
  id: string;
  name: string;
  minMins: number;
  maxMins: number;
  p1Value: number;   // 1st occurrence in month
  p1Type: 'hours' | 'days' | 'warning';
  p2Value: number;   // 2nd occurrence
  p2Type: 'hours' | 'days' | 'warning';
  p3Value: number;   // 3rd occurrence
  p3Type: 'hours' | 'days' | 'warning';
  p4Value: number;   // 4th+ occurrence
  p4Type: 'hours' | 'days' | 'warning';
}

export interface AppSettings {
  companyName: string;
  weekendDays: number[]; // 0 = Sunday, 5 = Friday, 6 = Saturday
  defaultShiftStart: string;
  defaultShiftEnd: string;
  lateDeductionRate: number; // Value per minute/hour or fixed percentage depending on logic
  shifts?: Shift[];
  latenessRules?: LatenessRule[];
  enableLatenessPolicy?: boolean;
}

const DEFAULT_LATENESS_RULES: LatenessRule[] = [
  {
    id: 'lr-1',
    name: 'تأخير بسيط (من 5 إلى 15 دقيقة)',
    minMins: 5,
    maxMins: 15,
    p1Value: 0, p1Type: 'warning',
    p2Value: 0.25, p2Type: 'hours',
    p3Value: 0.5, p3Type: 'hours',
    p4Value: 1, p4Type: 'hours'
  },
  {
    id: 'lr-2',
    name: 'تأخير متوسط (من 16 إلى 30 دقيقة)',
    minMins: 16,
    maxMins: 30,
    p1Value: 0.25, p1Type: 'hours',
    p2Value: 0.5, p2Type: 'hours',
    p3Value: 1, p3Type: 'hours',
    p4Value: 0.25, p4Type: 'days'
  },
  {
    id: 'lr-3',
    name: 'تأخير متقدم (من 31 إلى 60 دقيقة)',
    minMins: 31,
    maxMins: 60,
    p1Value: 0.5, p1Type: 'hours',
    p2Value: 1, p2Type: 'hours',
    p3Value: 0.25, p3Type: 'days',
    p4Value: 0.5, p4Type: 'days'
  },
  {
    id: 'lr-4',
    name: 'تأخير جسيم (أكثر من 60 دقيقة)',
    minMins: 61,
    maxMins: 9999,
    p1Value: 0.25, p1Type: 'days',
    p2Value: 0.5, p2Type: 'days',
    p3Value: 1, p3Type: 'days',
    p4Value: 2, p4Type: 'days'
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'شركتي',
  weekendDays: [5, 6], // Fri, Sat default
  defaultShiftStart: '09:00',
  defaultShiftEnd: '17:00',
  lateDeductionRate: 1,
  enableLatenessPolicy: true,
  shifts: [
    { id: '1', name: 'الوردية الصباحية (الأولى)', start: '09:00', end: '17:00' },
    { id: '2', name: 'الوردية المسائية (الثانية)', start: '17:00', end: '01:00' },
    { id: '3', name: 'الوردية الليلية (الثالثة)', start: '01:00', end: '09:00' }
  ],
  latenessRules: DEFAULT_LATENESS_RULES
};

// Generic LocalStorage Wrapper
export const ls = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Save to localStorage failed', e);
    }
  }
};

export const getEmployees = (): Employee[] => ls.get('employees', []);
export const saveEmployees = (data: Employee[]) => ls.set('employees', data);

export const getAttendance = (): AttendanceRecord[] => ls.get('attendance', []);
export const saveAttendance = (data: AttendanceRecord[]) => ls.set('attendance', data);

export const getSettings = (): AppSettings => {
  const current = ls.get('settings', DEFAULT_SETTINGS);
  if (!current.shifts || current.shifts.length === 0) {
    current.shifts = DEFAULT_SETTINGS.shifts;
  }
  if (!current.latenessRules || current.latenessRules.length === 0) {
    current.latenessRules = DEFAULT_SETTINGS.latenessRules;
  }
  if (current.enableLatenessPolicy === undefined) {
    current.enableLatenessPolicy = DEFAULT_SETTINGS.enableLatenessPolicy;
  }
  return current;
};
export const saveSettings = (data: AppSettings) => ls.set('settings', data);

export const exportData = () => {
    const data = {
        employees: getEmployees(),
        attendance: getAttendance(),
        settings: getSettings()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
