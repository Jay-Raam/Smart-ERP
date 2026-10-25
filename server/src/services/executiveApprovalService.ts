import crypto from 'crypto';

/**
 * WhatsApp Executive Approval Webhook Engine with Cryptographic Verification (HMAC-SHA256)
 * Implements multi-tier financial threshold routing, anti-replay protection,
 * and mobile WhatsApp interactive authorization.
 */

export type ApprovalTier = 'BRANCH_MANAGER' | 'FINANCE_CONTROLLER' | 'MANAGING_DIRECTOR';
export type ApprovalAction = 'APPROVE' | 'REJECT';
export type DocumentType = 'PURCHASE_ORDER' | 'INVOICE';

export interface ITierEvaluationResult {
  documentType: DocumentType;
  documentNumber: string;
  amount: number;
  requiredTier: ApprovalTier;
  approverRoleTitle: string;
  requiresExecutiveBoard: boolean;
  isAutoApproved: boolean;
}

export interface IApprovalTokenData {
  documentType: DocumentType;
  documentId: string;
  documentNumber: string;
  action: ApprovalAction;
  nonce: string;
  timestamp: number;
}

export interface IWebhookApprovalPayload {
  documentType: DocumentType;
  documentId: string;
  documentNumber: string;
  action: ApprovalAction;
  approverName: string;
  approverPhone?: string;
  comments?: string;
  nonce: string;
  timestamp: number;
  signature: string;
}

export interface IApprovalAuditRecord {
  action: ApprovalAction;
  approverName: string;
  approverPhone?: string;
  comments?: string;
  processedAt: string;
  signatureDigest: string;
  tier: ApprovalTier;
}

export interface IApprovalExecutionResult {
  success: boolean;
  documentType: DocumentType;
  documentNumber: string;
  newStatus: 'Approved' | 'Rejected';
  auditRecord?: IApprovalAuditRecord;
  error?: string;
}

export class ExecutiveApprovalService {
  private static readonly DEFAULT_SECRET = process.env.APPROVAL_HMAC_SECRET || 'smart-erp-enterprise-approval-secret-key-2026';
  
  // Anti-Replay: Set of consumed nonces (in-memory cache for replay detection)
  private static readonly consumedNonces = new Set<string>();

  // Thresholds in INR
  public static readonly TIER_1_MAX = 50000;   // Up to ₹50,000: Branch Manager
  public static readonly TIER_2_MAX = 500000;  // ₹50,001 - ₹5,00,00: Finance Controller
  // Above ₹5,00,000: Managing Director / Executive Board

  /**
   * Determine statutory approval tier based on financial exposure
   */
  public static evaluateThreshold(
    amount: number,
    documentType: DocumentType,
    documentNumber: string
  ): ITierEvaluationResult {
    const val = Math.max(0, amount);

    let requiredTier: ApprovalTier;
    let approverRoleTitle: string;
    let requiresExecutiveBoard = false;
    let isAutoApproved = false;

    if (val <= this.TIER_1_MAX) {
      requiredTier = 'BRANCH_MANAGER';
      approverRoleTitle = 'Branch Operations Manager';
      // Low risk operational orders under 10,000 can be auto-approved in standard branch policies
      if (val < 10000) {
        isAutoApproved = true;
      }
    } else if (val <= this.TIER_2_MAX) {
      requiredTier = 'FINANCE_CONTROLLER';
      approverRoleTitle = 'Head of Finance & Corporate Controller';
    } else {
      requiredTier = 'MANAGING_DIRECTOR';
      approverRoleTitle = 'Managing Director / Executive Board';
      requiresExecutiveBoard = true;
    }

    return {
      documentType,
      documentNumber,
      amount: val,
      requiredTier,
      approverRoleTitle,
      requiresExecutiveBoard,
      isAutoApproved
    };
  }

  /**
   * Generate canonical signing string from token data
   */
  public static buildCanonicalString(tokenData: IApprovalTokenData): string {
    return `${tokenData.documentType}:${tokenData.documentId}:${tokenData.documentNumber}:${tokenData.action}:${tokenData.nonce}:${tokenData.timestamp}`;
  }

  /**
   * Compute HMAC-SHA256 signature
   */
  public static generateHmacSignature(
    tokenData: IApprovalTokenData,
    secret: string = this.DEFAULT_SECRET
  ): string {
    const canonical = this.buildCanonicalString(tokenData);
    return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
  }

  /**
   * Constant-time comparison to protect against timing attacks
   */
  public static verifyHmacSignature(
    tokenData: IApprovalTokenData,
    signature: string,
    secret: string = this.DEFAULT_SECRET
  ): boolean {
    if (!signature) return false;
    const expectedSignature = this.generateHmacSignature(tokenData, secret);
    
    try {
      const sigBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      
      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Formats an interactive WhatsApp notification message and signed approval action links
   */
  public static generateWhatsAppInteractiveNotification(params: {
    documentType: DocumentType;
    documentId: string;
    documentNumber: string;
    amount: number;
    vendorOrCustomerName: string;
    executivePhone: string;
    callbackBaseUrl: string;
    secret?: string;
  }): {
    messageText: string;
    approveUrl: string;
    rejectUrl: string;
    waMeDeepLink: string;
    tierInfo: ITierEvaluationResult;
  } {
    const tierInfo = this.evaluateThreshold(params.amount, params.documentType, params.documentNumber);
    const nonceApprove = crypto.randomBytes(8).toString('hex');
    const nonceReject = crypto.randomBytes(8).toString('hex');
    const now = Date.now();

    const approveToken: IApprovalTokenData = {
      documentType: params.documentType,
      documentId: params.documentId,
      documentNumber: params.documentNumber,
      action: 'APPROVE',
      nonce: nonceApprove,
      timestamp: now
    };
    const approveSig = this.generateHmacSignature(approveToken, params.secret);

    const rejectToken: IApprovalTokenData = {
      documentType: params.documentType,
      documentId: params.documentId,
      documentNumber: params.documentNumber,
      action: 'REJECT',
      nonce: nonceReject,
      timestamp: now
    };
    const rejectSig = this.generateHmacSignature(rejectToken, params.secret);

    const approveUrl = `${params.callbackBaseUrl}/api/erp/approvals/whatsapp-webhook?docType=${params.documentType}&docId=${params.documentId}&docNum=${params.documentNumber}&action=APPROVE&nonce=${nonceApprove}&ts=${now}&sig=${approveSig}`;
    const rejectUrl = `${params.callbackBaseUrl}/api/erp/approvals/whatsapp-webhook?docType=${params.documentType}&docId=${params.documentId}&docNum=${params.documentNumber}&action=REJECT&nonce=${nonceReject}&ts=${now}&sig=${rejectSig}`;

    const formattedAmount = `₹${params.amount.toLocaleString('en-IN')}`;
    const messageText = 
      `*Smart-ERP Executive Approval Alert*\n\n` +
      `*Document:* ${params.documentType === 'PURCHASE_ORDER' ? 'Purchase Order' : 'Tax Invoice'} #${params.documentNumber}\n` +
      `*Entity:* ${params.vendorOrCustomerName}\n` +
      `*Amount:* ${formattedAmount}\n` +
      `*Authorization Level:* ${tierInfo.approverRoleTitle}\n\n` +
      `Please review and tap one of the secure action links below:\n` +
      `✅ *Approve:* ${approveUrl}\n` +
      `❌ *Reject:* ${rejectUrl}\n\n` +
      `_This request is cryptographically signed (HMAC-SHA256) and expires in 5 minutes._`;

    const cleanPhone = params.executivePhone.replace(/[^0-9]/g, '');
    const waMeDeepLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    return {
      messageText,
      approveUrl,
      rejectUrl,
      waMeDeepLink,
      tierInfo
    };
  }

  /**
   * Process and cryptographically verify incoming Webhook Approval Decision
   */
  public static processWebhookApproval(
    payload: IWebhookApprovalPayload,
    secret: string = this.DEFAULT_SECRET
  ): IApprovalExecutionResult {
    // 1. Mandatory payload check
    if (!payload.documentType || !payload.documentId || !payload.documentNumber || !payload.action || !payload.signature || !payload.nonce) {
      return {
        success: false,
        documentType: payload.documentType,
        documentNumber: payload.documentNumber,
        newStatus: 'Rejected',
        error: 'INVALID_PAYLOAD: Missing required signature or token fields.'
      };
    }

    // 2. Anti-Replay: Check if nonce was already consumed
    if (this.consumedNonces.has(payload.nonce)) {
      return {
        success: false,
        documentType: payload.documentType,
        documentNumber: payload.documentNumber,
        newStatus: 'Rejected',
        error: 'REPLAY_ATTACK_DETECTED: This authorization token has already been executed.'
      };
    }

    // 3. Timestamp Drifting / Expiration (Strict 300 seconds / 5 minutes window)
    const now = Date.now();
    const timeDrift = Math.abs(now - payload.timestamp);
    if (timeDrift > 300_000) {
      return {
        success: false,
        documentType: payload.documentType,
        documentNumber: payload.documentNumber,
        newStatus: 'Rejected',
        error: 'TOKEN_EXPIRED: Approval webhook token has expired (exceeded 300s window).'
      };
    }

    // 4. Verify Cryptographic Signature
    const tokenData: IApprovalTokenData = {
      documentType: payload.documentType,
      documentId: payload.documentId,
      documentNumber: payload.documentNumber,
      action: payload.action,
      nonce: payload.nonce,
      timestamp: payload.timestamp
    };

    const isSigValid = this.verifyHmacSignature(tokenData, payload.signature, secret);
    if (!isSigValid) {
      return {
        success: false,
        documentType: payload.documentType,
        documentNumber: payload.documentNumber,
        newStatus: 'Rejected',
        error: 'CRYPTOGRAPHIC_VERIFICATION_FAILED: Signature hash mismatch.'
      };
    }

    // 5. Consume Nonce
    this.consumedNonces.add(payload.nonce);

    // 6. Map to Target Document Status
    const newStatus = payload.action === 'APPROVE' ? 'Approved' : 'Rejected';

    const auditRecord: IApprovalAuditRecord = {
      action: payload.action,
      approverName: payload.approverName || 'Executive Reviewer',
      approverPhone: payload.approverPhone,
      comments: payload.comments || (payload.action === 'APPROVE' ? 'Approved via WhatsApp Webhook' : 'Rejected via WhatsApp Webhook'),
      processedAt: new Date().toISOString(),
      signatureDigest: payload.signature.slice(0, 16) + '...',
      tier: 'FINANCE_CONTROLLER' // default tier representation in audit
    };

    return {
      success: true,
      documentType: payload.documentType,
      documentNumber: payload.documentNumber,
      newStatus,
      auditRecord
    };
  }

  /**
   * Helper to clear consumed nonces (primarily for test environments)
   */
  public static clearNonceCache(): void {
    this.consumedNonces.clear();
  }
}
