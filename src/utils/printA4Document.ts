/**
 * Real-time, isolated A4 document printing utility.
 * Creates an invisible, isolated iframe with a pure white canvas,
 * ensuring that the web application, dark theme, sidebar, headers, and UI
 * can NEVER bleed into the printed document.
 */

export function printA4Document(
  sourceElement: HTMLElement | null,
  documentTitle: string = 'وثيقة محاسبية رسمية'
): boolean {
  if (!sourceElement) {
    console.error('printA4Document: Source element not found.');
    window.print();
    return false;
  }

  try {
    // Remove any previously orphaned print iframes
    const existingIframes = document.querySelectorAll('iframe[data-a4-print-frame]');
    existingIframes.forEach((f) => f.parentNode?.removeChild(f));

    // Create a dedicated, isolated hidden iframe
    const iframe = document.createElement('iframe');
    iframe.setAttribute('data-a4-print-frame', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      console.warn('Unable to access print iframe document, falling back to window.print');
      window.print();
      return false;
    }

    // Collect all stylesheets and style tags from current document
    let stylesMarkup = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      stylesMarkup += node.outerHTML + '\n';
    });

    // Deep clone the source element
    const clonedElement = sourceElement.cloneNode(true) as HTMLElement;

    // Clean up any interactive controls or elements marked as no-print
    clonedElement.querySelectorAll('.no-print, button, input, select, textarea').forEach((el) => {
      el.parentNode?.removeChild(el);
    });

    // Normalize styles on the root clone for clean A4 printing
    clonedElement.style.width = '100%';
    clonedElement.style.maxWidth = '100%';
    clonedElement.style.minHeight = 'auto';
    clonedElement.style.height = 'auto';
    clonedElement.style.margin = '0 auto';
    clonedElement.style.padding = '0';
    clonedElement.style.border = 'none';
    clonedElement.style.boxShadow = 'none';
    clonedElement.style.background = '#ffffff';
    clonedElement.style.color = '#09090b';
    clonedElement.style.transform = 'none';

    // Remove any nested transforms
    clonedElement.querySelectorAll('*').forEach((child) => {
      const childEl = child as HTMLElement;
      if (childEl.style && childEl.style.transform) {
        childEl.style.transform = 'none';
      }
    });

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${documentTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
        ${stylesMarkup}
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #09090b !important;
            font-family: 'IBM Plex Sans Arabic', 'Cairo', 'Segoe UI', Tahoma, sans-serif !important;
            direction: rtl !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            font-size: 13px !important;
            line-height: 1.5 !important;
          }
          .no-print, nav, aside, header, footer, button, .no-print-area {
            display: none !important;
          }
          .print-a4-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #09090b !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 4px !important;
            margin-bottom: 4px !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          .avoid-break, .print-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          /* Strip dark colors and make borders crisp */
          [class*="bg-slate-"],
          [class*="bg-zinc-"],
          [class*="bg-black"],
          [class*="bg-neutral-"] {
            background-color: transparent !important;
            background: transparent !important;
            color: #09090b !important;
          }
          .bg-zinc-100, .bg-slate-100 {
            background-color: #f1f5f9 !important;
          }
          [class*="text-slate-"],
          [class*="text-zinc-"] {
            color: #09090b !important;
          }
          .text-emerald-900, .text-emerald-800, .text-emerald-700 {
            color: #065f46 !important;
          }
          .border, [class*="border-"] {
            border-color: #cbd5e1 !important;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; max-width: 100%; margin: 0 auto; background: #ffffff;">
          ${clonedElement.outerHTML}
        </div>
      </body>
      </html>
    `);
    doc.close();

    // Give iframe sufficient time to load web fonts and QR images
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Error during iframe printing:', err);
        window.print();
      } finally {
        // Remove the iframe after the print dialog finishes
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    }, 350);

    return true;
  } catch (error) {
    console.error('printA4Document failed:', error);
    window.print();
    return false;
  }
}
