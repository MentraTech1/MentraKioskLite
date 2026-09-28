// المسار: components/Returns/NewReturn.js

window.NewReturn = function({ products, showToast }) {
    const { useState, useMemo } = React;
    const ITEMS_PER_PAGE = 6;
    
    const [returnType, setReturnType] = useState('customer'); // 'customer' or 'supplier'
    const [productPage, setProductPage] = useState(1);
    const [productSearch, setProductSearch] = useState('');
    
    // سلة المرتجعات
    const [returnCart, setReturnCart] = useState([]);

    // تفريغ السلة عند تغيير نوع المرتجع لمنع الأخطاء
    const handleTypeChange = (type) => {
        setReturnType(type);
        setReturnCart([]);
        setProductPage(1);
    };

    // فلترة المنتجات المعروضة
    const filteredProducts = useMemo(() => {
        let result = products;
        if (productSearch.trim()) {
            const query = productSearch.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(query) || (p.barcode && p.barcode.includes(query)));
        }
        return result;
    }, [products, productSearch]);

    const paginatedProducts = useMemo(() => {
        const start = (productPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProducts, productPage]);

    const totalProductPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;

    // إضافة منتج للسلة
    const addToCart = (product) => {
        // التحقق من الرصيد إذا كان مرتجع للمورد (لا يمكن إرجاع ما لا نملكه)
        const existingItem = returnCart.find(item => item.productId === product.id);
        const currentQtyInCart = existingItem ? existingItem.qty : 0;

        if (returnType === 'supplier' && product.total_stock_pieces <= currentQtyInCart) {
            showToast(`لا يوجد رصيد كافي في المخزن لإرجاعه للمورد`, 'error');
            return;
        }

        const unitPrice = returnType === 'customer' ? product.sell_price_piece : product.cost_price_piece;

        if (existingItem) {
            setReturnCart(returnCart.map(item => item.productId === product.id ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setReturnCart([...returnCart, { 
                productId: product.id, 
                name: product.name, 
                unitPrice: unitPrice, 
                qty: 1,
                maxStock: product.total_stock_pieces 
            }]);
        }
    };

    const updateCartQty = (productId, newQty) => {
        if (newQty < 1) {
            setReturnCart(returnCart.filter(item => item.productId !== productId));
            return;
        }
        const item = returnCart.find(i => i.productId === productId);
        if (returnType === 'supplier' && newQty > item.maxStock) {
            showToast('لا يمكنك تخطي الرصيد الفعلي بالمخزن', 'error');
            return;
        }
        setReturnCart(returnCart.map(item => item.productId === productId ? { ...item, qty: newQty } : item));
    };

    const cartTotalAmount = returnCart.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);

    // حفظ سلة المرتجعات
    const handleProcessReturn = async () => {
        if (returnCart.length === 0) return;

        try {
            await window.db.transaction('rw', window.db.returns, window.db.products, async () => {
                for (let item of returnCart) {
                    const productInDb = await window.db.products.get(item.productId);
                    let newStock = productInDb.total_stock_pieces;

                    if (returnType === 'customer') {
                        newStock += item.qty; // العميل أرجع بضاعة (المخزون يزيد)
                    } else {
                        if (newStock < item.qty) throw new Error(`الرصيد لا يكفي لـ ${item.name}`);
                        newStock -= item.qty; // ردينا بضاعة للمورد (المخزون يقل)
                    }

                    // تحديث المخزون
                    await window.db.products.update(item.productId, { total_stock_pieces: newStock });

                    // تسجيل الحركة
                    await window.db.returns.add({
                        type: returnType,
                        productId: item.productId,
                        productName: item.name,
                        quantity: item.qty,
                        unitPrice: item.unitPrice,
                        totalAmount: item.qty * item.unitPrice,
                        date: new Date().toISOString()
                    });
                }
            });

            showToast('تم تسجيل المرتجعات وتحديث المخزن بنجاح', 'success');
            setReturnCart([]);
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const themeColor = returnType === 'customer' ? 'orange' : 'rose';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-view">
            
            {/* الجانب الأيمن: المنتجات */}
            <div className="lg:col-span-7 space-y-4">
                {/* محدد نوع المرتجع */}
                <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <button onClick={() => handleTypeChange('customer')} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${returnType === 'customer' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-orange-50'}`}>
                        <i className="fas fa-user"></i> من عميل (دخول للمخزن)
                    </button>
                    <button onClick={() => handleTypeChange('supplier')} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${returnType === 'supplier' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-rose-50'}`}>
                        <i className="fas fa-truck"></i> إلى مورد (خروج للمخزن)
                    </button>
                </div>

                <div className="relative">
                    <input type="text" value={productSearch} onChange={(e) => {setProductSearch(e.target.value); setProductPage(1);}} placeholder="بحث باسم المنتج أو الباركود..." className={`w-full bg-white border-2 border-slate-200 p-4 pl-12 rounded-2xl outline-none focus:border-${themeColor}-500 transition-colors font-bold text-slate-700 shadow-sm`} />
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-400"></i>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col justify-between">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {paginatedProducts.length === 0 ? (
                            <div className="col-span-full text-center py-10 text-slate-400 font-bold">لا يوجد منتجات</div>
                        ) : (
                            paginatedProducts.map(p => {
                                const stockInfo = window.KioskQueries.getProductStockStatus(p);
                                const isOutOfStock = p.total_stock_pieces <= 0;
                                const disableSupplierReturn = returnType === 'supplier' && isOutOfStock;

                                return (
                                    <button key={p.id} onClick={() => !disableSupplierReturn && addToCart(p)} disabled={disableSupplierReturn} className={`p-4 rounded-xl border-2 text-right transition-all flex flex-col ${disableSupplierReturn ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed' : `border-slate-100 bg-slate-50 hover:border-${themeColor}-500 hover:shadow-md`}`}>
                                        <span className="font-black text-slate-800 text-sm mb-1 truncate w-full">{p.name}</span>
                                        <span className={`text-${themeColor}-600 font-bold text-sm`}>{returnType === 'customer' ? p.sell_price_piece : p.cost_price_piece} ج.م</span>
                                        <span className={`text-[10px] font-bold mt-2 ${disableSupplierReturn ? 'text-rose-500' : 'text-slate-400'}`}>رصيد: {stockInfo.display}</span>
                                    </button>
                                )
                            })
                        )}
                    </div>
                    
                    {totalProductPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-slate-100">
                            <button onClick={() => setProductPage(prev => Math.max(prev - 1, 1))} disabled={productPage === 1} className={`w-10 h-10 rounded-xl bg-slate-100 hover:bg-${themeColor}-500 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center`}><i className="fas fa-chevron-right"></i></button>
                            <button onClick={() => setProductPage(prev => Math.min(prev + 1, totalProductPages))} disabled={productPage === totalProductPages} className={`w-10 h-10 rounded-xl bg-slate-100 hover:bg-${themeColor}-500 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center`}><i className="fas fa-chevron-left"></i></button>
                        </div>
                    )}
                </div>
            </div>

            {/* الجانب الأيسر: سلة المرتجعات */}
            <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[550px] overflow-hidden">
                    <div className={`p-4 text-white flex justify-between items-center ${returnType === 'customer' ? 'bg-orange-600' : 'bg-rose-600'}`}>
                        <h3 className="font-black"><i className="fas fa-undo-alt mr-2"></i> سلة المرتجعات</h3>
                        <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded-full">{returnCart.length} أصناف</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
                        {returnCart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                <i className="fas fa-box-open text-5xl mb-3"></i>
                                <p className="font-bold text-sm">لم يتم تحديد منتجات</p>
                            </div>
                        ) : (
                            returnCart.map(item => (
                                <div key={item.productId} className="bg-white p-3 rounded-xl mb-2 shadow-sm border border-slate-100 flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                                        <p className={`font-bold text-xs text-${themeColor}-600`}>{item.unitPrice} ج.م</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg shrink-0">
                                        <button onClick={() => updateCartQty(item.productId, item.qty - 1)} className="w-7 h-7 rounded bg-white text-slate-600 shadow-sm font-bold flex items-center justify-center hover:bg-slate-200">-</button>
                                        <span className="w-6 text-center font-black text-sm">{item.qty}</span>
                                        <button onClick={() => updateCartQty(item.productId, item.qty + 1)} className="w-7 h-7 rounded bg-white text-slate-600 shadow-sm font-bold flex items-center justify-center hover:bg-slate-200">+</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4 text-lg font-black text-slate-800">
                            <span>إجمالي المرتجع:</span><span className={`text-${themeColor}-600 text-2xl`}>{cartTotalAmount} ج.م</span>
                        </div>
                        <button onClick={handleProcessReturn} disabled={returnCart.length === 0} className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 text-lg disabled:opacity-50 ${returnType === 'customer' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
                            <i className="fas fa-check-circle"></i> تأكيد حفظ المرتجعات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};