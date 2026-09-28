// المسار: components/Reports/DetailedTables.js

window.DetailedTables = function({ startDate, endDate }) {
    const { useState, useMemo, useEffect } = React;
    const ITEMS_PER_PAGE = 4; // الحد الأقصى 4 عناصر في الصفحة

    const [dataType, setDataType] = useState('sales'); 
    const [page, setPage] = useState(1);

    // جلب الجداول من قاعدة البيانات
    const rawSales = window.useLiveQuery(() => window.db.sales.toArray(), []) || [];
    const rawPurchases = window.useLiveQuery(() => window.db.purchases.toArray(), []) || [];
    const rawExpenses = window.useLiveQuery(() => window.db.expenses.toArray(), []) || [];
    const rawReturns = window.useLiveQuery(() => window.db.returns.toArray(), []) || [];
    
    // الحل: جلب جدول الموردين لربط الـ ID بالاسم
    const rawSuppliers = window.useLiveQuery(() => window.db.suppliers.toArray(), []) || [];

    // فلترة وحساب البيانات بناءً على النوع والتاريخ
    const filteredData = useMemo(() => {
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(endDate); end.setHours(23,59,59,999);

        let source = [];
        if(dataType === 'sales') source = rawSales;
        if(dataType === 'purchases') source = rawPurchases;
        if(dataType === 'expenses') source = rawExpenses;
        if(dataType === 'customer_returns') source = rawReturns.filter(r => r.type === 'customer');
        if(dataType === 'supplier_returns') source = rawReturns.filter(r => r.type === 'supplier');

        return source.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= start && itemDate <= end;
        }).reverse();
    }, [dataType, rawSales, rawPurchases, rawExpenses, rawReturns, startDate, endDate]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const paginatedData = useMemo(() => {
        const startIdx = (page - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    }, [filteredData, page]);

    useEffect(() => { setPage(1); }, [dataType, startDate, endDate]);

    // دالة التصدير إلى إكسل (CSV مع دعم اللغة العربية BOM)
    const exportToExcel = () => {
        if(filteredData.length === 0) { alert('لا توجد بيانات لتصديرها'); return; }
        
        let headers = [];
        let rows = [];

        if (dataType === 'sales') {
            headers = ['رقم الفاتورة', 'التاريخ', 'الإجمالي', 'الخصم', 'الصافي', 'الربح'];
            rows = filteredData.map(s => [s.id, new Date(s.date).toLocaleString('ar-EG'), s.totalAmount, s.discount, s.netAmount, s.profit]);
        } else if (dataType === 'purchases') {
            headers = ['رقم الفاتورة', 'التاريخ', 'المورد', 'الإجمالي'];
            rows = filteredData.map(p => {
                // جلب اسم المورد في الإكسل
                const supplierObj = rawSuppliers.find(sup => sup.id === p.supplierId);
                const supplierName = supplierObj ? supplierObj.name : (p.supplierName || 'غير محدد');
                return [p.id, new Date(p.date).toLocaleString('ar-EG'), supplierName, p.netAmount || p.totalAmount];
            });
        } else if (dataType === 'expenses') {
            headers = ['رقم المصروف', 'التاريخ', 'البيان', 'المبلغ'];
            rows = filteredData.map(e => [e.id, new Date(e.date).toLocaleString('ar-EG'), e.description, e.amount]);
        } else if (dataType.includes('returns')) {
            headers = ['رقم الحركة', 'التاريخ', 'المنتج', 'الكمية', 'الإجمالي'];
            rows = filteredData.map(r => [r.id, new Date(r.date).toLocaleString('ar-EG'), r.productName, r.quantity, r.totalAmount]);
        }

        // إضافة UTF-8 BOM لدعم اللغة العربية في إكسل
        const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `تقرير_${dataType}_${startDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-view">
            {/* أزرار اختيار نوع التقرير */}
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-100 pb-4">
                <div className="flex flex-wrap gap-2 bg-slate-50 p-1.5 rounded-xl w-full lg:w-auto">
                    <button onClick={() => setDataType('sales')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${dataType === 'sales' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>المبيعات</button>
                    <button onClick={() => setDataType('purchases')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${dataType === 'purchases' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>المشتريات</button>
                    <button onClick={() => setDataType('expenses')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${dataType === 'expenses' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>المصروفات</button>
                    <button onClick={() => setDataType('customer_returns')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${dataType === 'customer_returns' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>م. العملاء</button>
                    <button onClick={() => setDataType('supplier_returns')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${dataType === 'supplier_returns' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>م. الموردين</button>
                </div>

                <button onClick={exportToExcel} disabled={filteredData.length === 0} className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 transition-colors">
                    <i className="fas fa-file-excel"></i> تحميل التقرير (Excel)
                </button>
            </div>

            {/* الجدول الديناميكي المحدود بـ 4 عناصر */}
            <div className="overflow-x-auto min-h-[250px]">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="p-3 rounded-r-xl">الرقم</th>
                            <th className="p-3">التاريخ</th>
                            {dataType === 'sales' && <><th className="p-3">الصافي</th><th className="p-3 rounded-l-xl">الربح</th></>}
                            {dataType === 'purchases' && <><th className="p-3">المورد</th><th className="p-3 rounded-l-xl">الإجمالي</th></>}
                            {dataType === 'expenses' && <><th className="p-3">البيان</th><th className="p-3 rounded-l-xl">المبلغ</th></>}
                            {dataType.includes('returns') && <><th className="p-3">المنتج</th><th className="p-3">الكمية</th><th className="p-3 rounded-l-xl">الإجمالي</th></>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold"><i className="fas fa-folder-open text-3xl mb-2 block"></i>لا توجد بيانات مطابقة</td></tr>
                        ) : (
                            paginatedData.map((row) => {
                                // جلب اسم المورد بشكل ديناميكي من جدول الموردين
                                const supplierObj = dataType === 'purchases' ? rawSuppliers.find(sup => sup.id === row.supplierId) : null;
                                const displaySupplierName = supplierObj ? supplierObj.name : (row.supplierName || 'غير محدد');

                                return (
                                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-bold text-slate-700">#{row.id}</td>
                                        <td className="p-3 text-slate-500 text-xs" dir="ltr">{new Date(row.date).toLocaleString('ar-EG', {hour12:true})}</td>
                                        
                                        {dataType === 'sales' && <>
                                            <td className="p-3 font-black text-emerald-600">{row.netAmount} ج</td>
                                            <td className="p-3 font-bold text-emerald-500">{row.profit} ج</td>
                                        </>}
                                        {dataType === 'purchases' && <>
                                            <td className="p-3 font-bold text-slate-700">{displaySupplierName}</td>
                                            <td className="p-3 font-black text-blue-600">{row.netAmount || row.totalAmount} ج</td>
                                        </>}
                                        {dataType === 'expenses' && <>
                                            <td className="p-3 font-bold text-slate-700">{row.description}</td>
                                            <td className="p-3 font-black text-rose-500">{row.amount} ج</td>
                                        </>}
                                        {dataType.includes('returns') && <>
                                            <td className="p-3 font-bold text-slate-700">{row.productName}</td>
                                            <td className="p-3 font-black text-slate-600">{row.quantity}</td>
                                            <td className={`p-3 font-black ${dataType === 'customer_returns' ? 'text-orange-600' : 'text-purple-600'}`}>{row.totalAmount} ج</td>
                                        </>}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* نظام الصفحات (Pagination) المحدود بـ 4 عناصر */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-chevron-right"></i></button>
                    <span className="font-black text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-sm">صفحة {page} من {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>
                </div>
            )}
        </div>
    );
};