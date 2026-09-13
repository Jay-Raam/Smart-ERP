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
  city?: string;
  state?: string;
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

export interface SalesOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  branchId: string;
  organisationId?: string;
  financialYear?: string;
  items: SalesOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Confirmed' | 'In Production' | 'Dispatched' | 'Completed';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  salesOrderNumber?: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  customerState?: string;
  billingAddress?: string;
  shippingAddress?: string;
  invoiceDate: string;
  dueDate: string;
  branchId?: string;
  organisationId?: string;
  financialYear?: string;
  items: DocumentItem[];
  subtotal: number;
  taxableAmount: number;
  totalDiscount?: number;
  gstRate: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxAmount: number;
  totalAmount: number;
  totalInWords?: string;
  status: 'Paid' | 'Pending' | 'Overdue';
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
  taxableAmount: number;
  totalDiscount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxAmount: number;
  totalAmount: number;
  totalInWords?: string;
  status: 'Approved' | 'Pending Approval' | 'Received' | 'Cancelled';
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
  salesOrderNumber: string;
  customerName: string;
  dispatchDate: string;
  transportMode: string; // Road, Courier, Sea, Air
  vehicleNumber: string;
  ewayBillNumber: string;
  driverName: string;
  driverPhone: string;
  status: 'Dispatched' | 'In Transit' | 'Delivered';
  branchId?: string;
  organisationId?: string;
  financialYear?: string;
}

export interface OrganisationInfo {
  id?: string;
  name: string;
  cin: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  website: string;
  address: string;
}

interface ErpState {
  organisation: OrganisationInfo;
  branches: Branch[];
  financialYears: FinancialYear[];
  activeOrganisationId: string;
  activeBranchId: string;
  activeFinancialYear: string;
  customers: Customer[];
  vendors: Vendor[];
  products: Product[];
  salesOrders: SalesOrder[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  storeItems: StoreItem[];
  deliveryChallans: DeliveryChallan[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  fetchBootstrap: (overrideOrg?: string, overrideBranch?: string, overrideFy?: string) => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
  switchOrganisation: (orgId: string) => Promise<void>;
  switchFinancialYear: (year: string) => Promise<void>;
  setActiveBranch: (branchId: string) => void;
  addBranch: (branch: Omit<Branch, 'id'>) => Promise<void>;
  addFinancialYear: (fy: Omit<FinancialYear, 'id'>) => Promise<void>;
  updateFinancialYear: (id: string, updates: Partial<FinancialYear>) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'code'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  addVendor: (vendor: Omit<Vendor, 'id' | 'code'>) => Promise<void>;
  updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  approveProduct: (id: string) => Promise<void>;
  rejectProduct: (id: string) => Promise<void>;
  addSalesOrder: (so: Omit<SalesOrder, 'id' | 'orderNumber'>) => Promise<void>;
  addInvoice: (inv: Omit<Invoice, 'id' | 'invoiceNumber'>) => Promise<void>;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber'>) => Promise<void>;
  addDeliveryChallan: (dc: Omit<DeliveryChallan, 'id' | 'dcNumber'>) => Promise<void>;
  updateStoreStock: (productId: string, deltaQuantity: number) => Promise<void>;
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
  branches: [],
  financialYears: [],
  activeOrganisationId: localStorage.getItem('OrganizationId') || '',
  activeBranchId: localStorage.getItem('Branch') || '',
  activeFinancialYear: localStorage.getItem('FinancialYear') || '2026-2027',
  customers: [],
  vendors: [],
  products: [],
  salesOrders: [],
  invoices: [],
  purchaseOrders: [],
  storeItems: [],
  deliveryChallans: [],
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
      if (finalData.organisation?._id) {
        localStorage.setItem('OrganizationId', finalData.organisation._id);
      }

      set({
        organisation: finalData.organisation || get().organisation,
        branches: finalData.branches || [],
        financialYears: finalData.financialYears || [],
        activeOrganisationId: orgId,
        activeBranchId: activeBrId,
        activeFinancialYear: activeFy,
        customers: finalData.customers || [],
        vendors: finalData.vendors || [],
        products: finalData.products || [],
        salesOrders: finalData.salesOrders || [],
        invoices: finalData.invoices || [],
        purchaseOrders: finalData.purchaseOrders || [],
        storeItems: finalData.storeItems || [],
        deliveryChallans: finalData.deliveryChallans || [],
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
    set({ activeOrganisationId: orgId });
    localStorage.setItem('OrganizationId', orgId);
    await get().fetchBootstrap(orgId, '', get().activeFinancialYear);
    showAppToast('Organisation workspace switched', 'info');
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

  addFinancialYear: async (fy) => {
    try {
      const res = await fetch('/api/erp/financial-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fy,
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
        }),
      });
      if (!res.ok) throw new Error('Failed to create financial year');
      const created = await res.json();
      set((state) => ({ financialYears: [created, ...state.financialYears] }));
      showAppToast(`Financial Year ${created.yearName} created successfully`, 'success');
    } catch (err: any) {
      showAppToast('Error saving financial year: ' + err.message, 'error');
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
      if (!res.ok) throw new Error('Failed to create customer');
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

  addSalesOrder: async (so) => {
    try {
      const res = await fetch('/api/erp/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...so,
          branchId: get().activeBranchId || localStorage.getItem('Branch'),
          organisationId: get().activeOrganisationId || localStorage.getItem('OrganizationId'),
          financialYear: get().activeFinancialYear || localStorage.getItem('FinancialYear') || '2026-2027',
        }),
      });
      if (!res.ok) throw new Error('Failed to create sales order');
      const created = await res.json();
      set((state) => ({ salesOrders: [created, ...state.salesOrders] }));
      showAppToast(`Sales Order ${created.orderNumber} placed`, 'success');
    } catch (err: any) {
      showAppToast('Error placing sales order: ' + err.message, 'error');
    }
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
    } catch (err: any) {
      showAppToast('Error generating invoice: ' + err.message, 'error');
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
      showAppToast(`Purchase Order ${created.poNumber} issued`, 'success');
    } catch (err: any) {
      showAppToast('Error issuing PO: ' + err.message, 'error');
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
}));
