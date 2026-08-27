import * as XLSX from 'xlsx';

/**
 * Utility to export tabular data directly to Excel (.xlsx)
 */
export function exportToExcel(
  data: Record<string, any>[],
  fileName: string = 'export.xlsx',
  sheetName: string = 'البيانات'
) {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set Right-to-Left on worksheet
    if (!worksheet['!views']) {
      worksheet['!views'] = [{ rightToLeft: true }];
    }

    // Auto-calculate column widths
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      worksheet['!cols'] = keys.map((k) => {
        let maxLen = k.length;
        data.forEach((row) => {
          const val = String(row[k] || '');
          if (val.length > maxLen) {
            maxLen = Math.min(val.length, 45);
          }
        });
        return { wch: Math.max(maxLen + 4, 12) };
      });
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Ensure filename ends with .xlsx
    const cleanFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    XLSX.writeFile(workbook, cleanFileName);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
}

/**
 * Utility to export HTML content to Word (.docx / Word Document)
 * with complete Arabic Right-to-Left (RTL) formatting and styling.
 */
export function exportToWordDoc(
  title: string,
  htmlContent: string,
  fileName: string = 'document.doc'
) {
  try {
    const header = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 595.3pt 841.9pt; /* A4 size */
      margin: 1.0in 1.0in 1.0in 1.0in;
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Traditional Arabic', 'Arial', 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
      text-align: right;
      font-size: 13pt;
      line-height: 1.6;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      direction: rtl;
    }
    th, td {
      border: 1px solid #94a3b8;
      padding: 8px 12px;
      text-align: right;
      font-size: 12pt;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
      color: #0369a1;
    }
    .header-box {
      border-bottom: 2px solid #0369a1;
      padding-bottom: 12px;
      margin-bottom: 20px;
      text-align: center;
    }
    .title {
      font-size: 18pt;
      font-weight: bold;
      color: #0369a1;
      text-align: center;
      margin: 15px 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border: 1px solid #0369a1;
      border-radius: 4px;
      font-weight: bold;
      font-size: 11pt;
    }
    .footer-stamp {
      margin-top: 30px;
      border-top: 1px solid #cbd5e1;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
    }
    .stamp-box {
      border: 2px dashed #0369a1;
      padding: 10px 20px;
      text-align: center;
      display: inline-block;
      color: #0369a1;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="Section1">
    ${htmlContent}
  </div>
</body>
</html>`;

    const blob = new Blob(['\ufeff', header], {
      type: 'application/msword;charset=utf-8',
    });

    const cleanFileName = fileName.endsWith('.doc') || fileName.endsWith('.docx')
      ? fileName
      : `${fileName}.doc`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    return true;
  } catch (error) {
    console.error('Error exporting to Word:', error);
    return false;
  }
}

/**
 * Triggers standard browser high-resolution PDF print dialog
 */
export function printDocument() {
  window.print();
}
