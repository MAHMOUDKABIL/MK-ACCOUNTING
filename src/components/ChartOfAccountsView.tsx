import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Edit2,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  FolderTree,
  Plus,
  Printer,
  Search,
  Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Account, AccountCategory, AccountNature, AccountType } from '../types/accounting';

interface ChartOfAccountsViewProps {
  accounts: Account[];
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onUpdateAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => { success: boolean; message: string };
  onNavigateToLedger: (accountCode: string) => void;
}

export const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onNavigateToLedger,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set(['1', '11', '12', '2', '21', '23', '3', '4', '43']));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    englishName: '',
    category: 'assets' as AccountCategory,
    type: 'sub' as AccountType,
    nature: 'debit' as AccountNature,
    parentCode: '',
    openingBalance: 0,
    description: '',
  });

  const toggleExpand = (code: string) => {
    const next = new Set(expandedCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setExpandedCodes(next);
  };

  const expandAll = () => {
    const all = new Set(accounts.filter((a) => a.type === 'main').map((a) => a.code));
    setExpandedCodes(all);
  };

  const collapseAll = () => {
    setExpandedCodes(new Set());
  };

  const filteredAccounts = useMemo(() => {
    const searchLower = (searchTerm || '').toLowerCase().trim();
    return accounts.filter((acc) => {
      const matchCat = selectedCategory === 'all' || acc.category === selectedCategory;
      if (!matchCat) return false;
      if (!searchLower) return true;

      const codeStr = (acc.code || '').toLowerCase();
      const nameStr = (acc.name || '').toLowerCase();
      const engStr = (acc.englishName || '').toLowerCase();

      return (
        codeStr.includes(searchLower) ||
        nameStr.includes(searchLower) ||
        engStr.includes(searchLower)
      );
    });
  }, [accounts, searchTerm, selectedCategory]);

  const handleOpenAdd = (parentAcc?: Account) => {
    let suggestedCode = '';
    let category: AccountCategory = parentAcc ? parentAcc.category : 'assets';
    let parentCode = parentAcc ? parentAcc.code : '';
    let nature: AccountNature = parentAcc ? parentAcc.nature : 'debit';

    if (parentAcc) {
      const siblings = accounts.filter((a) => a.parentCode === parentAcc.code);
      suggestedCode = `${parentAcc.code}${siblings.length + 1}`;
    }

    setFormData({
      code: suggestedCode,
      name: '',
      englishName: '',
      category,
      type: 'sub',
      nature,
      parentCode,
      openingBalance: 0,
      description: '',
    });
    setEditingAccount(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setFormData({
      code: acc.code,
      name: acc.name,
      englishName: acc.englishName || '',
      category: acc.category,
      type: acc.type,
      nature: acc.nature,
      parentCode: acc.parentCode || '',
      openingBalance: acc.openingBalance || 0,
      description: acc.description || '',
    });
    setEditingAccount(acc);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      setNotification({ type: 'error', message: 'يرجى إدخال رقم الحساب واسم الحساب' });
      return;
    }

    if (editingAccount) {
      onUpdateAccount({
        ...editingAccount,
        ...formData,
        parentCode: formData.parentCode || null,
      });
      setNotification({ type: 'success', message: 'تم تحديث بيانات الحساب بنجاح' });
    } else {
      if (accounts.some((a) => a.code === formData.code)) {
        setNotification({ type: 'error', message: 'رقم الحساب موجود مسبقاً، يرجى اختيار رقم آخر' });
        return;
      }

      const parent = accounts.find((a) => a.code === formData.parentCode);
      const level = parent ? parent.level + 1 : 1;

      onAddAccount({
        ...formData,
        parentCode: formData.parentCode || null,
        level,
        isActive: true,
      });
      setNotification({ type: 'success', message: 'تمت إضافة الحساب الجديد بنجاح' });
    }

    setIsAddModalOpen(false);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDelete = (acc: Account) => {
    if (window.confirm(`هل أنت متأكد من حذف الحساب "${acc.name}" (${acc.code})؟`)) {
      const res = onDeleteAccount(acc.id);
      if (res.success) {
        setNotification({ type: 'success', message: res.message });
      } else {
        setNotification({ type: 'error', message: res.message });
      }
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
            <FolderTree className="w-5 h-5 text-sky-600" />
            شجرة ودليل الحسابات الموحد (المعايير المصرية)
          </h2>
          <p className="text-xs text-slate-500">
            هيكل الحسابات المحاسبية وفقاً للنظام المحاسبي المصري مع التحكم الكامل في الإضافة والتعديل والأرصدة
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حساب جديد</span>
          </button>

          <button
            onClick={expandAll}
            className="text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg border border-slate-300 shadow-2xs cursor-pointer font-medium"
          >
            توسيع الكل
          </button>
          <button
            onClick={collapseAll}
            className="text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg border border-slate-300 shadow-2xs cursor-pointer font-medium"
          >
            طي الكل
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-2xs ${
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الحساب أو اسم الحساب (مثال: 1241 أو الخزينة أو البنك)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">كافة التبويبات الرئيسية (1-4)</option>
            <option value="assets">1 - الأصول (Assets)</option>
            <option value="liabilities">2 - الالتزامات (Liabilities)</option>
            <option value="equity">21 - حقوق الملكية (Equity)</option>
            <option value="revenue">3 - الإيرادات (Revenues)</option>
            <option value="expense">4 - المصروفات والتكاليف (Expenses)</option>
          </select>
        </div>
      </div>

      {/* Accounts Table List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold">
                <th className="py-3 px-4 w-36">رقم الحساب</th>
                <th className="py-3 px-4">اسم الحساب المحاسبي</th>
                <th className="py-3 px-4 w-28 text-center">النوع</th>
                <th className="py-3 px-4 w-24 text-center">طبيعة الحساب</th>
                <th className="py-3 px-4 w-32 text-left">الرصيد الافتتاحي</th>
                <th className="py-3 px-4 w-32 text-left">الرصيد الحالي</th>
                <th className="py-3 px-4 w-36 text-center no-print">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredAccounts.map((acc) => {
                const hasChildren = accounts.some((a) => a.parentCode === acc.code);
                const isExpanded = expandedCodes.has(acc.code);
                const indentPadding = (acc.level - 1) * 20;

                return (
                  <tr
                    key={acc.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      acc.type === 'main' ? 'bg-slate-50/50 font-bold text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {/* Code */}
                    <td className="py-2.5 px-4 font-mono font-bold text-sky-600">
                      {acc.code}
                    </td>

                    {/* Name with indentation and folder icons */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5" style={{ paddingRight: `${indentPadding}px` }}>
                        {hasChildren ? (
                          <button
                            onClick={() => toggleExpand(acc.code)}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-sky-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          </button>
                        ) : (
                          <span className="w-5 inline-block"></span>
                        )}

                        {acc.type === 'main' ? (
                          isExpanded ? (
                            <FolderOpen className="w-4 h-4 text-sky-500 shrink-0" />
                          ) : (
                            <Folder className="w-4 h-4 text-sky-500 shrink-0" />
                          )
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                        )}

                        <span className="truncate">{acc.name}</span>
                        {acc.englishName && (
                          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                            ({acc.englishName})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          acc.type === 'main'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {acc.type === 'main' ? 'رئيسي (تجميعي)' : 'فرعي (حركة)'}
                      </span>
                    </td>

                    {/* Nature */}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                          acc.nature === 'debit'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}
                      >
                        {acc.nature === 'debit' ? 'مدين' : 'دائن'}
                      </span>
                    </td>

                    {/* Opening Balance */}
                    <td className="py-2.5 px-4 font-mono text-left text-slate-600">
                      {acc.openingBalance ? `${Number(acc.openingBalance).toLocaleString()} ج.م` : '-'}
                    </td>

                    {/* Current Balance */}
                    <td className="py-2.5 px-4 font-mono font-bold text-left text-slate-900">
                      {acc.type === 'sub'
                        ? `${Number(acc.currentBalance || 0).toLocaleString()} ج.م`
                        : '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        {acc.type === 'sub' && (
                          <button
                            onClick={() => onNavigateToLedger(acc.code)}
                            className="p-1.5 hover:bg-sky-50 text-sky-600 rounded transition-colors cursor-pointer"
                            title="عرض كشف حساب الأستاذ العام"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {acc.type === 'main' && (
                          <button
                            onClick={() => handleOpenAdd(acc)}
                            className="p-1.5 hover:bg-sky-50 text-sky-600 rounded transition-colors cursor-pointer"
                            title="إضافة حساب فرعي تحته"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(acc)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors cursor-pointer"
                          title="تعديل الحساب"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!acc.isSystem && (
                          <button
                            onClick={() => handleDelete(acc)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors cursor-pointer"
                            title="حذف الحساب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base font-cairo">
                {editingAccount ? 'تعديل بيانات الحساب المحاسبي' : 'إضافة حساب جديد إلى دليل الحسابات'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">رقم الحساب (الكود) *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="مثال: 1245"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">الحساب الأب (الرئيسي)</label>
                  <select
                    value={formData.parentCode}
                    onChange={(e) => setFormData({ ...formData, parentCode: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">بدون (حساب رئيسي مستوى أول)</option>
                    {accounts
                      .filter((a) => a.type === 'main')
                      .map((a) => (
                        <option key={a.code} value={a.code}>
                          {a.code} - {a.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">اسم الحساب باللغة العربية *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: بنك الإسكندرية - حساب جاري"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">الاسم بالإنجليزية (اختياري)</label>
                <input
                  type="text"
                  value={formData.englishName}
                  onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                  placeholder="Bank of Alexandria - Current"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">التبويب الرئيسي</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AccountCategory })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="assets">1 - الأصول</option>
                    <option value="liabilities">2 - الالتزامات</option>
                    <option value="equity">21 - حقوق الملكية</option>
                    <option value="revenue">3 - الإيرادات</option>
                    <option value="expense">4 - المصروفات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">نوع الحساب</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="sub">فرعي (يقبل قيود يومية)</option>
                    <option value="main">رئيسي (تجميعي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">طبيعة الحساب</label>
                  <select
                    value={formData.nature}
                    onChange={(e) => setFormData({ ...formData, nature: e.target.value as AccountNature })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="debit">مدين (Debit)</option>
                    <option value="credit">دائن (Credit)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">الرصيد الافتتاحي (أول المدة)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">ملاحظات ووصف الحساب</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف طبيعة استخدام هذا الحساب..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  {editingAccount ? 'حفظ التعديلات' : 'إضافة الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
