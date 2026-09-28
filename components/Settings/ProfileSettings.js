// المسار: components/Settings/ProfileSettings.js

window.ProfileSettings = function({ userId, showToast }) {
    const { useState, useEffect } = React;
    const [formData, setFormData] = useState({ name: '', phone: '', password: '' });

    useEffect(() => {
        const fetchUserData = async () => {
            const user = await window.db.users.get(userId);
            if (user) setFormData({ name: user.name, phone: user.phone, password: user.password });
        };
        fetchUserData();
    }, [userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await window.db.users.update(userId, {
                name: formData.name,
                phone: formData.phone,
                password: formData.password
            });
            
            // تحديث الجلسة في المتصفح
            const session = JSON.parse(localStorage.getItem('MentraKiosk_Session'));
            session.name = formData.name;
            localStorage.setItem('MentraKiosk_Session', JSON.stringify(session));

            showToast('تم تحديث بيانات حسابك بنجاح', 'success');
            setTimeout(() => window.location.reload(), 1500); // تحديث الصفحة لتطبيق الاسم الجديد في القائمة الجانبية
        } catch (error) {
            showToast('حدث خطأ أثناء الحفظ', 'error');
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-view">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl"><i className="fas fa-user-cog"></i></div>
                <h2 className="text-lg font-black text-slate-800">تعديل بيانات حسابي</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-bold text-slate-500 block mb-1">الاسم</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold" />
                </div>
                <div>
                    <label className="text-sm font-bold text-slate-500 block mb-1">رقم الهاتف (يستخدم لتسجيل الدخول)</label>
                    <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-left" dir="ltr" />
                </div>
                <div>
                    <label className="text-sm font-bold text-slate-500 block mb-1">كلمة المرور</label>
                    <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-left" dir="ltr" />
                </div>
                
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2 transition-colors">
                    <i className="fas fa-save"></i> حفظ التعديلات
                </button>
            </form>
        </div>
    );
};