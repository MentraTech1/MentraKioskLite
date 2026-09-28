// المسار: components/Reports/OverviewStats.js

window.OverviewStats = function({ startDate, endDate }) {
    const { useMemo, useEffect, useRef } = React;
    const chartRef = useRef(null);
    let chartInstance = useRef(null);

    // جلب البيانات من IndexedDB
    const sales = window.useLiveQuery(() => window.db.sales.toArray(), []) || [];
    const purchases = window.useLiveQuery(() => window.db.purchases.toArray(), []) || [];
    const expenses = window.useLiveQuery(() => window.db.expenses.toArray(), []) || [];
    const returns = window.useLiveQuery(() => window.db.returns.toArray(), []) || [];

    // فلترة التواريخ وحساب الإحصائيات
    const stats = useMemo(() => {
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(endDate); end.setHours(23,59,59,999);

        const filterByDate = (arr, dateField = 'date') => arr.filter(item => {
            const itemDate = new Date(item[dateField]);
            return itemDate >= start && itemDate <= end;
        });

        const fSales = filterByDate(sales);
        const fPurchases = filterByDate(purchases);
        const fExpenses = filterByDate(expenses);
        const fReturns = filterByDate(returns);

        const totalSales = fSales.reduce((sum, item) => sum + (parseFloat(item.netAmount) || 0), 0);
        const totalProfit = fSales.reduce((sum, item) => sum + (parseFloat(item.profit) || 0), 0);
        const totalPurchases = fPurchases.reduce((sum, item) => sum + (parseFloat(item.netAmount || item.totalAmount) || 0), 0);
        const totalExpenses = fExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        
        const customerReturns = fReturns.filter(r => r.type === 'customer').reduce((sum, r) => sum + (r.totalAmount || 0), 0);
        const supplierReturns = fReturns.filter(r => r.type === 'supplier').reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        // صافي الدخل: أرباح المبيعات - المصروفات
        const netIncome = totalProfit - totalExpenses;

        return { totalSales, totalProfit, totalPurchases, totalExpenses, customerReturns, supplierReturns, netIncome };
    }, [sales, purchases, expenses, returns, startDate, endDate]);

    // رسم الرسم البياني Chart.js
    useEffect(() => {
        if (!chartRef.current || !window.Chart) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new window.Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['مبيعات', 'مشتريات', 'أرباح', 'مصروفات', 'مرتجعات عملاء', 'مردودات موردين'],
                datasets: [{
                    label: 'الماليات (ج.م)',
                    data: [stats.totalSales, stats.totalPurchases, stats.totalProfit, stats.totalExpenses, stats.customerReturns, stats.supplierReturns],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)', // أخضر للمبيعات
                        'rgba(59, 130, 246, 0.8)', // أزرق للمشتريات
                        'rgba(16, 185, 129, 0.4)', // أخضر فاتح للأرباح
                        'rgba(244, 63, 94, 0.8)',  // أحمر للمصروفات
                        'rgba(249, 115, 22, 0.8)', // برتقالي مرتجع عملاء
                        'rgba(168, 85, 247, 0.8)'  // بنفسجي مردود موردين
                    ],
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });

        return () => { if(chartInstance.current) chartInstance.current.destroy(); }
    }, [stats]);

    return (
        <div className="space-y-6 animate-view">
            {/* بطاقات الإحصائيات العلوية */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-emerald-50 text-emerald-600"><i className="fas fa-coins"></i></div>
                    <div><p className="text-xs font-bold text-slate-500">إجمالي المبيعات</p><p className="text-xl font-black text-emerald-600">{stats.totalSales} ج</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-blue-50 text-blue-600"><i className="fas fa-cart-arrow-down"></i></div>
                    <div><p className="text-xs font-bold text-slate-500">المشتريات</p><p className="text-xl font-black text-blue-600">{stats.totalPurchases} ج</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-rose-50 text-rose-600"><i className="fas fa-file-invoice-dollar"></i></div>
                    <div><p className="text-xs font-bold text-slate-500">المصروفات</p><p className="text-xl font-black text-rose-600">{stats.totalExpenses} ج</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${stats.netIncome >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}><i className="fas fa-wallet"></i></div>
                    <div><p className="text-xs font-bold text-slate-500">صافي الدخل (أرباح-مصروفات)</p><p className={`text-xl font-black ${stats.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{stats.netIncome} ج</p></div>
                </div>
            </div>

            {/* الرسم البياني والمرتجعات */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-[350px]">
                    <h3 className="font-black text-slate-700 mb-4 text-sm">التدفق النقدي للمدة المحددة</h3>
                    <div className="h-[270px] w-full"><canvas ref={chartRef}></canvas></div>
                </div>
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                    <h3 className="font-black text-slate-700 text-sm">إحصائية المرتجعات</h3>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex-1 flex flex-col justify-center items-center text-center">
                        <i className="fas fa-user-clock text-3xl text-orange-400 mb-2"></i>
                        <span className="text-xs font-bold text-slate-600">مرتجعات العملاء (مردود)</span>
                        <span className="text-2xl font-black text-orange-600 mt-1">{stats.customerReturns} ج.م</span>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex-1 flex flex-col justify-center items-center text-center">
                        <i className="fas fa-truck-loading text-3xl text-purple-400 mb-2"></i>
                        <span className="text-xs font-bold text-slate-600">مردودات للموردين (مسترد)</span>
                        <span className="text-2xl font-black text-purple-600 mt-1">{stats.supplierReturns} ج.م</span>
                    </div>
                </div>
            </div>
        </div>
    );
};