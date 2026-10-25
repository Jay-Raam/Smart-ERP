/**
 * E-Way Bill (EWB) Part-B Fleet Management, Distance Validity Rules & Multi-Vehicle Consignment Service
 * Compliant with Rule 138(10) of Central Goods and Services Tax (CGST) Rules, 2017.
 */

export type TransportMode = '1' | '2' | '3' | '4' | 'ROAD' | 'RAIL' | 'AIR' | 'SHIP';
export type VehicleType = 'R' | 'O'; // R: Regular, O: Over Dimensional Cargo (ODC)
export type UpdateReason = 'FIRST_TIME' | 'BREAKDOWN' | 'TRANSSHIPMENT' | 'OTHERS';

export interface IVehicleUpdatePayload {
  ewbNo: string;
  fromPlace: string;
  fromState: string | number; // 2-digit state code or state name
  reasonCode: UpdateReason;
  reasonRemark?: string;
  transDocNo?: string;
  transDocDate?: string; // DD/MM/YYYY or YYYY-MM-DD
  transMode: TransportMode;
  vehicleNo?: string;
  vehicleType?: VehicleType;
  updatedAt?: string;
}

export interface IValidityCalculationRequest {
  ewbNo: string;
  distanceKm: number;
  cargoType?: 'REGULAR' | 'ODC';
  generatedAt?: string | Date; // ISO string or Date
  checkAt?: string | Date; // Optional reference time to check against (defaults to now)
}

export interface IValidityCalculationResponse {
  ewbNo: string;
  distanceKm: number;
  cargoType: 'REGULAR' | 'ODC';
  validityDays: number;
  generatedAt: string;
  expiresAt: string;
  isExpired: boolean;
  canExtend: boolean;
  extensionWindow: {
    start: string;
    end: string;
    isEligibleNow: boolean;
    reason?: string;
  };
  remainingHours: number;
}

export interface IConsignmentItem {
  itemCode: string;
  description: string;
  totalQuantity: number;
  uom: string;
}

export interface ISplitVehicleEntry {
  vehicleNo: string;
  transDocNo: string;
  transDocDate?: string;
  driverName?: string;
  driverPhone?: string;
  items: Array<{
    itemCode: string;
    quantity: number;
  }>;
  dispatchDate?: string;
}

export interface IMultiVehicleSplitResult {
  consignmentId: string;
  ewbNo: string;
  totalItems: Array<{
    itemCode: string;
    description: string;
    totalQuantity: number;
    dispatchedQuantity: number;
    remainingQuantity: number;
  }>;
  vehicles: Array<{
    groupNo: number;
    vehicleNo: string;
    transDocNo: string;
    items: Array<{ itemCode: string; quantity: number }>;
    dispatchDate: string;
    status: 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  }>;
  isFullyDispatched: boolean;
  isValid: boolean;
  validationErrors: string[];
}

export class EwayBillFleetService {
  /**
   * Indian Vehicle Number Plate Regex
   * Matches standard format: StateCode (2) + District (2) + Series (0-3) + Number (4)
   * e.g. TN09AB1234, DL1CA4567, MH12DE9999, KA011234, etc.
   */
  private static readonly VEHICLE_PLATE_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/i;

  /**
   * Validate Indian vehicle registration number format
   */
  public static validateVehicleNumber(vehicleNo: string): boolean {
    if (!vehicleNo) return false;
    const sanitized = vehicleNo.replace(/[\s-]/g, '').toUpperCase();
    return this.VEHICLE_PLATE_REGEX.test(sanitized);
  }

  /**
   * Normalize transport mode string or code to standard NIC format
   */
  public static normalizeTransportMode(mode: TransportMode): { code: '1' | '2' | '3' | '4'; name: string } {
    const str = String(mode).toUpperCase();
    if (str === '1' || str === 'ROAD') return { code: '1', name: 'Road' };
    if (str === '2' || str === 'RAIL') return { code: '2', name: 'Rail' };
    if (str === '3' || str === 'AIR') return { code: '3', name: 'Air' };
    if (str === '4' || str === 'SHIP') return { code: '4', name: 'Ship' };
    return { code: '1', name: 'Road' };
  }

  /**
   * Format Part-B vehicle update request payload and perform statutory validation
   */
  public static formatPartBVehicleUpdate(payload: IVehicleUpdatePayload): {
    isValid: boolean;
    errors: string[];
    formattedPayload?: any;
  } {
    const errors: string[] = [];

    // 1. Validate E-Way Bill Number (12 numeric digits)
    if (!payload.ewbNo || !/^\d{12}$/.test(payload.ewbNo)) {
      errors.push('E-Way Bill Number must be a valid 12-digit numeric identifier.');
    }

    // 2. Validate place and state
    if (!payload.fromPlace || payload.fromPlace.trim().length === 0) {
      errors.push('fromPlace (dispatch location) is mandatory for Part-B conveyance update.');
    }

    if (!payload.fromState) {
      errors.push('fromState code is mandatory.');
    }

    // 3. Transport mode & conveyance validation
    const mode = this.normalizeTransportMode(payload.transMode);
    let sanitizedVehicleNo = '';

    if (mode.code === '1') {
      // Road transport requires valid vehicle number
      if (!payload.vehicleNo) {
        errors.push('vehicleNo is required when transportation mode is Road (Mode 1).');
      } else {
        sanitizedVehicleNo = payload.vehicleNo.replace(/[\s-]/g, '').toUpperCase();
        if (!this.validateVehicleNumber(sanitizedVehicleNo)) {
          errors.push(`Invalid vehicle number format '${payload.vehicleNo}'. Must match Indian registration standard (e.g., TN09AB1234).`);
        }
      }
    } else {
      // Rail / Air / Ship requires Transporter Document Number
      if (!payload.transDocNo || payload.transDocNo.trim().length === 0) {
        errors.push(`transDocNo (Lorry Receipt / Railway Receipt / Airway Bill) is required for mode ${mode.name}.`);
      }
    }

    // 4. Update reason validation
    const validReasons: UpdateReason[] = ['FIRST_TIME', 'BREAKDOWN', 'TRANSSHIPMENT', 'OTHERS'];
    if (!validReasons.includes(payload.reasonCode)) {
      errors.push(`Invalid reasonCode '${payload.reasonCode}'. Must be one of: ${validReasons.join(', ')}.`);
    }

    if (payload.reasonCode === 'OTHERS' && (!payload.reasonRemark || payload.reasonRemark.trim().length < 5)) {
      errors.push("reasonRemark of at least 5 characters is mandatory when reasonCode is 'OTHERS'.");
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const stateCodeNum = typeof payload.fromState === 'number' 
      ? payload.fromState 
      : parseInt(String(payload.fromState).slice(0, 2), 10) || 33;

    return {
      isValid: true,
      errors: [],
      formattedPayload: {
        ewbNo: Number(payload.ewbNo),
        vehicleNo: sanitizedVehicleNo || undefined,
        fromPlace: payload.fromPlace.trim(),
        fromState: stateCodeNum,
        reasonCode: payload.reasonCode,
        reasonRem: payload.reasonRemark || '',
        transDocNo: payload.transDocNo ? payload.transDocNo.trim() : '',
        transDocDate: payload.transDocDate || new Date().toISOString().split('T')[0],
        transMode: mode.code,
        vehicleType: payload.vehicleType || 'R',
        userGSTINTransin: '33AABCS1429B1Z1',
        updatedDate: payload.updatedAt || new Date().toISOString()
      }
    };
  }

  /**
   * Calculate statutory validity under Rule 138(10) of CGST Rules 2017:
   * 
   * (a) Regular Cargo:
   *     - 1 day for distance up to 200 km, and 1 additional day for every 200 km or part thereof.
   * (b) Over Dimensional Cargo (ODC) or Multimodal transport involving sea:
   *     - 1 day for distance up to 20 km, and 1 additional day for every 20 km or part thereof.
   * 
   * Expiry rule:
   *     - Expires at 23:59:59 (midnight) on the last valid date.
   * Extension eligibility:
   *     - Transporter may extend validity within 8 hours before or up to 8 hours after expiry time.
   */
  public static calculateValidity(req: IValidityCalculationRequest): IValidityCalculationResponse {
    const distance = Math.max(0, req.distanceKm);
    const cargoType = req.cargoType === 'ODC' ? 'ODC' : 'REGULAR';
    const genDate = req.generatedAt ? new Date(req.generatedAt) : new Date();
    const checkDate = req.checkAt ? new Date(req.checkAt) : new Date();

    // Determine validity days
    let validityDays = 1;
    if (cargoType === 'ODC') {
      // 1 day per 20 km or part thereof
      validityDays = Math.ceil(distance / 20) || 1;
    } else {
      // Regular cargo: 1 day per 200 km or part thereof (Rule amended from 100km to 200km w.e.f Jan 1, 2021)
      validityDays = Math.ceil(distance / 200) || 1;
    }

    // Expiry date is calculated as generation date + (validityDays - 1) days at 23:59:59.999 UTC
    // E.g., generated on Oct 25 with 1 day validity -> expires on Oct 25 at 23:59:59.999
    // Generated on Oct 25 with 2 days validity -> expires on Oct 26 at 23:59:59.999
    const expiresDate = new Date(genDate.getTime());
    expiresDate.setUTCDate(expiresDate.getUTCDate() + (validityDays - 1));
    expiresDate.setUTCHours(23, 59, 59, 999);

    const isExpired = checkDate.getTime() > expiresDate.getTime();

    // Extension window: 8 hours before expiry to 8 hours after expiry
    const extensionWindowStart = new Date(expiresDate.getTime() - (8 * 60 * 60 * 1000));
    const extensionWindowEnd = new Date(expiresDate.getTime() + (8 * 60 * 60 * 1000));

    const isWithinExtensionWindow = checkDate.getTime() >= extensionWindowStart.getTime() && 
                                    checkDate.getTime() <= extensionWindowEnd.getTime();

    const remainingMs = expiresDate.getTime() - checkDate.getTime();
    const remainingHours = Math.round((remainingMs / (1000 * 60 * 60)) * 10) / 10;

    let extensionReason: string | undefined;
    if (!isWithinExtensionWindow) {
      if (checkDate.getTime() < extensionWindowStart.getTime()) {
        const hoursUntilWindow = Math.round(((extensionWindowStart.getTime() - checkDate.getTime()) / (1000 * 60 * 60)) * 10) / 10;
        extensionReason = `Extension window opens 8 hours prior to expiry (in ${hoursUntilWindow} hours).`;
      } else {
        extensionReason = 'Extension grace window expired (exceeded 8 hours past statutory expiry).';
      }
    }

    return {
      ewbNo: req.ewbNo,
      distanceKm: distance,
      cargoType,
      validityDays,
      generatedAt: genDate.toISOString(),
      expiresAt: expiresDate.toISOString(),
      isExpired,
      canExtend: isWithinExtensionWindow,
      extensionWindow: {
        start: extensionWindowStart.toISOString(),
        end: extensionWindowEnd.toISOString(),
        isEligibleNow: isWithinExtensionWindow,
        reason: extensionReason
      },
      remainingHours
    };
  }

  /**
   * Multi-Vehicle Consignment Splitter
   * Used when a large industrial consignment/machinery is transported in batches across multiple vehicles
   * mapped against one master Part-A E-Way Bill.
   * 
   * Enforces:
   * 1. No item can be dispatched exceeding master line item total.
   * 2. Generates distinct sequential group identifiers and tracking status.
   */
  public static processMultiVehicleSplit(
    consignmentId: string,
    ewbNo: string,
    masterItems: IConsignmentItem[],
    splitEntries: ISplitVehicleEntry[]
  ): IMultiVehicleSplitResult {
    const validationErrors: string[] = [];

    // Map master quantities
    const masterMap = new Map<string, { description: string; totalQty: number; dispatchedQty: number }>();
    for (const item of masterItems) {
      masterMap.set(item.itemCode, {
        description: item.description,
        totalQty: item.totalQuantity,
        dispatchedQty: 0
      });
    }

    const processedVehicles: IMultiVehicleSplitResult['vehicles'] = [];

    // Iterate through split entries
    splitEntries.forEach((entry, idx) => {
      // Validate vehicle plate
      if (!this.validateVehicleNumber(entry.vehicleNo)) {
        validationErrors.push(`Split #${idx + 1}: Invalid vehicle number '${entry.vehicleNo}'.`);
      }

      if (!entry.transDocNo || entry.transDocNo.trim().length === 0) {
        validationErrors.push(`Split #${idx + 1}: Missing LR/Transporter Document Number.`);
      }

      for (const splitItem of entry.items) {
        const master = masterMap.get(splitItem.itemCode);
        if (!master) {
          validationErrors.push(`Split #${idx + 1}: Item code '${splitItem.itemCode}' not found in master consignment.`);
          continue;
        }

        master.dispatchedQty += splitItem.quantity;
        if (master.dispatchedQty > master.totalQty) {
          validationErrors.push(
            `Item '${splitItem.itemCode}' total dispatched (${master.dispatchedQty}) exceeds consignment quota (${master.totalQty}).`
          );
        }
      }

      processedVehicles.push({
        groupNo: idx + 1,
        vehicleNo: entry.vehicleNo.replace(/[\s-]/g, '').toUpperCase(),
        transDocNo: entry.transDocNo.trim(),
        items: entry.items,
        dispatchDate: entry.dispatchDate || new Date().toISOString(),
        status: 'DISPATCHED'
      });
    });

    const totalItems = Array.from(masterMap.entries()).map(([code, data]) => ({
      itemCode: code,
      description: data.description,
      totalQuantity: data.totalQty,
      dispatchedQuantity: data.dispatchedQty,
      remainingQuantity: Math.max(0, data.totalQty - data.dispatchedQty)
    }));

    const isFullyDispatched = totalItems.every(i => i.remainingQuantity === 0);
    const isValid = validationErrors.length === 0;

    return {
      consignmentId,
      ewbNo,
      totalItems,
      vehicles: processedVehicles,
      isFullyDispatched,
      isValid,
      validationErrors
    };
  }
}
