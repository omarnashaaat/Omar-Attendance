import { useState, useEffect } from 'react';
import { 
  Users, 
  CalendarClock, 
  Upload, 
  FileText, 
  Settings as SettingsIcon,
  LayoutDashboard,
  Building,
  Clock
} from 'lucide-react';
import EmployeesView from './views/EmployeesView';
import AttendanceView from './views/AttendanceView';
import ImportView from './views/ImportView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import DashboardView from './views/DashboardView';
import { getSettings } from './store';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [companyName, setCompanyName] = useState('إدارة الحضور والإنصراف');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Handle live updating clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load the company name on mount and update it from time to time
  useEffect(() => {
    const s = getSettings();
    if (s && s.companyName) {
      setCompanyName(s.companyName);
    }
  }, [currentView]); // Checking whenever the view changes or mounts to remain highly synchronized

  const timeString = currentTime.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-right relative">
      
      {/* Main Responsive Canvas Content wrapper */}
      <main className="flex-1 overflow-y-auto print:overflow-visible print:bg-white pb-16">
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto print:p-0 print:max-w-none">
          <div className="animate-fadeIn">
            {currentView === 'dashboard' && <DashboardView onNavigate={setCurrentView} />}
            {currentView === 'employees' && <EmployeesView />}
            {currentView === 'attendance' && <AttendanceView />}
            {currentView === 'import' && <ImportView />}
            {currentView === 'reports' && <ReportsView />}
            {currentView === 'settings' && <SettingsView />}
          </div>
        </div>
      </main>

      {/* Floating back button to return to Dashboard */}
      {currentView !== 'dashboard' && (
        <button
          onClick={() => setCurrentView('dashboard')}
          className="fixed bottom-6 right-6 z-50 bg-slate-900 hover:bg-slate-800 hover:scale-105 active:scale-95 text-white font-extrabold text-sm px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-2.5 transition-all duration-300 border border-white/10 cursor-pointer shadow-indigo-600/30"
        >
          <LayoutDashboard size={20} className="text-indigo-400" />
          <span>العودة للوحة القيادة الرئيسيّة</span>
        </button>
      )}

    </div>
  );
}
