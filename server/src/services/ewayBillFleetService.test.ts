import { describe, it, expect } from 'vitest';
import { EwayBillFleetService, IVehicleUpdatePayload, IConsignmentItem, ISplitVehicleEntry } from './ewayBillFleetService';

describe('EwayBillFleetService (NIC Compliance & Part-B Fleet Rules)', () => {
  describe('Vehicle Number Plate Validation', () => {
    it('should validate standard Indian vehicle registration numbers', () => {
      expect(EwayBillFleetService.validateVehicleNumber('TN09AB1234')).toBe(true);
      expect(EwayBillFleetService.validateVehicleNumber('DL1CA4567')).toBe(true);
      expect(EwayBillFleetService.validateVehicleNumber('MH-12-DE-9999')).toBe(true);
      expect(EwayBillFleetService.validateVehicleNumber('KA 01 AB 1234')).toBe(true);
      expect(EwayBillFleetService.validateVehicleNumber('HR26DQ5551')).toBe(true);
    });

    it('should reject invalid or malformed vehicle numbers', () => {
      expect(EwayBillFleetService.validateVehicleNumber('INVALID')).toBe(false);
      expect(EwayBillFleetService.validateVehicleNumber('12345')).toBe(false);
      expect(EwayBillFleetService.validateVehicleNumber('TN09')).toBe(false);
      expect(EwayBillFleetService.validateVehicleNumber('')).toBe(false);
    });
  });

  describe('Part-B Vehicle Update Payload Validation', () => {
    it('should validate and format a valid Road transport Part-B payload', () => {
      const payload: IVehicleUpdatePayload = {
        ewbNo: '121098765432',
        fromPlace: 'Chennai Guindy Depot',
        fromState: 33,
        reasonCode: 'TRANSSHIPMENT',
        reasonRemark: 'Conveyance shift at hub',
        transMode: 'ROAD',
        vehicleNo: 'TN09AB1234',
        vehicleType: 'R'
      };

      const result = EwayBillFleetService.formatPartBVehicleUpdate(payload);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.formattedPayload).toBeDefined();
      expect(result.formattedPayload.ewbNo).toBe(121098765432);
      expect(result.formattedPayload.vehicleNo).toBe('TN09AB1234');
      expect(result.formattedPayload.transMode).toBe('1');
    });

    it('should reject payload with invalid 10-digit EWB number', () => {
      const payload: IVehicleUpdatePayload = {
        ewbNo: '1234567890', // Only 10 digits instead of statutory 12
        fromPlace: 'Bengaluru',
        fromState: 29,
        reasonCode: 'FIRST_TIME',
        transMode: '1',
        vehicleNo: 'KA01AB1234'
      };

      const result = EwayBillFleetService.formatPartBVehicleUpdate(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('E-Way Bill Number must be a valid 12-digit numeric identifier.');
    });

    it('should require transDocNo when transport mode is Rail or Air', () => {
      const payload: IVehicleUpdatePayload = {
        ewbNo: '121098765432',
        fromPlace: 'Mumbai Central Cargo',
        fromState: 27,
        reasonCode: 'FIRST_TIME',
        transMode: 'RAIL',
        transDocNo: '' // Missing railway receipt
      };

      const result = EwayBillFleetService.formatPartBVehicleUpdate(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('transDocNo'))).toBe(true);
    });

    it('should mandate reasonRemark when reasonCode is OTHERS', () => {
      const payload: IVehicleUpdatePayload = {
        ewbNo: '121098765432',
        fromPlace: 'Delhi North Hub',
        fromState: '07',
        reasonCode: 'OTHERS',
        transMode: 'ROAD',
        vehicleNo: 'DL1CA4567',
        reasonRemark: '   ' // empty remark
      };

      const result = EwayBillFleetService.formatPartBVehicleUpdate(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('reasonRemark'))).toBe(true);
    });
  });

  describe('Rule 138(10) Distance Validity & Extension Rules Engine', () => {
    it('should calculate 1 day validity for regular cargo up to 200 km', () => {
      const res50 = EwayBillFleetService.calculateValidity({
        ewbNo: '121098765432',
        distanceKm: 50,
        cargoType: 'REGULAR',
        generatedAt: '2026-10-25T10:00:00Z',
        checkAt: '2026-10-25T12:00:00Z'
      });
      expect(res50.validityDays).toBe(1);
      expect(res50.isExpired).toBe(false);

      const res200 = EwayBillFleetService.calculateValidity({
        ewbNo: '121098765432',
        distanceKm: 200,
        cargoType: 'REGULAR'
      });
      expect(res200.validityDays).toBe(1);
    });

    it('should calculate 2 days validity for 201 km and 3 days for 450 km (Regular Cargo)', () => {
      const res201 = EwayBillFleetService.calculateValidity({
        ewbNo: '121098765432',
        distanceKm: 201,
        cargoType: 'REGULAR'
      });
      expect(res201.validityDays).toBe(2);

      const res450 = EwayBillFleetService.calculateValidity({
        ewbNo: '121098765432',
        distanceKm: 450,
        cargoType: 'REGULAR'
      });
      expect(res450.validityDays).toBe(3);
    });

    it('should enforce 1 day per 20 km for Over Dimensional Cargo (ODC)', () => {
      const res15 = EwayBillFleetService.calculateValidity({
        ewbNo: '121098765432',
        distanceKm: 15,
        cargoType: 'ODC'
      });
      expect(res15.validityDays).toBe(1);

      const res45 = EwayBillFleetService.calculateValidity({
        ewbNo: '121098765432',
        distanceKm: 45,
        cargoType: 'ODC'
      });
      expect(res45.validityDays).toBe(3); // ceil(45 / 20) = 3 days
    });

    it('should expire at 23:59:59 on the final valid day', () => {
      const res = EwayBillFleetService.calculateValidity({
        ewbNo: '121098765432',
        distanceKm: 100,
        cargoType: 'REGULAR',
        generatedAt: '2026-10-25T08:30:00.000Z'
      });

      const expDate = new Date(res.expiresAt);
      expect(expDate.getUTCHours()).toBe(23);
      expect(expDate.getUTCMinutes()).toBe(59);
      expect(expDate.getUTCSeconds()).toBe(59);
    });

    it('should correctly evaluate extension eligibility window (within 8 hours before/after expiry)', () => {
      // 1 day validity generated on 2026-10-25T00:00:00Z -> expires 2026-10-25T23:59:59Z
      // Extension window opens at 2026-10-25T15:59:59Z (-8h) and closes at 2026-10-26T07:59:59Z (+8h)
      const baseGen = '2026-10-25T00:00:00.000Z';

      // 10 hours before expiry (13:59:00) -> too early to extend
      const tooEarly = EwayBillFleetService.calculateValidity({
        ewbNo: '121098765432',
        distanceKm: 100,
        generatedAt: baseGen,
        checkAt: '2026-10-25T13:59:00.000Z'
      });
      expect(tooEarly.canExtend).toBe(false);
      expect(tooEarly.isExpired).toBe(false);

      // 4 hours before expiry (19:59:00) -> valid extension window
      const inWindowBefore = EwayBillFleetService.calculateValidity({
        ewbNo: '121098765432',
        distanceKm: 100,
        generatedAt: baseGen,
        checkAt: '2026-10-25T19:59:00.000Z'
      });
      expect(inWindowBefore.canExtend).toBe(true);
      expect(inWindowBefore.isExpired).toBe(false);

      // 3 hours after expiry (2026-10-26T02:59:00Z) -> expired, but still within 8h post-expiry grace period
      const inWindowAfter = EwayBillFleetService.calculateValidity({
        ewbNo: '121098765432',
        distanceKm: 100,
        generatedAt: baseGen,
        checkAt: '2026-10-26T02:59:00.000Z'
      });
      expect(inWindowAfter.isExpired).toBe(true);
      expect(inWindowAfter.canExtend).toBe(true);

      // 12 hours after expiry (2026-10-26T12:00:00Z) -> expired and outside extension window
      const tooLate = EwayBillFleetService.calculateValidity({
        ewbNo: '121098765432',
        distanceKm: 100,
        generatedAt: baseGen,
        checkAt: '2026-10-26T12:00:00.000Z'
      });
      expect(tooLate.isExpired).toBe(true);
      expect(tooLate.canExtend).toBe(false);
    });
  });

  describe('Multi-Vehicle Consignment Split Tracker', () => {
    const masterItems: IConsignmentItem[] = [
      { itemCode: 'CNC-MILL-01', description: 'Industrial CNC Milling Machine', totalQuantity: 1, uom: 'SET' },
      { itemCode: 'STEEL-PIPE-50MM', description: 'Galvanized Structural Pipe', totalQuantity: 100, uom: 'NOS' }
    ];

    it('should track partial and complete dispatches across multiple vehicles', () => {
      const splitVehicles: ISplitVehicleEntry[] = [
        {
          vehicleNo: 'TN09AB1234',
          transDocNo: 'LR-CH-9001',
          items: [
            { itemCode: 'CNC-MILL-01', quantity: 1 },
            { itemCode: 'STEEL-PIPE-50MM', quantity: 60 }
          ]
        },
        {
          vehicleNo: 'TN09CD5678',
          transDocNo: 'LR-CH-9002',
          items: [
            { itemCode: 'STEEL-PIPE-50MM', quantity: 40 }
          ]
        }
      ];

      const res = EwayBillFleetService.processMultiVehicleSplit(
        'CONSIGN-2026-001',
        '121098765432',
        masterItems,
        splitVehicles
      );

      expect(res.isValid).toBe(true);
      expect(res.validationErrors).toHaveLength(0);
      expect(res.isFullyDispatched).toBe(true);
      expect(res.vehicles).toHaveLength(2);

      const pipeItem = res.totalItems.find(i => i.itemCode === 'STEEL-PIPE-50MM');
      expect(pipeItem?.dispatchedQuantity).toBe(100);
      expect(pipeItem?.remainingQuantity).toBe(0);
    });

    it('should catch and prevent over-dispatching items beyond master consignment limits', () => {
      const overSplitVehicles: ISplitVehicleEntry[] = [
        {
          vehicleNo: 'TN09AB1234',
          transDocNo: 'LR-CH-9001',
          items: [
            { itemCode: 'STEEL-PIPE-50MM', quantity: 70 }
          ]
        },
        {
          vehicleNo: 'TN09CD5678',
          transDocNo: 'LR-CH-9002',
          items: [
            { itemCode: 'STEEL-PIPE-50MM', quantity: 50 } // Total 120 vs master 100
          ]
        }
      ];

      const res = EwayBillFleetService.processMultiVehicleSplit(
        'CONSIGN-2026-002',
        '121098765432',
        masterItems,
        overSplitVehicles
      );

      expect(res.isValid).toBe(false);
      expect(res.validationErrors.some(e => e.includes('exceeds consignment quota'))).toBe(true);
    });
  });
});
