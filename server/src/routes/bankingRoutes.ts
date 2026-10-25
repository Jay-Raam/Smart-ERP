import { Router, Request, Response } from 'express';
import { getDemoRoleHeader } from '../security/auth';
import { escapeRegex } from '../utils/regex';
import mongoose from 'mongoose';
import {
  BankAccount,
  FinancialTransaction,
  AuditHistory,
} from '../models/ErpModels';
import { Invoice, Bill } from '../models/ErpModels';
import { BankStatementService, BankStatementLine } from '../services/bankStatementService';
import { logAuditAction } from '../utils/auditLogger';

export const bankingRouter = Router();

/**
 * Helper to extract user info
 */
function getUserContext(req: Request) {
  const role = req.user?.role || getDemoRoleHeader(req) || (process.env.NODE_ENV === 'production' ? '' : 'Admin');
  const userId = req.user?.userId || '00000000-0000-0000-0000-000000000001';
  const email = req.user?.email || 'admin@smarterp.com';
  const name = (req.user as any)?.name || 'Admin User';
  return { userId, email, name, role };
}

// ==========================================
// 1. BANK ACCOUNTS
// ==========================================

/**
 * GET /api/erp/bank-accounts
 * List all bank accounts for the organisation / branch
 */
bankingRouter.get('/bank-accounts', async (req: Request, res: Response) => {
  try {
    const orgId = (req.query.organisationId as string) || req.tenant?.id || '';
    const query: any = {};
    if (orgId) query.organisationId = orgId;
    if (req.query.status) query.status = req.query.status;

    const accounts = await BankAccount.find(query).sort({ isPrimary: -1, createdAt: -1 });
    return res.json({ message: 'success', data: accounts });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/erp/bank-accounts
 * Create new bank account. Transactionally demote others if marked primary.
 */
bankingRouter.post('/bank-accounts', async (req: Request, res: Response) => {
  const user = getUserContext(req);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      accountName,
      accountHolderName,
      accountHolderType = 'ORGANISATION',
      partyId = '',
      partyName = '',
      bankName,
      branch,
      branchName,
      accountNumber,
      ifscCode,
      accountType = 'Current',
      currency = 'INR',
      isPrimary = false,
      balance = 0,
      openingBalance = 0,
      organisationId = req.tenant?.id || '',
      branchId = '',
    } = req.body;

    const finalAccountName = accountName || `${bankName} - ${String(accountNumber).slice(-4)}`;
    const finalBranch = branch || branchName || '';
    const initialBalance = Number(balance) || Number(openingBalance) || 0;

    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Missing mandatory bank account details.' });
    }

    // Check duplicate account number within organisation
    const existing = await BankAccount.findOne({ organisationId, accountNumber }).session(session);
    if (existing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ error: `Bank Account with number ${accountNumber} already exists in this organisation.` });
    }

    // Check if this is the first account; if so, make it primary automatically
    const count = await BankAccount.countDocuments({ organisationId }).session(session);
    const shouldBePrimary = isPrimary || count === 0;

    if (shouldBePrimary && accountHolderType === 'ORGANISATION') {
      // Transactionally demote existing primary accounts
      await BankAccount.updateMany(
        { organisationId, isPrimary: true },
        { $set: { isPrimary: false, updatedBy: user.name } },
        { session }
      );
    }

    const newAccount = new BankAccount({
      accountName: finalAccountName,
      accountHolderName,
      accountHolderType,
      partyId,
      partyName,
      bankName,
      branch: finalBranch,
      accountNumber,
      ifscCode: ifscCode.toUpperCase().trim(),
      accountType,
      currency,
      isPrimary: shouldBePrimary && accountHolderType === 'ORGANISATION',
      status: 'ACTIVE',
      balance: initialBalance,
      organisationId,
      branchId,
      createdBy: user.name,
      updatedBy: user.name,
    });

    await newAccount.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logAuditAction(req, {
      action: 'CREATE',
      entityType: 'BankAccount',
      entityId: (newAccount._id as any).toString(),
      entityIdentifier: `${newAccount.bankName} - ${newAccount.accountNumber}`,
      newData: newAccount.toObject(),
      organisationId,
      branchId: branchId || undefined,
    });

    return res.status(201).json({ message: 'Bank account created successfully', data: newAccount });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/erp/bank-accounts/:id/set-primary
 * Transactionally mark an account as primary and demote others
 */
bankingRouter.post('/bank-accounts/:id/set-primary', async (req: Request, res: Response) => {
  const user = getUserContext(req);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const account = await BankAccount.findById(req.params.id).session(session);
    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Bank account not found.' });
    }

    if (account.status !== 'ACTIVE') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Cannot set an inactive bank account as primary.' });
    }

    // Demote all other accounts in organisation
    await BankAccount.updateMany(
      { organisationId: account.organisationId, _id: { $ne: account._id } },
      { $set: { isPrimary: false, updatedBy: user.name } },
      { session }
    );

    account.isPrimary = true;
    account.updatedBy = user.name;
    await account.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'BankAccount',
      entityId: (account._id as any).toString(),
      entityIdentifier: `${account.bankName} - ${account.accountNumber} (SET PRIMARY)`,
      previousData: { isPrimary: false },
      newData: { isPrimary: true },
      organisationId: account.organisationId,
      branchId: account.branchId || '',
    });

    return res.json({ message: 'Primary bank account updated successfully', data: account });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/erp/bank-accounts/:id
 * Update account details or active status
 */
bankingRouter.patch('/bank-accounts/:id', async (req: Request, res: Response) => {
  const user = getUserContext(req);
  try {
    const account = await BankAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ error: 'Bank account not found.' });
    }

    const previousData = account.toObject();

    // If changing to primary, ensure single-primary rule
    if (req.body.isPrimary && !account.isPrimary) {
      await BankAccount.updateMany(
        { organisationId: account.organisationId, _id: { $ne: account._id } },
        { $set: { isPrimary: false, updatedBy: user.name } }
      );
    }

    Object.assign(account, req.body, { updatedBy: user.name });
    await account.save();

    await logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'BankAccount',
      entityId: (account._id as any).toString(),
      entityIdentifier: `${account.bankName} - ${account.accountNumber}`,
      previousData,
      newData: account.toObject(),
      organisationId: account.organisationId,
      branchId: account.branchId || '',
    });

    return res.json({ message: 'Bank account updated successfully', data: account });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. FINANCIAL TRANSACTIONS LEDGER
// ==========================================

/**
 * GET /api/erp/transactions
 * Centralized financial transaction ledger with server-side filters
 */
bankingRouter.get('/transactions', async (req: Request, res: Response) => {
  try {
    const orgId = (req.query.organisationId as string) || req.tenant?.id || '';
    const query: any = {};
    if (orgId) query.organisationId = orgId;
    if (req.query.branchId) query.branchId = req.query.branchId;
    if (req.query.financialYear) query.financialYear = req.query.financialYear;
    const accountId = (req.query.accountId || req.query.bankAccountId) as string;
    if (accountId && accountId !== 'ALL') query.accountId = accountId;

    const txType = (req.query.transactionType || req.query.type) as string;
    if (txType && txType !== 'ALL') {
      query.transactionType = txType;
    }
    if (req.query.status && req.query.status !== 'ALL') {
      query.status = req.query.status;
    }

    // Date range filter
    const fromDate = (req.query.fromDate || req.query.startDate) as string;
    const toDate = (req.query.toDate || req.query.endDate) as string;
    if (fromDate && toDate) {
      if (fromDate > toDate) {
        return res.status(400).json({ error: 'From Date cannot be greater than To Date.' });
      }
      query.transactionDate = { $gte: fromDate, $lte: toDate };
    } else if (fromDate) {
      query.transactionDate = { $gte: fromDate };
    } else if (toDate) {
      query.transactionDate = { $lte: toDate };
    }

    // Search query
    if (req.query.search) {
      const s = escapeRegex(String(req.query.search).trim());
      query.$or = [
        { transactionNumber: { $regex: s, $options: 'i' } },
        { partyName: { $regex: s, $options: 'i' } },
        { documentNumber: { $regex: s, $options: 'i' } },
        { referenceNumber: { $regex: s, $options: 'i' } },
        { accountName: { $regex: s, $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const perPage = Math.max(1, parseInt(req.query.per_page as string, 10) || 50);

    const [total, rawTransactions] = await Promise.all([
      FinancialTransaction.countDocuments(query),
      FinancialTransaction.find(query)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage),
    ]);

    const transactions = rawTransactions.map((tx) => {
      const doc = tx.toObject ? tx.toObject({ virtuals: true }) : tx;
      return {
        ...doc,
        id: doc._id?.toString() || doc.id,
        type: doc.transactionType || doc.type,
        transactionType: doc.transactionType || doc.type,
      };
    });

    // Calculate debit / credit totals for the queried dataset
    const totalsAgg = await FinancialTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' },
          netBalance: { $sum: { $subtract: ['$credit', '$debit'] } },
        },
      },
    ]);

    const totals = totalsAgg[0] || { totalDebit: 0, totalCredit: 0, netBalance: 0 };

    return res.json({
      message: 'success',
      data: transactions,
      transactions,
      total,
      page,
      per_page: perPage,
      totals,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/erp/transactions/:id
 * Retrieve a single transaction with audit details
 */
bankingRouter.get('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const tx = await FinancialTransaction.findById(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: 'Financial transaction not found.' });
    }
    const doc = tx.toObject ? tx.toObject({ virtuals: true }) : tx;
    const formatted = {
      ...doc,
      id: doc._id?.toString() || doc.id,
      type: doc.transactionType || doc.type,
      transactionType: doc.transactionType || doc.type,
    };
    return res.json({ message: 'success', data: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/erp/transactions/:id/reverse
 * Reverses an immutable posted transaction via an adjustment transaction
 */
bankingRouter.post('/transactions/:id/reverse', async (req: Request, res: Response) => {
  const user = getUserContext(req);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const originalTx = await FinancialTransaction.findById(req.params.id).session(session);
    if (!originalTx) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    if (originalTx.status === 'REVERSED') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Transaction has already been reversed.' });
    }

    const { reason = 'Operational reversal / entry adjustment' } = req.body;

    const reversalTxNumber = `REV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Flip debit and credit
    const reversalTx = new FinancialTransaction({
      transactionNumber: reversalTxNumber,
      transactionDate: new Date().toISOString().split('T')[0],
      transactionType: 'REVERSAL',
      accountId: originalTx.accountId,
      accountName: originalTx.accountName,
      partyType: originalTx.partyType,
      partyId: originalTx.partyId,
      partyName: originalTx.partyName,
      documentType: originalTx.documentType,
      documentId: originalTx.documentId,
      documentNumber: originalTx.documentNumber,
      debit: originalTx.credit, // Invert
      credit: originalTx.debit, // Invert
      amount: originalTx.amount,
      paymentMethod: originalTx.paymentMethod,
      referenceNumber: `Reversal of ${originalTx.transactionNumber}`,
      status: 'POSTED',
      reversalTransactionId: (originalTx._id as any).toString(),
      notes: `Reversal Reason: ${reason}`,
      organisationId: originalTx.organisationId,
      branchId: originalTx.branchId,
      financialYear: originalTx.financialYear,
      createdBy: user.name,
    });

    await reversalTx.save({ session });

    // Mark original transaction as REVERSED
    originalTx.status = 'REVERSED';
    originalTx.reversalTransactionId = (reversalTx._id as any).toString();
    await originalTx.save({ session });

    // Adjust bank account balance
    const bank = await BankAccount.findById(originalTx.accountId).session(session);
    if (bank) {
      // If original had credit (money in), reversal debits it (money out)
      const balanceDelta = originalTx.debit - originalTx.credit;
      bank.balance += balanceDelta;
      bank.updatedBy = user.name;
      await bank.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    await logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'FinancialTransaction',
      entityId: (originalTx._id as any).toString(),
      entityIdentifier: `REVERSAL of ${originalTx.transactionNumber}`,
      previousData: { status: 'POSTED' },
      newData: { status: 'REVERSED', reversalTxNumber },
      organisationId: originalTx.organisationId,
      branchId: originalTx.branchId,
    });

    return res.json({
      message: 'Transaction successfully reversed with offsetting ledger entry.',
      data: { original: originalTx, reversal: reversalTx },
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 4. AUTOMATED BANK STATEMENT RECONCILIATION
// ==========================================

/**
 * POST /api/erp/banking/reconciliation/parse-statement
 * Parses uploaded CSV or MT940 bank statement text
 */
bankingRouter.post('/banking/reconciliation/parse-statement', async (req: Request, res: Response) => {
  try {
    const { content, format = 'CSV' } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Statement content string is required.' });
    }

    let parsedLines: BankStatementLine[] = [];
    if (format.toUpperCase() === 'MT940') {
      parsedLines = BankStatementService.parseMt940Statement(content);
    } else {
      parsedLines = BankStatementService.parseCsvStatement(content);
    }

    return res.json({
      message: 'success',
      format: format.toUpperCase(),
      count: parsedLines.length,
      data: parsedLines
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/erp/banking/reconciliation/auto-match
 * Executes multi-factor fuzzy matching between statement lines and open Invoices/Bills
 */
bankingRouter.post('/banking/reconciliation/auto-match', async (req: Request, res: Response) => {
  try {
    const { statementLines } = req.body;
    if (!Array.isArray(statementLines) || statementLines.length === 0) {
      return res.status(400).json({ error: 'statementLines array is required.' });
    }

    const orgId = (req.query.organisationId as string) || req.tenant?.id || '';
    const branchId = req.headers['x-branch-id'] as string;

    const query: any = { isDeleted: { $ne: true }, paymentStatus: { $ne: 'PAID' } };
    if (orgId) query.organisationId = orgId;
    if (branchId) query.branchId = branchId;

    const [openInvoices, openBills] = await Promise.all([
      Invoice.find(query).lean(),
      Bill.find(query).lean()
    ]);

    const reconciliation = BankStatementService.reconcile(
      statementLines,
      openInvoices as any,
      openBills as any
    );

    return res.json({
      message: 'success',
      data: reconciliation
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/erp/banking/reconciliation/settle-batch
 * Batch clears recommended matches and generates double-entry FinancialTransaction records
 */
bankingRouter.post('/banking/reconciliation/settle-batch', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = getUserContext(req);
    const { accountId, matches } = req.body;

    if (!accountId || !Array.isArray(matches) || matches.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'accountId and matches array are required.' });
    }

    const bank = await BankAccount.findById(accountId).session(session);
    if (!bank) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Bank account not found.' });
    }

    const settledRecords: any[] = [];

    for (const match of matches) {
      if (!match.isSettlementRecommended || !match.matchedEntityId) continue;

      const amt = match.statementLine.amount;
      const refNo = match.statementLine.referenceNumber || `RECON_${Date.now()}`;

      if (match.matchedEntityType === 'INVOICE') {
        const inv = await Invoice.findById(match.matchedEntityId).session(session);
        if (inv) {
          const currentPaid = inv.paidAmount || 0;
          const newPaid = Math.min(inv.totalAmount, currentPaid + amt);
          inv.paidAmount = newPaid;
          inv.outstandingAmount = Math.max(0, inv.totalAmount - newPaid);
          inv.paymentStatus = inv.outstandingAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID';
          await inv.save({ session });

          // Create double-entry ledger entry (Customer Inflow)
          const txNumber = `TX-REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const tx = new FinancialTransaction({
            transactionNumber: txNumber,
            date: match.statementLine.date,
            type: 'CUSTOMER_PAYMENT',
            accountId: bank._id,
            accountName: bank.accountName,
            partyType: 'CUSTOMER',
            partyId: inv.customerId,
            partyName: match.partyName || (inv as any).customerName,
            debit: 0,
            credit: amt,
            runningBalance: bank.balance + amt,
            referenceNumber: refNo,
            paymentMode: 'NEFT',
            notes: `Auto-reconciled from bank statement. ${match.matchReason}`,
            status: 'POSTED',
            organisationId: inv.organisationId,
            branchId: inv.branchId,
            financialYear: inv.financialYear,
            createdBy: user.name,
          });

          await tx.save({ session });
          bank.balance += amt;
          settledRecords.push({ type: 'INVOICE', id: inv._id, number: inv.invoiceNumber, amount: amt });
        }
      } else if (match.matchedEntityType === 'BILL') {
        const bill = await Bill.findById(match.matchedEntityId).session(session);
        if (bill) {
          const currentPaid = bill.paidAmount || 0;
          const newPaid = Math.min(bill.totalAmount, currentPaid + amt);
          bill.paidAmount = newPaid;
          bill.outstandingAmount = Math.max(0, bill.totalAmount - newPaid);
          bill.paymentStatus = bill.outstandingAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID';
          await bill.save({ session });

          // Create double-entry ledger entry (Vendor Outflow)
          const txNumber = `TX-REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const tx = new FinancialTransaction({
            transactionNumber: txNumber,
            date: match.statementLine.date,
            type: 'VENDOR_PAYMENT',
            accountId: bank._id,
            accountName: bank.accountName,
            partyType: 'VENDOR',
            partyId: bill.vendorId,
            partyName: match.partyName || (bill as any).vendorName,
            debit: amt,
            credit: 0,
            runningBalance: bank.balance - amt,
            referenceNumber: refNo,
            paymentMode: 'NEFT',
            notes: `Auto-reconciled from bank statement. ${match.matchReason}`,
            status: 'POSTED',
            organisationId: bill.organisationId,
            branchId: bill.branchId,
            financialYear: bill.financialYear,
            createdBy: user.name,
          });

          await tx.save({ session });
          bank.balance -= amt;
          settledRecords.push({ type: 'BILL', id: bill._id, number: bill.billNumber, amount: amt });
        }
      }
    }

    bank.updatedBy = user.name;
    await bank.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({
      message: 'Batch settlement executed successfully.',
      settledCount: settledRecords.length,
      data: settledRecords
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
});
