import { Router, Request, Response } from 'express';
import { AiAgentService } from '../services/aiAgentService';
import { getRequestUser } from '../utils/auditLogger';
import { sanitizeAiInput } from '../middleware/securitySanitizer';

export const aiRouter = Router();

/**
 * GET /api/ai/status
 * Returns current AI service operational status and OpenRouter key configuration
 */
aiRouter.get('/status', (req: Request, res: Response) => {
  const isConfigured = AiAgentService.isConfigured();
  const model = AiAgentService.getModel();

  return res.json({
    status: 'ACTIVE',
    configured: isConfigured,
    model: model,
    provider: isConfigured ? 'openrouter' : 'local_fallback',
    keyHelp: {
      configFile: 'server/.env',
      envVar: 'OPENROUTER_API_KEY',
      freeTierUrl: 'https://openrouter.ai/keys',
      recommendedModel: 'openrouter/free',
    },
    capabilities: [
      'Autonomous Sales Invoice Generation & Tax Calculation',
      'Purchase Order (PO) Procurement Creation',
      'Automated Email Dispatch & Reminder Drafting',
      'Real-time Inventory & Financial Ledger Telemetry',
      'Financial & Sales Analytics Telemetry',
      'Self-Healing Low-Stock Auto-Reorder Audit',
    ],
  });
});

/**
 * GET /api/ai/auto-reorder-audit
 * Runs autonomous low-stock audit and returns procurement suggestions
 */
aiRouter.get('/auto-reorder-audit', async (req: Request, res: Response) => {
  try {
    const user = await getRequestUser(req);
    const context = {
      userId: user.userId,
      userName: user.userName,
      organisationId: (req.query.organisationId as string) || (req as any).organisationId,
      branchId: (req.query.branchId as string) || (req as any).branchId,
      user,
    };

    const auditResult = await AiAgentService.checkLowStockAndAutoReorder(context);
    return res.json(auditResult);
  } catch (error: any) {
    console.error('Auto-reorder audit route error:', error);
    return res.status(500).json({
      error: 'Failed to run auto-reorder audit.',
      details: error.message,
    });
  }
});

/**
 * POST /api/ai/chat
 * Main conversational assistant endpoint with strict input sanitization
 */
aiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    // Security Guardrail: Check for prompt injection or system credential leakage
    const securityCheck = sanitizeAiInput(message);
    if (!securityCheck.isSafe) {
      return res.status(400).json({
        reply: `🔒 **Security Refusal**: ${securityCheck.reason || 'Restricted administrative or exfiltration query detected.'}`,
        isBlocked: true,
      });
    }

    const user = await getRequestUser(req);
    const bodyContext = req.body.context || {};
    const context = {
      userId: user.userId,
      userName: user.userName,
      organisationId: bodyContext.organisationId || req.body.organisationId || (req as any).organisationId,
      branchId: bodyContext.branchId || req.body.branchId || (req as any).branchId,
      financialYear: bodyContext.financialYear || req.body.financialYear || (req as any).financialYear,
      user,
    };

    const response = await AiAgentService.processChat(message, history || [], context);
    return res.json(response);
  } catch (error: any) {
    console.error('AI chat endpoint error:', error);
    return res.status(500).json({
      error: 'An internal error occurred while processing the AI request.',
      details: error.message,
    });
  }
});

/**
 * POST /api/ai/execute-action
 * Executes an approved pending action (Invoice creation, PO creation, Email dispatch)
 */
aiRouter.post('/execute-action', async (req: Request, res: Response) => {
  try {
    const { action } = req.body;

    if (!action || !action.type || !action.payload) {
      return res.status(400).json({ error: 'Valid action payload is required.' });
    }

    const user = await getRequestUser(req);
    const bodyContext = req.body.context || {};
    const context = {
      userId: user.userId,
      userName: user.userName,
      organisationId: bodyContext.organisationId || req.body.organisationId || (req as any).organisationId,
      branchId: bodyContext.branchId || req.body.branchId || (req as any).branchId,
      financialYear: bodyContext.financialYear || req.body.financialYear || (req as any).financialYear,
      user,
      clientIp: req.ip,
    };

    const result = await AiAgentService.executeAction(action, context);
    return res.json(result);
  } catch (error: any) {
    console.error('Execute AI action error:', error);
    return res.status(500).json({
      error: 'Failed to execute requested action in ERP database.',
      details: error.message,
    });
  }
});
