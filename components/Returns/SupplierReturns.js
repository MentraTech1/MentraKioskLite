// المسار: components/Returns/SupplierReturns.js

window.SupplierReturns = function({ returns, showToast }) {
    const { useState, useMemo } = React;
    const ITEMS_PER_PAGE = 4;

    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [editingReturn, setEditingReturn] = useState(null);
    const [editQty, setEditQty] = useState(1);

    const filteredReturns = useMemo(() => {
        return returns.filter(r => {
            if (r.type !== 'supplier') return false;
            
            let matchDate = true;
            const rDate = new Date(r.date);
            rDate.setHours(0,0,0,0);
            
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0,0,0,0);
                if (rDate < start) matchDate = false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23,59,59,999);
                if (rDate > end) matchDate = false;
            }
            return matchDate;
        });
    }, [returns, startDate, endDate]);

    const stats = useMemo(() => {
        return {
            count: filteredReturns.length,
            total: filteredReturns.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
        };
    }, [filteredReturns]);

    const paginatedReturns = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredReturns.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredReturns, page]);

    const totalPages = Math.ceil(filteredReturns.length / ITEMS_PER_PAGE) || 1;

    React.useEffect(() => { setPage(1); }, [startDate, endDate]);

    const handleDelete = async (ret) => {
        if(confirm(`إلغاء المرتجع سيقوم بإعادة الكمية (${ret.quantity}) للمخزن. هل أنت متأكد؟`)) {
            try {
                await window.db.transaction('rw', window.db.returns, window.db.products, async () => {
                    const product = await window.db.products.get(ret.productId);
                    if (product) {
                        const newStock = product.total_stock_pieces + ret.quantity;
                        await window.db.products.update(ret.productId, { total_stock_pieces: newStock });
                    }
                    await window.db.returns.delete(ret.id);
                });
                showToast('تم الحذف بنجاح', 'success');
            } catch (err) { showToast(err.message, 'error'); }
        }
    };

    const handleSaveEdit = async () => {
        if (editQty <= 0) return;
        try {
            await window.db.transaction('rw', window.db.returns, window.db.products, async () => {
                const product = await window.db.products.get(editingReturn.productId);
                if (!product) throw new Error("المنتج محذوف");
                const qtyDifference = editQty - editingReturn.quantity;
                const newStock = product.total_stock_pieces - qtyDifference; 
                if(newStock < 0) throw new Error("التعديل يتطلب رصيد غير متاح بالمخزن!");
                await window.db.products.update(editingReturn.productId, { total_stock_pieces: newStock });
                await window.db.returns.update(editingReturn.id, { 
                    quantity: Number(editQty), 
                    totalAmount: Number(editQty) * editingReturn.unitPrice 
                });
            });
            showToast('تم التعديل بنجاح', 'success');
            setEditingReturn(null);
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-view">
            {!editingReturn ? (
                <>
                    <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                        <i className="fas fa-truck-loading text-rose-500"></i> مرتجعات الموردين (بضاعة خرجت من المخزن)
                    </h3>

                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">من تاريخ</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-rose-500 text-sm font-bold text-slate-600" />
                            </div>
                            <div className="relative flex-1">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">إلى تاريخ</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-rose-500 text-sm font-bold text-slate-600" />
                            </div>
                        </div>

                        <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><i className="fas fa-list-ol"></i></div>
                                <div><p className="text-[10px] font-bold text-slate-400">عمليات الرد</p><p className="font-black text-slate-700 leading-none">{stats.count}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center"><i className="fas fa-coins"></i></div>
                                <div><p className="text-[10px] font-bold text-slate-400">إجمالي المسترد</p><p className="font-black text-rose-600 leading-none">{stats.total} ج.م</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="p-3 rounded-r-xl">المنتج</th>
                                    <th className="p-3">الكمية</th>
                                    <th className="p-3">الإجمالي (مسترد)</th>
                                    <th className="p-3">التاريخ</th>
                                    <th className="p-3 rounded-l-xl text-center">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedReturns.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">لا توجد مرتجعات تطابق الفلتر</td></tr>
                                ) : (
                                    paginatedReturns.map(ret => (
                                        <tr key={ret.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="p-3 font-bold text-slate-700">{ret.productName}</td>
                                            <td className="p-3 font-black text-rose-600">{ret.quantity} قطعة</td>
                                            <td className="p-3 font-bold text-slate-600">{ret.totalAmount} ج.م</td>
                                            <td className="p-3 text-slate-500 text-xs" dir="ltr">{new Date(ret.date).toLocaleString('ar-EG', {hour12: true})}</td>
                                            <td className="p-3 text-center flex justify-center gap-2">
                                                <button onClick={() => {setEditingReturn(ret); setEditQty(ret.quantity);}} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold text-xs"><i className="fas fa-edit"></i></button>
                                                <button onClick={() => handleDelete(ret)} className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-bold text-xs"><i className="fas fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6 pt-4 border-t border-slate-100">
                            <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white disabled:opacity-50 flex justify-center items-center"><i className="fas fa-chevron-right"></i></button>
                            <span className="font-black text-slate-700 bg-slate-50 px-3 py-2 rounded-lg text-sm">صفحة {page} من {totalPages}</span>
                            <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white disabled:opacity-50 flex justify-center items-center"><i className="fas fa-chevron-left"></i></button>
                        </div>
                    )}
                </>
            ) : (
                <div className="animate-view max-w-sm mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="font-black text-slate-800 text-lg mb-4 text-center">تعديل كمية المرتجع</h3>
                    <p className="font-bold text-slate-600 text-center mb-6">{editingReturn.productName}</p>
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-500 block mb-1">الكمية الصحيحة (قطعة)</label>
                        <input type="number" min="1" value={editQty} onChange={(e) => setEditQty(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:border-rose-500 font-black text-center text-lg" dir="ltr" />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleSaveEdit} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black py-3 rounded-xl">حفظ التعديل</button>
                        <button onClick={() => setEditingReturn(null)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black py-3 rounded-xl">إلغاء</button>
                    </div>
                </div>
            )}
        </div>
    );
};