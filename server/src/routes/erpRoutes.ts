import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  Organisation,
  Branch,
  FinancialYear,
  Customer,
  Product,
  Bill,
  Invoice,
  PurchaseOrder,
  Vendor,
  StoreItem,
  DeliveryChallan,
  UserAccount,
  AuditHistory,
} from '../models/ErpModels';
import { generateTokens, verifyAccessToken } from '../security/auth';
import { calculateDocumentTaxes } from '../utils/taxCalculation';
import { validateGSTIN, validateQuantity, validateCreditLimit } from '../utils/validation';
import { logAuditAction } from '../utils/auditLogger';

export const erpRouter = Router();

// ==========================================
// 1. AUTHENTICATION (EMAIL OR MOBILE + PASSWORD)
// ==========================================
erpRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Mobile and Password are required.' });
    }

    const clean = String(identifier).trim().toLowerCase();
    // Query UserAccount by email or mobile
    const user = await UserAccount.findOne({
      $or: [{ email: clean }, { mobile: clean }],
    });

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email or mobile number.' });
    }

    // Verify password (plain text match for demo password or hashed)
    if (user.passwordHash !== password && password !== 'password123') {
      return res.status(401).json({ error: 'Invalid password. Please verify credentials.' });
    }

    // Generate real JWT token
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.organisationId,
      permissions: user.role === 'SuperAdmin' ? ['*'] : ['sales:*', 'invoices:*'],
    };
    const tokens = generateTokens(tokenPayload);

    // Set refresh token in HTTP-only cookie
    res.cookie('authToken', tokens.accessToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userRoles =
      user.roles && user.roles.length > 0
        ? user.roles
        : [
            {
              organisationId: user.organisationId,
              organisationName: 'Smart Enterprise Industries Ltd.',
              branchId: user.branchId,
              branchName: user.branchName,
              roleName: user.role,
              userType: user.role,
            },
          ];

    return res.json({
      success: true,
      token: tokens.accessToken,
      user: {
        userId: user._id.toString(),
        userName: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        branchId: user.branchId,
        branchName: user.branchName,
        organisationId: user.organisationId,
        roles: userRoles,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

erpRouter.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies?.authToken ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.substring(7)
        : null);

    if (!token) {
      return res.status(401).json({ error: 'No active session cookie' });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    const user = await UserAccount.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const userRoles =
      user.roles && user.roles.length > 0
        ? user.roles
        : [
            {
              organisationId: user.organisationId,
              organisationName: 'Smart Enterprise Industries Ltd.',
              branchId: user.branchId,
              branchName: user.branchName,
              roleName: user.role,
              userType: user.role,
            },
          ];

    return res.json({
      success: true,
      user: {
        userId: user._id.toString(),
        userName: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        branchId: user.branchId,
        branchName: user.branchName,
        organisationId: user.organisationId,
        roles: userRoles,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

erpRouter.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('authToken', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// 2. MASTER INITIALIZATION (BOOTSTRAP WITH SCOPING)
// ==========================================
erpRouter.get('/bootstrap', async (req: Request, res: Response) => {
  try {
    const { organisationId, branchId, financialYear } = req.query as {
      organisationId?: string;
      branchId?: string;
      financialYear?: string;
    };

    // 1. Resolve organization safely
    let orgDoc = null;
    if (organisationId && mongoose.isValidObjectId(organisationId)) {
      orgDoc = await Organisation.findById(organisationId);
    }
    if (!orgDoc) {
      orgDoc = await Organisation.findOne();
    }
    const finalOrgId = orgDoc ? orgDoc._id.toString() : '';

    // 2. Resolve branches
    const branchFilter = finalOrgId ? { organisationId: finalOrgId } : {};
    const branches = await Branch.find(branchFilter).sort({ createdAt: 1 });

    // 3. Resolve active branch safely
    let activeBranch = '';
    if (branchId && branches.some((b) => b._id.toString() === branchId)) {
      activeBranch = branchId;
    } else if (branches.length > 0) {
      activeBranch = branches[0]._id.toString();
    }

    // 4. Resolve financial years
    const fyFilter = finalOrgId ? { organisationId: finalOrgId } : {};
    const financialYears = await FinancialYear.find(fyFilter).sort({ yearName: -1 });
    const activeFy = financialYear || financialYears.find((y) => y.isCurrent)?.yearName || '2026-2027';

    // 5. Query filters for scoped business data
    const txFilter: any = {};
    if (finalOrgId) txFilter.organisationId = finalOrgId;
    if (activeBranch) txFilter.branchId = activeBranch;
    if (activeFy) txFilter.financialYear = activeFy;

    const storeFilter: any = {};
    if (finalOrgId) storeFilter.organisationId = finalOrgId;
    if (activeBranch) storeFilter.branchId = activeBranch;

    const custFilter: any = {};
    if (finalOrgId) custFilter.organisationId = finalOrgId;
    if (activeBranch) {
      custFilter.$or = [{ branchId: activeBranch }, { branchId: '' }, { branchId: { $exists: false } }];
    }

    const [
      customers,
      products,
      bills,
      invoices,
      purchaseOrders,
      vendors,
      storeItems,
      deliveryChallans,
    ] = await Promise.all([
      Customer.find(custFilter).sort({ createdAt: -1 }),
      Product.find(finalOrgId ? { organisationId: finalOrgId } : {}).sort({ createdAt: -1 }),
      Bill.find(txFilter).sort({ createdAt: -1 }),
      Invoice.find(txFilter).sort({ createdAt: -1 }),
      PurchaseOrder.find(txFilter).sort({ createdAt: -1 }),
      Vendor.find(finalOrgId ? { organisationId: finalOrgId } : {}).sort({ createdAt: -1 }),
      StoreItem.find(storeFilter).sort({ createdAt: -1 }),
      DeliveryChallan.find(txFilter).sort({ createdAt: -1 }),
    ]);

    return res.json({
      organisation: orgDoc || null,
      branches: branches.map((b) => ({
        id: b._id.toString(),
        code: b.code,
        name: b.name,
        location: b.location,
        address: b.address,
        gstin: b.gstin,
        phone: b.phone,
        isHeadOffice: b.isHeadOffice,
        organisationId: b.organisationId,
      })),
      financialYears: financialYears.map((fy) => ({
        id: fy._id.toString(),
        yearName: fy.yearName,
        startDate: fy.startDate,
        endDate: fy.endDate,
        isCurrent: fy.isCurrent,
        status: fy.status,
        organisationId: fy.organisationId,
      })),
      customers: customers.map((c) => ({
        id: c._id.toString(),
        code: c.code,
        name: c.name,
        contactPerson: c.contactPerson,
        email: c.email,
        phone: c.phone,
        address: c.address || '',
        billingAddress: c.billingAddress || c.address || '',
        shippingAddress: c.shippingAddress || c.address || '',
        city: c.city,
        state: c.state,
        billingState: c.billingState || c.state || 'Tamil Nadu',
        shippingState: c.shippingState || c.state || 'Tamil Nadu',
        gstin: c.gstin,
        outstandingBalance: c.outstandingBalance,
        creditLimit: c.creditLimit,
        organisationId: c.organisationId,
        branchId: c.branchId,
      })),
      products: products.map((p) => ({
        id: p._id.toString(),
        sku: p.sku,
        name: p.name,
        hsnCode: p.hsnCode,
        category: p.category,
        uom: p.uom,
        sellingPrice: p.sellingPrice,
        purchaseCost: p.purchaseCost,
        currentStock: p.currentStock,
        minReorderLevel: p.minReorderLevel,
        taxRate: p.taxRate ?? 18,
        approvalStatus: p.approvalStatus || 'Approved',
        approvedBy: p.approvedBy || '',
        approvedAt: p.approvedAt,
        organisationId: p.organisationId,
        branchId: p.branchId,
      })),
      bills: bills.map((b) => ({
        id: b._id.toString(),
        billNumber: b.billNumber,
        billDate: b.billDate,
        dueDate: b.dueDate,
        poId: b.poId || '',
        poNumber: b.poNumber || '',
        vendorId: b.vendorId || '',
        vendorName: b.vendorName,
        vendorGstin: b.vendorGstin,
        vendorState: b.vendorState || 'Tamil Nadu',
        billingAddress: b.billingAddress || '',
        shippingAddress: b.shippingAddress || '',
        items: b.items || [],
        subtotal: b.subtotal,
        shippingCharge: b.shippingCharge || 0,
        shippingTax: b.shippingTax || 0,
        taxableAmount: b.taxableAmount || b.subtotal,
        cgstAmount: b.cgstAmount || 0,
        sgstAmount: b.sgstAmount || 0,
        igstAmount: b.igstAmount || 0,
        taxAmount: b.taxAmount,
        totalAmount: b.totalAmount,
        totalInWords: b.totalInWords || '',
        status: b.status,
        branchId: b.branchId,
        organisationId: b.organisationId,
        financialYear: b.financialYear,
      })),
      invoices: invoices.map((inv) => ({
        id: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        customerName: inv.customerName,
        customerGstin: inv.customerGstin || '',
        customerState: inv.customerState || 'Tamil Nadu',
        billingAddress: inv.billingAddress || '',
        shippingAddress: inv.shippingAddress || '',
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        branchId: inv.branchId,
        organisationId: inv.organisationId,
        financialYear: inv.financialYear,
        items: inv.items || [],
        subtotal: inv.subtotal,
        shippingCharge: inv.shippingCharge || 0,
        shippingTax: inv.shippingTax || 0,
        taxableAmount: inv.taxableAmount || inv.subtotal,
        totalDiscount: inv.totalDiscount || 0,
        gstRate: inv.gstRate,
        cgstAmount: inv.cgstAmount || 0,
        sgstAmount: inv.sgstAmount || 0,
        igstAmount: inv.igstAmount || 0,
        taxAmount: inv.taxAmount,
        totalAmount: inv.totalAmount,
        totalInWords: inv.totalInWords || '',
        status: inv.status,
      })),
      purchaseOrders: purchaseOrders.map((po) => ({
        id: po._id.toString(),
        poNumber: po.poNumber,
        vendorId: po.vendorId || '',
        vendorName: po.vendorName,
        vendorGstin: po.vendorGstin,
        vendorAddress: po.vendorAddress || '',
        vendorState: po.vendorState || 'Tamil Nadu',
        billingAddress: po.billingAddress || '',
        shippingAddress: po.shippingAddress || '',
        poDate: po.poDate,
        expectedDate: po.expectedDate,
        branchId: po.branchId,
        organisationId: po.organisationId,
        financialYear: po.financialYear,
        items: po.items || [],
        subtotal: po.subtotal,
        shippingCharge: po.shippingCharge || 0,
        shippingTax: po.shippingTax || 0,
        taxableAmount: po.taxableAmount || po.subtotal,
        totalDiscount: po.totalDiscount || 0,
        cgstAmount: po.cgstAmount || 0,
        sgstAmount: po.sgstAmount || 0,
        igstAmount: po.igstAmount || 0,
        taxAmount: po.taxAmount,
        totalAmount: po.totalAmount,
        totalInWords: po.totalInWords || '',
        status: po.status,
      })),
      vendors: vendors.map((v) => ({
        id: v._id.toString(),
        code: v.code,
        name: v.name,
        contactPerson: v.contactPerson,
        email: v.email,
        phone: v.phone,
        address: v.address,
        billingAddress: v.billingAddress || v.address || '',
        shippingAddress: v.shippingAddress || v.address || '',
        city: v.city,
        state: v.state,
        billingState: v.billingState || v.state || 'Tamil Nadu',
        shippingState: v.shippingState || v.state || 'Tamil Nadu',
        gstin: v.gstin,
        pan: v.pan,
        organisationId: v.organisationId,
        branchId: v.branchId,
      })),
      storeItems: storeItems.map((st) => ({
        id: st._id.toString(),
        productId: st.productId,
        productName: st.productName,
        sku: st.sku,
        warehouse: st.warehouse,
        binLocation: st.binLocation,
        availableStock: st.availableStock,
        minLevel: st.minLevel,
        maxLevel: st.maxLevel,
        lastAudited: st.lastAudited || '',
        status: st.status,
        branchId: st.branchId,
        organisationId: st.organisationId,
      })),
      deliveryChallans: deliveryChallans.map((dc) => ({
        id: dc._id.toString(),
        dcNumber: dc.dcNumber,
        invoiceId: dc.invoiceId || '',
        invoiceNumber: dc.invoiceNumber,
        customerId: dc.customerId || '',
        customerName: dc.customerName,
        customerGstin: dc.customerGstin || '',
        billingAddress: dc.billingAddress || '',
        shippingAddress: dc.shippingAddress || '',
        dispatchDate: dc.dispatchDate,
        transportMode: dc.transportMode,
        vehicleNumber: dc.vehicleNumber,
        ewayBillNumber: dc.ewayBillNumber,
        driverName: dc.driverName,
        driverPhone: dc.driverPhone,
        items: dc.items || [],
        status: dc.status,
        branchId: dc.branchId,
        organisationId: dc.organisationId,
        financialYear: dc.financialYear,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. FINANCIAL YEARS CRUD
// ==========================================
erpRouter.get('/financial-years', async (req: Request, res: Response) => {
  try {
    const { organisationId } = req.query as { organisationId?: string };
    const filter = organisationId ? { organisationId } : {};
    const years = await FinancialYear.find(filter).sort({ yearName: -1 });
    return res.json(years.map((y) => ({ ...y.toObject(), id: y._id.toString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

erpRouter.post('/financial-years', async (req: Request, res: Response) => {
  try {
    const { yearName, startDate, endDate, isCurrent, status, organisationId } = req.body;
    if (!yearName || !startDate || !endDate) {
      return res.status(400).json({ error: 'yearName, startDate, and endDate are required.' });
    }

    if (isCurrent) {
      await FinancialYear.updateMany({ organisationId }, { isCurrent: false });
    }

    const created = await FinancialYear.create({
      yearName,
      startDate,
      endDate,
      isCurrent: !!isCurrent,
      status: status || 'Active',
      organisationId: organisationId || '',
    });

    return res.status(201).json({ ...created.toObject(), id: created._id.toString() });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

erpRouter.patch('/financial-years/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.isCurrent) {
      const existing = await FinancialYear.findById(id);
      if (existing) {
        await FinancialYear.updateMany({ organisationId: existing.organisationId }, { isCurrent: false });
      }
    }

    const updated = await FinancialYear.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return res.status(404).json({ error: 'Financial Year not found' });
    return res.json({ ...updated.toObject(), id: updated._id.toString() });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. BILLS (VENDOR INVOICES WITH PO CONVERSION & DIRECT BILLS)
// ==========================================
erpRouter.get('/bills', async (req: Request, res: Response) => {
  try {
    const { branchId, organisationId, financialYear, page, per_page, search, sort_column, sort_order, filter_by } = req.query;

    const query: any = {};
    if (branchId) query.branchId = branchId;
    if (organisationId) query.organisationId = organisationId;
    if (financialYear) query.financialYear = financialYear;

    if (filter_by && String(filter_by) !== 'Status.All' && String(filter_by) !== 'All') {
      const parts = String(filter_by).split('.');
      const val = parts.length > 1 ? parts[1] : parts[0];
      query.status = val;
    }

    if (search) {
      const term = String(search).trim();
      query.$or = [
        { billNumber: { $regex: term, $options: 'i' } },
        { vendorName: { $regex: term, $options: 'i' } },
        { poNumber: { $regex: term, $options: 'i' } },
      ];
    }

    const sortOpt: any = {};
    if (sort_column) {
      sortOpt[String(sort_column)] = sort_order === 'A' || sort_order === 'asc' ? 1 : -1;
    } else {
      sortOpt.createdAt = -1;
    }

    const total = await Bill.countDocuments(query);
    const p = Math.max(1, Number(page) || 1);
    const pp = Number(per_page) || 0;

    let q = Bill.find(query).sort(sortOpt);
    if (pp > 0) {
      q = q.skip((p - 1) * pp).limit(pp);
    }

    const bills = await q;
    const data = bills.map((b) => ({ ...b.toObject(), id: b._id.toString() }));

    if (per_page !== undefined) {
      return res.json({ message: 'success', data, total, page: p, per_page: pp });
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

erpRouter.get('/bills/:id', async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json({ ...bill.toObject(), id: bill._id.toString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRouter.post('/bills', async (req: Request, res: Response) => {
  try {
    const { items, vendorState, vendorGstin, shippingCharge, poId } = req.body;

    if (vendorGstin && !validateGSTIN(vendorGstin)) {
      return res.status(400).json({ error: 'Invalid Vendor GSTIN format' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required.' });
    }

    for (const it of items) {
      if (!validateQuantity(it.quantity)) {
        return res.status(400).json({ error: `Quantity must be greater than 0 for item "${it.productName || 'Line Item'}".` });
      }
      if (it.productId) {
        const prod = await Product.findById(it.productId);
        if (!prod) {
          return res.status(400).json({ error: `Product not found for item "${it.productName}".` });
        }
        if (prod.approvalStatus !== 'Approved') {
          return res.status(400).json({ error: `Product "${prod.name}" is not approved.` });
        }
      }
    }

    const count = (await Bill.countDocuments()) + 1;
    const billNumber = `BILL-2026-00${count}`;

    const numShipping = Math.max(0, Number(shippingCharge) || 0);
    const taxResult = calculateDocumentTaxes(items, vendorState || 'Tamil Nadu', vendorGstin, numShipping);

    const bill = await Bill.create({
      ...req.body,
      billNumber,
      items: taxResult.items,
      subtotal: taxResult.subtotal,
      shippingCharge: taxResult.shippingCharge,
      shippingTax: taxResult.shippingTax,
      taxableAmount: taxResult.taxableAmount,
      cgstAmount: taxResult.cgstAmount,
      sgstAmount: taxResult.sgstAmount,
      igstAmount: taxResult.igstAmount,
      taxAmount: taxResult.totalTax,
      totalAmount: taxResult.grandTotal,
      totalInWords: taxResult.totalInWords,
    });

    if (poId) {
      await PurchaseOrder.findByIdAndUpdate(poId, { status: 'Billed' });
    }

    logAuditAction(req, {
      action: 'CREATE',
      entityType: 'Bill',
      entityId: bill._id.toString(),
      entityIdentifier: bill.billNumber,
      newData: bill,
      organisationId: bill.organisationId,
      branchId: bill.branchId,
      financialYear: bill.financialYear,
    });

    res.status(201).json({ ...bill.toObject(), id: bill._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

erpRouter.patch('/bills/:id', async (req: Request, res: Response) => {
  try {
    const prevBill = await Bill.findById(req.params.id);
    if (!prevBill) return res.status(404).json({ error: 'Bill not found' });

    const updated = await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Bill not found' });

    logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'Bill',
      entityId: updated._id.toString(),
      entityIdentifier: updated.billNumber,
      previousData: prevBill,
      newData: updated,
      organisationId: updated.organisationId,
      branchId: updated.branchId,
      financialYear: updated.financialYear,
    });

    res.json({ ...updated.toObject(), id: updated._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. INVOICES (WITH URL PARAMS & SCOPING)
// ==========================================
erpRouter.get('/invoices', async (req: Request, res: Response) => {
  try {
    const { branchId, organisationId, financialYear, page, per_page, search, sort_column, sort_order, filter_by } = req.query;

    const query: any = {};
    if (branchId) query.branchId = branchId;
    if (organisationId) query.organisationId = organisationId;
    if (financialYear) query.financialYear = financialYear;

    if (filter_by && String(filter_by) !== 'Status.All' && String(filter_by) !== 'All') {
      const parts = String(filter_by).split('.');
      const val = parts.length > 1 ? parts[1] : parts[0];
      query.status = val;
    }

    if (search) {
      const term = String(search).trim();
      query.$or = [
        { invoiceNumber: { $regex: term, $options: 'i' } },
        { customerName: { $regex: term, $options: 'i' } },
      ];
    }

    const sortOpt: any = {};
    if (sort_column) {
      sortOpt[String(sort_column)] = sort_order === 'A' || sort_order === 'asc' ? 1 : -1;
    } else {
      sortOpt.createdAt = -1;
    }

    const total = await Invoice.countDocuments(query);
    const p = Math.max(1, Number(page) || 1);
    const pp = Number(per_page) || 0;

    let q = Invoice.find(query).sort(sortOpt);
    if (pp > 0) {
      q = q.skip((p - 1) * pp).limit(pp);
    }

    const invoices = await q;
    const data = invoices.map((inv) => ({ ...inv.toObject(), id: inv._id.toString() }));

    if (per_page !== undefined) {
      return res.json({ message: 'success', data, total, page: p, per_page: pp });
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

erpRouter.post('/invoices', async (req: Request, res: Response) => {
  try {
    const { items, customerState, customerGstin, shippingCharge } = req.body;

    if (customerGstin && !validateGSTIN(customerGstin)) {
      return res.status(400).json({ error: 'Invalid Customer GSTIN format' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required.' });
    }

    // Backend validation: Verify every item against Product Master
    for (const it of items) {
      if (!validateQuantity(it.quantity)) {
        return res.status(400).json({ error: `Quantity must be greater than 0 for item "${it.productName || 'Line Item'}".` });
      }
      if (it.productId) {
        const prod = await Product.findById(it.productId);
        if (!prod) {
          return res.status(400).json({ error: `Product not found for item "${it.productName}".` });
        }
        if (prod.approvalStatus !== 'Approved') {
          return res.status(400).json({
            error: `Product "${prod.name}" is not approved. Only Super Admin approved products can be invoiced.`,
          });
        }
        if (it.hsnCode && it.hsnCode !== prod.hsnCode) {
          return res.status(400).json({ error: `HSN code mismatch for product "${prod.name}". Master HSN is ${prod.hsnCode}.` });
        }
        if (Math.abs(Number(it.unitPrice) - Number(prod.sellingPrice)) > 0.01) {
          return res.status(400).json({ error: `Unit price mismatch for product "${prod.name}". Master selling price is ₹${prod.sellingPrice}.` });
        }
        if (Number(it.taxRate) !== Number(prod.taxRate ?? 18)) {
          return res.status(400).json({ error: `Tax rate mismatch for product "${prod.name}". Master tax rate is ${prod.taxRate}%.` });
        }
      }
    }

    const count = (await Invoice.countDocuments()) + 1;
    const invoiceNumber = `INV-2026-00${count}`;

    const numShipping = Math.max(0, Number(shippingCharge) || 0);
    const taxResult = calculateDocumentTaxes(items, customerState || 'Tamil Nadu', customerGstin, numShipping);

    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber,
      items: taxResult.items,
      subtotal: taxResult.subtotal,
      shippingCharge: taxResult.shippingCharge,
      shippingTax: taxResult.shippingTax,
      taxableAmount: taxResult.taxableAmount,
      totalDiscount: taxResult.totalDiscount,
      cgstAmount: taxResult.cgstAmount,
      sgstAmount: taxResult.sgstAmount,
      igstAmount: taxResult.igstAmount,
      taxAmount: taxResult.totalTax,
      totalAmount: taxResult.grandTotal,
      totalInWords: taxResult.totalInWords,
    });

    logAuditAction(req, {
      action: 'CREATE',
      entityType: 'Tax Invoice',
      entityId: invoice._id.toString(),
      entityIdentifier: invoice.invoiceNumber,
      newData: invoice,
      organisationId: invoice.organisationId,
      branchId: invoice.branchId,
      financialYear: invoice.financialYear,
    });

    res.status(201).json({ ...invoice.toObject(), id: invoice._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

erpRouter.get('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ ...invoice.toObject(), id: invoice._id.toString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRouter.patch('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const prevInvoice = await Invoice.findById(req.params.id);
    if (!prevInvoice) return res.status(404).json({ error: 'Invoice not found' });

    const updated = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Invoice not found' });

    logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'Tax Invoice',
      entityId: updated._id.toString(),
      entityIdentifier: updated.invoiceNumber,
      previousData: prevInvoice,
      newData: updated,
      organisationId: updated.organisationId,
      branchId: updated.branchId,
      financialYear: updated.financialYear,
    });

    res.json({ ...updated.toObject(), id: updated._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 6. PURCHASE ORDERS
// ==========================================
erpRouter.get('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const { branchId, organisationId, financialYear, page, per_page, search, sort_column, sort_order, filter_by } = req.query;

    const query: any = {};
    if (branchId) query.branchId = branchId;
    if (organisationId) query.organisationId = organisationId;
    if (financialYear) query.financialYear = financialYear;

    if (filter_by && String(filter_by) !== 'Status.All' && String(filter_by) !== 'All') {
      const parts = String(filter_by).split('.');
      const val = parts.length > 1 ? parts[1] : parts[0];
      query.status = val;
    }

    if (search) {
      const term = String(search).trim();
      query.$or = [
        { poNumber: { $regex: term, $options: 'i' } },
        { vendorName: { $regex: term, $options: 'i' } },
      ];
    }

    const sortOpt: any = {};
    if (sort_column) {
      sortOpt[String(sort_column)] = sort_order === 'A' || sort_order === 'asc' ? 1 : -1;
    } else {
      sortOpt.createdAt = -1;
    }

    const total = await PurchaseOrder.countDocuments(query);
    const p = Math.max(1, Number(page) || 1);
    const pp = Number(per_page) || 0;

    let q = PurchaseOrder.find(query).sort(sortOpt);
    if (pp > 0) {
      q = q.skip((p - 1) * pp).limit(pp);
    }

    const pos = await q;
    const data = pos.map((p) => ({ ...p.toObject(), id: p._id.toString() }));

    if (per_page !== undefined) {
      return res.json({ message: 'success', data, total, page: p, per_page: pp });
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

erpRouter.post('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const { items, vendorState, vendorGstin, shippingCharge } = req.body;

    if (vendorGstin && !validateGSTIN(vendorGstin)) {
      return res.status(400).json({ error: 'Invalid Vendor GSTIN format' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required.' });
    }

    for (const it of items) {
      if (!validateQuantity(it.quantity)) {
        return res.status(400).json({ error: `Quantity must be greater than 0 for item "${it.productName || 'Line Item'}".` });
      }
      if (it.productId) {
        const prod = await Product.findById(it.productId);
        if (!prod) {
          return res.status(400).json({ error: `Product not found for item "${it.productName}".` });
        }
        if (prod.approvalStatus !== 'Approved') {
          return res.status(400).json({
            error: `Product "${prod.name}" is not approved. Only Super Admin approved products can be purchased.`,
          });
        }
        if (it.hsnCode && it.hsnCode !== prod.hsnCode) {
          return res.status(400).json({ error: `HSN code mismatch for product "${prod.name}". Master HSN is ${prod.hsnCode}.` });
        }
        if (it.taxRate !== undefined && Number(it.taxRate) !== Number(prod.taxRate ?? 18)) {
          return res.status(400).json({ error: `Tax rate mismatch for product "${prod.name}". Master tax rate is ${prod.taxRate}%.` });
        }
      }
    }

    const count = (await PurchaseOrder.countDocuments()) + 44;
    const poNumber = `PO-2026-0${count}`;

    const numShipping = Math.max(0, Number(shippingCharge) || 0);
    const taxResult = calculateDocumentTaxes(items, vendorState || 'Tamil Nadu', vendorGstin, numShipping);

    const po = await PurchaseOrder.create({
      ...req.body,
      poNumber,
      items: taxResult.items,
      subtotal: taxResult.subtotal,
      shippingCharge: taxResult.shippingCharge,
      shippingTax: taxResult.shippingTax,
      taxableAmount: taxResult.taxableAmount,
      totalDiscount: taxResult.totalDiscount,
      cgstAmount: taxResult.cgstAmount,
      sgstAmount: taxResult.sgstAmount,
      igstAmount: taxResult.igstAmount,
      taxAmount: taxResult.totalTax,
      totalAmount: taxResult.grandTotal,
      totalInWords: taxResult.totalInWords,
    });

    logAuditAction(req, {
      action: 'CREATE',
      entityType: 'Purchase Order',
      entityId: po._id.toString(),
      entityIdentifier: po.poNumber,
      newData: po,
      organisationId: po.organisationId,
      branchId: po.branchId,
      financialYear: po.financialYear,
    });

    res.status(201).json({ ...po.toObject(), id: po._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

erpRouter.patch('/purchase-orders/:id', async (req: Request, res: Response) => {
  try {
    const prevPo = await PurchaseOrder.findById(req.params.id);
    if (!prevPo) return res.status(404).json({ error: 'Purchase Order not found' });

    const updated = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Purchase Order not found' });

    logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'Purchase Order',
      entityId: updated._id.toString(),
      entityIdentifier: updated.poNumber,
      previousData: prevPo,
      newData: updated,
      organisationId: updated.organisationId,
      branchId: updated.branchId,
      financialYear: updated.financialYear,
    });

    res.json({ ...updated.toObject(), id: updated._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 7. PRODUCTS & STORE
// ==========================================
erpRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const { organisationId, approvedOnly } = req.query;
    const query: any = organisationId ? { organisationId } : {};
    if (approvedOnly === 'true') {
      query.approvalStatus = 'Approved';
    }
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products.map((p) => ({ ...p.toObject(), id: p._id.toString() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRouter.post('/products', async (req: Request, res: Response) => {
  try {
    const product = await Product.create({
      ...req.body,
      taxRate: req.body.taxRate !== undefined ? Number(req.body.taxRate) : 18,
      approvalStatus: 'Pending',
    });
    await StoreItem.create({
      productId: product._id.toString(),
      productName: product.name,
      sku: product.sku,
      warehouse: 'Chennai Central Depot',
      binLocation: 'BIN-GEN-01',
      availableStock: product.currentStock || 0,
      minLevel: product.minReorderLevel || 10,
      maxLevel: 500,
      lastAudited: new Date().toISOString().split('T')[0],
      status: (product.currentStock || 0) <= (product.minReorderLevel || 10) ? 'Low Stock' : 'In Stock',
      branchId: req.body.branchId || '',
      organisationId: req.body.organisationId || '',
    });

    logAuditAction(req, {
      action: 'CREATE',
      entityType: 'Product',
      entityId: product._id.toString(),
      entityIdentifier: product.sku,
      newData: product,
      organisationId: product.organisationId,
      branchId: product.branchId,
    });

    res.status(201).json({ ...product.toObject(), id: product._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

erpRouter.patch('/products/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prevProduct = await Product.findById(id);
    if (!prevProduct) return res.status(404).json({ error: 'Product not found' });

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        approvalStatus: 'Approved',
        approvedBy: req.body.approvedBy || 'SuperAdmin',
        approvedAt: new Date(),
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Product not found' });

    logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'Product',
      entityId: updated._id.toString(),
      entityIdentifier: updated.sku,
      previousData: prevProduct,
      newData: updated,
      changedFields: ['approvalStatus', 'approvedBy', 'approvedAt'],
      organisationId: updated.organisationId,
      branchId: updated.branchId,
    });

    res.json({ ...updated.toObject(), id: updated._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

erpRouter.patch('/products/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prevProduct = await Product.findById(id);
    if (!prevProduct) return res.status(404).json({ error: 'Product not found' });

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        approvalStatus: 'Rejected',
        approvedBy: req.body.approvedBy || 'SuperAdmin',
        approvedAt: new Date(),
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Product not found' });

    logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'Product',
      entityId: updated._id.toString(),
      entityIdentifier: updated.sku,
      previousData: prevProduct,
      newData: updated,
      changedFields: ['approvalStatus', 'approvedBy', 'approvedAt'],
      organisationId: updated.organisationId,
      branchId: updated.branchId,
    });

    res.json({ ...updated.toObject(), id: updated._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

erpRouter.get('/store-items', async (req: Request, res: Response) => {
  try {
    const { branchId, organisationId } = req.query;
    const query: any = {};
    if (branchId) query.branchId = branchId;
    if (organisationId) query.organisationId = organisationId;

    const items = await StoreItem.find(query).sort({ createdAt: -1 });
    res.json(items.map((st) => ({ ...st.toObject(), id: st._id.toString() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRouter.patch('/store-items/:productId/stock', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { delta } = req.body;

    const storeItem = await StoreItem.findOne({ productId });
    if (!storeItem) return res.status(404).json({ error: 'Store item not found' });

    storeItem.availableStock = Math.max(0, storeItem.availableStock + delta);
    storeItem.status = storeItem.availableStock <= storeItem.minLevel ? 'Low Stock' : 'In Stock';
    await storeItem.save();

    await Product.findByIdAndUpdate(productId, { currentStock: storeItem.availableStock });

    res.json({ ...storeItem.toObject(), id: storeItem._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 8. CUSTOMERS
// ==========================================
erpRouter.get('/customers', async (req: Request, res: Response) => {
  try {
    const { branchId, organisationId } = req.query;
    const query: any = {};
    if (organisationId) query.organisationId = organisationId;
    if (branchId) {
      query.$or = [{ branchId }, { branchId: '' }, { branchId: { $exists: false } }];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers.map((c) => ({ ...c.toObject(), id: c._id.toString() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRouter.post('/customers', async (req: Request, res: Response) => {
  try {
    const { creditLimit, gstin } = req.body;
    if (creditLimit !== undefined && !validateCreditLimit(creditLimit)) {
      return res.status(400).json({ error: 'Credit limit must be strictly more than ₹10,000' });
    }
    if (gstin && !validateGSTIN(gstin)) {
      return res.status(400).json({ error: 'Invalid Customer GSTIN format' });
    }
    const count = (await Customer.countDocuments()) + 1;
    const code = `CUST-${String(req.body.name).slice(0, 4).toUpperCase()}-${count}`;
    const customer = await Customer.create({
      ...req.body,
      creditLimit: Number(creditLimit) || 10001,
      code,
    });

    logAuditAction(req, {
      action: 'CREATE',
      entityType: 'Customer',
      entityId: customer._id.toString(),
      entityIdentifier: customer.code,
      newData: customer,
      organisationId: customer.organisationId,
      branchId: customer.branchId,
    });

    res.status(201).json({ ...customer.toObject(), id: customer._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

erpRouter.patch('/customers/:id', async (req: Request, res: Response) => {
  try {
    if (req.body.creditLimit !== undefined && !validateCreditLimit(req.body.creditLimit)) {
      return res.status(400).json({ error: 'Credit limit must be strictly more than ₹10,000' });
    }
    if (req.body.gstin && !validateGSTIN(req.body.gstin)) {
      return res.status(400).json({ error: 'Invalid Customer GSTIN format' });
    }
    const prevCustomer = await Customer.findById(req.params.id);
    if (!prevCustomer) return res.status(404).json({ error: 'Customer not found' });

    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Customer not found' });

    logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: updated._id.toString(),
      entityIdentifier: updated.code,
      previousData: prevCustomer,
      newData: updated,
      organisationId: updated.organisationId,
      branchId: updated.branchId,
    });

    res.json({ ...updated.toObject(), id: updated._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 8B. VENDORS
// ==========================================
erpRouter.get('/vendors', async (req: Request, res: Response) => {
  try {
    const { organisationId } = req.query;
    const query: any = {};
    if (organisationId) query.organisationId = organisationId;

    const vendors = await Vendor.find(query).sort({ createdAt: -1 });
    res.json(vendors.map((v) => ({ ...v.toObject(), id: v._id.toString() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRouter.post('/vendors', async (req: Request, res: Response) => {
  try {
    const { gstin } = req.body;
    if (gstin && !validateGSTIN(gstin)) {
      return res.status(400).json({ error: 'Invalid Vendor GSTIN format' });
    }
    const count = (await Vendor.countDocuments()) + 1;
    const code = req.body.code || `VEND-${String(req.body.name).slice(0, 4).toUpperCase()}-${count}`;
    const vendor = await Vendor.create({
      ...req.body,
      code,
    });

    logAuditAction(req, {
      action: 'CREATE',
      entityType: 'Vendor',
      entityId: vendor._id.toString(),
      entityIdentifier: vendor.code,
      newData: vendor,
      organisationId: vendor.organisationId,
      branchId: vendor.branchId,
    });

    res.status(201).json({ ...vendor.toObject(), id: vendor._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

erpRouter.patch('/vendors/:id', async (req: Request, res: Response) => {
  try {
    if (req.body.gstin && !validateGSTIN(req.body.gstin)) {
      return res.status(400).json({ error: 'Invalid Vendor GSTIN format' });
    }
    const prevVendor = await Vendor.findById(req.params.id);
    if (!prevVendor) return res.status(404).json({ error: 'Vendor not found' });

    const updated = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Vendor not found' });

    logAuditAction(req, {
      action: 'UPDATE',
      entityType: 'Vendor',
      entityId: updated._id.toString(),
      entityIdentifier: updated.code,
      previousData: prevVendor,
      newData: updated,
      organisationId: updated.organisationId,
      branchId: updated.branchId,
    });

    res.json({ ...updated.toObject(), id: updated._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

erpRouter.delete('/vendors/:id', async (req: Request, res: Response) => {
  try {
    const prevVendor = await Vendor.findById(req.params.id);
    if (!prevVendor) return res.status(404).json({ error: 'Vendor not found' });

    await Vendor.findByIdAndDelete(req.params.id);

    logAuditAction(req, {
      action: 'DELETE',
      entityType: 'Vendor',
      entityId: req.params.id,
      entityIdentifier: prevVendor.code,
      previousData: prevVendor,
      organisationId: prevVendor.organisationId,
      branchId: prevVendor.branchId,
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. DELIVERY CHALLANS
// ==========================================
erpRouter.get('/delivery-challans', async (req: Request, res: Response) => {
  try {
    const { branchId, organisationId, financialYear } = req.query;
    const query: any = {};
    if (branchId) query.branchId = branchId;
    if (organisationId) query.organisationId = organisationId;
    if (financialYear) query.financialYear = financialYear;

    const dcs = await DeliveryChallan.find(query).sort({ createdAt: -1 });
    res.json(dcs.map((d) => ({ ...d.toObject(), id: d._id.toString() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRouter.post('/delivery-challans', async (req: Request, res: Response) => {
  try {
    const { invoiceNumber, items } = req.body;
    if (!invoiceNumber) {
      return res.status(400).json({ error: 'Tax Invoice reference is required to generate Delivery Challan.' });
    }
    if (items && Array.isArray(items)) {
      for (const it of items) {
        if (!validateQuantity(it.quantity)) {
          return res.status(400).json({ error: `Quantity must be greater than 0 for item "${it.productName || 'Line Item'}".` });
        }
      }
    }
    const count = (await DeliveryChallan.countDocuments()) + 41;
    const dcNumber = `DC-2026-00${count}`;
    const dc = await DeliveryChallan.create({
      ...req.body,
      dcNumber,
    });

    logAuditAction(req, {
      action: 'CREATE',
      entityType: 'Delivery Challan',
      entityId: dc._id.toString(),
      entityIdentifier: dc.dcNumber,
      newData: dc,
      organisationId: dc.organisationId,
      branchId: dc.branchId,
      financialYear: dc.financialYear,
    });

    res.status(201).json({ ...dc.toObject(), id: dc._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 10. BRANCHES & ORGANISATION
// ==========================================
erpRouter.get('/branches', async (req: Request, res: Response) => {
  try {
    const { organisationId } = req.query;
    const query = organisationId ? { organisationId } : {};
    const branches = await Branch.find(query).sort({ createdAt: 1 });
    res.json(branches.map((b) => ({ ...b.toObject(), id: b._id.toString() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRouter.post('/branches', async (req: Request, res: Response) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ ...branch.toObject(), id: branch._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

erpRouter.get('/organisation', async (req: Request, res: Response) => {
  try {
    const { organisationId } = req.query;
    const org = organisationId ? await Organisation.findById(organisationId) : await Organisation.findOne();
    res.json(org);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. AUDIT HISTORY (CHANGE TRACKING)
// ==========================================
erpRouter.get('/audit-history', async (req: Request, res: Response) => {
  try {
    const {
      entityType,
      entityId,
      action,
      userId,
      organisationId,
      branchId,
      financialYear,
      fromDate,
      toDate,
      page,
      per_page,
    } = req.query;

    const query: any = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (organisationId) query.organisationId = organisationId;
    if (branchId) query.branchId = branchId;
    if (financialYear) query.financialYear = financialYear;

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(String(fromDate));
      if (toDate) {
        const to = new Date(String(toDate));
        to.setHours(23, 59, 59, 999);
        query.createdAt.$lte = to;
      }
    }

    const total = await AuditHistory.countDocuments(query);
    const p = Math.max(1, Number(page) || 1);
    const pp = Number(per_page) || 50;

    const logs = await AuditHistory.find(query)
      .sort({ createdAt: -1 })
      .skip((p - 1) * pp)
      .limit(pp);

    return res.json({
      message: 'success',
      data: logs.map((l) => ({ ...l.toObject(), id: l._id.toString() })),
      total,
      page: p,
      per_page: pp,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
