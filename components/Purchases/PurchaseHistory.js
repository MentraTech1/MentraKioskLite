// المسار: components/Purchases/PurchaseHistory.js

window.PurchaseHistory = function({ purchases, suppliers, showToast }) {
    const { useState, useMemo } = React;
    const ITEMS_PER_PAGE = 4;

    const [invoicePage, setInvoicePage] = useState(1);
    const [searchInvoiceId, setSearchInvoiceId] = useState('');
    
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [editCart, setEditCart] = useState([]);
    const [editDiscount, setEditDiscount] = useState(0); // حالة تعديل الخصم

    const filteredPurchases = useMemo(() => {
        if (!searchInvoiceId) return purchases;
        return purchases.filter(p => p.id.toString().includes(searchInvoiceId.trim()));
    }, [purchases, searchInvoiceId]);

    const paginatedPurchases = useMemo(() => {
        const start = (invoicePage - 1) * ITEMS_PER_PAGE;
        return filteredPurchases.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPurchases, invoicePage]);

    const totalInvoicePages = Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE) || 1;

    const openInvoiceForEdit = async (purchase) => {
        try {
            const items = await window.db.purchase_items.where('purchaseId').equals(purchase.id).toArray();
            const preparedCart = await Promise.all(items.map(async (item) => {
                const product = await window.db.products.get(item.productId);
                return {
                    id: item.id,
                    productId: item.productId,
                    name: product ? product.name : 'منتج محذوف',
                    buyUnit: item.buyUnit,
                    qtyBought: item.qtyBought,
                    unitPrice: item.unitPrice || (item.total / item.qtyBought),
                    originalQtyBought: item.qtyBought,
                    productObj: product
                };
            }));
            setEditCart(preparedCart);
            setEditDiscount(purchase.discount || 0);
            setEditingInvoice(purchase);
        } catch (error) { showToast('خطأ في جلب الفاتورة', 'error'); }
    };

    const updateEditCartQty = (itemId, newQty) => {
        if (newQty < 0) return;
        setEditCart(editCart.map(i => i.id === itemId ? { ...i, qtyBought: newQty } : i));
    };

    const handleSaveInvoiceEdit = async () => {
        try {
            await window.db.transaction('rw', window.db.purchases, window.db.purchase_items, window.db.products, async () => {
                let newTotalAmount = 0;

                for (let editItem of editCart) {
                    if (!editItem.productObj) continue;

                    const piecesPerCarton = editItem.productObj.pieces_per_carton || 1;
                    const multiplier = (editItem.buyUnit === editItem.productObj.purchase_unit && piecesPerCarton > 1) ? piecesPerCarton : 1;
                    
                    const oldPiecesBought = editItem.originalQtyBought * multiplier;
                    const newPiecesBought = editItem.qtyBought * multiplier;
                    const pieceDifference = newPiecesBought - oldPiecesBought;

                    const currentStock = editItem.productObj.total_stock_pieces;
                    if (pieceDifference < 0 && Math.abs(pieceDifference) > currentStock) {
                        throw new Error(`لا يمكنك تقليل كمية "${editItem.name}" لأنك قمت ببيع جزء منها والرصيد الحالي لا يكفي.`);
                    }

                    const finalStock = currentStock + pieceDifference;
                    await window.db.products.update(editItem.productId, { total_stock_pieces: finalStock });

                    const lineTotal = editItem.qtyBought * editItem.unitPrice;
                    newTotalAmount += lineTotal;
                    await window.db.purchase_items.update(editItem.id, { qtyBought: editItem.qtyBought, total: lineTotal });
                }

                const newNetAmount = newTotalAmount - editDiscount;
                if (newNetAmount < 0) throw new Error("الخصم أكبر من إجمالي الفاتورة");

                await window.db.purchases.update(editingInvoice.id, { 
                    totalAmount: newTotalAmount, 
                    discount: editDiscount, 
                    netAmount: newNetAmount 
                });
            });

            showToast('تم تعديل الفاتورة وتحديث المخزن بنجاح', 'success');
            setEditingInvoice(null);
        } catch (error) { showToast(error.message, 'error'); }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-view">
            {!editingInvoice ? (
                <>
                    <div className="mb-6 relative max-w-sm">
                        <input type="text" value={searchInvoiceId} onChange={(e) => {setSearchInvoiceId(e.target.value); setInvoicePage(1);}} placeholder="بحث برقم فاتورة الشراء (#)" className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:border-blue-500 font-bold text-sm" />
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="p-3 rounded-r-xl">رقم الفاتورة</th>
                                    <th className="p-3">المورد</th>
                                    <th className="p-3">التاريخ</th>
                                    <th className="p-3">الصافي</th>
                                    <th className="p-3 rounded-l-xl text-center">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPurchases.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">لا توجد فواتير</td></tr>
                                ) : (
                                    paginatedPurchases.map(purchase => {
                                        const sup = suppliers.find(s => s.id === purchase.supplierId);
                                        const finalAmount = purchase.netAmount !== undefined ? purchase.netAmount : purchase.totalAmount;
                                        return (
                                            <tr key={purchase.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="p-3 font-bold text-slate-700">#{purchase.id}</td>
                                                <td className="p-3 font-bold text-slate-600">{sup ? sup.name : 'مورد محذوف'}</td>
                                                <td className="p-3 text-slate-500" dir="ltr">{new Date(purchase.date).toLocaleString('ar-EG', {hour12: true})}</td>
                                                <td className="p-3 font-black text-blue-600">{finalAmount} ج.م</td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => openInvoiceForEdit(purchase)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"><i className="fas fa-edit mr-1"></i> مراجعة / تعديل</button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {totalInvoicePages > 1 && (
                        <div className="flex justify-center gap-2 mt-6 pt-4 border-t border-slate-100">
                            <button onClick={() => setInvoicePage(prev => Math.max(prev - 1, 1))} disabled={invoicePage === 1} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white disabled:opacity-50 flex justify-center items-center"><i className="fas fa-chevron-right"></i></button>
                            <span className="font-black text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-sm">صفحة {invoicePage} من {totalInvoicePages}</span>
                            <button onClick={() => setInvoicePage(prev => Math.min(prev + 1, totalInvoicePages))} disabled={invoicePage === totalInvoicePages} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white disabled:opacity-50 flex justify-center items-center"><i className="fas fa-chevron-left"></i></button>
                        </div>
                    )}
                </>
            ) : (
                <div className="animate-view">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                        <h3 className="font-black text-slate-800 text-lg">تعديل فاتورة شراء #{editingInvoice.id}</h3>
                        <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-rose-500 w-8 h-8 rounded-full bg-slate-50 flex justify-center items-center"><i className="fas fa-times"></i></button>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl text-xs font-bold mb-4 flex gap-2 items-center">
                        <i className="fas fa-exclamation-triangle text-xl"></i>
                        تقليل الكميات هنا سيقوم بخصمها من المخزن. لا يمكنك تقليل كمية منتج إذا قمت ببيعه بالفعل ورصيده لا يكفي في المخزن.
                    </div>

                    <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
                        {editCart.map(item => (
                            <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800">{item.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">الوحدة: {item.buyUnit} | السعر: {item.unitPrice} ج.م</p>
                                </div>
                                <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-lg">
                                    <button onClick={() => updateEditCartQty(item.id, item.qtyBought - 1)} className="w-8 h-8 rounded bg-slate-100 font-bold hover:bg-rose-100 hover:text-rose-600">-</button>
                                    <span className="w-8 text-center font-black">{item.qtyBought}</span>
                                    <button onClick={() => updateEditCartQty(item.id, item.qtyBought + 1)} className="w-8 h-8 rounded bg-slate-100 font-bold hover:bg-emerald-100 hover:text-emerald-600">+</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl mb-6 flex justify-between items-center border border-blue-100">
                        <span className="font-bold text-blue-800 text-sm">تعديل الخصم (إن وجد):</span>
                        <input type="number" min="0" value={editDiscount} onChange={(e) => setEditDiscount(Number(e.target.value))} className="w-24 border border-blue-200 rounded-lg px-3 py-2 outline-none text-left focus:border-blue-500 font-black text-blue-600" />
                    </div>
                    
                    <div className="flex gap-3">
                        <button onClick={handleSaveInvoiceEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-colors">حفظ وتحديث المخزن</button>
                        <button onClick={() => setEditingInvoice(null)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black py-3 rounded-xl transition-colors">إلغاء</button>
                    </div>
                </div>
            )}
        </div>
    );
};