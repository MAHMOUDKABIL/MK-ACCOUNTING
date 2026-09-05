import QRCode from 'qrcode';

export interface GenerateQrCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generates a high-resolution base64 PNG data URL of a QR code
 */
export async function generateQrCodeDataUrl(
  text: string,
  options: GenerateQrCodeOptions = {}
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    width: options.width || 320,
    margin: options.margin !== undefined ? options.margin : 2,
    color: options.color || {
      dark: '#09090b',
      light: '#ffffff',
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
  };

  try {
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (err) {
    console.error('Failed to generate QR Code data URL:', err);
    // Return empty fallback SVG string or simple placeholder
    return '';
  }
}

/**
 * Builds the canonical public verification URL for a given certificate serial number
 */
export function getCertificateVerificationUrl(serialNumber: string): string {
  if (typeof window === 'undefined') {
    return `https://elbaz-accounting.gov.eg/verify?serial=${encodeURIComponent(serialNumber)}`;
  }
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?verifyCert=${encodeURIComponent(serialNumber)}`;
}

/**
 * Builds the canonical public verification URL for an official accounting report
 */
export function getReportVerificationUrl(reportCode: string, reportTitle: string): string {
  if (typeof window === 'undefined') {
    return `https://elbaz-accounting.gov.eg/verify-report?code=${encodeURIComponent(reportCode)}`;
  }
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?verifyReport=${encodeURIComponent(reportCode)}&title=${encodeURIComponent(reportTitle)}`;
}
