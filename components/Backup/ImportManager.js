// المسار: components/Backup/ImportManager.js

window.ImportManager = function({ showToast }) {
    const { useState, useRef } = React;
    
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [isWarningOpen, setIsWarningOpen] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== "application/json" && !file.name.endsWith('.json')) {
            showToast('يجب اختيار ملف بصيغة JSON صالح', 'error');
            return;
        }
        setIsWarningOpen(true);
    };

    const executeRestore = async () => {
        const file = fileInputRef.current.files[0];
        if (!file) return;

        setIsWarningOpen(false);
        setIsImporting(true);
        setProgress(0);
        
        try {
            setStatusText('جاري قراءة وفك تشفير الملف...');
            const fileText = await file.text();
            const parsedData = JSON.parse(fileText);

            const tableNames = Object.keys(parsedData);
            if(tableNames.length === 0) throw new Error("الملف فارغ أو غير صالح");

            // 1. مسح كافة الجداول الحالية (التفريغ)
            setStatusText('جاري مسح البيانات القديمة بالكامل...');
            await Promise.all(window.db.tables.map(table => table.clear()));

            // 2. إدخال البيانات الجديدة على دفعات (Chunked bulkAdd)
            let currentTableIndex = 0;
            const totalTables = tableNames.length;

            for (const tableName of tableNames) {
                if (!window.db[tableName]) continue; // تخطي الجداول غير الموجودة في الـ Schema
                
                setStatusText(`جاري استعادة: ${tableName}...`);
                const tableData = parsedData[tableName];
                const chunkSize = 5000; // الإدخال كل 5000 سجل
                
                for (let i = 0; i < tableData.length; i += chunkSize) {
                    const chunk = tableData.slice(i, i + chunkSize);
                    await window.db[tableName].bulkAdd(chunk);
                    
                    // تحرير الـ Thread ليتمكن المتصفح من التنفس
                    await new Promise(resolve => setTimeout(resolve, 5));
                }

                currentTableIndex++;
                setProgress(Math.round((currentTableIndex / totalTables) * 100));
            }

            setStatusText('تمت الاستعادة بنجاح! جاري إعادة التشغيل...');
            showToast('تم استعادة البيانات بنجاح', 'success');

            // ضروري: مسح الجلسة وإعادة توجيه المستخدم لتسجيل الدخول لأن الـ IDs تغيرت
            setTimeout(() => {
                localStorage.removeItem('MentraKiosk_Session');
                window.location.replace('subscriptions.html');
            }, 2500);

        } catch (error) {
            console.error(error);
            showToast('الملف تالف أو حدث خطأ أثناء الاستعادة', 'error');
            setStatusText('فشلت عملية الاستعادة');
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center animate-view">
            <div className="w-24 h-24 bg-rose-50 rounded-full mx-auto flex items-center justify-center mb-6">
                <i className="fas fa-exclamation-triangle text-5xl text-rose-500"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">استعادة بيانات سابقة</h2>
            <p className="text-rose-600 font-bold text-sm mb-8 bg-rose-50 p-4 rounded-xl border border-rose-100">
                تحذير هام: استيراد ملف سيؤدي إلى <strong>حذف كافة البيانات الحالية</strong> على هذا الجهاز واستبدالها بالبيانات الموجودة في الملف بالكامل.
            </p>

            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />

            {!isImporting ? (
                <button onClick={() => fileInputRef.current.click()} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-3 mx-auto">
                    <i className="fas fa-folder-open"></i> اختيار ملف النسخة الاحتياطية
                </button>
            ) : (
                <div className="w-full max-w-md mx-auto mt-6">
                    <div className="flex justify-between items-center mb-2 text-sm font-bold text-slate-600">
                        <span>{statusText}</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div className="bg-rose-500 h-4 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}

            {/* نافذة التأكيد النهائي */}
            {isWarningOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-view text-center p-6">
                        <i className="fas fa-trash-alt text-5xl text-rose-500 mb-4 block"></i>
                        <h2 className="text-xl font-black text-slate-800 mb-2">تأكيد التفريغ والاستعادة</h2>
                        <p className="text-slate-500 font-bold text-sm mb-6">هل أنت متأكد تماماً؟ سيتم مسح النظام الحالي نهائياً واستبداله. سيتم تسجيل خروجك بعد الانتهاء.</p>
                        
                        <div className="flex flex-col gap-3">
                            <button onClick={executeRestore} className="w-full bg-rose-600 text-white font-black py-3 rounded-xl hover:bg-rose-700">نعم، امسح واستعد البيانات</button>
                            <button onClick={() => { setIsWarningOpen(false); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="w-full bg-slate-100 text-slate-700 font-black py-3 rounded-xl hover:bg-slate-200">تراجع وإلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};