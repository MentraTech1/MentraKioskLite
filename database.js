// ============================================================================
// Mentra Kiosk Lite | Database Setup & Queries
// التقنية: Dexie.js (IndexedDB) - تصميم يدعم الوحدات المزدوجة (كرتونة/قطعة)
// ============================================================================

// 1. قاعدة البيانات الرئيسية (Master DB) للتحكم في الحسابات
window.masterDb = new Dexie("MentraKiosk_Master");
window.masterDb.version(1).stores({
    kiosks: '++id, kioskName, ownerName, phone, dbName, createdAt'
});

window.db = null;

// ============================================================================
// 2. تهيئة جداول الكشك
// ============================================================================
window.initKioskDB = async function(dbName) {
    window.db = new Dexie(dbName);
    
    window.db.version(1).stores({
        users: '++id, phone, role, status', 
        categories: '++id, name',
        
        // جدول المنتجات (تم تصميمه بناءً على طلبك الاحترافي)
        // لا نضع كل الحقول في الـ Index، فقط الحقول التي نبحث بها مثل الباركود والاسم
        products: '++id, barcode, categoryId, name',
        
        suppliers: '++id, name, phone',
        purchases: '++id, supplierId, date',
        purchase_items: '++id, purchaseId, productId',
        sales: '++id, userId, date, paymentMethod',
        sale_items: '++id, saleId, productId',
        returns: '++id, type, referenceId, productId, date',
        expenses: '++id, date, userId'
    });

    await window.db.open();
};

// ============================================================================
// 3. الاستعلامات والعمليات الديناميكية (Kiosk Queries)
// ============================================================================
window.KioskQueries = {
    
    // --- (نفس دوال التأسيس وتسجيل الدخول من الكود السابق) ---
    createKiosk: async (kioskName, ownerName, phone, password) => {
        const existing = await window.masterDb.kiosks.where('phone').equals(phone).first();
        if (existing) throw new Error("رقم الهاتف مسجل لكشك آخر مسبقاً.");
        const dbName = `KioskDB_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const kioskId = await window.masterDb.kiosks.add({ kioskName, ownerName, phone, dbName, createdAt: new Date().toISOString() });
        await window.initKioskDB(dbName);
        const userId = await window.db.users.add({ name: ownerName, phone, password, role: 'owner', status: 'active', createdAt: new Date().toISOString() });
        return { kioskId, userId, dbName };
    },
    login: async (dbName, phone, password) => {
        await window.initKioskDB(dbName);
        const user = await window.db.users.where('phone').equals(phone).first();
        if (!user || user.password !== password) throw new Error("بيانات الدخول غير صحيحة");
        if (user.status !== 'active') throw new Error("الحساب موقوف.");
        const kiosk = await window.masterDb.kiosks.where('dbName').equals(dbName).first();
        return { user, kiosk, dbName };
    },

    // ------------------------------------------------------------------------
    // أ. إدارة المنتجات (الديناميكية بين الكرتونة والقطعة)
    // ------------------------------------------------------------------------
    addProduct: async (data) => {
        /*
          البيانات المتوقعة (data):
          name, barcode, categoryId
          purchase_unit: "كرتونة" أو "قطعة"
          sell_unit: "قطعة"
          pieces_per_carton: (مثلاً 24. لو المنتج بيتباع حتة واحدة نخليه 1)
          cost_price_carton: (سعر الكرتونة)
          sell_price_piece: (سعر بيع القطعة)
        */
        
        // حساب تكلفة القطعة الواحدة أوتوماتيكياً (مهم جداً لحساب الأرباح بدقة)
        const piecesPerCarton = parseInt(data.pieces_per_carton) || 1;
        const costPricePiece = parseFloat(data.cost_price_carton) / piecesPerCarton;

        const newProduct = {
            name: data.name,
            barcode: data.barcode,
            categoryId: data.categoryId,
            purchase_unit: data.purchase_unit,
            sell_unit: data.sell_unit,
            pieces_per_carton: piecesPerCarton,
            cost_price_carton: parseFloat(data.cost_price_carton),
            cost_price_piece: costPricePiece,
            sell_price_piece: parseFloat(data.sell_price_piece),
            total_stock_pieces: 0 // الحقيقة المطلقة للمخزون
        };

        return await window.db.products.add(newProduct);
    },

    // السحر هنا: دالة تقوم بترجمة إجمالي القطع إلى (كراتين وقطع) لعرضها للمستخدم كما طلب
    getProductStockStatus: (product) => {
        const total = product.total_stock_pieces || 0;
        const ppc = product.pieces_per_carton || 1;
        
        // لو المنتج بيتباع بالقطعة فقط (زي ولاعة، كيس شيبسي فردي من مورد)
        if (ppc === 1 || product.purchase_unit === 'قطعة') {
            return { stock_cartons: 0, stock_pieces: total, display: `${total} ${product.sell_unit}` };
        }

        // لو المنتج كراتين
        const cartons = Math.floor(total / ppc);
        const pieces = total % ppc;
        
        return {
            stock_cartons: cartons,
            stock_pieces: pieces,
            display: `${cartons > 0 ? cartons + ' ' + product.purchase_unit : ''} ${pieces > 0 ? 'و ' + pieces + ' ' + product.sell_unit : ''}`.trim() || 'رصيد صفر'
        };
    },

    // ------------------------------------------------------------------------
    // ب. المشتريات (ديناميكية الشراء بوحدات مختلفة)
    // ------------------------------------------------------------------------
    processPurchase: async (supplierId, items, paidAmount) => {
        return await window.db.transaction('rw', window.db.purchases, window.db.purchase_items, window.db.products, async () => {
            let totalAmount = 0;
            const date = new Date().toISOString();

            const purchaseId = await window.db.purchases.add({ supplierId, totalAmount: 0, paidAmount, date, status: 'completed' });

            for (let item of items) {
                const product = await window.db.products.get(item.productId);
                
                // حساب إجمالي القطع اللي اشتريناها بناءً على الوحدة
                // item.qtyBought ممكن تكون 2 كرتونة، أو 5 قطع (حسب اختيار المستخدم في الشاشة)
                let addedPieces = 0;
                let unitCost = 0;

                if (item.buyUnit === product.purchase_unit && product.pieces_per_carton > 1) {
                    // اشترى بالكرتونة
                    addedPieces = item.qtyBought * product.pieces_per_carton;
                    unitCost = item.unitPrice / product.pieces_per_carton; // تكلفة القطعة
                    
                    // تحديث سعر الكرتونة لو المورد غلى السعر
                    await window.db.products.update(product.id, { cost_price_carton: item.unitPrice });
                } else {
                    // اشترى بالقطعة (فرط)
                    addedPieces = item.qtyBought;
                    unitCost = item.unitPrice;
                }

                const lineTotal = item.qtyBought * item.unitPrice;
                totalAmount += lineTotal;

                await window.db.purchase_items.add({
                    purchaseId, productId: item.productId,
                    buyUnit: item.buyUnit, qtyBought: item.qtyBought, total: lineTotal
                });

                // تحديث المخزون والسعر (إضافة القطع للمخزون الكلي)
                await window.db.products.update(item.productId, {
                    total_stock_pieces: product.total_stock_pieces + addedPieces,
                    cost_price_piece: unitCost
                });
            }

            await window.db.purchases.update(purchaseId, { totalAmount });
            return purchaseId;
        });
    },

    // ------------------------------------------------------------------------
    // ج. المبيعات (يتم البيع دائماً بوحدة البيع sell_unit وهي القطعة)
    // ------------------------------------------------------------------------
    processSale: async (userId, items, discount = 0, paymentMethod = 'cash') => {
        return await window.db.transaction('rw', window.db.sales, window.db.sale_items, window.db.products, async () => {
            let totalAmount = 0;
            let totalProfit = 0; // حساب الأرباح لحظياً
            const date = new Date().toISOString();

            const saleId = await window.db.sales.add({ userId, totalAmount: 0, profit: 0, discount, netAmount: 0, paymentMethod, date });

            for (let item of items) {
                const product = await window.db.products.get(item.productId);
                
                if (product.total_stock_pieces < item.qtySold) {
                    throw new Error(`الرصيد غير كافٍ للصنف: ${product.name}. المتاح: ${window.KioskQueries.getProductStockStatus(product).display}`);
                }

                const lineTotal = item.qtySold * item.sellPrice;
                const lineProfit = (item.sellPrice - product.cost_price_piece) * item.qtySold;
                
                totalAmount += lineTotal;
                totalProfit += lineProfit;

                await window.db.sale_items.add({
                    saleId, productId: item.productId,
                    qtySold: item.qtySold, unitPrice: item.sellPrice, total: lineTotal
                });

                // خصم المباع من إجمالي القطع (وهذا سينعكس أوتوماتيكياً على عدد الكراتين والقطع عند العرض)
                await window.db.products.update(item.productId, {
                    total_stock_pieces: product.total_stock_pieces - item.qtySold
                });
            }

            const netAmount = totalAmount - discount;
            const netProfit = totalProfit - discount; // خصم التخفيض من الربح
            
            await window.db.sales.update(saleId, { totalAmount, netAmount, profit: netProfit });
            
            return saleId;
        });
    }
};