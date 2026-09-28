// المسار: components/Returns/Module_Returns_Container.js

window.ReturnsMainContainer = function(props) {
    const { useState } = React;
    const { NewReturn, CustomerReturns, SupplierReturns, ExpensesManager } = window;

    const [activeTab, setActiveTab] = useState('new'); 
    const [toast, setToast] = useState(null);

    // جلب البيانات الحية
    const products = window.useLiveQuery(() => window.db.products.toArray(), []) || [];
    const returns = window.useLiveQuery(() => window.db.returns.reverse().toArray(), []) || [];
    const expenses = window.useLiveQuery(() => window.db.expenses.reverse().toArray(), []) || [];

    const showToast = (message, type = 'success') => {
        setToast({ message, type, id: Date.now() });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="space-y-6 h-full flex flex-col animate-view">
            
            {toast && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[999] animate-view w-[90%] max-w-sm">
                    <div className={`border-l-4 p-4 rounded-xl shadow-2xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-rose-50 text-rose-700 border-rose-500'}`}>
                        <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-times-circle'} text-xl`}></i>
                        <p className="font-bold text-sm flex-1">{toast.message}</p>
                    </div>
                </div>
            )}

            {/* تم تحويل الحاوية لتدعم 4 أزرار والتمرير الأفقي في الشاشات الصغيرة */}
            <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 max-w-4xl mx-auto w-full shrink-0 overflow-x-auto hide-scrollbar">
                <button onClick={() => setActiveTab('new')} className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-sm font-black transition-all flex justify-center items-center gap-2 ${activeTab === 'new' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-undo-alt"></i> تسجيل مرتجع
                </button>
                <button onClick={() => setActiveTab('customer_history')} className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-sm font-black transition-all flex justify-center items-center gap-2 ${activeTab === 'customer_history' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-user-clock"></i> مرتجعات العملاء
                </button>
                <button onClick={() => setActiveTab('supplier_history')} className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-sm font-black transition-all flex justify-center items-center gap-2 ${activeTab === 'supplier_history' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-truck-loading"></i> مرتجعات الموردين
                </button>
                <button onClick={() => setActiveTab('expenses')} className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-sm font-black transition-all flex justify-center items-center gap-2 ${activeTab === 'expenses' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-file-invoice-dollar"></i> المصروفات
                </button>
            </div>

            <div className="flex-1 w-full pb-10">
                {activeTab === 'new' && <NewReturn products={products} showToast={showToast} />}
                {activeTab === 'customer_history' && <CustomerReturns products={products} returns={returns} showToast={showToast} />}
                {activeTab === 'supplier_history' && <SupplierReturns products={products} returns={returns} showToast={showToast} />}
                {activeTab === 'expenses' && <ExpensesManager expenses={expenses} showToast={showToast} userId={props.userId} />}
            </div>
        </div>
    );
};