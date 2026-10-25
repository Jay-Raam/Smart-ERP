import { Router, Request, Response } from 'express';
import { PurchaseOrder, Invoice } from '../models/ErpModels';
import { ExecutiveApprovalService, IWebhookApprovalPayload, DocumentType, ApprovalAction } from '../services/executiveApprovalService';
import { requirePermission } from '../middleware/rbacMiddleware';

export const approvalRouter = Router();

/**
 * POST /api/erp/approvals/evaluate-threshold
 * Evaluates financial threshold tier, generates signed HMAC action tokens and WhatsApp message payload
 */
approvalRouter.post(
  '/approvals/evaluate-threshold',
  requirePermission('purchase', 'view'),
  async (req: Request, res: Response) => {
    try {
      const {
        amount,
        documentType = 'PURCHASE_ORDER',
        documentId,
        documentNumber,
        vendorOrCustomerName = 'Partner Entity',
        executivePhone = '919840012345',
        callbackBaseUrl = 'https://erp.smartenterprises.in'
      } = req.body;

      if (!amount || !documentId || !documentNumber) {
        return res.status(400).json({ error: 'amount, documentId, and documentNumber are required.' });
      }

      const notification = ExecutiveApprovalService.generateWhatsAppInteractiveNotification({
        documentType: documentType as DocumentType,
        documentId,
        documentNumber,
        amount: Number(amount),
        vendorOrCustomerName,
        executivePhone,
        callbackBaseUrl
      });

      return res.json({
        success: true,
        notification
      });
    } catch (error: any) {
      console.error('Error evaluating approval threshold:', error);
      return res.status(500).json({ error: 'Failed to evaluate approval threshold', details: error.message });
    }
  }
);

/**
 * POST /api/erp/approvals/whatsapp-webhook
 * Ingests and cryptographically verifies incoming webhook approval decision
 */
approvalRouter.post(
  '/approvals/whatsapp-webhook',
  async (req: Request, res: Response) => {
    try {
      const payload = req.body as IWebhookApprovalPayload;
      const execution = ExecutiveApprovalService.processWebhookApproval(payload);

      if (!execution.success) {
        return res.status(400).json({
          success: false,
          error: execution.error
        });
      }

      // Update underlying database record if MongoDB is connected
      if (execution.documentType === 'PURCHASE_ORDER') {
        await PurchaseOrder.findByIdAndUpdate(payload.documentId, {
          approvalStatus: execution.newStatus,
          $push: {
            approvalHistory: {
              status: execution.newStatus,
              actionBy: payload.approverName || 'WhatsApp Executive Reviewer',
              actionDate: new Date(),
              comments: payload.comments || 'Processed via cryptographic WhatsApp webhook'
            }
          }
        }).catch(() => null);
      } else if (execution.documentType === 'INVOICE') {
        await Invoice.findByIdAndUpdate(payload.documentId, {
          status: execution.newStatus,
          $push: {
            auditHistory: {
              action: `EXECUTIVE_${execution.newStatus.toUpperCase()}`,
              performedBy: payload.approverName || 'WhatsApp Reviewer',
              timestamp: new Date(),
              notes: payload.comments || 'Cryptographic webhook execution'
            }
          }
        }).catch(() => null);
      }

      return res.json({
        success: true,
        message: `Document ${execution.documentNumber} successfully transitioned to '${execution.newStatus}'`,
        execution
      });
    } catch (error: any) {
      console.error('Error processing WhatsApp approval webhook:', error);
      return res.status(500).json({ error: 'Failed to process approval webhook', details: error.message });
    }
  }
);

/**
 * GET /api/erp/approvals/whatsapp-webhook
 * 1-Click interactive approval handler for mobile executives clicking directly from WhatsApp
 */
approvalRouter.get(
  '/approvals/whatsapp-webhook',
  async (req: Request, res: Response) => {
    try {
      const { docType, docId, docNum, action, nonce, ts, sig } = req.query as Record<string, string>;

      if (!docType || !docId || !docNum || !action || !nonce || !ts || !sig) {
        return res.status(400).send('<h3>Invalid approval link parameters.</h3>');
      }

      const payload: IWebhookApprovalPayload = {
        documentType: docType as DocumentType,
        documentId: docId,
        documentNumber: docNum,
        action: action as ApprovalAction,
        approverName: 'Mobile WhatsApp Executive',
        nonce,
        timestamp: Number(ts),
        signature: sig
      };

      const execution = ExecutiveApprovalService.processWebhookApproval(payload);

      if (!execution.success) {
        return res.status(400).send(`<h3>Authorization Failed:</h3><p>${execution.error}</p>`);
      }

      // Update underlying record if DB available
      if (execution.documentType === 'PURCHASE_ORDER') {
        await PurchaseOrder.findByIdAndUpdate(docId, {
          approvalStatus: execution.newStatus
        }).catch(() => null);
      }

      return res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h2 style="color: ${execution.newStatus === 'Approved' ? '#16a34a' : '#dc2626'};">
            ${execution.newStatus === 'Approved' ? '✅ Approved Successfully' : '❌ Rejected'}
          </h2>
          <p>Document <strong>${docNum}</strong> has been marked as <strong>${execution.newStatus}</strong>.</p>
          <p style="color: #64748b; font-size: 13px;">Smart-ERP Cryptographic Audit Trace: ${execution.auditRecord?.signatureDigest}</p>
        </div>
      `);
    } catch (error: any) {
      return res.status(500).send(`<h3>Server Error:</h3><p>${error.message}</p>`);
    }
  }
);
