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
} from './models/ErpModels';

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
      city: 'Pune / Chennai',
      state: 'Maharashtra / Tamil Nadu',
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
      city: 'Mumbai / Coimbatore',
      state: 'Maharashtra / Tamil Nadu',
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
      city: 'Trichy',
      state: 'Tamil Nadu',
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
      city: 'Chennai',
      state: 'Tamil Nadu',
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
      city: 'Jamnagar',
      state: 'Gujarat',
      gstin: '24AAACR5055K1Z4',
      outstandingBalance: 3400000,
      creditLimit: 8000000,
      organisationId: org._id.toString(),
      branchId: branches[0]._id.toString(),
    },
  ]);
  console.log(`✔ Seeded ${customers.length} Customers.`);

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
      organisationId: org._id.toString(),
      branchId: branches[1]._id.toString(),
    },
  ]);
  console.log(`✔ Seeded ${products.length} Products.`);

  // 7. Seed Sales Orders
  // Chennai (BR-CHN-01): 3 orders in 2026-2027
  // Coimbatore (BR-CBE-02): 1 order in 2026-2027
  // Historic: 1 order in 2025-2026
  // Bengaluru (BR-BLR-03): 0 orders (Demonstrates No Data Found)
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

  // 8. Seed Invoices
  const invoices = await Invoice.insertMany([
    {
      invoiceNumber: 'INV-2026-001',
      salesOrderNumber: salesOrders[2].orderNumber,
      customerId: customers[2]._id.toString(),
      customerName: customers[2].name,
      invoiceDate: '2026-09-01',
      dueDate: '2026-09-30',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      subtotal: 288000,
      gstRate: 18,
      taxAmount: 51840,
      totalAmount: 339840,
      status: 'Paid',
    },
    {
      invoiceNumber: 'INV-2026-002',
      salesOrderNumber: salesOrders[3].orderNumber,
      customerId: customers[3]._id.toString(),
      customerName: customers[3].name,
      invoiceDate: '2026-09-08',
      dueDate: '2026-10-08',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      subtotal: 250000,
      gstRate: 18,
      taxAmount: 45000,
      totalAmount: 295000,
      status: 'Pending',
    },
    {
      invoiceNumber: 'INV-2026-003',
      salesOrderNumber: salesOrders[1].orderNumber,
      customerId: customers[1]._id.toString(),
      customerName: customers[1].name,
      invoiceDate: '2026-09-05',
      dueDate: '2026-10-05',
      branchId: branches[1]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      subtotal: 1050000,
      gstRate: 18,
      taxAmount: 189000,
      totalAmount: 1239000,
      status: 'Pending',
    },
  ]);
  console.log(`✔ Seeded ${invoices.length} Invoices.`);

  // 9. Seed Purchase Orders
  const purchaseOrders = await PurchaseOrder.insertMany([
    {
      poNumber: 'PO-2026-044',
      vendorName: 'Midhani Metallurgical Alloys Ltd',
      vendorGstin: '36AAACM2091J1ZB',
      poDate: '2026-09-01',
      expectedDate: '2026-09-22',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      totalAmount: 850000,
      status: 'Approved',
    },
    {
      poNumber: 'PO-2026-045',
      vendorName: 'Heraeus Precious Metals India',
      vendorGstin: '27AAACH1249K1ZZ',
      poDate: '2026-09-04',
      expectedDate: '2026-09-29',
      branchId: branches[1]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      totalAmount: 1420000,
      status: 'Pending Approval',
    },
    {
      poNumber: 'PO-2026-046',
      vendorName: 'Ador Welding Power Systems',
      vendorGstin: '27AAACA0853N1ZT',
      poDate: '2026-08-20',
      expectedDate: '2026-09-05',
      branchId: branches[0]._id.toString(),
      organisationId: org._id.toString(),
      financialYear: '2026-2027',
      totalAmount: 460000,
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
