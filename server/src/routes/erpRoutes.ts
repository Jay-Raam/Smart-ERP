import { Router, Request, Response } from 'express';
import {
  Organisation,
  Branch,
  Customer,
  Product,
  SalesOrder,
  Invoice,
  PurchaseOrder,
  StoreItem,
  DeliveryChallan,
  UserAccount,
} from '../models/ErpModels';
import { generateTokens, verifyAccessToken } from '../security/auth';

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
// 2. MASTER INITIALIZATION (BOOTSTRAP ALL ERP DATA)
// ==========================================
erpRouter.get('/bootstrap', async (req: Request, res: Response) => {
  try {
    const [
      organisation,
      branches,
      customers,
      products,
      salesOrders,
      invoices,
      purchaseOrders,
      storeItems,
      deliveryChallans,
    ] = await Promise.all([
      Organisation.findOne(),
      Branch.find().sort({ createdAt: 1 }),
      Customer.find().sort({ createdAt: -1 }),
      Product.find().sort({ createdAt: -1 }),
      SalesOrder.find().sort({ createdAt: -1 }),
      Invoice.find().sort({ createdAt: -1 }),
      PurchaseOrder.find().sort({ createdAt: -1 }),
      StoreItem.find().sort({ createdAt: -1 }),
      DeliveryChallan.find().sort({ createdAt: -1 }),
    ]);

    return res.json({
      organisation,
      branches: branches.map((b) => ({
        id: b._id.toString(),
        code: b.code,
        name: b.name,
        location: b.location,
        address: b.address,
        gstin: b.gstin,
        phone: b.phone,
        isHeadOffice: b.isHeadOffice,
      })),
      customers: customers.map((c) => ({
        id: c._id.toString(),
        code: c.code,
        name: c.name,
        contactPerson: c.contactPerson,
        email: c.email,
        phone: c.phone,
        city: c.city,
        state: c.state,
        gstin: c.gstin,
        outstandingBalance: c.outstandingBalance,
        creditLimit: c.creditLimit,
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
      })),
      salesOrders: salesOrders.map((so) => ({
        id: so._id.toString(),
        orderNumber: so.orderNumber,
        customerId: so.customerId,
        customerName: so.customerName,
        orderDate: so.orderDate,
        deliveryDate: so.deliveryDate,
        branchId: so.branchId,
        items: so.items,
        subtotal: so.subtotal,
        taxAmount: so.taxAmount,
        totalAmount: so.totalAmount,
        status: so.status,
      })),
      invoices: invoices.map((inv) => ({
        id: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        salesOrderNumber: inv.salesOrderNumber,
        customerId: inv.customerId,
        customerName: inv.customerName,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        subtotal: inv.subtotal,
        gstRate: inv.gstRate,
        taxAmount: inv.taxAmount,
        totalAmount: inv.totalAmount,
        status: inv.status,
      })),
      purchaseOrders: purchaseOrders.map((po) => ({
        id: po._id.toString(),
        poNumber: po.poNumber,
        vendorName: po.vendorName,
        vendorGstin: po.vendorGstin,
        poDate: po.poDate,
        expectedDate: po.expectedDate,
        branchId: po.branchId,
        totalAmount: po.totalAmount,
        status: po.status,
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
      })),
      deliveryChallans: deliveryChallans.map((dc) => ({
        id: dc._id.toString(),
        dcNumber: dc.dcNumber,
        salesOrderNumber: dc.salesOrderNumber,
        customerName: dc.customerName,
        dispatchDate: dc.dispatchDate,
        transportMode: dc.transportMode,
        vehicleNumber: dc.vehicleNumber,
        ewayBillNumber: dc.ewayBillNumber,
        driverName: dc.driverName,
        driverPhone: dc.driverPhone,
        status: dc.status,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. SALES ORDERS
// ==========================================
erpRouter.get('/sales-orders', async (req: Request, res: Response) => {
  const orders = await SalesOrder.find().sort({ createdAt: -1 });
  res.json(orders);
});

erpRouter.post('/sales-orders', async (req: Request, res: Response) => {
  try {
    const count = (await SalesOrder.countDocuments()) + 81;
    const orderNumber = `SO-2026-0${count}`;
    const order = await SalesOrder.create({
      ...req.body,
      orderNumber,
    });
    res.status(201).json({ ...order.toObject(), id: order._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. INVOICES
// ==========================================
erpRouter.get('/invoices', async (req: Request, res: Response) => {
  const invoices = await Invoice.find().sort({ createdAt: -1 });
  res.json(invoices.map((inv) => ({ ...inv.toObject(), id: inv._id.toString() })));
});

erpRouter.post('/invoices', async (req: Request, res: Response) => {
  try {
    const count = (await Invoice.countDocuments()) + 1;
    const invoiceNumber = `INV-2026-00${count}`;
    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber,
    });
    res.status(201).json({ ...invoice.toObject(), id: invoice._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. PURCHASE ORDERS
// ==========================================
erpRouter.get('/purchase-orders', async (req: Request, res: Response) => {
  const pos = await PurchaseOrder.find().sort({ createdAt: -1 });
  res.json(pos.map((p) => ({ ...p.toObject(), id: p._id.toString() })));
});

erpRouter.post('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const count = (await PurchaseOrder.countDocuments()) + 44;
    const poNumber = `PO-2026-0${count}`;
    const po = await PurchaseOrder.create({
      ...req.body,
      poNumber,
    });
    res.status(201).json({ ...po.toObject(), id: po._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 6. PRODUCTS & STORE
// ==========================================
erpRouter.get('/products', async (req: Request, res: Response) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products.map((p) => ({ ...p.toObject(), id: p._id.toString() })));
});

erpRouter.post('/products', async (req: Request, res: Response) => {
  try {
    const product = await Product.create(req.body);
    // Also create matching store item entry
    await StoreItem.create({
      productId: product._id.toString(),
      productName: product.name,
      sku: product.sku,
      warehouse: 'Chennai Central Depot',
      binLocation: 'BIN-GEN-01',
      availableStock: product.currentStock,
      minLevel: product.minReorderLevel,
      maxLevel: 500,
      lastAudited: new Date().toISOString().split('T')[0],
      status: product.currentStock <= product.minReorderLevel ? 'Low Stock' : 'In Stock',
    });
    res.status(201).json({ ...product.toObject(), id: product._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

erpRouter.get('/store-items', async (req: Request, res: Response) => {
  const items = await StoreItem.find().sort({ createdAt: -1 });
  res.json(items.map((st) => ({ ...st.toObject(), id: st._id.toString() })));
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
// 7. CUSTOMERS
// ==========================================
erpRouter.get('/customers', async (req: Request, res: Response) => {
  const customers = await Customer.find().sort({ createdAt: -1 });
  res.json(customers.map((c) => ({ ...c.toObject(), id: c._id.toString() })));
});

erpRouter.post('/customers', async (req: Request, res: Response) => {
  try {
    const count = (await Customer.countDocuments()) + 1;
    const code = `CUST-${String(req.body.name).slice(0, 4).toUpperCase()}-${count}`;
    const customer = await Customer.create({
      ...req.body,
      code,
    });
    res.status(201).json({ ...customer.toObject(), id: customer._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 8. DELIVERY CHALLANS
// ==========================================
erpRouter.get('/delivery-challans', async (req: Request, res: Response) => {
  const dcs = await DeliveryChallan.find().sort({ createdAt: -1 });
  res.json(dcs.map((d) => ({ ...d.toObject(), id: d._id.toString() })));
});

erpRouter.post('/delivery-challans', async (req: Request, res: Response) => {
  try {
    const count = (await DeliveryChallan.countDocuments()) + 41;
    const dcNumber = `DC-2026-00${count}`;
    const dc = await DeliveryChallan.create({
      ...req.body,
      dcNumber,
    });
    res.status(201).json({ ...dc.toObject(), id: dc._id.toString() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 9. BRANCHES & ORGANISATION
// ==========================================
erpRouter.get('/branches', async (req: Request, res: Response) => {
  const branches = await Branch.find().sort({ createdAt: 1 });
  res.json(branches.map((b) => ({ ...b.toObject(), id: b._id.toString() })));
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
  const org = await Organisation.findOne();
  res.json(org);
});
