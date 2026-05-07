import { useState } from 'react';
import { 
  Users, 
  CalendarClock, 
  Upload, 
  FileText, 
  Settings as SettingsIcon,
  LayoutDashboard
} from 'lucide-react';
import EmployeesView from './views/EmployeesView';
import AttendanceView from './views/AttendanceView';
import ImportView from './views/ImportView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import DashboardView from './views/DashboardView';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'لوحة القيادة', icon: <LayoutDashboard size={20} /> },
    { id: 'employees', label: 'الموظفين', icon: <Users size={20} /> },
    { id: 'attendance', label: 'الحضور والانصراف', icon: <CalendarClock size={20} /> },
    { id: 'import', label: 'رفع البصمة', icon: <Upload size={20} /> },
    { id: 'reports', label: 'التقارير', icon: <FileText size={20} /> },
    { id: 'settings', label: 'الإعدادات', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col print:hidden border-l border-slate-800">
        <div className="p-6 flex items-center justify-start h-20 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
              <CalendarClock size={20} />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">إدارة الحضور</h1>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1.5 px-4">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${currentView === item.id 
                      ? 'bg-indigo-500/10 text-indigo-400 font-medium shadow-sm' 
                      : 'hover:bg-slate-800 hover:text-white'}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto print:overflow-visible print:bg-white relative">
        <div className="p-8 md:p-10 max-w-7xl mx-auto print:p-0 print:max-w-none">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'employees' && <EmployeesView />}
          {currentView === 'attendance' && <AttendanceView />}
          {currentView === 'import' && <ImportView />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
}
