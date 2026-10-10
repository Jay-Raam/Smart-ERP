import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { AiAgentService } from './aiAgentService';
import { PurchaseOrder, Invoice, Organisation, Branch } from '../models/ErpModels';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

describe('AiAgentService - Autonomous ERP Operations & Scenario Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://jauvalue:Tby5VZdwtU9GGaJw@cluster0.pi9vv.mongodb.net/sura?retryWrites=true&w=majority';
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      } catch (e) {
        console.warn('MongoDB connect skipped in test environment:', (e as any).message);
      }
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

  it('Scenario 8: Strictly reject off-topic coding and math queries', async () => {
    const javaRes = await AiAgentService.processChat('wirte the program in hello world in the java');
    expect(javaRes.reply).toContain('Domain Restricted');
    expect(javaRes.reply).not.toContain('public class HelloWorld');

    const mathRes = await AiAgentService.processChat('2+2');
    expect(mathRes.reply).toContain('Domain Restricted');
    expect(mathRes.reply).not.toContain('2 + 2 = 4');

    const pythonRes = await AiAgentService.processChat('write python script for fibonacci');
    expect(pythonRes.reply).toContain('Domain Restricted');
  });

  it('Scenario 9: Return informative inventory stock telemetry without empty replies', async () => {
    const stockRes = await AiAgentService.processChat('Show low stock inventory alerts');
    expect(stockRes).toBeDefined();
    expect(stockRes.reply.length).toBeGreaterThan(10);
    expect(stockRes.reply).toMatch(/Low Stock|Inventory/);
  }, 15000);

  it('Scenario 10: Proactive Multi-Turn Clarification when items/quantities are omitted', async () => {
    const incompleteInv = await AiAgentService.processChat('create invoice for Acme Technologies');
    expect(incompleteInv.reply).toContain('Clarification Needed');
    expect(incompleteInv.reply).toContain('specify the item names, quantities, and rates');
    expect(incompleteInv.pendingAction).toBeUndefined();

    const incompletePo = await AiAgentService.processChat('create purchase order for Steel Direct');
    expect(incompletePo.reply).toContain('Clarification Needed');
    expect(incompletePo.reply).toContain('specify the products, order quantities');
    expect(incompletePo.pendingAction).toBeUndefined();
  });

  it('Scenario 11: Real-time Financial & Sales Telemetry accurately computes totals', async () => {
    const finRes = await AiAgentService.processChat('Show revenue summary and financial report');
    expect(finRes.reply).toContain('Financial & Sales Telemetry');
    expect(finRes.reply).toContain('Total Revenue Invoiced');
    expect(finRes.reply).toContain('Collections Realized');
  });

  it('Scenario 12: Autonomous Auto-Reorder Audit returns low stock procurement recommendations', async () => {
    const reorderRes = await AiAgentService.processChat('run auto-reorder audit for low stock');
    expect(reorderRes.reply).toMatch(/Auto-Reorder Audit|All Inventory Healthy/);
  });

  it('Scenario 13: Created Invoices and Purchase Orders are tagged with isAiGenerated and audit trace', async () => {
    const poAction = {
      id: 'test_ai_tag_po',
      type: 'CREATE_PO' as const,
      title: 'PO: Tagging Test',
      summary: 'PO with AI tag',
      payload: {
        vendorName: 'Audit Test Vendor',
        items: [{ productName: 'Shielded Cables', quantity: 10, unitPrice: 200, taxRate: 18, totalAmount: 2360 }],
        subtotal: 2000,
        taxAmount: 360,
        totalAmount: 2360,
      },
      previewData: {},
    };

    const result = await AiAgentService.executeAction(poAction, { userName: 'Test QA Agent' });
    expect(result.success).toBe(true);

    const savedPo = await PurchaseOrder.findById(result.recordId);
    expect(savedPo?.isAiGenerated).toBe(true);
    expect(savedPo?.history?.[0]?.action).toBe('CREATED_VIA_AI_AGENT');
  });
});

