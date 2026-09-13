import mongoose, { Schema, Document } from 'mongoose';

// 1. Organisation
export interface IOrganisation extends Document {
  name: string;
  cin: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  website: string;
  address: string;
}

const OrganisationSchema = new Schema<IOrganisation>(
  {
    name: { type: String, required: true },
    cin: { type: String, required: true },
    gstin: { type: String, required: true },
    pan: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    website: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

// 2. Branch
export interface IBranch extends Document {
  code: string;
  name: string;
  location: string;
  address: string;
  gstin: string;
  phone: string;
  isHeadOffice: boolean;
  organisationId: string;
}

const BranchSchema = new Schema<IBranch>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, required: true },
    gstin: { type: String, required: true },
    phone: { type: String, required: true },
    isHeadOffice: { type: Boolean, default: false },
    organisationId: { type: String, default: '' },
  },
  { timestamps: true }
);

// 3. Financial Year
export interface IFinancialYear extends Document {
  yearName: string; // e.g. '2026-2027'
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'Active' | 'Closed';
  organisationId: string;
}

const FinancialYearSchema = new Schema<IFinancialYear>(
  {
    yearName: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    isCurrent: { type: Boolean, default: false },
    status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
    organisationId: { type: String, default: '' },
  },
  { timestamps: true }
);

// 4. Customer
export interface ICustomer extends Document {
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  billingAddress: string;
  shippingAddress: string;
  city: string;
  state: string;
  billingState: string;
  shippingState: string;
  gstin: string;
  outstandingBalance: number;
  creditLimit: number;
  organisationId: string;
  branchId: string;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, default: '' },
    billingAddress: { type: String, default: '' },
    shippingAddress: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    billingState: { type: String, default: 'Tamil Nadu' },
    shippingState: { type: String, default: 'Tamil Nadu' },
    gstin: { type: String, required: true },
    outstandingBalance: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 0 },
    organisationId: { type: String, default: '' },
    branchId: { type: String, default: '' },
  },
  { timestamps: true }
);

CustomerSchema.index({ organisationId: 1, branchId: 1, createdAt: -1 });
CustomerSchema.index({ organisationId: 1, name: 1 });
CustomerSchema.index({ gstin: 1 });

// 5. Product
export interface IProduct extends Document {
  sku: string;
  name: string;
  hsnCode: string;
  category: string;
  uom: string;
  sellingPrice: number;
  purchaseCost: number;
  currentStock: number;
  minReorderLevel: number;
  taxRate: number;
  status: 'ACTIVE' | 'INACTIVE';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: Date;
  organisationId: string;
  branchId: string;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    hsnCode: { type: String, required: true },
    category: { type: String, required: true },
    uom: { type: String, required: true, default: 'Nos' },
    sellingPrice: { type: Number, required: true },
    purchaseCost: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    minReorderLevel: { type: Number, default: 10 },
    taxRate: { type: Number, required: true, default: 18 },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    approvedBy: { type: String, default: '' },
    approvedAt: { type: Date },
    organisationId: { type: String, default: '' },
    branchId: { type: String, default: '' },
  },
  { timestamps: true }
);

ProductSchema.index({ organisationId: 1, branchId: 1, approvalStatus: 1, createdAt: -1 });
ProductSchema.index({ organisationId: 1, status: 1 });
ProductSchema.index({ category: 1, approvalStatus: 1 });
ProductSchema.index({ hsnCode: 1 });

// 6. Document Line Item (Used for Invoices, Purchase Orders, Bills, and Delivery Challans)
export interface IDocumentItem {
  productId?: string;
  productName: string;
  sku?: string;
  hsnCode: string;
  quantity: number;
  orderedQuantity?: number;
  billedQuantity?: number;
  remainingQuantity?: number;
  movedToStoreQuantity?: number;
  remainingToMoveQuantity?: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
  uom?: string;
}

export const DocumentItemSchema = new Schema<IDocumentItem>(
  {
    productId: { type: String, default: '' },
    productName: { type: String, required: true },
    sku: { type: String, default: '' },
    hsnCode: { type: String, required: true, default: '84199090' },
    quantity: { type: Number, required: true, default: 1 },
    orderedQuantity: { type: Number, default: 0 },
    billedQuantity: { type: Number, default: 0 },
    remainingQuantity: { type: Number, default: 0 },
    movedToStoreQuantity: { type: Number, default: 0 },
    remainingToMoveQuantity: { type: Number, default: 0 },
    unitPrice: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, required: true, default: 18 },
    taxableAmount: { type: Number, required: true, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    uom: { type: String, default: 'Nos' },
  },
  { _id: false }
);

// 7. Invoice
export interface IInvoice extends Document {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerGstin: string;
  customerState: string;
  billingAddress: string;
  shippingAddress: string;
  invoiceDate: string;
  dueDate: string;
  branchId: string;
  organisationId: string;
  financialYear: string;
  items: IDocumentItem[];
  subtotal: number;
  shippingCharge: number;
  shippingTax: number;
  taxableAmount: number;
  totalDiscount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  totalInWords: string;
  status: string;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerGstin: { type: String, default: '' },
    customerState: { type: String, default: 'Tamil Nadu' },
    billingAddress: { type: String, default: '' },
    shippingAddress: { type: String, default: '' },
    invoiceDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    branchId: { type: String, default: '' },
    organisationId: { type: String, default: '' },
    financialYear: { type: String, default: '2026-2027' },
    items: [DocumentItemSchema],
    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    shippingTax: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    gstRate: { type: Number, default: 18 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    outstandingAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'],
      default: 'UNPAID',
    },
    totalInWords: { type: String, default: '' },
    status: { type: String, default: 'Pending' },
  },
  { timestamps: true }
);

InvoiceSchema.index({ organisationId: 1, branchId: 1, invoiceDate: -1 });
InvoiceSchema.index({ customerId: 1, invoiceDate: -1 });
InvoiceSchema.index({ status: 1, invoiceDate: -1 });
InvoiceSchema.index({ paymentStatus: 1, invoiceDate: -1 });
InvoiceSchema.index({ 'items.hsnCode': 1, invoiceDate: -1 });
InvoiceSchema.index({ 'items.productId': 1 });
InvoiceSchema.index({ customerState: 1, invoiceDate: -1 });

// 8. Vendor
export interface IVendor extends Document {
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  billingAddress: string;
  shippingAddress: string;
  city: string;
  state: string;
  billingState: string;
  shippingState: string;
  gstin: string;
  pan?: string;
  outstandingBalance?: number;
  organisationId: string;
  branchId?: string;
}

const VendorSchema = new Schema<IVendor>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, default: '' },
    billingAddress: { type: String, default: '' },
    shippingAddress: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true, default: 'Tamil Nadu' },
    billingState: { type: String, default: 'Tamil Nadu' },
    shippingState: { type: String, default: 'Tamil Nadu' },
    gstin: { type: String, required: true },
    pan: { type: String, default: '' },
    outstandingBalance: { type: Number, default: 0 },
    organisationId: { type: String, default: '' },
    branchId: { type: String, default: '' },
  },
  { timestamps: true }
);

VendorSchema.index({ organisationId: 1, branchId: 1, createdAt: -1 });
VendorSchema.index({ organisationId: 1, name: 1 });
VendorSchema.index({ gstin: 1 });

// 9. Purchase Order
export interface IPurchaseOrder extends Document {
  poNumber: string;
  vendorId?: string;
  vendorName: string;
  vendorGstin: string;
  vendorAddress: string;
  vendorState: string;
  billingAddress: string;
  shippingAddress: string;
  poDate: string;
  expectedDate: string;
  branchId: string;
  organisationId: string;
  financialYear: string;
  items: IDocumentItem[];
  subtotal: number;
  shippingCharge: number;
  shippingTax: number;
  taxableAmount: number;
  totalDiscount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  totalInWords: string;
  status:
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'PARTIALLY_BILLED'
    | 'FULLY_BILLED'
    | 'AUTO_REORDER_PENDING'
    | 'CANCELLED'
    | 'REJECTED'
    | string;
  isAutoReorder?: boolean;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true },
    vendorId: { type: String, default: '' },
    vendorName: { type: String, required: true },
    vendorGstin: { type: String, required: true },
    vendorAddress: { type: String, default: '' },
    vendorState: { type: String, default: 'Tamil Nadu' },
    billingAddress: { type: String, default: '' },
    shippingAddress: { type: String, default: '' },
    poDate: { type: String, required: true },
    expectedDate: { type: String, required: true },
    branchId: { type: String, required: true },
    organisationId: { type: String, default: '' },
    financialYear: { type: String, default: '2026-2027' },
    items: [DocumentItemSchema],
    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    shippingTax: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    outstandingAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'],
      default: 'UNPAID',
    },
    totalInWords: { type: String, default: '' },
    status: {
      type: String,
      default: 'APPROVED',
    },
    isAutoReorder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ organisationId: 1, branchId: 1, poDate: -1 });
PurchaseOrderSchema.index({ vendorId: 1, poDate: -1 });
PurchaseOrderSchema.index({ status: 1, poDate: -1 });
PurchaseOrderSchema.index({ paymentStatus: 1 });

// 10. Bill (Vendor Invoices / Bills with or without PO)
export interface IBill extends Document {
  billNumber: string;
  billDate: string;
  dueDate: string;
  poId?: string;
  poNumber?: string;
  vendorId?: string;
  vendorName: string;
  vendorGstin: string;
  vendorState: string;
  billingAddress: string;
  shippingAddress: string;
  items: IDocumentItem[];
  subtotal: number;
  shippingCharge: number;
  shippingTax: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  advanceAdjusted: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  storeMovementStatus: 'NOT_MOVED' | 'PARTIALLY_MOVED' | 'FULLY_MOVED';
  totalInWords: string;
  status: 'Pending' | 'Paid' | 'Approved' | string;
  branchId: string;
  organisationId: string;
  financialYear: string;
}

const BillSchema = new Schema<IBill>(
  {
    billNumber: { type: String, required: true, unique: true },
    billDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    poId: { type: String, default: '' },
    poNumber: { type: String, default: '' },
    vendorId: { type: String, default: '' },
    vendorName: { type: String, required: true },
    vendorGstin: { type: String, required: true },
    vendorState: { type: String, default: 'Tamil Nadu' },
    billingAddress: { type: String, default: '' },
    shippingAddress: { type: String, default: '' },
    items: [DocumentItemSchema],
    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    shippingTax: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    outstandingAmount: { type: Number, default: 0 },
    advanceAdjusted: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'],
      default: 'UNPAID',
    },
    storeMovementStatus: {
      type: String,
      enum: ['NOT_MOVED', 'PARTIALLY_MOVED', 'FULLY_MOVED'],
      default: 'NOT_MOVED',
    },
    totalInWords: { type: String, default: '' },
    status: { type: String, default: 'Pending' },
    branchId: { type: String, default: '' },
    organisationId: { type: String, default: '' },
    financialYear: { type: String, default: '2026-2027' },
  },
  { timestamps: true }
);

BillSchema.index({ organisationId: 1, branchId: 1, billDate: -1 });
BillSchema.index({ vendorId: 1, billDate: -1 });
BillSchema.index({ poId: 1 });
BillSchema.index({ status: 1, billDate: -1 });
BillSchema.index({ paymentStatus: 1, billDate: -1 });
BillSchema.index({ storeMovementStatus: 1 });
BillSchema.index({ 'items.hsnCode': 1 });

// 11. Store Item
export interface IStoreItem extends Document {
  productId: string;
  productName: string;
  sku: string;
  warehouse: string;
  binLocation: string;
  availableStock: number;
  minLevel: number;
  maxLevel: number;
  lastAudited: string;
  status: string;
  branchId: string;
  organisationId: string;
}

const StoreItemSchema = new Schema<IStoreItem>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    warehouse: { type: String, required: true },
    binLocation: { type: String, required: true },
    availableStock: { type: Number, required: true, default: 0 },
    minLevel: { type: Number, required: true, default: 10 },
    maxLevel: { type: Number, required: true, default: 100 },
    lastAudited: { type: String },
    status: { type: String, default: 'In Stock' },
    branchId: { type: String, default: '' },
    organisationId: { type: String, default: '' },
  },
  { timestamps: true }
);

StoreItemSchema.index({ organisationId: 1, branchId: 1 });
StoreItemSchema.index({ productId: 1 });
StoreItemSchema.index({ status: 1 });

// 12. Delivery Challan (Generated against Tax Invoice)
export interface IDeliveryChallan extends Document {
  dcNumber: string;
  invoiceId?: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerGstin?: string;
  billingAddress?: string;
  shippingAddress?: string;
  dispatchDate: string;
  transportMode: string;
  vehicleNumber: string;
  ewayBillNumber: string;
  driverName: string;
  driverPhone: string;
  items?: IDocumentItem[];
  status: string;
  branchId: string;
  organisationId: string;
  financialYear: string;
}

const DeliveryChallanSchema = new Schema<IDeliveryChallan>(
  {
    dcNumber: { type: String, required: true, unique: true },
    invoiceId: { type: String, default: '' },
    invoiceNumber: { type: String, required: true },
    customerId: { type: String, default: '' },
    customerName: { type: String, required: true },
    customerGstin: { type: String, default: '' },
    billingAddress: { type: String, default: '' },
    shippingAddress: { type: String, default: '' },
    dispatchDate: { type: String, required: true },
    transportMode: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    ewayBillNumber: { type: String, required: true },
    driverName: { type: String, required: true },
    driverPhone: { type: String, required: true },
    items: [DocumentItemSchema],
    status: { type: String, default: 'In Transit' },
    branchId: { type: String, default: '' },
    organisationId: { type: String, default: '' },
    financialYear: { type: String, default: '2026-2027' },
  },
  { timestamps: true }
);

DeliveryChallanSchema.index({ organisationId: 1, branchId: 1, dispatchDate: -1 });
DeliveryChallanSchema.index({ invoiceId: 1 });
DeliveryChallanSchema.index({ customerId: 1 });

// 11. User Role Mapping
export interface IUserRole {
  organisationId: string;
  organisationName: string;
  branchId: string;
  branchName: string;
  roleName: string;
  userType: string;
}

// 12. User Account (Authentication)
export interface IUserAccount extends Document {
  email: string;
  mobile: string;
  passwordHash: string;
  name: string;
  role: string;
  branchId: string;
  branchName: string;
  organisationId: string;
  roles: IUserRole[];
}

const UserAccountSchema = new Schema<IUserAccount>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, default: 'Admin' },
    branchId: { type: String, required: true },
    branchName: { type: String, required: true },
    organisationId: { type: String, required: true },
    roles: [
      {
        organisationId: { type: String, required: true },
        organisationName: { type: String, required: true },
        branchId: { type: String, required: true },
        branchName: { type: String, required: true },
        roleName: { type: String, required: true },
        userType: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// 13. Audit History / Change Tracking
export interface IAuditHistory extends Document {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  entityIdentifier?: string;
  previousData?: any;
  newData?: any;
  changedFields: string[];
  organisationId: string;
  branchId: string;
  financialYear: string;
  timestamp: Date;
}

const AuditHistorySchema = new Schema<IAuditHistory>(
  {
    userId: { type: String, default: '' },
    userName: { type: String, default: 'System' },
    userEmail: { type: String, default: '' },
    userRole: { type: String, default: 'SuperAdmin' },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE'],
      required: true,
    },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    entityIdentifier: { type: String, default: '' },
    previousData: { type: Schema.Types.Mixed },
    newData: { type: Schema.Types.Mixed },
    changedFields: [{ type: String }],
    organisationId: { type: String, default: '' },
    branchId: { type: String, default: '' },
    financialYear: { type: String, default: '2026-2027' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AuditHistorySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditHistorySchema.index({ organisationId: 1, branchId: 1, createdAt: -1 });
AuditHistorySchema.index({ userId: 1, createdAt: -1 });
AuditHistorySchema.index({ action: 1, createdAt: -1 });
AuditHistorySchema.index({ createdAt: -1 });

// 14. Bank Account
export interface IBankAccount extends Document {
  accountName: string;
  accountHolderName: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'Current' | 'Savings' | string;
  currency: string;
  isPrimary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  balance: number;
  organisationId: string;
  branchId?: string;
  createdBy?: string;
  updatedBy?: string;
}

const BankAccountSchema = new Schema<IBankAccount>(
  {
    accountName: { type: String, required: true },
    accountHolderName: { type: String, required: true },
    bankName: { type: String, required: true },
    branch: { type: String, default: '' },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    accountType: { type: String, default: 'Current' },
    currency: { type: String, default: 'INR' },
    isPrimary: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    balance: { type: Number, default: 0 },
    organisationId: { type: String, default: '' },
    branchId: { type: String, default: '' },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

BankAccountSchema.index({ organisationId: 1, accountNumber: 1 }, { unique: true });
BankAccountSchema.index({ organisationId: 1, isPrimary: 1 });
BankAccountSchema.index({ organisationId: 1, status: 1 });

// 15. Financial Transaction (Ledger Entry)
export interface IFinancialTransaction extends Document {
  transactionNumber: string;
  transactionDate: string;
  transactionType:
    | 'CUSTOMER_PAYMENT'
    | 'VENDOR_PAYMENT'
    | 'VENDOR_ADVANCE'
    | 'BANK_TRANSFER'
    | 'ADJUSTMENT'
    | 'REVERSAL'
    | string;
  accountId: string;
  accountName: string;
  partyType: 'CUSTOMER' | 'VENDOR' | 'INTERNAL' | string;
  partyId: string;
  partyName: string;
  documentType?: 'INVOICE' | 'BILL' | 'PURCHASE_ORDER' | string;
  documentId?: string;
  documentNumber?: string;
  debit: number;
  credit: number;
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'CASH' | string;
  referenceNumber: string;
  status: 'POSTED' | 'REVERSED';
  reversalTransactionId?: string;
  notes?: string;
  organisationId: string;
  branchId: string;
  financialYear: string;
  createdBy: string;
}

const FinancialTransactionSchema = new Schema<IFinancialTransaction>(
  {
    transactionNumber: { type: String, required: true, unique: true },
    transactionDate: { type: String, required: true },
    transactionType: {
      type: String,
      required: true,
      enum: [
        'CUSTOMER_PAYMENT',
        'VENDOR_PAYMENT',
        'VENDOR_ADVANCE',
        'BANK_TRANSFER',
        'ADJUSTMENT',
        'REVERSAL',
      ],
    },
    accountId: { type: String, required: true },
    accountName: { type: String, required: true },
    partyType: {
      type: String,
      required: true,
      enum: ['CUSTOMER', 'VENDOR', 'INTERNAL'],
      default: 'CUSTOMER',
    },
    partyId: { type: String, default: '' },
    partyName: { type: String, default: '' },
    documentType: { type: String, default: '' },
    documentId: { type: String, default: '' },
    documentNumber: { type: String, default: '' },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      default: 'BANK_TRANSFER',
    },
    referenceNumber: { type: String, default: '' },
    status: {
      type: String,
      enum: ['POSTED', 'REVERSED'],
      default: 'POSTED',
    },
    reversalTransactionId: { type: String, default: '' },
    notes: { type: String, default: '' },
    organisationId: { type: String, default: '' },
    branchId: { type: String, default: '' },
    financialYear: { type: String, default: '2026-2027' },
    createdBy: { type: String, default: 'System' },
  },
  { timestamps: true }
);

FinancialTransactionSchema.index({ organisationId: 1, transactionDate: -1 });
FinancialTransactionSchema.index({ accountId: 1, transactionDate: -1 });
FinancialTransactionSchema.index({ documentId: 1 });
FinancialTransactionSchema.index({ partyId: 1, transactionDate: -1 });
FinancialTransactionSchema.index({ status: 1 });

// 16. Stock Movement
export interface IStockMovement extends Document {
  movementNumber: string;
  movementDate: string;
  billId: string;
  billNumber: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  uom: string;
  warehouse: string;
  binLocation: string;
  hasExpiry: boolean;
  expiryDate?: string;
  batchNumber: string;
  branchId: string;
  organisationId: string;
  createdBy: string;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    movementNumber: { type: String, required: true, unique: true },
    movementDate: { type: String, required: true },
    billId: { type: String, required: true },
    billNumber: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true },
    uom: { type: String, default: 'Nos' },
    warehouse: { type: String, required: true },
    binLocation: { type: String, default: 'A1-BIN' },
    hasExpiry: { type: Boolean, default: false },
    expiryDate: { type: String, default: '' },
    batchNumber: { type: String, required: true },
    branchId: { type: String, default: '' },
    organisationId: { type: String, default: '' },
    createdBy: { type: String, default: 'System' },
  },
  { timestamps: true }
);

StockMovementSchema.index({ organisationId: 1, movementDate: -1 });
StockMovementSchema.index({ billId: 1 });
StockMovementSchema.index({ productId: 1 });
StockMovementSchema.index({ batchNumber: 1 });

// Export Models
export const Organisation = mongoose.model<IOrganisation>('Organisation', OrganisationSchema);
export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);
export const FinancialYear = mongoose.model<IFinancialYear>('FinancialYear', FinancialYearSchema);
export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export const Product = mongoose.model<IProduct>('Product', ProductSchema);
export const Bill = mongoose.model<IBill>('Bill', BillSchema);
export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
export const StoreItem = mongoose.model<IStoreItem>('StoreItem', StoreItemSchema);
export const DeliveryChallan = mongoose.model<IDeliveryChallan>('DeliveryChallan', DeliveryChallanSchema);
export const UserAccount = mongoose.model<IUserAccount>('UserAccount', UserAccountSchema);
export const AuditHistory = mongoose.model<IAuditHistory>('AuditHistory', AuditHistorySchema);
export const BankAccount = mongoose.model<IBankAccount>('BankAccount', BankAccountSchema);
export const FinancialTransaction = mongoose.model<IFinancialTransaction>('FinancialTransaction', FinancialTransactionSchema);
export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);


