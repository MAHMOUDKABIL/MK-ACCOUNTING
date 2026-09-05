import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { AuditorStatement, CompanyProfile } from '../types/accounting';

export interface PDFExportOptions {
  filename?: string;
  title?: string;
  reportTitle?: string;
  reportSubtitle?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  includeOfficialHeader?: boolean;
  includeLetterhead?: boolean;
  includeDigitalSignature?: boolean;
  includeStamp?: boolean;
  companyProfile?: CompanyProfile;
  auditorStatement?: AuditorStatement;
  customNotes?: string;
}

/**
 * دالة تصدير وطباعة موحدة لجميع التقارير والقوائم تضمن تضمين
 * الترويسة الرسمية المعتمدة (Header) والتوقيع الرقمي وخاتم مراقب الحسابات (Footer)
 */
export async function exportElementToPDF(
  target: HTMLElement | string,
  filenameOrOptions?: string | PDFExportOptions,
  maybeOptions?: PDFExportOptions
): Promise<boolean> {
  let element: HTMLElement | null = null;
  if (typeof target === 'string') {
    element = document.getElementById(target);
  } else {
    element = target;
  }

  if (!element) {
    console.error(`Target element not found for PDF export.`);
    return false;
  }

  let options: PDFExportOptions = {};
  let filename = `تقرير_مالي_معتمد_${new Date().toISOString().split('T')[0]}.pdf`;

  if (typeof filenameOrOptions === 'string') {
    filename = filenameOrOptions;
    if (maybeOptions) {
      options = maybeOptions;
    }
  } else if (filenameOrOptions && typeof filenameOrOptions === 'object') {
    options = filenameOrOptions;
    if (options.filename) {
      filename = options.filename;
    }
  }

  const {
    orientation = 'portrait',
    format = 'a4',
    includeLetterhead = true,
    includeDigitalSignature = true,
    companyProfile,
    auditorStatement,
    reportTitle = 'تقرير مالي معتمد',
    reportSubtitle,
    customNotes,
  } = options;

  // Create temporary container for pristine official export layout if needed
  let printWrapper: HTMLElement | null = null;
  let elementToCapture = element;

  const hasExistingHeader = Boolean(
    element.querySelector('.official-print-header') ||
    element.querySelector('.print-first-page-letterhead') ||
    element.classList.contains('print-a4-container')
  );

  const shouldAddHeader = includeLetterhead && !hasExistingHeader;
  const shouldAddFooter = (includeDigitalSignature || options.includeStamp) && !hasExistingHeader;
  const requiresDecorations = shouldAddHeader || shouldAddFooter;

  if (requiresDecorations) {
    printWrapper = document.createElement('div');
    printWrapper.style.position = 'absolute';
    printWrapper.style.top = '-99999px';
    printWrapper.style.left = '0';
    printWrapper.style.width = orientation === 'landscape' ? '1120px' : '820px';
    printWrapper.style.backgroundColor = '#ffffff';
    printWrapper.style.color = '#0f172a';
    printWrapper.style.padding = '32px';
    printWrapper.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, sans-serif";
    printWrapper.style.direction = 'rtl';

    // Inject Official Header
    const headerHTML = shouldAddHeader
      ? getOfficialLetterheadHTML(
          companyProfile,
          auditorStatement,
          reportTitle,
          reportSubtitle
        )
      : '';

    // Inject Footer with digital signature & stamp
    const footerHTML = shouldAddFooter
      ? getOfficialFooterHTML(
          auditorStatement,
          companyProfile,
          customNotes
        )
      : '';

    // Clone target node
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#0f172a';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';

    // Adjust any dark background classes inside clone
    clone.querySelectorAll('*').forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.classList.contains('no-print')) {
        htmlEl.style.display = 'none';
      }
      
      const classesToRemove: string[] = [];
      htmlEl.classList.forEach((cls) => {
        if ((cls.startsWith('bg-slate-') || cls.startsWith('bg-zinc-') || cls.startsWith('bg-gray-') || cls.startsWith('bg-neutral-')) && (cls.includes('900') || cls.includes('950') || cls.includes('800'))) {
          classesToRemove.push(cls);
        }
        if (cls === 'text-white' || cls === 'text-slate-200' || cls === 'text-slate-300' || cls === 'text-zinc-200' || cls === 'text-zinc-300' || cls === 'text-slate-400' || cls === 'text-zinc-400') {
          classesToRemove.push(cls);
        }
      });
      
      classesToRemove.forEach((cls) => htmlEl.classList.remove(cls));
      
      if (classesToRemove.length > 0) {
        htmlEl.style.color = '#0f172a';
      }
    });

    printWrapper.innerHTML = `
      ${headerHTML}
      <div class="print-body-content" style="margin: 20px 0;">
        ${clone.outerHTML}
      </div>
      ${footerHTML}
    `;

    document.body.appendChild(printWrapper);
    elementToCapture = printWrapper;
  }

  try {
    const canvas = await html2canvas(elementToCapture, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: elementToCapture.scrollWidth || 1000,
      windowHeight: elementToCapture.scrollHeight || 1200,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('.no-print').forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      },
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 16; // 8mm margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 8;

    // First page
    pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight - 16;

    // Subsequent pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 8;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight - 16;
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating official PDF with jsPDF:', err);
    window.print();
    return false;
  } finally {
    if (printWrapper && printWrapper.parentNode) {
      printWrapper.parentNode.removeChild(printWrapper);
    }
  }
}

/**
 * توليد كود HTML للترويسة الرسمية المعتمدة للمكتب
 */
export function getOfficialLetterheadHTML(
  companyProfile?: CompanyProfile,
  auditorStatement?: AuditorStatement,
  reportTitle: string = 'تقرير مالي معتمد',
  reportSubtitle?: string
): string {
  const firmName =
    auditorStatement?.firmName ||
    'مكتب المحاسب القانوني محمود الباز قابيل للمحاسبة والمراجعة والضرائب';
  const auditorName =
    auditorStatement?.auditorName || companyProfile?.auditorName || 'محمود الباز قابيل';
  const regNumber =
    auditorStatement?.registerNumber ||
    'س.م.م 44887 - سجل المحاسبين والمراجعين بوزارة المالية';

  return `
    <div class="official-print-header" style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; direction: rtl; font-family: 'Cairo', sans-serif;">
      <div style="text-align: right; max-width: 45%;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 38px; height: 38px; background: #0f172a; color: #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">
            ★
          </div>
          <div>
            <h2 style="font-size: 14px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.2;">${firmName}</h2>
            <p style="font-size: 11px; font-weight: bold; color: #047857; margin: 2px 0 0 0;">محاسب ومراجع قانوني • خبير ضرائب معتمد</p>
          </div>
        </div>
        <p style="font-size: 10px; color: #475569; margin: 4px 0 0 0;">قيد: ${regNumber} • القاهرة - جمهورية مصر العربية</p>
      </div>

      <div style="text-align: center; flex: 1; padding: 0 10px;">
        <div style="display: inline-block; background: #0f172a; color: #ffffff; padding: 4px 14px; border-radius: 6px; font-size: 14px; font-weight: 900;">
          ${reportTitle}
        </div>
        ${reportSubtitle ? `<p style="font-size: 11px; color: #475569; font-weight: bold; margin: 4px 0 0 0;">${reportSubtitle}</p>` : ''}
        <p style="font-size: 10px; color: #64748b; margin: 3px 0 0 0;">السنة المالية: 2026 | تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      <div style="text-align: left; max-width: 35%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px;">
        <div style="font-size: 9px; color: #64748b; font-weight: bold;">المنشأة محل الفحص والاعتماد:</div>
        <h3 style="font-size: 12px; font-weight: 900; color: #0f172a; margin: 2px 0 0 0;">${companyProfile?.name || 'الشركة المصرية للتجارة والصناعة'}</h3>
        <p style="font-size: 10px; color: #475569; margin: 2px 0 0 0;">بطاقة ضريبية: ${companyProfile?.taxCard || '-'}</p>
        <p style="font-size: 10px; color: #475569; margin: 1px 0 0 0;">سجل تجاري: ${companyProfile?.commercialRegistry || '-'}</p>
      </div>
    </div>
  `;
}

/**
 * توليد كود HTML للتذييل الرسمي مع التوقيع الرقمي وخاتم المحاسب القانوني
 */
export function getOfficialFooterHTML(
  auditorStatement?: AuditorStatement,
  companyProfile?: CompanyProfile,
  customNotes?: string
): string {
  const auditorName = auditorStatement?.auditorName || 'محمود الباز قابيل';
  const regNumber = auditorStatement?.registerNumber || 'س.م.م 44887';
  const notes =
    customNotes ||
    'تمت المراجعة والفحص والاعتماد المحاسبي وفقاً لمعايير المحاسبة المصرية (EAS) وقانون الشركات رقم 159 لسنة 1981.';

  const signatureImg = auditorStatement?.auditorSignature
    ? `<img src="${auditorStatement.auditorSignature}" style="max-height: 48px; max-width: 140px; object-fit: contain; margin: 0 auto;" />`
    : `<div style="font-family: serif; font-style: italic; font-size: 13px; color: #475569; padding: 4px 0; border-bottom: 1px dashed #94a3b8;">${auditorName} - معتمد</div>`;

  const stampImg = auditorStatement?.auditorStamp
    ? `<img src="${auditorStatement.auditorStamp}" style="height: 52px; width: 52px; object-fit: contain; border-radius: 50%; border: 1px solid #10b981; margin: 0 auto;" />`
    : '';

  return `
    <div class="official-print-footer" style="border-top: 2px solid #0f172a; padding-top: 14px; margin-top: 24px; direction: rtl; font-family: 'Cairo', sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 16px;">
        <div style="flex: 2; font-size: 10px; color: #334155; line-height: 1.5;">
          <div style="font-weight: bold; color: #0f172a; font-size: 11px; margin-bottom: 4px;">
            ✓ شهادة مطابقة واعتماد مراقب الحسابات المستقل:
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; font-size: 10px; color: #334155;">
            ${notes}
          </div>
          <div style="font-size: 9px; color: #64748b; margin-top: 4px;">
            نظام ENTERSOFT المحاسبي السحابي المعتمد • مستند صادر برقم توثيق رسمي
          </div>
        </div>

        <div style="flex: 1; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 10px; padding: 10px; text-align: center;">
          <div style="font-size: 10px; font-weight: 900; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px;">
            اعتماد وخاتم مراقب الحسابات
          </div>
          <div style="min-height: 48px; display: flex; align-items: center; justify-content: center;">
            ${signatureImg}
          </div>
          <div style="font-size: 11px; font-weight: 900; color: #0f172a; margin-top: 2px;">${auditorName}</div>
          <div style="font-size: 9px; font-weight: bold; color: #047857; font-family: monospace;">${regNumber}</div>
          ${stampImg ? `<div style="margin-top: 4px;">${stampImg}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}
