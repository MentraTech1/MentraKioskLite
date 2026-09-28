// المسار: components/Pos/InvoiceHistory.js

window.InvoiceHistory = function({ showToast }) {
    const { useState, useEffect, useMemo } = React;
    const ITEMS_PER_PAGE = 4;

    const [invoicePage, setInvoicePage] = useState(1);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [editCart, setEditCart] = useState([]);
    
    const [searchInvoiceId, setSearchInvoiceId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const sales = window.useLiveQuery(() => window.db.sales.reverse().toArray(), []) || [];

    // --- دالة طباعة الإيصال من السجل ---
    const printThermalReceipt = async (sale) => {
        try {
            const items = await window.db.sale_items.where('saleId').equals(sale.id).toArray();
            const cartItems = await Promise.all(items.map(async (item) => {
                 const product = await window.db.products.get(item.productId);
                 return { name: product ? product.name : 'منتج محذوف', qtySold: item.qtySold, sellPrice: item.unitPrice };
            }));

            const kioskSession = JSON.parse(localStorage.getItem('MentraKiosk_Session') || '{}');
            const kioskName = kioskSession.kiosk_name || 'كشك منترا';
            
            const printWindow = window.open('', '_blank');
            const printContent = `
                <html dir="rtl">
                <head>
                    <title>نسخة فاتورة #${sale.id}</title>
                    <style>
                        body { font-family: 'Tahoma', sans-serif; text-align: center; font-size: 13px; width: 300px; margin: 0 auto; color: #000; padding-top: 10px; }
                        .header { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                        .meta { font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                        th, td { text-align: right; border-bottom: 1px dotted #ccc; padding: 6px 0; font-size: 12px; }
                        th { border-bottom: 1px solid #000; font-weight: bold; }
                        .center { text-align: center; }
                        .totals { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; text-align: left; font-weight: bold; }
                        .footer { margin-top: 20px; font-size: 11px; text-align: center; border-top: 1px dashed #000; padding-top: 10px; }
                        @media print { body { width: 100%; margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">${kioskName}</div>
                    <div class="meta">
                        <div>رقم الفاتورة: #${sale.id} <br>(نسخة مطبوعة)</div>
                        <div>التاريخ: ${new Date(sale.date).toLocaleString('ar-EG', {hour12: true})}</div>
                    </div>
                    <table>
                        <tr><th>الصنف</th><th class="center">الكمية</th><th style="text-align:left">السعر</th></tr>
                        ${cartItems.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td class="center">${item.qtySold}</td>
                                <td style="text-align:left">${item.sellPrice * item.qtySold}</td>
                            </tr>
                        `).join('')}
                    </table>
                    <div class="totals">
                        ${sale.discount > 0 ? `<div>الخصم: ${sale.discount} ج.م</div>` : ''}
                        <div style="font-size: 16px; margin-top: 5px;">الإجمالي: ${sale.netAmount} ج.م</div>
                    </div>
                    <div class="footer">شكراً لزيارتكم!<br>نظام Mentra Kiosk</div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
                </html>
            `;
            printWindow.document.write(printContent);
            printWindow.document.close();
        } catch (err) {
            showToast('خطأ أثناء تحضير الطباعة', 'error');
        }
    };

    useEffect(() => { setInvoicePage(1); }, [searchInvoiceId, startDate, endDate]);

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const matchId = searchInvoiceId ? sale.id.toString().includes(searchInvoiceId.trim()) : true;
            let matchDate = true;
            const saleDate = new Date(sale.date);
            saleDate.setHours(0,0,0,0);
            
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0,0,0,0);
                if (saleDate < start) matchDate = false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23,59,59,999);
                if (saleDate > end) matchDate = false;
            }
            return matchId && matchDate;
        });
    }, [sales, searchInvoiceId, startDate, endDate]);

    const historyStats = useMemo(() => {
        const count = filteredSales.length;
        const totalAmount = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.netAmount) || 0), 0);
        return { count, totalAmount };
    }, [filteredSales]);

    const paginatedSales = useMemo(() => {
        const start = (invoicePage - 1) * ITEMS_PER_PAGE;
        return filteredSales.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredSales, invoicePage]);

    const totalInvoicePages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE) || 1;

    const openInvoiceForEdit = async (sale) => {
        try {
            const items = await window.db.sale_items.where('saleId').equals(sale.id).toArray();
            const preparedCart = await Promise.all(items.map(async (item) => {
                const product = await window.db.products.get(item.productId);
                return {
                    id: item.id,
                    productId: item.productId,
                    name: product ? product.name : 'منتج محذوف',
                    sellPrice: item.unitPrice,
                    qtySold: item.qtySold || item.quantityPieces, 
                    originalQty: item.qtySold || item.quantityPieces,
                    maxStock: product ? product.total_stock_pieces : 0
                };
            }));
            setEditCart(preparedCart);
            setEditingInvoice(sale);
        } catch (error) { showToast('خطأ في جلب تفاصيل الفاتورة', 'error'); }
    };

    const updateEditCartQty = (productId, newQty) => {
        if (newQty < 1) return;
        const item = editCart.find(i => i.productId === productId);
        const allowedStock = item.maxStock + item.originalQty;
        
        if (newQty > allowedStock) {
            showToast('لا يوجد رصيد كافي في المخزن', 'error');
            return;
        }
        setEditCart(editCart.map(i => i.productId === productId ? { ...i, qtySold: newQty } : i));
    };

    const handleSaveInvoiceEdit = async () => {
        try {
            await window.db.transaction('rw', window.db.sales, window.db.sale_items, window.db.products, async () => {
                let newTotalAmount = 0;
                let newTotalProfit = 0;

                for (let editItem of editCart) {
                    const product = await window.db.products.get(editItem.productId);
                    const tempStock = product.total_stock_pieces + editItem.originalQty;
                    
                    if (tempStock < editItem.qtySold) throw new Error(`رصيد ${product.name} لا يكفي.`);

                    const finalStock = tempStock - editItem.qtySold;
                    await window.db.products.update(product.id, { total_stock_pieces: finalStock });

                    const lineTotal = editItem.qtySold * editItem.sellPrice;
                    const lineProfit = (editItem.sellPrice - product.cost_price_piece) * editItem.qtySold;
                    
                    newTotalAmount += lineTotal;
                    newTotalProfit += lineProfit;

                    await window.db.sale_items.update(editItem.id, { qtySold: editItem.qtySold, total: lineTotal });
                }

                const netAmount = newTotalAmount - editingInvoice.discount;
                const netProfit = newTotalProfit - editingInvoice.discount;
                
                await window.db.sales.update(editingInvoice.id, { totalAmount: newTotalAmount, netAmount: netAmount, profit: netProfit });
            });

            showToast('تم تعديل الفاتورة وتحديث المخزن', 'success');
            setEditingInvoice(null);
        } catch (error) { showToast(error.message, 'error'); }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-view mb-10">
            {!editingInvoice ? (
                <>
                    <div className="mb-6 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <input type="text" value={searchInvoiceId} onChange={(e) => setSearchInvoiceId(e.target.value)} placeholder="بحث برقم الفاتورة (#)" className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:border-[#10B981] font-bold text-sm" />
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            </div>
                            <div className="flex flex-1 gap-2">
                                <div className="relative flex-1">
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-[#10B981] text-sm font-bold text-slate-600" />
                                </div>
                                <div className="relative flex-1">
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-[#10B981] text-sm font-bold text-slate-600" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex-1 flex items-center gap-3 border-l border-slate-200 pl-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><i className="fas fa-receipt"></i></div>
                                <div><p className="text-[10px] font-bold text-slate-400">عدد الفواتير</p><p className="font-black text-slate-700 leading-none">{historyStats.count}</p></div>
                            </div>
                            <div className="flex-1 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#10B981] flex items-center justify-center"><i className="fas fa-coins"></i></div>
                                <div><p className="text-[10px] font-bold text-slate-400">إجمالي المبيعات</p><p className="font-black text-[#10B981] leading-none">{historyStats.totalAmount} ج.م</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="p-3 rounded-r-xl">رقم الفاتورة</th>
                                    <th className="p-3">التاريخ</th>
                                    <th className="p-3">الإجمالي</th>
                                    <th className="p-3 rounded-l-xl text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedSales.length === 0 ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-bold">لا توجد فواتير تطابق البحث</td></tr>
                                ) : (
                                    paginatedSales.map(sale => (
                                        <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="p-3 font-bold text-slate-700">#{sale.id}</td>
                                            <td className="p-3 text-slate-500" dir="ltr">{new Date(sale.date).toLocaleString('ar-EG', {hour12: true})}</td>
                                            <td className="p-3 font-black text-[#10B981]">{sale.netAmount} ج.م</td>
                                            <td className="p-3 flex justify-center gap-2">
                                                <button onClick={() => printThermalReceipt(sale)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors" title="طباعة نسخة"><i className="fas fa-print"></i></button>
                                                <button onClick={() => openInvoiceForEdit(sale)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"><i className="fas fa-edit mr-1"></i> تعديل</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {totalInvoicePages > 1 && (
                        <div className="flex justify-center gap-2 mt-6 pt-4 border-t border-slate-100">
                            <button onClick={() => setInvoicePage(prev => Math.max(prev - 1, 1))} disabled={invoicePage === 1} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50 hover:bg-[#10B981] hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-chevron-right"></i></button>
                            <span className="font-black text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-sm">صفحة {invoicePage} من {totalInvoicePages}</span>
                            <button onClick={() => setInvoicePage(prev => Math.min(prev + 1, totalInvoicePages))} disabled={invoicePage === totalInvoicePages} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50 hover:bg-[#10B981] hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>
                        </div>
                    )}
                </>
            ) : (
                <div className="animate-view">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                        <h3 className="font-black text-slate-800 text-lg">تعديل فاتورة #{editingInvoice.id}</h3>
                        <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-rose-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full bg-slate-50"><i className="fas fa-times"></i></button>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl text-xs font-bold mb-4 flex gap-2 items-center">
                        <i className="fas fa-exclamation-triangle"></i>
                        أي تعديل في الكميات هنا سيقوم بتحديث الرصيد في المخزن أوتوماتيكياً.
                    </div>

                    <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
                        {editCart.map(item => (
                            <div key={item.productId} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800">{item.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">سعر البيع: {item.sellPrice} ج.م</p>
                                </div>
                                <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-lg">
                                    <button onClick={() => updateEditCartQty(item.productId, item.qtySold - 1)} className="w-8 h-8 rounded bg-slate-100 text-slate-600 font-bold hover:bg-rose-100 hover:text-rose-600">-</button>
                                    <span className="w-8 text-center font-black">{item.qtySold}</span>
                                    <button onClick={() => updateEditCartQty(item.productId, item.qtySold + 1)} className="w-8 h-8 rounded bg-slate-100 text-slate-600 font-bold hover:bg-emerald-100 hover:text-emerald-600">+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex gap-3">
                        <button onClick={handleSaveInvoiceEdit} className="flex-1 bg-[#10B981] hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition-colors">حفظ التعديلات</button>
                        <button onClick={() => setEditingInvoice(null)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black py-3 rounded-xl transition-colors">إلغاء</button>
                    </div>
                </div>
            )}
        </div>
    );
};