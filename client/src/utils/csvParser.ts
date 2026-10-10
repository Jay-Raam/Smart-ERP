export interface IParsedCsvResult {
  fileName: string;
  detectedType: 'PRODUCTS' | 'CUSTOMERS' | 'UNKNOWN';
  headers: string[];
  totalRows: number;
  previewRows: Record<string, any>[];
  allRows: Record<string, any>[];
}

/**
 * Pure client-side CSV / TSV parser with delimiter auto-detection and entity inference
 */
export function parseCsvFile(content: string, fileName: string = 'data.csv'): IParsedCsvResult {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      fileName,
      detectedType: 'UNKNOWN',
      headers: [],
      totalRows: 0,
      previewRows: [],
      allRows: [],
    };
  }

  // Detect delimiter: comma, tab, or semicolon
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  }

  // Parse header line respecting possible quotes
  const rawHeaders = splitDelimitedLine(firstLine, delimiter).map((h) =>
    h.replace(/^["']|["']$/g, '').trim()
  );

  const allRows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitDelimitedLine(lines[i], delimiter);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;

    const rowObj: Record<string, any> = {};
    rawHeaders.forEach((header, idx) => {
      const val = values[idx] !== undefined ? values[idx].replace(/^["']|["']$/g, '').trim() : '';
      rowObj[normalizeHeaderKey(header)] = val;
    });

    allRows.push(rowObj);
  }

  // Infer entity type
  const headerKeys = rawHeaders.map((h) => h.toLowerCase());
  let detectedType: IParsedCsvResult['detectedType'] = 'UNKNOWN';

  const productKeywords = ['product', 'sku', 'sellingprice', 'price', 'uom', 'cost', 'hsn', 'currentstock'];
  const customerKeywords = ['customer', 'company', 'contact', 'gstin', 'creditlimit', 'phone', 'billing'];

  const productMatchCount = productKeywords.filter((k) =>
    headerKeys.some((h) => h.includes(k))
  ).length;

  const customerMatchCount = customerKeywords.filter((k) =>
    headerKeys.some((h) => h.includes(k))
  ).length;

  if (productMatchCount >= customerMatchCount && productMatchCount > 0) {
    detectedType = 'PRODUCTS';
  } else if (customerMatchCount > 0) {
    detectedType = 'CUSTOMERS';
  } else {
    // Default fallback to products if numeric price exists
    detectedType = 'PRODUCTS';
  }

  return {
    fileName,
    detectedType,
    headers: rawHeaders,
    totalRows: allRows.length,
    previewRows: allRows.slice(0, 4),
    allRows,
  };
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeaderKey(header: string): string {
  const lower = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (lower.includes('sku') || lower.includes('code')) return 'sku';
  if (lower.includes('name') || lower.includes('title') || lower.includes('item') || lower.includes('product')) return 'name';
  if (lower.includes('price') || lower.includes('rate') || lower.includes('selling')) return 'sellingPrice';
  if (lower.includes('cost') || lower.includes('purchase')) return 'purchaseCost';
  if (lower.includes('stock') || lower.includes('qty') || lower.includes('quantity')) return 'currentStock';
  if (lower.includes('hsn')) return 'hsnCode';
  if (lower.includes('uom') || lower.includes('unit')) return 'uom';
  if (lower.includes('tax') || lower.includes('gst')) return 'taxRate';
  if (lower.includes('phone') || lower.includes('mobile')) return 'phone';
  if (lower.includes('email')) return 'email';
  if (lower.includes('city')) return 'city';
  if (lower.includes('state')) return 'state';
  if (lower.includes('gstin')) return 'gstin';
  return header;
}
