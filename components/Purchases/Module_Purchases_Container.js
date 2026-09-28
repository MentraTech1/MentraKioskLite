// المسار: components/Purchases/Module_Purchases_Container.js

window.PurchasesMainContainer = function(props) {
    const { useState } = React;
    const { SuppliersManager, NewPurchase, PurchaseHistory } = window;

    const [activeTab, setActiveTab] = useState('new_purchase'); 
    const [toast, setToast] = useState(null);

    const products = window.useLiveQuery(() => window.db.products.toArray(), []) || [];
    const suppliers = window.useLiveQuery(() => window.db.suppliers.toArray(), []) || [];
    const purchases = window.useLiveQuery(() => window.db.purchases.reverse().toArray(), []) || [];

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

            <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 max-w-lg mx-auto w-full shrink-0">
                <button onClick={() => setActiveTab('new_purchase')} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex justify-center items-center gap-2 ${activeTab === 'new_purchase' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-cart-arrow-down"></i> شراء بضاعة
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex justify-center items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-file-invoice"></i> سجل المشتريات
                </button>
                <button onClick={() => setActiveTab('suppliers')} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex justify-center items-center gap-2 ${activeTab === 'suppliers' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-truck-fast"></i> الموردين
                </button>
            </div>

            <div className="flex-1 w-full pb-10">
                {activeTab === 'suppliers' && <SuppliersManager suppliers={suppliers} showToast={showToast} />}
                {activeTab === 'new_purchase' && <NewPurchase products={products} suppliers={suppliers} showToast={showToast} />}
                {activeTab === 'history' && <PurchaseHistory purchases={purchases} suppliers={suppliers} showToast={showToast} />}
            </div>
        </div>
    );
};