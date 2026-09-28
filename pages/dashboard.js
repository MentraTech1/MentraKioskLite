// المسار: pages/dashboard.js

window.Module_Dashboard = function(props) {
    const { useState, useEffect } = React;
    const [componentsLoaded, setComponentsLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                // تحميل مكتبة الرسم البياني ديناميكياً
                if (!window.Chart) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = "assets/chart.js";
                        script.onload = resolve;
                        script.onerror = () => reject(new Error("فشل تحميل مكتبة الرسوم البيانية"));
                        document.head.appendChild(script);
                    });
                }

                // إضافة مكون الرسم البياني (SalesChart) للقائمة
                const filesToLoad = [
                    'components/Dashboard/QuickShortcuts.js',
                    'components/Dashboard/QuickStats.js',
                    'components/Dashboard/SalesChart.js',
                    'components/Dashboard/RecentActivity.js',
                    'components/Dashboard/Module_Dashboard_Container.js'
                ];

                for (const file of filesToLoad) {
                    if (window[file.split('/').pop().split('.')[0]]) continue;
                    
                    const res = await fetch(`${file}?v=${Date.now()}`);
                    if (!res.ok) throw new Error(`تعذر تحميل: ${file}`);
                    
                    const rawScript = await res.text();
                    const compiled = window.Babel.transform(rawScript, { presets: ['react'] }).code;
                    
                    const scriptEl = document.createElement('script');
                    scriptEl.text = compiled;
                    document.body.appendChild(scriptEl);
                }
                setComponentsLoaded(true);
            } catch (err) {
                setError(err.message);
            }
        };

        loadDependencies();
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-rose-50 rounded-3xl border border-rose-200">
                <i className="fas fa-exclamation-triangle text-4xl text-rose-500 mb-4"></i>
                <span className="text-rose-700 font-bold text-lg">خطأ في التحميل:</span>
                <span className="text-rose-500 mt-2 text-sm">{error}</span>
            </div>
        );
    }

    if (!componentsLoaded || !window.DashboardMainContainer) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <i className="fas fa-home fa-spin text-5xl text-emerald-500 mb-4"></i>
                <span className="text-slate-500 font-bold text-lg">جاري تجهيز لوحة التحكم...</span>
            </div>
        );
    }

    return React.createElement(window.DashboardMainContainer, props);
};