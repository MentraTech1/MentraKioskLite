// المسار: components/Reports/Module_Reports_Container.js

window.ReportsMainContainer = function(props) {
    const { useState } = React;
    const { OverviewStats, DetailedTables } = window;

    // حالة الفلاتر الزمنية (افتراضياً من أول الشهر حتى اليوم)
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(today);
    
    // 'overview' أو 'details'
    const [activeTab, setActiveTab] = useState('overview'); 

    return (
        <div className="space-y-6 h-full flex flex-col animate-view">
            {/* شريط الفلاتر والتبويبات */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4">
                
                {/* التبويبات */}
                <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-100 w-full lg:w-auto shrink-0">
                    <button onClick={() => setActiveTab('overview')} className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
                        <i className="fas fa-chart-bar"></i> المؤشرات والرسم البياني
                    </button>
                    <button onClick={() => setActiveTab('details')} className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'details' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
                        <i className="fas fa-table"></i> الجداول وتصدير إكسل
                    </button>
                </div>

                {/* فلتر التاريخ */}
                <div className="flex items-center gap-2 w-full lg:w-auto bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="relative flex-1 lg:w-40">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">من تاريخ</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-600" />
                    </div>
                    <span className="text-slate-300 mt-4">-</span>
                    <div className="relative flex-1 lg:w-40">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">إلى تاريخ</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-slate-600" />
                    </div>
                </div>
            </div>

            {/* عرض المكون النشط وتمرير الفلاتر */}
            <div className="flex-1 w-full pb-10">
                {activeTab === 'overview' && <OverviewStats startDate={startDate} endDate={endDate} {...props} />}
                {activeTab === 'details' && <DetailedTables startDate={startDate} endDate={endDate} {...props} />}
            </div>
        </div>
    );
};