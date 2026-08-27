// ETA e-Invoicing & e-Receipt SDK Types according to https://sdk.invoicing.eta.gov.eg/einvoicingapi/

export type ETADocumentType = 'I' | 'C' | 'D' | 'SR' | 'CR'; // I: Invoice, C: Credit, D: Debit, SR: Sales Receipt, CR: Return Receipt
export type ETADocumentVersion = '1.0' | '0.9' | '1.2';
export type ETAEnvironment = 'preproduction' | 'production';
export type ETASubmissionStatus = 'Submitted' | 'Valid' | 'Invalid' | 'Cancelled' | 'Rejected';

export interface ETAAddress {
  branchID: string;
  country: string; // "EG"
  governorate: string; // e.g. "Cairo" or "Giza"
  regionCity: string;
  street: string;
  buildingNumber: string;
  postalCode?: string;
  floor?: string;
  room?: string;
  landmark?: string;
  additionalInformation?: string;
}

export interface ETAEntity {
  address: ETAAddress;
  type: 'B' | 'P' | 'F'; // B: Business, P: Natural Person, F: Foreigner
  id: string; // 9-digit tax registration number or 14-digit National ID or Passport
  name: string;
}

export interface ETATaxableItem {
  taxType: string; // T1 (VAT), T2 (Table Tax), T4 (Withholding Tax / خصم من المنبع), T3, etc.
  amount: number;
  subType: string; // V009 (General 14%), W001 (Withholding 1%), etc.
  rate: number; // percentage rate e.g. 14, 1, 5
}

export interface ETAInvoiceLine {
  description: string;
  itemType: 'GS1' | 'EGS';
  itemCode: string;
  unitType: string; // EA, HUR, DAY, MON, KGM, etc.
  quantity: number;
  internalCode?: string;
  unitValue: {
    currencySold: string; // "EGP"
    amountEGP: number;
    amountSold?: number;
    currencyExchangeRate?: number;
  };
  salesTotal: number;
  total: number; // salesTotal - discount
  valueDifference: number;
  totalTaxableFees: number;
  netTotal: number;
  itemsDiscount: number;
  discount?: {
    rate: number;
    amount: number;
  };
  taxableItems: ETATaxableItem[];
}

export interface ETATaxTotal {
  taxType: string;
  amount: number;
}

export interface ETASignature {
  signatureType: 'I' | 'C';
  value: string;
}

export interface ETADocument {
  issuer: ETAEntity;
  receiver: ETAEntity;
  documentType: ETADocumentType;
  documentTypeVersion: ETADocumentVersion;
  dateTimeIssued: string; // ISO 8601 UTC
  taxpayerActivityCode: string; // e.g. "6920"
  internalID: string;
  purchaseOrderReference?: string;
  purchaseOrderDescription?: string;
  salesOrderReference?: string;
  salesOrderDescription?: string;
  proformaInvoiceNumber?: string;
  payment?: {
    bankName?: string;
    bankAddress?: string;
    bankAccountNo?: string;
    bankAccountIBAN?: string;
    swiftCode?: string;
    terms?: string;
  };
  delivery?: {
    approach?: string;
    packaging?: string;
    dateValidity?: string;
    exportPort?: string;
    countryOfOrigin?: string;
    grossWeight?: number;
    netWeight?: number;
    terms?: string;
  };
  invoiceLines: ETAInvoiceLine[];
  totalDiscountAmount: number;
  totalSalesAmount: number;
  netAmount: number;
  taxTotals: ETATaxTotal[];
  totalAmount: number;
  extraDiscountAmount: number;
  totalItemsDiscountAmount: number;
  signatures?: ETASignature[];
}

export interface ETASubmittedDocument {
  id: string; // Local storage internal ID
  uuid?: string; // ETA generated universal unique identifier
  submissionUUID?: string; // Package submission UUID
  longId?: string; // ETA public long identifier for verification URL
  internalId: string;
  documentType: ETADocumentType;
  documentTypeVersion: ETADocumentVersion;
  dateTimeIssued: string;
  dateTimeReceived?: string;
  issuerTaxNumber: string;
  issuerName: string;
  receiverId: string;
  receiverName: string;
  totalSales: number;
  netAmount: number;
  vatAmount: number;
  withholdingTaxAmount: number;
  totalAmount: number;
  status: ETASubmissionStatus;
  statusReason?: string;
  validationErrors?: Array<{
    code: string;
    message: string;
    target?: string;
  }>;
  etaVerificationUrl?: string;
  qrCodeContent?: string;
  rawJsonDocument: ETADocument;
  createdAt: string;
  syncedInvoiceId?: string;
}

export interface ETAConfig {
  environment: ETAEnvironment;
  clientId: string;
  clientSecret: string;
  taxpayerActivityCode: string;
  branchId: string;
  tokenPin?: string;
  useSoftCertificate: boolean;
  tokenExpiry?: string;
  posSerialNumber?: string; // For e-Receipt
  posOsVersion?: string;
  defaultVatRate: number; // default 14
  defaultWithholdingRate: number; // default 1
  autoSignDocuments: boolean;
}
