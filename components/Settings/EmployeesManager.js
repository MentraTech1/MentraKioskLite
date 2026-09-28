// المسار: components/Settings/EmployeesManager.js

window.EmployeesManager = function({ userId, showToast }) {
    const { useState, useMemo } = React;
    const ITEMS_PER_PAGE = 3;

    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmp, setEditingEmp] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', password: '', role: 'cashier' });

    // جلب كل المستخدمين
    const users = window.useLiveQuery(() => window.db.users.toArray(), []) || [];

    const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE) || 1;
    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return users.slice(start, start + ITEMS_PER_PAGE);
    }, [users, page]);

    const openModal = (emp = null) => {
        if (emp) {
            setFormData({ name: emp.name, phone: emp.phone, password: emp.password, role: emp.role });
            setEditingEmp(emp);
        } else {
            setFormData({ name: '', phone: '', password: '', role: 'cashier' });
            setEditingEmp(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // التأكد من عدم تكرار رقم الهاتف
            const existingUser = await window.db.users.where('phone').equals(formData.phone).first();
            if (existingUser && (!editingEmp || existingUser.id !== editingEmp.id)) {
                showToast('رقم الهاتف مستخدم لموظف آخر!', 'error');
                return;
            }

            if (editingEmp) {
                await window.db.users.update(editingEmp.id, formData);
                showToast('تم تعديل بيانات الموظف بنجاح', 'success');
            } else {
                await window.db.users.add(formData);
                showToast('تمت إضافة الموظف بنجاح', 'success');
            }
            setIsModalOpen(false);
        } catch (error) { showToast('خطأ أثناء الحفظ', 'error'); }
    };

    const handleDelete = async (empId, empName) => {
        if (empId === userId) {
            showToast('لا يمكنك حذف حسابك الشخصي!', 'error');
            return;
        }
        if(confirm(`هل أنت متأكد من حذف الموظف: ${empName}؟ \nلن يتمكن من الدخول للنظام مرة أخرى.`)) {
            await window.db.users.delete(empId);
            showToast('تم حذف الموظف', 'success');
            if (paginatedUsers.length === 1 && page > 1) setPage(page - 1);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-view">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-xl"><i className="fas fa-users-cog"></i></div>
                    <h2 className="text-lg font-black text-slate-800">إدارة الصلاحيات والموظفين</h2>
                </div>
                <button onClick={() => openModal()} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-black shadow-lg flex items-center gap-2"><i className="fas fa-user-plus"></i> إضافة موظف</button>
            </div>

            {/* عرض الموظفين على شكل كروت (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {paginatedUsers.map(emp => (
                    <div key={emp.id} className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden group ${emp.id === userId ? 'border-purple-200 bg-purple-50' : 'border-slate-100 bg-slate-50 hover:border-purple-300'}`}>
                        {emp.id === userId && <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">أنت</div>}
                        
                        <div className="flex flex-col items-center text-center mb-4 mt-2">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black mb-2 ${emp.role === 'owner' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'}`}>
                                <i className={`fas ${emp.role === 'owner' ? 'fa-user-tie' : 'fa-cash-register'}`}></i>
                            </div>
                            <h3 className="font-black text-slate-800 text-lg">{emp.name}</h3>
                            <p className="text-xs font-bold text-slate-500 mt-1" dir="ltr">{emp.phone}</p>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full mt-2 ${emp.role === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>{emp.role === 'owner' ? 'مدير نظام' : 'كاشير بائع'}</span>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-200">
                            <button onClick={() => openModal(emp)} className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 py-2 rounded-xl font-bold text-xs"><i className="fas fa-edit"></i> تعديل</button>
                            <button onClick={() => handleDelete(emp.id, emp.name)} disabled={emp.id === userId} className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 py-2 rounded-xl font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed"><i className="fas fa-trash"></i> حذف</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Limited to 3 */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-purple-600 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-chevron-right"></i></button>
                    <span className="font-black text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-sm">صفحة {page} من {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-purple-600 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>
                </div>
            )}

            {/* نافذة التعديل والإضافة */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-view">
                        <div className="p-5 bg-purple-600 text-white flex justify-between items-center">
                            <h2 className="font-black">{editingEmp ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white"><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-500 block mb-1">الاسم</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-purple-500 font-bold" />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-500 block mb-1">رقم الهاتف (للدخول)</label>
                                <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-purple-500 font-bold text-left" dir="ltr" />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-500 block mb-1">كلمة المرور</label>
                                <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-purple-500 font-bold text-left" dir="ltr" />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-500 block mb-1">الصلاحية</label>
                                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-purple-500 font-bold">
                                    <option value="cashier">كاشير (مبيعات فقط)</option>
                                    <option value="owner">مدير (صلاحيات كاملة)</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2">
                                <i className="fas fa-save"></i> حفظ الموظف
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};