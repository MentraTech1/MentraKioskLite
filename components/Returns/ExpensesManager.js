// المسار: components/Returns/ExpensesManager.js

window.ExpensesManager = function({ expenses, showToast, userId }) {
    const { useState, useMemo } = React;
    const ITEMS_PER_PAGE = 4;

    const [page, setPage] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // حالات النافذة المنبثقة (Modal)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [formData, setFormData] = useState({ description: '', amount: '' });

    // فلترة السجل بناءً على التاريخ
    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            let matchDate = true;
            const expDate = new Date(exp.date);
            expDate.setHours(0,0,0,0);
            
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0,0,0,0);
                if (expDate < start) matchDate = false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23,59,59,999);
                if (expDate > end) matchDate = false;
            }
            return matchDate;
        });
    }, [expenses, startDate, endDate]);

    // الإحصائيات الذكية
    const stats = useMemo(() => {
        return {
            count: filteredExpenses.length,
            total: filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
        };
    }, [filteredExpenses]);

    const paginatedExpenses = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredExpenses.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredExpenses, page]);

    const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE) || 1;

    React.useEffect(() => { setPage(1); }, [startDate, endDate]);

    const openModal = (expense = null) => {
        if (expense) {
            setFormData({ description: expense.description, amount: expense.amount });
            setEditingExpense(expense);
        } else {
            setFormData({ description: '', amount: '' });
            setEditingExpense(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.description.trim() || !formData.amount) return;

        try {
            if (editingExpense) {
                await window.db.expenses.update(editingExpense.id, {
                    description: formData.description.trim(),
                    amount: Number(formData.amount)
                });
                showToast('تم تعديل المصروف بنجاح', 'success');
            } else {
                await window.db.expenses.add({
                    description: formData.description.trim(),
                    amount: Number(formData.amount),
                    date: new Date().toISOString(),
                    userId: userId
                });
                showToast('تم تسجيل المصروف بنجاح', 'success');
            }
            setIsModalOpen(false);
        } catch (err) {
            showToast('حدث خطأ أثناء الحفظ', 'error');
        }
    };

    const handleDelete = async (id) => {
        if(confirm('هل أنت متأكد من حذف هذا المصروف نهائياً؟')) {
            try {
                await window.db.expenses.delete(id);
                showToast('تم حذف المصروف', 'success');
                if(paginatedExpenses.length === 1 && page > 1) setPage(page - 1);
            } catch (err) { showToast('خطأ أثناء الحذف', 'error'); }
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-view">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center"><i className="fas fa-file-invoice-dollar"></i></div>
                    سجل المصروفات التشغيلية
                </h3>
                <button onClick={() => openModal()} className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-black shadow-lg shadow-purple-500/30 transition-all flex justify-center items-center gap-2">
                    <i className="fas fa-plus"></i> إضافة مصروف
                </button>
            </div>

            {/* فلاتر التاريخ والإحصائيات */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">من تاريخ</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-purple-500 text-sm font-bold text-slate-600" />
                    </div>
                    <div className="relative flex-1">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">إلى تاريخ</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-purple-500 text-sm font-bold text-slate-600" />
                    </div>
                </div>

                <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><i className="fas fa-list-ol"></i></div>
                        <div><p className="text-[10px] font-bold text-slate-400">عدد المصروفات</p><p className="font-black text-slate-700 leading-none">{stats.count}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center"><i className="fas fa-coins"></i></div>
                        <div><p className="text-[10px] font-bold text-slate-400">إجمالي المصروفات</p><p className="font-black text-rose-600 leading-none">{stats.total} ج.م</p></div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="p-3 rounded-r-xl">بيان المصروف</th>
                            <th className="p-3">المبلغ</th>
                            <th className="p-3">التاريخ</th>
                            <th className="p-3 rounded-l-xl text-center">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedExpenses.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-bold">لا توجد مصروفات مسجلة</td></tr>
                        ) : (
                            paginatedExpenses.map(exp => (
                                <tr key={exp.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-bold text-slate-700">{exp.description}</td>
                                    <td className="p-3 font-black text-rose-600">{exp.amount} ج.م</td>
                                    <td className="p-3 text-slate-500 text-xs" dir="ltr">{new Date(exp.date).toLocaleString('ar-EG', {hour12: true})}</td>
                                    <td className="p-3 text-center flex justify-center gap-2">
                                        <button onClick={() => openModal(exp)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold text-xs"><i className="fas fa-edit"></i></button>
                                        <button onClick={() => handleDelete(exp.id)} className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-bold text-xs"><i className="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-purple-600 hover:text-white disabled:opacity-50 flex justify-center items-center"><i className="fas fa-chevron-right"></i></button>
                    <span className="font-black text-slate-700 bg-slate-50 px-3 py-2 rounded-lg text-sm">صفحة {page} من {totalPages}</span>
                    <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-purple-600 hover:text-white disabled:opacity-50 flex justify-center items-center"><i className="fas fa-chevron-left"></i></button>
                </div>
            )}

            {/* نافذة إضافة/تعديل مصروف */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-view">
                        <div className="p-5 bg-[#0F172A] text-white flex justify-between items-center">
                            <h2 className="font-black">{editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white"><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5">
                            <div className="mb-4">
                                <label className="text-xs font-bold text-slate-500 block mb-1">بيان المصروف (السبب)</label>
                                <input type="text" autoFocus required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="مثال: فاتورة كهرباء، نقل بضاعة..." className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-purple-500 font-bold" />
                            </div>
                            <div className="mb-6">
                                <label className="text-xs font-bold text-slate-500 block mb-1">المبلغ (ج.م)</label>
                                <input type="number" min="0" step="0.5" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-purple-500 font-black text-rose-600 text-lg text-left" dir="ltr" />
                            </div>
                            <button type="submit" className="w-full bg-purple-600 text-white font-black py-3 rounded-xl hover:bg-purple-700">حفظ المصروف</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};