import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Eye,
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
  X
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Account, AuditorStatement, CompanyProfile, JournalEntry, JournalEntryLine } from '../types/accounting';
import { A4ReportViewerModal } from './A4ReportViewerModal';

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
  const [entryForA4Voucher, setEntryForA4Voucher] = useState<JournalEntry | null>(null);
  const [isA4JournalBookOpen, setIsA4JournalBookOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

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
  const subAccounts = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'sub')
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [accounts]);

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
  const postedEntriesCount = useMemo(() => entries.filter((e) => e.isPosted).length, [entries]);

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
        message: `القيد غير متوازن! إجمالي المدين (${(totalDebit || 0).toLocaleString()}) لا يتطابق مع إجمالي الدائن (${(totalCredit || 0).toLocaleString()}). الفرق: ${(difference || 0).toLocaleString()}`,
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

    setNotification({ type: 'success', message: 'تم حفظ القيد المحاسبي بنجاح وإدراجه في دفتر اليومية' });
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

  const confirmDeleteEntry = () => {
    if (!entryToDelete) return;
    const res = onDeleteEntry(entryToDelete.id);
    if (res.success) {
      setNotification({ type: 'success', message: `تم حذف القيد ${entryToDelete.formattedNumber} وإلغاء تأثيره من الدفاتر بنجاح` });
    } else {
      setNotification({ type: 'error', message: res.message });
    }
    setEntryToDelete(null);
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePrintVoucher = (entry: JournalEntry) => {
    setEntryForA4Voucher(entry);
  };

  return (
    <div className="space-y-6 font-somar">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-somar flex items-center gap-2">
                دفتر قيود اليومية العامة
                <span className="text-xs bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-full font-mono border border-slate-700">
                  {entries.length} قيد
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                تسجيل القيود المزدوجة، إمكانية حذف القيود المسجلة والمرحلة، وإعادة احتساب أرصدة ميزان المراجعة تلقائياً
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsA4JournalBookOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95 border border-emerald-400/30"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة دفتر اليومية A4</span>
          </button>

          <button
            onClick={onOpenSmartEntry}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-500/30 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>اقتراح قيد ذكي بالذكاء الاصطناعي</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل قيد يومية جديد</span>
          </button>

          {unpostedEntriesCount > 0 && (
            <button
              onClick={onPostAll}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ترحيل كافة القيود المعلقة ({unpostedEntriesCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border no-print ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
              : 'bg-rose-950/40 text-rose-300 border-rose-800/80'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white cursor-pointer px-2">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Stats Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-800 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <div className="text-xs text-slate-400">إجمالي القيود باليومية</div>
          <div className="text-xl font-black text-white font-mono mt-1">{entries.length} قيد</div>
        </button>

        <button
          onClick={() => setStatusFilter('posted')}
          className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
            statusFilter === 'posted'
              ? 'bg-slate-800 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <div className="text-xs text-emerald-400">القيود المرحّلة للأستاذ العام</div>
          <div className="text-xl font-black text-white font-mono mt-1">{postedEntriesCount} قيد</div>
        </button>

        <button
          onClick={() => setStatusFilter('unposted')}
          className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
            statusFilter === 'unposted'
              ? 'bg-slate-800 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <div className="text-xs text-amber-400">القيود المعلقة (مسودات)</div>
          <div className="text-xl font-black text-white font-mono mt-1">{unpostedEntriesCount} قيد</div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md no-print">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث فوري برقم القيد (JV-2026-0001) أو الشرح أو اسم الحساب أو المستند المرجعي..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-somar"
          />
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-4 no-print">
        {filteredEntries.length === 0 ? (
          <div className="bg-slate-900/80 p-12 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
            لا توجد قيود يومية مطابقة لخيارات البحث أو التصفية
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition-all"
            >
              {/* Entry Card Header */}
              <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-emerald-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 text-sm">
                    {entry.formattedNumber}
                  </span>
                  <span className="text-slate-400 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    التاريخ: {entry.date}
                  </span>
                  {entry.referenceDoc && (
                    <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-mono border border-slate-700">
                      مستند: {entry.referenceDoc}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {entry.isPosted ? (
                    <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] px-3 py-1 rounded-full font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      مرحّل للأستاذ العام
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] px-3 py-1 rounded-full font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      معلق (مسودة)
                    </span>
                  )}

                  {/* Actions */}
                  {entry.isPosted ? (
                    <button
                      onClick={() => onUnpostEntry(entry.id)}
                      className="text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg border border-slate-700 cursor-pointer font-medium transition-colors"
                      title="إلغاء الترحيل للتعديل"
                    >
                      إلغاء الترحيل
                    </button>
                  ) : (
                    <button
                      onClick={() => onPostEntry(entry.id)}
                      className="text-[11px] text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-lg font-bold cursor-pointer shadow-md transition-colors"
                    >
                      ترحيل الآن
                    </button>
                  )}

                  <button
                    onClick={() => handlePrintVoucher(entry)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer border border-slate-700"
                    title="طباعة سند قيد اليومية الرسمي"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Delete Button - Allowed for ALL entries (posted or unposted) */}
                  <button
                    onClick={() => setEntryToDelete(entry)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer border border-slate-700"
                    title="حذف وإزالة هذا القيد بالكامل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="px-5 py-2.5 text-xs text-slate-300 font-medium bg-slate-900/60 border-b border-slate-800/60 flex items-center gap-2">
                <span className="text-slate-500 font-bold">البيان والشرح:</span>
                <span className="text-white">{entry.description}</span>
              </div>

              {/* Entry Lines Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/40 text-slate-400 border-b border-slate-800 text-[11px] font-bold">
                      <th className="py-2.5 px-4 w-32">رقم الحساب</th>
                      <th className="py-2.5 px-4">اسم الحساب المحاسبي</th>
                      <th className="py-2.5 px-4">شرح وتفاصيل الحركة</th>
                      <th className="py-2.5 px-4 w-36 text-left">مدين (Debit)</th>
                      <th className="py-2.5 px-4 w-36 text-left">دائن (Credit)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {entry.lines.map((line, idx) => (
                      <tr key={line.id || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                          {line.accountCode}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-white">
                          {line.accountName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                          {line.note || '-'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-left font-bold text-slate-100">
                          {line.debit > 0 ? `${(Number(line?.debit || 0)).toLocaleString()} ج.م` : '-'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-left font-bold text-slate-300">
                          {line.credit > 0 ? `${(Number(line?.credit || 0)).toLocaleString()} ج.م` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950/60 font-mono font-bold text-xs border-t border-slate-800 text-white">
                      <td colSpan={3} className="py-3 px-4 text-right text-slate-400 font-somar">
                        إجمالي القيد المتوازن:
                      </td>
                      <td className="py-3 px-4 text-left text-emerald-400 font-black">
                        {(Number(entry?.totalDebit || 0)).toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-4 text-left text-emerald-400 font-black">
                        {(Number(entry?.totalCredit || 0)).toLocaleString()} ج.م
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-somar">تأكيد حذف قيد اليومية</h3>
                <p className="text-xs text-slate-400">إزالة القيد والتراجع عن كافة تأثيراته المحاسبية</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">رقم القيد:</span>
                <span className="font-mono font-bold text-white">{entryToDelete.formattedNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">تاريخ القيد:</span>
                <span className="font-mono text-slate-300">{entryToDelete.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المبلغ الإجمالي:</span>
                <span className="font-mono font-bold text-emerald-400">{(entryToDelete?.totalDebit || 0).toLocaleString()} ج.م</span>
              </div>
              <div className="text-slate-400 pt-1 border-t border-slate-800/80">
                <span className="font-bold">البيان:</span> {entryToDelete.description}
              </div>
            </div>

            <p className="text-xs text-rose-300 bg-rose-950/30 border border-rose-900/50 p-3 rounded-xl">
              تنبيه: سيتم حذف هذا القيد فوراً وتحديث أرصدة دفتر الأستاذ العام وميزان المراجعة تلقائياً.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDeleteEntry}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/40 cursor-pointer transition-all"
              >
                تأكيد حذف القيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-white text-base font-somar flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  إنشاء قيد يومية عامة جديد (القيد المزدوج)
                </h3>
                <p className="text-xs text-slate-400">إدخال أطراف القيد والتحقق الفوري من التوازن المحاسبي</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEntry} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ القيد *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم المستند المرجعي (اختياري)</label>
                  <input
                    type="text"
                    value={referenceDoc}
                    onChange={(e) => setReferenceDoc(e.target.value)}
                    placeholder="مثال: فاتورة 1042 / إيصال 9921"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-somar"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                    <input
                      type="checkbox"
                      checked={isAutoPost}
                      onChange={(e) => setIsAutoPost(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer"
                    />
                    <span>ترحيل فوري لليومية والأستاذ</span>
                  </label>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-300 font-bold mb-1">شرح وبيان القيد المحاسبي *</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="مثال: إثبات سداد مصاريف صيانة ونظافة نقداً من الخزينة الرئيسية..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-somar"
                  />
                </div>
              </div>

              {/* Dynamic Entry Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">أطراف وحركات القيد (مدين / دائن):</span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة طرف آخر للقيد
                  </button>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-md">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] font-bold">
                        <th className="py-2.5 px-3 w-64">الحساب المحاسبي (فرعي)</th>
                        <th className="py-2.5 px-3 w-32 text-left">مدين (ج.م)</th>
                        <th className="py-2.5 px-3 w-32 text-left">دائن (ج.م)</th>
                        <th className="py-2.5 px-3">ملاحظات الطرف</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                      {lines.map((line, idx) => (
                        <tr key={line.id || idx}>
                          <td className="py-2 px-3">
                            <select
                              required
                              value={line.accountCode}
                              onChange={(e) => handleAccountChange(idx, e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
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
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-left font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
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
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-left font-mono font-bold text-slate-300 focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={line.note}
                              onChange={(e) => handleLineChange(idx, 'note', e.target.value)}
                              placeholder="شرح إضافي..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            {lines.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeLine(idx)}
                                className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
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
                className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 font-mono ${
                  isBalanced
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-somar font-bold text-xs">
                  {isBalanced ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span>{isBalanced ? 'القيد متوازن وصحيح محاسبياً' : 'القيد غير متوازن! يرجى مطابقة المدين والدائن'}</span>
                </div>

                <div className="flex items-center gap-6 text-xs font-bold">
                  <div>
                    <span className="text-slate-400 font-somar ml-1">إجمالي المدين:</span>
                    <span className="text-white">{(totalDebit || 0).toLocaleString()} ج.م</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-somar ml-1">إجمالي الدائن:</span>
                    <span className="text-white">{(totalCredit || 0).toLocaleString()} ج.م</span>
                  </div>
                  {!isBalanced && (
                    <div className="bg-rose-900/60 px-2.5 py-1 rounded text-rose-300 border border-rose-700 font-mono">
                      <span className="font-somar ml-1">الفرق:</span>
                      <span>{(difference || 0).toLocaleString()} ج.م</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced}
                  className={`px-6 py-2 rounded-xl font-bold shadow-lg transition-all cursor-pointer ${
                    isBalanced
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
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
                    {line.debit > 0 ? (Number(line?.debit || 0)).toLocaleString() : '-'}
                  </td>
                  <td className="border border-slate-300 p-2 font-mono text-left font-bold">
                    {line.credit > 0 ? (Number(line?.credit || 0)).toLocaleString() : '-'}
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
                  {(Number(selectedEntryForPrint?.totalDebit || 0)).toLocaleString()} ج.م
                </td>
                <td className="border border-slate-400 p-2 font-mono text-left">
                  {(Number(selectedEntryForPrint?.totalCredit || 0)).toLocaleString()} ج.م
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures Box */}
          <div className="grid grid-cols-4 gap-4 pt-10 text-center text-xs">
            <div className="border-t border-zinc-400 pt-2 space-y-1">
              <div className="font-bold">إعداد المحاسب</div>
              <div className="text-zinc-500 font-mono text-[10px]">التوقيع: .....................</div>
            </div>
            <div className="border-t border-zinc-400 pt-2 space-y-1">
              <div className="font-bold">مراجعة رئيس الحسابات</div>
              <div className="text-zinc-500 font-mono text-[10px]">التوقيع: .....................</div>
            </div>
            <div className="border-t border-zinc-400 pt-2 space-y-1">
              <div className="font-bold">اعتماد المدير المالي</div>
              <div className="text-zinc-500 font-mono text-[10px]">التوقيع: .....................</div>
            </div>
            <div className="border-t border-zinc-400 pt-2 space-y-1 bg-zinc-50 p-2 border rounded-lg">
              <div className="font-bold text-zinc-900">يعتمد المحاسب القانوني</div>
              <div className="h-8 flex items-center justify-center text-zinc-400 text-[9px] border-b border-dashed border-zinc-300">
                (مكان التوقيع والختم المعتمد)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional A4 Modal for Single Journal Entry Voucher */}
      {entryForA4Voucher && (
        <A4ReportViewerModal
          isOpen={!!entryForA4Voucher}
          onClose={() => setEntryForA4Voucher(null)}
          reportTitle={`سند قيد يومية محاسبي: ${entryForA4Voucher.formattedNumber}`}
          reportSubtitle={`تاريخ القيد: ${entryForA4Voucher.date} - المستند المرجعي: ${entryForA4Voucher.referenceDoc || 'لا يوجد'}`}
          companyProfile={companyProfile}
          auditorStatement={auditorStatement}
          pdfFileName={`سند_قيد_${entryForA4Voucher.formattedNumber}.pdf`}
        >
          <div className="space-y-4 font-somar text-right">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-100 p-3 rounded-lg border border-slate-300 text-xs text-slate-800 font-sans">
              <div><strong>رقم القيد:</strong> <span className="font-mono font-bold">{entryForA4Voucher.formattedNumber}</span></div>
              <div><strong>تاريخ التسجيل:</strong> <span className="font-mono">{entryForA4Voucher.date}</span></div>
              <div><strong>حالة الترحيل:</strong> {entryForA4Voucher.isPosted ? 'مرحل للأستاذ العام' : 'مسودة غير مرحل'}</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-800">
              <strong>البيان والشرح العام للقيد:</strong> {entryForA4Voucher.description}
            </div>

            <table className="w-full text-[11px] border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                  <th className="border border-slate-400 p-1.5 text-center w-24">رقم الحساب</th>
                  <th className="border border-slate-400 p-1.5 text-right">اسم الحساب المحاسبي</th>
                  <th className="border border-slate-400 p-1.5 text-right">البيان والشرح التحليلي</th>
                  <th className="border border-slate-400 p-1.5 text-left w-28">مدين (ج.م)</th>
                  <th className="border border-slate-400 p-1.5 text-left w-28">دائن (ج.م)</th>
                </tr>
              </thead>
              <tbody>
                {entryForA4Voucher.lines.map((line, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 p-1.5 text-center font-mono text-[10px] font-bold">{line.accountCode}</td>
                    <td className="border border-slate-300 p-1.5 text-right font-semibold text-slate-900">{line.accountName}</td>
                    <td className="border border-slate-300 p-1.5 text-right text-slate-700">{line.note || '-'}</td>
                    <td className="border border-slate-300 p-1.5 text-left font-mono font-bold">{line.debit > 0 ? (Number(line?.debit || 0)).toLocaleString() : '-'}</td>
                    <td className="border border-slate-300 p-1.5 text-left font-mono font-bold">{line.credit > 0 ? (Number(line?.credit || 0)).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-300 text-slate-950 font-bold text-[11px] border-t-2 border-slate-600">
                  <td colSpan={3} className="border border-slate-400 p-2 text-center">الإجمالي العام لقيد اليومية (متوازن)</td>
                  <td className="border border-slate-400 p-2 text-left font-mono font-black">{(Number(entryForA4Voucher?.totalDebit || 0)).toLocaleString()} ج.م</td>
                  <td className="border border-slate-400 p-2 text-left font-mono font-black">{(Number(entryForA4Voucher?.totalCredit || 0)).toLocaleString()} ج.م</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </A4ReportViewerModal>
      )}

      {/* Professional A4 Modal for Full Journal Book */}
      <A4ReportViewerModal
        isOpen={isA4JournalBookOpen}
        onClose={() => setIsA4JournalBookOpen(false)}
        reportTitle="دفتر قيود اليومية العامة المعتمد"
        reportSubtitle={`سجل العمليات والقيود المحاسبية - إجمالي القيود (${entries.length})`}
        companyProfile={companyProfile}
        auditorStatement={auditorStatement}
        pdfFileName="دفتر_اليومية_العامة_A4.pdf"
      >
        <div className="space-y-6 font-somar text-right">
          <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 flex items-center justify-between text-xs text-slate-800 font-sans">
            <div><strong>إجمالي القيود بالدفتر:</strong> {entries.length} قيد</div>
            <div><strong>القيود المرحلة:</strong> {entries.filter((e) => e.isPosted).length} قيد</div>
            <div><strong>تاريخ الطباعة:</strong> {new Date().toLocaleDateString('ar-EG')}</div>
          </div>

          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">{entry.formattedNumber}</span>
                    <span className="font-mono text-slate-600">{entry.date}</span>
                    <span className="text-slate-800 font-medium">{entry.description}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${entry.isPosted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {entry.isPosted ? 'مرحل' : 'مسودة'}
                  </span>
                </div>
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                      <th className="p-1 text-center w-20">رقم الحساب</th>
                      <th className="p-1 text-right">اسم الحساب</th>
                      <th className="p-1 text-right">البيان</th>
                      <th className="p-1 text-left w-24">مدين</th>
                      <th className="p-1 text-left w-24">دائن</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.lines.map((l, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="p-1 text-center font-mono">{l.accountCode}</td>
                        <td className="p-1 text-right font-medium">{l.accountName}</td>
                        <td className="p-1 text-right text-slate-500">{l.note || '-'}</td>
                        <td className="p-1 text-left font-mono">{l.debit > 0 ? (Number(l?.debit || 0)).toLocaleString() : '-'}</td>
                        <td className="p-1 text-left font-mono">{l.credit > 0 ? (Number(l?.credit || 0)).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-[10px]">
                      <td colSpan={3} className="p-1 text-center text-slate-600">الإجمالي</td>
                      <td className="p-1 text-left font-mono">{(Number(entry?.totalDebit || 0)).toLocaleString()}</td>
                      <td className="p-1 text-left font-mono">{(Number(entry?.totalCredit || 0)).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>
        </div>
      </A4ReportViewerModal>
    </div>
  );
};
