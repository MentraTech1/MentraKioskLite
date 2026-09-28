// المسار: components/Inventory/ProductsManager.js

window.ProductsManager = function({ products, categories, showToast }) {
    const { useState, useEffect, useMemo } = React;
    const ITEMS_PER_PAGE = 4;

    const [currentPage, setCurrentPage] = useState(1);
    const [filterMode, setFilterMode] = useState('all'); 
    const [searchQuery, setSearchQuery] = useState('');
    
    // حالات نافذة المنتجات
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productFormData, setProductFormData] = useState({
        name: '', barcode: '', categoryId: '',
        purchase_unit: 'كرتونة', sell_unit: 'قطعة',
        pieces_per_carton: 1, cost_price_carton: '', sell_price_piece: ''
    });

    const [catSearch, setCatSearch] = useState('');
    const [showCatDropdown, setShowCatDropdown] = useState(false);

    // حالة الإضافة السريعة لقسم من داخل نافذة المنتج
    const [isQuickCatModalOpen, setIsQuickCatModalOpen] = useState(false);
    const [quickCatName, setQuickCatName] = useState('');

    useEffect(() => {
        const handleClickOutside = () => setShowCatDropdown(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const stats = useMemo(() => ({
        all: products.length,
        low: products.filter(p => p.total_stock_pieces > 0 && p.total_stock_pieces <= 10).length,
        out: products.filter(p => p.total_stock_pieces <= 0).length
    }), [products]);

    const filteredProducts = useMemo(() => {
        let result = products;
        if (filterMode === 'low') result = result.filter(p => p.total_stock_pieces > 0 && p.total_stock_pieces <= 10);
        else if (filterMode === 'out') result = result.filter(p => p.total_stock_pieces <= 0);

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(query) || (p.barcode && p.barcode.includes(query)));
        }
        return result;
    }, [products, filterMode, searchQuery]);

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    const totalProductPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;

    const handleSmartFilter = (mode) => {
        setFilterMode(mode);
        setCurrentPage(1);
    };

    const openProductModal = (product = null) => {
        if (product) {
            setProductFormData({
                name: product.name, barcode: product.barcode, categoryId: product.categoryId,
                purchase_unit: product.purchase_unit, sell_unit: product.sell_unit,
                pieces_per_carton: product.pieces_per_carton,
                cost_price_carton: product.cost_price_carton, sell_price_piece: product.sell_price_piece
            });
            setEditingProduct(product);
            const cat = categories.find(c => c.id === Number(product.categoryId));
            setCatSearch(cat ? cat.name : '');
        } else {
            setProductFormData({
                name: '', barcode: '', categoryId: '',
                purchase_unit: 'كرتونة', sell_unit: 'قطعة',
                pieces_per_carton: '', cost_price_carton: '', sell_price_piece: ''
            });
            setEditingProduct(null);
            setCatSearch('');
        }
        setShowCatDropdown(false);
        setIsProductModalOpen(true);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        if (!productFormData.categoryId) {
            showToast('برجاء اختيار قسم صحيح', 'error');
            return;
        }
        try {
            if (editingProduct) {
                const piecesPerCarton = parseInt(productFormData.pieces_per_carton) || 1;
                const costPricePiece = parseFloat(productFormData.cost_price_carton) / piecesPerCarton;
                await window.db.products.update(editingProduct.id, {
                    ...productFormData,
                    categoryId: Number(productFormData.categoryId),
                    pieces_per_carton: piecesPerCarton,
                    cost_price_carton: parseFloat(productFormData.cost_price_carton),
                    cost_price_piece: costPricePiece,
                    sell_price_piece: parseFloat(productFormData.sell_price_piece)
                });
                showToast('تم تعديل المنتج بنجاح', 'success');
            } else {
                await window.KioskQueries.addProduct({...productFormData, categoryId: Number(productFormData.categoryId)});
                showToast('تمت إضافة المنتج بنجاح', 'success');
            }
            setIsProductModalOpen(false);
        } catch (error) { showToast('خطأ أثناء الحفظ', 'error'); }
    };

    const handleProductDelete = async (id, name) => {
        if(confirm(`هل أنت متأكد من حذف المنتج: ${name} نهائياً؟`)) {
            await window.db.products.delete(id);
            showToast('تم الحذف', 'success');
            if (paginatedProducts.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
        }
    };

    // معالجة الإضافة السريعة لقسم
    const handleQuickCatSubmit = async (e) => {
        e.preventDefault();
        if (!quickCatName.trim()) return;
        try {
            const newId = await window.db.categories.add({ name: quickCatName.trim() });
            setProductFormData({...productFormData, categoryId: newId});
            setCatSearch(quickCatName.trim());
            setIsQuickCatModalOpen(false);
            setQuickCatName('');
            setIsProductModalOpen(true); // إعادة فتح نافذة المنتج
            showToast('تمت إضافة القسم الجديد', 'success');
        } catch(err) { showToast('حدث خطأ', 'error'); }
    };

    const filteredCategoriesForDropdown = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));

    return (
        <div className="animate-view space-y-6">
            {/* الإحصائيات الذكية */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => handleSmartFilter('all')} className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${filterMode === 'all' ? 'bg-[#10B981] border-[#10B981] text-white shadow-lg shadow-emerald-500/30' : 'bg-white border-slate-100 text-slate-600 hover:border-[#10B981]'}`}>
                    <div className="text-right">
                        <p className={`text-xs font-bold mb-1 ${filterMode === 'all' ? 'text-emerald-100' : 'text-slate-400'}`}>إجمالي المنتجات</p>
                        <p className="text-2xl font-black">{stats.all}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${filterMode === 'all' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-500 group-hover:bg-[#10B981] group-hover:text-white transition-colors'}`}><i className="fas fa-boxes"></i></div>
                </button>
                <button onClick={() => handleSmartFilter('low')} className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${filterMode === 'low' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white border-slate-100 text-slate-600 hover:border-amber-500'}`}>
                    <div className="text-right">
                        <p className={`text-xs font-bold mb-1 ${filterMode === 'low' ? 'text-amber-100' : 'text-slate-400'}`}>قارب على الانتهاء</p>
                        <p className="text-2xl font-black">{stats.low}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${filterMode === 'low' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors'}`}><i className="fas fa-exclamation-triangle"></i></div>
                </button>
                <button onClick={() => handleSmartFilter('out')} className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${filterMode === 'out' ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-white border-slate-100 text-slate-600 hover:border-rose-500'}`}>
                    <div className="text-right">
                        <p className={`text-xs font-bold mb-1 ${filterMode === 'out' ? 'text-rose-100' : 'text-slate-400'}`}>نفذ من الرصيد</p>
                        <p className="text-2xl font-black">{stats.out}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${filterMode === 'out' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors'}`}><i className="fas fa-times-circle"></i></div>
                </button>
            </div>

            {/* شريط البحث وزر الإضافة */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative w-full sm:w-96">
                    <input type="text" value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}} placeholder="بحث بالاسم أو الباركود..." className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:border-[#10B981] font-bold text-sm" />
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                </div>
                <button onClick={() => openProductModal()} className="w-full sm:w-auto bg-[#10B981] hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2">
                    <i className="fas fa-plus"></i> إضافة منتج جديد
                </button>
            </div>

            {/* شبكة المنتجات (Cards) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col justify-between">
                <div>
                    {paginatedProducts.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <i className="fas fa-box-open text-6xl mb-4 opacity-50 block"></i>
                            <p className="font-bold text-lg">لا توجد منتجات تطابق الفلتر</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {paginatedProducts.map(product => {
                                const stockInfo = window.KioskQueries.getProductStockStatus(product);
                                const isOut = product.total_stock_pieces <= 0;
                                const isLow = product.total_stock_pieces > 0 && product.total_stock_pieces <= 10;
                                return (
                                    <div key={product.id} className="bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-[#10B981] transition-all p-5 flex flex-col relative overflow-hidden group">
                                        {isOut && <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>}
                                        {isLow && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>}
                                        {!isOut && !isLow && <div className="absolute top-0 left-0 right-0 h-1 bg-[#10B981]"></div>}

                                        <div className="flex justify-between items-start mb-3">
                                            <div className="bg-white px-2 py-1 rounded text-[10px] font-black text-slate-500 border border-slate-200"><i className="fas fa-barcode mr-1"></i> {product.barcode || 'بدون'}</div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openProductModal(product)} className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-500 hover:text-white"><i className="fas fa-pen text-xs"></i></button>
                                                <button onClick={() => handleProductDelete(product.id, product.name)} className="w-7 h-7 rounded bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white"><i className="fas fa-trash text-xs"></i></button>
                                            </div>
                                        </div>
                                        <h3 className="font-black text-slate-800 text-lg mb-4 truncate">{product.name}</h3>
                                        <div className="bg-white rounded-xl p-3 border border-slate-200 mb-4 flex-1">
                                            <p className="text-[10px] text-slate-400 font-bold mb-1">الرصيد المتاح:</p>
                                            <p className={`font-black text-sm ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-[#10B981]'}`}>{stockInfo.display}</p>
                                        </div>
                                        <div className="flex justify-between items-end border-t border-slate-200 pt-3">
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold">التكلفة (كرتونة)</p>
                                                <p className="font-bold text-slate-600 text-xs">{product.cost_price_carton} ج</p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[9px] text-slate-400 font-bold">البيع (قطعة)</p>
                                                <p className="font-black text-[#10B981] text-lg leading-none">{product.sell_price_piece} <span className="text-[10px]">ج</span></p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalProductPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-slate-100">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50 hover:bg-[#10B981] hover:text-white flex items-center justify-center transition-colors"><i className="fas fa-chevron-right"></i></button>
                        <span className="font-black text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">صفحة {currentPage} من {totalProductPages}</span>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalProductPages))} disabled={currentPage === totalProductPages} className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50 hover:bg-[#10B981] hover:text-white flex items-center justify-center transition-colors"><i className="fas fa-chevron-left"></i></button>
                    </div>
                )}
            </div>

            {/* Modal: نافذة المنتجات */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[990] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-view" onClick={e => e.stopPropagation()}>
                        <div className="p-6 bg-[#0F172A] text-white flex justify-between items-center">
                            <h2 className="text-xl font-black">{editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h2>
                            <button onClick={() => setIsProductModalOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 flex items-center justify-center transition-colors"><i className="fas fa-times"></i></button>
                        </div>
                        
                        <form onSubmit={handleProductSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">اسم المنتج <span className="text-rose-500">*</span></label>
                                    <input type="text" value={productFormData.name} onChange={(e) => setProductFormData({...productFormData, name: e.target.value})} required className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-[#10B981] bg-slate-50 font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">الباركود</label>
                                    <input type="text" value={productFormData.barcode} onChange={(e) => setProductFormData({...productFormData, barcode: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-[#10B981] bg-slate-50 font-bold" dir="ltr" />
                                </div>

                                {/* Live Search Category */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">القسم <span className="text-rose-500">*</span></label>
                                    <div className="flex gap-2 relative">
                                        <div className="relative flex-1" onClick={e => e.stopPropagation()}>
                                            <input type="text" value={catSearch} onChange={(e) => { setCatSearch(e.target.value); setShowCatDropdown(true); setProductFormData({...productFormData, categoryId: ''}); }} onFocus={() => setShowCatDropdown(true)} placeholder="ابحث أو اختر القسم..." className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-[#10B981] bg-slate-50 font-bold" />
                                            {showCatDropdown && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                                                    {filteredCategoriesForDropdown.length > 0 ? (
                                                        filteredCategoriesForDropdown.map(c => (
                                                            <div key={c.id} onClick={() => { setProductFormData({...productFormData, categoryId: c.id}); setCatSearch(c.name); setShowCatDropdown(false); }} className="p-3 hover:bg-emerald-50 cursor-pointer font-bold text-slate-700 border-b border-slate-50 last:border-0">{c.name}</div>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-sm text-slate-400 font-bold text-center">القسم غير موجود. أضفه من علامة (+)</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => {setIsProductModalOpen(false); setIsQuickCatModalOpen(true);}} className="w-12 shrink-0 bg-slate-100 text-slate-600 rounded-xl hover:bg-[#10B981] hover:text-white font-black transition-colors"><i className="fas fa-plus"></i></button>
                                    </div>
                                </div>
                                
                                <div className="space-y-1"><label className="text-xs font-bold text-slate-500">وحدة الشراء <span className="text-rose-500">*</span></label><input type="text" value={productFormData.purchase_unit} onChange={(e) => setProductFormData({...productFormData, purchase_unit: e.target.value})} required className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-[#10B981] bg-slate-50 font-bold" /></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-slate-500">الكرتونة فيها كام قطعة؟ <span className="text-rose-500">*</span></label><input type="number" min="1" value={productFormData.pieces_per_carton} onChange={(e) => setProductFormData({...productFormData, pieces_per_carton: e.target.value})} required className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-[#10B981] bg-slate-50 font-bold text-left" dir="ltr" /></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-slate-500">تكلفة الكرتونة كاملة <span className="text-rose-500">*</span></label><input type="number" step="0.01" min="0" value={productFormData.cost_price_carton} onChange={(e) => setProductFormData({...productFormData, cost_price_carton: e.target.value})} required className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-[#10B981] bg-slate-50 font-bold text-left" dir="ltr" /></div>

                                <div className="space-y-1 md:col-span-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <label className="text-xs font-bold text-emerald-700">سعر بيع القطعة الواحدة للزبون <span className="text-rose-500">*</span></label>
                                    <input type="number" step="0.25" min="0" value={productFormData.sell_price_piece} onChange={(e) => setProductFormData({...productFormData, sell_price_piece: e.target.value})} required className="w-full mt-2 border-2 border-emerald-200 rounded-xl p-3 outline-none focus:border-[#10B981] bg-white font-black text-emerald-700 text-xl text-center" dir="ltr" />
                                </div>
                            </div>
                            <div className="flex gap-4 border-t border-slate-100 pt-5">
                                <button type="submit" className="flex-1 bg-[#10B981] hover:bg-emerald-600 text-white font-black py-4 rounded-xl text-lg transition-colors">{editingProduct ? 'حفظ التعديلات' : 'إضافة للمخزن'}</button>
                                <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-xl text-lg transition-colors">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: نافذة الإضافة السريعة للقسم */}
            {isQuickCatModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-view">
                        <div className="p-5 bg-[#0F172A] text-white flex justify-between items-center">
                            <h2 className="font-black">إضافة قسم جديد سريع</h2>
                            <button onClick={() => {setIsQuickCatModalOpen(false); setIsProductModalOpen(true);}} className="text-white/50 hover:text-white"><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleQuickCatSubmit} className="p-5">
                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-bold text-slate-600">اسم القسم</label>
                                <input type="text" autoFocus required value={quickCatName} onChange={e => setQuickCatName(e.target.value)} placeholder="مثال: سناكس ومقرمشات" className="w-full border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-[#10B981] font-bold" />
                            </div>
                            <button type="submit" className="w-full bg-[#10B981] text-white font-black py-3 rounded-xl hover:bg-emerald-600 transition-colors">حفظ القسم والمتابعة</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};