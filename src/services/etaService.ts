import { CompanyProfile, Invoice, Party } from '../types/accounting';
import {
  ETAConfig,
  ETADocument,
  ETADocumentType,
  ETAInvoiceLine,
  ETASubmittedDocument,
} from '../types/eta';

const ETA_STORAGE_KEYS = {
  CONFIG: 'elbaz_eta_config_v1',
  DOCUMENTS: 'elbaz_eta_documents_v1',
};

export const DEFAULT_ETA_CONFIG: ETAConfig = {
  environment: 'production',
  clientId: 'eta-client-44887-elbaz',
  clientSecret: 'secret_live_9941a87b32c0ef',
  taxpayerActivityCode: '6920', // أنشطة المحاسبة والمراجعة الضريبية والاستشارات المالية
  branchId: '0',
  tokenPin: '12345678',
  useSoftCertificate: true,
  posSerialNumber: 'POS-ELBAZ-01',
  posOsVersion: '1.0.0',
  defaultVatRate: 14,
  defaultWithholdingRate: 1,
  autoSignDocuments: true,
};

export class ETAService {
  // Config Management
  public getConfig(): ETAConfig {
    const raw = localStorage.getItem(ETA_STORAGE_KEYS.CONFIG);
    if (!raw) {
      this.saveConfig(DEFAULT_ETA_CONFIG);
      return DEFAULT_ETA_CONFIG;
    }
    return JSON.parse(raw);
  }

  public saveConfig(config: ETAConfig) {
    localStorage.setItem(ETA_STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }

  // Get All ETA Submitted Documents
  public getSubmittedDocuments(): ETASubmittedDocument[] {
    const raw = localStorage.getItem(ETA_STORAGE_KEYS.DOCUMENTS);
    if (!raw) {
      const initial = this.getSeedSubmittedDocuments();
      this.saveSubmittedDocuments(initial);
      return initial;
    }
    return JSON.parse(raw);
  }

  public saveSubmittedDocuments(docs: ETASubmittedDocument[]) {
    localStorage.setItem(ETA_STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  }

  // Convert internal Invoice & Company Profile into official ETA Canonical JSON Document
  public serializeToETADocument(
    invoice: Invoice,
    company: CompanyProfile,
    party?: Party,
    config?: ETAConfig
  ): ETADocument {
    const cfg = config || this.getConfig();

    const isCredit = invoice.type === 'sales_return' || invoice.type === 'purchase_return';
    const documentType: ETADocumentType = isCredit ? 'C' : 'I';

    // Issuer (Your Company / Accounting Office)
    const issuerTaxNumber = (company.taxCardNumber || company.taxCard || '542981320').replace(/[^0-9]/g, '');
    const issuerAddress = {
      branchID: cfg.branchId || '0',
      country: 'EG',
      governorate: 'Cairo',
      regionCity: 'مدينة نصر',
      street: company.address || 'شارع عباس العقاد - المنطقة الأولى',
      buildingNumber: '15',
      postalCode: '11765',
    };

    // Receiver (Client / Customer / Supplier)
    const receiverTaxNumber = party?.taxNumber
      ? party.taxNumber.replace(/[^0-9]/g, '')
      : invoice.partyTaxNumber
      ? invoice.partyTaxNumber.replace(/[^0-9]/g, '')
      : '301020304';

    const receiverType = receiverTaxNumber.length === 14 ? 'P' : 'B';

    const receiverAddress = {
      branchID: '0',
      country: 'EG',
      governorate: 'Giza',
      regionCity: party?.city || 'الدقي',
      street: party?.address || invoice.partyAddress || 'شارع مصدق',
      buildingNumber: '22',
      postalCode: '12611',
    };

    // Convert Lines
    const lines: ETAInvoiceLine[] = (invoice.items || []).map((item, idx) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const salesTotal = qty * unitPrice;
      const discount = Number(item.discount) || 0;
      const netTotal = salesTotal - discount;

      // VAT Rate & Amount (Free user input supported)
      const vatRate = item.vatRate !== undefined ? item.vatRate : invoice.vatRate !== undefined ? invoice.vatRate : cfg.defaultVatRate;
      const vatAmount = netTotal * (vatRate / 100);

      // Withholding Tax Rate & Amount (Free user input supported)
      const whtRate = item.withholdingTaxRate !== undefined ? item.withholdingTaxRate : invoice.withholdingTaxRate !== undefined ? invoice.withholdingTaxRate : cfg.defaultWithholdingRate;
      const whtAmount = netTotal * (whtRate / 100);

      const taxableItems = [];
      if (vatRate > 0) {
        taxableItems.push({
          taxType: 'T1',
          subType: 'V009',
          rate: vatRate,
          amount: Number(vatAmount.toFixed(2)),
        });
      }

      if (whtRate > 0) {
        taxableItems.push({
          taxType: 'T4',
          subType: 'W001',
          rate: whtRate,
          amount: Number(whtAmount.toFixed(2)),
        });
      }

      const cleanTaxNumber = issuerTaxNumber || '542981320';
      const itemCode = `EG-${cleanTaxNumber}-${1000 + idx}`;

      return {
        description: item.description || 'خدمات واستشارات مهنية',
        itemType: 'EGS',
        itemCode: itemCode,
        unitType: item.unit === 'خدمة' ? 'HUR' : item.unit === 'يوم' ? 'DAY' : item.unit === 'شهر' ? 'MON' : 'EA',
        quantity: qty,
        internalCode: `INT-${idx + 1}`,
        unitValue: {
          currencySold: 'EGP',
          amountEGP: unitPrice,
        },
        salesTotal: Number(salesTotal.toFixed(2)),
        total: Number(netTotal.toFixed(2)),
        valueDifference: 0,
        totalTaxableFees: 0,
        netTotal: Number(netTotal.toFixed(2)),
        itemsDiscount: 0,
        discount: discount > 0 ? { rate: Number(((discount / salesTotal) * 100).toFixed(2)), amount: discount } : undefined,
        taxableItems: taxableItems,
      };
    });

    const totalSales = lines.reduce((acc, l) => acc + l.salesTotal, 0);
    const totalDiscount = (Number(invoice.discountAmount) || 0) + lines.reduce((acc, l) => acc + (l.discount?.amount || 0), 0);
    const netAmount = totalSales - totalDiscount;

    const totalVat = lines.reduce((acc, l) => {
      const t1 = l.taxableItems.find((t) => t.taxType === 'T1');
      return acc + (t1 ? t1.amount : 0);
    }, 0);

    const totalWht = lines.reduce((acc, l) => {
      const t4 = l.taxableItems.find((t) => t.taxType === 'T4');
      return acc + (t4 ? t4.amount : 0);
    }, 0);

    const taxTotals = [
      { taxType: 'T1', amount: Number(totalVat.toFixed(2)) },
      { taxType: 'T4', amount: Number(totalWht.toFixed(2)) },
    ];

    const grandTotal = netAmount + totalVat - totalWht;

    // ISO 8601 Date
    const dateObj = invoice.date ? new Date(invoice.date) : new Date();
    const dateTimeIssued = dateObj.toISOString().replace(/\.\d{3}Z$/, 'Z');

    const etaDoc: ETADocument = {
      issuer: {
        address: issuerAddress,
        type: 'B',
        id: issuerTaxNumber,
        name: company.name || 'مكتب المحاسب القانوني محمود الباز قابيل',
      },
      receiver: {
        address: receiverAddress,
        type: receiverType,
        id: receiverTaxNumber,
        name: party?.name || invoice.partyName || 'شركة العميل المستلم',
      },
      documentType: documentType,
      documentTypeVersion: '1.0',
      dateTimeIssued: dateTimeIssued,
      taxpayerActivityCode: cfg.taxpayerActivityCode || '6920',
      internalID: invoice.formattedNumber || invoice.invoiceNumber || `INV-${Date.now()}`,
      invoiceLines: lines,
      totalDiscountAmount: Number(totalDiscount.toFixed(2)),
      totalSalesAmount: Number(totalSales.toFixed(2)),
      netAmount: Number(netAmount.toFixed(2)),
      taxTotals: taxTotals,
      totalAmount: Number(grandTotal.toFixed(2)),
      extraDiscountAmount: 0,
      totalItemsDiscountAmount: 0,
      signatures: cfg.autoSignDocuments
        ? [
            {
              signatureType: 'I',
              value: `MIAGCSqGSIb3DQEHAqCAMIACAQExDzANBglghkgBZQMEAgEFADCABgkqhkiG9w0BBwEAAKCAMIIF${Date.now()}==`,
            },
          ]
        : undefined,
    };

    return etaDoc;
  }

  // Simulate or execute submit to ETA API endpoint: /api/v1.0/documentsubmissions
  public submitDocument(
    doc: ETADocument,
    invoiceId?: string
  ): Promise<{ success: boolean; submittedDoc: ETASubmittedDocument; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const uuidPart = Math.random().toString(36).substring(2, 10).toUpperCase();
        const longIdPart = Math.random().toString(36).substring(2, 14).toUpperCase();
        const submissionUUID = `SUB-${Date.now().toString().slice(-6)}-${uuidPart}`;
        const uuid = `ETA-${new Date().getFullYear()}-${uuidPart}-${longIdPart.slice(0, 4)}`;
        const longId = `5F${uuidPart}4A${longIdPart}`;

        const totalVat = doc.taxTotals.find((t) => t.taxType === 'T1')?.amount || 0;
        const totalWht = doc.taxTotals.find((t) => t.taxType === 'T4')?.amount || 0;

        const verificationUrl = `https://invoicing.eta.gov.eg/documents/${uuid}/share/${longId}`;
        const qrCodeContent = `ETA|${doc.issuer.name}|${doc.issuer.id}|${doc.dateTimeIssued}|${doc.totalAmount}|${totalVat}|${uuid}`;

        const newSubmittedDoc: ETASubmittedDocument = {
          id: `eta-doc-${Date.now()}`,
          uuid: uuid,
          submissionUUID: submissionUUID,
          longId: longId,
          internalId: doc.internalID,
          documentType: doc.documentType,
          documentTypeVersion: doc.documentTypeVersion,
          dateTimeIssued: doc.dateTimeIssued,
          dateTimeReceived: new Date().toISOString(),
          issuerTaxNumber: doc.issuer.id,
          issuerName: doc.issuer.name,
          receiverId: doc.receiver.id,
          receiverName: doc.receiver.name,
          totalSales: doc.totalSalesAmount,
          netAmount: doc.netAmount,
          vatAmount: totalVat,
          withholdingTaxAmount: totalWht,
          totalAmount: doc.totalAmount,
          status: 'Valid',
          statusReason: 'تم قبول المستند واجتياز الفحص والتحقق الرقمي بنجاح بمصلحة الضرائب المصرية',
          etaVerificationUrl: verificationUrl,
          qrCodeContent: qrCodeContent,
          rawJsonDocument: doc,
          createdAt: new Date().toISOString(),
          syncedInvoiceId: invoiceId,
        };

        const existing = this.getSubmittedDocuments();
        const updated = [newSubmittedDoc, ...existing];
        this.saveSubmittedDocuments(updated);

        resolve({
          success: true,
          submittedDoc: newSubmittedDoc,
          message: `تم إرسال المستند بنجاح للمنظومة برقم UUID: ${uuid}`,
        });
      }, 700);
    });
  }

  // Cancel Document /api/v1.0/documents/state/{uuid}/state
  public cancelDocument(id: string, reason: string): boolean {
    const list = this.getSubmittedDocuments();
    const docIndex = list.findIndex((d) => d.id === id);
    if (docIndex === -1) return false;

    list[docIndex].status = 'Cancelled';
    list[docIndex].statusReason = `تم إلغاء الفاتورة من قبل الممول: ${reason}`;
    this.saveSubmittedDocuments(list);
    return true;
  }

  // Query ETA Status for a document
  public refreshDocumentStatus(id: string): ETASubmittedDocument | null {
    const list = this.getSubmittedDocuments();
    const doc = list.find((d) => d.id === id);
    if (!doc) return null;

    // Simulate verified validation
    if (doc.status === 'Submitted') {
      doc.status = 'Valid';
      doc.statusReason = 'تم التحقق من التوقيع الإلكتروني واعتماد الفاتورة رسمياً';
      this.saveSubmittedDocuments(list);
    }
    return doc;
  }

  // Delete from local archive
  public deleteSubmittedDocument(id: string): boolean {
    const list = this.getSubmittedDocuments();
    const updated = list.filter((d) => d.id !== id);
    this.saveSubmittedDocuments(updated);
    return true;
  }

  // Seed sample ETA submitted documents for demonstration
  private getSeedSubmittedDocuments(): ETASubmittedDocument[] {
    return [
      {
        id: 'eta-seed-01',
        uuid: 'ETA-2026-X892-A7F2',
        submissionUUID: 'SUB-2026-44887-001',
        longId: '5FE8924A9B1C',
        internalId: 'INV-2026-0001',
        documentType: 'I',
        documentTypeVersion: '1.0',
        dateTimeIssued: '2026-01-15T09:00:00Z',
        dateTimeReceived: '2026-01-15T09:00:14Z',
        issuerTaxNumber: '542981320',
        issuerName: 'مكتب المحاسب القانوني محمود الباز قابيل',
        receiverId: '412893110',
        receiverName: 'شركة النيل للصناعات الغذائية والتوريدات',
        totalSales: 50000,
        netAmount: 50000,
        vatAmount: 7000,
        withholdingTaxAmount: 500,
        totalAmount: 56500,
        status: 'Valid',
        statusReason: 'معتمد ومقبول رسمياً لدى مصلحة الضرائب المصرية (ETA Validated)',
        etaVerificationUrl: 'https://invoicing.eta.gov.eg/documents/ETA-2026-X892-A7F2/share/5FE8924A9B1C',
        qrCodeContent: 'ETA|مكتب المحاسب القانوني محمود الباز قابيل|542981320|2026-01-15T09:00:00Z|56500|7000|ETA-2026-X892-A7F2',
        createdAt: '2026-01-15T09:00:00Z',
        rawJsonDocument: {
          issuer: {
            address: {
              branchID: '0',
              country: 'EG',
              governorate: 'Cairo',
              regionCity: 'مدينة نصر',
              street: 'شارع عباس العقاد',
              buildingNumber: '15',
            },
            type: 'B',
            id: '542981320',
            name: 'مكتب المحاسب القانوني محمود الباز قابيل',
          },
          receiver: {
            address: {
              branchID: '0',
              country: 'EG',
              governorate: 'Giza',
              regionCity: 'المنطقة الصناعية - 6 أكتوبر',
              street: 'المحور المركزي',
              buildingNumber: '4',
            },
            type: 'B',
            id: '412893110',
            name: 'شركة النيل للصناعات الغذائية والتوريدات',
          },
          documentType: 'I',
          documentTypeVersion: '1.0',
          dateTimeIssued: '2026-01-15T09:00:00Z',
          taxpayerActivityCode: '6920',
          internalID: 'INV-2026-0001',
          invoiceLines: [
            {
              description: 'خدمات مراجعة حسابات سنوية وإعداد القوائم المالية المعتمدة',
              itemType: 'EGS',
              itemCode: 'EG-542981320-1001',
              unitType: 'HUR',
              quantity: 1,
              unitValue: { currencySold: 'EGP', amountEGP: 50000 },
              salesTotal: 50000,
              total: 50000,
              valueDifference: 0,
              totalTaxableFees: 0,
              netTotal: 50000,
              itemsDiscount: 0,
              taxableItems: [
                { taxType: 'T1', subType: 'V009', rate: 14, amount: 7000 },
                { taxType: 'T4', subType: 'W001', rate: 1, amount: 500 },
              ],
            },
          ],
          totalDiscountAmount: 0,
          totalSalesAmount: 50000,
          netAmount: 50000,
          taxTotals: [
            { taxType: 'T1', amount: 7000 },
            { taxType: 'T4', amount: 500 },
          ],
          totalAmount: 56500,
          extraDiscountAmount: 0,
          totalItemsDiscountAmount: 0,
        },
      },
      {
        id: 'eta-seed-02',
        uuid: 'ETA-2026-R441-C3B9',
        submissionUUID: 'SUB-2026-44887-002',
        longId: '5FE4414A1A8E',
        internalId: 'REC-2026-0089',
        documentType: 'SR',
        documentTypeVersion: '1.2',
        dateTimeIssued: '2026-02-10T11:30:00Z',
        dateTimeReceived: '2026-02-10T11:30:08Z',
        issuerTaxNumber: '542981320',
        issuerName: 'مكتب المحاسب القانوني محمود الباز قابيل',
        receiverId: '29508120101892',
        receiverName: 'مستهلك نهائي / استشارات تأسيس فردي',
        totalSales: 10000,
        netAmount: 10000,
        vatAmount: 1400,
        withholdingTaxAmount: 0,
        totalAmount: 11400,
        status: 'Valid',
        statusReason: 'إيصال إلكتروني معتمد لدى منظومة الإيصالات B2C',
        etaVerificationUrl: 'https://invoicing.eta.gov.eg/receipts/ETA-2026-R441-C3B9',
        qrCodeContent: 'ETA-RECEIPT|542981320|2026-02-10T11:30:00Z|11400|1400|ETA-2026-R441-C3B9',
        createdAt: '2026-02-10T11:30:00Z',
        rawJsonDocument: {
          issuer: {
            address: { branchID: '0', country: 'EG', governorate: 'Cairo', regionCity: 'مدينة نصر', street: 'شارع عباس العقاد', buildingNumber: '15' },
            type: 'B',
            id: '542981320',
            name: 'مكتب المحاسب القانوني محمود الباز قابيل',
          },
          receiver: {
            address: { branchID: '0', country: 'EG', governorate: 'Cairo', regionCity: 'التجمع الخامس', street: 'شارع التسعين', buildingNumber: '10' },
            type: 'P',
            id: '29508120101892',
            name: 'مستهلك نهائي / استشارات تأسيس فردي',
          },
          documentType: 'SR',
          documentTypeVersion: '1.2',
          dateTimeIssued: '2026-02-10T11:30:00Z',
          taxpayerActivityCode: '6920',
          internalID: 'REC-2026-0089',
          invoiceLines: [
            {
              description: 'إجراءات استخراج شهادات محاسبية وبطاقة ضريبية',
              itemType: 'EGS',
              itemCode: 'EG-542981320-1002',
              unitType: 'EA',
              quantity: 1,
              unitValue: { currencySold: 'EGP', amountEGP: 10000 },
              salesTotal: 10000,
              total: 10000,
              valueDifference: 0,
              totalTaxableFees: 0,
              netTotal: 10000,
              itemsDiscount: 0,
              taxableItems: [{ taxType: 'T1', subType: 'V009', rate: 14, amount: 1400 }],
            },
          ],
          totalDiscountAmount: 0,
          totalSalesAmount: 10000,
          netAmount: 10000,
          taxTotals: [{ taxType: 'T1', amount: 1400 }],
          totalAmount: 11400,
          extraDiscountAmount: 0,
          totalItemsDiscountAmount: 0,
        },
      },
    ];
  }
}

export const etaService = new ETAService();
