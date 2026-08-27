import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Account, AuditorStatement, CompanyProfile, JournalEntry, JournalEntryLine } from '../types/accounting';

interface JournalEntriesViewProps {
  entries: JournalEntry[];
  accounts: Account[];
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'entryNumber' | 'formattedNumber' | 'createdAt'>) => void;
  onUpdateEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => { success: boolean; message: string };
  onPostEntry: (id: string) => void;
  onUnpostEntry: (id: string) => void;
  onPostAll: () => void;
  onOpenSmartEntry: () => void;
}

export const JournalEntriesView: React.FC<JournalEntriesViewProps> = ({
  entries,
  accounts,
  companyProfile,
  auditorStatement,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onPostEntry,
  onUnpostEntry,
  onPostAll,
  onOpenSmartEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'posted' | 'unposted'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntryForPrint, setSelectedEntryForPrint] = useState<JournalEntry | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state for creating a new Journal Entry
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceDoc, setReferenceDoc] = useState('');
  const [description, setDescription] = useState('');
  const [isAutoPost, setIsAutoPost] = useState(true);
  const [lines, setLines] = useState<
    Array<{
      id: string;
      accountId: string;
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
      note: string;
      costCenter: string;
    }>
  >([
    { id: '1', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, note: '', costCenter: '' },
    { id: '2', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, note: '', costCenter: '' },
  ]);

  // Sub-accounts only can be chosen for journal lines
  const subAccounts = useMemo(() => accounts.filter((a) => a.type === 'sub'), [accounts]);

  const filteredEntries = useMemo(() => {
    const searchLower = (searchTerm || '').toLowerCase().trim();
    return entries.filter((e) => {
      if (searchLower) {
        const numStr = (e.formattedNumber || (e.entryNumber ? `JV-${e.entryNumber}` : '')).toLowerCase();
        const descStr = (e.description || '').toLowerCase();
        const refStr = (e.referenceDoc || '').toLowerCase();
        const matchLines = e.lines?.some(
          (l) =>
            (l.accountName && l.accountName.toLowerCase().includes(searchLower)) ||
            (l.accountCode && l.accountCode.toLowerCase().includes(searchLower)) ||
            (l.note && l.note.toLowerCase().includes(searchLower))
        );

        const matchSearch =
          numStr.includes(searchLower) ||
          descStr.includes(searchLower) ||
          refStr.includes(searchLower) ||
          Boolean(matchLines);

        if (!matchSearch) return false;
      }

      const matchStatus =
        statusFilter === 'all' || (statusFilter === 'posted' ? e.isPosted : !e.isPosted);

      return matchStatus;
    });
  }, [entries, searchTerm, statusFilter]);

  const unpostedEntriesCount = useMemo(() => entries.filter((e) => !e.isPosted).length, [entries]);

  // Balancing totals calculation
  const totalDebit = useMemo(() => lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0), [lines]);
  const difference = useMemo(() => Math.abs(totalDebit - totalCredit), [totalDebit, totalCredit]);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  const handleAccountChange = (index: number, accountCode: string) => {
    const target = subAccounts.find((a) => a.code === accountCode);
    const updated = [...lines];
    if (target) {
      updated[index].accountId = target.id;
      updated[index].accountCode = target.code;
      updated[index].accountName = target.name;
    } else {
      updated[index].accountId = '';
      updated[index].accountCode = '';
      updated[index].accountName = '';
    }
    setLines(updated);
  };

  const handleLineChange = (index: number, field: string, val: any) => {
    const updated = [...lines];
    (updated[index] as any)[field] = val;
    setLines(updated);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: String(Date.now()),
        accountId: '',
        accountCode: '',
        accountName: '',
        debit: 0,
        credit: 0,
        note: '',
        costCenter: '',
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      setNotification({ type: 'error', message: 'يجب أن يحتوي القيد على طرفين على الأقل' });
      return;
    }
    const updated = lines.filter((_, i) => i !== index);
    setLines(updated);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setNotification({ type: 'error', message: 'يرجى كتابة شرح وبيان القيد المحاسبي' });
      return;
    }

    if (!isBalanced) {
      setNotification({
        type: 'error',
        message: `القيد غير متوازن! إجمالي المدين (${totalDebit.toLocaleString()}) لا يتطابق مع إجمالي الدائن (${totalCredit.toLocaleString()}). الفرق: ${difference.toLocaleString()}`,
      });
      return;
    }

    const invalidLine = lines.find((l) => !l.accountCode || (l.debit === 0 && l.credit === 0));
    if (invalidLine) {
      setNotification({ type: 'error', message: 'يرجى التأكد من اختيار الحساب وتحديد المبلغ لجميع أطراف القيد' });
      return;
    }

    onAddEntry({
      date,
      referenceDoc,
      description,
      isPosted: isAutoPost,
      createdBy: 'محاسب مالي معتمد',
      totalDebit,
      totalCredit,
      lines: lines.map((l) => ({
        id: `l-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        accountId: l.accountId,
        accountCode: l.accountCode,
        accountName: l.accountName,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        note: l.note || description,
        costCenter: l.costCenter,
      })),
    });

    setNotification({ type: 'success', message: 'تم حفظ القيد المحاسبي بنجاح وإدراجه في اليومية العامة' });
    setIsModalOpen(false);
    resetForm();
    setTimeout(() => setNotification(null), 4000);
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setReferenceDoc('');
    setDescription('');
    setLines([
      { id: '1', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, note: '', costCenter: '' },
      { id: '2', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, note: '', costCenter: '' },
    ]);
  };

  const handleDelete = (entry: JournalEntry) => {
    if (window.confirm(`هل أنت متأكد من حذف القيد رقم ${entry.formattedNumber}؟`)) {
      const res = onDeleteEntry(entry.id);
      if (res.success) {
        setNotification({ type: 'success', message: res.message });
      } else {
        setNotification({ type: 'error', message: res.message });
      }
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handlePrintVoucher = (entry: JournalEntry) => {
    setSelectedEntryForPrint(entry);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
            <BookOpen className="w-5 h-5 text-sky-600" />
            دفتر اليومية العامة والقيود المحاسبية
          </h2>
          <p className="text-xs text-slate-500">
            تسجيل القيود المزدوجة المتوازنة، الترحيل الفوري للأستاذ العام، واقتراح القيود الآلية الذكية
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onOpenSmartEntry}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-sky-200" />
            <span>اقتراح قيد آلي ذكي</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-600" />
            <span>قيد يدوي جديد</span>
          </button>

          {unpostedEntriesCount > 0 && (
            <button
              onClick={onPostAll}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ترحيل الكل ({unpostedEntriesCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-2xs no-print ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs no-print">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم القيد (JV-2026-0001) أو البيان أو اسم الحساب أو المستند المرجعي..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">كافة القيود ({entries.length})</option>
            <option value="posted">القيود المرحّلة فقط للأستاذ العام</option>
            <option value="unposted">القيود المعلقة (غير مرحلة)</option>
          </select>
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-4 no-print">
        {filteredEntries.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center text-slate-500 text-xs">
            لا توجد قيود يومية مطابقة لخيارات البحث الحالية
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-sky-300 transition-all"
            >
              {/* Entry Card Header */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 text-sm">
                    {entry.formattedNumber}
                  </span>
                  <span className="text-slate-600 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    التاريخ: {entry.date}
                  </span>
                  {entry.referenceDoc && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-200">
                      مستند: {entry.referenceDoc}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {entry.isPosted ? (
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] px-2.5 py-1 rounded-full font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      مرحّل للأستاذ العام
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] px-2.5 py-1 rounded-full font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      معلق (مسودة)
                    </span>
                  )}

                  {/* Actions */}
                  {entry.isPosted ? (
                    <button
                      onClick={() => onUnpostEntry(entry.id)}
                      className="text-[11px] text-slate-600 hover:text-amber-800 bg-white hover:bg-slate-50 px-2.5 py-1 rounded border border-slate-300 shadow-2xs cursor-pointer font-medium"
                      title="إلغاء الترحيل للتعديل"
                    >
                      إلغاء الترحيل
                    </button>
                  ) : (
                    <button
                      onClick={() => onPostEntry(entry.id)}
                      className="text-[11px] text-white bg-sky-600 hover:bg-sky-700 px-2.5 py-1 rounded font-bold cursor-pointer shadow-2xs"
                    >
                      ترحيل الآن
                    </button>
                  )}

                  <button
                    onClick={() => handlePrintVoucher(entry)}
                    className="p-1.5 hover:bg-sky-50 text-sky-600 rounded transition-colors cursor-pointer"
                    title="طباعة سند قيد اليومية الرسمي"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(entry)}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors cursor-pointer"
                    title="حذف القيد"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="px-4 py-2 text-xs text-slate-700 font-medium bg-white border-b border-slate-100">
                <span className="text-slate-400 font-bold ml-1">البيان:</span> {entry.description}
              </div>

              {/* Entry Lines Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-200 text-[11px] font-semibold">
                      <th className="py-2 px-4 w-28">رقم الحساب</th>
                      <th className="py-2 px-4">اسم الحساب المحاسبي</th>
                      <th className="py-2 px-4">شرح وتفاصيل الحركة</th>
                      <th className="py-2 px-4 w-32 text-left">مدين (Debit)</th>
                      <th className="py-2 px-4 w-32 text-left">دائن (Credit)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entry.lines.map((line, idx) => (
                      <tr key={line.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 font-mono font-semibold text-sky-600">
                          {line.accountCode}
                        </td>
                        <td className="py-2 px-4 font-medium text-slate-800">
                          {line.accountName}
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px]">
                          {line.note || '-'}
                        </td>
                        <td className="py-2 px-4 font-mono text-left font-bold text-slate-900">
                          {line.debit > 0 ? `${Number(line.debit).toLocaleString()} ج.م` : '-'}
                        </td>
                        <td className="py-2 px-4 font-mono text-left font-bold text-slate-700">
                          {line.credit > 0 ? `${Number(line.credit).toLocaleString()} ج.م` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-mono font-bold text-xs border-t border-slate-200">
                      <td colSpan={3} className="py-2.5 px-4 text-right text-slate-600 font-sans">
                        الإجمالي المتوازن:
                      </td>
                      <td className="py-2.5 px-4 text-left text-sky-700 font-black">
                        {Number(entry.totalDebit).toLocaleString()} ج.م
                      </td>
                      <td className="py-2.5 px-4 text-left text-slate-900 font-black">
                        {Number(entry.totalCredit).toLocaleString()} ج.م
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Entry Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-slate-900 text-base font-cairo flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-600" />
                  إنشاء قيد يومية عامة جديد (القيد المزدوج)
                </h3>
                <p className="text-xs text-slate-500">إدخال أطراف القيد والتحقق الفوري من التوازن المحاسبي</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEntry} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">تاريخ القيد *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">رقم المستند المرجعي (اختياري)</label>
                  <input
                    type="text"
                    value={referenceDoc}
                    onChange={(e) => setReferenceDoc(e.target.value)}
                    placeholder="مثال: فاتورة 1042 / شيك 9921"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={isAutoPost}
                      onChange={(e) => setIsAutoPost(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <span>ترحيل فوري للأستاذ العام</span>
                  </label>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-600 font-semibold mb-1">شرح وبيان القيد المحاسبي *</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="مثال: إثبات سداد مصاريف صيانة ونظافة نقداً من الخزينة الرئيسية..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Dynamic Entry Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">أطراف وحركات القيد (مدين / دائن):</span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة طرف آخر للقيد
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold">
                        <th className="py-2.5 px-3 w-64">الحساب المحاسبي (فرعي)</th>
                        <th className="py-2.5 px-3 w-32 text-left">مدين (ج.م)</th>
                        <th className="py-2.5 px-3 w-32 text-left">دائن (ج.م)</th>
                        <th className="py-2.5 px-3">ملاحظات الطرف</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {lines.map((line, idx) => (
                        <tr key={line.id || idx}>
                          <td className="py-2 px-3">
                            <select
                              required
                              value={line.accountCode}
                              onChange={(e) => handleAccountChange(idx, e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            >
                              <option value="">-- اختر الحساب الفرعي --</option>
                              {subAccounts.map((acc) => (
                                <option key={acc.code} value={acc.code}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.debit || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                handleLineChange(idx, 'debit', val);
                                if (val > 0) handleLineChange(idx, 'credit', 0);
                              }}
                              placeholder="0.00"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-left font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.credit || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                handleLineChange(idx, 'credit', val);
                                if (val > 0) handleLineChange(idx, 'debit', 0);
                              }}
                              placeholder="0.00"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-left font-mono font-bold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={line.note}
                              onChange={(e) => handleLineChange(idx, 'note', e.target.value)}
                              placeholder="شرح إضافي..."
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            {lines.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeLine(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                title="حذف هذا الطرف"
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

              {/* Balance Verification Bar */}
              <div
                className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 font-mono shadow-2xs ${
                  isBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2 font-sans font-bold text-xs">
                  {isBalanced ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <span>{isBalanced ? 'القيد متوازن وصحيح محاسبياً' : 'القيد غير متوازن! يرجى مطابقة المدين والدائن'}</span>
                </div>

                <div className="flex items-center gap-6 text-xs font-bold">
                  <div>
                    <span className="text-slate-500 font-sans ml-1">إجمالي المدين:</span>
                    <span className="text-slate-900">{totalDebit.toLocaleString()} ج.م</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans ml-1">إجمالي الدائن:</span>
                    <span className="text-slate-900">{totalCredit.toLocaleString()} ج.م</span>
                  </div>
                  {!isBalanced && (
                    <div className="bg-rose-100 px-2.5 py-1 rounded text-rose-800 border border-rose-300 font-mono">
                      <span className="font-sans ml-1">الفرق:</span>
                      <span>{difference.toLocaleString()} ج.م</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced}
                  className={`px-6 py-2 rounded-lg font-bold shadow-sm transition-all cursor-pointer ${
                    isBalanced
                      ? 'bg-sky-600 hover:bg-sky-700 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  حفظ القيد باليومية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Journal Voucher (سند قيد اليومية الرسمي) */}
      {selectedEntryForPrint && (
        <div className="print-only hidden p-8 bg-white text-slate-900 font-sans max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-xl font-black">{companyProfile.name}</h1>
              <p className="text-xs text-slate-600">{companyProfile.legalForm}</p>
              <p className="text-xs text-slate-600">
                الرقم الضريبي: {companyProfile.taxCard} | السجل التجاري: {companyProfile.commercialRegistry}
              </p>
            </div>
            <div className="text-left space-y-1">
              <div className="text-xl font-black bg-slate-100 px-3 py-1 border border-slate-400 rounded">
                سند قيد يومية عامة
              </div>
              <div className="text-sm font-mono font-bold">{selectedEntryForPrint.formattedNumber}</div>
              <div className="text-xs">التاريخ: {selectedEntryForPrint.date}</div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 border border-slate-300 rounded">
            <div>
              <strong>البيان والشرح:</strong> {selectedEntryForPrint.description}
            </div>
            <div>
              <strong>المستند المرجعي:</strong> {selectedEntryForPrint.referenceDoc || 'لا يوجد'}
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse text-xs border border-slate-400">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-400 font-bold">
                <th className="border border-slate-400 p-2 w-28">رقم الحساب</th>
                <th className="border border-slate-400 p-2">اسم الحساب المحاسبي</th>
                <th className="border border-slate-400 p-2">البيان والتفاصيل</th>
                <th className="border border-slate-400 p-2 w-32 text-left">مدين (ج.م)</th>
                <th className="border border-slate-400 p-2 w-32 text-left">دائن (ج.م)</th>
              </tr>
            </thead>
            <tbody>
              {selectedEntryForPrint.lines.map((line, idx) => (
                <tr key={idx} className="border-b border-slate-300">
                  <td className="border border-slate-300 p-2 font-mono font-bold">{line.accountCode}</td>
                  <td className="border border-slate-300 p-2 font-semibold">{line.accountName}</td>
                  <td className="border border-slate-300 p-2 text-slate-700">{line.note || '-'}</td>
                  <td className="border border-slate-300 p-2 font-mono text-left font-bold">
                    {line.debit > 0 ? Number(line.debit).toLocaleString() : '-'}
                  </td>
                  <td className="border border-slate-300 p-2 font-mono text-left font-bold">
                    {line.credit > 0 ? Number(line.credit).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                <td colSpan={3} className="border border-slate-400 p-2 text-right">
                  الإجمالي العام:
                </td>
                <td className="border border-slate-400 p-2 font-mono text-left">
                  {Number(selectedEntryForPrint.totalDebit).toLocaleString()} ج.م
                </td>
                <td className="border border-slate-400 p-2 font-mono text-left">
                  {Number(selectedEntryForPrint.totalCredit).toLocaleString()} ج.م
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures Box */}
          <div className="grid grid-cols-4 gap-4 pt-10 text-center text-xs">
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <div className="font-bold">إعداد المحاسب</div>
              <div className="text-slate-500 font-mono text-[10px]">التوقيع: .....................</div>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <div className="font-bold">مراجعة رئيس الحسابات</div>
              <div className="text-slate-500 font-mono text-[10px]">التوقيع: .....................</div>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <div className="font-bold">اعتماد المدير المالي</div>
              <div className="text-slate-500 font-mono text-[10px]">التوقيع: .....................</div>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-1 bg-slate-50 p-1 border rounded">
              <div className="font-bold text-slate-900">المحاسب والمراجع القانوني</div>
              <div className="font-semibold text-sky-950">{auditorStatement.auditorName}</div>
              <div className="text-[9px] text-slate-600">{auditorStatement.registerNumber}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
