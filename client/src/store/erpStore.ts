import { create } from 'zustand';
import { showAppToast } from '../utils/handleApiError';

export interface Branch {
  id: string;
  code: string;
  name: string;
  location: string;
  address: string;
  gstin: string;
  phone: string;
  isHeadOffice: boolean;
  organisationId?: string;
}

export interface FinancialYear {
  id: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'Active' | 'Closed';
  organisationId?: string;
  branchId?: string;
}

export interface CustomerAddress {
  _id?: string;
  id?: string;
  type: 'BILLING' | 'SHIPPING';
  attention?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  billingAddress?: string;
  shippingAddress?: string;
  city: string;
  state: string;
  billingState?: string;
  shippingState?: string;
  gstin: string;
  outstandingBalance: number;
  creditLimit: number;
  addresses?: CustomerAddress[];
  organisationId?: string;
  branchId?: string;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  billingState?: string;
  shippingState?: string;
  gstin?: string;
  pan?: string;
  organisationId?: string;
  branchId?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  hsnCode: string;
  category: string;
  uom: string; // Nos, Kg, Mtr, Box
  sellingPrice: number;
  purchaseCost?: number;
  currentStock: number;
  minReorderLevel: number;
  taxRate: number;
  status?: 'ACTIVE' | 'INACTIVE';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  organisationId?: string;
  branchId?: string;
}

export interface DocumentItem {
  id?: string;
  productId: string;
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
  uom?: string;
  discountAmount?: number;
  discountPercent?: number;
  taxRate: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalTax?: number;
  totalAmount?: number;
}

export interface BankAccount {
  id: string;
  accountHolderName: string;
  accountHolderType: 'ORGANISATION' | 'CUSTOMER' | 'VENDOR';
  partyId?: string;
  partyName?: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'CURRENT' | 'SAVINGS' | 'OVERDRAFT' | 'CASH_CREDIT';
  currency: string;
  openingBalance: number;
  balance: number;
  isPrimary: boolean;
  isActive: boolean;
  notes?: string;
  organisationId?: string;
  branchId?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface FinancialTransaction {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  type: 'CUSTOMER_PAYMENT' | 'VENDOR_PAYMENT' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT' | 'REVERSAL' | 'VENDOR_ADVANCE';
  transactionType?: string;
  bankAccountId: string;
  bankName?: string;
  accountNumber?: string;
  partyType?: 'CUSTOMER' | 'VENDOR' | 'INTERNAL' | 'OTHER';
  partyId?: string;
  partyName?: string;
  invoiceId?: string;
  billId?: string;
  purchaseOrderId?: string;
  debit: number;
  credit: number;
  runningBalance: number;
  paymentMode: 'CASH' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'UPI' | 'CARD' | 'NET_BANKING';
  referenceNumber?: string;
  notes?: string;
  status: 'POSTED' | 'REVERSED';
  reversalTxNumber?: string;
  organisationId: string;
  branchId?: string;
  financialYear: string;
  createdBy: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  poId?: string;
  poNumber?: string;
  purchaseOrderNumber?: string;
  vendorInvoiceNumber?: string;
  vendorId?: string;
  vendorName: string;
  vendorGstin?: string;
  vendorState?: string;
  vendorAddress?: string;
  billingAddress?: string;
  shippingAddress?: string;
  items: DocumentItem[];
  subtotal: number;
  totalDiscount?: number;
  shippingCharge: number;
  shippingTax: number;
  taxableAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount?: number;
  outstandingAmount?: number;
  advanceAdjusted?: number;
  paymentStatus?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  storeMovementStatus?: 'PENDING' | 'PARTIALLY_MOVED' | 'FULLY_MOVED';
  totalInWords?: string;
  status: 'Pending' | 'Paid' | 'Approved' | 'Overdue';
  branchId?: string;
  organisationId?: string;
  financialYear?: string;
}

export interface InvoiceHistoryItem {
  action: string;
  timestamp: string;
  user?: string;
  details?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  customerState?: string;
  billingAddress?: string;
  shippingAddress?: string;
  billingState?: string;
  shippingState?: string;
  invoiceDate: string;
  dueDate: string;
  branchId?: string;
  organisationId?: string;
  financialYear?: string;
  items: DocumentItem[];
  subtotal: number;
  shippingCharge: number;
  shippingTax: number;
  taxableAmount: number;
  totalDiscount?: number;
  gstRate: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount?: number;
  outstandingAmount?: number;
  paymentStatus?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  totalInWords?: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  termsAndConditions?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    accountName?: string;
  };
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  signedQrCode?: string;
  ewayBillNumber?: string;
  ewayBillDate?: string;
  einvoiceStatus?: 'PENDING' | 'GENERATED' | 'FAILED' | 'CANCELLED';
  history?: InvoiceHistoryItem[];
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId?: string;
  vendorName: string;
  vendorGstin?: string;
  vendorAddress?: string;
  vendorState?: string;
  billingAddress?: string;
  shippingAddress?: string;
  poDate: string;
  expectedDate: string;
  branchId: string;
  organisationId?: string;
  financialYear?: string;
  items: DocumentItem[];
  subtotal: number;
  shippingCharge: number;
  shippingTax: number;
  taxableAmount: number;
  totalDiscount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount?: number;
  outstandingAmount?: number;
  paymentStatus?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  isAutoReorder?: boolean;
  totalInWords?: string;
  status: 'Approved' | 'Pending Approval' | 'Received' | 'Cancelled' | 'Billed' | 'PARTIALLY_BILLED' | 'FULLY_BILLED' | 'AUTO_REORDER_PENDING';
}

export interface StoreItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouse: string;
  binLocation: string;
  availableStock: number;
  minLevel: number;
  maxLevel: number;
  lastAudited: string;
  status: 'In Stock' | 'Low Stock' | 'Critical';
  branchId?: string;
  organisationId?: string;
}

export interface DeliveryChallan {
  id: string;
  dcNumber: string;
  invoiceId?: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerGstin?: string;
  billingAddress?: string;
  shippingAddress?: string;
  dispatchDate: string;
  transportMode: string; // Road, Courier, Sea, Air
  vehicleNumber: string;
  ewayBillNumber: string;
  driverName: string;
  driverPhone: string;
  items?: DocumentItem[];
  status: 'Dispatched' | 'In Transit' | 'Delivered';
  branchId?: string;
  organisationId?: string;
  financialYear?: string;
}

export interface OrganisationInfo {
  id?: string;
  _id?: string;
  name: string;
  cin: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  branchCount?: number;
}

interface ErpState {
  organisation: OrganisationInfo;
  organisations: OrganisationInfo[];
  branches: Branch[];
  financialYears: FinancialYear[];
  activeOrganisationId: string;
  activeBranchId: string;
  activeFinancialYear: string;
  customers: Customer[];
  vendors: Vendor[];
  products: Product[];
  bills: Bill[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  storeItems: StoreItem[];
  deliveryChallans: DeliveryChallan[];
  bankAccounts: BankAccount[];
  financialTransactions: FinancialTransaction[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  fetchBootstrap: (overrideOrg?: string, overrideBranch?: string, overrideFy?: string) => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
  switchOrganisation: (orgId: string) => Promise<void>;
  switchFinancialYear: (year: string) => Promise<void>;
  setActiveBranch: (branchId: string) => void;
  addOrganisation: (org: Omit<OrganisationInfo, 'id' | '_id'>) => Promise<OrganisationInfo | undefined>;
  updateOrganisation: (id: string, updates: Partial<OrganisationInfo>) => Promise<void>;
  deleteOrganisation: (id: string) => Promise<void>;
  addBranch: (branch: Omit<Branch, 'id'>) => Promise<void>;
  updateBranch: (id: string, updates: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  addFinancialYear: (fy: Omit<FinancialYear, 'id'>) => Promise<void>;
  updateFinancialYear: (id: string, updates: Partial<FinancialYear>) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'code'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  addVendor: (vendor: Omit<Vendor, 'id' | 'code'>) => Promise<void>;
  updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  approveProduct: (id: string) => Promise<void>;
  rejectProduct: (id: string) => Promise<void>;
  updateProductStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') => Promise<void>;
  addBill: (bill: Partial<Bill>) => Promise<Bill | undefined>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;
  convertPoToBill: (
    poId: string,
    invoiceNumOrOverrides?: string | Partial<Bill>,
    billDate?: string,
    dueDate?: string
  ) => Promise<Bill | undefined>;
  addInvoice: (inv: Omit<Invoice, 'id' | 'invoiceNumber'>) => Promise<Invoice | undefined>;
  updateInvoice: (id: string, invoiceData: Partial<Invoice>) => Promise<Invoice | undefined>;
  addCustomerAddress: (customerId: string, address: Omit<CustomerAddress, 'id' | '_id' | 'isActive'>) => Promise<Customer | undefined>;
  activateCustomerAddress: (customerId: string, addressId: string) => Promise<Customer | undefined>;
  updateCustomerAddress: (customerId: string, addressId: string, addressData: Partial<CustomerAddress>) => Promise<Customer | undefined>;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber'>) => Promise<PurchaseOrder | undefined>;
  addDeliveryChallan: (dc: Omit<DeliveryChallan, 'id' | 'dcNumber'>) => Promise<void>;
  updateStoreStock: (productId: string, deltaQuantity: number) => Promise<void>;
  fetchBankAccounts: () => Promise<void>;
  addBankAccount: (account: Partial<BankAccount>) => Promise<BankAccount | undefined>;
  setPrimaryBankAccount: (id: string) => Promise<void>;
  fetchTransactions: (params?: Record<string, string>) => Promise<FinancialTransaction[]>;
  recordCustomerPayment: (data: any) => Promise<any>;
  recordVendorPayment: (data: any) => Promise<any>;
  recordVendorAdvance: (data: any) => Promise<any>;
  moveBillToStore: (billId: string, payload: any) => Promise<any>;
  approveAutoReorderPO: (poId: string) => Promise<any>;
  generateEInvoice: (id: string) => Promise<Invoice | null>;
}

export const useErpStore = create<ErpState>((set, get) => ({
  organisation: {
    name: 'Smart Enterprise Industries Ltd.',
    cin: 'U29100TN2026PLC089211',
    gstin: '33AAACT1024K1Z8',
    pan: 'AAACT1024K',
    email: 'operations@smarterp.com',
    phone: '+91 44 2839 4910',
    website: 'https://smart.erp.com',
    address: 'Plot 48/A, Industrial Estate, Guindy, Chennai - 600032, Tamil Nadu, India',
  },
  organisations: [],
  branches: [],
  financialYears: [],
  activeOrganisationId: localStorage.getItem('OrganizationId') || '',
  activeBranchId: localStorage.getItem('Branch') || '',
  activeFinancialYear: localStorage.getItem('FinancialYear') || '2026-2027',
  customers: [],
  vendors: [],
  products: [],
  bills: [],
  invoices: [],
  purchaseOrders: [],
  storeItems: [],
  deliveryChallans: [],
  bankAccounts: [],
  financialTransactions: [],
  isLoading: false,
  isInitialized: false,

  fetchBootstrap: async (overrideOrg?: string, overrideBranch?: string, overrideFy?: string) => {
    try {
      set({ isLoading: true });
      const orgId = overrideOrg !== undefined ? overrideOrg : (get().activeOrganisationId || localStorage.getItem('OrganizationId') || '');
      const branchId = overrideBranch !== undefined ? overrideBranch : (get().activeBranchId || localStorage.getItem('Branch') || '');
      const fy = overrideFy !== undefined ? overrideFy : (get().activeFinancialYear || localStorage.getItem('FinancialYear') || '2026-2027');

      const query = new URLSearchParams();
      if (orgId) query.set('organisationId', orgId);
      if (branchId) query.set('branchId', branchId);
      if (fy) query.set('financialYear', fy);

      const res = await fetch(`/api/erp/bootstrap?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch bootstrap data`);
      const data = await res.json();

      let finalData = data;
      let activeBrId = branchId;

      if (data.branches && data.branches.length > 0) {
        const found = data.branches.some((b: any) => b.id === branchId);
        if (!found) {
          activeBrId = data.branches[0].id;
          const retryQuery = new URLSearchParams();
          if (orgId) retryQuery.set('organisationId', orgId);
          retryQuery.set('branchId', activeBrId);
          if (fy) retryQuery.set('financialYear', fy);

          const retryRes = await fetch(`/api/erp/bootstrap?${retryQuery.toString()}`);
          if (retryRes.ok) {
            finalData = await retryRes.json();
          }
        }
      }

      const activeFy = fy || finalData.financialYears?.find((y: any) => y.isCurrent)?.yearName || '2026-2027';

      if (activeBrId) {
        localStorage.setItem('Branch', activeBrId);
        const brObj = finalData.branches?.find((b: any) => b.id === activeBrId);
        if (brObj) localStorage.setItem('BranchName', brObj.name);
      }
      if (activeFy) {
        localStorage.setItem('FinancialYear', activeFy);
      }
      const resolvedOrgId = finalData.organisation?.id || finalData.organisation?._id;
      if (resolvedOrgId) {
        localStorage.setItem('OrganizationId', resolvedOrgId);
      }

      set({
        organisation: finalData.organisation || get().organisation,
        organisations: finalData.organisations || get().organisations || [],
        branches: finalData.branches || [],
        financialYears: finalData.financialYears || [],
        activeOrganisationId: resolvedOrgId || orgId,
        activeBranchId: activeBrId,
        activeFinancialYear: activeFy,
        customers: finalData.customers || [],
        vendors: finalData.vendors || [],
        products: finalData.products || [],
        bills: finalData.bills || [],
        invoices: finalData.invoices || [],
        purchaseOrders: finalData.purchaseOrders || [],
        storeItems: finalData.storeItems || [],
        deliveryChallans: finalData.deliveryChallans || [],
        bankAccounts: finalData.bankAccounts || [],
        isLoading: false,
        isInitialized: true,
      });
    } catch (err: any) {
      set({ isLoading: false });
      showAppToast('Failed to load ERP data from server: ' + err.message, 'error');
    }
  },

  switchBranch: async (branchId: string) => {
    set({ activeBranchId: branchId });
    localStorage.setItem('Branch', branchId);
    const br = get().branches.find((b) => b.id === branchId);
    if (br) localStorage.setItem('BranchName', br.name);
    await get().fetchBootstrap(get().activeOrganisationId, branchId, get().activeFinancialYear);
    showAppToast(`Switched branch to ${br?.name || branchId}`, 'info');
  },

  switchOrganisation: async (orgId: string) => {
    set({ activeOrganisationId: orgId, activeBranchId: '' });
    localStorage.setItem('OrganizationId', orgId);
    localStorage.removeItem('Branch');
    localStorage.removeItem('BranchName');
    await get().fetchBootstrap(orgId, '', get().activeFinancialYear);
    const targetOrg = get().organisations.find((o) => o.id === orgId || o._id === orgId);
    showAppToast(`Switched workspace to ${targetOrg?.name || 'Organisation'}`, 'info');
  },

  switchFinancialYear: async (year: string) => {
    set({ activeFinancialYear: year });
    localStorage.setItem('FinancialYear', year);
    await get().fetchBootstrap(get().activeOrganisationId, get().activeBranchId, year);
    showAppToast(`Switched Financial Year to ${year}`, 'info');
  },

  setActiveBranch: (branchId: string) => {
    get().switchBranch(branchId);
  },

  addOrganisation: async (orgData) => {
    try {
      const res = await fetch('/api/erp/organisations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create organisation');
      }
      const created = await res.json();
      set((state) => ({ organisations: [...state.organisations, created] }));
      showAppToast(`Organisation ${created.name} created successfully`, 'success');
      await get().switchOrganisation(created.id || created._id);
      return created;
    } catch (err: any) {
      showAppToast('Error creating organisation: ' + err.message, 'error');
      throw err;
    }
  },

  updateOrganisation: async (id, updates) => {
    try {
      const res = await fetch(`/api/erp/organisations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update organisation');
      const updated = await res.json();
      set((state) => ({
        organisations: state.organisations.map((o) =>
          o.id === id || o._id === id ? { ...o, ...updated } : o
        ),
        organisation:
          state.organisation.id === id || (state.organisation as any)._id === id
            ? { ...state.organisation, ...updated }
            : state.organisation,
      }));
      showAppToast('Organisation details updated', 'success');
    } catch (err: any) {
      showAppToast('Error updating organisation: ' + err.message, 'error');
      throw err;
    }
  },

  deleteOrganisation: async (id) => {
    try {
      const res = await fetch(`/api/erp/organisations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete organisation');
      }
      set((state) => ({
        organisations: state.organisations.filter((o) => o.id !== id && o._id !== id),
      }));
      showAppToast('Organisation deleted successfully', 'info');
      const remaining = get().organisations;
      if (remaining.length > 0) {
        await get().switchOrganisation(remaining[0].id || remaining[0]._id || '');
      }
    } catch (err: any) {
      showAppToast('Error deleting organisation: ' + err.message, 'error');
      throw err;
    }
  },

  addBranch: async (branch) => {
    try {
      const res = await fetch('/api/erp/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...branch,
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
        }),
      });
      if (!res.ok) throw new Error('Failed to create branch');
      const created = await res.json();
      set((state) => ({ branches: [...state.branches, created] }));
      showAppToast(`Branch ${created.name} registered successfully`, 'success');
    } catch (err: any) {
      showAppToast('Error saving branch: ' + err.message, 'error');
    }
  },

  updateBranch: async (id, updates) => {
    try {
      const res = await fetch(`/api/erp/branches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update branch');
      const updated = await res.json();
      set((state) => ({
        branches: state.branches.map((b) => (b.id === id ? { ...b, ...updated } : b)),
      }));
      showAppToast(`Branch ${updated.name} updated successfully`, 'success');
    } catch (err: any) {
      showAppToast('Error updating branch: ' + err.message, 'error');
      throw err;
    }
  },

  deleteBranch: async (id) => {
    try {
      const res = await fetch(`/api/erp/branches/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete branch');
      }
      set((state) => ({
        branches: state.branches.filter((b) => b.id !== id),
      }));
      showAppToast('Branch removed successfully', 'info');
      if (get().activeBranchId === id && get().branches.length > 0) {
        await get().switchBranch(get().branches[0].id);
      }
    } catch (err: any) {
      showAppToast('Error deleting branch: ' + err.message, 'error');
      throw err;
    }
  },

  addFinancialYear: async (fy) => {
    try {
      const res = await fetch('/api/erp/financial-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fy,
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
          branchId: get().activeBranchId || localStorage.getItem('Branch'),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create financial year');
      }
      const created = await res.json();
      set((state) => ({ financialYears: [created, ...state.financialYears] }));
      showAppToast(`Financial Year ${created.yearName} created successfully`, 'success');
      return created;
    } catch (err: any) {
      showAppToast('Error saving financial year: ' + err.message, 'error');
      throw err;
    }
  },

  updateFinancialYear: async (id, updates) => {
    try {
      const res = await fetch(`/api/erp/financial-years/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update financial year');
      const updated = await res.json();
      set((state) => ({
        financialYears: state.financialYears.map((fy) => (fy.id === id ? updated : updates.isCurrent ? { ...fy, isCurrent: false } : fy)),
      }));
      showAppToast(`Financial Year updated successfully`, 'success');
    } catch (err: any) {
      showAppToast('Error updating financial year: ' + err.message, 'error');
    }
  },

  addCustomer: async (customer) => {
    try {
      const res = await fetch('/api/erp/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customer,
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
          branchId: get().activeBranchId || localStorage.getItem('Branch'),
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to create customer');
      }
      const created = await res.json();
      set((state) => ({ customers: [created, ...state.customers] }));
      showAppToast(`Customer ${created.name} registered`, 'success');
    } catch (err: any) {
      showAppToast('Error saving customer: ' + err.message, 'error');
    }
  },

  updateCustomer: async (id, updates) => {
    try {
      const res = await fetch(`/api/erp/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update customer');
      const updated = await res.json();
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? updated : c)),
      }));
      showAppToast(`Customer updated successfully`, 'success');
    } catch (err: any) {
      showAppToast('Error updating customer: ' + err.message, 'error');
    }
  },

  addVendor: async (vendor) => {
    try {
      const res = await fetch('/api/erp/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vendor,
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
          branchId: get().activeBranchId || localStorage.getItem('Branch'),
        }),
      });
      if (!res.ok) throw new Error('Failed to create vendor');
      const created = await res.json();
      set((state) => ({ vendors: [created, ...state.vendors] }));
      showAppToast(`Vendor ${created.name} added successfully`, 'success');
    } catch (err: any) {
      showAppToast('Error adding vendor: ' + err.message, 'error');
    }
  },

  updateVendor: async (id, updates) => {
    try {
      const res = await fetch(`/api/erp/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update vendor');
      const updated = await res.json();
      set((state) => ({
        vendors: state.vendors.map((v) => (v.id === id ? updated : v)),
      }));
      showAppToast(`Vendor updated successfully`, 'success');
    } catch (err: any) {
      showAppToast('Error updating vendor: ' + err.message, 'error');
    }
  },

  addProduct: async (product) => {
    try {
      const res = await fetch('/api/erp/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
          branchId: get().activeBranchId || localStorage.getItem('Branch'),
        }),
      });
      if (!res.ok) throw new Error('Failed to create product');
      const created = await res.json();
      set((state) => ({ products: [created, ...state.products] }));
      showAppToast(`Product ${created.sku} submitted for approval`, 'success');
    } catch (err: any) {
      showAppToast('Error saving product: ' + err.message, 'error');
    }
  },

  approveProduct: async (id: string) => {
    try {
      const res = await fetch(`/api/erp/products/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to approve product');
      }
      const updated = await res.json();
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...updated, approvalStatus: 'Approved' } : p)),
      }));
      showAppToast(`Product approved successfully`, 'success');
    } catch (err: any) {
      showAppToast('Error approving product: ' + err.message, 'error');
    }
  },

  rejectProduct: async (id: string) => {
    try {
      const res = await fetch(`/api/erp/products/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to reject product');
      }
      const updated = await res.json();
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...updated, approvalStatus: 'Rejected' } : p)),
      }));
      showAppToast(`Product rejected`, 'info');
    } catch (err: any) {
      showAppToast('Error rejecting product: ' + err.message, 'error');
    }
  },

  addBill: async (billData) => {
    try {
      const res = await fetch('/api/erp/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...billData,
          branchId: get().activeBranchId || localStorage.getItem('Branch'),
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
          financialYear: get().activeFinancialYear || localStorage.getItem('FinancialYear') || '2026-2027',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create bill');
      }
      const created = await res.json();
      set((state) => ({ bills: [created, ...state.bills] }));
      showAppToast(`Vendor Bill ${created.billNumber} created successfully`, 'success');
      return created;
    } catch (err: any) {
      showAppToast('Error creating bill: ' + err.message, 'error');
      throw err;
    }
  },

  updateBill: async (id, updates) => {
    try {
      const res = await fetch(`/api/erp/bills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update bill');
      }
      const updated = await res.json();
      set((state) => ({
        bills: state.bills.map((b) => (b.id === id ? updated : b)),
      }));
      showAppToast(`Bill ${updated.billNumber} updated`, 'info');
    } catch (err: any) {
      showAppToast('Error updating bill: ' + err.message, 'error');
    }
  },

  convertPoToBill: async (poId, invoiceNumOrOverrides, billDateParam, dueDateParam) => {
    const po = get().purchaseOrders.find((p) => p.id === poId);
    if (!po) {
      showAppToast('Purchase order not found for conversion', 'error');
      return undefined;
    }

    const today = billDateParam || new Date().toISOString().split('T')[0];
    const dueDate = dueDateParam || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const overrides: Partial<Bill> = typeof invoiceNumOrOverrides === 'object' && invoiceNumOrOverrides !== null
      ? invoiceNumOrOverrides
      : {
          vendorInvoiceNumber: typeof invoiceNumOrOverrides === 'string' ? invoiceNumOrOverrides : undefined,
          billDate: today,
          dueDate,
        };

    const billPayload: Partial<Bill> = {
      poId: po.id,
      poNumber: po.poNumber,
      purchaseOrderNumber: po.poNumber,
      vendorInvoiceNumber: overrides.vendorInvoiceNumber || (typeof invoiceNumOrOverrides === 'string' ? invoiceNumOrOverrides : undefined),
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      vendorGstin: po.vendorGstin,
      vendorState: po.vendorState || 'Tamil Nadu',
      vendorAddress: po.vendorAddress,
      billingAddress: po.billingAddress,
      shippingAddress: po.shippingAddress,
      billDate: today,
      dueDate,
      items: po.items,
      shippingCharge: po.shippingCharge || 0,
      subtotal: po.subtotal,
      taxableAmount: po.taxableAmount,
      cgstAmount: po.cgstAmount,
      sgstAmount: po.sgstAmount,
      igstAmount: po.igstAmount,
      taxAmount: po.taxAmount,
      totalAmount: po.totalAmount,
      totalInWords: po.totalInWords,
      status: 'Pending',
      branchId: po.branchId,
      organisationId: po.organisationId,
      financialYear: po.financialYear,
      ...overrides,
    };

    return await get().addBill(billPayload);
  },

  addInvoice: async (inv) => {
    try {
      const res = await fetch('/api/erp/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inv,
          branchId: get().activeBranchId || localStorage.getItem('Branch'),
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
          financialYear: get().activeFinancialYear || localStorage.getItem('FinancialYear') || '2026-2027',
        }),
      });
      if (!res.ok) throw new Error('Failed to generate invoice');
      const created = await res.json();
      set((state) => ({ invoices: [created, ...state.invoices] }));
      showAppToast(`Tax Invoice ${created.invoiceNumber} generated`, 'success');
      return created;
    } catch (err: any) {
      showAppToast('Error generating invoice: ' + err.message, 'error');
    }
  },

  updateInvoice: async (id, inv) => {
    try {
      const res = await fetch(`/api/erp/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inv),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update invoice');
      }
      const updated = await res.json();
      set((state) => ({
        invoices: state.invoices.map((i) => (i.id === id ? updated : i)),
      }));
      showAppToast(`Tax Invoice ${updated.invoiceNumber} updated successfully`, 'success');
      return updated;
    } catch (err: any) {
      showAppToast('Error updating invoice: ' + err.message, 'error');
      throw err;
    }
  },

  generateEInvoice: async (id) => {
    try {
      const res = await fetch(`/api/erp/invoices/${id}/generate-irn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate E-Invoice IRN');
      }
      const result = await res.json();
      const updated = result.data || result;
      set((state) => ({
        invoices: state.invoices.map((i) =>
          i.id === id || (i as any)._id === id ? { ...i, ...updated, id: updated.id || id } : i
        ),
      }));
      showAppToast(`E-Invoice IRN generated for ${updated.invoiceNumber}`, 'success');
      return updated;
    } catch (err: any) {
      showAppToast(err.message, 'error');
      return null;
    }
  },

  addCustomerAddress: async (customerId, address) => {
    try {
      const res = await fetch(`/api/erp/customers/${customerId}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to add address');
      }
      const updatedCustomer = await res.json();
      set((state) => ({
        customers: state.customers.map((c) => (c.id === customerId ? updatedCustomer : c)),
      }));
      showAppToast('Customer address added and activated', 'success');
      return updatedCustomer;
    } catch (err: any) {
      showAppToast('Error adding address: ' + err.message, 'error');
      throw err;
    }
  },

  activateCustomerAddress: async (customerId, addressId) => {
    try {
      const res = await fetch(`/api/erp/customers/${customerId}/addresses/${addressId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to activate address');
      }
      const updatedCustomer = await res.json();
      set((state) => ({
        customers: state.customers.map((c) => (c.id === customerId ? updatedCustomer : c)),
      }));
      showAppToast('Address activated successfully', 'success');
      return updatedCustomer;
    } catch (err: any) {
      showAppToast('Error activating address: ' + err.message, 'error');
      throw err;
    }
  },

  updateCustomerAddress: async (customerId, addressId, addressData) => {
    try {
      const res = await fetch(`/api/erp/customers/${customerId}/addresses/${addressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update address');
      }
      const updatedCustomer = await res.json();
      set((state) => ({
        customers: state.customers.map((c) => (c.id === customerId ? updatedCustomer : c)),
      }));
      showAppToast('Address updated successfully', 'success');
      return updatedCustomer;
    } catch (err: any) {
      showAppToast('Error updating address: ' + err.message, 'error');
      throw err;
    }
  },

  addPurchaseOrder: async (po) => {
    try {
      const res = await fetch('/api/erp/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...po,
          branchId: get().activeBranchId || localStorage.getItem('Branch'),
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
          financialYear: get().activeFinancialYear || localStorage.getItem('FinancialYear') || '2026-2027',
        }),
      });
      if (!res.ok) throw new Error('Failed to create purchase order');
      const created = await res.json();
      set((state) => ({ purchaseOrders: [created, ...state.purchaseOrders] }));
      showAppToast(`Purchase Order ${created.poNumber} created`, 'success');
      return created;
    } catch (err: any) {
      showAppToast('Error creating purchase order: ' + err.message, 'error');
    }
  },

  addDeliveryChallan: async (dc) => {
    try {
      const res = await fetch('/api/erp/delivery-challans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dc,
          branchId: get().activeBranchId || localStorage.getItem('Branch'),
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
          financialYear: get().activeFinancialYear || localStorage.getItem('FinancialYear') || '2026-2027',
        }),
      });
      if (!res.ok) throw new Error('Failed to dispatch challan');
      const created = await res.json();
      set((state) => ({ deliveryChallans: [created, ...state.deliveryChallans] }));
      showAppToast(`Delivery Challan ${created.dcNumber} dispatched`, 'success');
    } catch (err: any) {
      showAppToast('Error dispatching challan: ' + err.message, 'error');
    }
  },

  updateStoreStock: async (productId: string, deltaQuantity: number) => {
    try {
      const res = await fetch(`/api/erp/store-items/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: deltaQuantity }),
      });
      if (!res.ok) throw new Error('Failed to update stock');
      const updatedStore = await res.json();

      set((state) => ({
        storeItems: state.storeItems.map((s) => (s.productId === productId ? updatedStore : s)),
        products: state.products.map((p) =>
          p.id === productId ? { ...p, currentStock: updatedStore.availableStock } : p
        ),
      }));
      showAppToast(`Stock adjusted by ${deltaQuantity > 0 ? '+' : ''}${deltaQuantity}`, 'info');
    } catch (err: any) {
      showAppToast('Error updating stock: ' + err.message, 'error');
    }
  },

  fetchBankAccounts: async () => {
    try {
      const res = await fetch('/api/erp/bank-accounts');
      if (!res.ok) throw new Error('Failed to fetch bank accounts');
      const data = await res.json();
      set({ bankAccounts: data });
    } catch (err: any) {
      showAppToast('Error fetching bank accounts: ' + err.message, 'error');
    }
  },

  addBankAccount: async (account) => {
    try {
      const res = await fetch('/api/erp/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...account,
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
          branchId: get().activeBranchId || localStorage.getItem('Branch'),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create bank account');
      }
      const resp = await res.json();
      const created = resp.data;
      if (created.isPrimary) {
        set((state) => ({
          bankAccounts: [created, ...state.bankAccounts.map((b) => ({ ...b, isPrimary: false }))],
        }));
      } else {
        set((state) => ({ bankAccounts: [created, ...state.bankAccounts] }));
      }
      showAppToast('Bank account created successfully', 'success');
      return created;
    } catch (err: any) {
      showAppToast(err.message, 'error');
      throw err;
    }
  },

  setPrimaryBankAccount: async (id: string) => {
    try {
      const res = await fetch(`/api/erp/bank-accounts/${id}/set-primary`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to set primary bank account');
      }
      set((state) => ({
        bankAccounts: state.bankAccounts.map((b) => ({
          ...b,
          isPrimary: b.id === id,
        })),
      }));
      showAppToast('Primary bank account updated', 'success');
    } catch (err: any) {
      showAppToast(err.message, 'error');
      throw err;
    }
  },

  fetchTransactions: async (params?: Record<string, string>) => {
    try {
      const query = new URLSearchParams(params || {});
      const res = await fetch(`/api/erp/transactions?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      const txs = data.transactions || [];
      set({ financialTransactions: txs });
      return txs;
    } catch (err: any) {
      showAppToast('Error fetching ledger: ' + err.message, 'error');
      return [];
    }
  },

  updateProductStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    try {
      const res = await fetch(`/api/erp/products/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update product status');
      }
      const updated = await res.json();
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, status: updated.status } : p)),
      }));
      showAppToast(`Product status updated to ${status}`, 'success');
    } catch (err: any) {
      showAppToast(err.message, 'error');
      throw err;
    }
  },

  recordCustomerPayment: async (data: any) => {
    try {
      const res = await fetch('/api/erp/payments/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to record customer payment');
      }
      const result = await res.json();
      const { invoice, transaction } = result.data;
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === invoice.id || inv.id === invoice._id ? { ...inv, ...invoice, id: invoice.id || invoice._id } : inv
        ),
        bankAccounts: state.bankAccounts.map((b) =>
          b.id === transaction.bankAccountId ? { ...b, balance: b.balance + transaction.credit } : b
        ),
        financialTransactions: [transaction, ...state.financialTransactions],
      }));
      showAppToast('Customer payment recorded successfully', 'success');
      return result;
    } catch (err: any) {
      showAppToast(err.message, 'error');
      throw err;
    }
  },

  recordVendorPayment: async (data: any) => {
    try {
      const res = await fetch('/api/erp/payments/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to record vendor payment');
      }
      const result = await res.json();
      const { bill, transaction, bankBalance } = result.data;
      set((state) => ({
        bills: state.bills.map((b) =>
          b.id === bill.id || b.id === bill._id ? { ...b, ...bill, id: bill.id || bill._id } : b
        ),
        bankAccounts: state.bankAccounts.map((b) =>
          b.id === transaction.bankAccountId ? { ...b, balance: bankBalance ?? (b.balance - transaction.debit) } : b
        ),
        financialTransactions: [transaction, ...state.financialTransactions],
      }));
      showAppToast('Vendor payment recorded successfully', 'success');
      return result;
    } catch (err: any) {
      showAppToast(err.message, 'error');
      throw err;
    }
  },

  recordVendorAdvance: async (data: any) => {
    try {
      const res = await fetch('/api/erp/payments/vendor-advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to record vendor advance');
      }
      const result = await res.json();
      const { purchaseOrder, transaction, bankBalance } = result.data;
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((po) =>
          po.id === purchaseOrder.id || po.id === purchaseOrder._id
            ? { ...po, ...purchaseOrder, id: purchaseOrder.id || purchaseOrder._id }
            : po
        ),
        bankAccounts: state.bankAccounts.map((b) =>
          b.id === transaction.bankAccountId ? { ...b, balance: bankBalance ?? (b.balance - transaction.debit) } : b
        ),
        financialTransactions: [transaction, ...state.financialTransactions],
      }));
      showAppToast('Vendor advance recorded successfully against PO', 'success');
      return result;
    } catch (err: any) {
      showAppToast(err.message, 'error');
      throw err;
    }
  },

  moveBillToStore: async (billId: string, payload: any) => {
    try {
      const res = await fetch(`/api/erp/bills/${billId}/move-to-store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to move items to store');
      }
      const result = await res.json();
      get().fetchBootstrap();
      showAppToast('Items successfully moved to Store / Inventory', 'success');
      return result;
    } catch (err: any) {
      showAppToast(err.message, 'error');
      throw err;
    }
  },

  approveAutoReorderPO: async (poId: string) => {
    try {
      const res = await fetch(`/api/erp/purchase-orders/${poId}/approve-reorder`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to approve auto-reorder PO');
      }
      const result = await res.json();
      const updated = result.data;
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((po) => (po.id === poId ? { ...po, status: updated.status } : po)),
      }));
      showAppToast(`Auto-reorder Purchase Order ${updated.poNumber} approved`, 'success');
      return updated;
    } catch (err: any) {
      showAppToast(err.message, 'error');
      throw err;
    }
  },
}));
