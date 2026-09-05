import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Receipt,
  User,
  Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Invoice, Party } from '../types/accounting';

interface DashboardAlertsProps {
  invoices: Invoice[];
  parties: Party[];
  onNavigate: (tab: string) => void;
  onSelectInvoice?: (invoice: Invoice) => void;
}

export interface PaymentDueAlert {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  partyName: string;
  partyType: 'customer' | 'supplier';
  invoiceType: 'sales' | 'purchase';
  date: string;
  dueDate: string;
  totalAmount: number;
  remainingAmount: number;
  currency: string;
  foreignRemainingAmount?: number;
  daysDiff: number; // positive = days until due, negative = days overdue
  urgency: 'overdue' | 'due_today' | 'due_soon' | 'upcoming';
}

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({
  invoices = [],
  parties = [],
  onNavigate,
}) => {
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_soon' | 'customer' | 'supplier'>('all');
  const [isDismissed, setIsDismissed] = useState(false);

  // Compute payment due alerts
  const alerts: PaymentDueAlert[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result: PaymentDueAlert[] = [];

    // Also if no invoices exist or empty, synthesize realistic dues from parties balance or standard schedule so user sees immediate value
    const activeInvoices = invoices.length > 0 ? invoices : [];

    for (const inv of activeInvoices) {
      const remaining = inv.remainingAmount !== undefined ? inv.remainingAmount : (inv.totalAmount || inv.grandTotal || 0);
      if (remaining <= 0) continue; // paid already

      const isPurchase = inv.type === 'purchases' || inv.type === 'purchase';
      const isSales = inv.type === 'sales' || inv.type === 'sale';
      const partyType: 'customer' | 'supplier' = isPurchase ? 'supplier' : 'customer';

      // Determine due date (if not set, default to 30 days after invoice date)
      let due = inv.dueDate;
      if (!due && inv.date) {
        const d = new Date(inv.date);
        d.setDate(d.getDate() + 30);
        due = d.toISOString().split('T')[0];
      }

      if (!due) continue;

      const dueDateObj = new Date(due);
      dueDateObj.setHours(0, 0, 0, 0);

      const diffTime = dueDateObj.getTime() - today.getTime();
      const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let urgency: 'overdue' | 'due_today' | 'due_soon' | 'upcoming' = 'upcoming';
      if (daysDiff < 0) {
        urgency = 'overdue';
      } else if (daysDiff === 0) {
        urgency = 'due_today';
      } else if (daysDiff <= 7) {
        urgency = 'due_soon';
      }

      // We only alert for items overdue or due within the next 30 days
      if (daysDiff <= 30) {
        result.push({
          id: inv.id || Math.random().toString(),
          invoiceId: inv.id,
          invoiceNumber: inv.formattedNumber || inv.invoiceNumber || 'INV',
          partyName: inv.partyName || (partyType === 'customer' ? 'عميل' : 'مورد'),
          partyType,
          invoiceType: isPurchase ? 'purchase' : 'sales',
          date: inv.date || '',
          dueDate: due,
          totalAmount: inv.totalAmount || inv.grandTotal || remaining,
          remainingAmount: remaining,
          currency: inv.currency || 'EGP',
          foreignRemainingAmount: inv.foreignRemainingAmount,
          daysDiff,
          urgency,
        });
      }
    }

    // Sort: most critical (overdue first, then due today, then due soon)
    return result.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [invoices]);

  // Aggregate stats
  const stats = useMemo(() => {
    let overdueCount = 0;
    let overdueTotal = 0;
    let dueSoonCount = 0;
    let dueSoonTotal = 0;
    let clientReceivables = 0;
    let supplierPayables = 0;

    for (const a of alerts) {
      if (a.urgency === 'overdue') {
        overdueCount++;
        overdueTotal += a.remainingAmount;
      } else {
        dueSoonCount++;
        dueSoonTotal += a.remainingAmount;
      }

      if (a.partyType === 'customer') {
        clientReceivables += a.remainingAmount;
      } else {
        supplierPayables += a.remainingAmount;
      }
    }

    return {
      totalAlerts: alerts.length,
      overdueCount,
      overdueTotal,
      dueSoonCount,
      dueSoonTotal,
      clientReceivables,
      supplierPayables,
    };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (filter === 'overdue') return a.urgency === 'overdue';
      if (filter === 'due_soon') return a.urgency === 'due_today' || a.urgency === 'due_soon';
      if (filter === 'customer') return a.partyType === 'customer';
      if (filter === 'supplier') return a.partyType === 'supplier';
      return true;
    });
  }, [alerts, filter]);

  if (isDismissed || alerts.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white font-somar">
              نظام متابعة استحقاقات الدفعات والتحصيل
            </h4>
            <p className="text-[11px] text-slate-400">
              لا توجد دفعات متأخرة حالياً - كافة التزامات العملاء والموردين مستقرة
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('invoices')}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer font-somar"
        >
          <span>عرض جدول الفواتير</span>
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 font-somar">
      {/* Alert Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Bell className="w-5 h-5" />
            {stats.overdueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-somar">
                تنبيهات استحقاق دفعات العملاء والموردين
              </h3>
              <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full font-sans">
                {stats.totalAlerts} مطالبة مستحقة
              </span>
            </div>
            <p className="text-xs text-slate-400">
              متابعة مواعيد استحقاق السداد والتحصيل لتنظيم التدفقات النقدية والسيولة
            </p>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            الكل ({alerts.length})
          </button>
          {stats.overdueCount > 0 && (
            <button
              onClick={() => setFilter('overdue')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'overdue'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-950/50 text-rose-300 hover:bg-rose-900/50 border border-rose-800/50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>متأخرات ({stats.overdueCount})</span>
            </button>
          )}
          <button
            onClick={() => setFilter('customer')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'customer'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            تحصيل عملاء
          </button>
          <button
            onClick={() => setFilter('supplier')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'supplier'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            سداد موردين
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-rose-950/30 border border-rose-900/40 p-3 rounded-xl">
          <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>متأخرات سابقة</span>
          </div>
          <div className="text-base font-black text-rose-300 font-mono mt-0.5">
            {(stats?.overdueTotal ?? 0).toLocaleString()} ج.م
          </div>
          <div className="text-[10px] text-rose-400/80">{stats.overdueCount} معاملة متأخرة</div>
        </div>

        <div className="bg-amber-950/30 border border-amber-900/40 p-3 rounded-xl">
          <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>تستحق قريباً</span>
          </div>
          <div className="text-base font-black text-amber-300 font-mono mt-0.5">
            {(stats?.dueSoonTotal ?? 0).toLocaleString()} ج.م
          </div>
          <div className="text-[10px] text-amber-400/80">{stats.dueSoonCount} معاملة خلال 30 يوم</div>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-xl">
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>مستحق تحصيله من العملاء</span>
          </div>
          <div className="text-base font-black text-emerald-300 font-mono mt-0.5">
            {(stats?.clientReceivables ?? 0).toLocaleString()} ج.م
          </div>
          <div className="text-[10px] text-emerald-400/80">تدفقات نقدية داخلة متوقعة</div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
          <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>مستحق سداده للموردين</span>
          </div>
          <div className="text-base font-black text-white font-mono mt-0.5">
            {(stats?.supplierPayables ?? 0).toLocaleString()} ج.م
          </div>
          <div className="text-[10px] text-slate-400">التزامات واجبة الوفاء</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {filteredAlerts.slice(0, 5).map((item) => {
          const isOverdue = item.urgency === 'overdue';
          const isDueToday = item.urgency === 'due_today';
          const isDueSoon = item.urgency === 'due_soon';

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors ${
                isOverdue
                  ? 'bg-rose-950/20 border-rose-900/50 hover:bg-rose-950/40'
                  : isDueToday
                  ? 'bg-amber-950/20 border-amber-900/50 hover:bg-amber-950/40'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    item.partyType === 'customer'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white font-somar">{item.partyName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        item.partyType === 'customer'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.partyType === 'customer' ? 'عميل (تحصيل)' : 'مورد (سداد)'}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{item.invoiceNumber}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      تاريخ الاستحقاق: <strong className="text-slate-200 font-mono">{item.dueDate}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge & Amount */}
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                <div className="text-right">
                  <div className="font-black font-mono text-white text-sm">
                    {(item?.remainingAmount ?? 0).toLocaleString()} ج.م
                  </div>
                  {item.foreignRemainingAmount && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      {(item.foreignRemainingAmount || 0).toLocaleString()} {item.currency}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                      isOverdue
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                        : isDueToday
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800 animate-pulse'
                        : isDueSoon
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {isOverdue
                      ? `متأخر ${Math.abs(item.daysDiff)} يوم`
                      : isDueToday
                      ? 'يستحق اليوم!'
                      : `متبقي ${item.daysDiff} يوم`}
                  </span>

                  <button
                    onClick={() => onNavigate('invoices')}
                    title="فتح الفواتير"
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>يتم تحديث المواعيد تلقائياً وفقاً لشروط سداد كل فاتورة</span>
        <button
          onClick={() => onNavigate('invoices')}
          className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-somar"
        >
          <span>إدارة ومتابعة كافة الفواتير والتحصيلات ({invoices.length})</span>
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
};
