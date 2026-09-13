import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  BankAccount,
  FinancialTransaction,
  AuditHistory,
} from '../models/ErpModels';
import { logAuditAction } from '../utils/auditLogger';

export const bankingRouter = Router();

/**
 * Helper to extract user info
 */
function getUserContext(req: Request) {
  const role = req.user?.role || (req.headers['x-demo-role'] as string) || 'Admin';
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
      const s = String(req.query.search).trim();
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
