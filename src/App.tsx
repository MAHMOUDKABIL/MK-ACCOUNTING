import React, { useEffect, useState } from 'react';
import { AuditorReportView } from './components/AuditorReportView';
import { AuditLogView } from './components/AuditLogView';
import { BankReconciliationView } from './components/BankReconciliationView';
import { CertificatesManagementView } from './components/CertificatesManagementView';
import { ChartOfAccountsView } from './components/ChartOfAccountsView';
import { ClientsArchiveView } from './components/ClientsArchiveView';
import { Dashboard } from './components/Dashboard';
import { EInvoiceETAView } from './components/EInvoiceETAView';
import { FinancialAnalysisView } from './components/FinancialAnalysisView';
import { FinancialScenarioStudioView } from './components/FinancialScenarioStudioView';
import { FinancialStatementsView } from './components/FinancialStatementsView';
import { FixedAssetsView } from './components/FixedAssetsView';
import { GeneralLedgerView } from './components/GeneralLedgerView';
import { Header } from './components/Header';
import { InvoicesView } from './components/InvoicesView';
import { JournalEntriesView } from './components/JournalEntriesView';
import { OpeningBalancesModal } from './components/OpeningBalancesModal';
import { PartiesView } from './components/PartiesView';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { SmartEntryModal } from './components/SmartEntryModal';
import { TaxAssistantView } from './components/TaxAssistantView';
import { TreasuryFinancialView } from './components/TreasuryFinancialView';
import { TrialBalanceView } from './components/TrialBalanceView';
import { YearEndClosingModal } from './components/YearEndClosingModal';
import { MobileBottomNavigation } from './components/MobileBottomNavigation';
import { KPIDashboardView } from './components/KPIDashboardView';
import { CertificateVerificationCenterModal } from './components/CertificateVerificationCenterModal';
import { db } from './services/db';
import {
  Account,
  AuditorStatement,
  CompanyProfile,
  FinancialRatio,
  Invoice,
  JournalEntry,
  Party,
  TrialBalanceItem,
} from './types/accounting';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetLedgerAccountCode, setTargetLedgerAccountCode] = useState<string>('1242');
  const [isSmartEntryModalOpen, setIsSmartEntryModalOpen] = useState(false);
  const [isOpeningBalancesModalOpen, setIsOpeningBalancesModalOpen] = useState(false);
  const [isYearEndClosingModalOpen, setIsYearEndClosingModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isVerificationCenterOpen, setIsVerificationCenterOpen] = useState(false);
  const [verificationInitialSerial, setVerificationInitialSerial] = useState('');

  // Core Database States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(db.getCompanyProfile());
  const [auditorStatement, setAuditorStatement] = useState<AuditorStatement>(db.getAuditorStatement());

  // Computed Financial States
  const [financialData, setFinancialData] = useState<any>(null);
  const [trialBalanceData, setTrialBalanceData] = useState<{
    items: TrialBalanceItem[];
    totals: any;
  } | null>(null);

  // Load all records from local database
  const refreshDatabase = () => {
    const accs = db.getAccounts();
    const jvs = db.getJournalEntries();
    const invs = db.getInvoices();
    const pts = db.getParties();
    const profile = db.getCompanyProfile();
    const auditor = db.getAuditorStatement();

    setAccounts(accs);
    setJournalEntries(jvs);
    setInvoices(invs);
    setParties(pts);
    setCompanyProfile(profile);
    setAuditorStatement(auditor);

    // Compute reports
    const fin = db.getFinancialStatements();
    const tb = db.getTrialBalance();
    setFinancialData(fin);
    setTrialBalanceData(tb);
  };

  useEffect(() => {
    refreshDatabase();

    // Check if the URL was opened by scanning a certificate's QR code
    try {
      const params = new URLSearchParams(window.location.search);
      const verifyCertParam = params.get('verifyCert') || params.get('serial') || params.get('cert');
      if (verifyCertParam) {
        setVerificationInitialSerial(verifyCertParam.trim());
        setIsVerificationCenterOpen(true);
      }
    } catch (e) {
      console.error('Error parsing certificate verification URL query:', e);
    }
  }, []);

  // Handlers for Accounts
  const handleAddAccount = (acc: Omit<Account, 'id'>) => {
    db.addAccount(acc);
    refreshDatabase();
  };

  const handleUpdateAccount = (acc: Account) => {
    db.updateAccount(acc);
    refreshDatabase();
  };

  const handleDeleteAccount = (id: string) => {
    const res = db.deleteAccount(id);
    if (res.success) {
      refreshDatabase();
    }
    return res;
  };

  // Handlers for Journal Entries
  const handleAddJournalEntry = (
    entry: Omit<JournalEntry, 'id' | 'entryNumber' | 'formattedNumber' | 'createdAt'>
  ) => {
    db.addJournalEntry(entry);
    refreshDatabase();
  };

  const handleUpdateJournalEntry = (entry: JournalEntry) => {
    db.updateJournalEntry(entry);
    refreshDatabase();
  };

  const handleDeleteJournalEntry = (id: string) => {
    const res = db.deleteJournalEntry(id);
    if (res.success) {
      refreshDatabase();
    }
    return res;
  };

  const handlePostJournalEntry = (id: string) => {
    db.postJournalEntry(id);
    refreshDatabase();
  };

  const handleUnpostJournalEntry = (id: string) => {
    db.unpostJournalEntry(id);
    refreshDatabase();
  };

  const handlePostAllEntries = () => {
    db.postAllUnpostedEntries();
    refreshDatabase();
  };

  // Handlers for Invoices
  const handleAddInvoice = (
    invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'formattedNumber' | 'createdAt'>
  ) => {
    db.addInvoice(invoice);
    refreshDatabase();
  };

  const handleUpdateInvoice = (invoice: Invoice) => {
    db.updateInvoice(invoice);
    refreshDatabase();
  };

  const handleDeleteInvoice = (id: string) => {
    db.deleteInvoice(id);
    refreshDatabase();
  };

  // Handlers for Parties
  const handleAddParty = (party: Omit<Party, 'id' | 'createdAt'>) => {
    db.addParty(party);
    refreshDatabase();
  };

  const handleUpdateParty = (party: Party) => {
    db.updateParty(party);
    refreshDatabase();
  };

  const handleDeleteParty = (id: string) => {
    db.deleteParty(id);
    refreshDatabase();
  };

  // Handlers for Profile and Auditor Statement
  const handleUpdateCompanyProfile = (profile: CompanyProfile) => {
    db.updateCompanyProfile(profile);
    refreshDatabase();
  };

  const handleUpdateAuditorStatement = (statement: AuditorStatement) => {
    db.updateAuditorStatement(statement);
    refreshDatabase();
  };

  // Handlers for Local Database Backup, Restore, and Clean Slate
  const handleExportDatabase = () => {
    const json = db.exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ENTERSOFT_Accounting_DB_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportDatabase = (jsonString: string) => {
    const ok = db.importDatabaseJSON(jsonString);
    if (ok) refreshDatabase();
    return ok;
  };

  const handleResetToDefaults = () => {
    db.resetToSeedData();
    refreshDatabase();
  };

  const handleClearAllData = () => {
    db.clearAllCompanyData();
    refreshDatabase();
  };

  // Opening Balances bulk save handler
  const handleSaveOpeningBalances = (
    balances: { accountCode: string; debit: number; credit: number; note?: string }[],
    createEntry: boolean
  ) => {
    db.saveBulkOpeningBalances(balances, createEntry);
    refreshDatabase();
  };

  // Year-end closing execution handler
  const handleExecuteYearEndClosing = (closingDate: string) => {
    const res = db.createYearEndClosingEntry(closingDate);
    if (res.success) {
      refreshDatabase();
    }
    return res;
  };

  // Quick Navigation Helper
  const navigateToLedgerWithAccount = (accountCode: string) => {
    setTargetLedgerAccountCode(accountCode);
    setActiveTab('general-ledger');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-700 selection:text-white relative">
      {/* Top Professional Auditor Ribbon Header */}
      <Header
        companyProfile={companyProfile}
        auditorStatement={auditorStatement}
        onOpenSmartEntry={() => setIsSmartEntryModalOpen(true)}
        onOpenOpeningBalances={() => setIsOpeningBalancesModalOpen(true)}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar (Desktop view, hidden on mobile / small devices) */}
        <div className="hidden lg:block shrink-0">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Mobile Drawer (When user taps "الأقسام" on small screens) */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            <div className="relative w-72 max-w-[85%] bg-slate-950 h-full shadow-2xl flex flex-col z-10 border-l border-slate-800">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                <span className="text-sm font-bold text-white font-somar">أقسام المحاسبة والنظام</span>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={(tab) => {
                    setActiveTab(tab);
                    setIsMobileDrawerOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Viewport Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-slate-950 text-slate-100 font-somar pb-24 lg:pb-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* 1. Dashboard View */}
              {activeTab === 'dashboard' && financialData && (
                <Dashboard
                  financialData={financialData}
                  companyProfile={companyProfile}
                  auditorStatement={auditorStatement}
                  accountsCount={accounts.length}
                  journalEntriesCount={journalEntries.length}
                  invoicesCount={invoices.length}
                  partiesCount={parties.length}
                  invoices={invoices}
                  parties={parties}
                  journalEntries={journalEntries}
                  onOpenSmartEntry={() => setIsSmartEntryModalOpen(true)}
                  onNavigate={setActiveTab}
                />
              )}

              {/* KPI Dashboard View (Recharts) */}
              {activeTab === 'kpi-dashboard' && financialData && (
                <KPIDashboardView
                  financialData={financialData}
                  companyProfile={companyProfile}
                  auditorStatement={auditorStatement}
                  onNavigate={setActiveTab}
                />
              )}

            {/* Office Clients Archive */}
            {activeTab === 'clients-archive' && (
              <ClientsArchiveView
                companyProfile={companyProfile}
                auditorStatement={auditorStatement}
                accounts={accounts}
              />
            )}

            {/* Office Treasury & Financial Transactions */}
            {activeTab === 'treasury-financial' && (
              <TreasuryFinancialView
                companyProfile={companyProfile}
                auditorStatement={auditorStatement}
                accounts={accounts}
                onAddJournalEntry={handleAddJournalEntry}
              />
            )}

            {/* Accounting Certificates Management */}
            {activeTab === 'certificates-management' && (
              <CertificatesManagementView
                companyProfile={companyProfile}
                auditorStatement={auditorStatement}
              />
            )}

            {/* ETA e-Invoicing & e-Receipt SDK Integration Hub */}
            {activeTab === 'einvoice-eta' && (
              <EInvoiceETAView
                companyProfile={companyProfile}
                invoices={invoices}
                parties={parties}
                onAddInvoice={handleAddInvoice}
                onUpdateInvoice={handleUpdateInvoice}
              />
            )}

            {/* 2. Chart of Accounts View */}
            {activeTab === 'chart-of-accounts' && (
              <ChartOfAccountsView
                accounts={accounts}
                onAddAccount={handleAddAccount}
                onUpdateAccount={handleUpdateAccount}
                onDeleteAccount={handleDeleteAccount}
                onNavigateToLedger={navigateToLedgerWithAccount}
              />
            )}

            {/* 3. Journal Entries View */}
            {activeTab === 'journal-entries' && (
              <JournalEntriesView
                entries={journalEntries}
                accounts={accounts}
                companyProfile={companyProfile}
                auditorStatement={auditorStatement}
                onAddEntry={handleAddJournalEntry}
                onUpdateEntry={handleUpdateJournalEntry}
                onDeleteEntry={handleDeleteJournalEntry}
                onPostEntry={handlePostJournalEntry}
                onUnpostEntry={handleUnpostJournalEntry}
                onPostAll={handlePostAllEntries}
                onOpenSmartEntry={() => setIsSmartEntryModalOpen(true)}
              />
            )}

            {/* Fixed Assets Management & Periodic Depreciation */}
            {activeTab === 'fixed-assets' && (
              <FixedAssetsView
                accounts={accounts}
                onNavigateToJournal={() => setActiveTab('journal-entries')}
              />
            )}

            {/* 4. General Ledger View */}
            {activeTab === 'general-ledger' && (
              <GeneralLedgerView
                accounts={accounts}
                journalEntries={journalEntries}
                companyProfile={companyProfile}
                initialAccountCode={targetLedgerAccountCode}
              />
            )}

            {/* 5. Trial Balance View */}
            {activeTab === 'trial-balance' && trialBalanceData && (
              <TrialBalanceView
                trialBalanceData={trialBalanceData}
                companyProfile={companyProfile}
              />
            )}

            {/* Autonomous Scenario-Based Financial Statements Studio */}
            {activeTab === 'financial-scenario-builder' && (
              <FinancialScenarioStudioView
                companyProfile={companyProfile}
                auditorStatement={auditorStatement}
              />
            )}

            {/* Advanced Financial Analysis & Multi-Year Ratios */}
            {activeTab === 'financial-analysis' && (
              <FinancialAnalysisView />
            )}

            {/* 6. Financial Statements View */}
            {activeTab === 'financial-statements' && financialData && (
              <FinancialStatementsView
                financialData={financialData}
                companyProfile={companyProfile}
                auditorStatement={auditorStatement}
              />
            )}

            {/* 7. Auditor's Report View */}
            {activeTab === 'auditor-report' && financialData && (
              <AuditorReportView
                auditorStatement={auditorStatement}
                companyProfile={companyProfile}
                financialData={financialData}
                onUpdateAuditorStatement={handleUpdateAuditorStatement}
              />
            )}

            {/* 8. Invoices & Billing View */}
            {activeTab === 'invoices' && (
              <InvoicesView
                invoices={invoices}
                parties={parties}
                companyProfile={companyProfile}
                onAddInvoice={handleAddInvoice}
                onUpdateInvoice={handleUpdateInvoice}
                onDeleteInvoice={handleDeleteInvoice}
              />
            )}

            {/* 9. Tax Assistant View (نموذج 10 ض.ق.م ونموذج 41 وحاسبة كسب العمل) */}
            {activeTab === 'tax-assistant' && (
              <TaxAssistantView
                companyProfile={companyProfile}
                auditorStatement={auditorStatement}
                invoices={invoices}
                accounts={accounts}
                onAddJournalEntry={handleAddJournalEntry}
              />
            )}

            {/* 10. Bank & Cash Reconciliation View (مذكرة تسوية البنك والخزينة) */}
            {activeTab === 'bank-reconciliation' && (
              <BankReconciliationView
                accounts={accounts}
                companyProfile={companyProfile}
                auditorStatement={auditorStatement}
              />
            )}

            {/* 11. Customers & Suppliers (Parties) View */}
            {activeTab === 'parties' && (
              <PartiesView
                parties={parties}
                accounts={accounts}
                onAddParty={handleAddParty}
                onUpdateParty={handleUpdateParty}
                onDeleteParty={handleDeleteParty}
                onNavigateToInvoices={() => setActiveTab('invoices')}
                onNavigateToLedger={navigateToLedgerWithAccount}
              />
            )}

            {/* 12. Audit Logs & System Activity Trail */}
            {activeTab === 'audit-logs' && (
              <AuditLogView onRefresh={refreshDatabase} />
            )}

            {/* 13. Settings & Database Backup/Restore */}
            {activeTab === 'settings' && (
              <SettingsView
                companyProfile={companyProfile}
                auditorStatement={auditorStatement}
                onUpdateCompanyProfile={handleUpdateCompanyProfile}
                onUpdateAuditorStatement={handleUpdateAuditorStatement}
                onExportDatabase={handleExportDatabase}
                onImportDatabase={handleImportDatabase}
                onResetToDefaults={handleResetToDefaults}
                onClearAllData={handleClearAllData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Persistent on Phone & Mobile Frame) */}
      <MobileBottomNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenInstallModal={() => {}}
      />

      {/* Smart Automated Journal Entry Modal */}
      <SmartEntryModal
        isOpen={isSmartEntryModalOpen}
        onClose={() => setIsSmartEntryModalOpen(false)}
        accounts={accounts}
        onAddEntry={handleAddJournalEntry}
      />

      {/* Opening Balances Bulk Entry Modal */}
      <OpeningBalancesModal
        isOpen={isOpeningBalancesModalOpen}
        onClose={() => setIsOpeningBalancesModalOpen(false)}
        accounts={accounts}
        onSaveBalances={handleSaveOpeningBalances}
      />

      {/* Year-End Closing Modal */}
      <YearEndClosingModal
        isOpen={isYearEndClosingModalOpen}
        onClose={() => setIsYearEndClosingModalOpen(false)}
        accounts={accounts}
        companyProfile={companyProfile}
        auditorStatement={auditorStatement}
        onExecuteClosing={handleExecuteYearEndClosing}
      />

      {/* Certificate Verification Center Modal (accessible globally via QR or link) */}
      <CertificateVerificationCenterModal
        isOpen={isVerificationCenterOpen}
        onClose={() => setIsVerificationCenterOpen(false)}
        initialSerial={verificationInitialSerial}
        companyProfile={companyProfile}
        auditorStatement={auditorStatement}
      />
    </div>
  );
}
