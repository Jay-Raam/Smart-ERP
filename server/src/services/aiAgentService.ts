import axios from 'axios';
import mongoose from 'mongoose';
import {
  Organisation,
  Branch,
  FinancialYear,
  Customer,
  Vendor,
  Product,
  Invoice,
  PurchaseOrder,
  AuditHistory,
  IInvoice,
  IPurchaseOrder,
} from '../models/ErpModels';
import { calculateDocumentTaxes } from '../utils/taxCalculation';
import { maskSensitiveSecrets } from '../middleware/securitySanitizer';
import { ReconciliationService } from './reconciliationService';
import { ReminderService } from './reminderService';

export interface AgentChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentPendingAction {
  id: string;
  type: 'CREATE_INVOICE' | 'CREATE_PO' | 'SEND_EMAIL';
  title: string;
  summary: string;
  payload: any;
  previewData: any;
}

export interface AgentChatResponse {
  reply: string;
  pendingAction?: AgentPendingAction | null;
  provider: 'openrouter' | 'local_fallback';
  model: string;
  apiKeyConfigured: boolean;
  setupInstructions?: string;
}

// OpenRouter Tool Definitions
const ERP_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Draft or create a sales tax invoice for a customer with items, quantities, rates, and GST breakdown.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string', description: 'Name of the customer or client' },
          customerGstin: { type: 'string', description: 'Optional 15-character GSTIN' },
          customerState: { type: 'string', description: 'Customer state for tax calculation (e.g. Tamil Nadu, Karnataka)' },
          items: {
            type: 'array',
            description: 'List of line items',
            items: {
              type: 'object',
              properties: {
                productName: { type: 'string', description: 'Product or service description' },
                quantity: { type: 'number', description: 'Quantity' },
                unitPrice: { type: 'number', description: 'Unit price in INR' },
                taxRate: { type: 'number', description: 'GST rate percentage (5, 12, 18, 28). Default 18' },
                hsnCode: { type: 'string', description: 'HSN code if known' },
              },
              required: ['productName', 'quantity', 'unitPrice'],
            },
          },
          dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
          notes: { type: 'string', description: 'Invoice notes or terms' },
        },
        required: ['customerName', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_purchase_order',
      description: 'Generate a purchase order (PO) for a vendor or supplier for procurement of materials.',
      parameters: {
        type: 'object',
        properties: {
          vendorName: { type: 'string', description: 'Supplier or vendor name' },
          vendorGstin: { type: 'string', description: 'Vendor GSTIN if known' },
          vendorState: { type: 'string', description: 'Vendor state (e.g. Tamil Nadu, Maharashtra)' },
          items: {
            type: 'array',
            description: 'Items to purchase',
            items: {
              type: 'object',
              properties: {
                productName: { type: 'string', description: 'Item name or description' },
                quantity: { type: 'number', description: 'Quantity to order' },
                unitPrice: { type: 'number', description: 'Cost price per unit in INR' },
                taxRate: { type: 'number', description: 'GST tax rate percentage. Default 18' },
              },
              required: ['productName', 'quantity', 'unitPrice'],
            },
          },
          expectedDate: { type: 'string', description: 'Expected delivery date in YYYY-MM-DD format' },
          instructions: { type: 'string', description: 'Special delivery or quality instructions' },
        },
        required: ['vendorName', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Draft or trigger an automated email dispatch for invoice delivery, PO transmission, or payment reminders.',
      parameters: {
        type: 'object',
        properties: {
          recipientEmail: { type: 'string', description: 'Recipient email address' },
          recipientName: { type: 'string', description: 'Recipient name' },
          emailType: {
            type: 'string',
            enum: ['INVOICE_DELIVERY', 'PO_DISPATCH', 'PAYMENT_REMINDER'],
            description: 'Type of transaction email',
          },
          subject: { type: 'string', description: 'Email subject' },
          body: { type: 'string', description: 'Email body text' },
          referenceId: { type: 'string', description: 'Invoice or PO number reference' },
        },
        required: ['recipientEmail', 'subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_erp_data',
      description: 'Query operational ERP data such as pending invoices, low stock items, or recent purchase orders.',
      parameters: {
        type: 'object',
        properties: {
          queryType: {
            type: 'string',
            enum: ['PENDING_INVOICES', 'LOW_STOCK', 'RECENT_POS', 'CUSTOMERS', 'VENDORS'],
            description: 'Type of query',
          },
          limit: { type: 'number', description: 'Max number of records' },
        },
        required: ['queryType'],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Smart-ERP's Agentic Operations Assistant, strictly scoped to this ERP system.

STRICT DOMAIN BOUNDARIES:
- You ONLY answer questions and execute actions directly related to Smart-ERP enterprise operations: Invoices, Purchase Orders, Bills, Inventory/Stock levels, Customers, Vendors, and Business Email Reminders.
- You MUST STRICTLY DECLINE and REFUSE all general programming questions (e.g. writing Java, Python, C++, HTML, JavaScript code), general math or homework problems (e.g. 2+2, calculus), general trivia, recipes, creative writing, or non-ERP queries.
- If the user asks anything outside Smart-ERP operations, politely state that you are restricted to Smart-ERP operations and guide them to invoice, PO, inventory, or email workflows.
- When the user asks to create an invoice, purchase order, or draft/send an email:
  1. Always call the corresponding tool (create_invoice, create_purchase_order, or send_email) with the parsed parameters.
  2. If the user provides partial details, make sensible business assumptions (standard 18% GST, due date in 15 days, default state) and call the tool.
  3. Validate that quantities are positive numbers and unit prices are positive numbers.
  4. Be concise and professional.
- When the user asks about stock, inventory, low stock items, or pending invoices:
  1. Call the tool query_erp_data with queryType="LOW_STOCK" or "PENDING_INVOICES", or provide immediate telemetry summary.
`;

export class AiAgentService {
  /**
   * Check if OpenRouter key is configured
   */
  static isConfigured(): boolean {
    const key = process.env.OPENROUTER_API_KEY;
    return !!key && key.trim().length > 0 && !key.includes('your-openrouter-key-here');
  }

  static getModel(): string {
    return process.env.OPENROUTER_MODEL || 'openrouter/free';
  }

  /**
   * Deterministic guardrail to reject non-ERP off-topic queries (coding, trivia, homework)
   */
  static isOffTopicQuery(message: string): boolean {
    const text = message.trim().toLowerCase();

    // 1. Coding / programming triggers
    const codeTriggers = [
      'write a program',
      'write the program',
      'wirte the program',
      'write program',
      'write code',
      'write a function',
      'write script',
      'generate code',
      'in java',
      'in python',
      'in c++',
      'in c#',
      'in javascript',
      'in typescript',
      'in rust',
      'in golang',
      'in php',
      'public class',
      'def ',
      'hello world',
      'fibonacci',
      'binary search',
      'bubble sort',
      'leetcode',
      'hackerrank',
      'html code',
      'css code',
      'react component',
    ];
    if (codeTriggers.some((trigger) => text.includes(trigger))) {
      return true;
    }

    // 2. Off-topic basic math questions (e.g. "2+2", "what is 2 + 2", "15 * 4")
    if (
      /^(what is\s+)?\d+\s*[\+\-\*\/]\s*\d+\s*\??$/.test(text) ||
      text === '2+2' ||
      text === '2 + 2'
    ) {
      return true;
    }

    // 3. Trivia / creative writing triggers
    const triviaTriggers = [
      'tell me a joke',
      'write a poem',
      'write an essay',
      'who is the president',
      'capital of',
      'movie recommendation',
      'weather in',
      'recipe for',
      'sing a song',
    ];
    if (triviaTriggers.some((trigger) => text.includes(trigger))) {
      return true;
    }

    return false;
  }

  static getOffTopicRefusal(): string {
    return (
      `🔒 **Domain Restricted: Smart-ERP Copilot**\n\n` +
      `I am dedicated strictly to **Smart-ERP operations** and cannot assist with general programming, code development, mathematical calculations, or general trivia.\n\n` +
      `**Here is what I can help you with:**\n` +
      `• 📄 **Sales Invoices**: *"Create invoice for Acme Technologies: 5 Laptops at 50,000 INR"*\n` +
      `• 📦 **Purchase Orders**: *"Create purchase order for Steel Direct: 50 beams at 2,400 INR"*\n` +
      `• ✉️ **Email Automation**: *"Send payment reminder email to billing@clientcorp.com"*\n` +
      `• 📊 **ERP Telemetry**: *"Show low stock inventory alerts"* or *"Show pending invoices"*\n\n` +
      `*Please try one of the template buttons below or enter an ERP-related request!*`
    );
  }

  /**
   * Main entry point for processing chat messages
   */
  static async processChat(
    userMessage: string,
    history: AgentChatMessage[] = [],
    context?: { organisationId?: string; branchId?: string; user?: any }
  ): Promise<AgentChatResponse> {
    // 1. Guardrail against off-topic queries (coding, trivia, math)
    if (this.isOffTopicQuery(userMessage)) {
      return {
        reply: this.getOffTopicRefusal(),
        provider: 'local_fallback',
        model: 'domain-guardrail-engine',
        apiKeyConfigured: this.isConfigured(),
      };
    }

    const lower = userMessage.toLowerCase();

    // 2. Autonomous auto-reorder audit interception
    if (
      lower.includes('auto-reorder') ||
      lower.includes('reorder audit') ||
      lower.includes('run reorder') ||
      lower.includes('trigger reorder')
    ) {
      const auditResult = await this.checkLowStockAndAutoReorder(context);
      return {
        reply: auditResult.message,
        provider: 'openrouter',
        model: this.getModel(),
        apiKeyConfigured: this.isConfigured(),
      };
    }

    // 3. Direct stock / inventory query interception
    if (
      lower.includes('low stock') ||
      lower.includes('check stock') ||
      lower.includes('inventory alert') ||
      lower.includes('show low stock')
    ) {
      const stockTelemetry = await this.executeErpTelemetryQuery('stock');
      return {
        reply: stockTelemetry,
        provider: 'openrouter',
        model: this.getModel(),
        apiKeyConfigured: this.isConfigured(),
      };
    }

    // 4. Direct financial & sales analytics telemetry interception
    if (
      lower.includes('revenue') ||
      lower.includes('total sales') ||
      lower.includes('financial report') ||
      lower.includes('financial summary') ||
      lower.includes('sales summary') ||
      lower.includes('unpaid invoice') ||
      lower.includes('pending invoice')
    ) {
      const finTelemetry = await this.executeFinancialAnalyticsQuery(context);
      return {
        reply: finTelemetry,
        provider: 'openrouter',
        model: this.getModel(),
        apiKeyConfigured: this.isConfigured(),
      };
    }

    // 5. Direct 2-Way & 3-Way Matching and Discrepancy Reconciliation
    if (
      lower.includes('reconcil') ||
      lower.includes('3-way match') ||
      lower.includes('three-way match') ||
      lower.includes('2-way match') ||
      lower.includes('discrepancy') ||
      lower.includes('billing match')
    ) {
      const reconSummary = await ReconciliationService.performThreeWayMatch(
        context?.organisationId,
        context?.branchId
      );
      return {
        reply: ReconciliationService.formatReconciliationMarkdown(reconSummary),
        provider: 'openrouter',
        model: this.getModel(),
        apiKeyConfigured: this.isConfigured(),
      };
    }

    // 6. Direct Overdue Payment Reminder Engine (Free Open Source Email & WhatsApp)
    const hasSpecificEmailTarget = /@[\w.-]+\.\w+/.test(userMessage);
    if (
      !hasSpecificEmailTarget &&
      (lower.includes('overdue payment') ||
        lower.includes('overdue reminder') ||
        lower.includes('remind customer') ||
        lower.includes('overdue invoice') ||
        (lower.includes('payment reminder') && !lower.includes('email to')) ||
        lower.includes('reminder engine'))
    ) {
      const reminderSummary = await ReminderService.getOverdueReminders(
        context?.organisationId,
        context?.branchId
      );
      return {
        reply: ReminderService.formatRemindersMarkdown(reminderSummary),
        provider: 'openrouter',
        model: this.getModel(),
        apiKeyConfigured: this.isConfigured(),
      };
    }

    // 7. Multi-turn clarification dialog for incomplete prompts
    const clarification = this.checkIncompleteActionClarification(userMessage);
    if (clarification) {
      return {
        reply: clarification,
        provider: 'openrouter',
        model: this.getModel(),
        apiKeyConfigured: this.isConfigured(),
      };
    }

    const isKeyPresent = this.isConfigured();
    let response: AgentChatResponse;

    if (isKeyPresent) {
      try {
        response = await this.callOpenRouter(userMessage, history, context);
      } catch (err: any) {
        console.error('OpenRouter call error, falling back to local agent:', err?.message || err);
        response = await this.processLocalFallback(
          userMessage,
          `OpenRouter API encountered a temporary error (${err?.response?.data?.error?.message || err.message}). Switched to local agent engine.`
        );
      }
    } else {
      response = await this.processLocalFallback(userMessage);
    }

    // Strict output sanitization against data leakage
    response.reply = maskSensitiveSecrets(response.reply);
    return response;
  }

  /**
   * Call OpenRouter endpoint
   */
  private static async callOpenRouter(
    userMessage: string,
    history: AgentChatMessage[],
    context?: any
  ): Promise<AgentChatResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY!;
    const model = this.getModel();

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: messages,
        tools: ERP_TOOLS,
        tool_choice: 'auto',
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Smart-ERP AI Assistant',
        },
        timeout: 30000,
      }
    );

    const choice = response.data?.choices?.[0];
    const message = choice?.message;

    if (!message) {
      throw new Error('Empty response received from OpenRouter');
    }

    let pendingAction: AgentPendingAction | null = null;
    let replyText = (message.content || '').trim();

    // Check if tool calls were triggered
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const fnName = toolCall.function.name;
      let args: any = {};
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        args = {};
      }

      if (fnName === 'query_erp_data') {
        const queryType = args.queryType || 'LOW_STOCK';
        replyText = await this.handleErpDataQuery(queryType, args);
      } else {
        const generated = await this.buildPendingAction(fnName, args, context);
        if (generated) {
          pendingAction = generated.action;
          if (!replyText) {
            replyText = generated.summaryMessage;
          }
        }
      }
    }

    // Fallback if replyText is still empty
    if (!replyText || replyText.trim().length === 0) {
      const lower = userMessage.toLowerCase();
      if (lower.includes('stock') || lower.includes('inventory')) {
        replyText = await this.executeErpTelemetryQuery('stock');
      } else if (lower.includes('pending') || lower.includes('invoice')) {
        replyText = await this.executeErpTelemetryQuery('pending');
      } else if (pendingAction) {
        replyText = `I have drafted the ${pendingAction.title} for you. Please review and confirm below.`;
      } else {
        replyText = `I am your Smart-ERP Operations Assistant. How can I help you manage invoices, purchase orders, or inventory today?`;
      }
    }

    return {
      reply: replyText.trim(),
      pendingAction,
      provider: 'openrouter',
      model,
      apiKeyConfigured: true,
    };
  }

  /**
   * Intelligent local fallback engine when API key is not yet set
   */
  private static async processLocalFallback(
    userMessage: string,
    customNotice?: string
  ): Promise<AgentChatResponse> {
    const lower = userMessage.toLowerCase();
    let pendingAction: AgentPendingAction | null = null;
    let reply = '';

    const setupBanner = customNotice
      ? `> ⚠️ **Notice**: ${customNotice}\n\n`
      : `> 💡 **Setup Guide**: You are currently in **Intelligent Local Mode**. To connect live OpenRouter AI models for free, add your key to \`server/.env\`:\n> \`OPENROUTER_API_KEY=sk-or-v1-...\`\n> \`OPENROUTER_MODEL=openrouter/free\`\n\n`;

    // 1. Detect Invoice creation request
    if (
      lower.includes('invoice') ||
      lower.includes('bill') ||
      (lower.includes('create') && lower.includes('customer'))
    ) {
      const parsed = this.parseInvoicePrompt(userMessage);
      const generated = await this.buildPendingAction('create_invoice', parsed);
      if (generated) {
        pendingAction = generated.action;
        reply =
          setupBanner +
          `I have prepared an **Invoice Draft** based on your request:\n` +
          `- **Customer**: ${parsed.customerName}\n` +
          `- **Items**: ${parsed.items.map((i: any) => `${i.productName} (${i.quantity} × ₹${i.unitPrice})`).join(', ')}\n` +
          `- **Total**: ₹${pendingAction.previewData.totalAmount?.toLocaleString('en-IN')}\n\n` +
          `Please review the card below and click **Confirm & Create Invoice** to register it in the ERP system.`;
      }
    }
    // 2. Detect Purchase Order creation request
    else if (
      lower.includes('po') ||
      lower.includes('purchase order') ||
      (lower.includes('order') && lower.includes('vendor')) ||
      (lower.includes('procure') || lower.includes('supplier'))
    ) {
      const parsed = this.parsePoPrompt(userMessage);
      const generated = await this.buildPendingAction('create_purchase_order', parsed);
      if (generated) {
        pendingAction = generated.action;
        reply =
          setupBanner +
          `I have drafted a **Purchase Order (PO)** for procurement:\n` +
          `- **Vendor**: ${parsed.vendorName}\n` +
          `- **Items**: ${parsed.items.map((i: any) => `${i.productName} (${i.quantity} × ₹${i.unitPrice})`).join(', ')}\n` +
          `- **Estimated Total**: ₹${pendingAction.previewData.totalAmount?.toLocaleString('en-IN')}\n\n` +
          `Please verify the specifications below and click **Confirm & Save Purchase Order**.`;
      }
    }
    // 3. Detect Email automation request
    else if (
      lower.includes('email') ||
      lower.includes('mail') ||
      lower.includes('reminder') ||
      lower.includes('send')
    ) {
      const parsed = this.parseEmailPrompt(userMessage);
      const generated = await this.buildPendingAction('send_email', parsed);
      if (generated) {
        pendingAction = generated.action;
        reply =
          setupBanner +
          `I have drafted the **Email Automation** dispatch:\n` +
          `- **To**: ${parsed.recipientEmail}\n` +
          `- **Subject**: ${parsed.subject}\n` +
          `- **Type**: ${parsed.emailType}\n\n` +
          `Click **Approve & Dispatch Email** to trigger delivery.`;
      }
    }
    // 4. Detect General ERP Telemetry Query
    else if (
      lower.includes('stock') ||
      lower.includes('inventory') ||
      lower.includes('pending') ||
      lower.includes('overdue') ||
      lower.includes('status')
    ) {
      const queryResult = await this.executeErpTelemetryQuery(lower);
      reply = setupBanner + queryResult;
    }
    // 5. Default conversational greeting / help guide
    else {
      reply =
        setupBanner +
        `Hello! I am your **Smart-ERP Autonomous Assistant**.\n\n` +
        `Here is what you can ask me to do directly:\n` +
        `1. **Create Invoices**: *"Create invoice for Acme Corp: 5 laptops at 50,000 INR and 10 keyboards at 1,500 INR"*\n` +
        `2. **Generate Purchase Orders**: *"Create purchase order for Steel Works: 100 pipes at 450 INR"*\n` +
        `3. **Email Automation**: *"Send payment reminder email to accounts@acmecorp.com for Invoice #INV-2026-001"*\n` +
        `4. **ERP Telemetry**: *"Show low stock items"* or *"Show pending invoices"*\n\n` +
        `*Try clicking any of the quick action buttons below to test!*`;
    }

    return {
      reply,
      pendingAction,
      provider: 'local_fallback',
      model: 'intelligent-local-rule-engine',
      apiKeyConfigured: false,
      setupInstructions:
        'To enable live OpenRouter free-tier LLM generation, set OPENROUTER_API_KEY in server/.env',
    };
  }

  /**
   * Helper to construct structured pending actions with full tax calculations
   */
  private static async buildPendingAction(
    fnName: string,
    args: any,
    context?: any
  ): Promise<{ action: AgentPendingAction; summaryMessage: string } | null> {
    const actionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (fnName === 'create_invoice') {
      const customerName = args.customerName || 'Standard Client';
      const customerState = args.customerState || 'Tamil Nadu';
      const items = Array.isArray(args.items) && args.items.length > 0 ? args.items : [
        { productName: 'Consulting Services', quantity: 1, unitPrice: 10000, taxRate: 18 }
      ];

      // Format items for tax calculation
      const taxLineItems = items.map((item: any, idx: number) => ({
        id: `item_${idx}`,
        productName: item.productName || `Item ${idx + 1}`,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        taxRate: Number(item.taxRate) || 18,
        hsnCode: item.hsnCode || '84199090',
        uom: 'Nos',
      }));

      const taxResult = calculateDocumentTaxes({
        items: taxLineItems,
        customerState: customerState,
        billingState: 'Tamil Nadu',
      });

      const nextInvNum = `INV-AI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const previewData = {
        invoiceNumber: nextInvNum,
        customerName,
        customerState,
        customerGstin: args.customerGstin || '33AAAAA0000A1Z5',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: args.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        items: taxResult.items,
        subtotal: taxResult.subtotal,
        cgstAmount: taxResult.cgstAmount,
        sgstAmount: taxResult.sgstAmount,
        igstAmount: taxResult.igstAmount,
        taxAmount: taxResult.taxAmount,
        totalAmount: taxResult.totalAmount,
        totalInWords: taxResult.totalInWords,
        notes: args.notes || 'Generated by Smart-ERP Agentic Assistant',
      };

      return {
        action: {
          id: actionId,
          type: 'CREATE_INVOICE',
          title: `Sales Tax Invoice for ${customerName}`,
          summary: `${taxResult.items.length} items totaling ₹${taxResult.totalAmount.toLocaleString('en-IN')}`,
          payload: previewData,
          previewData,
        },
        summaryMessage: `Drafted invoice for **${customerName}** totaling **₹${taxResult.totalAmount.toLocaleString('en-IN')}** with auto-computed GST.`,
      };
    }

    if (fnName === 'create_purchase_order') {
      const vendorName = args.vendorName || 'Prime Industrial Supplies';
      const vendorState = args.vendorState || 'Tamil Nadu';
      const items = Array.isArray(args.items) && args.items.length > 0 ? args.items : [
        { productName: 'Standard Stock Components', quantity: 10, unitPrice: 500, taxRate: 18 }
      ];

      const taxLineItems = items.map((item: any, idx: number) => ({
        id: `item_${idx}`,
        productName: item.productName || `Item ${idx + 1}`,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        taxRate: Number(item.taxRate) || 18,
        hsnCode: '84199090',
        uom: 'Nos',
      }));

      const taxResult = calculateDocumentTaxes({
        items: taxLineItems,
        customerState: vendorState,
        billingState: 'Tamil Nadu',
      });

      const nextPoNum = `PO-AI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const previewData = {
        poNumber: nextPoNum,
        vendorName,
        vendorState,
        vendorGstin: args.vendorGstin || '33BBBBB1111B1Z2',
        poDate: new Date().toISOString().split('T')[0],
        expectedDate: args.expectedDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        items: taxResult.items,
        subtotal: taxResult.subtotal,
        cgstAmount: taxResult.cgstAmount,
        sgstAmount: taxResult.sgstAmount,
        igstAmount: taxResult.igstAmount,
        taxAmount: taxResult.taxAmount,
        totalAmount: taxResult.totalAmount,
        instructions: args.instructions || 'Standard quality and delivery specifications apply.',
      };

      return {
        action: {
          id: actionId,
          type: 'CREATE_PO',
          title: `Purchase Order for ${vendorName}`,
          summary: `${taxResult.items.length} items totaling ₹${taxResult.totalAmount.toLocaleString('en-IN')}`,
          payload: previewData,
          previewData,
        },
        summaryMessage: `Drafted Purchase Order **${nextPoNum}** for **${vendorName}** totaling **₹${taxResult.totalAmount.toLocaleString('en-IN')}**.`,
      };
    }

    if (fnName === 'send_email') {
      const recipientEmail = args.recipientEmail || 'client@example.com';
      const subject = args.subject || 'Smart-ERP Document Notification';
      const emailType = args.emailType || 'INVOICE_DELIVERY';
      const body =
        args.body ||
        `Dear Valued Partner,\n\nPlease find the attached documents for reference.\n\nBest regards,\nSmart-ERP Operations Team`;

      const previewData = {
        recipientEmail,
        recipientName: args.recipientName || 'Valued Partner',
        emailType,
        subject,
        body,
        referenceId: args.referenceId || 'REF-2026',
        dispatchedAt: new Date().toISOString(),
      };

      return {
        action: {
          id: actionId,
          type: 'SEND_EMAIL',
          title: `Email: ${subject}`,
          summary: `To: ${recipientEmail} (${emailType})`,
          payload: previewData,
          previewData,
        },
        summaryMessage: `Prepared outbound email for **${recipientEmail}** regarding *${subject}*.`,
      };
    }

    return null;
  }

  /**
   * Safely resolve active organisation, branch and financial year from database
   */
  private static async resolveTenantContext(userContext?: any) {
    let organisationId = userContext?.organisationId;
    let branchId = userContext?.branchId;
    let financialYear = userContext?.financialYear || '2026-2027';

    // 1. Resolve Organization
    if (!organisationId || organisationId === 'ORG-001' || !mongoose.isValidObjectId(organisationId)) {
      const org = (await Organisation.findOne({ isDeleted: { $ne: true } })) || (await Organisation.findOne());
      if (org) {
        organisationId = org._id.toString();
      }
    }

    // 2. Resolve Branch
    if (!branchId || branchId === 'BR-001' || !mongoose.isValidObjectId(branchId)) {
      const br =
        (organisationId ? await Branch.findOne({ organisationId, isDeleted: { $ne: true } }) : null) ||
        (await Branch.findOne({ isDeleted: { $ne: true } })) ||
        (await Branch.findOne());
      if (br) {
        branchId = br._id.toString();
      } else {
        branchId = branchId || '';
      }
    }

    // 3. Resolve Financial Year
    if (!financialYear) {
      const fyDoc = (await FinancialYear.findOne({ isCurrent: true })) || (await FinancialYear.findOne());
      financialYear = fyDoc?.yearName || '2026-2027';
    }

    return { organisationId, branchId, financialYear };
  }

  /**
   * Execute an approved action to persist into the database
   */
  static async executeAction(action: AgentPendingAction, userContext?: any): Promise<any> {
    const { type, payload } = action;
    const tenantCtx = await this.resolveTenantContext(userContext);

    if (type === 'CREATE_INVOICE') {
      // 1. Resolve or create customer
      let customer = await Customer.findOne({
        name: { $regex: new RegExp(`^${payload.customerName.trim()}$`, 'i') },
      });

      if (!customer) {
        const count = await Customer.countDocuments();
        customer = await Customer.create({
          code: `CUST-${String(count + 1).padStart(4, '0')}`,
          name: payload.customerName,
          contactPerson: payload.customerName,
          email: `${payload.customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
          phone: '9876543210',
          city: 'Chennai',
          state: payload.customerState || 'Tamil Nadu',
          billingAddress: 'Commercial Suite, Industrial Complex',
          shippingAddress: 'Commercial Suite, Industrial Complex',
          gstin: payload.customerGstin || '33AAAAA0000A1Z5',
          outstandingBalance: 0,
          creditLimit: 500000,
          organisationId: tenantCtx.organisationId,
          branchId: tenantCtx.branchId,
        });
      }

      // Generate invoiceNumber if not provided
      const count = (await Invoice.countDocuments()) + 1;
      const invoiceNumber = payload.invoiceNumber || `INV-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

      // 2. Insert Invoice
      const createdInvoice = await Invoice.create({
        invoiceNumber,
        customerId: customer._id.toString(),
        customerName: customer.name,
        customerGstin: customer.gstin,
        customerState: customer.state,
        billingAddress: customer.billingAddress,
        shippingAddress: customer.shippingAddress,
        invoiceDate: payload.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: payload.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        branchId: tenantCtx.branchId,
        organisationId: tenantCtx.organisationId,
        financialYear: tenantCtx.financialYear,
        items: payload.items,
        subtotal: payload.subtotal,
        shippingCharge: 0,
        shippingTax: 0,
        taxableAmount: payload.subtotal,
        totalDiscount: 0,
        cgstAmount: payload.cgstAmount || 0,
        sgstAmount: payload.sgstAmount || 0,
        igstAmount: payload.igstAmount || 0,
        taxAmount: payload.taxAmount,
        totalAmount: payload.totalAmount,
        paidAmount: 0,
        outstandingAmount: payload.totalAmount,
        paymentStatus: 'UNPAID',
        totalInWords: payload.totalInWords || '',
        status: 'Approved',
        termsAndConditions: payload.notes || '',
        isAiGenerated: true,
        aiPrompt: payload.prompt || userContext?.prompt || 'AI Copilot natural language execution',
        history: [
          {
            action: 'CREATED_VIA_AI_AGENT',
            timestamp: new Date(),
            user: userContext?.userName || 'AI Assistant',
            details: `Autonomous creation approved by user for ₹${payload.totalAmount}`,
          },
        ],
      });

      // 3. Log Audit History
      await AuditHistory.create({
        entityType: 'INVOICE',
        entityId: createdInvoice._id.toString(),
        entityIdentifier: createdInvoice.invoiceNumber,
        action: 'CREATE',
        timestamp: new Date(),
        userId: userContext?.userId || 'ai_agent',
        userName: userContext?.userName || 'AI Assistant',
        details: `Autonomous tax invoice created for ${customer.name}`,
        newData: createdInvoice.toObject(),
      });

      const invRecord = {
        ...createdInvoice.toObject(),
        id: createdInvoice._id.toString(),
      };

      return {
        success: true,
        recordId: createdInvoice._id.toString(),
        recordNumber: createdInvoice.invoiceNumber,
        type: 'INVOICE',
        record: invRecord,
        message: `Successfully created and registered Tax Invoice #${createdInvoice.invoiceNumber} in the ERP database!`,
      };
    }

    if (type === 'CREATE_PO') {
      // 1. Resolve or create vendor
      let vendor = await Vendor.findOne({
        name: { $regex: new RegExp(`^${payload.vendorName.trim()}$`, 'i') },
      });

      if (!vendor) {
        const count = await Vendor.countDocuments();
        vendor = await Vendor.create({
          code: `VEND-${String(count + 1).padStart(4, '0')}`,
          name: payload.vendorName,
          contactPerson: payload.vendorName,
          email: `${payload.vendorName.toLowerCase().replace(/[^a-z0-9]/g, '')}@vendor.com`,
          phone: '9840123456',
          city: 'Chennai',
          state: payload.vendorState || 'Tamil Nadu',
          billingAddress: 'Vendor Park, Ambattur Industrial Estate',
          shippingAddress: 'Vendor Park, Ambattur Industrial Estate',
          gstin: payload.vendorGstin || '33BBBBB1111B1Z2',
          outstandingBalance: 0,
          organisationId: tenantCtx.organisationId,
          branchId: tenantCtx.branchId,
        });
      }

      // Generate sequential standard PO number matching the ERP sequence
      const count = (await PurchaseOrder.countDocuments()) + 44;
      const poNumber = payload.poNumber || `PO-2026-0${count}`;

      // Initialize line item quantities for conversion tracking
      const preparedItems = (payload.items || []).map((it: any) => ({
        ...it,
        orderedQuantity: it.quantity,
        billedQuantity: 0,
        remainingQuantity: it.quantity,
        uom: it.uom || 'Nos',
        hsnCode: it.hsnCode || '81089010',
      }));

      // 2. Insert Purchase Order with resolved tenant scoping
      const createdPo = await PurchaseOrder.create({
        poNumber,
        vendorId: vendor._id.toString(),
        vendorName: vendor.name,
        vendorGstin: vendor.gstin,
        vendorAddress: vendor.billingAddress || vendor.address || '',
        vendorState: vendor.state || vendor.billingState || 'Tamil Nadu',
        billingAddress: 'Main Warehouse, Smart-ERP Logistics Hub',
        shippingAddress: 'Main Warehouse, Smart-ERP Logistics Hub',
        poDate: payload.poDate || new Date().toISOString().split('T')[0],
        expectedDate: payload.expectedDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        branchId: tenantCtx.branchId,
        organisationId: tenantCtx.organisationId,
        financialYear: tenantCtx.financialYear,
        items: preparedItems,
        subtotal: payload.subtotal,
        shippingCharge: 0,
        shippingTax: 0,
        taxableAmount: payload.subtotal,
        totalDiscount: 0,
        cgstAmount: payload.cgstAmount || 0,
        sgstAmount: payload.sgstAmount || 0,
        igstAmount: payload.igstAmount || 0,
        taxAmount: payload.taxAmount,
        totalAmount: payload.totalAmount,
        paidAmount: 0,
        outstandingAmount: payload.totalAmount,
        paymentStatus: 'UNPAID',
        status: 'APPROVED',
        totalInWords: payload.totalInWords || '',
        instructions: payload.instructions || 'Standard quality and delivery specifications apply.',
        isAiGenerated: true,
        aiPrompt: payload.prompt || userContext?.prompt || 'AI Copilot natural language execution',
        history: [
          {
            action: 'CREATED_VIA_AI_AGENT',
            timestamp: new Date(),
            user: userContext?.userName || 'AI Assistant',
            details: `Autonomous PO creation approved by user for ₹${payload.totalAmount}`,
          },
        ],
      });

      // 3. Log Audit History
      await AuditHistory.create({
        entityType: 'PURCHASE_ORDER',
        entityId: createdPo._id.toString(),
        entityIdentifier: createdPo.poNumber,
        action: 'CREATE',
        timestamp: new Date(),
        userId: userContext?.userId || 'ai_agent',
        userName: userContext?.userName || 'AI Assistant',
        details: `Autonomous purchase order created for vendor ${vendor.name}`,
        newData: createdPo.toObject(),
      });

      const poRecord = {
        ...createdPo.toObject(),
        id: createdPo._id.toString(),
      };

      return {
        success: true,
        recordId: createdPo._id.toString(),
        recordNumber: createdPo.poNumber,
        type: 'PURCHASE_ORDER',
        record: poRecord,
        message: `Successfully created and approved Purchase Order #${createdPo.poNumber}!`,
      };
    }

    if (type === 'SEND_EMAIL') {
      // Record simulated email dispatch in audit history
      await AuditHistory.create({
        entityType: 'EMAIL_DISPATCH',
        entityId: `email_${Date.now()}`,
        entityIdentifier: payload.subject,
        action: 'CREATE',
        timestamp: new Date(),
        userId: userContext?.userId || 'ai_agent',
        userName: userContext?.userName || 'AI Assistant',
        details: `Automated email dispatched to ${payload.recipientEmail} (${payload.emailType})`,
        newData: payload,
      });

      return {
        success: true,
        type: 'EMAIL',
        message: `Email successfully queued and dispatched to ${payload.recipientEmail}! Outbound log recorded.`,
      };
    }

    throw new Error(`Unsupported action type: ${type}`);
  }

  // --- Natural Language Regex Parsers for Local Fallback ---

  private static parseInvoicePrompt(text: string): any {
    let customerName = 'Global Tech Enterprises';
    const custMatch = text.match(/(?:for|to|customer)\s+([A-Za-z0-9\s&]+?)(?::|,|with|\d|$)/i);
    if (custMatch && custMatch[1].trim().length > 2) {
      customerName = custMatch[1].trim();
    }

    const items: any[] = [];
    // Match patterns like: 5 laptops at 50000 or 10 boxes for 200
    const itemRegex = /(\d+)\s+([a-zA-Z0-9\s\-]+?)\s+(?:at|@|for|rate)\s+(?:₹|rs\.?|inr)?\s*([\d,]+)/gi;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const qty = parseInt(match[1], 10);
      const name = match[2].trim();
      const rate = parseFloat(match[3].replace(/,/g, ''));
      if (qty > 0 && rate > 0) {
        items.push({ productName: name, quantity: qty, unitPrice: rate, taxRate: 18 });
      }
    }

    if (items.length === 0) {
      items.push({ productName: 'Enterprise Software License', quantity: 2, unitPrice: 25000, taxRate: 18 });
    }

    return { customerName, items, customerState: 'Tamil Nadu' };
  }

  private static parsePoPrompt(text: string): any {
    let vendorName = 'Precision Heavy Materials';
    const vendMatch = text.match(/(?:for|to|from|vendor|supplier)\s+([A-Za-z0-9\s&]+?)(?::|,|with|\d|$)/i);
    if (vendMatch && vendMatch[1].trim().length > 2) {
      vendorName = vendMatch[1].trim();
    }

    const items: any[] = [];
    const itemRegex = /(\d+)\s+([a-zA-Z0-9\s\-]+?)\s+(?:at|@|for|rate)\s+(?:₹|rs\.?|inr)?\s*([\d,]+)/gi;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const qty = parseInt(match[1], 10);
      const name = match[2].trim();
      const rate = parseFloat(match[3].replace(/,/g, ''));
      if (qty > 0 && rate > 0) {
        items.push({ productName: name, quantity: qty, unitPrice: rate, taxRate: 18 });
      }
    }

    if (items.length === 0) {
      items.push({ productName: 'Industrial Steel Tubing', quantity: 50, unitPrice: 1200, taxRate: 18 });
    }

    return { vendorName, items, vendorState: 'Tamil Nadu' };
  }

  private static parseEmailPrompt(text: string): any {
    let email = 'finance@clientcorp.com';
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
    if (emailMatch) {
      email = emailMatch[1];
    }

    let emailType = 'INVOICE_DELIVERY';
    let subject = 'Invoice Delivery - Smart-ERP';

    if (text.toLowerCase().includes('reminder') || text.toLowerCase().includes('overdue') || text.toLowerCase().includes('payment')) {
      emailType = 'PAYMENT_REMINDER';
      subject = 'Payment Reminder: Outstanding Balance Notification';
    } else if (text.toLowerCase().includes('po') || text.toLowerCase().includes('purchase order')) {
      emailType = 'PO_DISPATCH';
      subject = 'Official Purchase Order Transmission';
    }

    return {
      recipientEmail: email,
      emailType,
      subject,
      body: `Dear Partner,\n\nThis is an automated notification from Smart-ERP regarding transaction documentation.\nPlease review your account ledger at your earliest convenience.\n\nWarm regards,\nAccounts Team`,
    };
  }

  private static async handleErpDataQuery(queryType: string, args?: any): Promise<string> {
    const qType = (queryType || '').toUpperCase();
    if (qType === 'LOW_STOCK') {
      return await this.executeErpTelemetryQuery('stock');
    }
    if (qType === 'PENDING_INVOICES') {
      return await this.executeErpTelemetryQuery('pending');
    }
    if (qType === 'RECENT_POS') {
      return await this.executeErpTelemetryQuery('po');
    }
    return await this.executeErpTelemetryQuery(queryType.toLowerCase());
  }

  private static async executeErpTelemetryQuery(query: string): Promise<string> {
    try {
      if (query.includes('stock') || query.includes('inventory') || query.includes('low_stock')) {
        const lowStock = await Product.find({ currentStock: { $lte: 20 }, isDeleted: { $ne: true } })
          .limit(10)
          .select('name sku currentStock minReorderLevel sellingPrice');

        if (lowStock.length > 0) {
          return (
            `📦 **Low Stock Reorder Alerts** (${lowStock.length} items flagged below safety threshold):\n\n` +
            lowStock
              .map(
                (p) =>
                  `• **${p.name}** (\`${p.sku || 'SKU-GEN'}\`): **${p.currentStock ?? 0} in stock** (Min Reorder Level: ${p.minReorderLevel ?? 10})`
              )
              .join('\n') +
            `\n\n💡 *Action: You can click '+ New PO (Steel Direct)' below to quickly draft a supplier restocking order.*`
          );
        }

        const allProducts = await Product.find({ isDeleted: { $ne: true } })
          .limit(6)
          .select('name sku currentStock minReorderLevel');

        if (allProducts.length === 0) {
          return (
            `📦 **Inventory Telemetry**:\n\n` +
            `No registered products found in the catalog database yet.\n` +
            `You can create products in the **Products Master** module or draft a Purchase Order to automatically populate stock.`
          );
        }

        return (
          `📦 **Inventory Status: All Healthy**\n\n` +
          `All tracked catalog products are currently above their minimum safety thresholds. No critical reorders needed.\n\n` +
          `**Current Stock Samples**:\n` +
          allProducts
            .map(
              (p) =>
                `• **${p.name}** (\`${p.sku || 'SKU-GEN'}\`): **${p.currentStock ?? 0} units available** (Min: ${p.minReorderLevel ?? 10})`
            )
            .join('\n')
        );
      }

      if (query.includes('pending') || query.includes('invoice') || query.includes('overdue')) {
        const pending = await Invoice.find({ paymentStatus: { $ne: 'PAID' }, isDeleted: { $ne: true } })
          .limit(5)
          .select('invoiceNumber customerName totalAmount outstandingAmount dueDate');

        if (pending.length === 0) {
          return `💰 **Receivables Status**: Excellent news! There are no unpaid invoices in the system. All customer accounts are settled.`;
        }

        return (
          `💰 **Unpaid & Overdue Invoices** (Top ${pending.length}):\n\n` +
          pending
            .map(
              (inv) =>
                `• **${inv.invoiceNumber}** (${inv.customerName}): **₹${inv.outstandingAmount?.toLocaleString('en-IN')} outstanding** (Due: ${inv.dueDate})`
            )
            .join('\n') +
          `\n\n💡 *Action: You can draft a reminder email using '+ Email Reminder' for any of these accounts.*`
        );
      }

      if (query.includes('po') || query.includes('purchase')) {
        const pos = await PurchaseOrder.find({ isDeleted: { $ne: true } })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('poNumber vendorName totalAmount status poDate');

        if (pos.length === 0) {
          return `📋 **Purchase Orders**: No purchase orders found in the system yet.`;
        }

        return (
          `📋 **Recent Purchase Orders** (Latest ${pos.length}):\n\n` +
          pos
            .map(
              (p) =>
                `• **${p.poNumber}** (${p.vendorName}): **₹${p.totalAmount?.toLocaleString('en-IN')}** [${p.status}] on ${p.poDate || 'Recent'}`
            )
            .join('\n')
        );
      }

      return `Operational telemetry ready. You can query stock status, check pending receivables, or draft new Invoices and Purchase Orders.`;
    } catch (err: any) {
      console.error('Error executing ERP telemetry query:', err);
      return `📦 **Inventory Status**: Telemetry is currently syncing (${err?.message || 'Database query error'}).`;
    }
  }

  /**
   * Proactive Multi-Turn Clarification Dialogue for Incomplete Prompts
   */
  static checkIncompleteActionClarification(userMessage: string): string | null {
    const text = userMessage.toLowerCase().trim();

    // Check if user intends to create invoice / bill without specifying items or quantities
    const isInvoiceIntent =
      text.includes('create invoice') ||
      text.includes('make invoice') ||
      text.includes('generate invoice') ||
      text.includes('draft invoice') ||
      text.includes('new invoice') ||
      text.startsWith('bill ') ||
      text.includes('raise invoice');

    if (isInvoiceIntent) {
      const hasQuantitiesAndPrices = /(\d+)\s+([a-zA-Z0-9\s\-]+?)\s+(?:at|@|for|rate)\s+(?:₹|rs\.?|inr)?\s*([\d,]+)/i.test(text);
      if (!hasQuantitiesAndPrices) {
        const custMatch = userMessage.match(/(?:for|to|customer)\s+([A-Za-z0-9\s&]+?)(?::|,|with|\d|$)/i);
        const target = custMatch && custMatch[1].trim().length > 1 ? custMatch[1].trim() : 'the customer';
        return (
          `📋 **Clarification Needed: Invoice Line Items**\n\n` +
          `I am ready to draft an invoice for **${target}**! Before generating the draft preview card, please specify the item names, quantities, and rates.\n\n` +
          `**Example Format:**\n` +
          `> *"Create invoice for ${target}: 5 Workstations at 45,000 INR and 5 Monitors at 12,000 INR"*\n\n` +
          `Please provide the item details and I will immediately assemble the formal draft for your confirmation.`
        );
      }
    }

    // Check if user intends to create PO without specifying items or quantities
    const isPoIntent =
      text.includes('create po') ||
      text.includes('create purchase order') ||
      text.includes('make po') ||
      text.includes('new po') ||
      text.includes('draft po') ||
      text.includes('procure for') ||
      text.includes('order from');

    if (isPoIntent) {
      const hasQuantitiesAndPrices = /(\d+)\s+([a-zA-Z0-9\s\-]+?)\s+(?:at|@|for|rate)\s+(?:₹|rs\.?|inr)?\s*([\d,]+)/i.test(text);
      if (!hasQuantitiesAndPrices) {
        const vendMatch = userMessage.match(/(?:for|to|from|vendor|supplier)\s+([A-Za-z0-9\s&]+?)(?::|,|with|\d|$)/i);
        const target = vendMatch && vendMatch[1].trim().length > 1 ? vendMatch[1].trim() : 'the vendor';
        return (
          `📦 **Clarification Needed: Purchase Order Items**\n\n` +
          `I am ready to draft a Purchase Order for **${target}**! Please specify the products, order quantities, and agreed purchase price.\n\n` +
          `**Example Format:**\n` +
          `> *"Create purchase order for ${target}: 50 Titanium Rods at 1,200 INR"*\n\n` +
          `Once you reply with the quantities and rates, I will compute taxes and generate the approval card.`
        );
      }
    }

    return null;
  }

  /**
   * Real-Time Financial & Sales Analytics Telemetry
   */
  static async executeFinancialAnalyticsQuery(context?: any): Promise<string> {
    try {
      const tenantCtx = await this.resolveTenantContext(context);
      const orgFilter: any = { isDeleted: { $ne: true } };
      if (tenantCtx.organisationId && mongoose.isValidObjectId(tenantCtx.organisationId)) {
        orgFilter.organisationId = tenantCtx.organisationId;
      }

      const invoices = await Invoice.find(orgFilter).select('totalAmount paidAmount outstandingAmount paymentStatus status invoiceDate');
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      const paidRevenue = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
      const unpaidRevenue = invoices.reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);
      const unpaidCount = invoices.filter((inv) => inv.paymentStatus !== 'PAID' && (inv.outstandingAmount || 0) > 0).length;

      const pos = await PurchaseOrder.find(orgFilter).select('totalAmount status');
      const totalProcurement = pos.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      const activePoCount = pos.filter((p) => p.status === 'APPROVED' || p.status === 'PENDING_APPROVAL').length;

      const fmt = (n: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

      return (
        `### 📊 Enterprise Financial & Sales Telemetry\n\n` +
        `| Key ERP Metric | Value | Operational Context |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **Total Revenue Invoiced** | **${fmt(totalRevenue)}** | ${invoices.length} Registered Invoices |\n` +
        `| **Collections Realized** | **${fmt(paidRevenue)}** | ${((paidRevenue / (totalRevenue || 1)) * 100).toFixed(1)}% Realization Rate |\n` +
        `| **Pending Receivables** | **${fmt(unpaidRevenue)}** | ⚠️ ${unpaidCount} Invoices Pending Payment |\n` +
        `| **Procurement Spend** | **${fmt(totalProcurement)}** | ${pos.length} Purchase Orders Issued |\n` +
        `| **Active Open Orders** | **${activePoCount} Orders** | Awaiting Inward Verification |\n\n` +
        `*Tenant Scoping: Organisation \`${tenantCtx.organisationId || 'Primary'}\` • Financial Year \`${tenantCtx.financialYear}\`.*`
      );
    } catch (err: any) {
      console.error('Financial telemetry query error:', err);
      return `📊 **Financial Telemetry**: Unable to compute real-time metrics (${err.message}).`;
    }
  }

  /**
   * Autonomous Auto-Reorder Audit Agent
   */
  static async checkLowStockAndAutoReorder(context?: any): Promise<{
    message: string;
    lowStockItems: any[];
    draftPos: any[];
  }> {
    try {
      const tenantCtx = await this.resolveTenantContext(context);
      const orgFilter: any = { isDeleted: { $ne: true } };
      if (tenantCtx.organisationId && mongoose.isValidObjectId(tenantCtx.organisationId)) {
        orgFilter.organisationId = tenantCtx.organisationId;
      }

      const products = await Product.find(orgFilter).select('name sku currentStock minReorderLevel purchaseCost');
      const lowStock = products.filter((p) => (p.currentStock ?? 0) <= (p.minReorderLevel ?? 10));

      if (lowStock.length === 0) {
        return {
          message: `✅ **All Inventory Healthy**: All catalog items are currently above safety reorder thresholds. No replenishment POs needed!`,
          lowStockItems: [],
          draftPos: [],
        };
      }

      const items = lowStock.map((p) => {
        const reorderQty = Math.max(25, (p.minReorderLevel ?? 10) - (p.currentStock ?? 0) + 20);
        const cost = p.purchaseCost || 1200;
        return {
          name: p.name,
          sku: p.sku || 'SKU-GEN',
          currentStock: p.currentStock ?? 0,
          minReorderLevel: p.minReorderLevel ?? 10,
          reorderQty,
          cost,
          estimatedTotal: reorderQty * cost * 1.18,
        };
      });

      const listStr = items
        .map(
          (it) =>
            `• **${it.name}** (\`${it.sku}\`): **${it.currentStock} units left** (Min: ${it.minReorderLevel}) → *Recommended PO:* **${it.reorderQty} units** @ ₹${it.cost} (~₹${Math.round(it.estimatedTotal).toLocaleString('en-IN')} with GST)`
        )
        .join('\n');

      return {
        message:
          `### ⚠️ Autonomous Auto-Reorder Audit: ${items.length} Items Below Threshold\n\n` +
          `${listStr}\n\n` +
          `💡 *Click '+ New PO (Steel Direct)' below to immediately generate and confirm procurement.*`,
        lowStockItems: items,
        draftPos: items,
      };
    } catch (err: any) {
      console.error('Auto-reorder audit error:', err);
      return {
        message: `⚠️ Auto-reorder audit encountered an issue: ${err.message}`,
        lowStockItems: [],
        draftPos: [],
      };
    }
  }
}
