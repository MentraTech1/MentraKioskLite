// المسار: components/Dashboard/SalesChart.js

window.SalesChart = function({ startDate, endDate }) {
    const { useMemo, useEffect, useRef } = React;
    const chartRef = useRef(null);
    let chartInstance = useRef(null);

    const sales = window.useLiveQuery(() => window.db.sales.toArray(), []) || [];

    // تجميع المبيعات والأرباح حسب اليوم
    const chartData = useMemo(() => {
        const start = new Date(startDate); start.setHours(0,0,0,0);
        const end = new Date(endDate); end.setHours(23,59,59,999);

        const dailyData = {};

        sales.forEach(s => {
            const dateObj = new Date(s.date);
            if (dateObj >= start && dateObj <= end) {
                // استخراج اليوم بصيغة (YYYY-MM-DD)
                const dayString = dateObj.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
                
                if (!dailyData[dayString]) {
                    dailyData[dayString] = { sales: 0, profit: 0 };
                }
                dailyData[dayString].sales += Number(s.netAmount) || 0;
                dailyData[dayString].profit += Number(s.profit) || 0;
            }
        });

        // تحويل الكائن إلى مصفوفات للرسم البياني
        const labels = Object.keys(dailyData); // الأيام
        const salesData = labels.map(label => dailyData[label].sales);
        const profitData = labels.map(label => dailyData[label].profit);

        return { labels, salesData, profitData };
    }, [sales, startDate, endDate]);

    useEffect(() => {
        if (!chartRef.current || !window.Chart) return;
        if (chartInstance.current) chartInstance.current.destroy();

        if (chartData.labels.length === 0) {
            // رسم فارغ إذا لم توجد بيانات
            const ctx = chartRef.current.getContext('2d');
            ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);
            ctx.font = "bold 14px Cairo";
            ctx.fillStyle = "#94A3B8";
            ctx.textAlign = "center";
            ctx.fillText("لا توجد حركة مبيعات في هذه المدة", chartRef.current.width / 2, chartRef.current.height / 2);
            return;
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new window.Chart(ctx, {
            type: 'line', // رسم خطي انسيابي
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'المبيعات (ج.م)',
                        data: chartData.salesData,
                        borderColor: '#10B981', // أخضر
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        tension: 0.4, // لجعل الخطوط منحنية وناعمة
                        fill: true
                    },
                    {
                        label: 'الأرباح (ج.م)',
                        data: chartData.profitData,
                        borderColor: '#3B82F6', // أزرق
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Cairo', weight: 'bold' } } },
                    tooltip: { titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' } }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f8fafc' } },
                    x: { grid: { display: false } }
                }
            }
        });

        return () => { if(chartInstance.current) chartInstance.current.destroy(); }
    }, [chartData]);

    return <canvas ref={chartRef}></canvas>;
};