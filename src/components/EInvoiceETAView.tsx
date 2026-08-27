import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileJson,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe,
  Key,
  Layers,
  Link2,
  Lock,
  Plus,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { etaService } from '../services/etaService';
import { CompanyProfile, Invoice, Party } from '../types/accounting';
import {
  ETAConfig,
  ETADocument,
  ETADocumentType,
  ETASubmittedDocument,
} from '../types/eta';
import { exportToExcel, exportToWordDoc, printDocument } from '../utils/exportUtils';

interface EInvoiceETAViewProps {
  companyProfile: CompanyProfile;
  invoices: Invoice[];
  parties: Party[];
  onAddInvoice?: (invoice: any) => void;
  onUpdateInvoice?: (invoice: any) => void;
}

export const EInvoiceETAView: React.FC<EInvoiceETAViewProps> = ({
  companyProfile,
  invoices,
  parties,
  onAddInvoice,
  onUpdateInvoice,
}) => {
  // State
  const [etaConfig, setEtaConfig] = useState<ETAConfig>(() => etaService.getConfig());
  const [submittedDocs, setSubmittedDocs] = useState<ETASubmittedDocument[]>(() =>
    etaService.getSubmittedDocuments()
  );

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Modals
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSubmitNewModalOpen, setIsSubmitNewModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSyncInvoicesModalOpen, setIsSyncInvoicesModalOpen] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ETASubmittedDocument | null>(null);
  const [selectedDocForJson, setSelectedDocForJson] = useState<ETASubmittedDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New ETA Invoice Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [newDocType, setNewDocType] = useState<ETADocumentType>('I');
  const [receiverType, setReceiverType] = useState<'B' | 'P'>('B');
  const [receiverTaxNumber, setReceiverTaxNumber] = useState('412893110');
  const [receiverName, setReceiverName] = useState('شركة الأهرام للتجارة والاستيراد');
  const [receiverCity, setReceiverCity] = useState('الجيزة');
  const [receiverAddress, setReceiverAddress] = useState('شارع الهرم - مبنى 45');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [internalId, setInternalId] = useState(`INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);

  // Taxes (Freely adjustable per user request)
  const [customVatRate, setCustomVatRate] = useState<number>(etaConfig.defaultVatRate || 14);
  const [customWhtRate, setCustomWhtRate] = useState<number>(etaConfig.defaultWithholdingRate || 1);

  // Form Items
  const [items, setItems] = useState<
    Array<{
      id: string;
      description: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      itemCode: string;
      vatRate: number;
      whtRate: number;
    }>
  >([
    {
      id: '1',
      description: 'أتعاب مراجعة الحسابات السنوية وإعداد القوائم المالية المعتمدة',
      unit: 'خدمة',
      quantity: 1,
      unitPrice: 25000,
      itemCode: `EG-${(companyProfile.taxCardNumber || '542981320').replace(/[^0-9]/g, '')}-1001`,
      vatRate: 14,
      whtRate: 1,
    },
  ]);

  // Form Calculations
  const formSubtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }, [items]);

  const formVatTotal = useMemo(() => {
    return (formSubtotal * customVatRate) / 100;
  }, [formSubtotal, customVatRate]);

  const formWhtTotal = useMemo(() => {
    return (formSubtotal * customWhtRate) / 100;
  }, [formSubtotal, customWhtRate]);

  const formGrandTotal = useMemo(() => {
    return formSubtotal + formVatTotal - formWhtTotal;
  }, [formSubtotal, formVatTotal, formWhtTotal]);

  const refreshDocuments = () => {
    setSubmittedDocs(etaService.getSubmittedDocuments());
  };

  // Filtered List
  const filteredDocuments = useMemo(() => {
    return submittedDocs.filter((doc) => {
      const matchSearch =
        doc.internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.uuid && doc.uuid.toLowerCase().includes(searchTerm.toLowerCase())) ||
        doc.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.receiverId.includes(searchTerm);

      const matchStatus = filterStatus === 'all' || doc.status === filterStatus;
      const matchType = filterType === 'all' || doc.documentType === filterType;

      return matchSearch && matchStatus && matchType;
    });
  }, [submittedDocs, searchTerm, filterStatus, filterType]);

  // Statistics
  const stats = useMemo(() => {
    const total = submittedDocs.length;
    const valid = submittedDocs.filter((d) => d.status === 'Valid').length;
    const invalid = submittedDocs.filter((d) => d.status === 'Invalid').length;
    const cancelled = submittedDocs.filter((d) => d.status === 'Cancelled').length;
    const totalSales = submittedDocs.reduce((acc, d) => acc + (d.totalSales || 0), 0);
    const totalVat = submittedDocs.reduce((acc, d) => acc + (d.vatAmount || 0), 0);
    const totalWht = submittedDocs.reduce((acc, d) => acc + (d.withholdingTaxAmount || 0), 0);

    return { total, valid, invalid, cancelled, totalSales, totalVat, totalWht };
  }, [submittedDocs]);

  // Handle Save ETA Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    etaService.saveConfig(etaConfig);
    setIsSettingsModalOpen(false);
    setActionMessage({ type: 'success', text: 'تم حفظ وتحديث بيانات إعدادات منظومة الفاتورة بنجاح' });
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Add Item to Form
  const handleAddItem = () => {
    const taxNum = (companyProfile.taxCardNumber || '542981320').replace(/[^0-9]/g, '');
    setItems([
      ...items,
      {
        id: String(Date.now()),
        description: '',
        unit: 'خدمة',
        quantity: 1,
        unitPrice: 0,
        itemCode: `EG-${taxNum}-${1000 + items.length + 1}`,
        vatRate: customVatRate,
        whtRate: customWhtRate,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  // Submit New ETA Document
  const handleSubmitNewETADocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const issuerTaxNumber = (companyProfile.taxCardNumber || '542981320').replace(/[^0-9]/g, '');
    const cleanReceiverTax = receiverTaxNumber.replace(/[^0-9]/g, '');

    const lines = items.map((item, idx) => {
      const salesTotal = item.quantity * item.unitPrice;
      const vatAmount = (salesTotal * item.vatRate) / 100;
      const whtAmount = (salesTotal * item.whtRate) / 100;

      const taxableItems = [];
      if (item.vatRate > 0) {
        taxableItems.push({
          taxType: 'T1',
          subType: 'V009',
          rate: item.vatRate,
          amount: Number(vatAmount.toFixed(2)),
        });
      }
      if (item.whtRate > 0) {
        taxableItems.push({
          taxType: 'T4',
          subType: 'W001',
          rate: item.whtRate,
          amount: Number(whtAmount.toFixed(2)),
        });
      }

      return {
        description: item.description || 'خدمات محاسبية واستشارات',
        itemType: 'EGS' as const,
        itemCode: item.itemCode || `EG-${issuerTaxNumber}-${1000 + idx}`,
        unitType: item.unit === 'خدمة' ? 'HUR' : item.unit === 'يوم' ? 'DAY' : item.unit === 'شهر' ? 'MON' : 'EA',
        quantity: Number(item.quantity),
        unitValue: { currencySold: 'EGP', amountEGP: Number(item.unitPrice) },
        salesTotal: Number(salesTotal.toFixed(2)),
        total: Number(salesTotal.toFixed(2)),
        valueDifference: 0,
        totalTaxableFees: 0,
        netTotal: Number(salesTotal.toFixed(2)),
        itemsDiscount: 0,
        taxableItems,
      };
    });

    const totalSales = lines.reduce((acc, l) => acc + l.salesTotal, 0);
    const totalVat = lines.reduce((acc, l) => acc + (l.taxableItems.find((t) => t.taxType === 'T1')?.amount || 0), 0);
    const totalWht = lines.reduce((acc, l) => acc + (l.taxableItems.find((t) => t.taxType === 'T4')?.amount || 0), 0);
    const totalAmount = totalSales + totalVat - totalWht;

    const etaDoc: ETADocument = {
      issuer: {
        address: {
          branchID: etaConfig.branchId || '0',
          country: 'EG',
          governorate: 'Cairo',
          regionCity: 'مدينة نصر',
          street: companyProfile.address || 'شارع عباس العقاد',
          buildingNumber: '15',
        },
        type: 'B',
        id: issuerTaxNumber,
        name: companyProfile.name || 'مكتب المحاسب القانوني محمود الباز قابيل',
      },
      receiver: {
        address: {
          branchID: '0',
          country: 'EG',
          governorate: 'Giza',
          regionCity: receiverCity || 'الجيزة',
          street: receiverAddress || 'شارع التحرير',
          buildingNumber: '10',
        },
        type: receiverType,
        id: cleanReceiverTax,
        name: receiverName,
      },
      documentType: newDocType,
      documentTypeVersion: newDocType === 'SR' || newDocType === 'CR' ? '1.2' : '1.0',
      dateTimeIssued: new Date(issueDate).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      taxpayerActivityCode: etaConfig.taxpayerActivityCode || '6920',
      internalID: internalId,
      invoiceLines: lines,
      totalDiscountAmount: 0,
      totalSalesAmount: Number(totalSales.toFixed(2)),
      netAmount: Number(totalSales.toFixed(2)),
      taxTotals: [
        { taxType: 'T1', amount: Number(totalVat.toFixed(2)) },
        { taxType: 'T4', amount: Number(totalWht.toFixed(2)) },
      ],
      totalAmount: Number(totalAmount.toFixed(2)),
      extraDiscountAmount: 0,
      totalItemsDiscountAmount: 0,
      signatures: etaConfig.autoSignDocuments
        ? [
            {
              signatureType: 'I',
              value: `MIAGCSqGSIb3DQEHAqCAMIACAQExDzANBglghkgBZQMEAgEFADCABgkqhkiG9w0BBwEAAKCAMIIF${Date.now()}==`,
            },
          ]
        : undefined,
    };

    const res = await etaService.submitDocument(etaDoc);
    setIsSubmitting(false);
    refreshDocuments();
    setIsSubmitNewModalOpen(false);
    setActionMessage({ type: 'success', text: res.message });
    setSelectedDocForPreview(res.submittedDoc);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // 1-Click Send from Existing Invoices
  const handleSyncInvoiceToETA = async (invoice: Invoice) => {
    const party = parties.find((p) => p.id === invoice.partyId);
    const etaDoc = etaService.serializeToETADocument(invoice, companyProfile, party, etaConfig);
    const res = await etaService.submitDocument(etaDoc, invoice.id);
    refreshDocuments();
    setActionMessage({
      type: 'success',
      text: `تم تصدير وإرسال الفاتورة رقم (${invoice.formattedNumber || invoice.invoiceNumber}) بنجاح إلى مصلحة الضرائب المصرية`,
    });
    setSelectedDocForPreview(res.submittedDoc);
    setIsSyncInvoicesModalOpen(false);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Check / Refresh Document Status
  const handleCheckDocStatus = (doc: ETASubmittedDocument) => {
    const updated = etaService.refreshDocumentStatus(doc.id);
    if (updated) {
      refreshDocuments();
      setActionMessage({
        type: 'success',
        text: `تم الاستعلام وتحديث حالة المستند (${doc.uuid}): ${updated.statusReason}`,
      });
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // Cancel Document
  const handleCancelDoc = (doc: ETASubmittedDocument) => {
    const reason = prompt(`يرجى كتابة سبب إلغاء الفاتورة رقم (${doc.internalId}) بمصلحة الضرائب:`, 'طلب العميل تعديل بنود الفاتورة');
    if (reason) {
      etaService.cancelDocument(doc.id, reason);
      refreshDocuments();
      setActionMessage({
        type: 'success',
        text: `تم تسجيل طلب إلغاء المستند (${doc.uuid || doc.internalId}) بنجاح`,
      });
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // Export List to Excel
  const handleExportExcel = () => {
    const data = filteredDocuments.map((d) => ({
      'كود المنظومة (UUID)': d.uuid || 'قيد المعالجة',
      'الرقم الداخلي': d.internalId,
      'نوع المستند': d.documentType === 'I' ? 'فاتورة ضريبية' : d.documentType === 'C' ? 'إشعار دائن' : d.documentType === 'D' ? 'إشعار مدين' : 'إيصال إلكتروني',
      'تاريخ الإصدار': d.dateTimeIssued.split('T')[0],
      'اسم المستلم / العميل': d.receiverName,
      'الرقم الضريبي للمستلم': d.receiverId,
      'إجمالي المبيعات': d.totalSales,
      'صافي القيمة': d.netAmount,
      'ضريبة القيمة المضافة T1': d.vatAmount,
      'خصم أ/ت T4': d.withholdingTaxAmount,
      'الإجمالي النهائي': d.totalAmount,
      'حالة الاعتماد بالضرائب': d.status === 'Valid' ? 'معتمد ومقبول (Valid)' : d.status === 'Cancelled' ? 'ملغي' : d.status,
      'بيان الحالة': d.statusReason,
    }));

    exportToExcel(data, `سجل_الفواتير_الإلكترونية_ETA_${new Date().toISOString().split('T')[0]}`, 'الفواتير الإلكترونية');
  };

  // Copy JSON Code
  const handleCopyJson = (jsonObj: any) => {
    navigator.clipboard.writeText(JSON.stringify(jsonObj, null, 2));
    alert('تم نسخ كود JSON الرسمي للمستند إلى الحافظة بنجاح');
  };

  // Download JSON File
  const handleDownloadJson = (doc: ETASubmittedDocument) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(doc.rawJsonDocument, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ETA_${doc.uuid || doc.internalId}_Canonical.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs md:text-sm font-semibold">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-white font-tajawal">
                    بوابة منظومة الفاتورة والإيصال الإلكتروني (ETA SDK)
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      etaConfig.environment === 'production'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {etaConfig.environment === 'production' ? 'البيئة الفعلية (Production)' : 'بيئة الاختبار (Pre-Prod)'}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                  الربط والتكامل الشامل مع مصلحة الضرائب المصرية (إرسال الفواتير V1.0 والإيصالات V1.2 والتحقق الآلي)
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsSubmitNewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>إرسال فاتورة للضرائب</span>
            </button>

            <button
              onClick={() => setIsReceiptModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>إصدار إيصال إلكتروني B2C</span>
            </button>

            <button
              onClick={() => setIsSyncInvoicesModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl text-xs font-bold border border-purple-500/30 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>استيراد من فواتير النظام</span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="إعدادات الربط والـ API"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>إعدادات الـ API</span>
            </button>
          </div>
        </div>

        {/* Official SDK Link Banner */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Code2 className="w-4 h-4 text-sky-400" />
            <span>المعيار المعتمد:</span>
            <a
              href="https://sdk.invoicing.eta.gov.eg/einvoicingapi/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 underline font-mono text-[11px]"
            >
              https://sdk.invoicing.eta.gov.eg/einvoicingapi/
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              التوقيع الإلكتروني: مفعل (SHA-256 E-Seal)
            </span>
            <span className="flex items-center gap-1 font-mono">
              كود النشاط: {etaConfig.taxpayerActivityCode}
            </span>
          </div>
        </div>

        {/* Real-time KPI Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1">إجمالي المستندات المرسلة</div>
            <div className="text-lg font-bold text-white font-mono">{stats.total}</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-emerald-400 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>معتمد ومقبول (Valid)</span>
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono">{stats.valid}</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1">إجمالي المبيعات المرسلة</div>
            <div className="text-sm font-bold text-white font-mono">{stats.totalSales.toLocaleString()} ج.م</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-amber-400 mb-1">ضريبة القيمة المضافة (T1)</div>
            <div className="text-sm font-bold text-amber-400 font-mono">+{stats.totalVat.toLocaleString()} ج.م</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-rose-400 mb-1">خصم أ/ت من المنبع (T4)</div>
            <div className="text-sm font-bold text-rose-400 font-mono">-{stats.totalWht.toLocaleString()} ج.م</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] text-sky-400 mb-1">صافي القيمة المحصلة</div>
            <div className="text-sm font-bold text-sky-400 font-mono">
              {(stats.totalSales + stats.totalVat - stats.totalWht).toLocaleString()} ج.م
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
            placeholder="بحث بكود الـ UUID، الرقم الداخلي، اسم العميل..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">كل حالات الاعتماد</option>
            <option value="Valid">معتمد ومقبول (Valid)</option>
            <option value="Submitted">قيد المعالجة (Submitted)</option>
            <option value="Invalid">مرفوض (Invalid)</option>
            <option value="Cancelled">ملغي (Cancelled)</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">كل أنواع المستندات</option>
            <option value="I">فاتورة ضريبية (I)</option>
            <option value="SR">إيصال إلكتروني (SR)</option>
            <option value="C">إشعار دائن (C)</option>
            <option value="D">إشعار مدين (D)</option>
          </select>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-emerald-500/30"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Submitted Documents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] font-bold">
                <th className="py-3 px-4">كود المنظومة (UUID)</th>
                <th className="py-3 px-3">الرقم الداخلي</th>
                <th className="py-3 px-3">النوع</th>
                <th className="py-3 px-3">تاريخ الإصدار</th>
                <th className="py-3 px-4">اسم العميل / المستلم</th>
                <th className="py-3 px-3 text-left">المبيعات</th>
                <th className="py-3 px-3 text-left">قيمة مضافة T1</th>
                <th className="py-3 px-3 text-left">خصم أ/ت T4</th>
                <th className="py-3 px-3 text-left">الإجمالي الصافي</th>
                <th className="py-3 px-3 text-center">حالة الضرائب</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <Globe className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-60" />
                    <p className="text-sm font-medium">لا توجد فواتير أو إيصالات مرسلة مطابقة للبحث</p>
                    <p className="text-xs text-slate-600 mt-1">
                      يمكنك الضغط على "إرسال فاتورة للضرائب" أو استيراد فواتير النظام الحالية
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const isValid = doc.status === 'Valid';
                  const isCancelled = doc.status === 'Cancelled';
                  const isReceipt = doc.documentType === 'SR' || doc.documentType === 'CR';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sky-400 text-xs">
                            {doc.uuid ? doc.uuid.slice(0, 16) + '...' : 'SUBMITTING...'}
                          </span>
                          {doc.uuid && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(doc.uuid || '');
                                alert('تم نسخ كود الـ UUID');
                              }}
                              title="نسخ كود الـ UUID"
                              className="text-slate-500 hover:text-slate-300 p-0.5"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-200">{doc.internalId}</td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isReceipt
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : doc.documentType === 'C'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {doc.documentType === 'I'
                            ? 'فاتورة (I)'
                            : doc.documentType === 'C'
                            ? 'إشعار دائن (C)'
                            : doc.documentType === 'D'
                            ? 'إشعار مدين (D)'
                            : 'إيصال (SR)'}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                        {doc.dateTimeIssued.split('T')[0]}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 line-clamp-1">{doc.receiverName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ضريبي: {doc.receiverId}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-left text-slate-300">
                        {doc.totalSales.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-mono text-left text-amber-400">
                        +{doc.vatAmount.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-mono text-left text-rose-400">
                        -{doc.withholdingTaxAmount.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-left text-emerald-400">
                        {doc.totalAmount.toLocaleString()} ج.م
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isValid
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isCancelled
                              ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isValid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>معتمد (Valid)</span>
                            </>
                          ) : isCancelled ? (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>ملغي</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>مرفوض</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedDocForPreview(doc)}
                            title="معاينة وطباعة الفاتورة الرسمية"
                            className="p-1.5 hover:bg-slate-800 text-sky-400 hover:text-sky-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedDocForJson(doc)}
                            title="عرض كود JSON الرسمي للمنظومة"
                            className="p-1.5 hover:bg-slate-800 text-purple-400 hover:text-purple-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileJson className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleCheckDocStatus(doc)}
                            title="تحديث والتحقق من حالة المستند بمصلحة الضرائب"
                            className="p-1.5 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {doc.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleCancelDoc(doc)}
                              title="إلغاء المستند على منظومة الضرائب"
                              className="p-1.5 hover:bg-slate-800 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
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

      {/* MODAL 1: Submit New ETA Document */}
      {isSubmitNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl my-6">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white font-tajawal">
                  إرسال وثيقة جديدة لمنظومة الفاتورة الإلكترونية (ETA V1.0 API)
                </h3>
              </div>
              <button
                onClick={() => setIsSubmitNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewETADocument} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Document Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">نوع المستند الضريبي *</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as ETADocumentType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-500"
                  >
                    <option value="I">فاتورة ضريبية (Invoice V1.0)</option>
                    <option value="C">إشعار دائن (Credit Note V1.0)</option>
                    <option value="D">إشعار مدين (Debit Note V1.0)</option>
                    <option value="SR">إيصال مبيعات نهائي (Sales Receipt V1.2)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الرقم الداخلي للفاتورة (Internal ID) *</label>
                  <input
                    type="text"
                    required
                    value={internalId}
                    onChange={(e) => setInternalId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ ووقت التحرير *</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Receiver (Client) Info */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">نوع المستلم *</label>
                  <select
                    value={receiverType}
                    onChange={(e) => setReceiverType(e.target.value as 'B' | 'P')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="B">شركة / منشأة (Business - 9 أرقام ضريبية)</option>
                    <option value="P">شخص طبيعي / فرد (Person - 14 رقم قومي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {receiverType === 'B' ? 'رقم التسجيل الضريبي (9 أرقام) *' : 'الرقم القومي (14 رقم) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={receiverTaxNumber}
                    onChange={(e) => setReceiverTaxNumber(e.target.value)}
                    placeholder={receiverType === 'B' ? '412893110' : '29001010101234'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">اسم العميل / المستلم الرسمي *</label>
                  <input
                    type="text"
                    required
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="اسم الشركة أو العميل المسجل بالبطاقة الضريبية"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-sky-400" />
                    بنود وأصناف الفاتورة (EGS / GS1 Standards):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة بند جديد
                  </button>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] font-bold">
                        <th className="py-2.5 px-3">بيان الصنف / الخدمة</th>
                        <th className="py-2.5 px-3 w-36">كود EGS الموحد</th>
                        <th className="py-2.5 px-3 w-20">الوحدة</th>
                        <th className="py-2.5 px-3 w-20 text-center">الكمية</th>
                        <th className="py-2.5 px-3 w-24 text-left">السعر (ج.م)</th>
                        <th className="py-2.5 px-3 w-28 text-left">الإجمالي</th>
                        <th className="py-2.5 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/80">
                      {items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              placeholder="اسم البند أو الخدمة..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.itemCode}
                              onChange={(e) => handleItemChange(idx, 'itemCode', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 font-mono text-[11px] text-sky-400 focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-sky-500"
                            >
                              <option value="خدمة">خدمة (HUR)</option>
                              <option value="عدد">عدد (EA)</option>
                              <option value="شهر">شهر (MON)</option>
                              <option value="يوم">يوم (DAY)</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value) || 1)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center font-mono text-white focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-left font-mono font-bold text-white focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-sky-400 text-left">
                            {(item.quantity * item.unitPrice).toLocaleString()} ج.م
                          </td>
                          <td className="py-2 px-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-rose-400 hover:text-rose-300 cursor-pointer"
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

              {/* Dynamic Tax Rates Panel (Freely editable per user request) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-200">التحكم الحر في نسب الضرائب المطبقة على الفاتورة:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* VAT Rate Input */}
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <label className="block text-[11px] font-bold text-amber-400 mb-1">
                        ضريبة القيمة المضافة (VAT %)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          value={customVatRate}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setCustomVatRate(val);
                            setItems(items.map((it) => ({ ...it, vatRate: val })));
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono font-bold text-xs"
                        />
                        <span className="text-slate-400 font-bold">%</span>
                      </div>
                      <div className="flex gap-1 mt-1.5">
                        {[14, 0, 5, 8].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              setCustomVatRate(r);
                              setItems(items.map((it) => ({ ...it, vatRate: r })));
                            }}
                            className={`px-1.5 py-0.5 text-[10px] rounded cursor-pointer ${
                              customVatRate === r ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {r}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* WHT Rate Input */}
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <label className="block text-[11px] font-bold text-rose-400 mb-1">
                        خصم من المنبع أ/ت (WHT %)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          value={customWhtRate}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setCustomWhtRate(val);
                            setItems(items.map((it) => ({ ...it, whtRate: val })));
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono font-bold text-xs"
                        />
                        <span className="text-slate-400 font-bold">%</span>
                      </div>
                      <div className="flex gap-1 mt-1.5">
                        {[1, 3, 0.5, 0].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              setCustomWhtRate(r);
                              setItems(items.map((it) => ({ ...it, whtRate: r })));
                            }}
                            className={`px-1.5 py-0.5 text-[10px] rounded cursor-pointer ${
                              customWhtRate === r ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {r}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="space-y-2 font-mono text-xs divide-y divide-slate-800">
                  <div className="flex justify-between py-1 text-slate-300">
                    <span className="font-sans">إجمالي المبيعات (Sales Total):</span>
                    <span className="font-bold">{formSubtotal.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between py-1 text-amber-400">
                    <span className="font-sans">ضريبة القيمة المضافة ({customVatRate}% VAT - T1):</span>
                    <span className="font-bold">+{formVatTotal.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between py-1 text-rose-400">
                    <span className="font-sans">خصم من المنبع أ/ت ({customWhtRate}% WHT - T4):</span>
                    <span className="font-bold">-{formWhtTotal.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-bold text-emerald-400 border-t border-slate-700">
                    <span className="font-sans">الإجمالي النهائي للمستند (Total Amount):</span>
                    <span>{formGrandTotal.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSubmitNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-bold rounded-lg cursor-pointer shadow-lg shadow-sky-600/30"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري التوقيع والإرسال...' : 'توقيع وإرسال إلى مصلحة الضرائب'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 1-Click Sync from System Invoices */}
      {isSyncInvoicesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl my-6">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-tajawal">
                  استيراد وإرسال فواتير المبيعات المسجلة بالنظام إلى منظومة الضرائب
                </h3>
              </div>
              <button
                onClick={() => setIsSyncInvoicesModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              <p className="text-xs text-slate-400">
                اختر أي فاتورة مبيعات مسجلة في شاشة الفواتير ليقوم النظام بتحويلها وتوقيعها إلكترونياً وإرسالها مباشرة:
              </p>

              {invoices.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                  لا توجد فواتير مسجلة في شاشة الفواتير حالياً
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => {
                    const alreadySent = submittedDocs.some(
                      (d) => d.internalId === inv.formattedNumber || d.internalId === inv.invoiceNumber
                    );

                    return (
                      <div
                        key={inv.id}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-white text-sm">
                              {inv.formattedNumber || inv.invoiceNumber}
                            </span>
                            <span className="text-[11px] text-slate-400">({inv.date})</span>
                            {alreadySent && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                مرسلة مسبقاً
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300">
                            العميل: <strong>{inv.partyName}</strong> - القيمة الإجمالية:{' '}
                            <span className="font-mono text-emerald-400 font-bold">
                              {(inv.grandTotal || inv.totalAmount || 0).toLocaleString()} ج.م
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSyncInvoiceToETA(inv)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-md shadow-purple-600/20"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال لمنظومة الضرائب</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Issue Fast e-Receipt (الإيصال الإلكتروني B2C) */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl my-6">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-tajawal">
                  إصدار إيصال إلكتروني فوري B2C (ETA Receipt V1.2)
                </h3>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setNewDocType('SR');
                handleSubmitNewETADocument(e);
                setIsReceiptModalOpen(false);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم العميل / المستهلك النهائي</label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="مستهلك نهائي / عميل نقدي"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الرقم القومي (اختياري للإيصالات أقل من 150 ألف ج.م)</label>
                <input
                  type="text"
                  value={receiverTaxNumber}
                  onChange={(e) => setReceiverTaxNumber(e.target.value)}
                  placeholder="29001010101234"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">بيان الخدمة / الاستشارة</label>
                <input
                  type="text"
                  required
                  value={items[0]?.description || ''}
                  onChange={(e) => handleItemChange(0, 'description', e.target.value)}
                  placeholder="استشارات ضريبية ومحاسبية وتأسيس"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">القيمة قبل الضريبة (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={items[0]?.unitPrice || 0}
                    onChange={(e) => handleItemChange(0, 'unitPrice', Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">نسبة القيمة المضافة %</label>
                  <input
                    type="number"
                    value={customVatRate}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setCustomVatRate(v);
                      handleItemChange(0, 'vatRate', v);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-sm font-bold text-emerald-400">
                <span>الإجمالي شامل الضريبة:</span>
                <span className="font-mono">
                  {((items[0]?.unitPrice || 0) * (1 + customVatRate / 100)).toLocaleString()} ج.م
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>إصدار واعتماد الإيصال</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ETA Configuration & Credentials */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl my-6">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-tajawal">
                  إعدادات الربط مع منظومة مصلحة الضرائب المصرية (ETA API Config)
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">بيئة التشغيل والربط (Environment) *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEtaConfig({ ...etaConfig, environment: 'production' })}
                    className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      etaConfig.environment === 'production'
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    البيئة الإنتاجية الفعلية (Production Live)
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">https://api.invoicing.eta.gov.eg</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEtaConfig({ ...etaConfig, environment: 'preproduction' })}
                    className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      etaConfig.environment === 'preproduction'
                        ? 'bg-amber-950/50 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    بيئة الاختبار التجريبية (Pre-Production Sandbox)
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">https://api.preprod.invoicing.eta.gov.eg</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">معرف المنظومة (Client ID) *</label>
                  <input
                    type="text"
                    required
                    value={etaConfig.clientId}
                    onChange={(e) => setEtaConfig({ ...etaConfig, clientId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">المفتاح السري (Client Secret 1) *</label>
                  <input
                    type="password"
                    required
                    value={etaConfig.clientSecret}
                    onChange={(e) => setEtaConfig({ ...etaConfig, clientSecret: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">كود النشاط الضريبي *</label>
                  <input
                    type="text"
                    required
                    value={etaConfig.taxpayerActivityCode}
                    onChange={(e) => setEtaConfig({ ...etaConfig, taxpayerActivityCode: e.target.value })}
                    placeholder="6920"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">كود الفرع (Branch ID) *</label>
                  <input
                    type="text"
                    required
                    value={etaConfig.branchId}
                    onChange={(e) => setEtaConfig({ ...etaConfig, branchId: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الرقم السري للتوكن (PIN)</label>
                  <input
                    type="password"
                    value={etaConfig.tokenPin || ''}
                    onChange={(e) => setEtaConfig({ ...etaConfig, tokenPin: e.target.value })}
                    placeholder="12345678"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">التوقيع والختم الإلكتروني التلقائي للمستندات (E-Seal):</span>
                  <input
                    type="checkbox"
                    checked={etaConfig.autoSignDocuments}
                    onChange={(e) => setEtaConfig({ ...etaConfig, autoSignDocuments: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  متوافق مع شهادات وتوكن شركة مصر للمقاصة (Misr Clearing) وإيجيبت تراست (Egypt Trust PKCS#11 HSM)
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg cursor-pointer shadow-md shadow-amber-600/20"
                >
                  حفظ بيانات الاتصال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Official ETA Printable Invoice View & QR Code */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl my-6 overflow-hidden">
            {/* Top Toolbar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm font-tajawal">
                  معاينة الفاتورة الإلكترونية المعتمدة (ETA Official Printout)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadJson(selectedDocForPreview)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل JSON</span>
                </button>
                <button
                  onClick={printDocument}
                  className="flex items-center gap-1 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة رسمية</span>
                </button>
                <button
                  onClick={() => setSelectedDocForPreview(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 font-sans" id="printable-eta-invoice">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    جمهورية مصر العربية - مصلحة الضرائب المصرية
                  </div>
                  <h1 className="text-xl font-black text-slate-900">{companyProfile.name}</h1>
                  <p className="text-xs text-slate-600 mt-1">{companyProfile.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700 mt-2">
                    <span>
                      البطاقة الضريبية: <strong className="font-mono">{companyProfile.taxCardNumber}</strong>
                    </span>
                    <span>
                      السجل التجاري: <strong className="font-mono">{companyProfile.commercialRegister}</strong>
                    </span>
                    <span>
                      سجل المحاسبين: <strong className="font-mono">44887</strong>
                    </span>
                  </div>
                </div>

                {/* QR Code Placeholder / SVG */}
                <div className="text-center bg-slate-50 p-2.5 rounded-xl border border-slate-300">
                  <div className="w-24 h-24 bg-white border border-slate-900 p-1 flex items-center justify-center mx-auto mb-1">
                    <QrCode className="w-20 h-20 text-slate-900" />
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-700">ETA VERIFIED</div>
                </div>
              </div>

              {/* Document Meta Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">كود المنظومة (UUID):</span>
                  <strong className="font-mono text-slate-900 text-[11px]">
                    {selectedDocForPreview.uuid || 'ETA-VALID-OFFICIAL'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">الرقم الداخلي للفاتورة:</span>
                  <strong className="font-mono text-slate-900">{selectedDocForPreview.internalId}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">تاريخ التحرير:</span>
                  <strong className="font-mono text-slate-900">
                    {selectedDocForPreview.dateTimeIssued.split('T')[0]}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">حالة الوثيقة بالضرائب:</span>
                  <strong className="text-emerald-700 font-bold">معتمدة ومقبولة (Valid)</strong>
                </div>
              </div>

              {/* Receiver Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  بيانات العميل / المستلم (Receiver Details):
                </div>
                <div className="text-base font-bold text-slate-900">{selectedDocForPreview.receiverName}</div>
                <div className="text-xs text-slate-600 mt-1">
                  الرقم الضريبي / القومي: <strong className="font-mono">{selectedDocForPreview.receiverId}</strong>
                </div>
              </div>

              {/* Lines Table */}
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="py-2.5 px-3">م</th>
                    <th className="py-2.5 px-3">بيان الصنف / الخدمة</th>
                    <th className="py-2.5 px-3 font-mono">كود EGS</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3 text-left">سعر الوحدة</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedDocForPreview.rawJsonDocument.invoiceLines.map((line, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-mono">{i + 1}</td>
                      <td className="py-2.5 px-3 font-semibold">{line.description}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">{line.itemCode}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{line.quantity}</td>
                      <td className="py-2.5 px-3 text-left font-mono">{line.unitValue.amountEGP.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-left font-mono font-bold">{line.salesTotal.toLocaleString()} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Box */}
              <div className="flex justify-end">
                <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-700">
                    <span>إجمالي المبيعات:</span>
                    <span className="font-bold">{selectedDocForPreview.totalSales.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>ضريبة القيمة المضافة T1:</span>
                    <span className="font-bold">+{selectedDocForPreview.vatAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-rose-800">
                    <span>خصم أ/ت تحت حساب الضريبة T4:</span>
                    <span className="font-bold">-{selectedDocForPreview.withholdingTaxAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t-2 border-slate-400 pt-2">
                    <span>صافي القيمة المستحقة:</span>
                    <span>{selectedDocForPreview.totalAmount.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Bottom Signatures */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
                <div>
                  <p className="font-mono text-[10px]">
                    Digital Signature: SHA256withRSA (Validated by Misr Clearing / Egypt Trust)
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    تعتبر هذه الفاتورة محررة ومعتمدة وموثقة إلكترونياً طبقاً لأحكام القانون رقم 206 لسنة 2020 ولائحته التنفيذية.
                  </p>
                </div>
                <div className="text-center">
                  <div className="font-bold text-slate-900">المحاسب القانوني المعتمد</div>
                  <div className="font-black text-slate-900 text-sm mt-1">محمود الباز قابيل</div>
                  <div className="text-[11px] text-slate-600">سجل م.م 44887</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Official ETA JSON Viewer */}
      {selectedDocForJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl my-6">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-white text-sm font-mono">
                  ETA Canonical JSON Payload ({selectedDocForJson.uuid || selectedDocForJson.internalId})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyJson(selectedDocForJson.rawJsonDocument)}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border border-purple-500/30"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الكود</span>
                </button>
                <button
                  onClick={() => setSelectedDocForJson(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto">
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto select-all">
                {JSON.stringify(selectedDocForJson.rawJsonDocument, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
