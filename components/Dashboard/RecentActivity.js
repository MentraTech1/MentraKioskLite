// المسار: components/Dashboard/RecentActivity.js

window.RecentActivity = function({ startDate, endDate }) {
    const { useState, useMemo, useEffect } = React;
    const ITEMS_PER_PAGE = 4; // लिमिट 4 كما طلبت

    const [page, setPage] = useState(1);
    
    // جلب المبيعات
    const sales = window.useLiveQuery(() => window.db.sales.toArray(), []) || [];

    // الفلترة
    const filteredSales = useMemo(() => {
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(endDate); end.setHours(23,59,59,999);

        return sales.filter(s => {
            const d = new Date(s.date);
            return d >= start && d <= end;
        }).reverse(); // الأحدث أولاً
    }, [sales, startDate, endDate]);

    // Pagination
    const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE) || 1;
    const paginatedSales = useMemo(() => {
        const startIdx = (page - 1) * ITEMS_PER_PAGE;
        return filteredSales.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    }, [filteredSales, page]);

    // العودة للصفحة الأولى عند تغيير التاريخ
    useEffect(() => { setPage(1); }, [startDate, endDate]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                <i className="fas fa-bolt text-amber-500"></i> أحدث حركات البيع
            </h3>

            <div className="overflow-x-auto min-h-[250px]">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="p-3 rounded-r-xl">رقم الفاتورة</th>
                            <th className="p-3">التاريخ والوقت</th>
                            <th className="p-3">قيمة الفاتورة</th>
                            <th className="p-3 rounded-l-xl">الربح</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSales.length === 0 ? (
                            <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold"><i className="fas fa-receipt text-3xl mb-2 block"></i>لا يوجد مبيعات في هذه المدة</td></tr>
                        ) : (
                            paginatedSales.map(sale => (
                                <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-bold text-slate-700">#{sale.id}</td>
                                    <td className="p-3 text-slate-500 text-xs" dir="ltr">{new Date(sale.date).toLocaleString('ar-EG', {hour12: true})}</td>
                                    <td className="p-3 font-black text-emerald-600">{sale.netAmount} ج.م</td>
                                    <td className="p-3 font-bold text-emerald-500">{sale.profit} ج.م</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                    <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-chevron-right"></i></button>
                    <span className="font-black text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-sm">صفحة {page} من {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>
                </div>
            )}
        </div>
    );
};