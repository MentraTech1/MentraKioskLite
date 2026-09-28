// المسار: pages/reports.js

window.Module_Reports = function(props) {
    const { useState, useEffect } = React;
    const [componentsLoaded, setComponentsLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                // 1. تحميل مكتبة Chart.js ديناميكياً للرسوم البيانية
                if (!window.Chart) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = "assets/chart.js";
                        script.onload = resolve;
                        script.onerror = () => reject(new Error("فشل تحميل مكتبة الرسوم البيانية"));
                        document.head.appendChild(script);
                    });
                }

                // 2. تحميل مكونات التقارير
                const filesToLoad = [
                    'components/Reports/OverviewStats.js',
                    'components/Reports/DetailedTables.js',
                    'components/Reports/Module_Reports_Container.js'
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
                <span className="text-rose-700 font-bold text-lg">خطأ في تحميل التقارير:</span>
                <span className="text-rose-500 mt-2 text-sm">{error}</span>
            </div>
        );
    }

    if (!componentsLoaded || !window.ReportsMainContainer) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <i className="fas fa-chart-pie fa-spin text-5xl text-blue-500 mb-4"></i>
                <span className="text-slate-500 font-bold text-lg">جاري تجهيز الرسوم البيانية والتقارير...</span>
            </div>
        );
    }

    return React.createElement(window.ReportsMainContainer, props);
};