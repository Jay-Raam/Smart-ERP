import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExecutiveApprovalService,
  IApprovalTokenData,
  IWebhookApprovalPayload
} from './executiveApprovalService';

describe('ExecutiveApprovalService (WhatsApp Webhook & HMAC-SHA256 Verification)', () => {
  beforeEach(() => {
    ExecutiveApprovalService.clearNonceCache();
  });

  describe('Multi-Tier Financial Threshold Routing', () => {
    it('should route sub-₹50,000 orders to Branch Operations Manager', () => {
      const res = ExecutiveApprovalService.evaluateThreshold(35000, 'PURCHASE_ORDER', 'PO-2026-001');
      expect(res.requiredTier).toBe('BRANCH_MANAGER');
      expect(res.approverRoleTitle).toBe('Branch Operations Manager');
      expect(res.requiresExecutiveBoard).toBe(false);
    });

    it('should route ₹50,001 to ₹5,00,000 orders to Finance Controller', () => {
      const res = ExecutiveApprovalService.evaluateThreshold(185000, 'PURCHASE_ORDER', 'PO-2026-002');
      expect(res.requiredTier).toBe('FINANCE_CONTROLLER');
      expect(res.approverRoleTitle).toBe('Head of Finance & Corporate Controller');
      expect(res.requiresExecutiveBoard).toBe(false);
    });

    it('should route orders above ₹5,00,000 to Managing Director / Executive Board', () => {
      const res = ExecutiveApprovalService.evaluateThreshold(1250000, 'PURCHASE_ORDER', 'PO-2026-003');
      expect(res.requiredTier).toBe('MANAGING_DIRECTOR');
      expect(res.requiresExecutiveBoard).toBe(true);
    });
  });

  describe('Cryptographic Signature Generation & Constant-Time Verification', () => {
    const sampleToken: IApprovalTokenData = {
      documentType: 'PURCHASE_ORDER',
      documentId: 'PO_OBJ_991',
      documentNumber: 'PO-2026-991',
      action: 'APPROVE',
      nonce: 'nonce_abc_123',
      timestamp: 1729860000000
    };

    it('should generate valid 64-character hex HMAC-SHA256 signature', () => {
      const sig = ExecutiveApprovalService.generateHmacSignature(sampleToken, 'test-secret');
      expect(sig).toMatch(/^[a-f0-9]{64}$/i);
    });

    it('should verify matching HMAC-SHA256 signatures successfully', () => {
      const sig = ExecutiveApprovalService.generateHmacSignature(sampleToken, 'test-secret');
      const isValid = ExecutiveApprovalService.verifyHmacSignature(sampleToken, sig, 'test-secret');
      expect(isValid).toBe(true);
    });

    it('should reject mismatched or tampered signatures', () => {
      const sig = ExecutiveApprovalService.generateHmacSignature(sampleToken, 'test-secret');
      const tamperedSig = sig.slice(0, -2) + '00';
      const isValid = ExecutiveApprovalService.verifyHmacSignature(sampleToken, tamperedSig, 'test-secret');
      expect(isValid).toBe(false);
    });

    it('should reject signatures generated with different secret keys', () => {
      const sig = ExecutiveApprovalService.generateHmacSignature(sampleToken, 'secret-key-A');
      const isValid = ExecutiveApprovalService.verifyHmacSignature(sampleToken, sig, 'secret-key-B');
      expect(isValid).toBe(false);
    });
  });

  describe('Anti-Replay Attack Protection & Timestamp Drift', () => {
    it('should reject webhook requests with timestamps older than 300 seconds (5 minutes)', () => {
      const expiredTimestamp = Date.now() - 350_000; // 350 seconds ago
      const token: IApprovalTokenData = {
        documentType: 'PURCHASE_ORDER',
        documentId: 'PO_001',
        documentNumber: 'PO-2026-001',
        action: 'APPROVE',
        nonce: 'nonce_time_test',
        timestamp: expiredTimestamp
      };
      const sig = ExecutiveApprovalService.generateHmacSignature(token, 'test-secret');

      const payload: IWebhookApprovalPayload = {
        ...token,
        approverName: 'Ramanathan CFO',
        signature: sig
      };

      const result = ExecutiveApprovalService.processWebhookApproval(payload, 'test-secret');
      expect(result.success).toBe(false);
      expect(result.error).toContain('TOKEN_EXPIRED');
    });

    it('should strictly reject replayed nonces on duplicate webhook arrival', () => {
      const validTimestamp = Date.now();
      const token: IApprovalTokenData = {
        documentType: 'PURCHASE_ORDER',
        documentId: 'PO_002',
        documentNumber: 'PO-2026-002',
        action: 'APPROVE',
        nonce: 'single_use_nonce_777',
        timestamp: validTimestamp
      };
      const sig = ExecutiveApprovalService.generateHmacSignature(token, 'test-secret');

      const payload: IWebhookApprovalPayload = {
        ...token,
        approverName: 'Director Ramanathan',
        signature: sig
      };

      // 1. First execution -> Must succeed
      const firstResult = ExecutiveApprovalService.processWebhookApproval(payload, 'test-secret');
      expect(firstResult.success).toBe(true);
      expect(firstResult.newStatus).toBe('Approved');

      // 2. Second execution with same nonce -> Must be blocked as replay attack
      const secondResult = ExecutiveApprovalService.processWebhookApproval(payload, 'test-secret');
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('REPLAY_ATTACK_DETECTED');
    });
  });

  describe('WhatsApp Interactive Notification Formatting', () => {
    it('should format interactive message with signed URLs and wa.me deep links', () => {
      const result = ExecutiveApprovalService.generateWhatsAppInteractiveNotification({
        documentType: 'PURCHASE_ORDER',
        documentId: 'PO_888',
        documentNumber: 'PO-2026-888',
        amount: 320000,
        vendorOrCustomerName: 'Tata Precision Alloys',
        executivePhone: '+91 98400 12345',
        callbackBaseUrl: 'https://erp.smartenterprises.in',
        secret: 'test-secret'
      });

      expect(result.messageText).toContain('PO-2026-888');
      expect(result.messageText).toContain('Tata Precision Alloys');
      expect(result.messageText).toContain('₹3,20,000');
      expect(result.messageText).toContain('Head of Finance & Corporate Controller');
      expect(result.approveUrl).toContain('action=APPROVE');
      expect(result.rejectUrl).toContain('action=REJECT');
      expect(result.waMeDeepLink).toContain('https://wa.me/919840012345');
    });
  });

  describe('State Machine & Audit Trail Integration', () => {
    it('should transition document status to Rejected and log audit reason', () => {
      const token: IApprovalTokenData = {
        documentType: 'PURCHASE_ORDER',
        documentId: 'PO_REJ_01',
        documentNumber: 'PO-2026-REJ',
        action: 'REJECT',
        nonce: 'nonce_rej_99',
        timestamp: Date.now()
      };
      const sig = ExecutiveApprovalService.generateHmacSignature(token, 'test-secret');

      const payload: IWebhookApprovalPayload = {
        ...token,
        approverName: 'Executive Director Senthil',
        approverPhone: '+919841099999',
        comments: 'Unit price exceeds contracted Q3 master rate',
        signature: sig
      };

      const result = ExecutiveApprovalService.processWebhookApproval(payload, 'test-secret');
      expect(result.success).toBe(true);
      expect(result.newStatus).toBe('Rejected');
      expect(result.auditRecord).toBeDefined();
      expect(result.auditRecord?.action).toBe('REJECT');
      expect(result.auditRecord?.comments).toContain('Unit price exceeds');
      expect(result.auditRecord?.signatureDigest).toBeDefined();
    });
  });
});
