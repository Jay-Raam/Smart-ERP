/**
 * Smart ERP - Unified GST & HSN-wise Tax Calculation Engine
 * Compliant with Indian Goods and Services Tax (GST) Act
 */

export interface TaxLineItem {
  id?: string;
  productId?: string;
  productName: string;
  sku?: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  discountPercent?: number;
  taxRate: number; // e.g. 18 for 18%
  uom?: string;
}

export interface CalculatedLineItem extends TaxLineItem {
  grossAmount: number;
  discountAmount: number;
  discountPercent?: number;
  taxableAmount: number;
  isTamilNadu: boolean;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export interface HsnTaxSummary {
  hsnCode: string;
  taxRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export interface TaxCalculationResult {
  items: CalculatedLineItem[];
  hsnSummary: HsnTaxSummary[];
  subtotal: number;
  taxableAmount: number;
  totalDiscount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  taxAmount: number;
  grandTotal: number;
  totalAmount: number;
  totalInWords: string;
  isTamilNadu: boolean;
}

/**
 * Checks whether the destination/party billing state is Tamil Nadu (Intra-State).
 * State code 33 or name matching 'Tamil Nadu'.
 */
export function isStateTamilNadu(stateName?: string | null, gstin?: string | null): boolean {
  if (gstin && gstin.trim().length >= 2) {
    const stateCode = gstin.trim().slice(0, 2);
    if (stateCode === '33') return true;
    if (/^\d{2}$/.test(stateCode)) return false;
  }

  if (!stateName) return true; // Default to domestic intra-state if unspecified
  const clean = stateName.trim().toLowerCase();
  if (
    clean.includes('tamil nadu') ||
    clean.includes('tamilnadu') ||
    clean === 'tn' ||
    clean.includes('chennai') ||
    clean.includes('coimbatore') ||
    clean.includes('trichy') ||
    clean.includes('madurai')
  ) {
    return true;
  }

  return false;
}

/**
 * Executes line-item, HSN-grouped, and grand total calculations
 */
export function calculateDocumentTaxes(
  itemsOrOptions: TaxLineItem[] | { items: any[]; billingState?: string | null; customerState?: string | null; partyGstin?: string | null; customerGstin?: string | null },
  billingStateArg?: string | null,
  partyGstinArg?: string | null
): TaxCalculationResult {
  let rawItems: any[] = [];
  let billingState: string | null = null;
  let partyGstin: string | null = null;

  if (Array.isArray(itemsOrOptions)) {
    rawItems = itemsOrOptions;
    billingState = billingStateArg ?? null;
    partyGstin = partyGstinArg ?? null;
  } else if (itemsOrOptions && typeof itemsOrOptions === 'object') {
    rawItems = itemsOrOptions.items || [];
    billingState = itemsOrOptions.billingState ?? itemsOrOptions.customerState ?? billingStateArg ?? null;
    partyGstin = itemsOrOptions.partyGstin ?? itemsOrOptions.customerGstin ?? partyGstinArg ?? null;
  }

  const isTN = isStateTamilNadu(billingState, partyGstin);

  const calculatedItems: CalculatedLineItem[] = (rawItems || []).map((item) => {
    const qty = Math.max(0, item.quantity ?? item.qty ?? 0);
    const price = Math.max(0, item.unitPrice ?? item.rate ?? 0);
    const gross = Math.round(qty * price * 100) / 100;
    const computedDisc = item.discountPercent
      ? Math.round(((gross * item.discountPercent) / 100) * 100) / 100
      : (item.discountAmount ?? 0);
    const disc = Math.min(gross, Math.max(0, computedDisc));
    const taxable = Math.round((gross - disc) * 100) / 100;
    const rate = Math.max(0, item.taxRate ?? item.gstRate ?? 18);

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isTN) {
      cgstRate = rate / 2;
      sgstRate = rate / 2;
      cgstAmount = Math.round(((taxable * cgstRate) / 100) * 100) / 100;
      sgstAmount = Math.round(((taxable * sgstRate) / 100) * 100) / 100;
    } else {
      igstRate = rate;
      igstAmount = Math.round(((taxable * igstRate) / 100) * 100) / 100;
    }

    const totalTax = Math.round((cgstAmount + sgstAmount + igstAmount) * 100) / 100;
    const lineTotal = Math.round((taxable + totalTax) * 100) / 100;

    return {
      ...item,
      productName: item.productName || item.description || item.name || '',
      quantity: qty,
      unitPrice: price,
      uom: item.uom || item.unit || 'Nos',
      grossAmount: gross,
      discountAmount: disc,
      taxableAmount: taxable,
      isTamilNadu: isTN,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax,
      totalAmount: lineTotal,
    };
  });

  // HSN Aggregation
  const hsnMap = new Map<string, HsnTaxSummary>();

  for (const ci of calculatedItems) {
    const key = `${ci.hsnCode || '210690'}_${ci.taxRate}`;
    const existing = hsnMap.get(key) || {
      hsnCode: ci.hsnCode || '210690',
      taxRate: ci.taxRate,
      taxableAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTax: 0,
      totalAmount: 0,
    };

    existing.taxableAmount = Math.round((existing.taxableAmount + ci.taxableAmount) * 100) / 100;
    existing.cgstAmount = Math.round((existing.cgstAmount + ci.cgstAmount) * 100) / 100;
    existing.sgstAmount = Math.round((existing.sgstAmount + ci.sgstAmount) * 100) / 100;
    existing.igstAmount = Math.round((existing.igstAmount + ci.igstAmount) * 100) / 100;
    existing.totalTax = Math.round((existing.totalTax + ci.totalTax) * 100) / 100;
    existing.totalAmount = Math.round((existing.totalAmount + ci.totalAmount) * 100) / 100;

    hsnMap.set(key, existing);
  }

  const hsnSummary = Array.from(hsnMap.values());

  const subtotal = calculatedItems.reduce((sum, i) => sum + i.grossAmount, 0);
  const totalDiscount = calculatedItems.reduce((sum, i) => sum + i.discountAmount, 0);
  const taxableAmount = calculatedItems.reduce((sum, i) => sum + i.taxableAmount, 0);
  const cgstAmount = calculatedItems.reduce((sum, i) => sum + i.cgstAmount, 0);
  const sgstAmount = calculatedItems.reduce((sum, i) => sum + i.sgstAmount, 0);
  const igstAmount = calculatedItems.reduce((sum, i) => sum + i.igstAmount, 0);
  const totalTax = Math.round((cgstAmount + sgstAmount + igstAmount) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

  return {
    items: calculatedItems,
    hsnSummary,
    subtotal: Math.round(subtotal * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstAmount: Math.round(igstAmount * 100) / 100,
    totalTax,
    taxAmount: totalTax,
    grandTotal,
    totalAmount: grandTotal,
    totalInWords: convertNumberToIndianWords(grandTotal),
    isTamilNadu: isTN,
  };
}

/**
 * Converts numbers to Indian currency words format
 * e.g. 110250 -> "One Lakh Ten Thousand Two Hundred Fifty Rupees Only"
 */
export function convertNumberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return singleDigits[n];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return tens[ten] + (unit > 0 ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
      if (rest > 0) res += ' ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const [rupeesPart, paisePart] = num.toFixed(2).split('.');
  let rupees = parseInt(rupeesPart, 10);
  const paise = parseInt(paisePart, 10);

  if (rupees === 0 && paise > 0) {
    return `${convertTwoDigits(paise)} Paise Only`;
  }

  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;
  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;
  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;
  const remainder = rupees;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(`${convertTwoDigits(crore)} Crore`);
  }
  if (lakh > 0) {
    parts.push(`${convertTwoDigits(lakh)} Lakh`);
  }
  if (thousand > 0) {
    parts.push(`${convertTwoDigits(thousand)} Thousand`);
  }
  if (remainder > 0) {
    parts.push(convertThreeDigits(remainder));
  }

  let words = parts.join(' ').trim();
  words = words.charAt(0).toUpperCase() + words.slice(1) + ' Rupees';

  if (paise > 0) {
    words += ` and ${convertTwoDigits(paise)} Paise`;
  }

  return `${words} Only`;
}
