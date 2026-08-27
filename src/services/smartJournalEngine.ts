import { Account, JournalEntryLine } from '../types/accounting';

export interface SmartTemplate {
  id: string;
  title: string;
  category: 'sales' | 'purchases' | 'treasury' | 'payroll' | 'depreciation' | 'tax' | 'adjustments';
  description: string;
  defaultInputs: Record<string, any>;
  generateLines: (inputs: any, accounts: Account[]) => {
    description: string;
    referenceDoc?: string;
    lines: Array<{
      accountCode: string;
      debit: number;
      credit: number;
      note: string;
    }>;
  };
}

export const SMART_TEMPLATES: SmartTemplate[] = [
  {
    id: 'tpl_sales_credit_vat',
    title: 'فاتورة مبيعات آجلة (مع ضريبة 14% وخصم منبع 1%)',
    category: 'sales',
    description: 'قيد مبيعات تجارية آجلة لعميل متضمن ضريبة القيمة المضافة 14% واستقطاع 1% أ/ت وفق القانون الضريبي المصري',
    defaultInputs: {
      customerName: 'شركة النور للمقاولات',
      amount: 100000,
      vatRate: 14,
      withholdingRate: 1,
      invoiceNumber: 'INV-2026-0042',
    },
    generateLines: (inputs) => {
      const base = Number(inputs.amount || 0);
      const vat = base * ((Number(inputs.vatRate) || 14) / 100);
      const wht = base * ((Number(inputs.withholdingRate) || 1) / 100);
      const totalCustomer = base + vat - wht;

      return {
        description: `إثبات فاتورة مبيعات آجلة رقم ${inputs.invoiceNumber || ''} للعميل ${inputs.customerName || ''} بالضريبة 14%`,
        referenceDoc: inputs.invoiceNumber,
        lines: [
          {
            accountCode: '1221', // العملاء التجاريون
            debit: totalCustomer,
            credit: 0,
            note: `صافي المستحق على العميل (${inputs.customerName}) بعد خصم أ/ت 1%`,
          },
          ...(wht > 0
            ? [
                {
                  accountCode: '1235', // ضريبة الخصم والتحصيل 1% أ/ت تحت الحساب
                  debit: wht,
                  credit: 0,
                  note: `ضريبة خصم وتحصيل 1% مخصومة بمعرفة العميل (${inputs.customerName}) لصالح مصلحة الضرائب`,
                },
              ]
            : []),
          {
            accountCode: '311', // إيرادات مبيعات بضائع
            debit: 0,
            credit: base,
            note: `قيمة المبيعات الخاضعة للضريبة بموجب فاتورة ${inputs.invoiceNumber}`,
          },
          {
            accountCode: '2321', // ضريبة القيمة المضافة 14% مخرجات
            debit: 0,
            credit: vat,
            note: `ضريبة القيمة المضافة المستحقة 14% على فاتورة ${inputs.invoiceNumber}`,
          },
        ],
      };
    },
  },
  {
    id: 'tpl_purchase_credit_vat',
    title: 'فاتورة مشتريات خامات/بضائع آجلة (ضريبة مدخلات 14% واستقطاع 1%)',
    category: 'purchases',
    description: 'قيد إثبات مشتريات خامات ومهمات أو بضائع من مورد مع إثبات ضريبة القيمة المضافة القابلة للخصم واستقطاع 1% أ/ت',
    defaultInputs: {
      supplierName: 'الشركة الهندسية للصناعات',
      amount: 60000,
      vatRate: 14,
      withholdingRate: 1,
      invoiceNumber: 'PINV-8841',
    },
    generateLines: (inputs) => {
      const base = Number(inputs.amount || 0);
      const vat = base * ((Number(inputs.vatRate) || 14) / 100);
      const wht = base * ((Number(inputs.withholdingRate) || 1) / 100);
      const totalSupplier = base + vat - wht;

      return {
        description: `إثبات فاتورة مشتريات بضائع رقم ${inputs.invoiceNumber || ''} من المورد ${inputs.supplierName || ''}`,
        referenceDoc: inputs.invoiceNumber,
        lines: [
          {
            accountCode: '411', // مشتريات بضائع
            debit: base,
            credit: 0,
            note: `قيمة المشتريات قبل الضريبة من المورد (${inputs.supplierName})`,
          },
          {
            accountCode: '1234', // ضريبة مدخلات 14%
            debit: vat,
            credit: 0,
            note: `ضريبة قيمة مضافة مدخلات قابلة للخصم 14% بموجب فاتورة ضريبية إلكترونية`,
          },
          {
            accountCode: '2311', // الموردون التجاريون
            debit: 0,
            credit: totalSupplier,
            note: `صافي المستحق للمورد (${inputs.supplierName}) بعد استقطاع 1% أ/ت`,
          },
          ...(wht > 0
            ? [
                {
                  accountCode: '2323', // ضريبة الخصم والتحصيل من المنبع
                  debit: 0,
                  credit: wht,
                  note: `ضريبة خصم وتحصيل 1% مستقطعة من المورد لتوريدها بنموذج 41 ضرائب`,
                },
              ]
            : []),
        ],
      };
    },
  },
  {
    id: 'tpl_payroll_complete',
    title: 'مسير رواتب وأجور العاملين (تأمينات اجتماعية وكسب عمل)',
    category: 'payroll',
    description: 'قيد شامل لاحتساب المرتبات والأجور، حصة المنشأة في التأمينات 18.75%، واستقطاع حصة العامل 11% وضريبة كسب العمل',
    defaultInputs: {
      totalSalaries: 80000,
      employerInsuranceRate: 18.75, // حصة المنشأة
      employeeInsuranceRate: 11, // حصة العامل
      payrollTaxAmount: 4500, // كسب عمل
      paymentBank: 'acc-1242', // البنك الأهلي
    },
    generateLines: (inputs) => {
      const gross = Number(inputs.totalSalaries || 0);
      const empInsurance = gross * ((Number(inputs.employerInsuranceRate) || 18.75) / 100);
      const workerInsurance = gross * ((Number(inputs.employeeInsuranceRate) || 11) / 100);
      const payrollTax = Number(inputs.payrollTaxAmount || 0);
      const totalInsurancePayable = empInsurance + workerInsurance;
      const netPayable = gross - workerInsurance - payrollTax;

      return {
        description: `إثبات استحقاق وصرف مرتبات وأجور العاملين مع التأمينات الاجتماعية وضريبة المرتبات (كسب العمل)`,
        referenceDoc: `PAYROLL-${new Date().getMonth() + 1}-${new Date().getFullYear()}`,
        lines: [
          {
            accountCode: '431', // المرتبات والأجور
            debit: gross,
            credit: 0,
            note: 'إجمالي الأجور والمرتبات المستحقة للعاملين',
          },
          {
            accountCode: '432', // تأمينات اجتماعية حصة المنشأة
            debit: empInsurance,
            credit: 0,
            note: `تأمينات اجتماعية حصة المنشأة (18.75%)`,
          },
          {
            accountCode: '2324', // التأمينات الاجتماعية دائنون
            debit: 0,
            credit: totalInsurancePayable,
            note: `إجمالي مستحقات الهيئة القومية للتأمينات (حصة العامل ${workerInsurance.toFixed(0)} + المنشأة ${empInsurance.toFixed(0)})`,
          },
          {
            accountCode: '2322', // ضريبة كسب العمل
            debit: 0,
            credit: payrollTax,
            note: 'ضريبة كسب العمل المستقطعة من رواتب الموظفين للتوريد لمصلحة الضرائب',
          },
          {
            accountCode: '1242', // البنك الأهلي
            debit: 0,
            credit: netPayable,
            note: 'صافي الرواتب المحولة لحسابات الموظفين البنكية',
          },
        ],
      };
    },
  },
  {
    id: 'tpl_collection_customer',
    title: 'تحصيل مستحقات عميل (نقداً / بنك / شيك)',
    category: 'treasury',
    description: 'إثبات تحصيل مبالغ نقدية أو تحويلات بنكية أو شيكات من العملاء وإقفال جزء من رصيدهم المدين',
    defaultInputs: {
      customerName: 'مجموعة الأهرام للمقاولات',
      amount: 45000,
      paymentType: 'bank', // bank or cash or notes
      receiptNumber: 'REC-4901',
    },
    generateLines: (inputs) => {
      const amt = Number(inputs.amount || 0);
      const targetCode = inputs.paymentType === 'cash' ? '1241' : inputs.paymentType === 'notes' ? '1222' : '1242';
      const targetDesc =
        inputs.paymentType === 'cash'
          ? 'الخزينة الرئيسية'
          : inputs.paymentType === 'notes'
          ? 'أوراق القبض (شيكات تحت التحصيل)'
          : 'البنك الأهلي المصري';

      return {
        description: `تحصيل مبلغ ${amt.toLocaleString()} ج.م من العميل (${inputs.customerName || ''}) بموجب إيصال رقم ${inputs.receiptNumber || ''}`,
        referenceDoc: inputs.receiptNumber,
        lines: [
          {
            accountCode: targetCode,
            debit: amt,
            credit: 0,
            note: `إيداع محصل طرف (${targetDesc})`,
          },
          {
            accountCode: '1221', // العملاء التجاريون
            debit: 0,
            credit: amt,
            note: `سداد من حساب العميل (${inputs.customerName})`,
          },
        ],
      };
    },
  },
  {
    id: 'tpl_payment_supplier',
    title: 'سداد مستحقات مورد بشيك بنكي مع خصم تعجيل دفع',
    category: 'treasury',
    description: 'قيد سداد دفعة لمورد من الحساب الجاري بالبنك مع إثبات الخصم المكتسب إن وجد',
    defaultInputs: {
      supplierName: 'الشركة المصرية للمعادن',
      amount: 30000,
      cashDiscount: 1000,
      checkNumber: 'CHK-994012',
    },
    generateLines: (inputs) => {
      const netPaid = Number(inputs.amount || 0);
      const discount = Number(inputs.cashDiscount || 0);
      const totalSettled = netPaid + discount;

      return {
        description: `سداد مستحق للمورد (${inputs.supplierName || ''}) بشيك بنكي رقم ${inputs.checkNumber || ''}`,
        referenceDoc: inputs.checkNumber,
        lines: [
          {
            accountCode: '2311', // الموردون التجاريون
            debit: totalSettled,
            credit: 0,
            note: `تسوية جزء من حساب المورد (${inputs.supplierName})`,
          },
          {
            accountCode: '1242', // البنك الأهلي
            debit: 0,
            credit: netPaid,
            note: `صرف شيك رقم ${inputs.checkNumber} من حساب البنك الأهلي`,
          },
          ...(discount > 0
            ? [
                {
                  accountCode: '413', // خصم مكتسب
                  debit: 0,
                  credit: discount,
                  note: `خصم تعجيل دفع مكتسب من المورد (${inputs.supplierName})`,
                },
              ]
            : []),
        ],
      };
    },
  },
  {
    id: 'tpl_depreciation_standard',
    title: 'إثبات قسط الإهلاك الدوري للأصول الثابتة',
    category: 'depreciation',
    description: 'قيد إهلاك أصول المنشأة وفقاً لمعيار المحاسبة المصري رقم 10 (الأصول الثابتة وإهلاكها)',
    defaultInputs: {
      buildingsDepreciation: 5000,
      machineryDepreciation: 4500,
      vehiclesDepreciation: 4000,
      furnitureDepreciation: 2000,
      periodNote: 'عن شهر مارس 2026',
    },
    generateLines: (inputs) => {
      const b = Number(inputs.buildingsDepreciation || 0);
      const m = Number(inputs.machineryDepreciation || 0);
      const v = Number(inputs.vehiclesDepreciation || 0);
      const f = Number(inputs.furnitureDepreciation || 0);
      const totalDep = b + m + v + f;

      return {
        description: `إثبات قسط إهلاك الأصول الثابتة ${inputs.periodNote || ''} وفقاً لمعايير المحاسبة المصرية`,
        referenceDoc: 'DEP-PERIODIC',
        lines: [
          {
            accountCode: '44', // إهلاك الأصول الثابتة
            debit: totalDep,
            credit: 0,
            note: 'إجمالي مصروف إهلاك الأصول الثابتة للفترة',
          },
          ...(b > 0
            ? [
                {
                  accountCode: '1121', // مجمع إهلاك المباني
                  debit: 0,
                  credit: b,
                  note: 'إهلاك مباني وإنشاءات',
                },
              ]
            : []),
          ...(m > 0
            ? [
                {
                  accountCode: '1122', // مجمع إهلاك الآلات والمعدات
                  debit: 0,
                  credit: m,
                  note: 'إهلاك آلات ومعدات تشغيل',
                },
              ]
            : []),
          ...(v > 0
            ? [
                {
                  accountCode: '1123', // مجمع إهلاك وسائل النقل
                  debit: 0,
                  credit: v,
                  note: 'إهلاك سيارات ووسائل نقل',
                },
              ]
            : []),
          ...(f > 0
            ? [
                {
                  accountCode: '1124', // مجمع إهلاك الأثاث وأجهزة الحاسب
                  debit: 0,
                  credit: f,
                  note: 'إهلاك أثاث وأجهزة مكتبية وحواسب',
                },
              ]
            : []),
        ],
      };
    },
  },
  {
    id: 'tpl_vat_settlement',
    title: 'إقفال وتسوية ضريبة القيمة المضافة الشهرية',
    category: 'tax',
    description: 'تسوية ضريبة المخرجات 14% مع ضريبة المدخلات 14% وتحديد صافي الضريبة واجبة السداد لمصلحة الضرائب نموذج 10',
    defaultInputs: {
      outputVatAmount: 28000,
      inputVatAmount: 14000,
      settlementMonth: 'إقرار شهر فبراير 2026',
    },
    generateLines: (inputs) => {
      const outVat = Number(inputs.outputVatAmount || 0);
      const inVat = Number(inputs.inputVatAmount || 0);
      const netPayable = outVat - inVat;

      return {
        description: `تسوية ضريبة القيمة المضافة الشهرية وإقفال حسابات الضريبة ${inputs.settlementMonth || ''}`,
        referenceDoc: 'VAT-DEC-MOD10',
        lines: [
          {
            accountCode: '2321', // ضريبة مخرجات (دائنة أصلاً تصبح مدينة للإقفال)
            debit: outVat,
            credit: 0,
            note: 'إقفال ضريبة القيمة المضافة على المبيعات (مخرجات)',
          },
          {
            accountCode: '1234', // ضريبة مدخلات (مدينة أصلاً تصبح دائنة للإقفال)
            debit: 0,
            credit: inVat,
            note: 'خصم ضريبة القيمة المضافة على المشتريات (مدخلات)',
          },
          ...(netPayable > 0
            ? [
                {
                  accountCode: '2325', // مصروفات والتزامات مستحقة (أو حساب تسوية الضرائب)
                  debit: 0,
                  credit: netPayable,
                  note: 'صافي ضريبة القيمة المضافة المستحقة للسداد لمصلحة الضرائب المصرية بموجب الإقرار',
                },
              ]
            : []),
        ],
      };
    },
  },
];
