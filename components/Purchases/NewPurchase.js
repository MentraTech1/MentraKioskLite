// المسار: components/Purchases/NewPurchase.js

window.NewPurchase = function({ products, suppliers, showToast }) {
    const { useState, useEffect, useMemo } = React;
    const ITEMS_PER_PAGE = 4;

    const [productPage, setProductPage] = useState(1);
    const [productSearch, setProductSearch] = useState('');
    
    // المورد والخصم والسلة
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [supplierSearchInput, setSupplierSearchInput] = useState('');
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    
    const [purchaseCart, setPurchaseCart] = useState([]);
    const [discount, setDiscount] = useState(0); // ميزة الخصم الجديدة
    
    const [isAddCartModalOpen, setIsAddCartModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [cartForm, setCartForm] = useState({ buyUnit: 'كرتونة', qtyBought: 1, unitPrice: 0 });

    useEffect(() => {
        const handleClickOutside = () => setIsSupplierDropdownOpen(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const searchFilteredSuppliers = useMemo(() => {
        return suppliers.filter(s =>
            s.name.toLowerCase().includes(supplierSearchInput.toLowerCase()) ||
            (s.phone && s.phone.includes(supplierSearchInput))
        );
    }, [suppliers, supplierSearchInput]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode && p.barcode.includes(productSearch)));
    }, [products, productSearch]);

    const paginatedProducts = useMemo(() => {
        const start = (productPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProducts, productPage]);

    const totalProductPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;

    const openAddCartModal = (product) => {
        setSelectedProduct(product);
        setCartForm({ buyUnit: product.purchase_unit, qtyBought: 1, unitPrice: product.cost_price_carton });
        setIsAddCartModalOpen(true);
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        const existingItemIndex = purchaseCart.findIndex(item => item.productId === selectedProduct.id && item.buyUnit === cartForm.buyUnit);
        
        const newItem = {
            productId: selectedProduct.id, name: selectedProduct.name,
            buyUnit: cartForm.buyUnit, qtyBought: Number(cartForm.qtyBought), unitPrice: Number(cartForm.unitPrice)
        };

        if (existingItemIndex >= 0) {
            const updatedCart = [...purchaseCart];
            updatedCart[existingItemIndex].qtyBought += newItem.qtyBought;
            updatedCart[existingItemIndex].unitPrice = newItem.unitPrice;
            setPurchaseCart(updatedCart);
        } else {
            setPurchaseCart([...purchaseCart, newItem]);
        }
        setIsAddCartModalOpen(false);
    };

    const removeFromCart = (index) => {
        const newCart = [...purchaseCart];
        newCart.splice(index, 1);
        setPurchaseCart(newCart);
    };

    // حسابات الفاتورة والخصم
    const cartTotalAmount = purchaseCart.reduce((sum, item) => sum + (item.qtyBought * item.unitPrice), 0);
    const netTotal = cartTotalAmount - discount;

    const handleProcessPurchase = async () => {
        if (!selectedSupplierId) { showToast('برجاء اختيار المورد أولاً من القائمة', 'error'); return; }
        if (purchaseCart.length === 0) { showToast('الفاتورة فارغة', 'error'); return; }
        if (netTotal < 0) { showToast('قيمة الخصم أكبر من الفاتورة', 'error'); return; }

        try {
            // نمرر صافي الفاتورة لدالة الشراء، ثم نقوم بتحديث السجل لضمان حفظ قيمة الخصم في قاعدة البيانات
            const purchaseId = await window.KioskQueries.processPurchase(Number(selectedSupplierId), purchaseCart, netTotal);
            
            await window.db.purchases.update(purchaseId, { 
                totalAmount: cartTotalAmount, 
                discount: discount, 
                netAmount: netTotal 
            });

            showToast('تم تسجيل فاتورة المشتريات وإضافة الرصيد للمخزن بنجاح', 'success');
            setPurchaseCart([]);
            setDiscount(0);
            setSelectedSupplierId('');
            setSupplierSearchInput('');
        } catch(error) { showToast(error.message, 'error'); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-view">
            
            {/* الجانب الأيمن: المنتجات */}
            <div className="lg:col-span-7 space-y-4">
                <div className="relative">
                    <input type="text" value={productSearch} onChange={(e) => {setProductSearch(e.target.value); setProductPage(1);}} placeholder="بحث عن منتج لشرائه..." className="w-full bg-white border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:border-blue-500 font-bold text-sm shadow-sm" />
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-3">
                        {paginatedProducts.length === 0 ? (
                            <div className="col-span-2 text-center py-10 text-slate-400 font-bold">لا يوجد منتجات</div>
                        ) : (
                            paginatedProducts.map(p => {
                                const stockInfo = window.KioskQueries.getProductStockStatus(p);
                                return (
                                    <button key={p.id} onClick={() => openAddCartModal(p)} className="p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-blue-500 hover:shadow-md text-right transition-all flex flex-col">
                                        <span className="font-black text-slate-800 text-sm mb-1 truncate w-full">{p.name}</span>
                                        <span className="text-[10px] text-slate-500 font-bold">ت. الكرتونة: {p.cost_price_carton} ج.م</span>
                                        <span className="text-[10px] font-bold mt-2 text-blue-600">بالمخزن: {stockInfo.display}</span>
                                    </button>
                                )
                            })
                        )}
                    </div>
                    
                    {totalProductPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-slate-100">
                            <button onClick={() => setProductPage(prev => Math.max(prev - 1, 1))} disabled={productPage === 1} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"><i className="fas fa-chevron-right"></i></button>
                            <button onClick={() => setProductPage(prev => Math.min(prev + 1, totalProductPages))} disabled={productPage === totalProductPages} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"><i className="fas fa-chevron-left"></i></button>
                        </div>
                    )}
                </div>
            </div>

            {/* الجانب الأيسر: فاتورة الشراء */}
            <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px] overflow-hidden">
                    
                    {/* المورد */}
                    <div className="p-4 bg-[#0F172A] text-white relative" onClick={e => e.stopPropagation()}>
                        <label className="text-xs font-bold text-slate-300 block mb-1">المورد / شركة التوزيع <span className="text-rose-400">*</span></label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={supplierSearchInput}
                                onChange={(e) => {
                                    setSupplierSearchInput(e.target.value);
                                    setIsSupplierDropdownOpen(true);
                                    setSelectedSupplierId(''); 
                                }}
                                onFocus={() => setIsSupplierDropdownOpen(true)}
                                placeholder="ابحث عن مورد بالاسم أو الهاتف..."
                                className="w-full bg-slate-800 border border-slate-700 p-2.5 pl-10 rounded-xl outline-none text-white font-bold text-sm focus:border-blue-500 transition-colors"
                            />
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>

                            {isSupplierDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto text-slate-800">
                                    {searchFilteredSuppliers.length > 0 ? (
                                        searchFilteredSuppliers.map(s => (
                                            <div key={s.id} onClick={() => { setSelectedSupplierId(s.id); setSupplierSearchInput(s.name); setIsSupplierDropdownOpen(false); }} className="p-3 hover:bg-blue-50 cursor-pointer font-bold border-b border-slate-100 last:border-0 flex justify-between items-center transition-colors">
                                                <span>{s.name}</span><span className="text-xs text-slate-400" dir="ltr">{s.phone || 'بدون'}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-xs text-slate-400 font-bold text-center">لا يوجد مورد بهذا الاسم</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* السلة */}
                    <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
                        {purchaseCart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><i className="fas fa-boxes-packing text-5xl mb-3"></i><p className="font-bold text-sm">أضف منتجات لشرائها</p></div>
                        ) : (
                            purchaseCart.map((item, index) => (
                                <div key={index} className="bg-white p-3 rounded-xl mb-2 shadow-sm border border-slate-100 flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                                        <p className="text-blue-600 font-bold text-xs">{item.qtyBought} {item.buyUnit} × {item.unitPrice} ج</p>
                                    </div>
                                    <div className="font-black text-slate-700 mr-2">{item.qtyBought * item.unitPrice} ج</div>
                                    <button onClick={() => removeFromCart(index)} className="ml-2 w-8 h-8 rounded bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center"><i className="fas fa-times"></i></button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* الدفع والخصم */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2 text-sm font-bold text-slate-500">
                            <span>الإجمالي قبل الخصم:</span><span>{cartTotalAmount} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center mb-4 text-sm font-bold text-slate-500">
                            <span>خصم مكتسب من المورد:</span>
                            <input type="number" min="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-20 border border-slate-200 rounded px-2 py-1 outline-none text-left focus:border-blue-500 font-bold text-rose-500" />
                        </div>
                        <div className="flex justify-between items-center mb-4 text-lg font-black text-slate-800 border-t border-slate-100 pt-2">
                            <span>الصافي المطلوب دفعه:</span><span className="text-blue-600 text-2xl">{netTotal} ج.م</span>
                        </div>
                        <button onClick={handleProcessPurchase} disabled={purchaseCart.length === 0 || !selectedSupplierId} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 text-lg">
                            <i className="fas fa-check-double"></i> حفظ الفاتورة واستلام البضاعة
                        </button>
                    </div>
                </div>
            </div>

            {/* نافذة الإضافة للسلة */}
            {isAddCartModalOpen && selectedProduct && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-view">
                        <div className="p-5 bg-blue-600 text-white flex justify-between items-center">
                            <h2 className="font-black truncate pl-2">{selectedProduct.name}</h2>
                            <button onClick={() => setIsAddCartModalOpen(false)} className="text-white/50 hover:text-white"><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleAddToCart} className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">وحدة الشراء</label>
                                <select value={cartForm.buyUnit} onChange={(e) => setCartForm({...cartForm, buyUnit: e.target.value})} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-bold bg-slate-50">
                                    <option value={selectedProduct.purchase_unit}>{selectedProduct.purchase_unit} (افتراضي)</option>
                                    <option value={selectedProduct.sell_unit}>{selectedProduct.sell_unit} (فرط)</option>
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 block mb-1">الكمية</label>
                                    <input type="number" min="1" required value={cartForm.qtyBought} onChange={(e) => setCartForm({...cartForm, qtyBought: e.target.value})} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-black text-center text-lg" dir="ltr" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 block mb-1">سعر الوحدة (ج)</label>
                                    <input type="number" step="0.01" min="0" required value={cartForm.unitPrice} onChange={(e) => setCartForm({...cartForm, unitPrice: e.target.value})} className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-black text-center text-lg text-blue-600" dir="ltr" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 shadow-lg mt-4 flex justify-center gap-2">
                                <i className="fas fa-cart-plus"></i> إضافة للفاتورة
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};