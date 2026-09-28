// المسار: components/Inventory/Module_Inventory_Container.js

window.InventoryMainContainer = function(props) {
    const { useState, useEffect } = React;
    const { ProductsManager, CategoriesManager } = window;

    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'categories'
    const [toast, setToast] = useState(null);

    // جلب البيانات الحية وتمريرها للمكونات لتكون متزامنة دائماً
    const products = window.useLiveQuery(() => window.db.products.toArray(), []) || [];
    const categories = window.useLiveQuery(() => window.db.categories.toArray(), []) || [];

    const showToast = (message, type = 'success') => {
        setToast({ message, type, id: Date.now() });
        setTimeout(() => setToast(null), 3000);
    };

    // تأمين وجود قسم افتراضي "عام"
    useEffect(() => {
        const initDefaultCategory = async () => {
            if (window.db) {
                const count = await window.db.categories.count();
                if (count === 0) await window.db.categories.add({ name: 'عام' });
            }
        };
        initDefaultCategory();
    }, []);

    return (
        <div className="space-y-6 h-full flex flex-col animate-view">
            
            {/* Global Notify Toast */}
            {toast && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[999] animate-view w-[90%] max-w-sm">
                    <div className={`border-l-4 p-4 rounded-xl shadow-2xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-rose-50 text-rose-700 border-rose-500'}`}>
                        <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-times-circle'} text-xl`}></i>
                        <p className="font-bold text-sm flex-1">{toast.message}</p>
                    </div>
                </div>
            )}

            {/* التبويبات (Tabs) العلوية */}
            <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 max-w-sm mx-auto w-full shrink-0">
                <button onClick={() => setActiveTab('products')} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'products' ? 'bg-[#10B981] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-boxes text-lg"></i> المنتجات والمخزون
                </button>
                <button onClick={() => setActiveTab('categories')} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'categories' ? 'bg-[#10B981] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-tags text-lg"></i> إدارة الأقسام
                </button>
            </div>

            {/* View Render Router */}
            <div className="flex-1 w-full pb-10">
                {activeTab === 'products' && <ProductsManager products={products} categories={categories} showToast={showToast} />}
                {activeTab === 'categories' && <CategoriesManager products={products} categories={categories} showToast={showToast} />}
            </div>
        </div>
    );
};