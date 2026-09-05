import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Phone,
  Plus,
  Printer,
  Receipt,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { db } from '../services/db';
import { AuditorStatement, CompanyProfile } from '../types/accounting';
import {
  ClientArchive,
  CommercialRegisterType,
  FacilityType,
  TaxInspectionStatus,
} from '../types/office';
import { exportToExcel, exportToWordDoc, printDocument } from '../utils/exportUtils';

interface ClientsArchiveViewProps {
  companyProfile: CompanyProfile;
  auditorStatement: AuditorStatement;
  onNavigateToTreasury?: (clientId: string) => void;
  onNavigateToCertificate?: (clientId: string) => void;
}

export const ClientsArchiveView: React.FC<ClientsArchiveViewProps> = ({
  companyProfile,
  auditorStatement,
  onNavigateToTreasury,
  onNavigateToCertificate,
}) => {
  const [clients, setClients] = useState<ClientArchive[]>(() => db.getClientArchives());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTaxStatus, setFilterTaxStatus] = useState<string>('all');
  const [filterVat, setFilterVat] = useState<string>('all');
  const [filterFacility, setFilterFacility] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientArchive | null>(null);
  const [selectedClientDossier, setSelectedClientDossier] = useState<ClientArchive | null>(null);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form State
  const initialFormState: Omit<ClientArchive, 'id' | 'clientCode' | 'createdAt'> = {
    name: '',
    activityStartDate: new Date().toISOString().split('T')[0],
    taxInspectionStatus: 'فحص حتى 2023 ومحاسب نهائياً',
    taxInspectionDetails: '',
    isVatSubject: true,
    vatRegistrationNumber: '',
    commercialRegisterType: 'شركة',
    facilityType: 'شركة ذات مسؤولية محدودة (ش.ذ.م.م)',
    taxCardNumber: '',
    taxFileNumber: '',
    taxOffice: '',
    commercialRegistryNumber: '',
    commercialRegistryOffice: '',
    managerName: '',
    phone: '',
    email: '',
    address: '',
    city: 'القاهرة',
    monthlyFee: 2500,
    annualFee: 30000,
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  const refreshClients = () => {
    setClients(db.getClientArchives());
  };

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.taxCardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm));

      const matchTax = filterTaxStatus === 'all' || c.taxInspectionStatus === filterTaxStatus;
      const matchVat =
        filterVat === 'all' ||
        (filterVat === 'yes' && c.isVatSubject) ||
        (filterVat === 'no' && !c.isVatSubject);
      const matchFacility = filterFacility === 'all' || c.facilityType === filterFacility;

      return matchSearch && matchTax && matchVat && matchFacility;
    });
  }, [clients, searchTerm, filterTaxStatus, filterVat, filterFacility]);

  // Handle Save (Add / Update)
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.taxCardNumber) {
      alert('يرجى إدخال اسم العميل ورقم البطاقة الضريبية');
      return;
    }

    if (editingClient) {
      db.updateClientArchive({
        ...editingClient,
        ...formData,
      });
    } else {
      db.addClientArchive(formData);
    }

    refreshClients();
    setIsAddModalOpen(false);
    setEditingClient(null);
    setFormData(initialFormState);
  };

  const handleEditClick = (client: ClientArchive) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      activityStartDate: client.activityStartDate,
      taxInspectionStatus: client.taxInspectionStatus,
      taxInspectionDetails: client.taxInspectionDetails || '',
      isVatSubject: client.isVatSubject,
      vatRegistrationNumber: client.vatRegistrationNumber || '',
      commercialRegisterType: client.commercialRegisterType,
      facilityType: client.facilityType,
      taxCardNumber: client.taxCardNumber,
      taxFileNumber: client.taxFileNumber || '',
      taxOffice: client.taxOffice || '',
      commercialRegistryNumber: client.commercialRegistryNumber || '',
      commercialRegistryOffice: client.commercialRegistryOffice || '',
      managerName: client.managerName || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      city: client.city || '',
      monthlyFee: client.monthlyFee || 0,
      annualFee: client.annualFee || 0,
      notes: client.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteClient = (id: string, name: string) => {
    setClientToDelete({ id, name });
  };

  const confirmDeleteClient = () => {
    if (!clientToDelete) return;
    db.deleteClientArchive(clientToDelete.id);
    refreshClients();
    if (selectedClientDossier?.id === clientToDelete.id) {
      setSelectedClientDossier(null);
    }
    setClientToDelete(null);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const data = filteredClients.map((c) => {
      const fin = db.getClientFinancialSummary(c.id);
      return {
        'كود العميل': c.clientCode,
        'اسم العميل / المنشأة': c.name,
        'نوع المنشأة': c.facilityType,
        'نوع السجل': c.commercialRegisterType,
        'تاريخ بدء النشاط': c.activityStartDate,
        'الموقف من الفحص الضريبي': c.taxInspectionStatus,
        'خاضع لضريبة القيمة المضافة': c.isVatSubject ? 'نعم' : 'لا',
        'رقم البطاقة الضريبية': c.taxCardNumber,
        'رقم السجل التجاري': c.commercialRegistryNumber || '-',
        'مأمورية الضرائب': c.taxOffice || '-',
        'الهاتف': c.phone || '-',
        'إجمالي الوارد (ج.م)': fin.totalIncome,
        'إجمالي المنصرف (ج.م)': fin.totalExpenses,
        'صافي أتعاب المكتب (ج.م)': fin.netFees,
        'عدد الشهادات المصدرة': fin.certificatesCount,
      };
    });

    exportToExcel(data, `سجل_أرشيف_العملاء_${new Date().toISOString().split('T')[0]}`, 'أرشيف العملاء');
  };

  // Export to Word (.docx)
  const handleExportWord = () => {
    let rowsHtml = '';
    filteredClients.forEach((c) => {
      const fin = db.getClientFinancialSummary(c.id);
      rowsHtml += `
        <tr>
          <td><strong>${c.clientCode}</strong></td>
          <td><strong>${c.name}</strong><br><small>${c.facilityType} (${c.commercialRegisterType})</small></td>
          <td>${c.taxCardNumber}<br><small>مأمورية: ${c.taxOffice || '-'}</small></td>
          <td>${c.taxInspectionStatus}</td>
          <td>${c.isVatSubject ? 'خاضع (14%)' : 'غير خاضع'}</td>
          <td>${c.phone || '-'}</td>
          <td>${(fin?.netFees ?? 0).toLocaleString()} ج.م</td>
        </tr>
      `;
    });

    const content = `
      <div class="header-box">
        <h2>مكتب المحاسب والمراجع القانوني</h2>
        <h1>محمود الباز قابيل</h1>
        <p>سجل المحاسبين والمراجعين بوزارة المالية: <strong>44887</strong></p>
        <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
      </div>
      <h3 class="title">سجل أرشيف العملاء والمواقف الضريبية والمالية</h3>
      <table>
        <thead>
          <tr>
            <th>كود العميل</th>
            <th>اسم العميل / المنشأة</th>
            <th>البطاقة الضريبية والمأمورية</th>
            <th>الموقف من الفحص الضريبي</th>
            <th>ضريبة القيمة المضافة</th>
            <th>الهاتف</th>
            <th>صافي أتعاب المكتب</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="footer-stamp">
        <div>
          <p>إجمالي عدد العملاء: <strong>${filteredClients.length}</strong> عميل</p>
        </div>
        <div class="stamp-box">
          اعتماد المحاسب القانوني<br>
          <strong>محمود الباز قابيل</strong><br>
          س.م.م 44887
        </div>
      </div>
    `;

    exportToWordDoc('سجل_أرشيف_العملاء', content, `أرشيف_العملاء_${new Date().toISOString().split('T')[0]}.doc`);
  };

  return (
    <div className="space-y-6 font-somar">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white font-somar">
                  أرشيف المكتب
                </h1>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setEditingClient(null);
                setFormData(initialFormState);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عميل</span>
            </button>

            {/* Export Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={handleExportExcel}
                title="تصدير إلى Excel (.xlsx)"
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-emerald-500/30"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                onClick={handleExportWord}
                title="تصدير إلى Word (.docx)"
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

        {/* Stats summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">إجمالي العملاء بالأرشيف</span>
            <div className="text-xl font-bold text-white font-mono">{clients.length}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">خاضعون للقيمة المضافة</span>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {clients.filter((c) => c.isVatSubject).length}
            </div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">شركات وهيئات اعتبارية</span>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {clients.filter((c) => c.commercialRegisterType === 'شركة').length}
            </div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">منشآت فردية ومهن</span>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {clients.filter((c) => c.commercialRegisterType === 'فردي').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، الكود، البطاقة الضريبية..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Tax Inspection filter */}
          <select
            value={filterTaxStatus}
            onChange={(e) => setFilterTaxStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كل المواقف الضريبية</option>
            <option value="فحص حتى 2023 ومحاسب نهائياً">فحص حتى 2023 ومحاسب</option>
            <option value="فحص حتى 2022 وجاري فحص 2023">جاري فحص 2023</option>
            <option value="جاري الفحص الضريبي حالياً">جاري الفحص حالياً</option>
            <option value="لم يفحص بعد (ملف حديث/معفى)">لم يفحص بعد</option>
            <option value="لجان طعن وإعادة نظر">لجان طعن وإعادة نظر</option>
            <option value="متصالح طبقاً لقانون التجاوز/المادة 3">متصالح</option>
          </select>

          {/* VAT Status filter */}
          <select
            value={filterVat}
            onChange={(e) => setFilterVat(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كل حالات القيمة المضافة</option>
            <option value="yes">خاضع للقيمة المضافة (14%)</option>
            <option value="no">غير خاضع</option>
          </select>

          {/* Commercial Register type filter */}
          <select
            value={filterFacility}
            onChange={(e) => setFilterFacility(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كل الكيانات القانونية</option>
            <option value="منشأة فردية">منشأة فردية</option>
            <option value="شركة مساهمة مصرية (ش.م.م)">شركة مساهمة (ش.م.م)</option>
            <option value="شركة ذات مسؤولية محدودة (ش.ذ.م.م)">ذات مسؤولية محدودة (ش.ذ.م.م)</option>
            <option value="شركة تضامن">شركة تضامن</option>
            <option value="شركة توصية بسيطة">شركة توصية بسيطة</option>
          </select>
        </div>
      </div>

      {/* Clients Table / Cards List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs md:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] font-bold border-b border-slate-800 select-none">
              <tr>
                <th className="p-3.5">كود العميل</th>
                <th className="p-3.5">اسم العميل / المنشأة</th>
                <th className="p-3.5">الكيان القانوني</th>
                <th className="p-3.5">البطاقة والمأمورية</th>
                <th className="p-3.5">الموقف من الفحص الضريبي</th>
                <th className="p-3.5 text-center">ضريبة القيمة المضافة</th>
                <th className="p-3.5">الماليات والأتعاب</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    لا يوجد عملاء مطابقين لمعايير البحث في الأرشيف
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const fin = db.getClientFinancialSummary(client.id);
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Code */}
                      <td className="p-3.5 font-mono text-emerald-400 font-bold whitespace-nowrap">
                        {client.clientCode}
                      </td>

                      {/* Name & Type */}
                      <td className="p-3.5">
                        <button
                          onClick={() => setSelectedClientDossier(client)}
                          className="font-bold text-white hover:text-emerald-400 transition-colors text-right block cursor-pointer"
                        >
                          {client.name}
                        </button>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            بدء النشاط: {client.activityStartDate}
                          </span>
                          {client.phone && (
                            <span className="flex items-center gap-1 font-mono text-slate-400">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Legal Facility */}
                      <td className="p-3.5">
                        <span className="text-slate-200 block text-xs">{client.facilityType}</span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                          سجل {client.commercialRegisterType}
                        </span>
                      </td>

                      {/* Tax Card & Office */}
                      <td className="p-3.5 text-xs">
                        <div className="font-mono text-slate-200 font-semibold">
                          {client.taxCardNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {client.taxOffice || 'مأمورية غير محددة'}
                        </div>
                      </td>

                      {/* Tax Inspection Status */}
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {client.taxInspectionStatus}
                        </span>
                      </td>

                      {/* VAT Status */}
                      <td className="p-3.5 text-center">
                        {client.isVatSubject ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>خاضع (14%)</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] bg-slate-800 text-slate-400 border border-slate-700">
                            غير خاضع
                          </span>
                        )}
                      </td>

                      {/* Financial Summary */}
                      <td className="p-3.5 text-xs">
                        <div className="flex items-center gap-1 text-slate-300 font-mono">
                          <span className="text-slate-500 text-[10px]">صافي أتعاب:</span>
                          <strong className="text-emerald-400">
                            {(fin?.netFees ?? 0).toLocaleString()} ج.م
                          </strong>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          وارد: {(fin?.totalIncome ?? 0).toLocaleString()} | منصرف: {(fin?.totalExpenses ?? 0).toLocaleString()}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedClientDossier(client)}
                            title="عرض الملف والكشف المالي الشامل"
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(client)}
                            title="تعديل بيانات العميل"
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            title="حذف من الأرشيف"
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-somar">
                  {editingClient ? `تعديل ملف العميل: ${editingClient.clientCode}` : 'إضافة عميل جديد لأرشيف المكتب'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Mandatory Fields Section */}
              <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/40 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-somar">
                  <ShieldCheck className="w-4 h-4" />
                  <span>البيانات الأساسية ونموذج الأرشيف الإلزامي</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 1. Client Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      اسم العميل / اسم المنشأة أو الشركة *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="مثال: شركة النيل للصناعات الهندسية والتوريدات"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* 2. Activity Start Date */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      تاريخ بدء النشاط *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.activityStartDate}
                      onChange={(e) => setFormData({ ...formData, activityStartDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* 3. Commercial Register Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      نوع السجل التجاري (فردي / شركة) *
                    </label>
                    <select
                      value={formData.commercialRegisterType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commercialRegisterType: e.target.value as CommercialRegisterType,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="شركة">شركة</option>
                      <option value="فردي">فردي</option>
                    </select>
                  </div>

                  {/* 4. Facility/Office Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      نوع المنشأة / الكيان القانوني *
                    </label>
                    <select
                      value={formData.facilityType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          facilityType: e.target.value as FacilityType,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="منشأة فردية">منشأة فردية</option>
                      <option value="شركة مساهمة مصرية (ش.م.م)">شركة مساهمة مصرية (ش.م.م)</option>
                      <option value="شركة ذات مسؤولية محدودة (ش.ذ.م.م)">شركة ذات مسؤولية محدودة (ش.ذ.م.م)</option>
                      <option value="شركة الشخص الواحد (ش.ذ.م.م)">شركة الشخص الواحد (ش.ذ.م.م)</option>
                      <option value="شركة تضامن">شركة تضامن</option>
                      <option value="شركة توصية بسيطة">شركة توصية بسيطة</option>
                      <option value="فرع شركة أجنبية">فرع شركة أجنبية</option>
                      <option value="مهن حرة / مكتب مهني">مهن حرة / مكتب مهني</option>
                    </select>
                  </div>

                  {/* 5. VAT Status */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      الخضوع لضريبة القيمة المضافة (نعم / لا) *
                    </label>
                    <select
                      value={formData.isVatSubject ? 'true' : 'false'}
                      onChange={(e) =>
                        setFormData({ ...formData, isVatSubject: e.target.value === 'true' })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="true">نعم (خاضع لضريبة القيمة المضافة 14%)</option>
                      <option value="false">لا (غير خاضع / معفى)</option>
                    </select>
                  </div>

                  {/* 6. Tax Inspection Status */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      الموقف من الفحص الضريبي *
                    </label>
                    <select
                      value={formData.taxInspectionStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          taxInspectionStatus: e.target.value as TaxInspectionStatus,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="فحص حتى 2023 ومحاسب نهائياً">فحص حتى 2023 ومحاسب نهائياً</option>
                      <option value="فحص حتى 2022 وجاري فحص 2023">فحص حتى 2022 وجاري فحص 2023</option>
                      <option value="جاري الفحص الضريبي حالياً">جاري الفحص الضريبي حالياً</option>
                      <option value="لم يفحص بعد (ملف حديث/معفى)">لم يفحص بعد (ملف حديث/معفى)</option>
                      <option value="لجان طعن وإعادة نظر">لجان طعن وإعادة نظر</option>
                      <option value="متصالح طبقاً لقانون التجاوز/المادة 3">متصالح طبقاً لقانون التجاوز/المادة 3</option>
                      <option value="إنهاء نزاع ضريبي">إنهاء نزاع ضريبي</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>

                  {/* Tax Inspection Details */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      تفاصيل وملاحظات الفحص الضريبي
                    </label>
                    <input
                      type="text"
                      value={formData.taxInspectionDetails}
                      onChange={(e) => setFormData({ ...formData, taxInspectionDetails: e.target.value })}
                      placeholder="مثال: تم سداد ضريبة عام 2023 بموجب نموذج 9 ض.ع، وبانتظار فتح ملف فحص 2024"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tax & Commercial Registry Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    رقم البطاقة / التسجيل الضريبي *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.taxCardNumber}
                    onChange={(e) => setFormData({ ...formData, taxCardNumber: e.target.value })}
                    placeholder="مثال: 542-890-123"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    مأمورية الضرائب التابع لها
                  </label>
                  <input
                    type="text"
                    value={formData.taxOffice}
                    onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                    placeholder="مثال: مأمورية ضرائب الشركات المساهمة بالقاهرة"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    رقم السجل التجاري
                  </label>
                  <input
                    type="text"
                    value={formData.commercialRegistryNumber}
                    onChange={(e) => setFormData({ ...formData, commercialRegistryNumber: e.target.value })}
                    placeholder="مثال: 109842"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    رقم الملف الضريبي
                  </label>
                  <input
                    type="text"
                    value={formData.taxFileNumber}
                    onChange={(e) => setFormData({ ...formData, taxFileNumber: e.target.value })}
                    placeholder="مثال: 142/55/مساهمة"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Contact & Fees Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    المدير المسؤول / المفوض
                  </label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    placeholder="مثال: م. أشرف الشناوي"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    رقم الهاتف / واتساب
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    الأتعاب الشهرية المتفق عليها (ج.م)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Address & Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  العنوان والموقع الجغرافي
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="المنطقة الصناعية - السادس من أكتوبر"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
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
                  {editingClient ? 'حفظ التعديلات' : 'حفظ العميل في الأرشيف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Client Dossier Modal (الملف الشامل المربوط بالماليات والشهادات) */}
      {selectedClientDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-6">
            {/* Dossier Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {selectedClientDossier.clientCode}
                  </span>
                  <span className="text-xs text-slate-400">{selectedClientDossier.facilityType}</span>
                </div>
                <h2 className="text-lg md:text-xl font-bold text-white font-somar">
                  {selectedClientDossier.name}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const client = selectedClientDossier;
                    setSelectedClientDossier(null);
                    handleEditClick(client);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل البيانات</span>
                </button>
                <button
                  onClick={() => setSelectedClientDossier(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dossier Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Overview Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block mb-1">تاريخ بدء النشاط</span>
                  <div className="text-xs font-bold text-slate-200 font-mono">
                    {selectedClientDossier.activityStartDate}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block mb-1">البطاقة الضريبية</span>
                  <div className="text-xs font-bold text-emerald-400 font-mono">
                    {selectedClientDossier.taxCardNumber}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block mb-1">السجل التجاري</span>
                  <div className="text-xs font-bold text-slate-200 font-mono">
                    {selectedClientDossier.commercialRegistryNumber || 'غير مسجل'}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-500 block mb-1">خضوع ضريبة القيمة المضافة</span>
                  <div className="text-xs font-bold text-emerald-400">
                    {selectedClientDossier.isVatSubject ? 'خاضع (14%)' : 'غير خاضع'}
                  </div>
                </div>
              </div>

              {/* Tax Inspection Status Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-300 mb-1">
                    الموقف من الفحص الضريبي: {selectedClientDossier.taxInspectionStatus}
                  </div>
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    {selectedClientDossier.taxInspectionDetails ||
                      'لا توجد تفاصيل إضافية مسجلة عن الفحص الضريبي لهذا العميل.'}
                  </p>
                </div>
              </div>

              {/* Financial Box (Synced from Treasury & Fees) */}
              {(() => {
                const fin = db.getClientFinancialSummary(selectedClientDossier.id);
                return (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span>كشف حساب الخزينة وصافي أتعاب المكتب للعميل</span>
                      </h3>
                      {onNavigateToTreasury && (
                        <button
                          onClick={() => {
                            setSelectedClientDossier(null);
                            onNavigateToTreasury(selectedClientDossier.id);
                          }}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>فتح في الخزينة</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                        <span className="text-[11px] text-slate-400 block mb-1">إجمالي الوارد (مقبوضات)</span>
                        <div className="text-sm font-bold text-emerald-400 font-mono">
                          {(fin?.totalIncome ?? 0).toLocaleString()} ج.م
                        </div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                        <span className="text-[11px] text-slate-400 block mb-1">إجمالي المنصرف (إجراءات)</span>
                        <div className="text-sm font-bold text-rose-400 font-mono">
                          {(fin?.totalExpenses ?? 0).toLocaleString()} ج.م
                        </div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                        <span className="text-[11px] text-slate-400 block mb-1">صافي أتعاب المكتب</span>
                        <div className="text-sm font-bold text-emerald-400 font-mono">
                          {(fin?.netFees ?? 0).toLocaleString()} ج.م
                        </div>
                      </div>
                    </div>

                    {/* Treasury logs table for this client */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 mb-2">سجل حركات الخزينة والإيصالات:</h4>
                      {fin.transactions.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">لا توجد حركات مالية مسجلة للعميل حتى الآن.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {fin.transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-xs border border-slate-800/80"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    tx.type === 'income'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {tx.type === 'income' ? 'وارد' : 'منصرف'}
                                </span>
                                <span className="font-mono text-slate-400">{tx.serialNumber}</span>
                                <span className="text-slate-300">{tx.serviceDescription}</span>
                              </div>
                              <div className="font-mono font-bold text-white">
                                {(tx?.amount ?? 0).toLocaleString()} ج.م
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Certificates Issued to this client */}
              {(() => {
                const certs = db.getCertificates().filter((c) => c.clientId === selectedClientDossier.id);
                return (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        <span>أرشيف الشهادات المحاسبية الصادرة للعميل ({certs.length})</span>
                      </h3>
                      {onNavigateToCertificate && (
                        <button
                          onClick={() => {
                            setSelectedClientDossier(null);
                            onNavigateToCertificate(selectedClientDossier.id);
                          }}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>إصدار شهادة جديدة</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {certs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">لا توجد شهادات محاسبية مستخرجة لهذا العميل.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {certs.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-emerald-400 font-bold">{c.serialNumber}</span>
                              <span className="text-[10px] text-slate-500">{c.issueDate}</span>
                            </div>
                            <div className="font-semibold text-slate-200">
                              {c.certificateType === 'income'
                                ? 'شهادة إثبات صافي الدخل'
                                : c.certificateType === 'invested_capital'
                                ? 'شهادة رأس المال المستثمر'
                                : 'شهادة رأس المال العامل'}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              موجهة إلى: {c.issuedToParty}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-somar">تأكيد حذف ملف العميل</h3>
                <p className="text-xs text-slate-400">حذف نهائي من سجل وأرشيف المكتب</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <p>
                هل أنت متأكد من رغبتك في إزالة ملف العميل التالي نهائياً من الأرشيف؟
              </p>
              <div className="font-bold text-white text-sm bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                {clientToDelete.name}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={confirmDeleteClient}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف العميل الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
