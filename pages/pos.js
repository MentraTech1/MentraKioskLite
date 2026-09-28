// المسار: pages/pos.js

window.Module_POS = function(props) {
    const { useState, useEffect } = React;
    const [componentsLoaded, setComponentsLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadComponents = async () => {
            const filesToLoad = [
                'components/Pos/DirectSale.js',
                'components/Pos/InvoiceHistory.js',
                'components/Pos/Module_POS_Container.js' // الحاوية الرئيسية للتبويبات
            ];

            try {
                for (const file of filesToLoad) {
                    // تجنب التحميل المزدوج إذا كان الملف موجوداً مسبقاً
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

    // حالة التحميل (تظهر داخل مساحة العمل فقط وليس على الشاشة كلها)
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-rose-50 rounded-3xl border border-rose-200">
                <i className="fas fa-exclamation-triangle text-4xl text-rose-500 mb-4"></i>
                <span className="text-rose-700 font-bold text-lg">خطأ في تحميل شاشة الكاشير:</span>
                <span className="text-rose-500 mt-2 text-sm">{error}</span>
            </div>
        );
    }

    if (!componentsLoaded || !window.PosMainContainer) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <i className="fas fa-circle-notch fa-spin text-5xl text-[#10B981] mb-4"></i>
                <span className="text-slate-500 font-bold text-lg">جاري تجهيز نظام الكاشير...</span>
            </div>
        );
    }

    // بمجرد التحميل، يتم عرض الحاوية الرئيسية مع تمرير جميع الخصائص (Props) القادمة من لوحة التحكم
    return React.createElement(window.PosMainContainer, props);
};