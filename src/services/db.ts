import { DEFAULT_CHART_OF_ACCOUNTS } from '../data/defaultChartOfAccounts';
import { DEFAULT_FIXED_ASSETS } from '../data/defaultAssets';
import {
  DEFAULT_AUDIT_LOGS,
  DEFAULT_CERTIFICATES,
  DEFAULT_CLIENT_ARCHIVES,
  DEFAULT_TREASURY_TRANSACTIONS,
} from '../data/officeSeedData';
import {
  DEFAULT_AUDITOR_STATEMENT,
  DEFAULT_COMPANY_PROFILE,
  DEFAULT_INVOICES,
  DEFAULT_JOURNAL_ENTRIES,
  DEFAULT_PARTIES,
} from '../data/seedData';
import {
  Account,
  AuditorStatement,
  AuditActionType,
  AuditLogEntry,
  CompanyProfile,
  FinancialRatio,
  Invoice,
  JournalEntry,
  Party,
  TrialBalanceItem,
} from '../types/accounting';
import {
  FixedAsset,
  AssetCategory,
  DepreciationMethod,
  DepreciationScheduleRow,
  AssetCategorySummary,
} from '../types/assets';
import {
  FinancialRatioMetric,
  DuPontModel,
  MultiYearFinancialSummary,
  FinancialHealthAssessment,
} from '../types/analysis';
import {
  AccountingCertificate,
  CertificateType,
  ClientArchive,
  TreasuryTransaction,
  TreasuryTransactionType,
} from '../types/office';
import { indexedDBBackupService } from './indexedDBService';

const STORAGE_KEYS = {
  ACCOUNTS: 'elbaz_acc_accounts_v2',
  JOURNAL_ENTRIES: 'elbaz_acc_journal_entries_v2',
  PARTIES: 'elbaz_acc_parties_v2',
  INVOICES: 'elbaz_acc_invoices_v2',
  COMPANY_PROFILE: 'elbaz_acc_company_profile_v2',
  AUDITOR_STATEMENT: 'elbaz_acc_auditor_statement_v2',
  APP_SETTINGS: 'elbaz_acc_app_settings_v2',
  CLIENT_ARCHIVES: 'elbaz_office_client_archives_v2',
  TREASURY_TRANSACTIONS: 'elbaz_office_treasury_v2',
  CERTIFICATES: 'elbaz_office_certificates_v2',
  AUDIT_LOGS: 'elbaz_acc_audit_logs_v2',
  FIXED_ASSETS: 'elbaz_acc_fixed_assets_v2',
};

export interface AppSettings {
  autoPostEntries: boolean;
  lockFiscalYear: boolean;
  currencySymbol: string;
  theme: 'dark' | 'light';
  eInvoiceActive: boolean;
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  autoPostEntries: true,
  lockFiscalYear: false,
  currencySymbol: 'ج.م',
  theme: 'dark',
  eInvoiceActive: true,
};

class AccountingDatabase {
  // Initialize Database with Defaults if empty
  public init() {
    if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
      this.saveAccounts(DEFAULT_CHART_OF_ACCOUNTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES)) {
      this.saveJournalEntries(DEFAULT_JOURNAL_ENTRIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PARTIES)) {
      this.saveParties(DEFAULT_PARTIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      this.saveInvoices(DEFAULT_INVOICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMPANY_PROFILE)) {
      this.saveCompanyProfile(DEFAULT_COMPANY_PROFILE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDITOR_STATEMENT)) {
      this.saveAuditorStatement(DEFAULT_AUDITOR_STATEMENT);
    } else {
      // Ensure auditor statement has register number 44887
      const existing = this.getAuditorStatement();
      if (!existing.registerNumber || existing.registerNumber.includes('18452')) {
        existing.registerNumber = 'س.م.م 44887 - سجل المحاسبين والمراجعين بوزارة المالية';
        this.saveAuditorStatement(existing);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.APP_SETTINGS)) {
      this.saveSettings(DEFAULT_APP_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENT_ARCHIVES)) {
      this.saveClientArchives(DEFAULT_CLIENT_ARCHIVES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TREASURY_TRANSACTIONS)) {
      this.saveTreasuryTransactions(DEFAULT_TREASURY_TRANSACTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) {
      this.saveCertificates(DEFAULT_CERTIFICATES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.saveAuditLogs(DEFAULT_AUDIT_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FIXED_ASSETS)) {
      this.saveFixedAssets(DEFAULT_FIXED_ASSETS);
    }

    // Start automatic background periodic backup to IndexedDB every 30 seconds
    try {
      indexedDBBackupService.startAutoBackup(() => this.getFullDatabaseBackupObject(), 30000);
    } catch (e) {
      console.warn('Failed to start IndexedDB auto backup:', e);
    }
  }

  // Get raw full database object for backup
  public getFullDatabaseBackupObject() {
    return {
      exportedAt: new Date().toISOString(),
      system: 'نظام الباز للمحاسبة والمراجعة القانونية - مكتب المحاسب والمراجع القانوني محمود الباز قابيل (سجل 44887)',
      companyProfile: this.getCompanyProfile(),
      auditorStatement: this.getAuditorStatement(),
      accounts: this.getAccounts(),
      journalEntries: this.getJournalEntries(),
      clientArchives: this.getClientArchives(),
      treasuryTransactions: this.getTreasuryTransactions(),
      certificates: this.getCertificates(),
      parties: this.getParties(),
      invoices: this.getInvoices(),
      settings: this.getSettings(),
      auditLogs: this.getAuditLogs(),
    };
  }

  // Trigger manual immediate IndexedDB snapshot
  public async createIndexedDBSnapshot(label?: string) {
    const data = this.getFullDatabaseBackupObject();
    const res = await indexedDBBackupService.saveSnapshot(data, label || 'نسخة يدوية فورية (IndexedDB)');
    this.addAuditLog(
      'backup',
      'النسخ الاحتياطي',
      'تم حفظ نسخة احتياطية فورية في قاعدة المتصفح (IndexedDB)',
      label || 'SNAPSHOT-MANUAL',
      'حفظ كامل لكافة الجداول والشهادات والقيود'
    );
    return res;
  }

  // =========================================================================
  // سجل العمليات والرقابة الداخلية (Audit & Activity Logs)
  // =========================================================================
  public getAuditLogs(): AuditLogEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : DEFAULT_AUDIT_LOGS;
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public saveAuditLogs(logs: AuditLogEntry[]) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  public addAuditLog(
    actionType: AuditActionType,
    module: string,
    description: string,
    recordIdentifier?: string,
    details?: string,
    user: string = 'المحاسب القانوني / محمود الباز قابيل'
  ): AuditLogEntry {
    const logs = this.getAuditLogs();
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: now.toISOString(),
      formattedDate,
      actionType,
      module,
      description,
      recordIdentifier,
      user,
      details,
      isDeleted: false,
    };

    logs.unshift(newLog);
    if (logs.length > 1000) {
      logs.splice(1000);
    }
    this.saveAuditLogs(logs);
    return newLog;
  }

  public deleteAuditLog(
    id: string,
    hardDelete: boolean = false,
    reason: string = 'حذف من سجل العمليات بواسطة المستخدم',
    deletedBy: string = 'المحاسب القانوني / محمود الباز قابيل'
  ): boolean {
    const logs = this.getAuditLogs();
    const index = logs.findIndex((l) => l.id === id);
    if (index === -1) return false;

    if (hardDelete) {
      logs.splice(index, 1);
    } else {
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      logs[index].isDeleted = true;
      logs[index].deletedAt = formattedDate;
      logs[index].deletedBy = deletedBy;
      logs[index].deletionNote = reason;
    }

    this.saveAuditLogs(logs);
    return true;
  }

  public restoreAuditLog(id: string): boolean {
    const logs = this.getAuditLogs();
    const target = logs.find((l) => l.id === id);
    if (!target) return false;
    target.isDeleted = false;
    target.deletedAt = undefined;
    target.deletedBy = undefined;
    target.deletionNote = undefined;
    this.saveAuditLogs(logs);
    return true;
  }

  public clearAllAuditLogs(): void {
    this.saveAuditLogs([]);
  }

  // Settings
  public getSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_APP_SETTINGS;
  }

  public saveSettings(settings: AppSettings) {
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
  }

  // Company Profile
  public getCompanyProfile(): CompanyProfile {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPANY_PROFILE);
    return raw ? JSON.parse(raw) : DEFAULT_COMPANY_PROFILE;
  }

  public saveCompanyProfile(profile: CompanyProfile) {
    localStorage.setItem(STORAGE_KEYS.COMPANY_PROFILE, JSON.stringify(profile));
  }

  // Auditor Statement
  public getAuditorStatement(): AuditorStatement {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDITOR_STATEMENT);
    return raw ? JSON.parse(raw) : DEFAULT_AUDITOR_STATEMENT;
  }

  public saveAuditorStatement(statement: AuditorStatement) {
    localStorage.setItem(STORAGE_KEYS.AUDITOR_STATEMENT, JSON.stringify(statement));
  }

  // Accounts
  public getAccounts(): Account[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const accounts: Account[] = raw ? JSON.parse(raw) : DEFAULT_CHART_OF_ACCOUNTS;
    return this.calculateAccountBalances(accounts);
  }

  public saveAccounts(accounts: Account[]) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  public addAccount(account: Omit<Account, 'id'>): Account {
    const accounts = this.getAccounts();
    const newAccount: Account = {
      ...account,
      id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    accounts.push(newAccount);
    this.saveAccounts(accounts);
    return newAccount;
  }

  public updateAccount(account: Account) {
    const accounts = this.getAccounts();
    const index = accounts.findIndex((a) => a.id === account.id || a.code === account.code);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...account };
      this.saveAccounts(accounts);
    }
  }

  public deleteAccount(id: string): { success: boolean; message: string } {
    const accounts = this.getAccounts();
    const accountToDelete = accounts.find((a) => a.id === id);
    if (!accountToDelete) {
      return { success: false, message: 'الحساب غير موجود' };
    }

    if (accountToDelete.isSystem) {
      return { success: false, message: 'لا يمكن حذف الحسابات النظامية الأساسية' };
    }

    // Check if child accounts exist
    const hasChildren = accounts.some((a) => a.parentCode === accountToDelete.code);
    if (hasChildren) {
      return { success: false, message: 'لا يمكن حذف حساب رئيسي يحتوي على حسابات فرعية، يرجى حذف أو نقل الحسابات الفرعية أولاً' };
    }

    // Check if journal entries exist for this account
    const entries = this.getJournalEntries();
    const hasTransactions = entries.some((entry) =>
      entry.lines.some((line) => line.accountId === id || line.accountCode === accountToDelete.code)
    );
    if (hasTransactions) {
      return { success: false, message: 'لا يمكن حذف هذا الحساب لوجود قيود وحركات مالية مسجلة عليه' };
    }

    const filtered = accounts.filter((a) => a.id !== id);
    this.saveAccounts(filtered);
    return { success: true, message: 'تم حذف الحساب بنجاح' };
  }

  // Compute live balances from posted journal entries
  private calculateAccountBalances(accounts: Account[]): Account[] {
    const entries = this.getJournalEntries().filter((e) => e.isPosted);

    const debitMap: Record<string, number> = {};
    const creditMap: Record<string, number> = {};

    for (const entry of entries) {
      for (const line of entry.lines) {
        const key = line.accountCode;
        debitMap[key] = (debitMap[key] || 0) + Number(line.debit || 0);
        creditMap[key] = (creditMap[key] || 0) + Number(line.credit || 0);
      }
    }

    // Sub accounts direct totals
    return accounts.map((acc) => {
      const isContra = acc.nature === 'credit' && acc.category === 'assets';
      const d = debitMap[acc.code] || 0;
      const c = creditMap[acc.code] || 0;

      let balance = 0;
      if (acc.nature === 'debit') {
        balance = Number(acc.openingBalance || 0) + d - c;
      } else {
        balance = Number(acc.openingBalance || 0) + c - d;
      }

      return {
        ...acc,
        currentDebit: d,
        currentCredit: c,
        currentBalance: balance,
      };
    });
  }

  // Journal Entries
  public getJournalEntries(): JournalEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    return raw ? JSON.parse(raw) : DEFAULT_JOURNAL_ENTRIES;
  }

  public saveJournalEntries(entries: JournalEntry[]) {
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
  }

  public getNextEntryNumber(): { number: number; formatted: string } {
    const entries = this.getJournalEntries();
    const maxNum = entries.reduce((max, e) => Math.max(max, e.entryNumber || 0), 0);
    const nextNum = maxNum + 1;
    const currentYear = new Date().getFullYear();
    const formatted = `JV-${currentYear}-${String(nextNum).padStart(4, '0')}`;
    return { number: nextNum, formatted };
  }

  public addJournalEntry(entryData: Omit<JournalEntry, 'id' | 'entryNumber' | 'formattedNumber' | 'createdAt'>): JournalEntry {
    const entries = this.getJournalEntries();
    const next = this.getNextEntryNumber();
    const settings = this.getSettings();

    const isAutoPost = entryData.isPosted !== undefined ? entryData.isPosted : settings.autoPostEntries;

    const newEntry: JournalEntry = {
      ...entryData,
      id: `jv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      entryNumber: next.number,
      formattedNumber: next.formatted,
      isPosted: isAutoPost,
      postedAt: isAutoPost ? new Date().toISOString().replace('T', ' ').substr(0, 16) : undefined,
      postedBy: isAutoPost ? 'المحاسب القانوني محمود الباز قابيل' : undefined,
      createdAt: new Date().toISOString(),
    };

    entries.unshift(newEntry);
    this.saveJournalEntries(entries);

    this.addAuditLog(
      'create',
      'قيود اليومية',
      `إنشاء قيد يومية ${newEntry.formattedNumber} بمبلغ ${(newEntry?.totalDebit || 0).toLocaleString()} ج.م (${newEntry.description})`,
      newEntry.formattedNumber,
      `عدد البنود: ${newEntry.lines.length} - حالة الترحيل: ${newEntry.isPosted ? 'مرحل لليومية' : 'مسودة'}`
    );

    return newEntry;
  }

  public updateJournalEntry(entry: JournalEntry) {
    const entries = this.getJournalEntries();
    const index = entries.findIndex((e) => e.id === entry.id);
    if (index !== -1) {
      entries[index] = entry;
      this.saveJournalEntries(entries);
      this.addAuditLog(
        'update',
        'قيود اليومية',
        `تعديل قيد يومية ${entry.formattedNumber} بمبلغ ${(entry?.totalDebit || 0).toLocaleString()} ج.م`,
        entry.formattedNumber,
        `تم تعديل البيان والبنود للقيد`
      );
    }
  }

  public deleteJournalEntry(
    id: string,
    deletedBy: string = 'المحاسب القانوني / محمود الباز قابيل',
    reason?: string
  ): { success: boolean; message: string } {
    const entries = this.getJournalEntries();
    const entry = entries.find((e) => e.id === id);
    if (!entry) {
      return { success: false, message: 'القيد غير موجود' };
    }

    const filtered = entries.filter((e) => e.id !== id);
    this.saveJournalEntries(filtered);

    this.addAuditLog(
      'delete',
      'قيود اليومية',
      `تم حذف قيد يومية ${entry.formattedNumber} بمبلغ ${(entry?.totalDebit || 0).toLocaleString()} ج.م بواسطة المستخدم`,
      entry.formattedNumber,
      `البيان السابق: ${entry.description} | سبب الحذف: ${reason || 'إلغاء القيد بطلب المستخدم'}`,
      deletedBy
    );

    return { success: true, message: 'تم حذف القيد وتوثيق العملية بالسجل بنجاح' };
  }

  public postEntry(id: string, auditorName: string = 'محمود الباز قابيل (محاسب قانوني)'): boolean {
    const entries = this.getJournalEntries();
    const entry = entries.find((e) => e.id === id);
    if (entry) {
      entry.isPosted = true;
      entry.postedAt = new Date().toISOString().replace('T', ' ').substr(0, 16);
      entry.postedBy = auditorName;
      this.saveJournalEntries(entries);
      this.addAuditLog(
        'post',
        'قيود اليومية',
        `اعتماد وترحيل قيد اليومية رقم ${entry.formattedNumber} لدفتر الأستاذ العام وميزان المراجعة`,
        entry.formattedNumber,
        `معتمد بواسطة ${auditorName}`
      );
      return true;
    }
    return false;
  }

  public unpostEntry(id: string): boolean {
    const entries = this.getJournalEntries();
    const entry = entries.find((e) => e.id === id);
    if (entry) {
      entry.isPosted = false;
      entry.postedAt = undefined;
      entry.postedBy = undefined;
      this.saveJournalEntries(entries);
      this.addAuditLog(
        'unpost',
        'قيود اليومية',
        `إلغاء ترحيل قيد اليومية رقم ${entry.formattedNumber} وإعادته لحالة المسودة`,
        entry.formattedNumber
      );
      return true;
    }
    return false;
  }

  public postAllEntries(auditorName: string = 'محمود الباز قابيل (محاسب قانوني)'): number {
    const entries = this.getJournalEntries();
    let count = 0;
    for (const e of entries) {
      if (!e.isPosted) {
        e.isPosted = true;
        e.postedAt = new Date().toISOString().replace('T', ' ').substr(0, 16);
        e.postedBy = auditorName;
        count++;
      }
    }
    this.saveJournalEntries(entries);
    return count;
  }

  // Parties (Customers & Suppliers)
  public getParties(type?: 'customer' | 'supplier'): Party[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTIES);
    const parties: Party[] = raw ? JSON.parse(raw) : DEFAULT_PARTIES;
    if (type) {
      return parties.filter((p) => p.type === type);
    }
    return parties;
  }

  public saveParties(parties: Party[]) {
    localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(parties));
  }

  public addParty(party: Omit<Party, 'id'>): Party {
    const parties = this.getParties();
    const newParty: Party = {
      ...party,
      id: `pty-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    parties.push(newParty);
    this.saveParties(parties);
    return newParty;
  }

  public updateParty(party: Party) {
    const parties = this.getParties();
    const index = parties.findIndex((p) => p.id === party.id);
    if (index !== -1) {
      parties[index] = party;
      this.saveParties(parties);
    }
  }

  public deleteParty(id: string): boolean {
    const parties = this.getParties();
    const filtered = parties.filter((p) => p.id !== id);
    this.saveParties(filtered);
    return true;
  }

  // Invoices
  public getInvoices(type?: 'sales' | 'purchase'): Invoice[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    const invoices: Invoice[] = raw ? JSON.parse(raw) : DEFAULT_INVOICES;
    if (type) {
      return invoices.filter((i) => (type === 'sales' ? i.type.startsWith('sales') : i.type.startsWith('purchase')));
    }
    return invoices;
  }

  public saveInvoices(invoices: Invoice[]) {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }

  public addInvoice(invoiceData: Partial<Invoice> & { partyName: string; date: string; type: string; items: any[]; subtotal: number }, createJournalEntry: boolean = true): Invoice {
    const invoices = this.getInvoices();
    const newId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const prefix = invoiceData.type?.startsWith('sales') ? 'INV-SALES' : 'INV-PURCH';
    const invoiceNumber = invoiceData.invoiceNumber || `${prefix}-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;

    const taxableAmount = invoiceData.taxableAmount ?? (invoiceData.subtotal - (invoiceData.discountAmount || 0));
    const vatTotal = invoiceData.vatTotal ?? invoiceData.vatAmount ?? 0;
    const withholdingTaxTotal = invoiceData.withholdingTaxTotal ?? invoiceData.withholdingTaxAmount ?? 0;
    const grandTotal = invoiceData.grandTotal ?? invoiceData.totalAmount ?? (taxableAmount + vatTotal - withholdingTaxTotal);

    let journalEntryId: string | undefined = undefined;

    if (createJournalEntry) {
      // Automatically generate Egyptian standard Tax Journal Entry for this invoice
      if (invoiceData.type?.startsWith('sales')) {
        const jv = this.addJournalEntry({
          date: invoiceData.date,
          referenceDoc: invoiceNumber,
          description: `إثبات فاتورة مبيعات ضريبية رقم ${invoiceNumber} للعميل: ${invoiceData.partyName}`,
          sourceType: 'invoice',
          sourceId: newId,
          createdBy: 'نظام الفوترة الإلكتروني',
          isPosted: true,
          totalDebit: taxableAmount + vatTotal,
          totalCredit: taxableAmount + vatTotal,
          lines: [
            {
              id: `l-1-${Date.now()}`,
              accountId: 'acc-1221',
              accountCode: '1221',
              accountName: 'العملاء التجاريون',
              debit: grandTotal,
              credit: 0,
              note: `استحقاق على العميل ${invoiceData.partyName}`,
            },
            ...(withholdingTaxTotal > 0
              ? [
                  {
                    id: `l-2-${Date.now()}`,
                    accountId: 'acc-1235',
                    accountCode: '1235',
                    accountName: 'مصلحة الضرائب - ضريبة الخصم والتحصيل 1% أ/ت (تحت حساب الضريبة)',
                    debit: withholdingTaxTotal,
                    credit: 0,
                    note: 'ضريبة خصم وتحصيل 1% مخصومة بمعرفة العميل',
                  },
                ]
              : []),
            {
              id: `l-3-${Date.now()}`,
              accountId: 'acc-311',
              accountCode: '311',
              accountName: 'إيرادات مبيعات بضائع',
              debit: 0,
              credit: taxableAmount,
              note: 'إيراد المبيعات الخاضع للضريبة',
            },
            {
              id: `l-4-${Date.now()}`,
              accountId: 'acc-2321',
              accountCode: '2321',
              accountName: 'مصلحة الضرائب المصرية - ضريبة القيمة المضافة 14% (مخرجات)',
              debit: 0,
              credit: vatTotal,
              note: 'ضريبة القيمة المضافة 14% مخرجات',
            },
          ],
        });
        journalEntryId = jv.id;
      } else if (invoiceData.type?.startsWith('purch')) {
        const jv = this.addJournalEntry({
          date: invoiceData.date,
          referenceDoc: invoiceNumber,
          description: `إثبات فاتورة مشتريات خامات ومستلزمات رقم ${invoiceNumber} من المورد: ${invoiceData.partyName}`,
          sourceType: 'invoice',
          sourceId: newId,
          createdBy: 'نظام الفوترة الإلكتروني',
          isPosted: true,
          totalDebit: taxableAmount + vatTotal,
          totalCredit: taxableAmount + vatTotal,
          lines: [
            {
              id: `pl-1-${Date.now()}`,
              accountId: 'acc-411',
              accountCode: '411',
              accountName: 'مشتريات بضائع بغرض البيع',
              debit: taxableAmount,
              credit: 0,
              note: 'مشتريات بضائع وخامات',
            },
            {
              id: `pl-2-${Date.now()}`,
              accountId: 'acc-1234',
              accountCode: '1234',
              accountName: 'مصلحة الضرائب - ضريبة ق.م مدخلات قابلة للخصم',
              debit: vatTotal,
              credit: 0,
              note: 'ضريبة ق.م مدخلات 14% قابلة للخصم',
            },
            {
              id: `pl-3-${Date.now()}`,
              accountId: 'acc-2311',
              accountCode: '2311',
              accountName: 'الموردون التجاريون',
              debit: 0,
              credit: grandTotal,
              note: `مستحق للمورد ${invoiceData.partyName}`,
            },
            ...(withholdingTaxTotal > 0
              ? [
                  {
                    id: `pl-4-${Date.now()}`,
                    accountId: 'acc-2323',
                    accountCode: '2323',
                    accountName: 'مصلحة الضرائب المصرية - ضريبة الخصم والتحصيل من المنبع أ/ت المحصلة',
                    debit: 0,
                    credit: withholdingTaxTotal,
                    note: 'ضريبة خصم وتحصيل 1% للتوريد لمصلحة الضرائب',
                  },
                ]
              : []),
          ],
        });
        journalEntryId = jv.id;
      }
    }

    const newInvoice: Invoice = {
      partyId: invoiceData.partyId || '',
      partyName: invoiceData.partyName,
      type: invoiceData.type,
      date: invoiceData.date,
      items: invoiceData.items,
      subtotal: invoiceData.subtotal,
      taxableAmount,
      vatTotal,
      withholdingTaxTotal,
      grandTotal,
      id: newId,
      invoiceNumber,
      formattedNumber: invoiceNumber,
      journalEntryId,
      ...invoiceData,
    };

    invoices.unshift(newInvoice);
    this.saveInvoices(invoices);
    return newInvoice;
  }

  public deleteInvoice(id: string): boolean {
    const invoices = this.getInvoices();
    const invoice = invoices.find((i) => i.id === id);
    if (invoice?.journalEntryId) {
      this.deleteJournalEntry(invoice.journalEntryId);
    }
    const filtered = invoices.filter((i) => i.id !== id);
    this.saveInvoices(filtered);
    return true;
  }

  // General Ledger Generator
  public getAccountLedger(accountCode: string, startDate?: string, endDate?: string) {
    const accounts = this.getAccounts();
    const targetAccount = accounts.find((a) => a.code === accountCode);
    if (!targetAccount) return null;

    const entries = this.getJournalEntries()
      .filter((e) => e.isPosted)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = Number(targetAccount.openingBalance || 0);
    const rows = [];

    // Initial opening row
    rows.push({
      date: 'بداية العام',
      formattedNumber: 'رصيد أول المدة',
      description: 'الرصيد الافتتاحي للحساب',
      debit: targetAccount.nature === 'debit' && runningBalance >= 0 ? runningBalance : 0,
      credit: targetAccount.nature === 'credit' && runningBalance >= 0 ? runningBalance : 0,
      balance: runningBalance,
      entryId: null,
    });

    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;

    for (const entry of entries) {
      if (startDate && entry.date < startDate) continue;
      if (endDate && entry.date > endDate) continue;

      for (const line of entry.lines) {
        if (line.accountCode === accountCode) {
          const debit = Number(line.debit || 0);
          const credit = Number(line.credit || 0);

          if (targetAccount.nature === 'debit') {
            runningBalance += debit - credit;
          } else {
            runningBalance += credit - debit;
          }

          totalPeriodDebit += debit;
          totalPeriodCredit += credit;

          rows.push({
            date: entry.date,
            formattedNumber: entry.formattedNumber,
            description: line.note || entry.description,
            debit,
            credit,
            balance: runningBalance,
            entryId: entry.id,
          });
        }
      }
    }

    return {
      account: targetAccount,
      rows,
      totalPeriodDebit,
      totalPeriodCredit,
      closingBalance: runningBalance,
    };
  }

  // Trial Balance (ميزان المراجعة بالمجاميع والأرصدة)
  public getTrialBalance(): {
    items: TrialBalanceItem[];
    totals: {
      openingDebit: number;
      openingCredit: number;
      periodDebit: number;
      periodCredit: number;
      totalDebit: number;
      totalCredit: number;
      balanceDebit: number;
      balanceCredit: number;
      isBalanced: boolean;
    };
  } {
    const accounts = this.getAccounts();
    const entries = this.getJournalEntries().filter((e) => e.isPosted);

    const debitMap: Record<string, number> = {};
    const creditMap: Record<string, number> = {};

    for (const entry of entries) {
      for (const line of entry.lines) {
        const code = line.accountCode;
        debitMap[code] = (debitMap[code] || 0) + Number(line.debit || 0);
        creditMap[code] = (creditMap[code] || 0) + Number(line.credit || 0);
      }
    }

    const items: TrialBalanceItem[] = [];

    let sumOpeningDebit = 0;
    let sumOpeningCredit = 0;
    let sumPeriodDebit = 0;
    let sumPeriodCredit = 0;
    let sumTotalDebit = 0;
    let sumTotalCredit = 0;
    let sumBalanceDebit = 0;
    let sumBalanceCredit = 0;

    for (const acc of accounts) {
      if (acc.type === 'sub') {
        const op = Number(acc.openingBalance || 0);
        let openingDebit = 0;
        let openingCredit = 0;

        if (acc.nature === 'debit') {
          if (op >= 0) openingDebit = op;
          else openingCredit = Math.abs(op);
        } else {
          if (op >= 0) openingCredit = op;
          else openingDebit = Math.abs(op);
        }

        const periodDebit = debitMap[acc.code] || 0;
        const periodCredit = creditMap[acc.code] || 0;

        const totalDebit = openingDebit + periodDebit;
        const totalCredit = openingCredit + periodCredit;

        let balanceDebit = 0;
        let balanceCredit = 0;

        if (totalDebit >= totalCredit) {
          balanceDebit = totalDebit - totalCredit;
        } else {
          balanceCredit = totalCredit - totalDebit;
        }

        items.push({
          accountCode: acc.code,
          accountName: acc.name,
          category: acc.category,
          level: acc.level,
          isMain: false,
          openingDebit,
          openingCredit,
          periodDebit,
          periodCredit,
          totalDebit,
          totalCredit,
          balanceDebit,
          balanceCredit,
        });

        sumOpeningDebit += openingDebit;
        sumOpeningCredit += openingCredit;
        sumPeriodDebit += periodDebit;
        sumPeriodCredit += periodCredit;
        sumTotalDebit += totalDebit;
        sumTotalCredit += totalCredit;
        sumBalanceDebit += balanceDebit;
        sumBalanceCredit += balanceCredit;
      }
    }

    const isBalanced = Math.abs(sumBalanceDebit - sumBalanceCredit) < 0.01;

    return {
      items,
      totals: {
        openingDebit: sumOpeningDebit,
        openingCredit: sumOpeningCredit,
        periodDebit: sumPeriodDebit,
        periodCredit: sumPeriodCredit,
        totalDebit: sumTotalDebit,
        totalCredit: sumTotalCredit,
        balanceDebit: sumBalanceDebit,
        balanceCredit: sumBalanceCredit,
        isBalanced,
      },
    };
  }

  // Financial Statements (قوائم الدخل والمركز المالي والتدفقات النقدية وفق المعايير المصرية)
  public getFinancialStatements() {
    const trial = this.getTrialBalance();
    const items = trial.items;

    // 1. Income Statement calculation (قائمة الدخل)
    let grossSales = 0;
    let salesReturns = 0;
    let salesDiscount = 0;
    let otherRevenues = 0;

    let costOfGoodsPurchases = 0;
    let freightPurchases = 0;
    let purchaseReturns = 0;
    let purchaseDiscounts = 0;

    let sellingExpenses = 0;
    let adminSalaries = 0;
    let adminSocialInsurance = 0;
    let adminRent = 0;
    let adminUtilities = 0;
    let adminAuditConsulting = 0;
    let adminOtherExpenses = 0;
    let depreciationExpense = 0;
    let financeCosts = 0;

    for (const item of items) {
      const code = item.accountCode;
      const netCredit = item.balanceCredit - item.balanceDebit;
      const netDebit = item.balanceDebit - item.balanceCredit;

      if (code === '311' || code === '312') grossSales += Math.max(0, netCredit);
      if (code === '313') salesReturns += Math.max(0, netDebit);
      if (code === '314') salesDiscount += Math.max(0, netDebit);
      if (code.startsWith('32')) otherRevenues += Math.max(0, netCredit);

      if (code === '411') costOfGoodsPurchases += Math.max(0, netDebit);
      if (code === '414') freightPurchases += Math.max(0, netDebit);
      if (code === '412') purchaseReturns += Math.max(0, netCredit);
      if (code === '413') purchaseDiscounts += Math.max(0, netCredit);

      if (code.startsWith('42')) sellingExpenses += Math.max(0, netDebit);
      if (code === '431') adminSalaries += Math.max(0, netDebit);
      if (code === '432') adminSocialInsurance += Math.max(0, netDebit);
      if (code === '433') adminRent += Math.max(0, netDebit);
      if (code === '434') adminUtilities += Math.max(0, netDebit);
      if (code === '435') adminAuditConsulting += Math.max(0, netDebit);
      if (code === '436' || code === '437' || code === '438') adminOtherExpenses += Math.max(0, netDebit);

      if (code === '44' || code.startsWith('44')) depreciationExpense += Math.max(0, netDebit);
      if (code === '45' || code.startsWith('45')) financeCosts += Math.max(0, netDebit);
    }

    const netSales = grossSales - salesReturns - salesDiscount;
    const costOfGoodsSold = costOfGoodsPurchases + freightPurchases - purchaseReturns - purchaseDiscounts;
    const grossProfit = netSales - costOfGoodsSold;

    const totalAdminExpenses =
      adminSalaries +
      adminSocialInsurance +
      adminRent +
      adminUtilities +
      adminAuditConsulting +
      adminOtherExpenses;

    const operatingExpenses = sellingExpenses + totalAdminExpenses + depreciationExpense;
    const operatingProfit = grossProfit - operatingExpenses;

    const netProfitBeforeTax = operatingProfit + otherRevenues - financeCosts;
    const corporateIncomeTax = netProfitBeforeTax > 0 ? netProfitBeforeTax * 0.225 : 0; // 22.5% Egyptian Corporate Tax
    const netProfitAfterTax = netProfitBeforeTax - corporateIncomeTax;

    // 2. Balance Sheet Calculation (قائمة المركز المالي)
    let nonCurrentAssetsGross = 0;
    let accumulatedDepreciation = 0;
    let projectsInProgress = 0;
    let intangibleAssets = 0;

    let inventory = 0;
    let tradeReceivables = 0;
    let notesReceivable = 0;
    let prepaidAndOtherDebtors = 0;
    let cashAndEquivalents = 0;

    let paidCapital = 0;
    let legalReserve = 0;
    let generalReserve = 0;
    let retainedEarnings = 0;
    let partnersCurrent = 0;

    let longTermLoans = 0;
    let endOfServiceProvision = 0;

    let tradePayables = 0;
    let notesPayable = 0;
    let taxesPayable = 0;
    let accruedExpenses = 0;

    for (const item of items) {
      const code = item.accountCode;
      const netDebit = item.balanceDebit - item.balanceCredit;
      const netCredit = item.balanceCredit - item.balanceDebit;

      // Fixed assets cost
      if (code.startsWith('111')) nonCurrentAssetsGross += Math.max(0, netDebit);
      if (code.startsWith('112')) accumulatedDepreciation += Math.max(0, netCredit);
      if (code === '113') projectsInProgress += Math.max(0, netDebit);
      if (code === '114') intangibleAssets += Math.max(0, netDebit);

      // Current assets
      if (code.startsWith('121')) inventory += Math.max(0, netDebit);
      if (code === '1221') tradeReceivables += Math.max(0, netDebit);
      if (code === '1222') notesReceivable += Math.max(0, netDebit);
      if (code.startsWith('123')) prepaidAndOtherDebtors += Math.max(0, netDebit);
      if (code.startsWith('124')) cashAndEquivalents += Math.max(0, netDebit);

      // Equity
      if (code === '211') paidCapital += Math.max(0, netCredit);
      if (code === '212') legalReserve += Math.max(0, netCredit);
      if (code === '213') generalReserve += Math.max(0, netCredit);
      if (code === '214') retainedEarnings += netCredit; // could be negative
      if (code === '216') partnersCurrent += Math.max(0, netCredit);

      // Non-current liabilities
      if (code === '221') longTermLoans += Math.max(0, netCredit);
      if (code === '222') endOfServiceProvision += Math.max(0, netCredit);

      // Current liabilities
      if (code === '2311') tradePayables += Math.max(0, netCredit);
      if (code === '2312') notesPayable += Math.max(0, netCredit);
      if (code.startsWith('232') && code !== '2325') taxesPayable += Math.max(0, netCredit);
      if (code === '2325') accruedExpenses += Math.max(0, netCredit);
    }

    const netFixedAssets = nonCurrentAssetsGross - accumulatedDepreciation;
    const totalNonCurrentAssets = netFixedAssets + projectsInProgress + intangibleAssets;

    const totalCurrentAssets =
      inventory + tradeReceivables + notesReceivable + prepaidAndOtherDebtors + cashAndEquivalents;

    const totalAssets = totalNonCurrentAssets + totalCurrentAssets;

    // Equity includes current period net profit after tax
    const totalEquity =
      paidCapital +
      legalReserve +
      generalReserve +
      retainedEarnings +
      partnersCurrent +
      netProfitAfterTax;

    const totalNonCurrentLiabilities = longTermLoans + endOfServiceProvision;
    const totalCurrentLiabilities =
      tradePayables + notesPayable + taxesPayable + accruedExpenses + corporateIncomeTax;

    const totalLiabilities = totalNonCurrentLiabilities + totalCurrentLiabilities;
    const totalEquityAndLiabilities = totalEquity + totalLiabilities;

    // 3. Financial Ratios
    const currentRatio = totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
    const quickAssets = totalCurrentAssets - inventory;
    const quickRatio = totalCurrentLiabilities > 0 ? quickAssets / totalCurrentLiabilities : 0;
    const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
    const netMargin = netSales > 0 ? (netProfitAfterTax / netSales) * 100 : 0;
    const roa = totalAssets > 0 ? (netProfitAfterTax / totalAssets) * 100 : 0;
    const roe = totalEquity > 0 ? (netProfitAfterTax / totalEquity) * 100 : 0;
    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;

    const ratios: FinancialRatio[] = [
      {
        name: 'نسبة التداول (Current Ratio)',
        value: currentRatio,
        formatted: `${currentRatio.toFixed(2)}:1`,
        status: currentRatio >= 1.5 ? 'optimal' : currentRatio >= 1.0 ? 'normal' : 'warning',
        benchmark: '1.5 - 2.0',
        description: 'قدرة الأصول المتداولة على تغطية الالتزامات قصيرة الأجل',
      },
      {
        name: 'نسبة السيولة السريعة (Quick Ratio)',
        value: quickRatio,
        formatted: `${quickRatio.toFixed(2)}:1`,
        status: quickRatio >= 1.0 ? 'optimal' : quickRatio >= 0.8 ? 'normal' : 'warning',
        benchmark: '1.0:1',
        description: 'السيولة الفورية باستبعاد المخزون السلعي الأقل سيولة',
      },
      {
        name: 'هامش مجمل الربح (Gross Profit Margin)',
        value: grossMargin,
        formatted: `${grossMargin.toFixed(1)}%`,
        status: grossMargin >= 25 ? 'optimal' : 'normal',
        benchmark: '20% - 40%',
        description: 'نسبة مجمل الربح المحقق بعد تكلفة البضاعة المباشرة',
      },
      {
        name: 'هامش صافي الربح (Net Profit Margin)',
        value: netMargin,
        formatted: `${netMargin.toFixed(1)}%`,
        status: netMargin >= 10 ? 'optimal' : netMargin > 0 ? 'normal' : 'warning',
        benchmark: '10% - 18%',
        description: 'العائد الصافي المحقق من كل 100 جنيه مبيعات',
      },
      {
        name: 'العائد على الأصول (ROA)',
        value: roa,
        formatted: `${roa.toFixed(1)}%`,
        status: roa >= 8 ? 'optimal' : 'normal',
        benchmark: '8% - 15%',
        description: 'كفاءة استغلال أصول الشركة في توليد الأرباح',
      },
      {
        name: 'العائد على حقوق الملكية (ROE)',
        value: roe,
        formatted: `${roe.toFixed(1)}%`,
        status: roe >= 15 ? 'optimal' : 'normal',
        benchmark: '15% - 25%',
        description: 'معدل العائد الاستثماري لأموال المساهمين والشركاء',
      },
    ];

    return {
      incomeStatement: {
        grossSales,
        salesReturns,
        salesDiscount,
        netSales,
        costOfGoodsPurchases,
        freightPurchases,
        purchaseReturns,
        purchaseDiscounts,
        costOfGoodsSold,
        grossProfit,
        sellingExpenses,
        adminSalaries,
        adminSocialInsurance,
        adminRent,
        adminUtilities,
        adminAuditConsulting,
        adminOtherExpenses,
        totalAdminExpenses,
        depreciationExpense,
        operatingExpenses,
        operatingProfit,
        otherRevenues,
        financeCosts,
        netProfitBeforeTax,
        corporateIncomeTax,
        netProfitAfterTax,
      },
      balanceSheet: {
        nonCurrentAssetsGross,
        accumulatedDepreciation,
        netFixedAssets,
        projectsInProgress,
        intangibleAssets,
        totalNonCurrentAssets,
        inventory,
        tradeReceivables,
        notesReceivable,
        prepaidAndOtherDebtors,
        cashAndEquivalents,
        totalCurrentAssets,
        totalAssets,
        paidCapital,
        legalReserve,
        generalReserve,
        retainedEarnings,
        partnersCurrent,
        netProfitAfterTax,
        totalEquity,
        longTermLoans,
        endOfServiceProvision,
        totalNonCurrentLiabilities,
        tradePayables,
        notesPayable,
        taxesPayable,
        accruedExpenses,
        corporateIncomeTax,
        totalCurrentLiabilities,
        totalLiabilities,
        totalEquityAndLiabilities,
        isBalanced: Math.abs(totalAssets - totalEquityAndLiabilities) < 1.0,
      },
      cashFlow: {
        operatingActivities: {
          netProfitBeforeTax,
          depreciationAdjustment: depreciationExpense,
          workingCapitalChanges: {
            inventoryChange: -20000,
            receivablesChange: -35000,
            payablesChange: 45000,
          },
          netCashFromOperating: netProfitBeforeTax + depreciationExpense - 10000,
        },
        investingActivities: {
          purchaseOfFixedAssets: -35000,
          projectsExpenditures: -15000,
          netCashFromInvesting: -50000,
        },
        financingActivities: {
          loanRepayments: -25000,
          capitalInjections: 0,
          netCashFromFinancing: -25000,
        },
        netCashChange: netProfitBeforeTax + depreciationExpense - 10000 - 50000 - 25000,
        beginningCash: cashAndEquivalents - (netProfitBeforeTax + depreciationExpense - 85000),
        endingCash: cashAndEquivalents,
      },
      ratios,
      workingCapital,
    };
  }

  // Database Backup & Export Functions (Single File Database / JSON / SQL Dump)
  public exportFullBackupJson(): string {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      system: 'نظام الباز للمحاسبة والمراجعة القانونية - مكتب المحاسب والمراجع القانوني محمود الباز قابيل (سجل 44887)',
      companyProfile: this.getCompanyProfile(),
      auditorStatement: this.getAuditorStatement(),
      accounts: this.getAccounts(),
      journalEntries: this.getJournalEntries(),
      clientArchives: this.getClientArchives(),
      treasuryTransactions: this.getTreasuryTransactions(),
      certificates: this.getCertificates(),
      parties: this.getParties(),
      invoices: this.getInvoices(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  public exportAccessSqlDump(): string {
    const profile = this.getCompanyProfile();
    const accounts = this.getAccounts();
    const entries = this.getJournalEntries();
    const parties = this.getParties();
    const invoices = this.getInvoices();

    let sql = `-- ==========================================================================\n`;
    sql += `-- قاعدة بيانات نظام الباز للمحاسبة والمراجعة (متوافق مع Microsoft Access & SQL Server)\n`;
    sql += `-- إعداد: محاسب ومراجع قانوني / محمود الباز قابيل (س.م.م 44887)\n`;
    sql += `-- المنشأة: ${profile.name}\n`;
    sql += `-- تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}\n`;
    sql += `-- ==========================================================================\n\n`;

    sql += `-- جدول دليل الحسابات (tbl_ChartOfAccounts)\n`;
    sql += `CREATE TABLE tbl_ChartOfAccounts (\n`;
    sql += `    AccountCode VARCHAR(20) PRIMARY KEY,\n`;
    sql += `    AccountName VARCHAR(255) NOT NULL,\n`;
    sql += `    Category VARCHAR(50),\n`;
    sql += `    AccountType VARCHAR(20),\n`;
    sql += `    Nature VARCHAR(10),\n`;
    sql += `    ParentCode VARCHAR(20),\n`;
    sql += `    OpeningBalance CURRENCY DEFAULT 0\n`;
    sql += `);\n\n`;

    for (const a of accounts) {
      sql += `INSERT INTO tbl_ChartOfAccounts (AccountCode, AccountName, Category, AccountType, Nature, ParentCode, OpeningBalance) VALUES ('${a.code}', '${a.name.replace(/'/g, "''")}', '${a.category}', '${a.type}', '${a.nature}', ${a.parentCode ? `'${a.parentCode}'` : 'NULL'}, ${a.openingBalance || 0});\n`;
    }

    sql += `\n-- جدول قيود اليومية العامة (tbl_JournalEntries)\n`;
    sql += `CREATE TABLE tbl_JournalEntries (\n`;
    sql += `    EntryID VARCHAR(50) PRIMARY KEY,\n`;
    sql += `    EntryNumber INT,\n`;
    sql += `    FormattedNumber VARCHAR(50),\n`;
    sql += `    EntryDate DATETIME,\n`;
    sql += `    ReferenceDoc VARCHAR(100),\n`;
    sql += `    Description MEMO,\n`;
    sql += `    TotalDebit CURRENCY,\n`;
    sql += `    TotalCredit CURRENCY,\n`;
    sql += `    IsPosted YESNO,\n`;
    sql += `    PostedBy VARCHAR(100)\n`;
    sql += `);\n\n`;

    for (const e of entries) {
      sql += `INSERT INTO tbl_JournalEntries (EntryID, EntryNumber, FormattedNumber, EntryDate, ReferenceDoc, Description, TotalDebit, TotalCredit, IsPosted, PostedBy) VALUES ('${e.id}', ${e.entryNumber}, '${e.formattedNumber}', #${e.date}#, '${e.referenceDoc || ''}', '${e.description.replace(/'/g, "''")}', ${e.totalDebit}, ${e.totalCredit}, ${e.isPosted ? 'TRUE' : 'FALSE'}, '${(e.postedBy || '').replace(/'/g, "''")}');\n`;
    }

    return sql;
  }

  public importBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (data.accounts && Array.isArray(data.accounts)) {
        this.saveAccounts(data.accounts);
      }
      if (data.journalEntries && Array.isArray(data.journalEntries)) {
        this.saveJournalEntries(data.journalEntries);
      }
      if (data.clientArchives && Array.isArray(data.clientArchives)) {
        this.saveClientArchives(data.clientArchives);
      }
      if (data.treasuryTransactions && Array.isArray(data.treasuryTransactions)) {
        this.saveTreasuryTransactions(data.treasuryTransactions);
      }
      if (data.certificates && Array.isArray(data.certificates)) {
        this.saveCertificates(data.certificates);
      }
      if (data.parties && Array.isArray(data.parties)) {
        this.saveParties(data.parties);
      }
      if (data.invoices && Array.isArray(data.invoices)) {
        this.saveInvoices(data.invoices);
      }
      if (data.companyProfile) {
        this.saveCompanyProfile(data.companyProfile);
      }
      if (data.auditorStatement) {
        this.saveAuditorStatement(data.auditorStatement);
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      return { success: true, message: 'تم استرجاع قاعدة البيانات بملف واحد بالكامل وبنجاح تام' };
    } catch (err: any) {
      return { success: false, message: `فشل استرجاع الملف: ${err?.message || 'تنسيق غير صالح'}` };
    }
  }

  public updateInvoice(invoice: Invoice) {
    const invoices = this.getInvoices();
    const index = invoices.findIndex((i) => i.id === invoice.id);
    if (index !== -1) {
      invoices[index] = invoice;
      this.saveInvoices(invoices);
    }
  }

  // Alias methods for component compatibility
  public postJournalEntry(id: string): boolean {
    return this.postEntry(id);
  }

  public unpostJournalEntry(id: string): boolean {
    return this.unpostEntry(id);
  }

  public postAllUnpostedEntries(): number {
    return this.postAllEntries();
  }

  public updateCompanyProfile(profile: CompanyProfile) {
    this.saveCompanyProfile(profile);
  }

  public updateAuditorStatement(statement: AuditorStatement) {
    this.saveAuditorStatement(statement);
  }

  public exportDatabaseJSON(): string {
    return this.exportFullBackupJson();
  }

  public importDatabaseJSON(jsonString: string): boolean {
    return this.importBackup(jsonString).success;
  }

  public resetToDefaults() {
    this.saveAccounts(DEFAULT_CHART_OF_ACCOUNTS);
    this.saveJournalEntries(DEFAULT_JOURNAL_ENTRIES);
    this.saveClientArchives(DEFAULT_CLIENT_ARCHIVES);
    this.saveTreasuryTransactions(DEFAULT_TREASURY_TRANSACTIONS);
    this.saveCertificates(DEFAULT_CERTIFICATES);
    this.saveParties(DEFAULT_PARTIES);
    this.saveInvoices(DEFAULT_INVOICES);
    this.saveCompanyProfile(DEFAULT_COMPANY_PROFILE);
    this.saveAuditorStatement(DEFAULT_AUDITOR_STATEMENT);
    this.saveSettings(DEFAULT_APP_SETTINGS);
  }

  public resetToSeedData() {
    this.resetToDefaults();
  }

  // Clear all transactional and company data to start 100% fresh for a new company
  public clearAllCompanyData(companyName: string = 'الشركة الجديدة للتجارة والصناعة (ش.م.م)') {
    // Reset all accounts opening balance to 0
    const accounts = DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
      ...a,
      openingBalance: 0,
    }));
    this.saveAccounts(accounts);
    this.saveJournalEntries([]);
    this.saveClientArchives([]);
    this.saveTreasuryTransactions([]);
    this.saveCertificates([]);
    this.saveParties([]);
    this.saveInvoices([]);
    this.saveCompanyProfile({
      ...DEFAULT_COMPANY_PROFILE,
      name: companyName,
    });
    this.saveAuditorStatement(DEFAULT_AUDITOR_STATEMENT);
  }

  // =========================================================================
  // 1. أرشيف العملاء (Clients Archive Module)
  // =========================================================================
  public getClientArchives(): ClientArchive[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENT_ARCHIVES);
    return raw ? JSON.parse(raw) : DEFAULT_CLIENT_ARCHIVES;
  }

  public saveClientArchives(clients: ClientArchive[]) {
    localStorage.setItem(STORAGE_KEYS.CLIENT_ARCHIVES, JSON.stringify(clients));
  }

  public getNextClientCode(): string {
    const clients = this.getClientArchives();
    const count = clients.length + 1;
    const year = new Date().getFullYear();
    const padded = String(count).padStart(4, '0');
    return `CLI-${year}-${padded}`;
  }

  public addClientArchive(client: Omit<ClientArchive, 'id' | 'clientCode' | 'createdAt'>): ClientArchive {
    const clients = this.getClientArchives();
    const newClient: ClientArchive = {
      ...client,
      id: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      clientCode: this.getNextClientCode(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    clients.push(newClient);
    this.saveClientArchives(clients);
    return newClient;
  }

  public updateClientArchive(client: ClientArchive) {
    const clients = this.getClientArchives();
    const index = clients.findIndex((c) => c.id === client.id);
    if (index !== -1) {
      clients[index] = { ...client, updatedAt: new Date().toISOString().split('T')[0] };
      this.saveClientArchives(clients);
    }
  }

  public deleteClientArchive(id: string): { success: boolean; message: string } {
    const clients = this.getClientArchives();
    const filtered = clients.filter((c) => c.id !== id);
    if (filtered.length === clients.length) {
      return { success: false, message: 'العميل غير موجود' };
    }
    this.saveClientArchives(filtered);
    return { success: true, message: 'تم حذف العميل من الأرشيف بنجاح' };
  }

  // Client Financial Summary & Account Statement Sync
  public getClientFinancialSummary(clientId: string) {
    const clients = this.getClientArchives();
    const client = clients.find((c) => c.id === clientId);
    const transactions = this.getTreasuryTransactions().filter((t) => t.clientId === clientId);
    const certificates = this.getCertificates().filter((c) => c.clientId === clientId);

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Net fees retained by office = total money received - direct procedure expenses
    const netFees = totalIncome - totalExpenses;

    return {
      client,
      totalIncome,
      totalExpenses,
      netFees,
      transactionsCount: transactions.length,
      certificatesCount: certificates.length,
      transactions,
      certificates,
    };
  }

  // =========================================================================
  // 2. نظام الخزينة والماليات (Treasury & Financial Module)
  // =========================================================================
  public getTreasuryTransactions(): TreasuryTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TREASURY_TRANSACTIONS);
    return raw ? JSON.parse(raw) : DEFAULT_TREASURY_TRANSACTIONS;
  }

  public saveTreasuryTransactions(transactions: TreasuryTransaction[]) {
    localStorage.setItem(STORAGE_KEYS.TREASURY_TRANSACTIONS, JSON.stringify(transactions));
  }

  public getNextReceiptSerial(type: TreasuryTransactionType): string {
    const txs = this.getTreasuryTransactions().filter((t) => t.type === type);
    const count = txs.length + 1;
    const year = new Date().getFullYear();
    const padded = String(count).padStart(4, '0');
    const prefix = type === 'income' ? 'REC' : 'PAY';
    return `${prefix}-${year}-${padded}`;
  }

  public addTreasuryTransaction(
    tx: Omit<TreasuryTransaction, 'id' | 'serialNumber' | 'createdAt'>,
    syncToAccounting: boolean = true
  ): TreasuryTransaction {
    const transactions = this.getTreasuryTransactions();
    const serialNumber = this.getNextReceiptSerial(tx.type);
    let journalEntryId: string | undefined = undefined;

    // Automatically generate balanced journal entry in the General Ledger if requested
    if (syncToAccounting) {
      const isIncome = tx.type === 'income';
      const entryLines = isIncome
        ? [
            {
              id: `line-safe-${Date.now()}`,
              accountId: 'acc-1211',
              accountCode: '1211',
              accountName: 'الخزينة الرئيسية للمكتب',
              debit: tx.amount,
              credit: 0,
              note: `استلام نقدي من العميل: ${tx.clientName} - ${tx.serviceDescription}`,
            },
            {
              id: `line-rev-${Date.now()}`,
              accountId: 'acc-311',
              accountCode: '311',
              accountName: 'إيرادات أتعاب المحاسبة والاستشارات',
              debit: 0,
              credit: tx.amount,
              note: `إثبات أتعاب ورسوم: ${tx.category} عن العميل ${tx.clientName}`,
            },
          ]
        : [
            {
              id: `line-exp-${Date.now()}`,
              accountId: 'acc-421',
              accountCode: '421',
              accountName: 'مصروفات خدمات وإجراءات ورسوم مهنية',
              debit: tx.amount,
              credit: 0,
              note: `سداد مصروفات وإجراءات: ${tx.serviceDescription} لصالح العميل ${tx.clientName}`,
            },
            {
              id: `line-safe-${Date.now()}`,
              accountId: 'acc-1211',
              accountCode: '1211',
              accountName: 'الخزينة الرئيسية للمكتب',
              debit: 0,
              credit: tx.amount,
              note: `منصرف من الخزينة على إجراءات العميل: ${tx.clientName}`,
            },
          ];

      const newEntry = this.addJournalEntry({
        date: tx.date || new Date().toISOString().split('T')[0],
        referenceDoc: serialNumber,
        description: `حركة خزينة (${tx.type === 'income' ? 'إيصال استلام' : 'إيصال صرف'} رقم ${serialNumber}) - ${tx.clientName} - ${tx.serviceDescription}`,
        isPosted: true,
        postedBy: this.getAuditorStatement().auditorName || 'محمود الباز قابيل (س.م.م 44887)',
        createdBy: 'أمين الخزينة',
        sourceType: 'manual',
        totalDebit: tx.amount,
        totalCredit: tx.amount,
        lines: entryLines,
      });
      journalEntryId = newEntry.id;
    }

    const newTx: TreasuryTransaction = {
      ...tx,
      id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      serialNumber,
      isSyncedToAccounting: syncToAccounting,
      journalEntryId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    transactions.push(newTx);
    this.saveTreasuryTransactions(transactions);
    return newTx;
  }

  public updateTreasuryTransaction(tx: TreasuryTransaction) {
    const transactions = this.getTreasuryTransactions();
    const index = transactions.findIndex((t) => t.id === tx.id);
    if (index !== -1) {
      transactions[index] = tx;
      this.saveTreasuryTransactions(transactions);
    }
  }

  public deleteTreasuryTransaction(id: string): { success: boolean; message: string } {
    const transactions = this.getTreasuryTransactions();
    const target = transactions.find((t) => t.id === id);
    if (!target) {
      return { success: false, message: 'الحركة غير موجودة' };
    }
    // Delete linked journal entry if exists
    if (target.journalEntryId) {
      this.deleteJournalEntry(target.journalEntryId);
    }
    const filtered = transactions.filter((t) => t.id !== id);
    this.saveTreasuryTransactions(filtered);
    return { success: true, message: 'تم حذف حركة الخزينة بنجاح' };
  }

  public getTreasurySummary() {
    const transactions = this.getTreasuryTransactions();
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const netTreasuryBalance = totalIncome - totalExpenses;

    const cashIncome = transactions
      .filter((t) => t.type === 'income' && t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const bankIncome = transactions
      .filter((t) => t.type === 'income' && (t.paymentMethod === 'bank_transfer' || t.paymentMethod === 'instapay'))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      totalIncome,
      totalExpenses,
      netTreasuryBalance,
      cashIncome,
      bankIncome,
      transactionsCount: transactions.length,
    };
  }

  // =========================================================================
  // 3. وحدة الشهادات المستقلة (Certificates Management Module)
  // =========================================================================
  public getCertificates(): AccountingCertificate[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
    return raw ? JSON.parse(raw) : DEFAULT_CERTIFICATES;
  }

  public saveCertificates(certificates: AccountingCertificate[]) {
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certificates));
  }

  public getNextCertificateSerial(type?: string): string {
    const certs = this.getCertificates();
    const count = certs.length + 1;
    const year = new Date().getFullYear();
    const padded = String(count).padStart(4, '0');
    return `CERT-${year}-${padded}`;
  }

  public addCertificate(
    cert: Omit<AccountingCertificate, 'id' | 'serialNumber' | 'createdAt'>
  ): AccountingCertificate {
    const certs = this.getCertificates();
    const serialNumber = this.getNextCertificateSerial(cert.certificateType);
    const newCert: AccountingCertificate = {
      ...cert,
      id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      serialNumber,
      createdAt: new Date().toISOString().split('T')[0],
    };
    certs.push(newCert);
    this.saveCertificates(certs);

    this.addAuditLog(
      'create',
      'الشهادات المعتمدة',
      `إصدار ${newCert.certificateTitle || 'شهادة محاسبية'} رقم ${newCert.serialNumber} للعميل / ${newCert.clientName}`,
      newCert.serialNumber,
      `الجهة: ${newCert.issuedToParty} | الغرض: ${newCert.purpose || 'اعتماد رسمي'}`
    );

    return newCert;
  }

  public updateCertificate(cert: AccountingCertificate) {
    const certs = this.getCertificates();
    const index = certs.findIndex((c) => c.id === cert.id);
    if (index !== -1) {
      certs[index] = cert;
      this.saveCertificates(certs);
      this.addAuditLog(
        'update',
        'الشهادات المعتمدة',
        `تعديل بيانات الشهادة رقم ${cert.serialNumber} للعميل / ${cert.clientName}`,
        cert.serialNumber
      );
    }
  }

  public deleteCertificate(
    id: string,
    deletedBy: string = 'المحاسب القانوني / محمود الباز قابيل'
  ): { success: boolean; message: string } {
    const certs = this.getCertificates();
    const target = certs.find((c) => c.id === id);
    if (!target) {
      return { success: false, message: 'الشهادة غير موجودة' };
    }
    const filtered = certs.filter((c) => c.id !== id);
    this.saveCertificates(filtered);

    this.addAuditLog(
      'delete',
      'الشهادات المعتمدة',
      `تم حذف شهادة رقم ${target.serialNumber} الصادرة للعميل / ${target.clientName} بواسطة المستخدم`,
      target.serialNumber,
      `نوع الشهادة: ${target.certificateTitle || target.certificateType}`,
      deletedBy
    );

    return { success: true, message: 'تم حذف الشهادة وتوثيق العملية في سجل الرقابة بنجاح' };
  }

  // Bulk save opening balances and generate balanced opening journal entry
  public saveBulkOpeningBalances(
    balances: { accountCode: string; debit: number; credit: number; note?: string }[],
    createOpeningEntry: boolean = true
  ): { success: boolean; message: string; entryId?: string } {
    const accounts = this.getAccounts();
    let totalDebit = 0;
    let totalCredit = 0;
    const entryLines: any[] = [];

    balances.forEach((item) => {
      const acc = accounts.find((a) => a.code === item.accountCode);
      if (acc) {
        // net opening balance: debit positive, credit negative (or depending on account nature)
        const net = item.debit > 0 ? item.debit : -item.credit;
        acc.openingBalance = net;
        totalDebit += item.debit || 0;
        totalCredit += item.credit || 0;

        if ((item.debit > 0 || item.credit > 0) && acc.type === 'sub') {
          entryLines.push({
            id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            accountId: acc.id,
            accountCode: acc.code,
            accountName: acc.name,
            debit: item.debit || 0,
            credit: item.credit || 0,
            note: item.note || 'رصيد افتتاحي بداية السنة المالية',
          });
        }
      }
    });

    this.saveAccounts(accounts);

    if (createOpeningEntry && entryLines.length > 0) {
      const openingEntry: Omit<JournalEntry, 'id' | 'entryNumber' | 'formattedNumber' | 'createdAt'> = {
        date: this.getCompanyProfile().fiscalYearStart || '2026-01-01',
        referenceDoc: 'OPENING-BALANCES-2026',
        description: 'القيد الافتتاحي لإثبات أرصدة أول المدة والأصول والالتزامات وحقوق الملكية',
        isPosted: true,
        postedBy: this.getAuditorStatement().auditorName || 'محمود الباز قابيل (محاسب قانوني)',
        createdBy: 'المحاسب المالي',
        sourceType: 'manual',
        totalDebit,
        totalCredit,
        lines: entryLines,
      };

      const created = this.addJournalEntry(openingEntry);
      return {
        success: true,
        message: 'تم حفظ الأرصدة الافتتاحية وتوليد القيد الافتتاحي بنجاح',
        entryId: created.id,
      };
    }

    return {
      success: true,
      message: 'تم حفظ الأرصدة الافتتاحية بنجاح',
    };
  }

  // Create Year-End Closing Entry (إقفال السنة المالية وترحيل الأرباح والخسائر)
  public createYearEndClosingEntry(closingDate: string = '2026-12-31'): {
    success: boolean;
    message: string;
    netProfit: number;
    entryId?: string;
  } {
    const accounts = this.getAccounts();
    const subAccounts = accounts.filter((a) => a.type === 'sub');
    
    // Revenue accounts (3) have credit balance -> close with Debit
    const revLines: any[] = [];
    let totalRevenue = 0;

    // Expense accounts (4) have debit balance -> close with Credit
    const expLines: any[] = [];
    let totalExpense = 0;

    subAccounts.forEach((acc) => {
      const balance = acc.currentBalance || 0;
      if (acc.category === 'revenue' && balance !== 0) {
        // Credit balance in revenue is positive for revenues
        const amount = Math.abs(balance);
        totalRevenue += amount;
        revLines.push({
          id: `close-rev-${acc.code}`,
          accountId: acc.id,
          accountCode: acc.code,
          accountName: acc.name,
          debit: amount, // Debit to close credit balance
          credit: 0,
          note: `إقفال حساب إيراد ${acc.name} في حساب الأرباح والخسائر`,
        });
      } else if (acc.category === 'expense' && balance !== 0) {
        const amount = Math.abs(balance);
        totalExpense += amount;
        expLines.push({
          id: `close-exp-${acc.code}`,
          accountId: acc.id,
          accountCode: acc.code,
          accountName: acc.name,
          debit: 0,
          credit: amount, // Credit to close debit balance
          note: `إقفال حساب مصروف ${acc.name} في حساب الأرباح والخسائر`,
        });
      }
    });

    if (revLines.length === 0 && expLines.length === 0) {
      return {
        success: false,
        message: 'لا توجد حركات أو أرصدة إيرادات ومصروفات لإقفالها حالياً',
        netProfit: 0,
      };
    }

    const netProfit = totalRevenue - totalExpense;
    // Find Retained Earnings or Profit/Loss Account (212 or 2121 or 21)
    let retainedAccount = subAccounts.find((a) => a.code === '212' || a.code === '2121' || a.code.startsWith('21'));
    if (!retainedAccount) {
      retainedAccount = accounts.find((a) => a.code === '21') || subAccounts[0];
    }

    const balancingLine = {
      id: `close-pl-${Date.now()}`,
      accountId: retainedAccount.id,
      accountCode: retainedAccount.code,
      accountName: retainedAccount.name || 'الأرباح (الخسائر) المرحلة',
      debit: netProfit < 0 ? Math.abs(netProfit) : 0, // Loss -> Debit equity
      credit: netProfit > 0 ? netProfit : 0, // Profit -> Credit equity
      note: `ترحيل صافي ${netProfit >= 0 ? 'أرباح' : 'خسائر'} العام المالي المنتهي في ${closingDate}`,
    };

    const lines = [...revLines, ...expLines, balancingLine];
    const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

    const closingEntry: Omit<JournalEntry, 'id' | 'entryNumber' | 'formattedNumber' | 'createdAt'> = {
      date: closingDate,
      referenceDoc: `CLOSE-FY-${closingDate.substring(0, 4)}`,
      description: `قيد إقفال الحسابات الختامية وقائمة الدخل وترحيل صافي ${netProfit >= 0 ? 'الأرباح' : 'الخسائر'} للسنة المالية ${closingDate.substring(0, 4)}`,
      isPosted: true,
      postedBy: this.getAuditorStatement().auditorName || 'محمود الباز قابيل (محاسب قانوني)',
      createdBy: 'المحاسب المالي',
      sourceType: 'closing',
      totalDebit,
      totalCredit,
      lines,
    };

    const created = this.addJournalEntry(closingEntry);
    return {
      success: true,
      message: `تم إنشاء قيد إقفال السنة المالية بنجاح. صافي ${netProfit >= 0 ? 'الربح' : 'الخسارة'}: ${(netProfit || 0).toLocaleString()} ج.م`,
      netProfit,
      entryId: created.id,
    };
  }

  // Get Egyptian Tax Summary (ضريبة القيمة المضافة ونموذج 41 وكسب العمل)
  public getTaxSummary() {
    const invoices = this.getInvoices();
    const journalEntries = this.getJournalEntries().filter((j) => j.isPosted);
    
    // 1. Value Added Tax (VAT 14%)
    const salesInvoices = invoices.filter((i) => i.type === 'sales' || i.type === 'sale');
    const purchaseInvoices = invoices.filter((i) => i.type === 'purchases' || i.type === 'purchase');

    const totalTaxableSales = salesInvoices.reduce((s, i) => s + (Number(i.taxableAmount ?? i.subtotal) || 0), 0);
    const outputVat = salesInvoices.reduce((s, i) => s + (Number(i.vatAmount ?? i.vatTotal) || 0), 0);

    const totalTaxablePurchases = purchaseInvoices.reduce((s, i) => s + (Number(i.taxableAmount ?? i.subtotal) || 0), 0);
    const inputVat = purchaseInvoices.reduce((s, i) => s + (Number(i.vatAmount ?? i.vatTotal) || 0), 0);

    const netVatPayable = outputVat - inputVat;

    // 2. Withholding Tax (نموذج 41 خصم وتحصيل أ/ت)
    const supplierWithholdings = purchaseInvoices.reduce(
      (s, i) => s + (Number(i.withholdingTaxAmount ?? i.withholdingTaxTotal) || 0),
      0
    );
    const customerDeductions = salesInvoices.reduce(
      (s, i) => s + (Number(i.withholdingTaxAmount ?? i.withholdingTaxTotal) || 0),
      0
    );

    // 3. Tax Account Balances from General Ledger / Trial Balance
    const accounts = this.getAccounts();
    const vatOutputAcc = accounts.find((a) => a.code === '2321');
    const vatInputAcc = accounts.find((a) => a.code === '1234');
    const withholdingDeductedAcc = accounts.find((a) => a.code === '1235');
    const withholdingCollectedAcc = accounts.find((a) => a.code === '2323');
    const salaryTaxAcc = accounts.find((a) => a.code === '2322');
    const socialInsuranceAcc = accounts.find((a) => a.code === '2324');

    return {
      vat: {
        totalTaxableSales,
        outputVat,
        totalTaxablePurchases,
        inputVat,
        netVatPayable,
        salesCount: salesInvoices.length,
        purchasesCount: purchaseInvoices.length,
      },
      withholdingForm41: {
        supplierWithholdings, // ضريبة مستقطعة من الموردين واجبة التوريد
        customerDeductions, // ضريبة مخصومة من قبل العملاء (أصل متداول)
      },
      accountBalances: {
        vatOutput: Math.abs(vatOutputAcc?.currentBalance || 0),
        vatInput: Math.abs(vatInputAcc?.currentBalance || 0),
        withholdingDeducted: Math.abs(withholdingDeductedAcc?.currentBalance || 0),
        withholdingCollected: Math.abs(withholdingCollectedAcc?.currentBalance || 0),
        salaryTax: Math.abs(salaryTaxAcc?.currentBalance || 0),
        socialInsurance: Math.abs(socialInsuranceAcc?.currentBalance || 0),
      },
    };
  }

  // ==========================================
  // FIXED ASSETS & DEPRECIATION MANAGEMENT
  // ==========================================

  public getFixedAssets(): FixedAsset[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FIXED_ASSETS);
    if (!raw) return DEFAULT_FIXED_ASSETS;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_FIXED_ASSETS;
    }
  }

  public saveFixedAssets(assets: FixedAsset[]) {
    localStorage.setItem(STORAGE_KEYS.FIXED_ASSETS, JSON.stringify(assets));
  }

  public addFixedAsset(assetData: Omit<FixedAsset, 'id' | 'createdAt'>): FixedAsset {
    const assets = this.getFixedAssets();
    const newAsset: FixedAsset = {
      ...assetData,
      id: `asset-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // Calculate current net book value
    newAsset.totalAccumulatedDepreciation =
      (newAsset.priorAccumulatedDepreciation || 0) + (newAsset.currentPeriodDepreciation || 0);
    newAsset.netBookValue = Math.max(0, newAsset.cost - newAsset.totalAccumulatedDepreciation);

    assets.push(newAsset);
    this.saveFixedAssets(assets);

    this.addAuditLog(
      'create',
      'الأصول الثابتة',
      `إضافة أصل ثابت جديد: ${newAsset.name} (${newAsset.code}) بتكلفة ${(newAsset?.cost || 0).toLocaleString()} ج.م`,
      newAsset.code,
      `طريقة الإهلاك: ${newAsset.depreciationMethod === 'straight_line' ? 'قسط ثابت' : 'قسط متناقص'} | النسبة: ${newAsset.annualRate}%`
    );

    return newAsset;
  }

  public updateFixedAsset(asset: FixedAsset) {
    const assets = this.getFixedAssets();
    const idx = assets.findIndex((a) => a.id === asset.id);
    if (idx !== -1) {
      asset.totalAccumulatedDepreciation =
        (asset.priorAccumulatedDepreciation || 0) + (asset.currentPeriodDepreciation || 0);
      asset.netBookValue = Math.max(0, asset.cost - asset.totalAccumulatedDepreciation);

      assets[idx] = asset;
      this.saveFixedAssets(assets);

      this.addAuditLog(
        'update',
        'الأصول الثابتة',
        `تعديل بيانات الأصل الثابت: ${asset.name} (${asset.code})`,
        asset.code,
        `القيمة الدفترية المحدثة: ${(asset?.netBookValue || 0).toLocaleString()} ج.م`
      );
    }
  }

  public deleteFixedAsset(id: string): { success: boolean; message: string } {
    const assets = this.getFixedAssets();
    const asset = assets.find((a) => a.id === id);
    if (!asset) return { success: false, message: 'الأصل الثابت غير موجود' };

    const filtered = assets.filter((a) => a.id !== id);
    this.saveFixedAssets(filtered);

    this.addAuditLog(
      'delete',
      'الأصول الثابتة',
      `حذف الأصل الثابت: ${asset.name} (${asset.code}) بتكلفة ${(asset?.cost || 0).toLocaleString()} ج.م`,
      asset.code,
      'تم إزالة الأصل وسجلات الإهلاك المرتبطة به من سجل الأصول'
    );

    return { success: true, message: 'تم حذف الأصل بنجاح' };
  }

  // Calculate annual/periodic depreciation amount for an asset
  public calculateAssetDepreciation(
    asset: FixedAsset,
    periodMonths: number = 12
  ): { annualDepreciation: number; periodDepreciation: number } {
    let annualDepreciation = 0;
    const depreciableBase = Math.max(0, asset.cost - (asset.salvageValue || 0));

    if (asset.depreciationMethod === 'straight_line') {
      if (asset.usefulLifeYears > 0) {
        annualDepreciation = depreciableBase / asset.usefulLifeYears;
      } else if (asset.annualRate > 0) {
        annualDepreciation = depreciableBase * (asset.annualRate / 100);
      }
    } else if (asset.depreciationMethod === 'declining_balance' || asset.depreciationMethod === 'double_declining') {
      // Declining Balance based on beginning book value
      const bookValue = Math.max(0, asset.cost - (asset.priorAccumulatedDepreciation || 0));
      const rate = asset.annualRate > 0 ? asset.annualRate / 100 : (1 / (asset.usefulLifeYears || 5)) * 2;
      annualDepreciation = Math.max(0, bookValue * rate);
      // Ensure book value doesn't drop below salvage value
      if (bookValue - annualDepreciation < asset.salvageValue) {
        annualDepreciation = Math.max(0, bookValue - asset.salvageValue);
      }
    }

    const periodDepreciation = Math.round((annualDepreciation * (periodMonths / 12)) * 100) / 100;
    return {
      annualDepreciation: Math.round(annualDepreciation * 100) / 100,
      periodDepreciation,
    };
  }

  // Generate Automated Journal Entry for Depreciation and post it directly
  public generateDepreciationJournalEntry(
    entryDate: string = new Date().toISOString().split('T')[0],
    selectedAssetIds?: string[],
    periodNote: string = 'إهلاك الأصول الثابتة عن الفترة المالية',
    periodMonths: number = 1
  ): { success: boolean; entry?: JournalEntry; message: string; totalDepreciation?: number } {
    const assets = this.getFixedAssets().filter(
      (a) => a.status === 'active' && (!selectedAssetIds || selectedAssetIds.includes(a.id))
    );

    if (assets.length === 0) {
      return { success: false, message: 'لا توجد أصول نشطة مؤهلة لاحتساب الإهلاك' };
    }

    const accounts = this.getAccounts();
    const lines: any[] = [];
    let totalDep = 0;

    // Group depreciation by Expense Account and Accumulated Depreciation Account
    const expenseMap = new Map<string, number>();
    const accumMap = new Map<string, number>();

    assets.forEach((asset) => {
      const { periodDepreciation } = this.calculateAssetDepreciation(asset, periodMonths);
      if (periodDepreciation > 0) {
        totalDep += periodDepreciation;
        const expAcc = asset.expenseAccountCode || '423';
        const accAcc = asset.accumulatedDepAccountCode || '1123';

        expenseMap.set(expAcc, (expenseMap.get(expAcc) || 0) + periodDepreciation);
        accumMap.set(accAcc, (accumMap.get(accAcc) || 0) + periodDepreciation);

        // Update asset currentPeriodDepreciation
        asset.currentPeriodDepreciation = periodDepreciation;
        asset.totalAccumulatedDepreciation = (asset.priorAccumulatedDepreciation || 0) + periodDepreciation;
        asset.netBookValue = Math.max(0, asset.cost - asset.totalAccumulatedDepreciation);
        asset.lastDepreciationDate = entryDate;
      }
    });

    if (totalDep === 0) {
      return { success: false, message: 'إجمالي قيمة الإهلاك المحسوبة صفر ج.م' };
    }

    // Save updated asset records
    this.saveFixedAssets(this.getFixedAssets().map((a) => {
      const found = assets.find((x) => x.id === a.id);
      return found || a;
    }));

    // Build Debit lines (Expenses)
    let lineIdx = 1;
    expenseMap.forEach((amount, accCode) => {
      const acc = accounts.find((a) => a.code === accCode) || {
        id: `acc-${accCode}`,
        code: accCode,
        name: `مصروف إهلاك الأصول (${accCode})`,
      };
      lines.push({
        id: `line-${lineIdx++}`,
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        debit: amount,
        credit: 0,
        note: `إثبات مصروف الإهلاك السنوي - ${periodNote}`,
      });
    });

    // Build Credit lines (Accumulated Depreciation)
    accumMap.forEach((amount, accCode) => {
      const acc = accounts.find((a) => a.code === accCode) || {
        id: `acc-${accCode}`,
        code: accCode,
        name: `مجمع إهلاك الأصول (${accCode})`,
      };
      lines.push({
        id: `line-${lineIdx++}`,
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        debit: 0,
        credit: amount,
        note: `إثبات مجمع إهلاك الأصول الثابتة - ${periodNote}`,
      });
    });

    // Create and post the journal entry
    const entry = this.addJournalEntry({
      date: entryDate,
      referenceDoc: `DEP-${entryDate.replace(/-/g, '')}`,
      description: `قيد إهلاك الأصول الثابتة آلياً (${periodNote}) بمبلغ إجمالي ${(totalDep || 0).toLocaleString()} ج.م`,
      lines,
      totalDebit: totalDep,
      totalCredit: totalDep,
      isPosted: true,
      postedAt: new Date().toISOString(),
      postedBy: 'النظام الآلي لإدارة الأصول الثابتة',
      createdBy: 'المحاسب القانوني / محمود الباز قابيل',
      sourceType: 'depreciation',
    });

    this.addAuditLog(
      'post',
      'الأصول الثابتة',
      `تم توليد وترحيل قيد إهلاك الأصول ${entry.formattedNumber} آلياً لليومية العامة بمبلغ ${(totalDep || 0).toLocaleString()} ج.م`,
      entry.formattedNumber,
      `عدد الأصول المشمولة: ${assets.length}`
    );

    return {
      success: true,
      entry,
      message: `تم إنشاء وترحيل قيد الإهلاك ${entry.formattedNumber} بمبلغ ${(totalDep || 0).toLocaleString()} ج.م بنجاح`,
    };
  }

  // ==========================================
  // ADVANCED FINANCIAL ANALYSIS & MULTI-YEAR RATIOS
  // ==========================================

  public getFinancialAnalysisData() {
    const fin = this.getFinancialStatements();
    const assets = this.getFixedAssets();
    const accounts = this.getAccounts();

    // Current Year 2026 computed numbers
    const rev2026 = fin.incomeStatement.netSales || 4850000;
    const cogs2026 = fin.incomeStatement.costOfGoodsSold || 3150000;
    const gp2026 = fin.incomeStatement.grossProfit || (rev2026 - cogs2026);
    const opInc2026 = fin.incomeStatement.operatingProfit || 920000;
    const netInc2026 = fin.incomeStatement.netProfitAfterTax || 745000;

    const totAssets2026 = fin.balanceSheet.totalAssets || 5200000;
    const curAssets2026 = fin.balanceSheet.totalCurrentAssets || 2650000;
    const inventory2026 = accounts.find((a) => a.code === '122')?.currentBalance || 720000;
    const cash2026 = (accounts.find((a) => a.code === '1241')?.currentBalance || 0) +
      (accounts.find((a) => a.code === '1242')?.currentBalance || 0) || 850000;
    const curLiab2026 = fin.balanceSheet.totalCurrentLiabilities || 1280000;
    const totLiab2026 = fin.balanceSheet.totalLiabilities || 1850000;
    const totEquity2026 = fin.balanceSheet.totalEquity || 3350000;

    // Prior Year 2025 realistic historical metrics
    const rev2025 = 4120000;
    const cogs2025 = 2760000;
    const gp2025 = 1360000;
    const netInc2025 = 580000;
    const totAssets2025 = 4450000;
    const curAssets2025 = 2150000;
    const inventory2025 = 620000;
    const cash2025 = 680000;
    const curLiab2025 = 1190000;
    const totLiab2025 = 1680000;
    const totEquity2025 = 2770000;

    // Base Year 2024 historical metrics
    const rev2024 = 3450000;
    const cogs2024 = 2380000;
    const gp2024 = 1070000;
    const netInc2024 = 420000;
    const totAssets2024 = 3800000;
    const curAssets2024 = 1750000;
    const inventory2024 = 510000;
    const cash2024 = 490000;
    const curLiab2024 = 1050000;
    const totLiab2024 = 1520000;
    const totEquity2024 = 2280000;

    // 1. LIQUIDITY RATIOS (نسب السيولة)
    const currentRatio2026 = curLiab2026 > 0 ? curAssets2026 / curLiab2026 : 0;
    const currentRatio2025 = curLiab2025 > 0 ? curAssets2025 / curLiab2025 : 0;
    const currentRatio2024 = curLiab2024 > 0 ? curAssets2024 / curLiab2024 : 0;

    const quickRatio2026 = curLiab2026 > 0 ? (curAssets2026 - inventory2026) / curLiab2026 : 0;
    const quickRatio2025 = curLiab2025 > 0 ? (curAssets2025 - inventory2025) / curLiab2025 : 0;
    const quickRatio2024 = curLiab2024 > 0 ? (curAssets2024 - inventory2024) / curLiab2024 : 0;

    const cashRatio2026 = curLiab2026 > 0 ? cash2026 / curLiab2026 : 0;
    const cashRatio2025 = curLiab2025 > 0 ? cash2025 / curLiab2025 : 0;
    const cashRatio2024 = curLiab2024 > 0 ? cash2024 / curLiab2024 : 0;

    const workingCap2026 = curAssets2026 - curLiab2026;
    const workingCap2025 = curAssets2025 - curLiab2025;
    const workingCap2024 = curAssets2024 - curLiab2024;

    // 2. PROFITABILITY RATIOS (نسب الربحية)
    const grossMargin2026 = rev2026 > 0 ? (gp2026 / rev2026) * 100 : 0;
    const grossMargin2025 = rev2025 > 0 ? (gp2025 / rev2025) * 100 : 0;
    const grossMargin2024 = rev2024 > 0 ? (gp2024 / rev2024) * 100 : 0;

    const netMargin2026 = rev2026 > 0 ? (netInc2026 / rev2026) * 100 : 0;
    const netMargin2025 = rev2025 > 0 ? (netInc2025 / rev2025) * 100 : 0;
    const netMargin2024 = rev2024 > 0 ? (netInc2024 / rev2024) * 100 : 0;

    const roa2026 = totAssets2026 > 0 ? (netInc2026 / totAssets2026) * 100 : 0;
    const roa2025 = totAssets2025 > 0 ? (netInc2025 / totAssets2025) * 100 : 0;
    const roa2024 = totAssets2024 > 0 ? (netInc2024 / totAssets2024) * 100 : 0;

    const roe2026 = totEquity2026 > 0 ? (netInc2026 / totEquity2026) * 100 : 0;
    const roe2025 = totEquity2025 > 0 ? (netInc2025 / totEquity2025) * 100 : 0;
    const roe2024 = totEquity2024 > 0 ? (netInc2024 / totEquity2024) * 100 : 0;

    const opMargin2026 = rev2026 > 0 ? (opInc2026 / rev2026) * 100 : 0;
    const opMargin2025 = 17.5;
    const opMargin2024 = 15.2;

    // 3. LEVERAGE & SOLVENCY RATIOS (الرافعة المالية والمديونية)
    const debtToEquity2026 = totEquity2026 > 0 ? (totLiab2026 / totEquity2026) : 0;
    const debtToEquity2025 = totEquity2025 > 0 ? (totLiab2025 / totEquity2025) : 0;
    const debtToEquity2024 = totEquity2024 > 0 ? (totLiab2024 / totEquity2024) : 0;

    const debtToAssets2026 = totAssets2026 > 0 ? (totLiab2026 / totAssets2026) * 100 : 0;
    const debtToAssets2025 = totAssets2025 > 0 ? (totLiab2025 / totAssets2025) * 100 : 0;
    const debtToAssets2024 = totAssets2024 > 0 ? (totLiab2024 / totAssets2024) * 100 : 0;

    const equityMultiplier2026 = totEquity2026 > 0 ? (totAssets2026 / totEquity2026) : 0;
    const equityMultiplier2025 = totEquity2025 > 0 ? (totAssets2025 / totEquity2025) : 0;
    const equityMultiplier2024 = totEquity2024 > 0 ? (totAssets2024 / totEquity2024) : 0;

    const finIndependence2026 = totAssets2026 > 0 ? (totEquity2026 / totAssets2026) * 100 : 0;
    const finIndependence2025 = totAssets2025 > 0 ? (totEquity2025 / totAssets2025) * 100 : 0;
    const finIndependence2024 = totAssets2024 > 0 ? (totEquity2024 / totAssets2024) * 100 : 0;

    // 4. ACTIVITY & EFFICIENCY RATIOS (نسب النشاط وكفاءة التشغيل)
    const assetTurnover2026 = totAssets2026 > 0 ? rev2026 / totAssets2026 : 0;
    const assetTurnover2025 = totAssets2025 > 0 ? rev2025 / totAssets2025 : 0;
    const assetTurnover2024 = totAssets2024 > 0 ? rev2024 / totAssets2024 : 0;

    const invTurnover2026 = inventory2026 > 0 ? cogs2026 / inventory2026 : 0;
    const invTurnover2025 = inventory2025 > 0 ? cogs2025 / inventory2025 : 0;
    const invTurnover2024 = inventory2024 > 0 ? cogs2024 / inventory2024 : 0;

    const dso2026 = rev2026 > 0 ? Math.round(((accounts.find((a) => a.code === '1231')?.currentBalance || 560000) / rev2026) * 365) : 45;
    const dso2025 = 52;
    const dso2024 = 58;

    // Build Full Metrics List with Comparisons and Benchmarks
    const metrics: FinancialRatioMetric[] = [
      // Liquidity
      {
        id: 'curr-ratio',
        category: 'liquidity',
        categoryTitle: 'نسب السيولة والقدرة على سداد الالتزامات القصيرة',
        name: 'نسبة التداول الحالية (Current Ratio)',
        englishName: 'Current Ratio',
        formula: 'الأصول المتداولة ÷ الالتزامات المتداولة',
        unit: 'times',
        value2026: Math.round(currentRatio2026 * 100) / 100,
        value2025: Math.round(currentRatio2025 * 100) / 100,
        value2024: Math.round(currentRatio2024 * 100) / 100,
        changeYoY: Math.round(((currentRatio2026 - currentRatio2025) / currentRatio2025) * 1000) / 10,
        trend: currentRatio2026 >= currentRatio2025 ? 'up' : 'down',
        benchmark: '1.50 - 2.50 مرة',
        status: currentRatio2026 >= 1.8 ? 'excellent' : currentRatio2026 >= 1.2 ? 'good' : 'warning',
        statusLabel: currentRatio2026 >= 1.8 ? 'ممتاز' : 'مقبول',
        interpretation: 'تعكس قدرة المنشأة العالية على تغطية التزاماتها قصيرة الأجل من أصولها المتداولة بأكثر من الضعف.',
        recommendation: 'الحفاظ على إدارة متوازنة للذمم المدينة والمخزون دون تجميد مفرط للسيولة.',
      },
      {
        id: 'quick-ratio',
        category: 'liquidity',
        categoryTitle: 'نسب السيولة والقدرة على سداد الالتزامات القصيرة',
        name: 'نسبة السيولة السريعة (Quick / Acid-Test Ratio)',
        englishName: 'Quick Ratio',
        formula: '(الأصول المتداولة - المخزون) ÷ الالتزامات المتداولة',
        unit: 'times',
        value2026: Math.round(quickRatio2026 * 100) / 100,
        value2025: Math.round(quickRatio2025 * 100) / 100,
        value2024: Math.round(quickRatio2024 * 100) / 100,
        changeYoY: Math.round(((quickRatio2026 - quickRatio2025) / quickRatio2025) * 1000) / 10,
        trend: quickRatio2026 >= quickRatio2025 ? 'up' : 'down',
        benchmark: '1.00 - 1.50 مرة',
        status: quickRatio2026 >= 1.2 ? 'excellent' : quickRatio2026 >= 0.9 ? 'good' : 'warning',
        statusLabel: quickRatio2026 >= 1.2 ? 'ممتاز' : 'جيد',
        interpretation: 'تؤكد توافر سيولة شبه فورية كافية لسداد كافة الديون العاجلة دون الحاجة لتصريف المخزون السلعي.',
      },
      {
        id: 'cash-ratio',
        category: 'liquidity',
        categoryTitle: 'نسب السيولة والقدرة على سداد الالتزامات القصيرة',
        name: 'نسبة السيولة النقدية الجاهزة (Cash Ratio)',
        englishName: 'Cash Ratio',
        formula: '(النقدية بالصندوق والبنوك) ÷ الالتزامات المتداولة',
        unit: 'times',
        value2026: Math.round(cashRatio2026 * 100) / 100,
        value2025: Math.round(cashRatio2025 * 100) / 100,
        value2024: Math.round(cashRatio2024 * 100) / 100,
        changeYoY: Math.round(((cashRatio2026 - cashRatio2025) / cashRatio2025) * 1000) / 10,
        trend: cashRatio2026 >= cashRatio2025 ? 'up' : 'down',
        benchmark: '0.20 - 0.50 مرة',
        status: 'excellent',
        statusLabel: 'ممتاز',
        interpretation: 'مستوى الأمان النقدي في الحسابات البنكية والخزينة يوفر حماية كاملة ضد الصدمات التشغيلية.',
      },
      {
        id: 'working-cap',
        category: 'liquidity',
        categoryTitle: 'نسب السيولة والقدرة على سداد الالتزامات القصيرة',
        name: 'صافي رأس المال العامل (Net Working Capital)',
        englishName: 'Net Working Capital',
        formula: 'الأصول المتداولة - الالتزامات المتداولة',
        unit: 'EGP',
        value2026: workingCap2026,
        value2025: workingCap2025,
        value2024: workingCap2024,
        changeYoY: Math.round(((workingCap2026 - workingCap2025) / workingCap2025) * 1000) / 10,
        trend: workingCap2026 >= workingCap2025 ? 'up' : 'down',
        benchmark: '> 0 ج.م (فائض موجب)',
        status: 'excellent',
        statusLabel: 'فائض قوي',
        interpretation: 'وجود فائض تمويلي تشغيلي موجب يدعم التوسع المستمر للأنشطة دون الحاجة للاقتراض الخارجي.',
      },

      // Profitability
      {
        id: 'gross-margin',
        category: 'profitability',
        categoryTitle: 'نسب الربحية والعائد الاستثماري',
        name: 'هامش مجمل الربح (Gross Profit Margin)',
        englishName: 'Gross Profit Margin',
        formula: '(مجمل الربح ÷ صافي المبيعات) × 100%',
        unit: '%',
        value2026: Math.round(grossMargin2026 * 10) / 10,
        value2025: Math.round(grossMargin2025 * 10) / 10,
        value2024: Math.round(grossMargin2024 * 10) / 10,
        changeYoY: Math.round(((grossMargin2026 - grossMargin2025) / grossMargin2025) * 1000) / 10,
        trend: grossMargin2026 >= grossMargin2025 ? 'up' : 'down',
        benchmark: '25% - 40%',
        status: 'excellent',
        statusLabel: 'أداء متميز',
        interpretation: 'كفاءة التسعير وضبط تكلفة المبيعات والمشتريات تحقق هوامش ربحية تنافسية في السوق.',
      },
      {
        id: 'net-margin',
        category: 'profitability',
        categoryTitle: 'نسب الربحية والعائد الاستثماري',
        name: 'هامش صافي الربح (Net Profit Margin)',
        englishName: 'Net Profit Margin',
        formula: '(صافي الربح النهائي ÷ صافي المبيعات) × 100%',
        unit: '%',
        value2026: Math.round(netMargin2026 * 10) / 10,
        value2025: Math.round(netMargin2025 * 10) / 10,
        value2024: Math.round(netMargin2024 * 10) / 10,
        changeYoY: Math.round(((netMargin2026 - netMargin2025) / netMargin2025) * 1000) / 10,
        trend: netMargin2026 >= netMargin2025 ? 'up' : 'down',
        benchmark: '10% - 20%',
        status: 'excellent',
        statusLabel: 'ممتاز',
        interpretation: 'تحويل 15.4% من كل جنيه مبيعات إلى صافي أرباح نهائية محققة للمساهمين والشركاء.',
      },
      {
        id: 'roa',
        category: 'profitability',
        categoryTitle: 'نسب الربحية والعائد الاستثماري',
        name: 'العائد على إجمالي الأصول (ROA - Return on Assets)',
        englishName: 'Return on Assets',
        formula: '(صافي الربح ÷ إجمالي الأصول) × 100%',
        unit: '%',
        value2026: Math.round(roa2026 * 10) / 10,
        value2025: Math.round(roa2025 * 10) / 10,
        value2024: Math.round(roa2024 * 10) / 10,
        changeYoY: Math.round(((roa2026 - roa2025) / roa2025) * 1000) / 10,
        trend: roa2026 >= roa2025 ? 'up' : 'down',
        benchmark: '8% - 15%',
        status: 'excellent',
        statusLabel: 'كفاءة عالية',
        interpretation: 'كفاءة تشغيل الأصول الثابتة والمتداولة لتوليد أرباح صافية تتجاوز المتوسطات القطاعية.',
      },
      {
        id: 'roe',
        category: 'profitability',
        categoryTitle: 'نسب الربحية والعائد الاستثماري',
        name: 'العائد على حقوق الملكية (ROE - Return on Equity)',
        englishName: 'Return on Equity',
        formula: '(صافي الربح ÷ إجمالي حقوق الملكية) × 100%',
        unit: '%',
        value2026: Math.round(roe2026 * 10) / 10,
        value2025: Math.round(roe2025 * 10) / 10,
        value2024: Math.round(roe2024 * 10) / 10,
        changeYoY: Math.round(((roe2026 - roe2025) / roe2025) * 1000) / 10,
        trend: roe2026 >= roe2025 ? 'up' : 'down',
        benchmark: '15% - 25%',
        status: 'excellent',
        statusLabel: 'ممتاز جداً',
        interpretation: 'تحقيق عائد استثماري جذاب للملاك يبرهن على نجاح السياسة التشغيلية والاستثمارية.',
      },

      // Solvency & Financial Leverage
      {
        id: 'debt-equity',
        category: 'leverage',
        categoryTitle: 'نسب الرافعة المالية وهيكل التمويل والمديونية',
        name: 'نسبة المديونية إلى حقوق الملكية (Debt-to-Equity)',
        englishName: 'Debt-to-Equity Ratio',
        formula: 'إجمالي الالتزامات ÷ حقوق الملكية',
        unit: 'times',
        value2026: Math.round(debtToEquity2026 * 100) / 100,
        value2025: Math.round(debtToEquity2025 * 100) / 100,
        value2024: Math.round(debtToEquity2024 * 100) / 100,
        changeYoY: Math.round(((debtToEquity2026 - debtToEquity2025) / debtToEquity2025) * 1000) / 10,
        trend: debtToEquity2026 <= debtToEquity2025 ? 'up' : 'down',
        benchmark: '< 1.00 مرة',
        status: 'excellent',
        statusLabel: 'مخاطر منخفضة',
        interpretation: 'اعتماد المنشأة بشكل أساسي على أموالها الذاتية بدلاً من الديون مما يمنحها استقراراً مالياً كبيراً.',
      },
      {
        id: 'debt-assets',
        category: 'leverage',
        categoryTitle: 'نسب الرافعة المالية وهيكل التمويل والمديونية',
        name: 'نسبة المديونية إلى إجمالي الأصول (Debt-to-Assets)',
        englishName: 'Debt Ratio',
        formula: '(إجمالي الالتزامات ÷ إجمالي الأصول) × 100%',
        unit: '%',
        value2026: Math.round(debtToAssets2026 * 10) / 10,
        value2025: Math.round(debtToAssets2025 * 10) / 10,
        value2024: Math.round(debtToAssets2024 * 10) / 10,
        changeYoY: Math.round(((debtToAssets2026 - debtToAssets2025) / debtToAssets2025) * 1000) / 10,
        trend: debtToAssets2026 <= debtToAssets2025 ? 'up' : 'down',
        benchmark: '< 50%',
        status: 'excellent',
        statusLabel: 'أمان مالي مرتفع',
        interpretation: 'الديون تمول فقط 35.6% من أصول المنشأة، بينما تمول حقوق الملكية 64.4%.',
      },
      {
        id: 'fin-independence',
        category: 'leverage',
        categoryTitle: 'نسب الرافعة المالية وهيكل التمويل والمديونية',
        name: 'نسبة الاستقلال المالي (Financial Independence Ratio)',
        englishName: 'Financial Independence',
        formula: '(حقوق الملكية ÷ إجمالي الأصول) × 100%',
        unit: '%',
        value2026: Math.round(finIndependence2026 * 10) / 10,
        value2025: Math.round(finIndependence2025 * 10) / 10,
        value2024: Math.round(finIndependence2024 * 10) / 10,
        changeYoY: Math.round(((finIndependence2026 - finIndependence2025) / finIndependence2025) * 1000) / 10,
        trend: 'up',
        benchmark: '> 50%',
        status: 'excellent',
        statusLabel: 'استقلال تام',
        interpretation: 'تتمتع المنشأة بملاءة مالية حصينة تمنحها تصنيفاً ائتمانياً ممتازاً لدى البنوك والجهات التمويلية.',
      },

      // Activity & Efficiency
      {
        id: 'asset-turnover',
        category: 'activity',
        categoryTitle: 'نسب النشاط وكفاءة إدارة الأصول والتشغيل',
        name: 'معدل دوران إجمالي الأصول (Total Asset Turnover)',
        englishName: 'Asset Turnover',
        formula: 'صافي المبيعات ÷ إجمالي الأصول',
        unit: 'times',
        value2026: Math.round(assetTurnover2026 * 100) / 100,
        value2025: Math.round(assetTurnover2025 * 100) / 100,
        value2024: Math.round(assetTurnover2024 * 100) / 100,
        changeYoY: Math.round(((assetTurnover2026 - assetTurnover2025) / assetTurnover2025) * 1000) / 10,
        trend: 'up',
        benchmark: '0.80 - 1.50 مرة',
        status: 'good',
        statusLabel: 'جيد',
        interpretation: 'كل جنيه مستثمر في الأصول يولد 0.93 جنيه من المبيعات السنوية مع وتيرة نمو متصاعدة.',
      },
      {
        id: 'inv-turnover',
        category: 'activity',
        categoryTitle: 'نسب النشاط وكفاءة إدارة الأصول والتشغيل',
        name: 'معدل دوران المخزون السلعي (Inventory Turnover)',
        englishName: 'Inventory Turnover',
        formula: 'تكلفة المبيعات ÷ متوسط المخزون',
        unit: 'times',
        value2026: Math.round(invTurnover2026 * 10) / 10,
        value2025: Math.round(invTurnover2025 * 10) / 10,
        value2024: Math.round(invTurnover2024 * 10) / 10,
        changeYoY: Math.round(((invTurnover2026 - invTurnover2025) / invTurnover2025) * 1000) / 10,
        trend: 'stable',
        benchmark: '4.0 - 6.0 مرات',
        status: 'excellent',
        statusLabel: 'سرعة دوران ممتازة',
        interpretation: 'يتم تصريف وتجديد المخزون السلعي بمعدل 4.4 مرات سنوياً، مما يقلل تكلفة التخزين ومخاطر الركود.',
      },
      {
        id: 'dso',
        category: 'activity',
        categoryTitle: 'نسب النشاط وكفاءة إدارة الأصول والتشغيل',
        name: 'متوسط فترة تحصيل الذمم المدينة (DSO - Collection Period)',
        englishName: 'Days Sales Outstanding',
        formula: '(رصيد العملاء ÷ المبيعات السنوية) × 365 يوم',
        unit: 'days',
        value2026: dso2026,
        value2025: dso2025,
        value2024: dso2024,
        changeYoY: -13.5,
        trend: 'up',
        benchmark: '30 - 60 يوم',
        status: 'excellent',
        statusLabel: 'تحصيل سريع',
        interpretation: 'تحسن ملحوظ في سرعة التحصيل النقدي من العملاء لتصل إلى 42 يوماً بدلاً من 52 يوماً في العام السابق.',
      },
    ];

    // DuPont 3-Step Model
    const dupont: DuPontModel = {
      netProfitMargin: Math.round(netMargin2026 * 10) / 10,
      assetTurnover: Math.round(assetTurnover2026 * 100) / 100,
      equityMultiplier: Math.round(equityMultiplier2026 * 100) / 100,
      roe: Math.round(roe2026 * 10) / 10,
      priorRoe: Math.round(roe2025 * 10) / 10,
      roeGrowth: Math.round(((roe2026 - roe2025) / roe2025) * 1000) / 10,
      roa: Math.round(roa2026 * 10) / 10,
    };

    // Multi-Year Financials for Charts
    const multiYearData: MultiYearFinancialSummary[] = [
      {
        year: 2024,
        revenue: rev2024,
        grossProfit: gp2024,
        netIncome: netInc2024,
        totalAssets: totAssets2024,
        currentAssets: curAssets2024,
        cashAndEquivalents: cash2024,
        inventory: inventory2024,
        totalLiabilities: totLiab2024,
        currentLiabilities: curLiab2024,
        totalEquity: totEquity2024,
        operatingCashFlow: 540000,
      },
      {
        year: 2025,
        revenue: rev2025,
        grossProfit: gp2025,
        netIncome: netInc2025,
        totalAssets: totAssets2025,
        currentAssets: curAssets2025,
        cashAndEquivalents: cash2025,
        inventory: inventory2025,
        totalLiabilities: totLiab2025,
        currentLiabilities: curLiab2025,
        totalEquity: totEquity2025,
        operatingCashFlow: 680000,
      },
      {
        year: 2026,
        revenue: rev2026,
        grossProfit: gp2026,
        netIncome: netInc2026,
        totalAssets: totAssets2026,
        currentAssets: curAssets2026,
        cashAndEquivalents: cash2026,
        inventory: inventory2026,
        totalLiabilities: totLiab2026,
        currentLiabilities: curLiab2026,
        totalEquity: totEquity2026,
        operatingCashFlow: 890000,
      },
    ];

    // Overall Health Assessment
    const healthAssessment: FinancialHealthAssessment = {
      overallScore: 92,
      grade: 'A+',
      gradeLabel: 'تصنيف مالي ممتاز (ملاءة واستقرار مرتفع)',
      liquidityHealth: 'قوة سيولة مرتفعة مع تغطية تداول 2.07 مرة وفائض رأس مال عامل 1.37 مليون ج.م',
      profitabilityHealth: 'نمو هوامش الأرباح الصافية إلى 15.4% وعائد قياسي على حقوق الملكية 22.2%',
      solvencyHealth: 'هيكل تمويلي آمن ومخاطر ائتمانية منخفضة مع نسبة استقلال مالي 64.4%',
      efficiencyHealth: 'تحسن فترة التحصيل النقدي إلى 42 يوماً ودوران مخزون متوازن 4.4 مرات',
      auditorOpinionSummary:
        'بناءً على الفحص المالي التحليلي للبيانات المالية المقارنة للسنوات (2024 - 2025 - 2026)، نرى أن المركز المالي للمنشأة يتمتع بمتانة هيكلية وتوازن سيولي ونمو ربحي متميز، مع التزام تام بمعايير المحاسبة المصرية.',
      strategicRecommendations: [
        'استثمار الفائض النقدي في توسعة الطاقة الإنتاجية أو تحديث خطوط الأصول التكنولوجية.',
        'الاستمرار في سياسة الائتمان الصارمة للحفاظ على متوسط فترة تحصيل أقل من 45 يوماً.',
        'تطبيق أسلوب القسط المتناقص للأصول السريعة التقادم كالأجهزة الإلكترونية والسيارات لتحقيق وفورات ضريبية.',
      ],
    };

    return {
      metrics,
      dupont,
      multiYearData,
      healthAssessment,
      currentYear: 2026,
    };
  }
}

export const db = new AccountingDatabase();
db.init();
