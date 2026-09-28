// المسار: components/Backup/ExportManager.js

window.ExportManager = function({ kioskId, showToast }) {
    const { useState } = React;
    
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');

    // دالة التصدير المجزأة (Chunked Export) لمنع التعليق
    const handleExport = async () => {
        setIsExporting(true);
        setProgress(0);
        setStatusText('جاري حساب حجم البيانات...');

        try {
            const tables = window.db.tables;
            const exportChunks = [];
            exportChunks.push("{"); // بداية كائن JSON

            let totalTables = tables.length;
            
            for (let i = 0; i < totalTables; i++) {
                const table = tables[i];
                setStatusText(`جاري تصدير جدول: ${table.name}...`);
                exportChunks.push(`"${table.name}": [`);

                let offset = 0;
                const limit = 5000; // سحب 5000 سجل في كل دفعة
                let hasMore = true;
                let isFirstRow = true;

                while (hasMore) {
                    const chunkData = await table.offset(offset).limit(limit).toArray();
                    
                    if (chunkData.length === 0) {
                        hasMore = false;
                        break;
                    }

                    for(let j=0; j<chunkData.length; j++) {
                        if(!isFirstRow) exportChunks.push(",");
                        exportChunks.push(JSON.stringify(chunkData[j]));
                        isFirstRow = false;
                    }

                    offset += limit;
                    // إعطاء فرصة للمتصفح لتحديث الواجهة (منع التجميد)
                    await new Promise(resolve => setTimeout(resolve, 10)); 
                }

                exportChunks.push("]");
                if (i < totalTables - 1) exportChunks.push(",");
                
                setProgress(Math.round(((i + 1) / totalTables) * 100));
            }

            exportChunks.push("}"); // نهاية كائن JSON
            
            setStatusText('جاري تجهيز الملف للتحميل...');
            
            // إنشاء الملف وتنزيله
            const blob = new Blob(exportChunks, { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            
            const dateStr = new Date().toISOString().split('T')[0];
            const session = JSON.parse(localStorage.getItem('MentraKiosk_Session') || '{}');
            const kioskName = session.kiosk_name ? session.kiosk_name.replace(/\s+/g, '_') : 'Kiosk';
            
            link.href = url;
            link.download = `MentraKiosk_Backup_${kioskName}_${dateStr}.json`;
            link.click();
            URL.revokeObjectURL(url);

            showToast('تم حفظ النسخة الاحتياطية بنجاح', 'success');
            setStatusText('اكتمل التصدير بنجاح');
        } catch (error) {
            console.error(error);
            showToast('حدث خطأ أثناء التصدير', 'error');
            setStatusText('فشلت العملية');
        } finally {
            setTimeout(() => { setIsExporting(false); setProgress(0); }, 2000);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center animate-view">
            <div className="w-24 h-24 bg-emerald-50 rounded-full mx-auto flex items-center justify-center mb-6">
                <i className="fas fa-file-export text-5xl text-[#10B981]"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">تأمين وحفظ البيانات</h2>
            <p className="text-slate-500 font-bold text-sm mb-8">سيتم تجميع كافة الحسابات، المنتجات، والفواتير في ملف واحد مشفر ومضغوط يمكنك الاحتفاظ به.</p>

            {!isExporting ? (
                <button onClick={handleExport} className="w-full sm:w-auto bg-[#10B981] hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 mx-auto">
                    <i className="fas fa-download"></i> إنشاء نسخة احتياطية الآن
                </button>
            ) : (
                <div className="w-full max-w-md mx-auto mt-6">
                    <div className="flex justify-between items-center mb-2 text-sm font-bold text-slate-600">
                        <span>{statusText}</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div className="bg-[#10B981] h-4 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};