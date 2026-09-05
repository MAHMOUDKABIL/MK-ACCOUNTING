/**
 * أداة التفقيط وتحويل الأرقام إلى كلمات باللغة العربية
 * متوافقة مع الصياغة الرسمية المعتمدة في مكاتب المحاسبة والمراجعة المصرية
 */

const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const TENS = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function convertGroup(num: number): string {
  let result = '';
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundreds > 0) {
    result += HUNDREDS[hundreds];
  }

  if (remainder > 0) {
    if (result.length > 0) result += ' و';
    if (remainder < 20) {
      result += ONES[remainder];
    } else {
      const ones = remainder % 10;
      const tens = Math.floor(remainder / 10);
      if (ones > 0) {
        result += `${ONES[ones]} و${TENS[tens]}`;
      } else {
        result += TENS[tens];
      }
    }
  }

  return result;
}

/**
 * تحويل رقم مالي إلى كلمات باللغة العربية مع عملة الجنيه المصري والقروش
 * مثال: 150000 => "فقط مائة وخمسون ألف جنيهاً مصرياً لا غير"
 */
export function tafqeetCurrency(
  amount: number,
  currencyName: string = 'جنيهاً مصرياً',
  fractionName: string = 'قرشاً'
): string {
  if (isNaN(amount) || amount === 0) {
    return `فقط صفر ${currencyName} لا غير`;
  }

  const isNegative = amount < 0;
  amount = Math.abs(amount);

  const integerPart = Math.floor(amount);
  const fractionPart = Math.round((amount - integerPart) * 100);

  let words = '';

  if (integerPart === 0) {
    words = 'صفر';
  } else {
    const parts: string[] = [];

    // Billions
    const billions = Math.floor(integerPart / 1000000000);
    const afterBillions = integerPart % 1000000000;

    // Millions
    const millions = Math.floor(afterBillions / 1000000);
    const afterMillions = afterBillions % 1000000;

    // Thousands
    const thousands = Math.floor(afterMillions / 1000);
    const onesGroup = afterMillions % 1000;

    if (billions > 0) {
      if (billions === 1) parts.push('مليار');
      else if (billions === 2) parts.push('ملياران');
      else if (billions >= 3 && billions <= 10) parts.push(`${convertGroup(billions)} مليارات`);
      else parts.push(`${convertGroup(billions)} مليار`);
    }

    if (millions > 0) {
      if (millions === 1) parts.push('مليون');
      else if (millions === 2) parts.push('مليونان');
      else if (millions >= 3 && millions <= 10) parts.push(`${convertGroup(millions)} ملايين`);
      else parts.push(`${convertGroup(millions)} مليون`);
    }

    if (thousands > 0) {
      if (thousands === 1) parts.push('ألف');
      else if (thousands === 2) parts.push('ألفان');
      else if (thousands >= 3 && thousands <= 10) parts.push(`${convertGroup(thousands)} آلاف`);
      else parts.push(`${convertGroup(thousands)} ألف`);
    }

    if (onesGroup > 0) {
      parts.push(convertGroup(onesGroup));
    }

    words = parts.join(' و');
  }

  let fullText = `فقط ${isNegative ? 'سالب ' : ''}${words} ${currencyName}`;

  if (fractionPart > 0) {
    fullText += ` و${convertGroup(fractionPart)} ${fractionName}`;
  }

  fullText += ' لا غير';

  return fullText;
}

/**
 * تحويل رقم عام إلى نص عربي
 */
export function numberToArabicWords(num: number): string {
  if (isNaN(num) || num === 0) return 'صفر';
  return tafqeetCurrency(num, '', '').replace('فقط ', '').replace(' لا غير', '').trim();
}
