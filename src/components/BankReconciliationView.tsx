import {
  AlertCircle,
  Award,
  Building2,
  CheckCircle2,
  Coins,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Landmark,
  Plus,
  Printer,
  Scale,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { Account, AuditorStatement, CompanyProfile } from '../types/accounting';

interface ReconciliationItem {
  id: string;
  type: 'deposit_in_transit' | 'outstanding_check' | 'bank_charge' | 'bank_interest' | 'other';
  description: string;
  amount: number;
  date: string;
  reference: string;
}

interface BankReconciliationViewProps {
  accounts: Account[];
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
}

export const BankReconciliationView: React.FC<BankReconciliationViewProps> = ({
  accounts,
  companyProfile,
  auditorStatement,
}) => {
  // Filter cash and bank accounts (code starts with 124)
  const cashBankAccounts = accounts.filter(
    (a) => a.type === 'sub' && (a.code.startsWith('124') || a.code.startsWith('121') || a.code.startsWith('12'))
  );

  const [selectedAccountCode, setSelectedAccountCode] = useState<string>(
    cashBankAccounts[0]?.code || '1242'
  );
  const [statementDate, setStatementDate] = useState<string>('2026-03-31');
  const [bankStatementBalance, setBankStatementBalance] = useState<number>(0);

  const selectedAccount = accounts.find((a) => a.code === selectedAccountCode) || cashBankAccounts[0];
  const bookBalance = selectedAccount?.currentBalance || 0;

  // Outstanding adjustments lists
  const [depositsInTransit, setDepositsInTransit] = useState<ReconciliationItem[]>([]);
  const [outstandingChecks, setOutstandingChecks] = useState<ReconciliationItem[]>([]);
  const [bankAdjustments, setBankAdjustments] = useState<ReconciliationItem[]>([]);

  // Item input forms
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'deposit' | 'check' | 'charge'>('deposit');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newAmount) || 0;
    if (amountNum <= 0 || !newDesc.trim()) return;

    const newItem: ReconciliationItem = {
      id: `rec-${Date.now()}`,
      type: newType === 'deposit' ? 'deposit_in_transit' : newType === 'check' ? 'outstanding_check' : 'bank_charge',
      description: newDesc,
      amount: amountNum,
      date: statementDate,
      reference: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    if (newType === 'deposit') {
      setDepositsInTransit([...depositsInTransit, newItem]);
    } else if (newType === 'check') {
      setOutstandingChecks([...outstandingChecks, newItem]);
    } else {
      setBankAdjustments([...bankAdjustments, newItem]);
    }

    setNewDesc('');
    setNewAmount('');
  };

  const removeItem = (id: string, listType: 'deposit' | 'check' | 'charge') => {
    if (listType === 'deposit') {
      setDepositsInTransit(depositsInTransit.filter((i) => i.id !== id));
    } else if (listType === 'check') {
      setOutstandingChecks(outstandingChecks.filter((i) => i.id !== id));
    } else {
      setBankAdjustments(bankAdjustments.filter((i) => i.id !== id));
    }
  };

  // Calculations:
  // Adjusted Bank Balance = Bank Statement Balance + Deposits in Transit - Outstanding Checks
  const totalDepositsInTransit = depositsInTransit.reduce((s, i) => s + i.amount, 0);
  const totalOutstandingChecks = outstandingChecks.reduce((s, i) => s + i.amount, 0);
  const adjustedBankBalance = bankStatementBalance + totalDepositsInTransit - totalOutstandingChecks;

  // Adjusted Book Balance = Book Balance - Unrecorded Bank Charges
  const totalBankCharges = bankAdjustments.reduce((s, i) => s + i.amount, 0);
  const adjustedBookBalance = bookBalance - totalBankCharges;

  const variance = Math.abs(adjustedBankBalance - adjustedBookBalance);
  const isReconciled = variance < 0.01;

  return (
    <div className="space-y-6 select-none">
      {/* Top Controls Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-cairo">
            <Landmark className="w-5 h-5 text-sky-600" />
            مذكرة تسوية البنك والخزينة (Bank & Cash Reconciliation)
          </h2>
          <p className="text-xs text-slate-500">
            مطابقة رصيد كشف الحساب البنكي الفعلي مع رصيد الأستاذ العام والدفاتر المحاسبية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>طباعة المذكرة المعتمدة A4</span>
          </button>
        </div>
      </div>

      {/* Account Selector & Bank Statement Balance Entry */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            اختر الحساب البنكي / الخزينة:
          </label>
          <select
            value={selectedAccountCode}
            onChange={(e) => setSelectedAccountCode(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500"
          >
            {cashBankAccounts.map((acc) => (
              <option key={acc.id} value={acc.code}>
                {acc.code} - {acc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            تاريخ مذكرة التسوية:
          </label>
          <input
            type="date"
            value={statementDate}
            onChange={(e) => setStatementDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            الرصيد الفعلي بموجب كشف حساب البنك (ج.م) *:
          </label>
          <input
            type="number"
            step="any"
            value={bankStatementBalance === 0 ? '' : bankStatementBalance}
            onChange={(e) => setBankStatementBalance(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-sky-950 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Add Adjusting Items Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 no-print">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-cairo">
          <Plus className="w-4 h-4 text-sky-600" />
          <span>إضافة عناصر التسوية والعمليات المعلقة بالطريق</span>
        </h3>

        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">نوع العملية المعلقة:</label>
            <select
              value={newType}
              onChange={(e: any) => setNewType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
            >
              <option value="deposit">(+) إيداعات نقدية / تحويلات بالطريق لم تظهر بالبنك</option>
              <option value="check">(-) شيكات صادرة للموردين لم تقدم للصرف بعد</option>
              <option value="charge">(-) مصروفات / عمولات بنكية لم تسجل بالدفاتر بعد</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-600 font-semibold mb-1">البيان والشرح:</label>
            <input
              type="text"
              required
              placeholder="مثلاً: شيك رقم 4859 لصالح شركة التوريدات..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">المبلغ (ج.م):</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg cursor-pointer shrink-0 shadow-sm"
              >
                إضافة
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Official Reconciliation Statement Sheet (Printable A4) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-xs space-y-6 max-w-4xl mx-auto">
        {/* Letterhead */}
        <div className="border-b-2 border-slate-200 pb-4 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-right">
          <div>
            <div className="text-base font-black text-slate-900 font-cairo">
              {companyProfile.name}
            </div>
            <div className="text-xs text-slate-500">
              إدارة الحسابات والمراجعة المالية الداخلية
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-lg font-black text-sky-900 font-cairo">
              مذكرة تسوية الحساب البنكي
            </h1>
            <div className="text-xs text-slate-500 font-mono">
              كما في {statementDate}
            </div>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center md:text-left">
            <div>الحساب: <strong>{selectedAccount?.name}</strong></div>
            <div className="font-mono text-sky-700 font-bold">{selectedAccount?.code}</div>
          </div>
        </div>

        {/* Live Status Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="text-xs text-slate-600 font-semibold">رصيد كشف حساب البنك المعدل</div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {adjustedBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="text-xs text-slate-600 font-semibold">الرصيد الدفتري المعدل (الأستاذ العام)</div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {adjustedBookBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border space-y-1 ${
              isReconciled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="text-xs font-bold flex items-center gap-1.5">
              {isReconciled ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{isReconciled ? 'المطابقة صحيحة (فارق = 0)' : 'يوجد فارق غير مطابق'}</span>
            </div>
            <div className="text-base font-bold font-mono">
              فارق: {variance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
            </div>
          </div>
        </div>

        {/* Detailed Two-Column Reconciliation Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Side A: Starting with Bank Statement Balance */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-sky-50 p-3 font-bold text-sky-950 border-b border-sky-200">
              أولاً: التسوية بدءاً برصيد كشف حساب البنك
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-900">
                <span>رصيد كشف حساب البنك في {statementDate}</span>
                <span className="font-mono">{bankStatementBalance.toLocaleString()} ج.م</span>
              </div>

              {/* Add deposits in transit */}
              <div className="space-y-1.5">
                <div className="font-bold text-emerald-800 flex items-center justify-between">
                  <span>يضاف (+): إيداعات بالطريق لم تظهر بالبنك</span>
                  <span className="font-mono">+{totalDepositsInTransit.toLocaleString()}</span>
                </div>
                {depositsInTransit.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-slate-600 pr-3 text-[11px]">
                    <span>• {item.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{item.amount.toLocaleString()}</span>
                      <button
                        onClick={() => removeItem(item.id, 'deposit')}
                        className="text-rose-500 hover:text-rose-700 no-print"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Deduct outstanding checks */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="font-bold text-rose-800 flex items-center justify-between">
                  <span>يخصم (-): شيكات صادرة لم تقدم للصرف</span>
                  <span className="font-mono">-{totalOutstandingChecks.toLocaleString()}</span>
                </div>
                {outstandingChecks.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-slate-600 pr-3 text-[11px]">
                    <span>• {item.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{item.amount.toLocaleString()}</span>
                      <button
                        onClick={() => removeItem(item.id, 'check')}
                        className="text-rose-500 hover:text-rose-700 no-print"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adjusted Bank Balance Result */}
              <div className="pt-3 border-t-2 border-slate-300 flex items-center justify-between font-bold text-slate-900 bg-slate-50 p-2 rounded">
                <span>رصيد البنك المعدل والصحيح</span>
                <span className="font-mono text-sm">{adjustedBankBalance.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>

          {/* Side B: Starting with Book Balance */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 p-3 font-bold text-slate-900 border-b border-slate-200">
              ثانياً: التسوية بدءاً بالرصيد الدفتري (الأستاذ العام)
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-900">
                <span>الرصيد الدفتري بحساب ({selectedAccount?.code})</span>
                <span className="font-mono">{bookBalance.toLocaleString()} ج.م</span>
              </div>

              {/* Bank Charges */}
              <div className="space-y-1.5">
                <div className="font-bold text-rose-800 flex items-center justify-between">
                  <span>يخصم (-): مصروفات وعمولات بنكية لم تقيد</span>
                  <span className="font-mono">-{totalBankCharges.toLocaleString()}</span>
                </div>
                {bankAdjustments.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-slate-600 pr-3 text-[11px]">
                    <span>• {item.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{item.amount.toLocaleString()}</span>
                      <button
                        onClick={() => removeItem(item.id, 'charge')}
                        className="text-rose-500 hover:text-rose-700 no-print"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adjusted Book Balance Result */}
              <div className="pt-3 border-t-2 border-slate-300 flex items-center justify-between font-bold text-slate-900 bg-slate-50 p-2 rounded mt-8">
                <span>الرصيد الدفتري المعدل والمطابق</span>
                <span className="font-mono text-sm">{adjustedBookBalance.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auditor & Signatures Block */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <div className="font-bold text-slate-900">إعداد المحاسب المالي:</div>
            <div className="h-10 border-b border-slate-300"></div>
            <div className="text-[11px] text-slate-500">التوقيع والتاريخ: {statementDate}</div>
          </div>

          <div className="space-y-1 border border-slate-200 bg-slate-50 p-3 rounded-xl text-center">
            <div className="font-bold text-slate-900">اعتماد مراقب الحسابات والمحاسب القانوني</div>
            <div className="text-sky-800 font-extrabold">{auditorStatement.auditorName}</div>
            <div className="text-[11px] text-slate-600 font-mono">
              {auditorStatement.registerNumber || 'س.م.م 44887 - سجل المحاسبين والمراجعين'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
