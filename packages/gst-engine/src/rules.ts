/**
 * @file rules.ts
 * @description Official Indian GST State Codes, Union Territories, and tax slab definitions.
 */

import { StateInfo, SupplyType } from './types';

/**
 * 2-Digit GST State and Union Territory Code Directory (01 to 38)
 * As standardized by the GST Council of India.
 */
export const GST_STATE_CODES: Record<string, StateInfo> = {
  '01': { code: '01', name: 'Jammu and Kashmir', isUnionTerritory: true, hasStateLegislature: true },
  '02': { code: '02', name: 'Himachal Pradesh', isUnionTerritory: false },
  '03': { code: '03', name: 'Punjab', isUnionTerritory: false },
  '04': { code: '04', name: 'Chandigarh', isUnionTerritory: true, hasStateLegislature: false },
  '05': { code: '05', name: 'Uttarakhand', isUnionTerritory: false },
  '06': { code: '06', name: 'Haryana', isUnionTerritory: false },
  '07': { code: '07', name: 'Delhi', isUnionTerritory: true, hasStateLegislature: true },
  '08': { code: '08', name: 'Rajasthan', isUnionTerritory: false },
  '09': { code: '09', name: 'Uttar Pradesh', isUnionTerritory: false },
  '10': { code: '10', name: 'Bihar', isUnionTerritory: false },
  '11': { code: '11', name: 'Sikkim', isUnionTerritory: false },
  '12': { code: '12', name: 'Arunachal Pradesh', isUnionTerritory: false },
  '13': { code: '13', name: 'Nagaland', isUnionTerritory: false },
  '14': { code: '14', name: 'Manipur', isUnionTerritory: false },
  '15': { code: '15', name: 'Mizoram', isUnionTerritory: false },
  '16': { code: '16', name: 'Tripura', isUnionTerritory: false },
  '17': { code: '17', name: 'Meghalaya', isUnionTerritory: false },
  '18': { code: '18', name: 'Assam', isUnionTerritory: false },
  '19': { code: '19', name: 'West Bengal', isUnionTerritory: false },
  '20': { code: '20', name: 'Jharkhand', isUnionTerritory: false },
  '21': { code: '21', name: 'Odisha', isUnionTerritory: false },
  '22': { code: '22', name: 'Chhattisgarh', isUnionTerritory: false },
  '23': { code: '23', name: 'Madhya Pradesh', isUnionTerritory: false },
  '24': { code: '24', name: 'Gujarat', isUnionTerritory: false },
  '26': { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu', isUnionTerritory: true, hasStateLegislature: false },
  '27': { code: '27', name: 'Maharashtra', isUnionTerritory: false },
  '28': { code: '28', name: 'Andhra Pradesh (Old)', isUnionTerritory: false },
  '29': { code: '29', name: 'Karnataka', isUnionTerritory: false },
  '30': { code: '30', name: 'Goa', isUnionTerritory: false },
  '31': { code: '31', name: 'Lakshadweep', isUnionTerritory: true, hasStateLegislature: false },
  '32': { code: '32', name: 'Kerala', isUnionTerritory: false },
  '33': { code: '33', name: 'Tamil Nadu', isUnionTerritory: false },
  '34': { code: '34', name: 'Puducherry', isUnionTerritory: true, hasStateLegislature: true },
  '35': { code: '35', name: 'Andaman and Nicobar Islands', isUnionTerritory: true, hasStateLegislature: false },
  '36': { code: '36', name: 'Telangana', isUnionTerritory: false },
  '37': { code: '37', name: 'Andhra Pradesh (New)', isUnionTerritory: false },
  '38': { code: '38', name: 'Ladakh', isUnionTerritory: true, hasStateLegislature: false },
  '97': { code: '97', name: 'Other Territory', isUnionTerritory: true, hasStateLegislature: false },
  '99': { code: '99', name: 'Centre Jurisdiction', isUnionTerritory: false }
};

/**
 * Standard Indian GST Tax Rates (Percentage)
 */
export const VALID_GST_RATES = [0, 0.25, 3, 5, 12, 18, 28] as const;

/**
 * Helper to determine if a state code belongs to a Union Territory without its own legislative assembly.
 * Such UTs apply UTGST instead of SGST.
 */
export function isUTGSTApplicable(stateCode: string): boolean {
  const state = GST_STATE_CODES[stateCode];
  if (!state) return false;
  return state.isUnionTerritory && !state.hasStateLegislature;
}

/**
 * Determines supply type (INTRA_STATE vs INTER_STATE) based on state codes.
 */
export function determineSupplyType(
  supplierStateCode: string,
  recipientStateCode: string,
  isExport = false,
  isSEZ = false
): SupplyType {
  if (isExport) return 'EXPORT';
  if (isSEZ) return 'SEZ';
  return supplierStateCode.trim() === recipientStateCode.trim() ? 'INTRA_STATE' : 'INTER_STATE';
}
