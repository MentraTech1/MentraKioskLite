// المسار: components/Purchases/SuppliersManager.js

window.SuppliersManager = function({ suppliers, showToast }) {
    const { useState, useMemo } = React;
    const ITEMS_PER_PAGE = 4;

    const [supplierPage, setSupplierPage] = useState(1);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [supplierForm, setSupplierForm] = useState({ name: '', phone: '' });
    const [supplierSearch, setSupplierSearch] = useState('');

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
    }, [suppliers, supplierSearch]);

    const paginatedSuppliers = useMemo(() => {
        const start = (supplierPage - 1) * ITEMS_PER_PAGE;
        return filteredSuppliers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredSuppliers, supplierPage]);

    const totalSupplierPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE) || 1;

    const openSupplierModal = (supplier = null) => {
        if (supplier) {
            setSupplierForm({ name: supplier.name, phone: supplier.phone });
            setEditingSupplier(supplier);
        } else {
            setSupplierForm({ name: '', phone: '' });
            setEditingSupplier(null);
        }
        setIsSupplierModalOpen(true);
    };

    const handleSupplierSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await window.db.suppliers.update(editingSupplier.id, supplierForm);
                showToast('تم تعديل بيانات المورد', 'success');
            } else {
                await window.db.suppliers.add(supplierForm);
                showToast('تمت إضافة المورد', 'success');
            }
            setIsSupplierModalOpen(false);
        } catch(err) { showToast('حدث خطأ أثناء الحفظ', 'error'); }
    };

    const handleSupplierDelete = async (id, name) => {
        try {
            const linkedPurchases = await window.db.purchases.where('supplierId').equals(id).count();
            if (linkedPurchases > 0) {
                showToast(`لا يمكن الحذف! يوجد ${linkedPurchases} فواتير مسجلة باسم المورد "${name}".`, 'error');
                return;
            }
            if(confirm(`هل أنت متأكد من حذف المورد: ${name}؟`)) {
                await window.db.suppliers.delete(id);
                showToast('تم حذف المورد', 'success');
                if (paginatedSuppliers.length === 1 && supplierPage > 1) setSupplierPage(supplierPage - 1);
            }
        } catch(err) { showToast('خطأ في النظام', 'error'); }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[500px] animate-view">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div><h2 className="text-xl font-black text-slate-800">قائمة الموردين والشركات</h2></div>
                <button onClick={() => openSupplierModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-black shadow-lg transition-all flex items-center gap-2"><i className="fas fa-plus"></i> مورد جديد</button>
            </div>

            <div className="mb-4 relative">
                <input type="text" value={supplierSearch} onChange={(e) => {setSupplierSearch(e.target.value); setSupplierPage(1);}} placeholder="ابحث باسم المورد..." className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:border-blue-500 font-bold text-sm" />
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedSuppliers.length === 0 ? (
                    <div className="col-span-2 text-center py-10 text-slate-400 font-bold">لا يوجد موردين</div>
                ) : (
                    paginatedSuppliers.map(sup => (
                        <div key={sup.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center group hover:border-blue-300 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl"><i className="fas fa-truck-moving"></i></div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg">{sup.name}</h3>
                                    <p className="text-sm font-bold text-slate-500" dir="ltr">{sup.phone || 'بدون رقم'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openSupplierModal(sup)} className="w-8 h-8 rounded bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-blue-500 hover:text-white"><i className="fas fa-edit text-xs"></i></button>
                                <button onClick={() => handleSupplierDelete(sup.id, sup.name)} className="w-8 h-8 rounded bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white"><i className="fas fa-trash text-xs"></i></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {totalSupplierPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setSupplierPage(prev => Math.max(prev - 1, 1))} disabled={supplierPage === 1} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center"><i className="fas fa-chevron-right"></i></button>
                    <span className="font-black text-slate-700 bg-slate-50 px-3 py-1 rounded-lg text-sm">صفحة {supplierPage} من {totalSupplierPages}</span>
                    <button onClick={() => setSupplierPage(prev => Math.min(prev + 1, totalSupplierPages))} disabled={supplierPage === totalSupplierPages} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>
                </div>
            )}

            {isSupplierModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-view">
                        <div className="p-5 bg-[#0F172A] text-white flex justify-between items-center">
                            <h2 className="font-black">{editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</h2>
                            <button onClick={() => setIsSupplierModalOpen(false)} className="text-white/50 hover:text-white"><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleSupplierSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-600 block mb-1">اسم المورد / الشركة</label>
                                <input type="text" autoFocus required value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-bold" />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-600 block mb-1">رقم الهاتف (اختياري)</label>
                                <input type="tel" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-bold text-left" dir="ltr" />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 mt-2">حفظ المورد</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};