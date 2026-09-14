import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  Invoice,
  Bill,
  PurchaseOrder,
  Customer,
  Vendor,
  BankAccount,
  FinancialTransaction,
  AuditHistory,
} from '../models/ErpModels';
import { logAuditAction } from '../utils/auditLogger';

export const paymentRouter = Router();

function getUserContext(req: Request) {
  const role = req.user?.role || (req.headers['x-demo-role'] as string) || 'Admin';
  const userId = req.user?.userId || '00000000-0000-0000-0000-000000000001';
  const email = req.user?.email || 'admin@smarterp.com';
  const name = (req.user as any)?.name || 'Admin User';
  return { userId, email, name, role };
}

// ==========================================
// 1. CUSTOMER PAYMENT (Tax Invoice Settlement)
// ==========================================
paymentRouter.post('/payments/customer', async (req: Request, res: Response) => {
  const user = getUserContext(req);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      invoiceId,
      bankAccountId,
      paymentDate = new Date().toISOString().split('T')[0],
      amount,
      paymentMethod = 'BANK_TRANSFER',
      referenceNumber = '',
      notes = '',
    } = req.body;

    const payAmount = Number(amount);
    if (!invoiceId || !bankAccountId || !payAmount || payAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Valid invoiceId, bankAccountId, and positive payment amount are required.' });
    }

    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Tax Invoice not found.' });
    }

    const currentPaid = invoice.paidAmount || 0;
    const currentOutstanding = invoice.outstandingAmount > 0 ? invoice.outstandingAmount : Math.max(0, invoice.totalAmount - currentPaid);

    if (currentOutstanding <= 0 || invoice.paymentStatus === 'PAID') {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({ error: `Invoice ${invoice.invoiceNumber} is already fully paid.` });
    }

    if (payAmount > currentOutstanding) {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({
        error: `Payment amount ₹${payAmount.toLocaleString('en-IN')} exceeds current outstanding balance ₹${currentOutstanding.toLocaleString('en-IN')}.`,
      });
    }

    const bank = await BankAccount.findById(bankAccountId).session(session);
    if (!bank) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Bank account not found.' });
    }

    if (bank.status !== 'ACTIVE') {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({ error: `Bank Account [${bank.bankName}] is inactive and cannot process transactions.` });
    }

    // 1. Update Invoice balances
    const newPaidAmount = currentPaid + payAmount;
    const newOutstanding = Math.max(0, invoice.totalAmount - newPaidAmount);
    const newPaymentStatus = newOutstanding === 0 ? 'PAID' : 'PARTIALLY_PAID';

    invoice.paidAmount = newPaidAmount;
    invoice.outstandingAmount = newOutstanding;
    invoice.paymentStatus = newPaymentStatus;
    if (newPaymentStatus === 'PAID') {
      invoice.status = 'Paid';
    }

    if (!invoice.history) invoice.history = [];
    invoice.history.push({
      action: 'PAYMENT_RECORDED',
      timestamp: new Date(),
      user: user.name || (user as any).username || 'Jay Raam',
      details: `Payment of ₹${payAmount.toLocaleString('en-IN')} recorded via ${paymentMethod} (Ref: ${referenceNumber || 'N/A'}). Status: ${newPaymentStatus}. Outstanding: ₹${newOutstanding.toLocaleString('en-IN')}`,
    });

    await invoice.save({ session });

    // 2. Update Customer outstanding balance
    if (invoice.customerId) {
      const customer = await Customer.findById(invoice.customerId).session(session);
      if (customer) {
        customer.outstandingBalance = Math.max(0, (customer.outstandingBalance || 0) - payAmount);
        await customer.save({ session });
      }
    }

    // 3. Update Bank Balance (Credit money into organisation account)
    bank.balance = (bank.balance || 0) + payAmount;
    bank.updatedBy = user.name;
    await bank.save({ session });

    // 4. Record Financial Transaction (Ledger)
    const txNumber = `TXN-CP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const financialTx = new FinancialTransaction({
      transactionNumber: txNumber,
      transactionDate: paymentDate,
      transactionType: 'CUSTOMER_PAYMENT',
      accountId: (bank._id as any).toString(),
      accountName: `${bank.bankName} (${bank.accountNumber.slice(-4)})`,
      partyType: 'CUSTOMER',
      partyId: invoice.customerId,
      partyName: invoice.customerName,
      documentType: 'INVOICE',
      documentId: (invoice._id as any).toString(),
      documentNumber: invoice.invoiceNumber,
      debit: 0,
      credit: payAmount,
      amount: payAmount,
      paymentMethod,
      referenceNumber: referenceNumber || `Invoice Settlement ${invoice.invoiceNumber}`,
      status: 'POSTED',
      notes,
      organisationId: invoice.organisationId || bank.organisationId,
      branchId: invoice.branchId || bank.branchId,
      financialYear: invoice.financialYear || '2026-2027',
      createdBy: user.name,
    });
    await financialTx.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: (invoice._id as any).toString(),
      entityIdentifier: `${invoice.invoiceNumber} (PAYMENT ₹${payAmount})`,
      previousData: { paidAmount: currentPaid, outstandingAmount: currentOutstanding },
      newData: { paidAmount: newPaidAmount, outstandingAmount: newOutstanding, transactionNumber: txNumber },
      organisationId: invoice.organisationId,
      branchId: invoice.branchId,
    });

    return res.status(200).json({
      message: 'Payment successfully recorded and allocated.',
      data: {
        invoice,
        transaction: financialTx,
        bankBalance: bank.balance,
      },
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. VENDOR PAYMENT (Vendor Bill Settlement)
// ==========================================
paymentRouter.post('/payments/vendor', async (req: Request, res: Response) => {
  const user = getUserContext(req);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      billId,
      bankAccountId,
      paymentDate = new Date().toISOString().split('T')[0],
      amount,
      paymentMethod = 'BANK_TRANSFER',
      referenceNumber = '',
      notes = '',
    } = req.body;

    const payAmount = Number(amount);
    if (!billId || !bankAccountId || !payAmount || payAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Valid billId, bankAccountId, and positive payment amount are required.' });
    }

    const bill = await Bill.findById(billId).session(session);
    if (!bill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Vendor Bill not found.' });
    }

    const currentPaid = bill.paidAmount || 0;
    const currentOutstanding =
      bill.outstandingAmount > 0
        ? bill.outstandingAmount
        : Math.max(0, bill.totalAmount - currentPaid - (bill.advanceAdjusted || 0));

    if (currentOutstanding <= 0 || bill.paymentStatus === 'PAID') {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({ error: `Bill ${bill.billNumber} is already fully paid.` });
    }

    if (payAmount > currentOutstanding) {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({
        error: `Payment amount ₹${payAmount.toLocaleString('en-IN')} exceeds bill outstanding balance ₹${currentOutstanding.toLocaleString('en-IN')}.`,
      });
    }

    const bank = await BankAccount.findById(bankAccountId).session(session);
    if (!bank) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Bank account not found.' });
    }

    if (bank.status !== 'ACTIVE') {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({ error: `Bank Account [${bank.bankName}] is inactive and cannot process transactions.` });
    }

    // 1. Update Bill balances
    const newPaidAmount = currentPaid + payAmount;
    const newOutstanding = Math.max(0, bill.totalAmount - newPaidAmount - (bill.advanceAdjusted || 0));
    const newPaymentStatus = newOutstanding === 0 ? 'PAID' : 'PARTIALLY_PAID';

    bill.paidAmount = newPaidAmount;
    bill.outstandingAmount = newOutstanding;
    bill.paymentStatus = newPaymentStatus;
    if (newPaymentStatus === 'PAID') {
      bill.status = 'Paid';
    }
    await bill.save({ session });

    // 2. Update Vendor outstanding payable
    if (bill.vendorId) {
      const vendor = await Vendor.findById(bill.vendorId).session(session);
      if (vendor) {
        vendor.outstandingBalance = Math.max(0, (vendor.outstandingBalance || 0) - payAmount);
        await vendor.save({ session });
      }
    }

    // 3. Update Bank Balance (Debit money out of organisation account)
    bank.balance = (bank.balance || 0) - payAmount;
    bank.updatedBy = user.name;
    await bank.save({ session });

    // 4. Record Financial Transaction (Ledger)
    const txNumber = `TXN-VP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const financialTx = new FinancialTransaction({
      transactionNumber: txNumber,
      transactionDate: paymentDate,
      transactionType: 'VENDOR_PAYMENT',
      accountId: (bank._id as any).toString(),
      accountName: `${bank.bankName} (${bank.accountNumber.slice(-4)})`,
      partyType: 'VENDOR',
      partyId: bill.vendorId,
      partyName: bill.vendorName,
      documentType: 'BILL',
      documentId: (bill._id as any).toString(),
      documentNumber: bill.billNumber,
      debit: payAmount,
      credit: 0,
      amount: payAmount,
      paymentMethod,
      referenceNumber: referenceNumber || `Bill Settlement ${bill.billNumber}`,
      status: 'POSTED',
      notes,
      organisationId: bill.organisationId || bank.organisationId,
      branchId: bill.branchId || bank.branchId,
      financialYear: bill.financialYear || '2026-2027',
      createdBy: user.name,
    });
    await financialTx.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'Bill',
      entityId: (bill._id as any).toString(),
      entityIdentifier: `${bill.billNumber} (PAYMENT ₹${payAmount})`,
      previousData: { paidAmount: currentPaid, outstandingAmount: currentOutstanding },
      newData: { paidAmount: newPaidAmount, outstandingAmount: newOutstanding, transactionNumber: txNumber },
      organisationId: bill.organisationId,
      branchId: bill.branchId,
    });

    return res.status(200).json({
      message: 'Vendor payment recorded and allocated successfully.',
      data: {
        bill,
        transaction: financialTx,
        bankBalance: bank.balance,
      },
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. VENDOR ADVANCE (Payment against PO before Bill)
// ==========================================
paymentRouter.post('/payments/vendor-advance', async (req: Request, res: Response) => {
  const user = getUserContext(req);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      poId,
      bankAccountId,
      paymentDate = new Date().toISOString().split('T')[0],
      amount,
      paymentMethod = 'BANK_TRANSFER',
      referenceNumber = '',
      notes = '',
    } = req.body;

    const advanceAmount = Number(amount);
    if (!poId || !bankAccountId || !advanceAmount || advanceAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Valid poId, bankAccountId, and positive advance amount are required.' });
    }

    const po = await PurchaseOrder.findById(poId).session(session);
    if (!po) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    const currentPaid = po.paidAmount || 0;
    const remainingToAdvance = Math.max(0, po.totalAmount - currentPaid);

    if (advanceAmount > remainingToAdvance) {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({
        error: `Advance amount ₹${advanceAmount.toLocaleString('en-IN')} exceeds PO total balance ₹${remainingToAdvance.toLocaleString('en-IN')}.`,
      });
    }

    const bank = await BankAccount.findById(bankAccountId).session(session);
    if (!bank) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Bank account not found.' });
    }

    if (bank.status !== 'ACTIVE') {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({ error: `Bank Account [${bank.bankName}] is inactive and cannot process transactions.` });
    }

    // 1. Update PO advance status
    const newPaidAmount = currentPaid + advanceAmount;
    const newOutstanding = Math.max(0, po.totalAmount - newPaidAmount);
    po.paidAmount = newPaidAmount;
    po.outstandingAmount = newOutstanding;
    po.paymentStatus = newOutstanding === 0 ? 'PAID' : 'PARTIALLY_PAID';
    await po.save({ session });

    // 2. Update Bank Balance (Debit money out)
    bank.balance = (bank.balance || 0) - advanceAmount;
    bank.updatedBy = user.name;
    await bank.save({ session });

    // 3. Record Financial Transaction (Vendor Advance)
    const txNumber = `TXN-VA-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const financialTx = new FinancialTransaction({
      transactionNumber: txNumber,
      transactionDate: paymentDate,
      transactionType: 'VENDOR_ADVANCE',
      accountId: (bank._id as any).toString(),
      accountName: `${bank.bankName} (${bank.accountNumber.slice(-4)})`,
      partyType: 'VENDOR',
      partyId: po.vendorId,
      partyName: po.vendorName,
      documentType: 'PURCHASE_ORDER',
      documentId: (po._id as any).toString(),
      documentNumber: po.poNumber,
      debit: advanceAmount,
      credit: 0,
      amount: advanceAmount,
      paymentMethod,
      referenceNumber: referenceNumber || `Vendor Advance against PO ${po.poNumber}`,
      status: 'POSTED',
      notes,
      organisationId: po.organisationId || bank.organisationId,
      branchId: po.branchId || bank.branchId,
      financialYear: po.financialYear || '2026-2027',
      createdBy: user.name,
    });
    await financialTx.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'PurchaseOrder',
      entityId: (po._id as any).toString(),
      entityIdentifier: `${po.poNumber} (VENDOR ADVANCE ₹${advanceAmount})`,
      previousData: { paidAmount: currentPaid },
      newData: { paidAmount: newPaidAmount, transactionNumber: txNumber },
      organisationId: po.organisationId,
      branchId: po.branchId,
    });

    return res.status(200).json({
      message: 'Vendor advance recorded successfully against Purchase Order.',
      data: {
        purchaseOrder: po,
        transaction: financialTx,
        bankBalance: bank.balance,
      },
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
});
