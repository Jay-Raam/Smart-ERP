import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import {
  Organisation,
  Branch,
  FinancialYear,
  Customer,
  Product,
  SalesOrder,
  Invoice,
  PurchaseOrder,
  StoreItem,
  DeliveryChallan,
  UserAccount,
  Vendor,
} from './models/ErpModels';
import { calculateDocumentTaxes } from './utils/taxCalculation';

const MONGO_URI = process.env.MONGO_URI || '';

export async function seedDatabase() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is required for seeding!');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas for seeding...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas!');

  // Clear existing collections
  await Promise.all([
    Organisation.deleteMany({}),
    Branch.deleteMany({}),
    FinancialYear.deleteMany({}),
    Customer.deleteMany({}),
    Product.deleteMany({}),
    SalesOrder.deleteMany({}),
    Invoice.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    StoreItem.deleteMany({}),
    DeliveryChallan.deleteMany({}),
    UserAccount.deleteMany({}),
    Vendor.deleteMany({}),
  ]);
  console.log('Cleaned old records.');

  // 1. Seed Organisation
  const org = await Organisation.create({
    name: 'Smart Enterprise Industries Ltd.',
    cin: 'U29100TN2026PLC089211',
    gstin: '33AAACT1024K1Z8',
    pan: 'AAACT1024K',
    email: 'operations@smarterp.com',
    phone: '+91 44 2839 4910',
    website: 'https://smart.erp.com',
    address: 'Plot 48/A, Industrial Estate, Guindy, Chennai - 600032, Tamil Nadu, India',
  });
  console.log('✔ Seeded Organisation:', org.name);

  // 2. Seed Branches
  const branches = await Branch.insertMany([
    {
      code: 'BR-CHN-01',
      name: 'Chennai Central HQ & Assembly Plant',
      location: 'Guindy, Chennai',
      address: 'Plot 48/A, Industrial Estate, Guindy, Chennai - 600032',
      gstin: '33AAACT1024K1Z8',
      phone: '+91 44 2839 4910',
      isHeadOffice: true,
      organisationId: org._id.toString(),
    },
    {
      code: 'BR-CBE-02',
      name: 'Coimbatore Heavy Fabrication Unit',
      location: 'Peelamedu, Coimbatore',
      address: 'SF 204, Trichy Road, Peelamedu, Coimbatore - 641004',
      gstin: '33AAACT1024K1Z8',
      phone: '+91 422 257 8820',
      isHeadOffice: false,
      organisationId: org._id.toString(),
    },
    {
      code: 'BR-BLR-03',
      name: 'Bengaluru Tech & Distribution Depot',
      location: 'Peenya, Bengaluru',
      address: 'Industrial Suburb, Peenya 2nd Stage, Bengaluru - 560058',
      gstin: '29AAACT1024K1Z2',
      phone: '+91 80 4120 7711',
      isHeadOffice: false,
      organisationId: org._id.toString(),
    },
  ]);
  console.log(`✔ Seeded ${branches.length} Branches.`);

  // 3. Seed Financial Years
  const financialYears = await FinancialYear.insertMany([
    {
      yearName: '2024-2025',
      startDate: '2024-04-01',
      endDate: '2025-03-31',
      isCurrent: false,
      status: 'Closed',
      organisationId: org._id.toString(),
    },
    {
      yearName: '2025-2026',
      startDate: '2025-04-01',
      endDate: '2026-03-31',
      isCurrent: false,
      status: 'Active',
      organisationId: org._id.toString(),
    },
    {
      yearName: '2026-2027',
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      isCurrent: true,
      status: 'Active',
      organisationId: org._id.toString(),
    },
  ]);
  console.log(`✔ Seeded ${financialYears.length} Financial Years.`);

  // 4. Seed Users with multi-branch role mappings
  const users = await UserAccount.insertMany([
    {
      email: 'jay.raam@smart.com',
      mobile: '9840199882',
      passwordHash: 'password123',
      name: 'Jay Raam',
      role: 'SuperAdmin',
      branchId: branches[0]._id.toString(),
      branchName: branches[0].name,
      organisationId: org._id.toString(),
      roles: [
        {
          organisationId: org._id.toString(),
          organisationName: org.name,
          branchId: branches[0]._id.toString(),
          branchName: branches[0].name,
          roleName: 'SuperAdmin',
          userType: 'SuperAdmin',
        },
        {
          organisationId: org._id.toString(),
          organisationName: org.name,
          branchId: branches[1]._id.toString(),
          branchName: branches[1].name,
          roleName: 'Operations Director',
          userType: 'SuperAdmin',
        },
        {
          organisationId: org._id.toString(),
          organisationName: org.name,
          branchId: branches[2]._id.toString(),
          branchName: branches[2].name,
          roleName: 'Executive Supervisor',
          userType: 'SuperAdmin',
        },
      ],
    },
    {
      email: 'priya.sharma@smart.com',
      mobile: '9840112345',
      passwordHash: 'password123',
      name: 'Priya Sharma',
      role: 'Manager',
      branchId: branches[1]._id.toString(),
      branchName: branches[1].name,
      organisationId: org._id.toString(),
      roles: [
        {
          organisationId: org._id.toString(),
          organisationName: org.name,
          branchId: branches[1]._id.toString(),
          branchName: branches[1].name,
          roleName: 'Plant Manager',
          userType: 'Manager',
        },
      ],
    },
    {
      email: 'admin@smart.com',
      mobile: '9840155555',
      passwordHash: 'password123',
      name: 'Operations Admin',
      role: 'Admin',
      branchId: branches[0]._id.toString(),
      branchName: branches[0].name,
      organisationId: org._id.toString(),
      roles: [
        {
          organisationId: org._id.toString(),
          organisationName: org.name,
          branchId: branches[0]._id.toString(),
          branchName: branches[0].name,
          roleName: 'Operations Admin',
          userType: 'Admin',
        },
      ],
    },
  ]);
  console.log(`✔ Seeded ${users.length} User Accounts.`);

  // 5. Seed Customers (Organisation level with branch assignment)
  const customers = await Customer.insertMany([
    {
      code: 'CUST-TATA',
      name: 'Tata Motors Limited',
      contactPerson: 'Ramesh Sundaram (VP Procurement)',
      email: 'ramesh.sundaram@tatamotors.com',
      phone: '+91 98401 23890',
      address: 'Pimpri Industrial Area, Sector 4, Pune - 411018, Maharashtra',
      billingAddress: 'Pimpri Industrial Area, Sector 4, Pune - 411018, Maharashtra',
      shippingAddress: 'Plot 12, SIPCOT Industrial Park, Sriperumbudur, Kanchipuram - 602105, Tamil Nadu',
      city: 'Pune / Chennai',
      state: 'Maharashtra',
      billingState: 'Maharashtra',
      shippingState: 'Tamil Nadu',
      gstin: '27AAACT2727Q1ZW',
      outstandingBalance: 1450000,
      creditLimit: 5000000,
      organisationId: org._id.toString(),
      branchId: branches[0]._id.toString(),
    },
    {
      code: 'CUST-LT',
      name: 'Larsen & Toubro Heavy Engineering',
      contactPerson: 'Ananya Deshmukh (Lead Project Engg)',
      email: 'ananya.d@lntecc.com',
      phone: '+91 97890 54321',
      address: 'L&T House, Ballard Estate, Mumbai - 400001, Maharashtra',
      billingAddress: 'L&T House, Ballard Estate, Mumbai - 400001, Maharashtra',
      shippingAddress: 'L&T Heavy Engineering Complex, Eachanari, Coimbatore - 641021, Tamil Nadu',
      city: 'Mumbai / Coimbatore',
      state: 'Maharashtra',
      billingState: 'Maharashtra',
      shippingState: 'Tamil Nadu',
      gstin: '27AAACL0149C1ZM',
      outstandingBalance: 820000,
      creditLimit: 3000000,
      organisationId: org._id.toString(),
      branchId: branches[1]._id.toString(),
    },
    {
      code: 'CUST-BHEL',
      name: 'Bharat Heavy Electricals Ltd (BHEL)',
      contactPerson: 'K. Balasubramanian (AGM Supply Chain)',
      email: 'k.bala@bhel.in',
      phone: '+91 94440 98765',
      address: 'High Pressure Boiler Plant, Tiruchirappalli - 620014, Tamil Nadu',
      billingAddress: 'High Pressure Boiler Plant, Tiruchirappalli - 620014, Tamil Nadu',
      shippingAddress: 'Central Stores, Unit 2, BHEL Complex, Trichy - 620014, Tamil Nadu',
      city: 'Trichy',
      state: 'Tamil Nadu',
      billingState: 'Tamil Nadu',
      shippingState: 'Tamil Nadu',
      gstin: '33AAACB4146P1ZL',
      outstandingBalance: 420000,
      creditLimit: 2500000,
      organisationId: org._id.toString(),
      branchId: branches[0]._id.toString(),
    },
    {
      code: 'CUST-ASHOK',
      name: 'Ashok Leyland Defence & Commercial',
      contactPerson: 'Siddharth Varma (DGM Ops)',
      email: 'siddharth.v@ashokleyland.com',
      phone: '+91 99620 11223',
      address: 'No 1, Sardar Patel Road, Guindy, Chennai - 600032, Tamil Nadu',
      billingAddress: 'No 1, Sardar Patel Road, Guindy, Chennai - 600032, Tamil Nadu',
      shippingAddress: 'Plant II, Ennore High Road, Chennai - 600057, Tamil Nadu',
      city: 'Chennai',
      state: 'Tamil Nadu',
      billingState: 'Tamil Nadu',
      shippingState: 'Tamil Nadu',
      gstin: '33AAACA1991F1Z1',
      outstandingBalance: 2100000,
      creditLimit: 6000000,
      organisationId: org._id.toString(),
      branchId: branches[0]._id.toString(),
    },
    {
      code: 'CUST-RELIANCE',
      name: 'Reliance Petrochemicals Jamnagar',
      contactPerson: 'Hardik Patel (Head Material)',
      email: 'hardik.patel@ril.com',
      phone: '+91 98250 88771',
      address: 'Village Motikhavdi, Digvijaygram, Jamnagar - 361140, Gujarat',
      billingAddress: 'Village Motikhavdi, Digvijaygram, Jamnagar - 361140, Gujarat',
      shippingAddress: 'Despatch Bay 4, Refinery Site, Jamnagar - 361140, Gujarat',
      city: 'Jamnagar',
      state: 'Gujarat',
      billingState: 'Gujarat',
      shippingState: 'Gujarat',
      gstin: '24AAACR5055K1Z4',
      outstandingBalance: 3400000,
      creditLimit: 8000000,
      organisationId: org._id.toString(),
      branchId: branches[0]._id.toString(),
    },
  ]);
  console.log(`✔ Seeded ${customers.length} Customers.`);

  // 5B. Seed Vendors
  const vendors = await Vendor.insertMany([
    {
      code: 'VEND-MIDH-1',
      name: 'Midhani Metallurgical Alloys Ltd',
      contactPerson: 'V. Sundaram',
      email: 'sales@midhani-india.in',
      phone: '+91 40 2434 0001',
      address: 'PO Kanchanbagh, Hyderabad - 500058',
      city: 'Hyderabad',
      state: 'Telangana',
      gstin: '36AAACM2091J1ZB',
      pan: 'AAACM2091J',
      organisationId: org._id.toString(),
      branchId: branches[0]._id.toString(),
    },
    {
      code: 'VEND-HERA-2',
      name: 'Heraeus Precious Metals India',
      contactPerson: 'Rajesh Kulkarni',
      email: 'info.metals@heraeus.in',
      phone: '+91 22 6710 4000',
      address: 'Plot A-14, Road No 16, Thane Industrial Area, Mumbai - 400604',
      city: 'Mumbai',
      state: 'Maharashtra',
      gstin: '27AAACH1249K1ZZ',
      pan: 'AAACH1249K',
      organisationId: org._id.toString(),
      branchId: branches[1]._id.toString(),
    },
    {
      code: 'VEND-ADOR-3',
      name: 'Ador Welding Power Systems',
      contactPerson: 'M. Senthil',
      email: 'support@adorwelding.com',
      phone: '+91 44 2625 3311',
      address: 'Plot 72, Ambattur Industrial Estate, Chennai - 600058',
      city: 'Chennai',
      state: 'Tamil Nadu',
      gstin: '33AAACA0853N1ZT',
      pan: 'AAACA0853N',
      organisationId: org._id.toString(),
      branchId: branches[0]._id.toString(),
    },
  ]);
  console.log(`✔ Seeded ${vendors.length} Vendors.`);

  // 6. Seed Products
  const products = await Product.insertMany([
    {
      sku: 'SMART-MMO-101',
      name: 'Titanium MMO Tubular Anode (25mm x 1000mm)',
      hsnCode: '84199090',
      category: 'Titanium Anodes',
      uom: 'Nos',
      sellingPrice: 18500,
      purchaseCost: 11200,
      currentStock: 145,
      minReorderLevel: 30,
      taxRate: 18,
      approvalStatus: 'Approved',
      approvedBy: 'Jay Raam',
      approvedAt: new Date(),
      organisationId: org._id.toString(),
      branchId: branches[0]._id.toString(),
    },
    {
      sku: 'SMART-CP-202',
      name: 'Mixed Metal Oxide Ribbon Anode Mesh (6.35mm)',
      hsnCode: '84199090',
      category: 'Cathodic Protection',
      uom: 'Mtr',
      sellingPrice: 4200,
      purchaseCost: 2600,
      currentStock: 820,
      minReorderLevel: 150,
      taxRate: 18,
      approvalStatus: 'Approved',
      approvedBy: 'Jay Raam',
      approvedAt: new Date(),
      organisationId: org._id.toString(),
      branchId: branches[1]._id.toString(),
    },
    {
      sku: 'SMART-PLT-303',
      name: 'Platinized Titanium Mesh Anode Grade 1',
      hsnCode: '71101100',
      category: 'Titanium Anodes',
      uom: 'Nos',
      sellingPrice: 48000,
      purchaseCost: 32000,
      currentStock: 42,
      minReorderLevel: 10,
      taxRate: 18,
      approvalStatus: 'Approved',
      approvedBy: 'Jay Raam',
      approvedAt: new Date(),
      organisationId: org._id.toString(),
      branchId: branches[0]._id.toString(),
    },
    {
      sku: 'SMART-PWR-404',
      name: 'Automatic Cathodic Protection TR Unit 50V/50A',
      hsnCode: '85044090',
      category: 'Electronics & Control',
      uom: 'Nos',
      sellingPrice: 125000,
      purchaseCost: 85000,
      currentStock: 18,
      minReorderLevel: 5,
      taxRate: 18,
      approvalStatus: 'Approved',
      approvedBy: 'Jay Raam',
      approvedAt: new Date(),
      organisationId: org._id.toString(),
      branchId: branches[0]._id.toString(),
    },
    {
      sku: 'SMART-RAW-505',
      name: 'ASTM B265 Grade 1 Titanium Sheet 3.0mm',
      hsnCode: '81089010',
      category: 'Raw Materials',
      uom: 'Kg',
      sellingPrice: 3800,
      purchaseCost: 2900,
      currentStock: 1250,
      minReorderLevel: 300,
      taxRate: 18,
      approvalStatus: 'Approved',
      approvedBy: 'Jay Raam',
      approvedAt: new Date(),
      organisationId: org._id.toString(),
      branchId: branches[0]._id.toString(),
    },
    {
      sku: 'SMART-FLG-606',
      name: 'Titanium ANSI B16.5 Slip-On Flange 2" Class 150',
      hsnCode: '81089090',
      category: 'Flanges & Fittings',
      uom: 'Nos',
      sellingPrice: 8500,
      purchaseCost: 5200,
      currentStock: 64,
      minReorderLevel: 20,
      taxRate: 18,
      approvalStatus: 'Approved',
      approvedBy: 'Jay Raam',
      approvedAt: new Date(),
      organisationId: org._id.toString(),
      branchId: branches[1]._id.toString(),
    },
  ]);
  console.log(`✔ Seeded ${products.length} Products.`);

  // 7. Seed Sales Orders
  const salesOrders = await SalesOrder.insertMany([
    {
      orderNumber: 'SO-2026-081',
      customerId: customers[0]._id.toString(),
      customerName: customers[0].name,
      orderDate: '2026-09-02',
      deliveryDate: '2026-09-28',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      items: [
        {
          productId: products[0]._id.toString(),
          productName: products[0].name,
          sku: products[0].sku,
          quantity: 20,
          unitPrice: 18500,
          total: 370000,
        },
      ],
      subtotal: 370000,
      taxAmount: 66600,
      totalAmount: 436600,
      status: 'In Production',
    },
    {
      orderNumber: 'SO-2026-082',
      customerId: customers[1]._id.toString(),
      customerName: customers[1].name,
      orderDate: '2026-09-05',
      deliveryDate: '2026-10-10',
      branchId: branches[1]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      items: [
        {
          productId: products[1]._id.toString(),
          productName: products[1].name,
          sku: products[1].sku,
          quantity: 250,
          unitPrice: 4200,
          total: 1050000,
        },
      ],
      subtotal: 1050000,
      taxAmount: 189000,
      totalAmount: 1239000,
      status: 'Confirmed',
    },
    {
      orderNumber: 'SO-2026-083',
      customerId: customers[2]._id.toString(),
      customerName: customers[2].name,
      orderDate: '2026-08-15',
      deliveryDate: '2026-09-12',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      items: [
        {
          productId: products[2]._id.toString(),
          productName: products[2].name,
          sku: products[2].sku,
          quantity: 6,
          unitPrice: 48000,
          total: 288000,
        },
      ],
      subtotal: 288000,
      taxAmount: 51840,
      totalAmount: 339840,
      status: 'Completed',
    },
    {
      orderNumber: 'SO-2026-084',
      customerId: customers[3]._id.toString(),
      customerName: customers[3].name,
      orderDate: '2026-09-08',
      deliveryDate: '2026-09-25',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      items: [
        {
          productId: products[3]._id.toString(),
          productName: products[3].name,
          sku: products[3].sku,
          quantity: 2,
          unitPrice: 125000,
          total: 250000,
        },
      ],
      subtotal: 250000,
      taxAmount: 45000,
      totalAmount: 295000,
      status: 'Dispatched',
    },
    {
      orderNumber: 'SO-2025-019',
      customerId: customers[0]._id.toString(),
      customerName: customers[0].name,
      orderDate: '2025-11-10',
      deliveryDate: '2025-12-15',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2025-2026',
      items: [
        {
          productId: products[0]._id.toString(),
          productName: products[0].name,
          sku: products[0].sku,
          quantity: 10,
          unitPrice: 18000,
          total: 180000,
        },
      ],
      subtotal: 180000,
      taxAmount: 32400,
      totalAmount: 212400,
      status: 'Completed',
    },
  ]);
  console.log(`✔ Seeded ${salesOrders.length} Sales Orders.`);

  // 8. Seed Invoices (with calculated GST, HSN, line items, and addresses)
  const inv1Items = [
    {
      productId: products[2]._id.toString(),
      description: products[2].name,
      hsnCode: products[2].hsnCode,
      qty: 6,
      unit: products[2].uom,
      rate: 48000,
      discountPercent: 0,
      taxRate: 18,
    },
  ];
  const inv1Tax = calculateDocumentTaxes({
    items: inv1Items,
    customerState: customers[2].billingState || 'Tamil Nadu',
    customerGstin: customers[2].gstin,
  });

  const inv2Items = [
    {
      productId: products[3]._id.toString(),
      description: products[3].name,
      hsnCode: products[3].hsnCode,
      qty: 2,
      unit: products[3].uom,
      rate: 125000,
      discountPercent: 0,
      taxRate: 18,
    },
  ];
  const inv2Tax = calculateDocumentTaxes({
    items: inv2Items,
    customerState: customers[3].billingState || 'Tamil Nadu',
    customerGstin: customers[3].gstin,
  });

  const inv3Items = [
    {
      productId: products[1]._id.toString(),
      description: products[1].name,
      hsnCode: products[1].hsnCode,
      qty: 250,
      unit: products[1].uom,
      rate: 4200,
      discountPercent: 0,
      taxRate: 18,
    },
  ];
  const inv3Tax = calculateDocumentTaxes({
    items: inv3Items,
    customerState: customers[1].billingState || 'Maharashtra',
    customerGstin: customers[1].gstin,
  });

  const invoices = await Invoice.insertMany([
    {
      invoiceNumber: 'INV-2026-001',
      salesOrderNumber: salesOrders[2].orderNumber,
      customerId: customers[2]._id.toString(),
      customerName: customers[2].name,
      customerGstin: customers[2].gstin,
      customerState: customers[2].billingState || 'Tamil Nadu',
      billingAddress: customers[2].billingAddress,
      shippingAddress: customers[2].shippingAddress,
      invoiceDate: '2026-09-01',
      dueDate: '2026-09-30',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      items: inv1Tax.items,
      subtotal: inv1Tax.subtotal,
      taxableAmount: inv1Tax.taxableAmount,
      totalDiscount: inv1Tax.totalDiscount,
      gstRate: 18,
      cgstAmount: inv1Tax.cgstAmount,
      sgstAmount: inv1Tax.sgstAmount,
      igstAmount: inv1Tax.igstAmount,
      taxAmount: inv1Tax.taxAmount,
      totalAmount: inv1Tax.totalAmount,
      totalInWords: inv1Tax.totalInWords,
      status: 'Paid',
    },
    {
      invoiceNumber: 'INV-2026-002',
      salesOrderNumber: salesOrders[3].orderNumber,
      customerId: customers[3]._id.toString(),
      customerName: customers[3].name,
      customerGstin: customers[3].gstin,
      customerState: customers[3].billingState || 'Tamil Nadu',
      billingAddress: customers[3].billingAddress,
      shippingAddress: customers[3].shippingAddress,
      invoiceDate: '2026-09-08',
      dueDate: '2026-10-08',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      items: inv2Tax.items,
      subtotal: inv2Tax.subtotal,
      taxableAmount: inv2Tax.taxableAmount,
      totalDiscount: inv2Tax.totalDiscount,
      gstRate: 18,
      cgstAmount: inv2Tax.cgstAmount,
      sgstAmount: inv2Tax.sgstAmount,
      igstAmount: inv2Tax.igstAmount,
      taxAmount: inv2Tax.taxAmount,
      totalAmount: inv2Tax.totalAmount,
      totalInWords: inv2Tax.totalInWords,
      status: 'Pending',
    },
    {
      invoiceNumber: 'INV-2026-003',
      salesOrderNumber: salesOrders[1].orderNumber,
      customerId: customers[1]._id.toString(),
      customerName: customers[1].name,
      customerGstin: customers[1].gstin,
      customerState: customers[1].billingState || 'Maharashtra',
      billingAddress: customers[1].billingAddress,
      shippingAddress: customers[1].shippingAddress,
      invoiceDate: '2026-09-05',
      dueDate: '2026-10-05',
      branchId: branches[1]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      items: inv3Tax.items,
      subtotal: inv3Tax.subtotal,
      taxableAmount: inv3Tax.taxableAmount,
      totalDiscount: inv3Tax.totalDiscount,
      gstRate: 18,
      cgstAmount: inv3Tax.cgstAmount,
      sgstAmount: inv3Tax.sgstAmount,
      igstAmount: inv3Tax.igstAmount,
      taxAmount: inv3Tax.taxAmount,
      totalAmount: inv3Tax.totalAmount,
      totalInWords: inv3Tax.totalInWords,
      status: 'Pending',
    },
  ]);
  console.log(`✔ Seeded ${invoices.length} Invoices.`);

  // 9. Seed Purchase Orders
  const po1Items = [
    {
      productId: products[4]._id.toString(),
      description: products[4].name,
      hsnCode: products[4].hsnCode,
      qty: 250,
      unit: products[4].uom,
      rate: 2900,
      discountPercent: 0,
      taxRate: 18,
    },
  ];
  const po1Tax = calculateDocumentTaxes({
    items: po1Items,
    customerState: vendors[0].state || 'Telangana',
    customerGstin: vendors[0].gstin,
  });

  const po2Items = [
    {
      productId: products[2]._id.toString(),
      description: products[2].name,
      hsnCode: products[2].hsnCode,
      qty: 40,
      unit: products[2].uom,
      rate: 30000,
      discountPercent: 0,
      taxRate: 18,
    },
  ];
  const po2Tax = calculateDocumentTaxes({
    items: po2Items,
    customerState: vendors[1].state || 'Maharashtra',
    customerGstin: vendors[1].gstin,
  });

  const po3Items = [
    {
      productId: products[5]._id.toString(),
      description: products[5].name,
      hsnCode: products[5].hsnCode,
      qty: 75,
      unit: products[5].uom,
      rate: 5200,
      discountPercent: 0,
      taxRate: 18,
    },
  ];
  const po3Tax = calculateDocumentTaxes({
    items: po3Items,
    customerState: vendors[2].state || 'Tamil Nadu',
    customerGstin: vendors[2].gstin,
  });

  const purchaseOrders = await PurchaseOrder.insertMany([
    {
      poNumber: 'PO-2026-044',
      vendorId: vendors[0]._id.toString(),
      vendorName: vendors[0].name,
      vendorGstin: vendors[0].gstin,
      vendorAddress: vendors[0].address,
      vendorState: vendors[0].state,
      billingAddress: branches[0].address,
      shippingAddress: branches[0].address,
      poDate: '2026-09-01',
      expectedDate: '2026-09-22',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      items: po1Tax.items,
      subtotal: po1Tax.subtotal,
      taxableAmount: po1Tax.taxableAmount,
      totalDiscount: po1Tax.totalDiscount,
      cgstAmount: po1Tax.cgstAmount,
      sgstAmount: po1Tax.sgstAmount,
      igstAmount: po1Tax.igstAmount,
      taxAmount: po1Tax.taxAmount,
      totalAmount: po1Tax.totalAmount,
      totalInWords: po1Tax.totalInWords,
      status: 'Approved',
    },
    {
      poNumber: 'PO-2026-045',
      vendorId: vendors[1]._id.toString(),
      vendorName: vendors[1].name,
      vendorGstin: vendors[1].gstin,
      vendorAddress: vendors[1].address,
      vendorState: vendors[1].state,
      billingAddress: branches[1].address,
      shippingAddress: branches[1].address,
      poDate: '2026-09-04',
      expectedDate: '2026-09-29',
      branchId: branches[1]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      items: po2Tax.items,
      subtotal: po2Tax.subtotal,
      taxableAmount: po2Tax.taxableAmount,
      totalDiscount: po2Tax.totalDiscount,
      cgstAmount: po2Tax.cgstAmount,
      sgstAmount: po2Tax.sgstAmount,
      igstAmount: po2Tax.igstAmount,
      taxAmount: po2Tax.taxAmount,
      totalAmount: po2Tax.totalAmount,
      totalInWords: po2Tax.totalInWords,
      status: 'Pending Approval',
    },
    {
      poNumber: 'PO-2026-046',
      vendorId: vendors[2]._id.toString(),
      vendorName: vendors[2].name,
      vendorGstin: vendors[2].gstin,
      vendorAddress: vendors[2].address,
      vendorState: vendors[2].state,
      billingAddress: branches[0].address,
      shippingAddress: branches[0].address,
      poDate: '2026-08-20',
      expectedDate: '2026-09-05',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      items: po3Tax.items,
      subtotal: po3Tax.subtotal,
      taxableAmount: po3Tax.taxableAmount,
      totalDiscount: po3Tax.totalDiscount,
      cgstAmount: po3Tax.cgstAmount,
      sgstAmount: po3Tax.sgstAmount,
      igstAmount: po3Tax.igstAmount,
      taxAmount: po3Tax.taxAmount,
      totalAmount: po3Tax.totalAmount,
      totalInWords: po3Tax.totalInWords,
      status: 'Received',
    },
  ]);
  console.log(`✔ Seeded ${purchaseOrders.length} Purchase Orders.`);

  // 10. Seed Store Items
  const storeItems = await StoreItem.insertMany([
    {
      productId: products[0]._id.toString(),
      productName: products[0].name,
      sku: products[0].sku,
      warehouse: 'Chennai Central Depot',
      binLocation: 'BIN-A1-04',
      availableStock: 145,
      minLevel: 30,
      maxLevel: 300,
      lastAudited: '2026-09-01',
      status: 'In Stock',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
    },
    {
      productId: products[1]._id.toString(),
      productName: products[1].name,
      sku: products[1].sku,
      warehouse: 'Coimbatore Fabrication Bay',
      binLocation: 'BIN-C2-11',
      availableStock: 820,
      minLevel: 150,
      maxLevel: 1500,
      lastAudited: '2026-09-05',
      status: 'In Stock',
      branchId: branches[1]._id.toString(),
      organisationId: org._id.toString(),
    },
    {
      productId: products[2]._id.toString(),
      productName: products[2].name,
      sku: products[2].sku,
      warehouse: 'Chennai Central Depot',
      binLocation: 'VAULT-SEC-01',
      availableStock: 8,
      minLevel: 10,
      maxLevel: 50,
      lastAudited: '2026-09-08',
      status: 'Low Stock',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
    },
    {
      productId: products[3]._id.toString(),
      productName: products[3].name,
      sku: products[3].sku,
      warehouse: 'Chennai Central Depot',
      binLocation: 'BAY-PWR-02',
      availableStock: 18,
      minLevel: 5,
      maxLevel: 40,
      lastAudited: '2026-09-02',
      status: 'In Stock',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
    },
  ]);
  console.log(`✔ Seeded ${storeItems.length} Store Items.`);

  // 11. Seed Delivery Challans
  const deliveryChallans = await DeliveryChallan.insertMany([
    {
      dcNumber: 'DC-2026-0041',
      salesOrderNumber: salesOrders[2].orderNumber,
      customerName: customers[2].name,
      dispatchDate: '2026-09-10',
      transportMode: 'Dedicated Heavy Truck',
      vehicleNumber: 'TN 09 BY 5521',
      ewayBillNumber: '281099238411',
      driverName: 'R. Murugan',
      driverPhone: '+91 98401 99882',
      status: 'Delivered',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
    },
    {
      dcNumber: 'DC-2026-0042',
      salesOrderNumber: salesOrders[3].orderNumber,
      customerName: customers[3].name,
      dispatchDate: '2026-09-12',
      transportMode: 'VRL Logistics Express',
      vehicleNumber: 'KA 01 AH 9942',
      ewayBillNumber: '281099238994',
      driverName: 'S. Kantharaj',
      driverPhone: '+91 97890 12344',
      status: 'In Transit',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
    },
  ]);
  console.log(`✔ Seeded ${deliveryChallans.length} Delivery Challans.`);

  console.log('\n==========================================');
  console.log('🎉 ALL BACKEND ERP DATA SEEDED INTO MONGODB ATLAS WITH MULTI-TENANT & BRANCH SCOPING!');
  console.log('==========================================\n');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
