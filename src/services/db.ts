import { DEFAULT_CHART_OF_ACCOUNTS } from '../data/defaultChartOfAccounts';
import {
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
  CompanyProfile,
  FinancialRatio,
  Invoice,
  JournalEntry,
  Party,
  TrialBalanceItem,
} from '../types/accounting';
import {
  AccountingCertificate,
  CertificateType,
  ClientArchive,
  TreasuryTransaction,
  TreasuryTransactionType,
} from '../types/office';

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
    return newEntry;
  }

  public updateJournalEntry(entry: JournalEntry) {
    const entries = this.getJournalEntries();
    const index = entries.findIndex((e) => e.id === entry.id);
    if (index !== -1) {
      entries[index] = entry;
      this.saveJournalEntries(entries);
    }
  }

  public deleteJournalEntry(id: string): { success: boolean; message: string } {
    const entries = this.getJournalEntries();
    const entry = entries.find((e) => e.id === id);
    if (!entry) {
      return { success: false, message: 'القيد غير موجود' };
    }

    const filtered = entries.filter((e) => e.id !== id);
    this.saveJournalEntries(filtered);
    return { success: true, message: 'تم حذف القيد بنجاح' };
  }

  public postEntry(id: string, auditorName: string = 'محمود الباز قابيل (محاسب قانوني)'): boolean {
    const entries = this.getJournalEntries();
    const entry = entries.find((e) => e.id === id);
    if (entry) {
      entry.isPosted = true;
      entry.postedAt = new Date().toISOString().replace('T', ' ').substr(0, 16);
      entry.postedBy = auditorName;
      this.saveJournalEntries(entries);
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
    return newCert;
  }

  public updateCertificate(cert: AccountingCertificate) {
    const certs = this.getCertificates();
    const index = certs.findIndex((c) => c.id === cert.id);
    if (index !== -1) {
      certs[index] = cert;
      this.saveCertificates(certs);
    }
  }

  public deleteCertificate(id: string): { success: boolean; message: string } {
    const certs = this.getCertificates();
    const filtered = certs.filter((c) => c.id !== id);
    if (filtered.length === certs.length) {
      return { success: false, message: 'الشهادة غير موجودة' };
    }
    this.saveCertificates(filtered);
    return { success: true, message: 'تم حذف الشهادة من الأرشيف بنجاح' };
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
      message: `تم إنشاء قيد إقفال السنة المالية بنجاح. صافي ${netProfit >= 0 ? 'الربح' : 'الخسارة'}: ${netProfit.toLocaleString()} ج.م`,
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
}

export const db = new AccountingDatabase();
db.init();
