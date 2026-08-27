import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Printer,
  QrCode,
  Receipt,
  Search,
  Trash2,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { db } from '../services/db';
import { AuditorStatement, CompanyProfile } from '../types/accounting';
import {
  ClientArchive,
  PaymentMethod,
  TreasuryCategory,
  TreasuryTransaction,
  TreasuryTransactionType,
} from '../types/office';
import { exportToExcel, exportToWordDoc, printDocument } from '../utils/exportUtils';

interface TreasuryFinancialViewProps {
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
  initialClientId?: string;
}

export const TreasuryFinancialView: React.FC<TreasuryFinancialViewProps> = ({
  companyProfile,
  auditorStatement,
  initialClientId,
}) => {
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>(() =>
    db.getTreasuryTransactions()
  );
  const [clients, setClients] = useState<ClientArchive[]>(() => db.getClientArchives());

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterClient, setFilterClient] = useState<string>(initialClientId || 'all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewReceiptTx, setViewReceiptTx] = useState<TreasuryTransaction | null>(null);

  // Form State
  const initialFormState: Omit<TreasuryTransaction, 'id' | 'serialNumber' | 'createdAt'> = {
    date: new Date().toISOString().split('T')[0],
    type: 'income',
    clientId: initialClientId || (clients[0]?.id ?? ''),
    clientName: clients.find((c) => c.id === initialClientId)?.name || (clients[0]?.name ?? ''),
    amount: 5000,
    category: 'أتعاب محاسبة وإقرارات',
    paymentMethod: 'cash',
    serviceDescription: 'سداد دفعة من الأتعاب السنوية ومصروفات الفحص',
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [syncToAccounting, setSyncToAccounting] = useState(true);

  const refreshData = () => {
    setTransactions(db.getTreasuryTransactions());
    setClients(db.getClientArchives());
  };

  // Treasury summary
  const summary = useMemo(() => {
    return db.getTreasurySummary();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.serviceDescription.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'all' || t.type === filterType;
      const matchClient = filterClient === 'all' || t.clientId === filterClient;
      const matchCategory = filterCategory === 'all' || t.category === filterCategory;

      return matchSearch && matchType && matchClient && matchCategory;
    });
  }, [transactions, searchTerm, filterType, filterClient, filterCategory]);

  // Selected client analysis if filtered by a specific client
  const clientFinancialOverview = useMemo(() => {
    if (filterClient !== 'all') {
      return db.getClientFinancialSummary(filterClient);
    }
    return null;
  }, [filterClient, transactions]);

  // Handle Client Selection in Form
  const handleClientChange = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    setFormData({
      ...formData,
      clientId,
      clientName: found ? found.name : '',
    });
  };

  // Save Transaction
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    if (!formData.clientName) {
      alert('يرجى اختيار العميل التابع له الحركة');
      return;
    }

    const created = db.addTreasuryTransaction(formData, syncToAccounting);
    refreshData();
    setIsAddModalOpen(false);
    setFormData(initialFormState);
    setViewReceiptTx(created); // Open receipt view directly
  };

  const handleDeleteTransaction = (id: string, serial: string) => {
    if (confirm(`هل أنت متأكد من حذف حركة الخزينة رقم (${serial})؟ سيتم أيضاً حذف القيد المحاسبي المرتبط.`)) {
      db.deleteTreasuryTransaction(id);
      refreshData();
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredTransactions.map((t) => ({
      'رقم الإيصال': t.serialNumber,
      'التاريخ': t.date,
      'نوع الحركة': t.type === 'income' ? 'وارد (مقبوضات)' : 'منصرف (إجراءات)',
      'العميل': t.clientName,
      'المبلغ (ج.م)': t.amount,
      'البند / التصنيف': t.category,
      'طريقة الدفع':
        t.paymentMethod === 'cash'
          ? 'نقداً (الخزينة)'
          : t.paymentMethod === 'bank_transfer'
          ? 'تحويل بنكي'
          : t.paymentMethod === 'instapay'
          ? 'انستاباي InstaPay'
          : 'شيك مصرفي',
      'بيان الخدمة والإجراءات': t.serviceDescription,
      'القيد المحاسبي': t.isSyncedToAccounting ? 'مرحل لليومية العامة' : 'حركة مستقلة',
    }));

    exportToExcel(data, `سجل_الخزينة_والماليات_${new Date().toISOString().split('T')[0]}`, 'حركات الخزينة');
  };

  // Export to Word
  const handleExportWord = () => {
    let rowsHtml = '';
    filteredTransactions.forEach((t) => {
      rowsHtml += `
        <tr>
          <td><strong>${t.serialNumber}</strong></td>
          <td>${t.date}</td>
          <td><span style="color: ${t.type === 'income' ? '#059669' : '#dc2626'}">${t.type === 'income' ? 'وارد (استلام)' : 'منصرف (رسوم)'}</span></td>
          <td><strong>${t.clientName}</strong></td>
          <td><strong>${t.amount.toLocaleString()} ج.م</strong></td>
          <td>${t.category}</td>
          <td>${t.serviceDescription}</td>
        </tr>
      `;
    });

    const content = `
      <div class="header-box">
        <h2>مكتب المحاسب والمراجع القانوني</h2>
        <h1>محمود الباز قابيل</h1>
        <p>سجل المحاسبين والمراجعين بوزارة المالية: <strong>44887</strong></p>
        <p>دفتر حركة الخزينة والماليات وأتعاب العملاء</p>
      </div>
      <div style="margin: 15px 0; padding: 10px; background-color: #f1f5f9; border-radius: 6px;">
        <table style="border: none; margin: 0;">
          <tr>
            <td style="border: none;">إجمالي الوارد (مقبوضات): <strong>${summary.totalIncome.toLocaleString()} ج.م</strong></td>
            <td style="border: none;">إجمالي المنصرف (إجراءات): <strong>${summary.totalExpenses.toLocaleString()} ج.م</strong></td>
            <td style="border: none;">صافي الرصيد والأتعاب: <strong>${summary.netTreasuryBalance.toLocaleString()} ج.م</strong></td>
          </tr>
        </table>
      </div>
      <table>
        <thead>
          <tr>
            <th>رقم الإيصال</th>
            <th>التاريخ</th>
            <th>نوع الحركة</th>
            <th>اسم العميل</th>
            <th>المبلغ</th>
            <th>البند</th>
            <th>بيان الخدمة</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="footer-stamp">
        <div>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</div>
        <div class="stamp-box">
          أمين الخزينة والمحاسب القانوني<br>
          <strong>محمود الباز قابيل</strong><br>
          س.م.م 44887
        </div>
      </div>
    `;

    exportToWordDoc('تقرير_حركة_الخزينة', content, `تقرير_الخزينة_${new Date().toISOString().split('T')[0]}.doc`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white font-tajawal">
                  نظام الخزينة والماليات وأتعاب العملاء
                </h1>
                <p className="text-xs md:text-sm text-slate-400">
                  تسجيل الوارد والمنصرف على الإجراءات وحساب صافي أتعاب المكتب مع التسميع التلقائي
                </p>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setFormData({
                  ...initialFormState,
                  type: 'income',
                  category: 'أتعاب محاسبة وإقرارات',
                });
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>تسجيل وارد (سند قبض أتعاب)</span>
            </button>

            <button
              onClick={() => {
                setFormData({
                  ...initialFormState,
                  type: 'expense',
                  category: 'مصروفات استخراج شهادات ورسوم',
                  serviceDescription: 'سداد رسوم فحص واستخراج أوراق رسمية',
                });
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>تسجيل منصرف (سند صرف إجراءات)</span>
            </button>

            {/* Export buttons */}
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={handleExportExcel}
                title="تصدير إلى Excel"
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-emerald-500/30"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                onClick={handleExportWord}
                title="تصدير إلى Word"
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-blue-500/30"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Word</span>
              </button>

              <button
                onClick={printDocument}
                title="طباعة / PDF"
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          {/* 1. Total Income */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-medium">إجمالي الوارد (مقبوضات وأتعاب)</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-emerald-400 font-mono">
              {summary.totalIncome.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              نقداً: {summary.cashIncome.toLocaleString()} | بنكي/انستاباي: {summary.bankIncome.toLocaleString()}
            </div>
          </div>

          {/* 2. Total Expenses */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-medium">إجمالي المنصرف (إجراءات ورسوم)</span>
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-rose-400 font-mono">
              {summary.totalExpenses.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              رسوم سجل، ضرائب، انتقالات وشهادات
            </div>
          </div>

          {/* 3. Net Fees Formula */}
          <div className="bg-sky-950/20 p-4 rounded-xl border border-sky-800/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-sky-300 font-bold">صافي أتعاب ورصيد الخزينة</span>
              <DollarSign className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-sky-400 font-mono">
              {summary.netTreasuryBalance.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
            </div>
            <div className="text-[11px] text-sky-300/80 mt-1">
              المعادلة: الوارد - المنصرف = الصافي
            </div>
          </div>

          {/* 4. Transactions Count */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-medium">إجمالي حركات الخزينة</span>
              <Receipt className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-white font-mono">
              {summary.transactionsCount} <span className="text-xs font-normal text-slate-400">إيصال</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>مسمعة في دليل الحسابات تلقائياً</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Client Quick Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الإيصال، العميل، البيان..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Client Filter */}
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كل العملاء بالأرشيف</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.clientCode})
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كل الحركات (وارد ومنصرف)</option>
            <option value="income">الوارد فقط (إيصالات استلام)</option>
            <option value="expense">المنصرف فقط (إيصالات صرف)</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كل التصنيفات والبنود</option>
            <option value="أتعاب محاسبة وإقرارات">أتعاب محاسبة وإقرارات</option>
            <option value="أمانات رسوم ومستخرجات">أمانات رسوم ومستخرجات</option>
            <option value="مصروفات تأسيس وتعديل شركات">تأسيس وتعديل شركات</option>
            <option value="مصروفات فحص ضريبي ولجان">فحص ضريبي ولجان</option>
            <option value="مصروفات استخراج شهادات ورسوم">استخراج شهادات ورسوم</option>
            <option value="أتعاب استشارات ودراسات جدوى">استشارات ودراسات</option>
          </select>
        </div>
      </div>

      {/* Selected Client Overview Card (if selected) */}
      {clientFinancialOverview && (
        <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">كشف حساب العميل المحدد:</div>
              <div className="text-sm font-bold text-white font-tajawal">
                {clientFinancialOverview.client?.name} ({clientFinancialOverview.client?.clientCode})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-emerald-400">
              الوارد: <strong>{clientFinancialOverview.totalIncome.toLocaleString()}</strong> ج.م
            </div>
            <div className="text-rose-400">
              المنصرف: <strong>{clientFinancialOverview.totalExpenses.toLocaleString()}</strong> ج.م
            </div>
            <div className="text-sky-400 font-bold bg-sky-950/60 px-3 py-1.5 rounded-lg border border-sky-800/40">
              صافي أتعاب المكتب: <strong>{clientFinancialOverview.netFees.toLocaleString()}</strong> ج.م
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs md:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] font-bold border-b border-slate-800 select-none">
              <tr>
                <th className="p-3.5">رقم الإيصال</th>
                <th className="p-3.5">التاريخ</th>
                <th className="p-3.5">النوع</th>
                <th className="p-3.5">العميل</th>
                <th className="p-3.5">المبلغ</th>
                <th className="p-3.5">البند / التصنيف</th>
                <th className="p-3.5">طريقة السداد</th>
                <th className="p-3.5">بيان الخدمة</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    لا توجد حركات خزينة مسجلة مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Serial */}
                    <td className="p-3.5 font-mono font-bold text-sky-400 whitespace-nowrap">
                      {tx.serialNumber}
                    </td>

                    {/* Date */}
                    <td className="p-3.5 text-slate-300 font-mono text-xs whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Type */}
                    <td className="p-3.5 whitespace-nowrap">
                      {tx.type === 'income' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ArrowDownLeft className="w-3 h-3" />
                          <span>وارد (قبض)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>منصرف (صرف)</span>
                        </span>
                      )}
                    </td>

                    {/* Client Name */}
                    <td className="p-3.5 font-bold text-white max-w-[200px] truncate">
                      {tx.clientName}
                    </td>

                    {/* Amount */}
                    <td className="p-3.5 font-mono font-bold whitespace-nowrap">
                      <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()} ج.م
                      </span>
                    </td>

                    {/* Category */}
                    <td className="p-3.5 text-xs text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                        {tx.category}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="p-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {tx.paymentMethod === 'cash'
                        ? 'نقداً بالخزينة'
                        : tx.paymentMethod === 'bank_transfer'
                        ? 'تحويل بنكي'
                        : tx.paymentMethod === 'instapay'
                        ? 'InstaPay'
                        : 'شيك'}
                    </td>

                    {/* Service Description */}
                    <td className="p-3.5 text-xs text-slate-300 max-w-[220px] truncate">
                      {tx.serviceDescription}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewReceiptTx(tx)}
                          title="عرض وطباعة إيصال السند المعتمد"
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-emerald-400 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id, tx.serialNumber)}
                          title="حذف الحركة"
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-tajawal">
                  {formData.type === 'income' ? 'تسجيل إيصال وارد نقدية (سند قبض أتعاب)' : 'تسجيل إيصال منصرف (سند صرف إجراءات)'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.type === 'income'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>وارد (استلام نقدية من عميل)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.type === 'expense'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>منصرف (سداد رسوم وإجراءات)</span>
                </button>
              </div>

              {/* Client Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  العميل التابع له الحركة (من الأرشيف) *
                </label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.clientCode}) - {c.facilityType}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    تاريخ الحركة والإيصال *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    المبلغ بالجنيه المصري (ج.م) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Category & Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    البند / التصنيف المالي *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TreasuryCategory })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="أتعاب محاسبة وإقرارات">أتعاب محاسبة وإقرارات</option>
                    <option value="أمانات رسوم ومستخرجات">أمانات رسوم ومستخرجات</option>
                    <option value="مصروفات تأسيس وتعديل شركات">مصروفات تأسيس وتعديل شركات</option>
                    <option value="مصروفات فحص ضريبي ولجان">مصروفات فحص ضريبي ولجان</option>
                    <option value="مصروفات استخراج شهادات ورسوم">مصروفات استخراج شهادات ورسوم</option>
                    <option value="أتعاب استشارات ودراسات جدوى">أتعاب استشارات ودراسات جدوى</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    طريقة الدفع والاستلام *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="cash">نقداً (خزينة المكتب)</option>
                    <option value="instapay">انستاباي InstaPay</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="check">شيك مصرفي</option>
                  </select>
                </div>
              </div>

              {/* Service Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  بيان الخدمة والإجراءات بالتفصيل *
                </label>
                <input
                  type="text"
                  required
                  value={formData.serviceDescription}
                  onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                  placeholder="مثال: سداد دفعة أتعاب تقديم الإقرار الضريبي السنوي وفحص مصلحة الضرائب"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Sync to Accounting Checkbox */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    التسميع التلقائي في دفتر اليومية العامة ودليل الحسابات
                  </div>
                  <div className="text-[11px] text-slate-400">
                    إنشاء قيد محاسبي مزدوج ومتزن تلقائياً لحساب الخزينة وإيرادات الأتعاب
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={syncToAccounting}
                  onChange={(e) => setSyncToAccounting(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-900 cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-colors cursor-pointer"
                >
                  حفظ الحركة وإصدار الإيصال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Receipt Voucher Modal */}
      {viewReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-6">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">معاينة الإيصال الرسمي المعتمد</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={printDocument}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الإيصال / PDF</span>
                </button>
                <button
                  onClick={() => setViewReceiptTx(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper Container */}
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-300 font-serif max-w-2xl mx-auto space-y-6">
                {/* Official Letterhead */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div className="text-right">
                    <h3 className="text-xs text-slate-700 font-bold">مكتب المحاسب والمراجع القانوني</h3>
                    <h2 className="text-xl font-extrabold text-slate-900">محمود الباز قابيل</h2>
                    <p className="text-xs text-slate-600">
                      سجل المحاسبين والمراجعين بوزارة المالية رقم: <strong>44887</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      عضو جمعية المحاسبين والمراجعين المصرية | خبير ضرائب
                    </p>
                  </div>

                  <div className="text-left">
                    <div className="border border-slate-900 px-3 py-1 font-mono font-bold text-sm bg-slate-50">
                      {viewReceiptTx.serialNumber}
                    </div>
                    <div className="text-xs text-slate-600 mt-1 font-mono">
                      التاريخ: {viewReceiptTx.date}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-2">
                  <span className="inline-block border-2 border-slate-900 px-6 py-1.5 text-base font-bold bg-slate-100 rounded">
                    {viewReceiptTx.type === 'income'
                      ? 'إيصال استلام نقدية (سند قبض أتعاب ورسوم)'
                      : 'إيصال صرف نقدية (سند صرف إجراءات ومصروفات)'}
                  </span>
                </div>

                {/* Content Details */}
                <div className="space-y-3 text-sm leading-relaxed">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-700 whitespace-nowrap">
                      {viewReceiptTx.type === 'income' ? 'استلمنا من السيد / السادة:' : 'صرفنا إلى السيد / لجهة:'}
                    </span>
                    <span className="flex-1 border-b border-dotted border-slate-400 font-bold text-slate-900 px-2">
                      {viewReceiptTx.clientName}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-700 whitespace-nowrap">مبلغ وقدره:</span>
                    <span className="flex-1 border-b border-dotted border-slate-400 font-bold font-mono text-emerald-800 px-2">
                      {viewReceiptTx.amount.toLocaleString()} ج.م (فقط وقدره {viewReceiptTx.amount.toLocaleString()} جنيهاً مصرياً لا غير)
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-700 whitespace-nowrap">وذلك نظير / مقابل:</span>
                    <span className="flex-1 border-b border-dotted border-slate-400 text-slate-900 px-2 font-medium">
                      {viewReceiptTx.serviceDescription} ({viewReceiptTx.category})
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-700 whitespace-nowrap">طريقة السداد:</span>
                    <span className="flex-1 border-b border-dotted border-slate-400 text-slate-800 px-2">
                      {viewReceiptTx.paymentMethod === 'cash'
                        ? 'نقداً بخزينة المكتب'
                        : viewReceiptTx.paymentMethod === 'instapay'
                        ? 'تحويل عبر تطبيق InstaPay'
                        : viewReceiptTx.paymentMethod === 'bank_transfer'
                        ? 'تحويل مصرفي بالحساب البنكي للمكتب'
                        : 'شيك مصرفي'}
                    </span>
                  </div>
                </div>

                {/* Signatures and Stamp */}
                <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                  <div>
                    <p className="font-bold text-slate-700 mb-8">المستلم / المحاسب المسؤول</p>
                    <p className="font-mono text-slate-500">........................</p>
                  </div>

                  <div className="border-2 border-dashed border-slate-400 p-3 rounded-lg bg-slate-50">
                    <p className="font-bold text-slate-900 mb-1">اعتماد المحاسب والمراجع القانوني</p>
                    <p className="font-extrabold text-slate-900">محمود الباز قابيل</p>
                    <p className="text-[11px] text-slate-600">سجل محاسبين ومراجعين رقم: 44887</p>
                    <div className="mt-2 text-[10px] text-slate-400 font-mono">
                      ختم وتوقيع معتمد
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
