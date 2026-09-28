// المسار: pages/backup.js

window.Module_Backup = function(props) {
    const { useState, useEffect } = React;
    const [componentsLoaded, setComponentsLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadComponents = async () => {
            const filesToLoad = [
                'components/Backup/ExportManager.js',
                'components/Backup/ImportManager.js',
                'components/Backup/Module_Backup_Container.js'
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
                <span className="text-rose-700 font-bold text-lg">خطأ في تحميل النظام:</span>
                <span className="text-rose-500 mt-2 text-sm">{error}</span>
            </div>
        );
    }

    if (!componentsLoaded || !window.BackupMainContainer) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <i className="fas fa-database fa-spin text-5xl text-blue-500 mb-4"></i>
                <span className="text-slate-500 font-bold text-lg">جاري تجهيز نظام النسخ الاحتياطي...</span>
            </div>
        );
    }

    return React.createElement(window.BackupMainContainer, props);
};