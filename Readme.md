<div align="center">
  <img src="assets/logo.png" alt="Mentra Kiosk Logo" width="120"/>
  <h1>Mentra Kiosk Lite (Web Edition)</h1>
  <p><strong>نظام كاشير وإدارة نقاط بيع (POS) متكامل يعمل بالكامل داخل متصفح الويب بدون الحاجة لخوادم وبدون إنترنت.</strong></p>
  
  ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB-blue?style=for-the-badge)
</div>

<br>

## 📌 عن المشروع
**Mentra Kiosk Lite** هو نظام إدارة مبيعات ومخازن صُمم خصيصاً للأكشاك والمحلات التجارية. تعتمد هذه النسخة (Web Version) على معمارية **Offline-First**، حيث تعمل بالكامل من خلال متصفح الويب (Client-Side) وتقوم بتخزين جميع فواتير وبيانات المستخدم في قاعدة بيانات المتصفح المحلية (`IndexedDB`) لضمان الخصوصية وسرعة الأداء المطلقة بدون الحاجة لاتصال بالإنترنت.

---

## ✨ المميزات الرئيسية
* 🛒 **شاشة كاشير فائقة السرعة (POS):** تدعم مسح الباركود، تعديل الكميات، وتطبيق الخصومات الفورية.
* 🖨️ **الطباعة الحرارية:** توافق تام مع طابعات الإيصالات (Receipt Printers) من خلال المتصفح.
* 📦 **وحدات مخزون مزدوجة:** إمكانية شراء البضاعة بالـ (كرتونة) وبيعها بالـ (قطعة) مع معالجة رياضية دقيقة للرصيد.
* 📉 **إدارة الأرباح والمصروفات:** احتساب تلقائي لصافي الربح بعد خصم تكلفة البضاعة المباعة والمصروفات التشغيلية.
* 🔄 **النسخ الاحتياطي (Backup):** نظام متقدم لتصدير قاعدة البيانات بالكامل إلى ملف `.json` واستعادتها في أي وقت لحماية البيانات من الضياع.
* 📊 **تصدير إكسل:** استخراج تقارير المبيعات والأرباح مباشرة إلى ملفات CSV.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)
تم بناء هذا المشروع بهيكلية فريدة لا تتطلب أدوات بناء معقدة (No Build Step) ليكون سهل النشر والاستخدام الفوري:
* **UI/UX:** HTML5, CSS3, **Tailwind CSS** (via Script).
* **Logic:** JavaScript (ES6+), **React.js** (loaded via CDN).
* **JSX Compilation:** **Babel Standalone** (لترجمة أكواد React داخل المتصفح مباشرة).
* **Database:** **Dexie.js** (مكتبة رائعة لتسهيل التعامل مع `IndexedDB`).
* **Icons:** FontAwesome 6.

---

## 📂 هيكلية المشروع (Folder Structure)

```text
mentra-kiosk-lite/
├── index.html           # الصفحة الرئيسية (Landing Page)
├── subscriptions.html   # شاشة تسجيل الدخول وتأسيس الكشك
├── dashboard.html       # شاشة التطبيق الرئيسية (App Shell)
├── database.js          # مخطط قاعدة البيانات (Dexie Schema)
├── assets/              # مجلد الصور والمكتبات (React, Babel, Dexie, Tailwind)
│   ├── logo.png
│   ├── react.production.min.js
│   └── ...
└── pages/               # شاشات النظام (React Components)
    ├── pos.js           # شاشة الكاشير
    ├── inventory.js     # المخزن والمنتجات
    ├── purchases.js     # المشتريات والموردين
    ├── returns.js       # المرتجعات والمصروفات
    ├── reports.js       # التقارير
    ├── settings.js      # الإعدادات
    └── backup.js        # النسخ الاحتياطي