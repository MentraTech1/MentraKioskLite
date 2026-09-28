// اسم الكاش ورقم الإصدار (قم بتغيير الرقم v1 إلى v2 عند إجراء أي تعديل على ملفات النظام ليتم التحديث لدى المستخدمين)
const CACHE_NAME = 'mentra-kiosk-lite-v1.0';

// قائمة بجميع الملفات التي يجب تخزينها ليعمل النظام بدون إنترنت
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './subscriptions.html',
    './dashboard.html',
    './Tutorial.html',
    './database.js',
    './manifest.json',
    
    // المكتبات المساعدة
    './assets/Tailwind.js',
    './assets/react.production.min.js',
    './assets/react-dom.production.min.js',
    './assets/babel.min.js',
    './assets/dexie.min.js',
    './assets/logo.png',
    
    // شاشات النظام (Components) التي يتم تحميلها ديناميكياً
    './pages/dashboard.js',
    './pages/pos.js',
    './pages/inventory.js',
    './pages/purchases.js',
    './pages/returns.js',
    './pages/reports.js',
    './pages/settings.js',
    './pages/backup.js',

    // صور الدليل الإرشادي
    './assets/steps/dashboard.PNG',
    './assets/steps/pos.PNG',
    './assets/steps/inventory.PNG',
    './assets/steps/purchases.PNG',
    './assets/steps/returns.PNG',
    './assets/steps/reports.PNG',
    './assets/steps/settings.PNG',
    './assets/steps/backup.PNG',

    // الخطوط والأيقونات الخارجية (سيتم تخزينها عند أول اتصال)
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. حدث التثبيت (Install) - يتم فيه حفظ الملفات الأساسية
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching all assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// 2. حدث التفعيل (Activate) - يتم فيه مسح الكاش القديم إذا تم تغيير رقم الإصدار
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. حدث الجلب (Fetch) - اعتراض الطلبات لتقديمها من الكاش إذا لم يتوفر إنترنت
self.addEventListener('fetch', (event) => {
    // تجاهل الطلبات التي ليست GET (مثل POST أو طلبات الإضافات Chrome extensions)
    if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // إذا وجد الملف في الكاش، قم بإرجاعه فوراً (سرعة قصوى + أوفلاين)
            if (cachedResponse) {
                return cachedResponse;
            }

            // إذا لم يجده في الكاش، قم بجلبه من الإنترنت
            return fetch(event.request).then((networkResponse) => {
                // التأكد من أن الاستجابة صالحة قبل تخزينها
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    // بالنسبة للخطوط الخارجية (CORS) type قد يكون opaque، لذا سنخزنها أيضاً
                    if (networkResponse && networkResponse.type === 'opaque') {
                        let responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                }

                // نسخة من الاستجابة لحفظها في الكاش للمرات القادمة
                let responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // في حالة انقطاع الإنترنت والملف غير موجود في الكاش
                // إذا كان الطلب لصفحة HTML، يمكننا إرجاع index.html أو رسالة خطأ
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});