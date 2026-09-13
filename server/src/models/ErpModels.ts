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
  },
  { timestamps: true }
);

// 3. Customer
export interface ICustomer extends Document {
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  gstin: string;
  outstandingBalance: number;
  creditLimit: number;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    gstin: { type: String, required: true },
    outstandingBalance: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 4. Product
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
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    hsnCode: { type: String, required: true },
    category: { type: String, required: true },
    uom: { type: String, required: true },
    sellingPrice: { type: Number, required: true },
    purchaseCost: { type: Number, required: true },
    currentStock: { type: Number, required: true, default: 0 },
    minReorderLevel: { type: Number, required: true, default: 10 },
  },
  { timestamps: true }
);

// 5. Sales Order
export interface ISalesOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ISalesOrder extends Document {
  orderNumber: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  branchId: string;
  items: ISalesOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
}

const SalesOrderSchema = new Schema<ISalesOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    orderDate: { type: String, required: true },
    deliveryDate: { type: String, required: true },
    branchId: { type: String, required: true },
    items: [
      {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        sku: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Confirmed' },
  },
  { timestamps: true }
);

// 6. Invoice
export interface IInvoice extends Document {
  invoiceNumber: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  gstRate: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    salesOrderNumber: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    invoiceDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    subtotal: { type: Number, required: true },
    gstRate: { type: Number, default: 18 },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
  },
  { timestamps: true }
);

// 7. Purchase Order
export interface IPurchaseOrder extends Document {
  poNumber: string;
  vendorName: string;
  vendorGstin: string;
  poDate: string;
  expectedDate: string;
  branchId: string;
  totalAmount: number;
  status: string;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true },
    vendorName: { type: String, required: true },
    vendorGstin: { type: String, required: true },
    poDate: { type: String, required: true },
    expectedDate: { type: String, required: true },
    branchId: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Approved' },
  },
  { timestamps: true }
);

// 8. Store Item
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
  },
  { timestamps: true }
);

// 9. Delivery Challan
export interface IDeliveryChallan extends Document {
  dcNumber: string;
  salesOrderNumber: string;
  customerName: string;
  dispatchDate: string;
  transportMode: string;
  vehicleNumber: string;
  ewayBillNumber: string;
  driverName: string;
  driverPhone: string;
  status: string;
}

const DeliveryChallanSchema = new Schema<IDeliveryChallan>(
  {
    dcNumber: { type: String, required: true, unique: true },
    salesOrderNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    dispatchDate: { type: String, required: true },
    transportMode: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    ewayBillNumber: { type: String, required: true },
    driverName: { type: String, required: true },
    driverPhone: { type: String, required: true },
    status: { type: String, default: 'In Transit' },
  },
  { timestamps: true }
);

// 10. User Account (Authentication)
export interface IUserAccount extends Document {
  email: string;
  mobile: string;
  passwordHash: string;
  name: string;
  role: string;
  branchId: string;
  branchName: string;
  organisationId: string;
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
  },
  { timestamps: true }
);

// Export Models
export const Organisation = mongoose.model<IOrganisation>('Organisation', OrganisationSchema);
export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);
export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export const Product = mongoose.model<IProduct>('Product', ProductSchema);
export const SalesOrder = mongoose.model<ISalesOrder>('SalesOrder', SalesOrderSchema);
export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
export const StoreItem = mongoose.model<IStoreItem>('StoreItem', StoreItemSchema);
export const DeliveryChallan = mongoose.model<IDeliveryChallan>('DeliveryChallan', DeliveryChallanSchema);
export const UserAccount = mongoose.model<IUserAccount>('UserAccount', UserAccountSchema);
