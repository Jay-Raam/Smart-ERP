import { describe, it, expect } from 'vitest';
import { AiAgentService } from './aiAgentService';

describe('AiAgentService - Autonomous ERP Operations', () => {
  it('should detect API key configuration status accurately', () => {
    const configured = AiAgentService.isConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('should parse natural language invoice requests and calculate GST', async () => {
    const response = await AiAgentService.processChat(
      'Create invoice for Acme Corporation: 5 Laptops at 45000 and 2 Monitors at 15000'
    );

    expect(response).toBeDefined();
    expect(response.pendingAction).toBeDefined();
    expect(response.pendingAction?.type).toBe('CREATE_INVOICE');
    expect(response.pendingAction?.previewData.customerName).toContain('Acme Corporation');
    expect(response.pendingAction?.previewData.items.length).toBeGreaterThanOrEqual(1);

    // Verify GST calculations
    const preview = response.pendingAction?.previewData;
    expect(preview.subtotal).toBeGreaterThan(0);
    expect(preview.totalAmount).toBeGreaterThan(preview.subtotal);
    expect(preview.taxAmount).toBeGreaterThan(0);
  });

  it('should parse natural language Purchase Order requests', async () => {
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

  it('should parse natural language email automation requests', async () => {
    const response = await AiAgentService.processChat(
      'Send payment reminder email to finance@clientfirm.com regarding pending dues'
    );

    expect(response).toBeDefined();
    expect(response.pendingAction).toBeDefined();
    expect(response.pendingAction?.type).toBe('SEND_EMAIL');
    expect(response.pendingAction?.previewData.recipientEmail).toBe('finance@clientfirm.com');
    expect(response.pendingAction?.previewData.emailType).toBe('PAYMENT_REMINDER');
  });

  it('should provide guidance and options for conversational prompts', async () => {
    const response = await AiAgentService.processChat('Hello, what can you do?');
    expect(response).toBeDefined();
    expect(response.reply).toContain('Smart-ERP');
    expect(response.reply).toContain('Invoices');
  });
});
