// المسار: components/Backup/Module_Backup_Container.js

window.BackupMainContainer = function(props) {
    const { useState } = React;
    const { ExportManager, ImportManager } = window;

    const [activeTab, setActiveTab] = useState('export'); 

    return (
        <div className="space-y-6 h-full flex flex-col animate-view">
            
            <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 max-w-lg mx-auto w-full shrink-0">
                <button onClick={() => setActiveTab('export')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'export' ? 'bg-[#10B981] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-cloud-download-alt text-lg"></i> تصدير (حفظ نسخة)
                </button>
                <button onClick={() => setActiveTab('import')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'import' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    <i className="fas fa-cloud-upload-alt text-lg"></i> استيراد (استرجاع بيانات)
                </button>
            </div>

            <div className="flex-1 w-full pb-10">
                {activeTab === 'export' && <ExportManager {...props} />}
                {activeTab === 'import' && <ImportManager {...props} />}
            </div>
        </div>
    );
};