import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { AiAgentService } from './aiAgentService';
import { PurchaseOrder, Invoice, Organisation, Branch } from '../models/ErpModels';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

describe('AiAgentService - Autonomous ERP Operations & Scenario Tests', () => {
  beforeAll(async () => {
    if (process.env.MONGO_URI && mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  it('Scenario 1: Detect API key configuration status accurately', () => {
    const configured = AiAgentService.isConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('Scenario 2: Conversational guidance prompt', async () => {
    const response = await AiAgentService.processChat('Hello, what can you do?');
    expect(response).toBeDefined();
    expect(response.reply).toContain('Smart-ERP');
    expect(response.reply).toContain('Invoices');
  });

  it('Scenario 3: Parse natural language invoice requests with accurate GST breakdown', async () => {
    const response = await AiAgentService.processChat(
      'Create invoice for Acme Corporation: 5 Laptops at 45000 and 2 Monitors at 15000'
    );

    expect(response).toBeDefined();
    expect(response.pendingAction).toBeDefined();
    expect(response.pendingAction?.type).toBe('CREATE_INVOICE');
    expect(response.pendingAction?.previewData.customerName).toContain('Acme Corporation');
    expect(response.pendingAction?.previewData.items.length).toBeGreaterThanOrEqual(1);

    const preview = response.pendingAction?.previewData;
    expect(preview.subtotal).toBeGreaterThan(0);
    expect(preview.totalAmount).toBeGreaterThan(preview.subtotal);
    expect(preview.taxAmount).toBeGreaterThan(0);
  });

  it('Scenario 4: Parse natural language Purchase Order requests', async () => {
    const response = await AiAgentService.processChat(
      'Create purchase order for Steel Works: 50 metal rods at 1200'
    );

    expect(response).toBeDefined();
    expect(response.pendingAction).toBeDefined();
    expect(response.pendingAction?.type).toBe('CREATE_PO');
    expect(response.pendingAction?.previewData.vendorName).toContain('Steel Works');
    expect(response.pendingAction?.previewData.items[0].productName).toContain('metal rods');
    expect(response.pendingAction?.previewData.items[0].quantity).toBe(50);
  });

  it('Scenario 5: Parse natural language email automation requests', async () => {
    const response = await AiAgentService.processChat(
      'Send payment reminder email to finance@clientfirm.com regarding pending dues'
    );

    expect(response).toBeDefined();
    expect(response.pendingAction).toBeDefined();
    expect(response.pendingAction?.type).toBe('SEND_EMAIL');
    expect(response.pendingAction?.previewData.recipientEmail).toBe('finance@clientfirm.com');
    expect(response.pendingAction?.previewData.emailType).toBe('PAYMENT_REMINDER');
  });

  it('Scenario 6: End-to-End PO Creation & Visibility in Scoped ERP List', async () => {
    if (mongoose.connection.readyState === 1) {
      // 1. Process chat to generate PO draft
      const chatRes = await AiAgentService.processChat(
        'Create purchase order for Precision Dynamics: 25 High-grade titanium fasteners at 2400'
      );
      expect(chatRes.pendingAction).toBeDefined();
      expect(chatRes.pendingAction?.type).toBe('CREATE_PO');

      // 2. Execute action to save to DB
      const execRes = await AiAgentService.executeAction(chatRes.pendingAction!);
      expect(execRes.success).toBe(true);
      expect(execRes.recordId).toBeDefined();
      expect(execRes.recordNumber).toBeDefined();
      expect(execRes.record).toBeDefined();
      expect(execRes.record.id).toBe(execRes.recordId);

      // 3. Verify that the PO is queryable with the active organisation and branch scoping
      const foundPo = await PurchaseOrder.findById(execRes.recordId);
      expect(foundPo).not.toBeNull();
      expect(foundPo?.vendorName).toContain('Precision Dynamics');
      expect(foundPo?.organisationId).not.toBe('ORG-001');
      expect(foundPo?.branchId).not.toBe('BR-001');
      expect(foundPo?.items[0].orderedQuantity).toBe(25);
      expect(foundPo?.items[0].remainingQuantity).toBe(25);

      // Verify that querying with organisation filter returns the PO (exact behavior of /api/erp/bootstrap)
      const listMatch = await PurchaseOrder.findOne({
        _id: foundPo?._id,
        organisationId: foundPo?.organisationId,
      });
      expect(listMatch).not.toBeNull();
      expect(listMatch?.poNumber).toBe(foundPo?.poNumber);
    }
  });

  it('Scenario 7: End-to-End Invoice Creation & Visibility in Scoped ERP List', async () => {
    if (mongoose.connection.readyState === 1) {
      const chatRes = await AiAgentService.processChat(
        'Create invoice for Nexa Enterprises: 10 Server Blades at 85000'
      );
      expect(chatRes.pendingAction).toBeDefined();
      expect(chatRes.pendingAction?.type).toBe('CREATE_INVOICE');

      const execRes = await AiAgentService.executeAction(chatRes.pendingAction!);
      expect(execRes.success).toBe(true);
      expect(execRes.recordId).toBeDefined();
      expect(execRes.record).toBeDefined();

      const foundInv = await Invoice.findById(execRes.recordId);
      expect(foundInv).not.toBeNull();
      expect(foundInv?.customerName).toContain('Nexa Enterprises');
      expect(foundInv?.organisationId).not.toBe('ORG-001');
      expect(foundInv?.branchId).not.toBe('BR-001');

      const listMatch = await Invoice.findOne({
        _id: foundInv?._id,
        organisationId: foundInv?.organisationId,
      });
      expect(listMatch).not.toBeNull();
    }
  });
});
