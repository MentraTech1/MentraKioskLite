// المسار: components/Settings/KioskSettings.js

window.KioskSettings = function({ kioskId, showToast }) {
    const { useState, useEffect } = React;
    const [formData, setFormData] = useState({ kioskName: '', ownerName: '' });

    useEffect(() => {
        const fetchKioskData = async () => {
            await window.masterDb.open();
            const kiosk = await window.masterDb.kiosks.get(kioskId);
            if (kiosk) setFormData({ kioskName: kiosk.kioskName, ownerName: kiosk.ownerName });
        };
        fetchKioskData();
    }, [kioskId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await window.masterDb.kiosks.update(kioskId, {
                kioskName: formData.kioskName,
                ownerName: formData.ownerName
            });

            // تحديث الجلسة
            const session = JSON.parse(localStorage.getItem('MentraKiosk_Session'));
            session.kiosk_name = formData.kioskName;
            localStorage.setItem('MentraKiosk_Session', JSON.stringify(session));

            showToast('تم تحديث بيانات الماركت بنجاح', 'success');
            setTimeout(() => window.location.reload(), 1500); // تحديث الصفحة لتطبيق التعديلات
        } catch (error) {
            showToast('حدث خطأ أثناء الحفظ', 'error');
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-view">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl"><i className="fas fa-store-alt"></i></div>
                <h2 className="text-lg font-black text-slate-800">البيانات الأساسية للماركت</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-bold text-slate-500 block mb-1">اسم الماركت / الكشك (يظهر بالفواتير)</label>
                    <input type="text" required value={formData.kioskName} onChange={e => setFormData({...formData, kioskName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-bold text-blue-700" />
                </div>
                <div>
                    <label className="text-sm font-bold text-slate-500 block mb-1">اسم المالك</label>
                    <input type="text" required value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-bold" />
                </div>
                
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2 transition-colors">
                    <i className="fas fa-check-circle"></i> تحديث بيانات النظام
                </button>
            </form>
        </div>
    );
};