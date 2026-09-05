import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Trash2,
  RotateCcw,
  Download,
  Filter,
  Eye,
  FileSpreadsheet,
  Printer,
  Calendar,
  User,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Ban,
  Activity,
  ArrowUpDown,
} from 'lucide-react';
import { db } from '../services/db';
import { AuditLogEntry, AuditActionType } from '../types/accounting';
import * as XLSX from 'xlsx';

interface AuditLogViewProps {
  onRefresh?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => db.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [showStatusFilter, setShowStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Deletion modal state
  const [deleteTargetLog, setDeleteTargetLog] = useState<AuditLogEntry | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [isHardDelete, setIsHardDelete] = useState(false);

  // Refresh logs from database
  const refreshLogs = () => {
    setLogs(db.getAuditLogs());
  };

  // Modules list
  const modulesList = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set);
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.recordIdentifier && log.recordIdentifier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchModule = selectedModule === 'all' || log.module === selectedModule;
      const matchAction = selectedAction === 'all' || log.actionType === selectedAction;
      const matchStatus =
        showStatusFilter === 'all' ||
        (showStatusFilter === 'active' && !log.isDeleted) ||
        (showStatusFilter === 'deleted' && log.isDeleted);

      return matchSearch && matchModule && matchAction && matchStatus;
    });
  }, [logs, searchTerm, selectedModule, selectedAction, showStatusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = logs.length;
    const deletedCount = logs.filter((l) => l.isDeleted).length;
    const activeCount = total - deletedCount;
    const creationCount = logs.filter((l) => l.actionType === 'create').length;
    const deletionActionCount = logs.filter((l) => l.actionType === 'delete').length;
    return { total, deletedCount, activeCount, creationCount, deletionActionCount };
  }, [logs]);

  // Handle Delete Confirmation
  const confirmDelete = () => {
    if (!deleteTargetLog) return;
    db.deleteAuditLog(
      deleteTargetLog.id,
      isHardDelete,
      deletionReason || 'تم الحذف بواسطة المستخدم من سجل العمليات',
      'المحاسب القانوني / محمود الباز قابيل'
    );
    setDeleteTargetLog(null);
    setDeletionReason('');
    setIsHardDelete(false);
    refreshLogs();
  };

  // Handle Restore
  const handleRestore = (id: string) => {
    db.restoreAuditLog(id);
    refreshLogs();
  };

  // Export to Excel
  const exportToExcel = () => {
    const rows = filteredLogs.map((l, index) => ({
      'م': index + 1,
      'التاريخ والوقت': l.formattedDate || l.timestamp,
      'الوحدة / القسم': l.module,
      'نوع الإجراء': getActionBadge(l.actionType).label,
      'البيان والتفاصيل': l.description,
      'رقم المرجع': l.recordIdentifier || '-',
      'المستخدم المسؤول': l.user,
      'حالة السجل': l.isDeleted ? `محذوف (${l.deletedBy || 'المستخدم'} - ${l.deletedAt || ''})` : 'نشط وسارٍ',
      'سبب الحذف': l.deletionNote || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل العمليات والرقابة');
    XLSX.writeFile(wb, `سجل_العمليات_المحاسبية_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print A4 log
  const handlePrint = () => {
    window.print();
  };

  // Action badge mapping
  function getActionBadge(type: AuditActionType) {
    switch (type) {
      case 'create':
        return { label: 'إنشاء وإضافة', bg: 'bg-zinc-800 text-zinc-100 border-zinc-700' };
      case 'update':
        return { label: 'تعديل وتحديث', bg: 'bg-zinc-700 text-zinc-200 border-zinc-600' };
      case 'delete':
        return { label: 'حذف وإلغاء', bg: 'bg-zinc-900 text-zinc-300 border-zinc-600' };
      case 'post':
        return { label: 'اعتماد وترحيل', bg: 'bg-zinc-800 text-zinc-100 border-zinc-600' };
      case 'unpost':
        return { label: 'إلغاء ترحيل', bg: 'bg-zinc-700 text-zinc-300 border-zinc-600' };
      case 'backup':
        return { label: 'نسخ احتياطي', bg: 'bg-zinc-800 text-zinc-200 border-zinc-700' };
      case 'restore':
        return { label: 'استعادة بيانات', bg: 'bg-zinc-800 text-zinc-200 border-zinc-600' };
      default:
        return { label: 'إجراء نظام', bg: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  }

  return (
    <div className="space-y-6 pb-12" id="audit-log-root">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-zinc-800 rounded-xl border border-zinc-700 text-zinc-200">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">سجل العمليات والرقابة الداخلية (Audit Trail)</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                تتبع وتوثيق كافة العمليات المالية والإدارية وحركات الحذف والاعتماد مع توثيق اسم المستخدم والتاريخ
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة تقرير</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">إجمالي العمليات المسجلة</div>
            <div className="text-2xl font-black text-white font-mono mt-1">{stats.total}</div>
          </div>
          <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">العمليات النشطة</div>
            <div className="text-2xl font-black text-zinc-200 font-mono mt-1">{stats.activeCount}</div>
          </div>
          <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">العمليات المحذوفة من السجل</div>
            <div className="text-2xl font-black text-zinc-300 font-mono mt-1">{stats.deletedCount}</div>
          </div>
          <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
            <Ban className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">حركات الإنشاء والإضافة</div>
            <div className="text-2xl font-black text-zinc-200 font-mono mt-1">{stats.creationCount}</div>
          </div>
          <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في البيان، رقم القيد/الشهادة، اسم المستخدم، أو التفاصيل..."
              className="w-full pl-3 pr-9 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Module Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value="all">كافة الأقسام والوحدات</option>
              {modulesList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value="all">كافة الإجراءات</option>
              <option value="create">إنشاء وإضافة</option>
              <option value="update">تعديل وتحديث</option>
              <option value="delete">حذف وإلغاء</option>
              <option value="post">اعتماد وترحيل</option>
              <option value="unpost">إلغاء ترحيل</option>
              <option value="backup">نسخ احتياطي</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={showStatusFilter}
              onChange={(e) => setShowStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value="all">الكل (نشط ومحذوف)</option>
              <option value="active">العمليات السارية فقط</option>
              <option value="deleted">العمليات المحذوفة فقط</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 font-semibold">
                <th className="p-3.5 w-12 text-center">#</th>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">الوحدة</th>
                <th className="p-3.5">نوع الإجراء</th>
                <th className="p-3.5">البيان والعملية</th>
                <th className="p-3.5">رقم المرجع</th>
                <th className="p-3.5">المستخدم</th>
                <th className="p-3.5">حالة السجل</th>
                <th className="p-3.5 text-center w-28">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="w-8 h-8 text-zinc-600" />
                      <p className="text-sm font-semibold">لا توجد عمليات مطابقة لمعايير البحث</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const actionBadge = getActionBadge(log.actionType);
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-zinc-800/40 transition-colors ${
                        log.isDeleted ? 'bg-zinc-950/60 opacity-85' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center text-zinc-500 font-mono">{index + 1}</td>
                      <td className="p-3.5 font-mono text-zinc-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{log.formattedDate || log.timestamp}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded font-medium text-[11px]">
                          {log.module}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 border rounded-full text-[11px] font-bold ${actionBadge.bg}`}>
                          {actionBadge.label}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-md">
                        <div className="font-bold text-zinc-100">{log.description}</div>
                        {log.details && (
                          <div className="text-[11px] text-zinc-400 mt-0.5 truncate">{log.details}</div>
                        )}
                        {/* Soft deletion banner if deleted */}
                        {log.isDeleted && (
                          <div className="mt-1.5 p-1.5 bg-zinc-950 border border-zinc-700 rounded text-[11px] text-zinc-300 flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>
                              تم حذف هذه العملية بواسطة{' '}
                              <strong className="text-white">{log.deletedBy || 'المستخدم'}</strong> في{' '}
                              <strong className="font-mono text-white">{log.deletedAt || '-'}</strong>
                              {log.deletionNote && ` (${log.deletionNote})`}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-mono font-bold text-zinc-300">
                        {log.recordIdentifier || '-'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{log.user}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {log.isDeleted ? (
                          <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-700 text-zinc-400 rounded text-[10px] font-bold flex items-center gap-1 w-max">
                            <XCircle className="w-3 h-3 text-zinc-400" />
                            <span>محذوف من السجل</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-[10px] font-bold flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-zinc-300" />
                            <span>سارٍ ونشط</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedLog(log)}
                            title="عرض التفاصيل الكاملة"
                            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Restore if deleted */}
                          {log.isDeleted ? (
                            <button
                              onClick={() => handleRestore(log.id)}
                              title="استعادة العملية إلى السجلات السارية"
                              className="p-1.5 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            /* Delete operation from audit */
                            <button
                              onClick={() => {
                                setDeleteTargetLog(log);
                                setDeletionReason('');
                                setIsHardDelete(false);
                              }}
                              title="حذف العملية من السجل"
                              className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Delete / Soft-delete Dialog Modal */}
      {deleteTargetLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
              <div className="p-2 bg-zinc-800 rounded-xl text-zinc-300 border border-zinc-700">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">حذف عملية من سجل الرقابة</h3>
                <p className="text-xs text-zinc-400">توثيق الحذف مع إظهار علامة الحذف للمراجعين</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                <div className="font-bold text-white">{deleteTargetLog.description}</div>
                <div className="text-zinc-400 font-mono">
                  {deleteTargetLog.recordIdentifier && `المرجع: ${deleteTargetLog.recordIdentifier} | `}
                  التاريخ: {deleteTargetLog.formattedDate}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  سبب الحذف / ملاحظات المراجعة:
                </label>
                <input
                  type="text"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="مثال: تم إلغاء العملية بناءً على طلب العميل ومراجعة الفواتير..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                <input
                  type="checkbox"
                  id="hardDeleteCheckbox"
                  checked={isHardDelete}
                  onChange={(e) => setIsHardDelete(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-zinc-100"
                />
                <label htmlFor="hardDeleteCheckbox" className="text-[11px] text-zinc-400 cursor-pointer">
                  حذف نهائي تام من قاعدة البيانات (بدلاً من التعليم كـ "تم الحذف بواسطة المستخدم")
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setDeleteTargetLog(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Full Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-zinc-800 rounded-xl text-zinc-200">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">تفاصيل العملية المحاسبية</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="text-[11px] text-zinc-500">التاريخ والوقت:</div>
                  <div className="font-mono font-bold text-zinc-200 mt-0.5">{selectedLog.formattedDate}</div>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="text-[11px] text-zinc-500">الوحدة / القسم:</div>
                  <div className="font-bold text-zinc-200 mt-0.5">{selectedLog.module}</div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                <div className="text-[11px] text-zinc-500">البيان الأساسي:</div>
                <div className="font-bold text-white text-sm">{selectedLog.description}</div>
              </div>

              {selectedLog.details && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-500">التفاصيل الفنية والبنود:</div>
                  <div className="text-zinc-300 whitespace-pre-wrap">{selectedLog.details}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="text-[11px] text-zinc-500">المستخدم المسؤول:</div>
                  <div className="font-bold text-zinc-200 mt-0.5">{selectedLog.user}</div>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="text-[11px] text-zinc-500">رقم المرجع:</div>
                  <div className="font-mono font-bold text-zinc-200 mt-0.5">
                    {selectedLog.recordIdentifier || '-'}
                  </div>
                </div>
              </div>

              {selectedLog.isDeleted && (
                <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-300 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-zinc-400" />
                    <span>تم حذف هذه العملية بواسطة المستخدم</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    تم الحذف بواسطة: <strong>{selectedLog.deletedBy || 'المستخدم'}</strong>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    تاريخ الحذف: {selectedLog.deletedAt || '-'}
                  </div>
                  {selectedLog.deletionNote && (
                    <div className="text-[11px] text-zinc-300">السبب: {selectedLog.deletionNote}</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
