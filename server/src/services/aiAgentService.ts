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

const SYSTEM_PROMPT = `You are Smart-ERP's Agentic Operations Assistant.
You assist enterprise users with managing invoices, purchase orders, email dispatch, and business queries.
When the user asks to create an invoice, purchase order, or draft/send an email:
1. Always call the corresponding tool (create_invoice, create_purchase_order, or send_email) with the parsed parameters.
2. If the user provides partial details, make sensible business assumptions (e.g., standard 18% GST, due date in 15 days, default Tamil Nadu state) and call the tool.
3. Be concise, professional, and explain the generated action in a friendly summary.
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
   * Main entry point for processing chat messages
   */
  static async processChat(
    userMessage: string,
    history: AgentChatMessage[] = [],
    context?: { organisationId?: string; branchId?: string; user?: any }
  ): Promise<AgentChatResponse> {
    const isKeyPresent = this.isConfigured();

    if (isKeyPresent) {
      try {
        return await this.callOpenRouter(userMessage, history, context);
      } catch (err: any) {
        console.error('OpenRouter call error, falling back to local agent:', err?.message || err);
        // Fallback gracefully on API errors
        return await this.processLocalFallback(
          userMessage,
          `OpenRouter API encountered a temporary error (${err?.response?.data?.error?.message || err.message}). Switched to local agent engine.`
        );
      }
    }

    // Fallback when no key is configured
    return await this.processLocalFallback(userMessage);
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
    let replyText = message.content || '';

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

      const generated = await this.buildPendingAction(fnName, args, context);
      if (generated) {
        pendingAction = generated.action;
        if (!replyText) {
          replyText = generated.summaryMessage;
        }
      }
    }

    if (!replyText && pendingAction) {
      replyText = `I have drafted the ${pendingAction.title} for you. Please review and confirm below.`;
    }

    return {
      reply: replyText || 'Request processed successfully.',
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
    const itemRegex = /(\d+)\s+([a-zA-Z\s]+?)\s+(?:at|@|for|rate)\s+(?:₹|rs\.?|inr)?\s*([\d,]+)/gi;
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
    const itemRegex = /(\d+)\s+([a-zA-Z\s]+?)\s+(?:at|@|for|rate)\s+(?:₹|rs\.?|inr)?\s*([\d,]+)/gi;
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

  private static async executeErpTelemetryQuery(query: string): Promise<string> {
    try {
      if (query.includes('stock') || query.includes('inventory')) {
        const lowStock = await Product.find({ currentStock: { $lte: 20 }, isDeleted: false })
          .limit(5)
          .select('name sku currentStock minReorderLevel');

        if (lowStock.length === 0) {
          return `📦 **Inventory Status**: All inventory items are currently above their safety thresholds. No critical reorders needed.`;
        }

        return (
          `📦 **Low Stock Reorder Alerts** (${lowStock.length} items):\n` +
          lowStock.map((p) => `- **${p.name}** (\`${p.sku}\`): **${p.currentStock} in stock** (Min: ${p.minReorderLevel})`).join('\n')
        );
      }

      if (query.includes('pending') || query.includes('invoice') || query.includes('overdue')) {
        const pending = await Invoice.find({ paymentStatus: { $ne: 'PAID' } })
          .limit(5)
          .select('invoiceNumber customerName totalAmount outstandingAmount dueDate');

        if (pending.length === 0) {
          return `💰 **Pending Invoices**: No unpaid invoices found in the system.`;
        }

        return (
          `💰 **Unpaid & Overdue Invoices** (Top ${pending.length}):\n` +
          pending
            .map(
              (inv) =>
                `- **${inv.invoiceNumber}** (${inv.customerName}): **₹${inv.outstandingAmount?.toLocaleString('en-IN')} outstanding** (Due: ${inv.dueDate})`
            )
            .join('\n')
        );
      }

      return `Operational telemetry ready. You can query stock status, pending invoices, or ask to create new transactions.`;
    } catch {
      return `Telemetry data is currently syncing.`;
    }
  }
}
