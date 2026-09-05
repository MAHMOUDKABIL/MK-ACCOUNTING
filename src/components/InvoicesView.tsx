import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe,
  Plus,
  Printer,
  QrCode,
  Receipt,
  Search,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { etaService } from '../services/etaService';
import { CompanyProfile, Invoice, InvoiceItem, InvoiceType, Party } from '../types/accounting';

interface InvoicesViewProps {
  invoices: Invoice[];
  parties: Party[];
  companyProfile: CompanyProfile;
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'formattedNumber' | 'createdAt'>) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  parties,
  companyProfile,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [etaToast, setEtaToast] = useState<string | null>(null);

  // Form states for creating a new invoice
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('sales');
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [vatRate, setVatRate] = useState<number>(14);
  const [withholdingTaxRate, setWithholdingTaxRate] = useState<number>(1);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('سداد خلال 30 يوم من تاريخ إصدار الفاتورة');

  const [items, setItems] = useState<
    Array<{
      id: string;
      description: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>
  >([
    {
      id: '1',
      description: 'تقديم استشارات محاسبية ومالية ونظم معلومات',
      unit: 'خدمة',
      quantity: 1,
      unitPrice: 5000,
      total: 5000,
    },
  ]);

  const filteredParties = useMemo(() => {
    return parties.filter((p) =>
      invoiceType === 'sales' ? p.type === 'customer' : p.type === 'supplier'
    );
  }, [parties, invoiceType]);

  const filteredInvoices = useMemo(() => {
    const searchLower = (searchTerm || '').toLowerCase().trim();
    return invoices.filter((inv) => {
      const isPurchase = activeTab === 'purchases' && (inv.type === 'purchases' || inv.type === 'purchase');
      const isSales = activeTab === 'sales' && (inv.type === 'sales' || inv.type === 'sale');
      const matchType = isSales || isPurchase;

      if (!matchType) return false;
      if (!searchLower) return true;

      const numStr = (inv.formattedNumber || inv.invoiceNumber || '').toLowerCase();
      const partyStr = (inv.partyName || '').toLowerCase();
      const notesStr = (inv.notes || '').toLowerCase();

      return (
        numStr.includes(searchLower) ||
        partyStr.includes(searchLower) ||
        notesStr.includes(searchLower)
      );
    });
  }, [invoices, activeTab, searchTerm]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  }, [items]);

  const vatAmount = useMemo(() => {
    return (subtotal - discountAmount) * (vatRate / 100);
  }, [subtotal, discountAmount, vatRate]);

  const withholdingTaxAmount = useMemo(() => {
    return (subtotal - discountAmount) * (withholdingTaxRate / 100);
  }, [subtotal, discountAmount, withholdingTaxRate]);

  const totalAmount = useMemo(() => {
    return subtotal - discountAmount + vatAmount - withholdingTaxAmount;
  }, [subtotal, discountAmount, vatAmount, withholdingTaxAmount]);

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(val) : updated[index].quantity;
      const price = field === 'unitPrice' ? Number(val) : updated[index].unitPrice;
      updated[index].total = qty * price;
    }
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        description: '',
        unit: 'عدد',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const party = parties.find((p) => p.id === partyId);
    if (!party) {
      alert('يرجى اختيار العميل أو المورد');
      return;
    }

    onAddInvoice({
      type: invoiceType,
      partyId: party.id,
      partyName: party.name,
      partyTaxNumber: party.taxNumber,
      date,
      dueDate: dueDate || date,
      items: items.map((i) => ({
        id: i.id,
        description: i.description,
        unit: i.unit,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      })),
      subtotal,
      discountAmount,
      vatRate,
      vatAmount,
      withholdingTaxRate,
      withholdingTaxAmount,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      status: 'approved',
      notes,
      paymentTerms,
    });

    setIsCreateModalOpen(false);
  };

  const handlePrint = (inv: Invoice) => {
    setSelectedInvoiceForPrint(inv);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleSendToETA = async (inv: Invoice) => {
    const party = parties.find((p) => p.id === inv.partyId);
    const etaDoc = etaService.serializeToETADocument(inv, companyProfile, party);
    const res = await etaService.submitDocument(etaDoc, inv.id);
    setEtaToast(`تم إرسال الفاتورة (${inv.formattedNumber || inv.invoiceNumber}) بنجاح لمنظومة الفاتورة الإلكترونية ETA (كود UUID: ${res.submittedDoc.uuid})`);
    setTimeout(() => setEtaToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {etaToast && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500 text-emerald-200 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 no-print">
          <div className="flex items-center gap-2.5 text-xs md:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{etaToast}</span>
          </div>
          <button onClick={() => setEtaToast(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
            <Receipt className="w-5 h-5 text-sky-600" />
            الفواتير الضريبية
          </h2>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => {
              setInvoiceType('sales');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إصدار فاتورة مبيعات</span>
          </button>

          <button
            onClick={() => {
              setInvoiceType('purchases');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-600" />
            <span>تسجيل فاتورة مشتريات</span>
          </button>
        </div>
      </div>

      {/* Tabs (Sales vs Purchases) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold no-print">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sales'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>فواتير المبيعات للعملاء ({invoices.filter((i) => i.type === 'sales' || i.type === 'sale').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'purchases'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>فواتير المشتريات من الموردين ({invoices.filter((i) => i.type === 'purchases' || i.type === 'purchase').length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs no-print shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الفاتورة (INV-2026-0001) أو اسم العميل / المورد..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-9 pl-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold">
                <th className="py-3 px-4 w-32">رقم الفاتورة</th>
                <th className="py-3 px-4 w-28">التاريخ</th>
                <th className="py-3 px-4">{activeTab === 'sales' ? 'العميل' : 'المورد'}</th>
                <th className="py-3 px-4 w-28 text-left">قيمة البضاعة</th>
                <th className="py-3 px-4 w-28 text-left">ضريبة 14%</th>
                <th className="py-3 px-4 w-32 text-left">الصافي الإجمالي</th>
                <th className="py-3 px-4 w-28 text-center">الحالة</th>
                <th className="py-3 px-4 w-28 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors text-slate-700">
                  <td className="py-3 px-4 font-mono font-bold text-sky-700">{inv.formattedNumber || inv.invoiceNumber || '—'}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{inv.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{inv.partyName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-left">{Number(inv.subtotal || 0).toLocaleString()} ج.م</td>
                  <td className="py-3 px-4 font-mono text-left text-amber-700">
                    +{Number(inv.vatAmount ?? inv.vatTotal ?? 0).toLocaleString()} ج.م
                  </td>
                  <td className="py-3 px-4 font-mono text-left font-black text-emerald-700 bg-emerald-50/30">
                    {Number(inv.totalAmount ?? inv.grandTotal ?? 0).toLocaleString()} ج.م
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        inv.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {inv.status === 'approved' ? 'معتمدة ومرحلة' : 'مسودة'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleSendToETA(inv)}
                        className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded transition-colors cursor-pointer"
                        title="إرسال وتوثيق الفاتورة مباشرة لدى مصلحة الضرائب المصرية (ETA V1.0)"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrint(inv)}
                        className="p-1.5 hover:bg-slate-100 text-sky-600 rounded transition-colors cursor-pointer"
                        title="طباعة الفاتورة الضريبية الرسمية"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteInvoice(inv.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors cursor-pointer"
                        title="حذف الفاتورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-black text-slate-900 text-base font-cairo flex items-center gap-2">
                <Receipt className="w-5 h-5 text-sky-600" />
                {invoiceType === 'sales' ? 'إصدار فاتورة ضريبية مبيعات جديدة' : 'تسجيل فاتورة مشتريات مورد'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveInvoice} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {invoiceType === 'sales' ? 'اختر العميل *' : 'اختر المورد *'}
                  </label>
                  <select
                    required
                    value={partyId}
                    onChange={(e) => setPartyId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">-- اختر من القائمة --</option>
                    {filteredParties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.taxNumber ? `(ضريبي: ${p.taxNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">تاريخ تحرير الفاتورة *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">بنود وأصناف الفاتورة:</span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة بند جديد
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px] font-bold">
                        <th className="py-2.5 px-3">بيان الصنف / الخدمة</th>
                        <th className="py-2.5 px-3 w-20">الوحدة</th>
                        <th className="py-2.5 px-3 w-24 text-center">الكمية</th>
                        <th className="py-2.5 px-3 w-28 text-left">سعر الوحدة</th>
                        <th className="py-2.5 px-3 w-32 text-left">الإجمالي</th>
                        <th className="py-2.5 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              placeholder="اسم البند أو الخدمة..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-center font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-left font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-sky-700 text-left">
                            {Number(item?.total || 0).toLocaleString()} ج.م
                          </td>
                          <td className="py-2 px-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax & Total Summary Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-3">
                  {/* Free VAT and Withholding Tax Rate Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold text-[11px]">
                          نسبة ضريبة القيمة المضافة (VAT %)
                        </label>
                        <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {vatRate}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          value={vatRate}
                          onChange={(e) => setVatRate(Number(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                          placeholder="14"
                        />
                        <span className="text-slate-500 font-bold text-xs">%</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {[14, 0, 5, 8, 10].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setVatRate(rate)}
                            className={`px-1.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                              vatRate === rate
                                ? 'bg-amber-600 text-white font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {rate === 0 ? 'معفى (0%)' : `${rate}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold text-[11px]">
                          نسبة الخصم من المنبع (WHT %)
                        </label>
                        <span className="text-[10px] text-rose-700 font-mono font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {withholdingTaxRate}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          value={withholdingTaxRate}
                          onChange={(e) => setWithholdingTaxRate(Number(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white text-xs"
                          placeholder="1"
                        />
                        <span className="text-slate-500 font-bold text-xs">%</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {[1, 3, 0.5, 5, 0].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setWithholdingTaxRate(rate)}
                            className={`px-1.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                              withholdingTaxRate === rate
                                ? 'bg-rose-600 text-white font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {rate === 0 ? 'بدون (0%)' : rate === 1 ? '1% توريد/خدمة' : rate === 3 ? '3% مهن حرة' : `${rate}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ملاحظات وشروط الدفع</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="أي ملاحظات تظهر بأسفل الفاتورة..."
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 divide-y divide-slate-200 font-mono text-xs">
                  <div className="flex justify-between py-1 text-slate-700">
                    <span className="font-sans">المجموع الفرعي للبضائع والخدمات:</span>
                    <span className="font-bold text-slate-900">{(subtotal || 0).toLocaleString()} ج.م</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between py-1 text-emerald-700">
                      <span className="font-sans">الخصم التجاري الممنوح:</span>
                      <span>-{(discountAmount || 0).toLocaleString()} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 text-amber-700 bg-amber-50/50 px-2 rounded">
                    <span className="font-sans font-semibold">ضريبة القيمة المضافة ({vatRate}% VAT):</span>
                    <span className="font-bold">+{(vatAmount || 0).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-rose-700 bg-rose-50/50 px-2 rounded">
                    <span className="font-sans font-semibold">خصم من المنبع أ/ت ({withholdingTaxRate}% WHT):</span>
                    <span className="font-bold">-{(withholdingTaxAmount || 0).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-black text-sky-900 border-t-2 border-slate-300 bg-sky-50/70 px-2 rounded">
                    <span className="font-sans">صافي القيمة الإجمالية المستحقة:</span>
                    <span>{(totalAmount || 0).toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  حفظ الفاتورة وتوليد القيد الآلي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Egyptian Tax Invoice */}
      {selectedInvoiceForPrint && (
        <div className="print-only hidden p-8 bg-white text-slate-900 font-sans max-w-4xl mx-auto space-y-6">
          {/* Top Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <h1 className="text-xl font-black text-slate-900">{companyProfile.name}</h1>
              <p className="text-xs text-slate-600 font-semibold">{companyProfile.legalForm}</p>
              <p className="text-xs text-slate-600">{companyProfile.address}</p>
              <p className="text-xs text-slate-600">
                رقم التسجيل الضريبي: <strong>{companyProfile.taxCard}</strong> | السجل التجاري: <strong>{companyProfile.commercialRegistry}</strong>
              </p>
            </div>

            <div className="text-left space-y-1">
              <div className="text-lg font-black bg-slate-900 text-white px-3 py-1 rounded">
                فاتورة ضريبية إلكترونية
              </div>
              <div className="text-sm font-mono font-black">{selectedInvoiceForPrint.formattedNumber}</div>
              <div className="text-xs">تاريخ الفاتورة: {selectedInvoiceForPrint.date}</div>
              <div className="text-xs">تاريخ الاستحقاق: {selectedInvoiceForPrint.dueDate}</div>
            </div>
          </div>

          {/* Customer / Supplier Box */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-300 rounded-lg text-xs">
            <div>
              <div className="font-bold text-slate-500 uppercase text-[10px]">بيانات العميل / المشترى:</div>
              <div className="text-sm font-black text-slate-900 mt-1">{selectedInvoiceForPrint.partyName}</div>
              {selectedInvoiceForPrint.partyTaxNumber && (
                <div className="text-slate-700 mt-0.5">
                  رقم التسجيل الضريبي: {selectedInvoiceForPrint.partyTaxNumber}
                </div>
              )}
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-500 uppercase text-[10px]">شروط السداد:</div>
              <div className="text-slate-800 font-medium mt-1">{selectedInvoiceForPrint.paymentTerms}</div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse text-xs border border-slate-400">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-400 font-bold">
                <th className="border border-slate-400 p-2 w-10 text-center">م</th>
                <th className="border border-slate-400 p-2 text-right">بيان الصنف أو الخدمة</th>
                <th className="border border-slate-400 p-2 w-16 text-center">الوحدة</th>
                <th className="border border-slate-400 p-2 w-20 text-center">الكمية</th>
                <th className="border border-slate-400 p-2 w-28 text-left">سعر الوحدة</th>
                <th className="border border-slate-400 p-2 w-32 text-left">الإجمالي (ج.م)</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoiceForPrint.items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-300">
                  <td className="border border-slate-300 p-2 text-center font-mono">{idx + 1}</td>
                  <td className="border border-slate-300 p-2 font-semibold">{item.description}</td>
                  <td className="border border-slate-300 p-2 text-center">{item.unit}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold">{item.quantity}</td>
                  <td className="border border-slate-300 p-2 font-mono text-left">
                    {Number(item?.unitPrice || 0).toLocaleString()}
                  </td>
                  <td className="border border-slate-300 p-2 font-mono text-left font-bold">
                    {Number(item?.total || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary & Tax Calculation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-xs space-y-2">
              <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-1">
                <strong>ملاحظات:</strong>
                <p className="text-slate-600">{selectedInvoiceForPrint.notes || 'فاتورة معتمدة صادرة طبقاً لمنظومة الفاتورة الإلكترونية المصرية.'}</p>
              </div>
            </div>

            <div className="border border-slate-400 rounded overflow-hidden text-xs font-mono">
              <div className="flex justify-between p-2 border-b border-slate-300 bg-slate-50 font-sans">
                <span>المجموع الفرعي الخاضع للضريبة:</span>
                <span className="font-mono font-bold">
                  {Number(selectedInvoiceForPrint?.subtotal || 0).toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex justify-between p-2 border-b border-slate-300 font-sans text-emerald-800">
                <span>ضريبة القيمة المضافة ({selectedInvoiceForPrint.vatRate}%):</span>
                <span className="font-mono font-bold">
                  +{Number(selectedInvoiceForPrint?.vatAmount || 0).toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex justify-between p-2 border-b border-slate-300 font-sans text-rose-800">
                <span>خصم وتحصيل أ/ت تحت حساب الضريبة (1%):</span>
                <span className="font-mono font-bold">
                  -{Number(selectedInvoiceForPrint?.withholdingTaxAmount || 0).toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-900 text-white font-sans font-black text-sm">
                <span>صافي القيمة المستحقة:</span>
                <span className="font-mono">{Number(selectedInvoiceForPrint?.totalAmount || 0).toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>

          {/* Signatures & Stamp */}
          <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <div className="font-bold">توقيع المستلم (العميل)</div>
              <div className="text-slate-500 text-[10px]">التوقيع: .....................</div>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <div className="font-bold">إدارة المبيعات والحسابات</div>
              <div className="text-slate-500 text-[10px]">التوقيع: .....................</div>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-1 bg-slate-50 p-2 border rounded">
              <div className="font-bold text-slate-900">المحاسب والمراجع القانوني</div>
              <div className="text-sky-800 font-semibold">محمود الباز قابيل</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
