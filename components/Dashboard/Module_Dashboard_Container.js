// المسار: components/Dashboard/Module_Dashboard_Container.js

window.DashboardMainContainer = function(props) {
    const { useState } = React;
    const { QuickShortcuts, QuickStats, SalesChart, RecentActivity } = window;

    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(today);

    return (
        <div className="space-y-6 h-full flex flex-col animate-view pb-10">
            
            {/* شريط فلتر التاريخ */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#10B981] text-white rounded-xl flex items-center justify-center text-lg shadow-lg shadow-emerald-500/30"><i className="fas fa-chart-line"></i></div>
                    <h2 className="font-black text-slate-800 text-lg">المركز المالي والحركة</h2>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="relative flex-1 md:w-40">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">من تاريخ</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-lg outline-none focus:border-emerald-500 text-sm font-bold text-slate-600" />
                    </div>
                    <span className="text-slate-300 mt-4">-</span>
                    <div className="relative flex-1 md:w-40">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">إلى تاريخ</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-lg outline-none focus:border-emerald-500 text-sm font-bold text-slate-600" />
                    </div>
                </div>
            </div>

            {/* 1. الإحصائيات السريعة في الأعلى */}
            <QuickStats startDate={startDate} endDate={endDate} />

            {/* 2. تقسيمة الرسم البياني والاختصارات */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* الرسم البياني يأخذ مساحة أكبر */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
                    <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm"><i className="fas fa-chart-area text-blue-500"></i> حركة المبيعات والأرباح اليومية</h3>
                    <div className="flex-1 min-h-[250px]">
                        <SalesChart startDate={startDate} endDate={endDate} />
                    </div>
                </div>

                {/* الاختصارات تأخذ مساحة أصغر ومضغوطة */}
                <div className="lg:col-span-1 flex flex-col gap-3">
                    <h3 className="font-black text-slate-800 mb-1 flex items-center gap-2 text-sm"><i className="fas fa-link text-emerald-500"></i> وصول سريع</h3>
                    <QuickShortcuts setActiveModule={props.setActiveModule} role={props.role} />
                </div>
            </div>

            {/* 3. أحدث العمليات في الأسفل */}
            <RecentActivity startDate={startDate} endDate={endDate} />

        </div>
    );
};