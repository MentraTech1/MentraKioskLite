// المسار: components/Settings/Module_Settings_Container.js

window.SettingsMainContainer = function(props) {
    const { useState } = React;
    const { ProfileSettings, KioskSettings, EmployeesManager } = window;

    const [activeTab, setActiveTab] = useState('profile'); 

    return (
        <div className="space-y-6 h-full flex flex-col animate-view">
            
            {/* التبويبات */}
            <div className="flex flex-wrap md:flex-nowrap bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 max-w-2xl mx-auto w-full shrink-0">
                <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-user-shield"></i> بيانات حسابي
                </button>
                <button onClick={() => setActiveTab('kiosk')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'kiosk' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-store"></i> بيانات الكشك
                </button>
                <button onClick={() => setActiveTab('employees')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'employees' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-users"></i> الموظفين
                </button>
            </div>

            {/* عرض المكون النشط */}
            <div className="flex-1 w-full pb-10">
                {activeTab === 'profile' && <ProfileSettings {...props} />}
                {activeTab === 'kiosk' && <KioskSettings {...props} />}
                {activeTab === 'employees' && <EmployeesManager {...props} />}
            </div>
        </div>
    );
};