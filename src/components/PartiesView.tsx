import {
  Building,
  CreditCard,
  Edit2,
  FileSpreadsheet,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Account, Party, PartyType } from '../types/accounting';

interface PartiesViewProps {
  parties: Party[];
  accounts: Account[];
  onAddParty: (party: Omit<Party, 'id' | 'createdAt'>) => void;
  onUpdateParty: (party: Party) => void;
  onDeleteParty: (id: string) => void;
  onNavigateToInvoices: () => void;
  onNavigateToLedger: (accountCode: string) => void;
}

export const PartiesView: React.FC<PartiesViewProps> = ({
  parties,
  accounts,
  onAddParty,
  onUpdateParty,
  onDeleteParty,
  onNavigateToInvoices,
  onNavigateToLedger,
}) => {
  const [activeTab, setActiveTab] = useState<PartyType>('customer');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'customer' as PartyType,
    code: '',
    taxNumber: '',
    commercialRegistry: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 50000,
    openingBalance: 0,
    currentBalance: 0,
    linkedAccountCode: '1231',
    isActive: true,
  });

  const filteredParties = useMemo(() => {
    const searchLower = (searchTerm || '').toLowerCase().trim();
    return parties.filter((p) => {
      const matchType = p.type === activeTab;
      if (!matchType) return false;
      if (!searchLower) return true;

      const nameStr = (p.name || '').toLowerCase();
      const codeStr = (p.code || '').toLowerCase();
      const taxStr = (p.taxNumber || '').toLowerCase();
      const phoneStr = (p.phone || '').toLowerCase();

      return (
        nameStr.includes(searchLower) ||
        codeStr.includes(searchLower) ||
        taxStr.includes(searchLower) ||
        phoneStr.includes(searchLower)
      );
    });
  }, [parties, activeTab, searchTerm]);

  const handleOpenAdd = () => {
    const defaultAccount = activeTab === 'customer' ? '1231' : '231';
    const nextNum = parties.filter((p) => p.type === activeTab).length + 1;
    const prefix = activeTab === 'customer' ? 'CUST' : 'SUPP';

    setFormData({
      name: '',
      type: activeTab,
      code: `${prefix}-${String(nextNum).padStart(4, '0')}`,
      taxNumber: '',
      commercialRegistry: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: 50000,
      openingBalance: 0,
      currentBalance: 0,
      linkedAccountCode: defaultAccount,
      isActive: true,
    });
    setEditingParty(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Party) => {
    setFormData({
      name: p.name,
      type: p.type,
      code: p.code,
      taxNumber: p.taxNumber || '',
      commercialRegistry: p.commercialRegistry || '',
      phone: p.phone || '',
      email: p.email || '',
      address: p.address || '',
      creditLimit: p.creditLimit || 0,
      openingBalance: p.openingBalance || 0,
      currentBalance: p.currentBalance || 0,
      linkedAccountCode: p.linkedAccountCode || (p.type === 'customer' ? '1231' : '231'),
      isActive: p.isActive,
    });
    setEditingParty(p);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingParty) {
      onUpdateParty({
        ...editingParty,
        ...formData,
      });
    } else {
      onAddParty(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
            <Users className="w-5 h-5 text-sky-600" />
            إدارة حسابات العملاء والموردين (Accounts Receivable & Payable)
          </h2>
          <p className="text-xs text-slate-500">
            ملفات العملاء والموردين، حدود الائتمان، الأرقام الضريبية، ومتابعة الأرصدة المستحقة
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'customer' ? 'إضافة عميل جديد' : 'إضافة مورد جديد'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold no-print">
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'customer'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>سجل العملاء ({parties.filter((p) => p.type === 'customer').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('supplier')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'supplier'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>سجل الموردين ({parties.filter((p) => p.type === 'supplier').length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs no-print shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو الكود أو الرقم الضريبي أو رقم الهاتف..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-9 pl-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Parties Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
        {filteredParties.map((party) => (
          <div
            key={party.id}
            className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200 font-bold">
                    {party.code}
                  </span>
                  <h3 className="font-black text-slate-900 text-sm font-cairo mt-1">{party.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(party)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteParty(party.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tax & Phone info */}
              <div className="space-y-1 text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                {party.taxNumber && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>رقم ضريبي: {party.taxNumber}</span>
                  </div>
                )}
                {party.phone && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>هاتف: {party.phone}</span>
                  </div>
                )}
                {party.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{party.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Balances Box */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs font-mono">
                <span className="font-sans text-slate-600 text-[11px]">
                  {party.type === 'customer' ? 'الرصيد المدين المستحق:' : 'الرصيد الدائن المستحق:'}
                </span>
                <span className="font-bold text-sky-700 text-sm">
                  {Number(party.currentBalance || 0).toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => onNavigateToLedger(party.linkedAccountCode || (party.type === 'customer' ? '1231' : '231'))}
                  className="flex-1 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 border border-slate-300 shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span>كشف الحساب</span>
                </button>
                <button
                  onClick={onNavigateToInvoices}
                  className="flex-1 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 border border-sky-200 cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>فاتورة جديدة</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Party Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base font-cairo">
                {editingParty
                  ? `تعديل بيانات ${formData.type === 'customer' ? 'العميل' : 'المورد'}`
                  : `إضافة ${formData.type === 'customer' ? 'عميل جديد' : 'مورد جديد'}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الاسم بالكامل *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: شركة النيل للتجارة"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الكود التعريفي</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم التسجيل الضريبي (9 أرقام)</label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="مثال: 567-890-123"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">السجل التجاري</label>
                  <input
                    type="text"
                    value={formData.commercialRegistry}
                    onChange={(e) => setFormData({ ...formData, commercialRegistry: e.target.value })}
                    placeholder="مثال: 45210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم الهاتف والتواصل</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01012345678"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@company.eg"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">العنوان والمقر الرئيسي</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="القاهرة - مدينة نصر - المنطقة الأولى"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الرصيد الافتتاحي (ج.م)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">حد الائتمان المسموح (ج.م)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  {editingParty ? 'حفظ التعديلات' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
