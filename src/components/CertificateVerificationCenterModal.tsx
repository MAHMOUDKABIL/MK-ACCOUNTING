import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  Filter,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
  Scan,
  Calendar,
  User,
  Building2,
} from 'lucide-react';
import { AccountingCertificate } from '../types/office';
import { AuditorStatement, CompanyProfile } from '../types/accounting';
import { db } from '../services/db';
import { DigitalVerifiedCertificateView } from './DigitalVerifiedCertificateView';
import { getCertificateVerificationUrl } from '../utils/qrCode';

interface CertificateVerificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSerial?: string;
  companyProfile?: CompanyProfile;
  auditorStatement?: AuditorStatement;
}

export const CertificateVerificationCenterModal: React.FC<CertificateVerificationCenterModalProps> = ({
  isOpen,
  onClose,
  initialSerial = '',
  companyProfile,
  auditorStatement,
}) => {
  const [certificates, setCertificates] = useState<AccountingCertificate[]>(() => db.getCertificates());
  const [searchSerial, setSearchSerial] = useState(initialSerial);
  const [searchedCertificate, setSearchedCertificate] = useState<AccountingCertificate | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isViewingDigitalCert, setIsViewingDigitalCert] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      const allCerts = db.getCertificates();
      setCertificates(allCerts);
      if (initialSerial) {
        setSearchSerial(initialSerial);
        const match = allCerts.find(
          (c) => c.serialNumber.trim().toUpperCase() === initialSerial.trim().toUpperCase()
        );
        if (match) {
          setSearchedCertificate(match);
          setHasSearched(true);
        }
      }
    }
  }, [isOpen, initialSerial]);

  if (!isOpen) return null;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchSerial.trim().toUpperCase();
    if (!query) return;

    setHasSearched(true);
    const found = certificates.find(
      (c) =>
        c.serialNumber.trim().toUpperCase() === query ||
        (c.nationalId && c.nationalId.trim() === query) ||
        (c.id && c.id.toLowerCase() === query.toLowerCase())
    );

    setSearchedCertificate(found || null);
  };

  const handleQuickVerify = (cert: AccountingCertificate) => {
    setSearchSerial(cert.serialNumber);
    setSearchedCertificate(cert);
    setHasSearched(true);
  };

  const filteredCerts = certificates.filter(
    (c) =>
      c.serialNumber.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.clientName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (c.nationalId && c.nationalId.includes(filterQuery)) ||
      c.issuedToParty.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 text-zinc-100 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>مركز التحقق والاستعلام عن صحة الشهادات المعتمدة</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                  فحص وتأكيد رسمي
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                منظومة التحقق الإلكتروني للجهات الرسمية والبنوك والمؤسسات للتأكد من موثوقية الشهادات المصدرة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[82vh]">
          {/* Verification Search Bar */}
          <form onSubmit={handleSearch} className="bg-zinc-900/90 border border-zinc-800 p-4 sm:p-5 rounded-2xl space-y-3">
            <label className="block text-sm font-bold text-zinc-200">
              أدخل كود التحقق الإلكتروني أو الرقم القومي لصاحب الشهادة:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchSerial}
                  onChange={(e) => setSearchSerial(e.target.value)}
                  placeholder="مثال: CERT-2026-0001 أو الرقم القومي (14 رقم)"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pr-11 pl-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>تحقق من الشهادة الآن</span>
              </button>
            </div>
            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
              <span>💡 يمكنك أيضاً مسح رمز الاستجابة السريعة (QR Code) الموجود على الشهادة الورقية مباشرة بهاتفك.</span>
            </div>
          </form>

          {/* Verification Result Card */}
          {hasSearched && (
            <div>
              {searchedCertificate ? (
                <div className="bg-emerald-950/40 border-2 border-emerald-600/60 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-800/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-emerald-400 font-extrabold text-sm sm:text-base flex items-center gap-2">
                          <span>✓ شهادة معتمدة ومسجلة رسمياً بسجل الشهادات المهنية للمكتب</span>
                        </div>
                        <div className="text-xs text-zinc-300 font-mono">
                          الكود المسلسل: <strong className="text-white">{searchedCertificate.serialNumber}</strong> | تاريخ الإصدار: {searchedCertificate.issueDate}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsViewingDigitalCert(true)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>عرض النسخة الرقمية المعتمدة (للعرض فقط)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                      <span className="text-zinc-400 block mb-1">اسم العميل / صاحب الشأن:</span>
                      <strong className="text-white text-sm">{searchedCertificate.clientName}</strong>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                      <span className="text-zinc-400 block mb-1">نوع الشهادة الصادرة:</span>
                      <strong className="text-white text-sm">{searchedCertificate.certificateTitle || searchedCertificate.certificateType}</strong>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                      <span className="text-zinc-400 block mb-1">الجهة الموجه إليها:</span>
                      <strong className="text-white text-sm">{searchedCertificate.issuedToParty}</strong>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                      <span className="text-zinc-400 block mb-1">الرقم القومي:</span>
                      <span className="text-white font-mono font-bold">{searchedCertificate.nationalId || '-'}</span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                      <span className="text-zinc-400 block mb-1">المهنة / النشاط:</span>
                      <span className="text-white font-bold">{searchedCertificate.profession || '-'}</span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                      <span className="text-zinc-400 block mb-1">اعتماد المحاسب القانوني:</span>
                      <span className="text-emerald-400 font-bold">معتمدة ومختومة رسمياً</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-950/40 border-2 border-rose-600/60 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-rose-300 font-bold text-base">
                      تحذير: لم يتم العثور على شهادة مسجلة بهذا الرقم ({searchSerial})
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      هذا الرقم غير مقيد بسجلات الشهادات المعتمدة الصادرة من المكتب. يرجى التأكد من كتابة الكود المسلسل بدقة (مثال: CERT-2026-0001) أو مراجعة إدارة المكتب للتحقق من صحة المستند لمنع التزوير.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Registry Table for Fast Inspection */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>سجل الشهادات المعتمدة الصادرة بالمكتب ({certificates.length} شهادة)</span>
              </h3>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="بحث سريع في السجل..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60">
              <table className="w-full text-right text-xs">
                <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 font-bold">
                  <tr>
                    <th className="p-3">الكود المسلسل</th>
                    <th className="p-3">صاحب الشأن</th>
                    <th className="p-3">نوع الشهادة</th>
                    <th className="p-3">تاريخ الإصدار</th>
                    <th className="p-3">الجهة الموجه إليها</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {filteredCerts.map((cert) => (
                    <tr key={cert.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-white">{cert.serialNumber}</td>
                      <td className="p-3 font-bold text-zinc-100">{cert.clientName}</td>
                      <td className="p-3 text-zinc-300">{cert.certificateTitle || cert.certificateType}</td>
                      <td className="p-3 font-mono text-zinc-400">{cert.issueDate}</td>
                      <td className="p-3 text-zinc-400">{cert.issuedToParty}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleQuickVerify(cert)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>تحقق الآن</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Read-Only Digital Certificate Viewer */}
      {isViewingDigitalCert && searchedCertificate && (
        <DigitalVerifiedCertificateView
          certificate={searchedCertificate}
          companyProfile={companyProfile}
          auditorStatement={auditorStatement}
          onClose={() => setIsViewingDigitalCert(false)}
        />
      )}
    </div>
  );
};
