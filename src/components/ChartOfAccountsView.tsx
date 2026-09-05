import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CornerDownLeft,
  Edit2,
  FileSpreadsheet,
  Filter,
  Folder,
  FolderOpen,
  FolderTree,
  Layers,
  Plus,
  Printer,
  Search,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle
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

interface FlattenedAccountNode {
  account: Account;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  childCount: number;
  calculatedBalance: number;
  displayParentCode?: string | null;
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
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');

  // Set of expanded account codes
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    accounts.forEach((a) => {
      // Default expand levels 1, 2 and 3
      if (a.type === 'main' || a.level <= 3) {
        initial.add(a.code);
      }
    });
    return initial;
  });

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

  // Toggle single branch
  const toggleExpand = (code: string) => {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Expand all parent nodes
  const expandAll = () => {
    const allParents = new Set(accounts.map((a) => a.code));
    setExpandedCodes(allParents);
  };

  // Collapse all
  const collapseAll = () => {
    setExpandedCodes(new Set());
  };

  // Build Children Map & Robust Parent-Child Relationships
  const { childrenMap, parentMap, allAccountsMap, normalizedAccounts } = useMemo(() => {
    const aMap = new Map<string, Account>();
    const pMap = new Map<string, string>();
    const cMap = new Map<string, Account[]>();

    // Index all accounts by code
    accounts.forEach((acc) => {
      aMap.set(acc.code, acc);
    });

    // Normalize each account and ensure effective parentCode
    const normList = accounts.map((acc) => {
      let effParent = acc.parentCode;

      // If parentCode is not explicitly set or not found in map, find the longest matching prefix
      if (!effParent || !aMap.has(effParent)) {
        let bestMatch = '';
        for (let i = acc.code.length - 1; i >= 1; i--) {
          const prefix = acc.code.substring(0, i);
          if (aMap.has(prefix)) {
            bestMatch = prefix;
            break;
          }
        }
        effParent = bestMatch || null;
      }

      if (effParent && effParent !== acc.code) {
        pMap.set(acc.code, effParent);
      }

      return {
        ...acc,
        effectiveParentCode: effParent,
      };
    });

    normList.forEach((acc) => {
      const parent = acc.effectiveParentCode;
      if (parent && parent !== acc.code) {
        const list = cMap.get(parent) || [];
        list.push(acc);
        cMap.set(parent, list);
      }
    });

    // Sort each children array numerically by code
    cMap.forEach((children) => {
      children.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    });

    return { childrenMap: cMap, parentMap: pMap, allAccountsMap: aMap, normalizedAccounts: normList };
  }, [accounts]);

  // Compute roll-up balance for any account (recursively summing child sub-accounts)
  const computeRollupBalance = useMemo(() => {
    const cache = new Map<string, number>();

    const getBalance = (acc: Account): number => {
      if (cache.has(acc.code)) return cache.get(acc.code)!;

      const children = childrenMap.get(acc.code) || [];
      if (children.length === 0) {
        const bal = acc.currentBalance !== undefined ? acc.currentBalance : acc.openingBalance || 0;
        cache.set(acc.code, bal);
        return bal;
      }

      const sum = children.reduce((accSum, child) => accSum + getBalance(child), 0);
      cache.set(acc.code, sum);
      return sum;
    };

    return getBalance;
  }, [accounts, childrenMap]);

  // Hierarchical Tree Flattening (DFS traversal to guarantee direct branch hierarchy)
  const hierarchicalAccounts = useMemo(() => {
    const searchLower = (searchTerm || '').toLowerCase().trim();

    // Identify roots based on normalized effective parent
    const isCategoryFiltered = selectedCategory !== 'all';

    const roots = normalizedAccounts
      .filter((a) => {
        if (isCategoryFiltered) {
          if (a.category !== selectedCategory) return false;
          // If parent also belongs to this category, it's not a root of this category view
          const parent = a.effectiveParentCode ? allAccountsMap.get(a.effectiveParentCode) : null;
          return !parent || parent.category !== selectedCategory;
        }
        return !a.effectiveParentCode || !allAccountsMap.has(a.effectiveParentCode);
      })
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

    // If searching, identify matching codes and their ancestor chains
    const matchingCodes = new Set<string>();
    const ancestorCodesToExpand = new Set<string>();

    if (searchLower) {
      accounts.forEach((acc) => {
        const match =
          (acc.code || '').toLowerCase().includes(searchLower) ||
          (acc.name || '').toLowerCase().includes(searchLower) ||
          (acc.englishName || '').toLowerCase().includes(searchLower);

        if (match) {
          matchingCodes.add(acc.code);
          // Walk up to find all ancestors
          let curP = parentMap.get(acc.code);
          while (curP) {
            ancestorCodesToExpand.add(curP);
            curP = parentMap.get(curP);
          }
        }
      });
    }

    const result: FlattenedAccountNode[] = [];
    const visited = new Set<string>();

    // Recursive DFS tree visitor
    const traverse = (node: Account, depth: number) => {
      if (visited.has(node.code)) return;
      visited.add(node.code);

      const children = childrenMap.get(node.code) || [];
      const hasChildren = children.length > 0;
      const isSearching = searchLower.length > 0;

      // In search mode, expand matching ancestor paths automatically
      const isExpanded = isSearching
        ? ancestorCodesToExpand.has(node.code) || expandedCodes.has(node.code)
        : expandedCodes.has(node.code);

      // Filter check in search mode
      const isSelfMatch = matchingCodes.has(node.code);
      const isAncestorOfMatch = ancestorCodesToExpand.has(node.code);
      const shouldInclude = !isSearching || isSelfMatch || isAncestorOfMatch;

      if (shouldInclude) {
        result.push({
          account: node,
          depth,
          hasChildren,
          isExpanded,
          childCount: children.length,
          calculatedBalance: computeRollupBalance(node),
          displayParentCode: parentMap.get(node.code) || null,
        });
      }

      // If node is expanded or we are searching down a matched path, visit direct children
      if (hasChildren && (isExpanded || isSearching)) {
        children.forEach((child) => {
          traverse(child, depth + 1);
        });
      }
    };

    roots.forEach((root) => traverse(root, 0));
    return result;
  }, [accounts, normalizedAccounts, selectedCategory, searchTerm, expandedCodes, childrenMap, allAccountsMap, parentMap, computeRollupBalance]);

  // Flat mode view
  const flatAccounts = useMemo(() => {
    const searchLower = (searchTerm || '').toLowerCase().trim();
    return accounts
      .filter((acc) => {
        const matchCat = selectedCategory === 'all' || acc.category === selectedCategory;
        if (!matchCat) return false;
        if (!searchLower) return true;
        return (
          (acc.code || '').toLowerCase().includes(searchLower) ||
          (acc.name || '').toLowerCase().includes(searchLower) ||
          (acc.englishName || '').toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [accounts, selectedCategory, searchTerm]);

  // Open Add modal pre-populated for a sub-account under a given parent
  const handleOpenAdd = (parentAcc?: Account) => {
    let suggestedCode = '';
    let category: AccountCategory = parentAcc ? parentAcc.category : 'assets';
    let parentCode = parentAcc ? parentAcc.code : '';
    let nature: AccountNature = parentAcc ? parentAcc.nature : 'debit';

    if (parentAcc) {
      const siblings = accounts.filter((a) => a.parentCode === parentAcc.code || a.code.startsWith(parentAcc.code) && a.code.length === parentAcc.code.length + 1);
      if (siblings.length === 0) {
        suggestedCode = `${parentAcc.code}1`;
      } else {
        const numbers = siblings
          .map((s) => parseInt(s.code.replace(parentAcc.code, ''), 10))
          .filter((n) => !isNaN(n));
        const maxNum = numbers.length > 0 ? Math.max(...numbers) : siblings.length;
        suggestedCode = `${parentAcc.code}${maxNum + 1}`;
      }
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
      parentCode: acc.parentCode || parentMap.get(acc.code) || '',
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

      // Auto expand the parent so the new child is immediately visible
      if (formData.parentCode) {
        setExpandedCodes((prev) => new Set([...prev, formData.parentCode]));
      }

      setNotification({ type: 'success', message: 'تمت إضافة الحساب الجديد بنجاح في الشجرة المحاسبية' });
    }

    setIsAddModalOpen(false);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDelete = (acc: Account) => {
    const hasChildren = (childrenMap.get(acc.code) || []).length > 0;
    if (hasChildren) {
      alert(`لا يمكن حذف الحساب "${acc.name}" (${acc.code}) لأنه يحتوي على حسابات فرعية متفرعة تحته.`);
      return;
    }

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

  // Category counts
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {
      assets: 0,
      liabilities: 0,
      equity: 0,
      revenue: 0,
      expense: 0,
    };
    accounts.forEach((a) => {
      if (stats[a.category] !== undefined) {
        stats[a.category]++;
      }
    });
    return stats;
  }, [accounts]);

  return (
    <div className="space-y-6 font-somar">
      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-somar flex items-center gap-2">
                دليل الحسابات
                <span className="text-xs bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-full font-mono border border-slate-700">
                  {accounts.length} حساب
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                شجرة الحسابات المحاسبية المعتمدة وتجميع الأرصدة آلياً
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حساب رئيسي / فرعي</span>
          </button>

          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              عرض شجري هرمي
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'flat'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              عرض جدول مسطح
            </button>
          </div>

          {viewMode === 'tree' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={expandAll}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 font-medium cursor-pointer transition-colors"
                title="توسيع كافة المستويات والحسابات"
              >
                توسيع الكل
              </button>
              <button
                onClick={collapseAll}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 font-medium cursor-pointer transition-colors"
                title="طي الكل للمستوى الأول"
              >
                طي الكل
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Navigation Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-800 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <div className="text-[11px] text-slate-400 font-somar">كافة الحسابات</div>
          <div className="text-base font-black text-white font-mono mt-0.5">{accounts.length}</div>
        </button>

        <button
          onClick={() => setSelectedCategory('assets')}
          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
            selectedCategory === 'assets'
              ? 'bg-slate-800 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <div className="text-[11px] text-emerald-400 font-somar">1 - الأصول (Assets)</div>
          <div className="text-base font-black text-white font-mono mt-0.5">{categoryStats.assets}</div>
        </button>

        <button
          onClick={() => setSelectedCategory('liabilities')}
          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
            selectedCategory === 'liabilities'
              ? 'bg-slate-800 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <div className="text-[11px] text-amber-400 font-somar">2 - الالتزامات (Liabilities)</div>
          <div className="text-base font-black text-white font-mono mt-0.5">{categoryStats.liabilities}</div>
        </button>

        <button
          onClick={() => setSelectedCategory('equity')}
          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
            selectedCategory === 'equity'
              ? 'bg-slate-800 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <div className="text-[11px] text-indigo-400 font-somar">21 - حقوق الملكية (Equity)</div>
          <div className="text-base font-black text-white font-mono mt-0.5">{categoryStats.equity}</div>
        </button>

        <button
          onClick={() => setSelectedCategory('revenue')}
          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
            selectedCategory === 'revenue'
              ? 'bg-slate-800 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <div className="text-[11px] text-cyan-400 font-somar">3 - الإيرادات (Revenues)</div>
          <div className="text-base font-black text-white font-mono mt-0.5">{categoryStats.revenue}</div>
        </button>

        <button
          onClick={() => setSelectedCategory('expense')}
          className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
            selectedCategory === 'expense'
              ? 'bg-slate-800 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          <div className="text-[11px] text-rose-400 font-somar">4 - المصروفات (Expenses)</div>
          <div className="text-base font-black text-white font-mono mt-0.5">{categoryStats.expense}</div>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
              : 'bg-rose-950/40 text-rose-300 border-rose-800/80'
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white cursor-pointer px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث فوري برقم الحساب أو اسم الحساب (مثال: 1113 أو الآلات أو الخزينة أو البنك الأهلي)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-somar"
          />
        </div>
      </div>

      {/* Accounts Tree / List View */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] font-bold font-somar">
                <th className="py-3.5 px-4 w-36">رقم الحساب</th>
                <th className="py-3.5 px-4">اسم الحساب المحاسبي والتفرع الشجري</th>
                <th className="py-3.5 px-4 w-28 text-center">النوع</th>
                <th className="py-3.5 px-4 w-28 text-center">طبيعة الحساب</th>
                <th className="py-3.5 px-4 w-36 text-left">الرصيد التجميعي / الحالي</th>
                <th className="py-3.5 px-4 w-44 text-center no-print">الإجراءات والتفريع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {viewMode === 'tree' ? (
                hierarchicalAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-somar">
                      لا توجد حسابات مطابقة لمعايير البحث أو التصنيف المحدد
                    </td>
                  </tr>
                ) : (
                  hierarchicalAccounts.map((node) => {
                    const acc = node.account;
                    const isMain = acc.type === 'main' || node.hasChildren;
                    const indentPx = node.depth * 24;

                    return (
                      <tr
                        key={acc.id || acc.code}
                        className={`transition-colors group ${
                          isMain
                            ? 'bg-slate-900/95 font-bold text-white hover:bg-slate-800/90'
                            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                        } ${acc.level === 1 ? 'border-t-2 border-slate-800/80 bg-slate-950/60' : ''}`}
                      >
                        {/* Account Code */}
                        <td className="py-3 px-4 font-mono font-black text-slate-200">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md ${
                              isMain
                                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                                : 'text-slate-300 bg-slate-950/50'
                            }`}
                          >
                            {acc.code}
                          </span>
                        </td>

                        {/* Name with Tree Indentation, Visual Branch Connectors & Expand Toggle */}
                        <td className="py-3 px-4">
                          <div
                            className="flex items-center gap-2 relative"
                            style={{ paddingRight: `${indentPx}px` }}
                          >
                            {/* Branch Connector lines visual guide */}
                            {node.depth > 0 && (
                              <span className="text-emerald-500/50 font-mono text-xs select-none pl-1">
                                └─
                              </span>
                            )}

                            {/* Toggle Button for Accounts with children */}
                            {node.hasChildren ? (
                              <button
                                onClick={() => toggleExpand(acc.code)}
                                className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                                title={node.isExpanded ? 'طي الحساب' : 'توسيع الحساب الفرعي'}
                              >
                                {node.isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                                {node.isExpanded ? (
                                  <FolderOpen className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Folder className="w-4 h-4 text-amber-400/80" />
                                )}
                              </button>
                            ) : (
                              <span className="w-4 h-4 flex items-center justify-center text-slate-500 mr-1">
                                •
                              </span>
                            )}

                            {/* Account Name */}
                            <span
                              onClick={() => {
                                if (node.hasChildren) toggleExpand(acc.code);
                              }}
                              className={`font-somar select-none ${
                                isMain
                                  ? 'cursor-pointer text-white font-extrabold hover:text-emerald-300 text-sm'
                                  : 'text-slate-300 text-xs font-medium'
                              }`}
                            >
                              {acc.name}
                            </span>

                            {/* Child Count Badge for Parent Accounts */}
                            {node.hasChildren && (
                              <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full border border-slate-700/60 font-somar font-normal">
                                {node.childCount} حساب فرعي
                              </span>
                            )}

                            {acc.englishName && (
                              <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                                ({acc.englishName})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Account Type Badge */}
                        <td className="py-3 px-4 text-center">
                          {isMain ? (
                            <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-somar">
                              رئيسي (تجميعي)
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-somar">
                              فرعي (يقبل حركات)
                            </span>
                          )}
                        </td>

                        {/* Nature (Debit / Credit) */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              acc.nature === 'debit'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            {acc.nature === 'debit' ? 'مدين بطبيعته' : 'دائن بطبيعته'}
                          </span>
                        </td>

                        {/* Balance (Rollup for main, actual for sub) */}
                        <td className="py-3 px-4 text-left font-mono font-bold">
                          <span
                            className={`${
                              node.calculatedBalance !== 0
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {(node?.calculatedBalance || 0).toLocaleString()} ج.م
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Add Child Sub-Account Button */}
                            <button
                              onClick={() => handleOpenAdd(acc)}
                              className="p-1.5 bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 hover:text-white rounded-lg border border-slate-700 transition-all cursor-pointer"
                              title={`إضافة حساب فرعي متفرع تحته مباشرة ("${acc.name}")`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            {/* Navigate to General Ledger for sub-accounts */}
                            {!isMain && (
                              <button
                                onClick={() => onNavigateToLedger(acc.code)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all cursor-pointer"
                                title="عرض كشف حساب الأستاذ العام"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(acc)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all cursor-pointer"
                              title="تعديل بيانات الحساب"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete (if not system root) */}
                            {!acc.isSystem && (
                              <button
                                onClick={() => handleDelete(acc)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-all cursor-pointer"
                                title="حذف الحساب"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                /* Flat Table View */
                flatAccounts.map((acc) => {
                  const isMain = acc.type === 'main';
                  const bal = computeRollupBalance(acc);

                  return (
                    <tr
                      key={acc.id || acc.code}
                      className="hover:bg-slate-800/60 transition-colors text-slate-300"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white">{acc.code}</td>
                      <td className="py-3 px-4 font-somar font-bold text-white">{acc.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isMain
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isMain ? 'رئيسي' : 'فرعي'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-somar">
                        {acc.nature === 'debit' ? 'مدين' : 'دائن'}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-emerald-400">
                        {(bal || 0).toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-4 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdd(acc)}
                            className="p-1.5 bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-slate-700"
                            title="إضافة فرع تحته"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white text-base font-somar flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-emerald-400" />
                {editingAccount ? 'تعديل بيانات الحساب المحاسبي' : 'إضافة وتفريع حساب محاسبي جديد'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Account Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    رقم الحساب (الكود المحاسبي) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="مثال: 1114 أو 1243"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    نوع الحساب *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                  >
                    <option value="sub">فرعي (يقبل تسجيل قيود يومية وحركات)</option>
                    <option value="main">رئيسي (حساب تجميعي للأفرع)</option>
                  </select>
                </div>
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                  اسم الحساب باللغة العربية *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أجهزة حواسب وخوادم أو بنك مصر ج.م"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                  اسم الحساب بالإنجليزية (اختياري)
                </label>
                <input
                  type="text"
                  value={formData.englishName}
                  onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                  placeholder="e.g. IT Equipment & Servers"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Parent Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    الحساب الرئيسي التابع له (الأب)
                  </label>
                  <select
                    value={formData.parentCode}
                    onChange={(e) => {
                      const pCode = e.target.value;
                      const pAcc = accounts.find((a) => a.code === pCode);
                      setFormData({
                        ...formData,
                        parentCode: pCode,
                        category: pAcc ? pAcc.category : formData.category,
                        nature: pAcc ? pAcc.nature : formData.nature,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                  >
                    <option value="">-- بدون أب (حساب مستوى أول) --</option>
                    {accounts
                      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                      .map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} - {p.name} ({p.type === 'main' ? 'رئيسي' : 'فرعي'})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    التبويب والقائمة المالية *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AccountCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                  >
                    <option value="assets">1 - الأصول (Assets)</option>
                    <option value="liabilities">2 - الالتزامات (Liabilities)</option>
                    <option value="equity">21 - حقوق الملكية (Equity)</option>
                    <option value="revenue">3 - الإيرادات (Revenues)</option>
                    <option value="expense">4 - المصروفات (Expenses)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Account Nature */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    طبيعة الحساب المحاسبية *
                  </label>
                  <select
                    value={formData.nature}
                    onChange={(e) => setFormData({ ...formData, nature: e.target.value as AccountNature })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-somar"
                  >
                    <option value="debit">مدين (Debit)</option>
                    <option value="credit">دائن (Credit)</option>
                  </select>
                </div>

                {/* Opening Balance */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-somar">
                    الرصيد الافتتاحي (ج.م)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
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
                  {editingAccount ? 'حفظ التعديلات' : 'إضافة الحساب للشجرة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
