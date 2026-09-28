// المسار: components/Dashboard/QuickStats.js

window.QuickStats = function({ startDate, endDate }) {
    const { useMemo } = React;

    const sales = window.useLiveQuery(() => window.db.sales.toArray(), []) || [];
    const expenses = window.useLiveQuery(() => window.db.expenses.toArray(), []) || [];
    const products = window.useLiveQuery(() => window.db.products.toArray(), []) || [];

    const stats = useMemo(() => {
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(endDate); end.setHours(23,59,59,999);

        const filteredSales = sales.filter(s => { const d = new Date(s.date); return d >= start && d <= end; });
        const filteredExpenses = expenses.filter(e => { const d = new Date(e.date); return d >= start && d <= end; });

        const totalSales = filteredSales.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);
        const totalProfit = filteredSales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        
        // حساب النواقص (منتجات رصيدها 5 فأقل)
        const lowStockCount = products.filter(p => (p.total_stock_pieces || 0) <= 5).length;

        return { 
            salesAmount: totalSales, 
            netProfit: totalProfit - totalExpenses, 
            expenses: totalExpenses,
            lowStock: lowStockCount
        };
    }, [sales, expenses, products, startDate, endDate]);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-500 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <i className="fas fa-coins absolute left-4 bottom-4 text-5xl opacity-20"></i>
                <p className="text-emerald-100 font-bold text-sm mb-1">المبيعات</p>
                <h3 className="text-2xl font-black">{stats.salesAmount} ج</h3>
            </div>
            
            <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <i className="fas fa-wallet absolute left-4 bottom-4 text-5xl opacity-20"></i>
                <p className="text-blue-100 font-bold text-sm mb-1">صافي الأرباح</p>
                <h3 className="text-2xl font-black">{stats.netProfit} ج</h3>
            </div>

            <div className="bg-rose-500 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <i className="fas fa-hand-holding-dollar absolute left-4 bottom-4 text-5xl opacity-20"></i>
                <p className="text-rose-100 font-bold text-sm mb-1">المصروفات</p>
                <h3 className="text-2xl font-black">{stats.expenses} ج</h3>
            </div>

            <div className="bg-amber-500 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <i className="fas fa-exclamation-triangle absolute left-4 bottom-4 text-5xl opacity-20"></i>
                <p className="text-amber-100 font-bold text-sm mb-1">نواقص المخزن</p>
                <h3 className="text-2xl font-black">{stats.lowStock} صنف</h3>
            </div>
        </div>
    );
};