// المسار: pages/returns.js

window.Module_Returns = function(props) {
    const { useState, useEffect } = React;
    const [componentsLoaded, setComponentsLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadComponents = async () => {
            const filesToLoad = [
                'components/Returns/NewReturn.js',
                'components/Returns/CustomerReturns.js',
                'components/Returns/SupplierReturns.js',
                'components/Returns/ExpensesManager.js', // المكون الجديد
                'components/Returns/Module_Returns_Container.js'
            ];

            try {
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

        loadComponents();
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

    if (!componentsLoaded || !window.ReturnsMainContainer) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <i className="fas fa-circle-notch fa-spin text-5xl text-orange-500 mb-4"></i>
                <span className="text-slate-500 font-bold text-lg">جاري تجهيز النظام...</span>
            </div>
        );
    }

    return React.createElement(window.ReturnsMainContainer, props);
};