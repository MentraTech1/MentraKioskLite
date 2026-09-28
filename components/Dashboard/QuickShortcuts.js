// المسار: components/Dashboard/QuickShortcuts.js

window.QuickShortcuts = function({ setActiveModule, role }) {
    
    // تصميم مدمج وأنيق (List Style) بدلاً من الكروت العملاقة
    const ShortcutBtn = ({ title, icon, colorClass, moduleName, subtitle }) => (
        <button onClick={() => setActiveModule(moduleName)} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all flex items-center gap-4 group text-right">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-transform group-hover:scale-110 shrink-0 ${colorClass}`}>
                <i className={`fas ${icon}`}></i>
            </div>
            <div>
                <h4 className="font-black text-slate-700 text-sm">{title}</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{subtitle}</p>
            </div>
            <i className="fas fa-chevron-left mr-auto text-slate-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
        </button>
    );

    return (
        <div className="flex flex-col gap-3 h-full justify-start">
            <ShortcutBtn title="الكاشير والبيع" subtitle="شاشة نقاط البيع" icon="fa-cash-register" colorClass="bg-emerald-50 text-emerald-600" moduleName="pos" />
            
            {role === 'owner' && (
                <>
                    <ShortcutBtn title="المخزن والمنتجات" subtitle="إضافة وتعديل بضاعة" icon="fa-boxes-stacked" colorClass="bg-blue-50 text-blue-600" moduleName="inventory" />
                    <ShortcutBtn title="المشتريات والموردين" subtitle="تسجيل فواتير الشراء" icon="fa-truck-fast" colorClass="bg-indigo-50 text-indigo-600" moduleName="purchases" />
                    <ShortcutBtn title="إدارة المصروفات" subtitle="الكهرباء والنثريات" icon="fa-file-invoice-dollar" colorClass="bg-rose-50 text-rose-600" moduleName="returns" />
                </>
            )}
            
            {role === 'cashier' && (
                <ShortcutBtn title="مرتجعات العملاء" subtitle="استرداد بضاعة" icon="fa-undo" colorClass="bg-orange-50 text-orange-600" moduleName="returns" />
            )}
        </div>
    );
};