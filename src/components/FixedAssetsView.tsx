import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  Edit2,
  Eye,
  FileSpreadsheet,
  Filter,
  Layers,
  Percent,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { db } from '../services/db';
import { Account, JournalEntry } from '../types/accounting';
import { AssetCategory, DepreciationMethod, FixedAsset } from '../types/assets';
import { A4ReportViewerModal } from './A4ReportViewerModal';

interface FixedAssetsViewProps {
  accounts: Account[];
  onNavigateToJournal?: () => void;
}

export const FixedAssetsView: React.FC<FixedAssetsViewProps> = ({ accounts, onNavigateToJournal }) => {
  const [assets, setAssets] = useState<FixedAsset[]>(() => db.getFixedAssets());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<FixedAsset | null>(null);
  const [isA4PreviewOpen, setIsA4PreviewOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Depreciation Run Modal
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);
  const [depDate, setDepDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [depPeriodMonths, setDepPeriodMonths] = useState<number>(12);
  const [depPeriodNote, setDepPeriodNote] = useState<string>('إهلاك الأصول الثابتة السنوي');

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'computers' as AssetCategory,
    acquisitionDate: new Date().toISOString().split('T')[0],
    cost: 0,
    salvageValue: 0,
    depreciationMethod: 'straight_line' as DepreciationMethod,
    usefulLifeYears: 5,
    annualRate: 20,
    priorAccumulatedDepreciation: 0,
    assetAccountCode: '1113',
    expenseAccountCode: '423',
    accumulatedDepAccountCode: '1123',
    location: 'المقر الرئيسي',
    status: 'active' as 'active' | 'disposed' | 'maintenance',
    notes: '',
  });

  const refreshAssets = () => {
    setAssets(db.getFixedAssets());
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    return assets.filter((a) => {
      const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
      if (!matchCat) return false;
      if (!term) return true;
      return (
        a.code.toLowerCase().includes(term) ||
        a.name.toLowerCase().includes(term) ||
        (a.location && a.location.toLowerCase().includes(term))
      );
    });
  }, [assets, selectedCategory, searchTerm]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalCost = assets.reduce((s, a) => s + (a.cost || 0), 0);
    const totalAccum = assets.reduce((s, a) => s + (a.totalAccumulatedDepreciation || 0), 0);
    const totalNetBook = assets.reduce((s, a) => s + (a.netBookValue || 0), 0);

    // Calculate next planned annual depreciation
    const plannedAnnualDep = assets
      .filter((a) => a.status === 'active')
      .reduce((s, a) => s + db.calculateAssetDepreciation(a, 12).annualDepreciation, 0);

    return { totalCost, totalAccum, totalNetBook, totalBookValue: totalNetBook, plannedAnnualDep, count: assets.length };
  }, [assets]);

  // Open Add Modal
  const handleOpenAdd = () => {
    const nextNum = assets.length + 1;
    const suggestedCode = `AST-${String(nextNum).padStart(3, '0')}`;
    setFormData({
      code: suggestedCode,
      name: '',
      category: 'computers',
      acquisitionDate: new Date().toISOString().split('T')[0],
      cost: 0,
      salvageValue: 0,
      depreciationMethod: 'straight_line',
      usefulLifeYears: 5,
      annualRate: 20,
      priorAccumulatedDepreciation: 0,
      assetAccountCode: '1113',
      expenseAccountCode: '423',
      accumulatedDepAccountCode: '1123',
      location: 'المقر الرئيسي - الإدارة',
      status: 'active',
      notes: '',
    });
    setEditingAsset(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (asset: FixedAsset) => {
    setFormData({
      code: asset.code,
      name: asset.name,
      category: asset.category,
      acquisitionDate: asset.acquisitionDate,
      cost: asset.cost,
      salvageValue: asset.salvageValue,
      depreciationMethod: asset.depreciationMethod,
      usefulLifeYears: asset.usefulLifeYears,
      annualRate: asset.annualRate,
      priorAccumulatedDepreciation: asset.priorAccumulatedDepreciation,
      assetAccountCode: asset.assetAccountCode,
      expenseAccountCode: asset.expenseAccountCode,
      accumulatedDepAccountCode: asset.accumulatedDepAccountCode,
      location: asset.location || '',
      status: asset.status,
      notes: asset.notes || '',
    });
    setEditingAsset(asset);
    setIsAddModalOpen(true);
  };

  // Save Asset
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || formData.cost <= 0) {
      setNotification({ type: 'error', message: 'يرجى إدخال اسم الأصل ورقمه وتكلفة الشراء الصحيحة' });
      return;
    }

    if (editingAsset) {
      db.updateFixedAsset({
        ...editingAsset,
        ...formData,
      });
      setNotification({ type: 'success', message: 'تم تحديث بيانات الأصل بنجاح' });
    } else {
      if (assets.some((a) => a.code === formData.code)) {
        setNotification({ type: 'error', message: 'كود الأصل مستخدم مسبقاً، يرجى اختيار كود آخر' });
        return;
      }

      db.addFixedAsset({
        ...formData,
        currentPeriodDepreciation: 0,
        totalAccumulatedDepreciation: formData.priorAccumulatedDepreciation,
        netBookValue: Math.max(0, formData.cost - formData.priorAccumulatedDepreciation),
      });
      setNotification({ type: 'success', message: 'تمت إضافة الأصل الثابت بنجاح' });
    }

    refreshAssets();
    setIsAddModalOpen(false);
    setTimeout(() => setNotification(null), 4000);
  };

  // Delete Asset
  const handleDeleteAsset = (asset: FixedAsset) => {
    setAssetToDelete(asset);
  };

  const confirmDeleteAsset = () => {
    if (!assetToDelete) return;
    const res = db.deleteFixedAsset(assetToDelete.id);
    if (res.success) {
      setNotification({ type: 'success', message: res.message });
      refreshAssets();
    } else {
      setNotification({ type: 'error', message: res.message });
    }
    setAssetToDelete(null);
    setTimeout(() => setNotification(null), 4000);
  };

  // Run Automated Depreciation Calculation & Post Journal Entry
  const handleExecuteDepreciation = () => {
    const res = db.generateDepreciationJournalEntry(depDate, undefined, depPeriodNote, depPeriodMonths);
    if (res.success) {
      setNotification({
        type: 'success',
        message: `${res.message} - تم تسجيل وترحيل القيد آلياً في دفتر اليومية العامة.`,
      });
      refreshAssets();
      setIsDepModalOpen(false);
    } else {
      setNotification({ type: 'error', message: res.message });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white font-somar">
                  إدارة الأصول الثابتة وحساب الإهلاكات الدورية
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  {assets.length} أصل مسجل
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                تتبع التكلفة التاريخية، مجمعات الإهلاك، حساب أقساط الإهلاك (قسط ثابت / متناقص) وتوليد القيود آلياً
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 no-print">
          <button
            onClick={() => setIsA4PreviewOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95 border border-emerald-400/30"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة تقرير الأصول A4</span>
          </button>

          <button
            onClick={() => setIsDepModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-950/40 cursor-pointer transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>حساب وتوليد قيد الإهلاك آلياً</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>إضافة أصل ثابت جديد</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 shadow-lg shadow-emerald-950/20'
              : 'bg-rose-950/40 text-rose-300 border-rose-800/80 shadow-lg shadow-rose-950/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white px-2">
            ✕
          </button>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Historical Cost */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold font-somar">إجمالي التكلفة التاريخية للأصول</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-black text-white font-mono">
            {(stats?.totalCost ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-400 font-somar mt-2">
            تكلفة شراء واقتناء الأصول الثابتة
          </div>
        </div>

        {/* Total Accumulated Depreciation */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold font-somar">إجمالي مجمع الإهلاك المتراكم</span>
            <ArrowDownRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-black text-amber-400 font-mono">
            {(stats?.totalAccum ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-400 font-somar mt-2">
            نسبة الإهلاك: {(stats?.totalCost ?? 0) > 0 ? (((stats?.totalAccum ?? 0) / stats.totalCost) * 100).toFixed(1) : 0}% من التكلفة
          </div>
        </div>

        {/* Net Book Value */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold font-somar">صافي القيمة الدفترية الحالية</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 text-2xl font-black text-cyan-400 font-mono">
            {(stats?.totalNetBook ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-400 font-somar mt-2">
            المدرجة بالمركز المالي (التكلفة - مجمع الإهلاك)
          </div>
        </div>

        {/* Planned Periodic Depreciation */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold font-somar">قسط الإهلاك السنوي المخطط</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 text-2xl font-black text-indigo-400 font-mono">
            {(stats?.plannedAnnualDep ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-400 font-somar mt-2">
            المصروف التقديري السنوي لكافة الأصول النشطة
          </div>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            كافة الفئات ({assets.length})
          </button>
          <button
            onClick={() => setSelectedCategory('computers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'computers'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-xs'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            💻 أجهزة وحواسب
          </button>
          <button
            onClick={() => setSelectedCategory('furniture')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'furniture'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 shadow-xs'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🪑 أثاث وتجهيزات
          </button>
          <button
            onClick={() => setSelectedCategory('vehicles')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'vehicles'
                ? 'bg-amber-950 text-amber-300 border border-amber-700 shadow-xs'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🚗 سيارات ونقل
          </button>
          <button
            onClick={() => setSelectedCategory('machinery')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'machinery'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-xs'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            ⚙️ آلات ومعدات
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بكود أو اسم الأصل أو الموقع..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-somar"
          />
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 text-[11px] font-bold font-somar">
                <th className="py-3.5 px-4 w-28">كود الأصل</th>
                <th className="py-3.5 px-4">اسم الأصل والبيانات الوصفية</th>
                <th className="py-3.5 px-4 text-center">تاريخ الاستحواذ</th>
                <th className="py-3.5 px-4 text-left">التكلفة التاريخية</th>
                <th className="py-3.5 px-4 text-center">طريقة الإهلاك والنسبة</th>
                <th className="py-3.5 px-4 text-left text-amber-400">مجمع الإهلاك</th>
                <th className="py-3.5 px-4 text-left text-cyan-400">صافي القيمة الدفترية</th>
                <th className="py-3.5 px-4 text-center w-28 no-print">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-somar">
                    لا توجد أصول مطابقة لمعايير البحث المحددة
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const { annualDepreciation } = db.calculateAssetDepreciation(asset, 12);

                  return (
                    <tr key={asset.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-emerald-400 border border-slate-800">
                          {asset.code}
                        </span>
                      </td>

                      {/* Name and Location */}
                      <td className="py-3.5 px-4 font-somar">
                        <div className="font-extrabold text-white text-xs">{asset.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>📍 {asset.location || 'المقر الرئيسي'}</span>
                          {asset.notes && <span>• {asset.notes}</span>}
                        </div>
                      </td>

                      {/* Acquisition Date */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300 text-[11px]">
                        {asset.acquisitionDate}
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-4 text-left font-mono font-bold text-white">
                        {(asset?.cost ?? 0).toLocaleString()} ج.م
                      </td>

                      {/* Method & Rate */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            asset.depreciationMethod === 'straight_line'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          } font-somar`}
                        >
                          {asset.depreciationMethod === 'straight_line' ? 'قسط ثابت' : 'قسط متناقص'} ({asset.annualRate}%)
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          العمر: {asset.usefulLifeYears} سنوات | قسط سنوي: {(annualDepreciation ?? 0).toLocaleString()} ج.م
                        </div>
                      </td>

                      {/* Accumulated Depreciation */}
                      <td className="py-3.5 px-4 text-left font-mono font-bold text-amber-400">
                        {(asset.totalAccumulatedDepreciation || 0).toLocaleString()} ج.م
                      </td>

                      {/* Net Book Value */}
                      <td className="py-3.5 px-4 text-left font-mono font-black text-cyan-400">
                        {(asset.netBookValue || 0).toLocaleString()} ج.م
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(asset)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all cursor-pointer"
                            title="تعديل الأصل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-all cursor-pointer"
                            title="حذف الأصل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUTOMATED DEPRECIATION RUN MODAL */}
      {isDepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-indigo-950 to-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white text-base font-somar flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-300" />
                توليد وترحيل قيد إهلاك الأصول آلياً لليومية
              </h3>
              <button
                onClick={() => setIsDepModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-somar">
                سيقوم النظام باحتساب أقساط الإهلاك بدقة لكافة الأصول النشطة ({assets.filter((a) => a.status === 'active').length} أصل) بناءً على طريقة الإهلاك المحددة (قسط ثابت أو متناقص)، ثم إنشاء وترحيل قيد اليومية المتوازن آلياً:
                <div className="font-mono text-emerald-400 mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  من حـ/ مصروف إهلاك الأصول الثابتة (423) <br />
                  &nbsp;&nbsp;إلى حـ/ مجمع إهلاك الأصول الثابتة (1123)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    تاريخ القيد المالي *
                  </label>
                  <input
                    type="date"
                    value={depDate}
                    onChange={(e) => setDepDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    الفترة المالية المحتسبة *
                  </label>
                  <select
                    value={depPeriodMonths}
                    onChange={(e) => setDepPeriodMonths(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-somar"
                  >
                    <option value={12}>سنة كاملة (12 شهراً)</option>
                    <option value={6}>نصف سنوي (6 أشهر)</option>
                    <option value={3}>ربع سنوي (3 أشهر)</option>
                    <option value={1}>شهري (شهر واحد)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                  بيان وشرح القيد باليومية *
                </label>
                <input
                  type="text"
                  value={depPeriodNote}
                  onChange={(e) => setDepPeriodNote(e.target.value)}
                  placeholder="مثال: إهلاك الأصول الثابتة عن الفترة المالية المنتهية في..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-somar"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-somar">إجمالي قيمة القيد المتوقعة:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {(stats?.plannedAnnualDep ?? 0).toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDepModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDepreciation}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/40 cursor-pointer transition-all active:scale-95"
                >
                  تأكيد وتوليد القيد الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FIXED ASSET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white text-base font-somar flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                {editingAsset ? 'تعديل بيانات الأصل الثابت' : 'تسجيل أصل ثابت جديد'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    كود الأصل *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="AST-001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    تصنيف وفئة الأصل *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value as AssetCategory;
                      let rate = 20;
                      let life = 5;
                      let accCode = '1113';

                      if (cat === 'computers') {
                        rate = 20;
                        life = 5;
                        accCode = '1113';
                      } else if (cat === 'vehicles') {
                        rate = 20;
                        life = 5;
                        accCode = '1112';
                      } else if (cat === 'machinery') {
                        rate = 10;
                        life = 10;
                        accCode = '1114';
                      } else if (cat === 'buildings') {
                        rate = 5;
                        life = 20;
                        accCode = '1111';
                      } else if (cat === 'furniture') {
                        rate = 10;
                        life = 10;
                        accCode = '1115';
                      }

                      setFormData({
                        ...formData,
                        category: cat,
                        annualRate: rate,
                        usefulLifeYears: life,
                        assetAccountCode: accCode,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                  >
                    <option value="computers">💻 أجهزة وحواسب وخوادم</option>
                    <option value="furniture">🪑 أثاث ومعدات مكتبية</option>
                    <option value="vehicles">🚗 سيارات ووسائل نقل</option>
                    <option value="machinery">⚙️ آلات وتجهيزات تشغيلية</option>
                    <option value="buildings">🏢 مباني وإنشاءات</option>
                    <option value="tools">🔧 عدد وأدوات</option>
                  </select>
                </div>

                {/* Acquisition Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    تاريخ الاستحواذ / الشراء *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.acquisitionDate}
                    onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                  اسم ووصف الأصل الثابت *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: خادم رئيسي Dell PowerEdge R750 مع وحدات تخزين"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cost */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    تكلفة الشراء التاريخية (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Salvage Value */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    القيمة التخريدية المتوقعة (ج.م)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.salvageValue}
                    onChange={(e) => setFormData({ ...formData, salvageValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Prior Accumulated Depreciation */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    مجمع الإهلاك السابق (ج.م)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.priorAccumulatedDepreciation}
                    onChange={(e) =>
                      setFormData({ ...formData, priorAccumulatedDepreciation: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Depreciation Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    طريقة احتساب الإهلاك *
                  </label>
                  <select
                    value={formData.depreciationMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, depreciationMethod: e.target.value as DepreciationMethod })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                  >
                    <option value="straight_line">القسط الثابت (Straight-Line)</option>
                    <option value="declining_balance">القسط المتناقص (Declining Balance)</option>
                    <option value="double_declining">القسط المتناقص المضاعف (200% DB)</option>
                  </select>
                </div>

                {/* Useful Life */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    العمر الإنتاجي التقديري (سنوات)
                  </label>
                  <input
                    type="number"
                    value={formData.usefulLifeYears}
                    onChange={(e) => {
                      const life = parseInt(e.target.value, 10) || 5;
                      setFormData({
                        ...formData,
                        usefulLifeYears: life,
                        annualRate: life > 0 ? Math.round((100 / life) * 10) / 10 : 20,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Annual Rate */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    نسبة الإهلاك السنوية (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.annualRate}
                    onChange={(e) => setFormData({ ...formData, annualRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Asset Account */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    حساب الأصل بدليل الحسابات
                  </label>
                  <select
                    value={formData.assetAccountCode}
                    onChange={(e) => setFormData({ ...formData, assetAccountCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                  >
                    <option value="1113">1113 - أجهزة حواسب وبرامج</option>
                    <option value="1112">1112 - سيارات ووسائل نقل</option>
                    <option value="1114">1114 - آلات ومعدات تشغيل</option>
                    <option value="1111">1111 - مباني وإنشاءات</option>
                    <option value="1115">1115 - أثاث ومعدات مكتبية</option>
                  </select>
                </div>

                {/* Expense Account */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    حساب مصروف الإهلاك (مدين)
                  </label>
                  <select
                    value={formData.expenseAccountCode}
                    onChange={(e) => setFormData({ ...formData, expenseAccountCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                  >
                    <option value="423">423 - مصروف إهلاك الأصول الثابتة</option>
                    <option value="421">421 - مصروفات إدارية وعمومية</option>
                  </select>
                </div>

                {/* Accumulated Dep Account */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    حساب مجمع الإهلاك (دائن)
                  </label>
                  <select
                    value={formData.accumulatedDepAccountCode}
                    onChange={(e) => setFormData({ ...formData, accumulatedDepAccountCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                  >
                    <option value="1123">1123 - مجمع إهلاك الأجهزة والمعدات</option>
                    <option value="1121">1121 - مجمع إهلاك المباني</option>
                    <option value="1122">1122 - مجمع إهلاك السيارات</option>
                  </select>
                </div>
              </div>

              {/* Location & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    موقع وجود الأصل / القسم
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="مثال: الفرع الرئيسي - غرفة الخوادم"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    حالة الأصل التشغيلية
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'active' | 'disposed' | 'maintenance' })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                  >
                    <option value="active">نشط بالخدمة (يحسب له إهلاك)</option>
                    <option value="maintenance">تحت الصيانة</option>
                    <option value="disposed">مستبعد / تم بيعه وتخريده</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer transition-all"
                >
                  {editingAsset ? 'حفظ التعديلات' : 'تسجيل الأصل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {assetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-somar">تأكيد استبعاد وحذف الأصل الثابت</h3>
                <p className="text-xs text-slate-400">حذف نهائي من سجل الأصول وإهلاكاتها</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <p>
                هل أنت متأكد من رغبتك في حذف الأصل الثابت التالي نهائياً؟
              </p>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                <div className="font-bold text-white text-sm">{assetToDelete.name}</div>
                <div className="text-emerald-400 font-mono text-[11px] mt-0.5">
                  كود: {assetToDelete.code} | التكلفة: {(assetToDelete?.cost ?? 0).toLocaleString('ar-EG')} ج.م
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAssetToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={confirmDeleteAsset}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف الأصل الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A4 Report Viewer Modal for Fixed Assets Register */}
      <A4ReportViewerModal
        isOpen={isA4PreviewOpen}
        onClose={() => setIsA4PreviewOpen(false)}
        reportTitle="تقرير سجل الأصول الثابتة وحساب الإهلاكات"
        reportSubtitle="كشف تحليلي تفصيلي للتكلفة التاريخية ومجمعات الإهلاك وصافي القيمة الدفترية"
        reportCode="FA-REP-2026"
        fiscalYear="2026"
        companyProfile={db.getCompanyProfile()}
        auditorStatement={db.getAuditorStatement()}
        legalNotice="تم جرد واحتساب إهلاكات الأصول الثابتة طبقاً لمعيار المحاسبة المصري رقم (10) الخاص بالأصول الثابتة وإهلاكاتها والقوانين واللوائح الضريبية المعمول بها."
      >
        <div className="space-y-4">
          {/* Summary Cards in A4 */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="border border-zinc-300 p-2.5 rounded-lg bg-zinc-50">
              <div className="text-[10px] text-zinc-500 font-bold">إجمالي التكلفة التاريخية</div>
              <div className="text-sm font-black text-zinc-900 font-mono mt-0.5">{(stats?.totalCost ?? 0).toLocaleString('ar-EG')} ج.م</div>
            </div>
            <div className="border border-zinc-300 p-2.5 rounded-lg bg-zinc-50">
              <div className="text-[10px] text-zinc-500 font-bold">إجمالي مجمع الإهلاك</div>
              <div className="text-sm font-black text-amber-800 font-mono mt-0.5">{(stats?.totalAccum ?? 0).toLocaleString('ar-EG')} ج.م</div>
            </div>
            <div className="border border-zinc-300 p-2.5 rounded-lg bg-zinc-50">
              <div className="text-[10px] text-zinc-500 font-bold">صافي القيمة الدفترية</div>
              <div className="text-sm font-black text-emerald-800 font-mono mt-0.5">{(stats?.totalBookValue ?? stats?.totalNetBook ?? 0).toLocaleString('ar-EG')} ج.م</div>
            </div>
          </div>

          {/* Assets Table */}
          <div className="border border-zinc-300 rounded-lg overflow-hidden">
            <table className="w-full text-right border-collapse text-[10px]">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-300 font-black text-zinc-800">
                  <th className="py-2 px-2.5 w-16">الكود</th>
                  <th className="py-2 px-2.5">اسم الأصل والموقع</th>
                  <th className="py-2 px-2.5 text-center">تاريخ الشراء</th>
                  <th className="py-2 px-2.5 text-left">التكلفة التاريخية</th>
                  <th className="py-2 px-2.5 text-center">طريقة ونسبة الإهلاك</th>
                  <th className="py-2 px-2.5 text-left text-amber-900">مجمع الإهلاك</th>
                  <th className="py-2 px-2.5 text-left text-emerald-900">القيمة الدفترية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {assets.map((a) => {
                  const bookVal = Math.max(0, (a.cost || 0) - (a.priorAccumulatedDepreciation || 0));
                  return (
                    <tr key={a.id} className="hover:bg-zinc-50">
                      <td className="py-2 px-2.5 font-mono font-bold">{a.code}</td>
                      <td className="py-2 px-2.5">
                        <div className="font-bold text-zinc-900">{a.name}</div>
                        <div className="text-[9px] text-zinc-500">{a.location || 'المقر الرئيسي'}</div>
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono">{a.acquisitionDate}</td>
                      <td className="py-2 px-2.5 text-left font-mono font-bold">{(a.cost || 0).toLocaleString('ar-EG')}</td>
                      <td className="py-2 px-2.5 text-center">
                        <div>{a.depreciationMethod === 'straight_line' ? 'قسط ثابت' : 'قسط متناقص'}</div>
                        <div className="text-[9px] text-zinc-500 font-mono">{a.annualRate}% سنوياً</div>
                      </td>
                      <td className="py-2 px-2.5 text-left font-mono text-amber-800">{(a.priorAccumulatedDepreciation || 0).toLocaleString('ar-EG')}</td>
                      <td className="py-2 px-2.5 text-left font-mono font-bold text-emerald-900">{(bookVal || 0).toLocaleString('ar-EG')}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-200 font-black border-t-2 border-zinc-400 text-zinc-900">
                  <td colSpan={3} className="py-2.5 px-2.5 text-right">الإجمالي العام لسجل الأصول ({assets.length} أصل)</td>
                  <td className="py-2.5 px-2.5 text-left font-mono">{(stats?.totalCost ?? 0).toLocaleString('ar-EG')}</td>
                  <td></td>
                  <td className="py-2.5 px-2.5 text-left font-mono text-amber-900">{(stats?.totalAccum ?? 0).toLocaleString('ar-EG')}</td>
                  <td className="py-2.5 px-2.5 text-left font-mono text-emerald-900">{(stats?.totalBookValue ?? stats?.totalNetBook ?? 0).toLocaleString('ar-EG')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </A4ReportViewerModal>
    </div>
  );
};
