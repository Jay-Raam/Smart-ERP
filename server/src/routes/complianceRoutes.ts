import { Router, Request, Response } from 'express';
import { Invoice, Bill, Organisation, Branch } from '../models/ErpModels';
import { Gstr1Service } from '../services/gstr1Service';
import { Gstr2bReconService, Gstr2bGovtPayload } from '../services/gstr2bReconService';
import { EwayBillFleetService, IVehicleUpdatePayload, IValidityCalculationRequest } from '../services/ewayBillFleetService';
import { requirePermission } from '../middleware/rbacMiddleware';

export const complianceRouter = Router();

/**
 * GET /api/erp/compliance/gstr1/export
 * Generates official GSTN GSTR-1 portal payload JSON for direct upload to gst.gov.in
 */
complianceRouter.get(
  '/compliance/gstr1/export',
  requirePermission('invoices', 'view'),
  async (req: Request, res: Response) => {
    try {
      const { taxPeriod = '072026', format = 'json' } = req.query as { taxPeriod?: string; format?: string };
      const orgId = req.headers['x-organisation-id'] as string || (req as any).user?.organisationId;
      const branchId = req.headers['x-branch-id'] as string;

      // Resolve supplier GSTIN from Organisation or Branch
      let supplierGstin = '33AABCS1429B1Z1'; // Default statutory fallback
      if (branchId) {
        const branch = await Branch.findById(branchId).lean();
        if (branch && (branch as any).gstin) {
          supplierGstin = (branch as any).gstin;
        }
      }
      if (supplierGstin === '33AABCS1429B1Z1' && orgId) {
        const org = await Organisation.findById(orgId).lean();
        if (org && (org as any).gstin) {
          supplierGstin = (org as any).gstin;
        }
      }

      // Query invoices for this tenant
      const query: any = { isDeleted: { $ne: true } };
      if (orgId) query.organisationId = orgId;
      if (branchId) query.branchId = branchId;

      const invoices = await Invoice.find(query).lean();

      const gstr1Payload = Gstr1Service.generatePortalJson(
        invoices as any,
        supplierGstin,
        taxPeriod
      );

      if (format === 'download') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=GSTR1_${supplierGstin}_${taxPeriod}.json`);
        return res.send(JSON.stringify(gstr1Payload, null, 2));
      }

      return res.json({
        success: true,
        taxPeriod,
        supplierGstin,
        data: gstr1Payload
      });
    } catch (error: any) {
      console.error('Error generating GSTR-1 export:', error);
      return res.status(500).json({ error: 'Failed to generate GSTR-1 portal export', details: error.message });
    }
  }
);

/**
 * POST /api/erp/compliance/gstr2b/reconcile
 * Ingests government GSTR-2B document JSON and reconciles against internal Purchase Bills.
 */
complianceRouter.post(
  '/compliance/gstr2b/reconcile',
  requirePermission('bills', 'view'),
  async (req: Request, res: Response) => {
    try {
      const { gstr2bData, tolerance = 2.0 } = req.body as { gstr2bData: Gstr2bGovtPayload; tolerance?: number };

      if (!gstr2bData || !gstr2bData.data) {
        return res.status(400).json({ error: 'INVALID_GSTR2B_PAYLOAD', message: 'gstr2bData with data.b2b is required.' });
      }

      const orgId = req.headers['x-organisation-id'] as string || (req as any).user?.organisationId;
      const branchId = req.headers['x-branch-id'] as string;

      // Query internal Purchase Bills
      const query: any = { isDeleted: { $ne: true } };
      if (orgId) query.organisationId = orgId;
      if (branchId) query.branchId = branchId;

      const bills = await Bill.find(query).lean();

      const auditSummary = Gstr2bReconService.reconcile(
        bills as any,
        gstr2bData,
        tolerance
      );

      return res.json({
        success: true,
        summary: auditSummary
      });
    } catch (error: any) {
      console.error('Error executing GSTR-2B ITC reconciliation:', error);
      return res.status(500).json({ error: 'Failed to reconcile GSTR-2B ITC', details: error.message });
    }
  }
);

/**
 * POST /api/erp/compliance/ewaybill/part-b/update
 * Validates and prepares Part-B conveyance update payload for NIC E-Way Bill portal
 */
complianceRouter.post(
  '/compliance/ewaybill/part-b/update',
  requirePermission('invoices', 'edit'),
  async (req: Request, res: Response) => {
    try {
      const payload = req.body as IVehicleUpdatePayload;
      const result = EwayBillFleetService.formatPartBVehicleUpdate(payload);

      if (!result.isValid) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_FAILED',
          errors: result.errors
        });
      }

      return res.json({
        success: true,
        message: 'Part-B conveyance payload formatted and validated successfully',
        data: result.formattedPayload
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to format Part-B vehicle update', details: error.message });
    }
  }
);

/**
 * POST /api/erp/compliance/ewaybill/validity/calculate
 * Calculates statutory validity duration and extension window eligibility under Rule 138(10)
 */
complianceRouter.post(
  '/compliance/ewaybill/validity/calculate',
  requirePermission('invoices', 'view'),
  async (req: Request, res: Response) => {
    try {
      const { ewbNo, distanceKm, cargoType, generatedAt, checkAt } = req.body as IValidityCalculationRequest;

      if (!ewbNo || distanceKm === undefined) {
        return res.status(400).json({ error: 'ewbNo and distanceKm are required.' });
      }

      const validity = EwayBillFleetService.calculateValidity({
        ewbNo,
        distanceKm: Number(distanceKm),
        cargoType,
        generatedAt,
        checkAt
      });

      return res.json({
        success: true,
        validity
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to calculate E-Way Bill validity', details: error.message });
    }
  }
);

/**
 * POST /api/erp/compliance/ewaybill/multi-vehicle/split
 * Processes and validates multi-vehicle split consignment tracking
 */
complianceRouter.post(
  '/compliance/ewaybill/multi-vehicle/split',
  requirePermission('invoices', 'edit'),
  async (req: Request, res: Response) => {
    try {
      const { consignmentId, ewbNo, masterItems, splits } = req.body;

      if (!consignmentId || !ewbNo || !Array.isArray(masterItems) || !Array.isArray(splits)) {
        return res.status(400).json({ error: 'consignmentId, ewbNo, masterItems, and splits array are required.' });
      }

      const splitResult = EwayBillFleetService.processMultiVehicleSplit(
        consignmentId,
        ewbNo,
        masterItems,
        splits
      );

      if (!splitResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'CONSIGNMENT_SPLIT_VALIDATION_ERROR',
          validationErrors: splitResult.validationErrors,
          summary: splitResult
        });
      }

      return res.json({
        success: true,
        summary: splitResult
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to process multi-vehicle split', details: error.message });
    }
  }
);

