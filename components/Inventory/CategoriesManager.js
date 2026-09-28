// المسار: components/Inventory/CategoriesManager.js

window.CategoriesManager = function({ products, categories, showToast }) {
    const { useState, useMemo } = React;
    const CATS_PER_PAGE = 6;

    const [currentCatPage, setCurrentCatPage] = useState(1);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [catNameInput, setCatNameInput] = useState('');

    const paginatedCategories = useMemo(() => {
        const start = (currentCatPage - 1) * CATS_PER_PAGE;
        return categories.slice(start, start + CATS_PER_PAGE);
    }, [categories, currentCatPage]);

    const totalCatPages = Math.ceil(categories.length / CATS_PER_PAGE) || 1;

    const openCatModal = (cat = null) => {
        if (cat) {
            setEditingCategory(cat);
            setCatNameInput(cat.name);
        } else {
            setEditingCategory(null);
            setCatNameInput('');
        }
        setIsCatModalOpen(true);
    };

    const handleCatSubmit = async (e) => {
        e.preventDefault();
        if (!catNameInput.trim()) return;
        try {
            if (editingCategory) {
                await window.db.categories.update(editingCategory.id, { name: catNameInput.trim() });
                showToast('تم تعديل القسم بنجاح', 'success');
            } else {
                await window.db.categories.add({ name: catNameInput.trim() });
                showToast('تمت إضافة القسم بنجاح', 'success');
            }
            setIsCatModalOpen(false);
        } catch(err) { showToast('حدث خطأ', 'error'); }
    };

    const handleCatDelete = async (catId, catName) => {
        try {
            const linkedProductsCount = await window.db.products.where('categoryId').equals(catId).count();
            
            if (linkedProductsCount > 0) {
                showToast(`لا يمكن الحذف! يوجد ${linkedProductsCount} منتجات مسجلة في قسم "${catName}".`, 'error');
                return;
            }

            if(confirm(`هل أنت متأكد من حذف قسم "${catName}" نهائياً؟`)) {
                await window.db.categories.delete(catId);
                showToast('تم حذف القسم بنجاح', 'success');
                if (paginatedCategories.length === 1 && currentCatPage > 1) {
                    setCurrentCatPage(currentCatPage - 1);
                }
            }
        } catch(err) {
            showToast('خطأ أثناء فحص البيانات', 'error');
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[500px] flex flex-col justify-between animate-view">
            <div>
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">الأقسام المسجلة</h2>
                        <p className="text-sm font-bold text-slate-500">إدارة تصنيفات المنتجات في المخزن</p>
                    </div>
                    <button onClick={() => openCatModal()} className="bg-[#10B981] hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-black shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2">
                        <i className="fas fa-plus"></i> قسم جديد
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedCategories.map(cat => {
                        const linkedCount = products.filter(p => p.categoryId === cat.id).length;
                        return (
                            <div key={cat.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-[#10B981] transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg"><i className="fas fa-tags"></i></div>
                                    <div>
                                        <h3 className="font-black text-slate-700">{cat.name}</h3>
                                        <p className={`text-[10px] font-bold mt-1 ${linkedCount > 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                                            يحتوي على {linkedCount} منتج
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openCatModal(cat)} className="text-blue-500 hover:bg-blue-100 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => handleCatDelete(cat.id, cat.name)} className="text-rose-500 hover:bg-rose-100 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pagination للأقسام */}
            {totalCatPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-slate-100">
                    <button onClick={() => setCurrentCatPage(prev => Math.max(prev - 1, 1))} disabled={currentCatPage === 1} className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50 hover:bg-[#10B981] hover:text-white transition-colors flex items-center justify-center shadow-sm"><i className="fas fa-chevron-right"></i></button>
                    <span className="font-black text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">صفحة {currentCatPage} من {totalCatPages}</span>
                    <button onClick={() => setCurrentCatPage(prev => Math.min(prev + 1, totalCatPages))} disabled={currentCatPage === totalCatPages} className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50 hover:bg-[#10B981] hover:text-white transition-colors flex items-center justify-center shadow-sm"><i className="fas fa-chevron-left"></i></button>
                </div>
            )}

            {/* نافذة الأقسام المنبثقة */}
            {isCatModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-view">
                        <div className="p-5 bg-[#0F172A] text-white flex justify-between items-center">
                            <h2 className="font-black">{editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}</h2>
                            <button onClick={() => setIsCatModalOpen(false)} className="text-white/50 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleCatSubmit} className="p-5">
                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-bold text-slate-600">اسم القسم</label>
                                <input type="text" autoFocus required value={catNameInput} onChange={e => setCatNameInput(e.target.value)} placeholder="مثال: مشروبات غازية" className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-[#10B981] font-bold" />
                            </div>
                            <button type="submit" className="w-full bg-[#10B981] text-white font-black py-3 rounded-xl hover:bg-emerald-600 transition-colors">حفظ القسم</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};