// Strict Indian GSTIN regular expression
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^(\+91[\-\s]?)?[6-9]\d{9}$/;

export const GST_STATE_CODE_MAP: Record<string, string> = {
  'Jammu and Kashmir': '01',
  'Himachal Pradesh': '02',
  'Punjab': '03',
  'Chandigarh': '04',
  'Uttarakhand': '05',
  'Haryana': '06',
  'Delhi': '07',
  'Rajasthan': '08',
  'Uttar Pradesh': '09',
  'Bihar': '10',
  'Sikkim': '11',
  'Arunachal Pradesh': '12',
  'Nagaland': '13',
  'Manipur': '14',
  'Mizoram': '15',
  'Tripura': '16',
  'Meghalaya': '17',
  'Assam': '18',
  'West Bengal': '19',
  'Jharkhand': '20',
  'Odisha': '21',
  'Chhattisgarh': '22',
  'Madhya Pradesh': '23',
  'Gujarat': '24',
  'Dadra and Nagar Haveli and Daman and Diu': '26',
  'Maharashtra': '27',
  'Andhra Pradesh': '37',
  'Karnataka': '29',
  'Goa': '30',
  'Lakshadweep': '31',
  'Kerala': '32',
  'Tamil Nadu': '33',
  'Puducherry': '34',
  'Andaman and Nicobar Islands': '35',
  'Telangana': '36',
  'Ladakh': '38',
  'Other Territory': '97',
};

export function validateGSTIN(gstin?: string | null, stateName?: string | null): { valid: boolean; error?: string } {
  if (!gstin || !gstin.trim()) {
    return { valid: true };
  }
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) {
    return { valid: false, error: 'GSTIN must be exactly 15 characters' };
  }
  if (!GSTIN_REGEX.test(clean)) {
    return { valid: false, error: 'Invalid GSTIN format (must be 15 alphanumeric e.g. 33AAACB1234P1Z1)' };
  }

  if (stateName && GST_STATE_CODE_MAP[stateName]) {
    const expectedCode = GST_STATE_CODE_MAP[stateName];
    const actualCode = clean.slice(0, 2);
    if (actualCode !== expectedCode) {
      return {
        valid: false,
        error: `GSTIN state code prefix (${actualCode}) does not match selected state ${stateName} (${expectedCode})`,
      };
    }
  }

  return { valid: true };
}

export function validateQuantity(qty: any): { valid: boolean; error?: string } {
  const num = Number(qty);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'Quantity must be a positive number greater than 0' };
  }
  return { valid: true };
}

export function validateCreditLimit(limit: any): { valid: boolean; error?: string } {
  const num = Number(limit);
  if (isNaN(num) || num <= 10000) {
    return { valid: false, error: 'Credit limit must be strictly more than ₹10,000' };
  }
  return { valid: true };
}
