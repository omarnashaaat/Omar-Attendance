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

export interface AppSettings {
  companyName: string;
  weekendDays: number[]; // 0 = Sunday, 5 = Friday, 6 = Saturday
  defaultShiftStart: string;
  defaultShiftEnd: string;
  lateDeductionRate: number; // Value per minute/hour or fixed percentage depending on logic
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'شركتي',
  weekendDays: [5, 6], // Fri, Sat default
  defaultShiftStart: '09:00',
  defaultShiftEnd: '17:00',
  lateDeductionRate: 1,
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

export const getSettings = (): AppSettings => ls.get('settings', DEFAULT_SETTINGS);
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
