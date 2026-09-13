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
}

export interface Customer {
  id: string;
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

export interface Product {
  id: string;
  sku: string;
  name: string;
  hsnCode: string;
  category: string;
  uom: string; // Nos, Kg, Mtr, Box
  sellingPrice: number;
  purchaseCost: number;
  currentStock: number;
  minReorderLevel: number;
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
  items: SalesOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Confirmed' | 'In Production' | 'Dispatched' | 'Completed';
}

export interface Invoice {
  id: string;
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
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  vendorGstin: string;
  poDate: string;
  expectedDate: string;
  branchId: string;
  totalAmount: number;
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
}

export interface OrganisationInfo {
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
  activeBranchId: string;
  customers: Customer[];
  products: Product[];
  salesOrders: SalesOrder[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  storeItems: StoreItem[];
  deliveryChallans: DeliveryChallan[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  fetchBootstrap: () => Promise<void>;
  setActiveBranch: (branchId: string) => void;
  addBranch: (branch: Omit<Branch, 'id'>) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'code'>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
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
  activeBranchId: '',
  customers: [],
  products: [],
  salesOrders: [],
  invoices: [],
  purchaseOrders: [],
  storeItems: [],
  deliveryChallans: [],
  isLoading: false,
  isInitialized: false,

  fetchBootstrap: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/erp/bootstrap');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch bootstrap data`);
      const data = await res.json();

      set({
        organisation: data.organisation || get().organisation,
        branches: data.branches || [],
        activeBranchId: data.branches?.[0]?.id || get().activeBranchId || '',
        customers: data.customers || [],
        products: data.products || [],
        salesOrders: data.salesOrders || [],
        invoices: data.invoices || [],
        purchaseOrders: data.purchaseOrders || [],
        storeItems: data.storeItems || [],
        deliveryChallans: data.deliveryChallans || [],
        isLoading: false,
        isInitialized: true,
      });
    } catch (err: any) {
      set({ isLoading: false });
      showAppToast('Failed to load ERP data from server: ' + err.message, 'error');
    }
  },

  setActiveBranch: (branchId: string) => set({ activeBranchId: branchId }),

  addBranch: async (branch) => {
    try {
      const res = await fetch('/api/erp/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branch),
      });
      if (!res.ok) throw new Error('Failed to create branch');
      const created = await res.json();
      set((state) => ({ branches: [...state.branches, created] }));
      showAppToast(`Branch ${created.name} registered successfully`, 'success');
    } catch (err: any) {
      showAppToast('Error saving branch: ' + err.message, 'error');
    }
  },

  addCustomer: async (customer) => {
    try {
      const res = await fetch('/api/erp/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (!res.ok) throw new Error('Failed to register customer');
      const created = await res.json();
      set((state) => ({ customers: [created, ...state.customers] }));
      showAppToast(`Customer ${created.name} registered successfully`, 'success');
    } catch (err: any) {
      showAppToast('Error saving customer: ' + err.message, 'error');
    }
  },

  addProduct: async (product) => {
    try {
      const res = await fetch('/api/erp/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error('Failed to add product');
      const created = await res.json();

      const newStoreItem: StoreItem = {
        id: `st-${created.id}`,
        productId: created.id,
        productName: created.name,
        sku: created.sku,
        warehouse: 'Chennai Central Depot',
        binLocation: 'BIN-GEN-01',
        availableStock: created.currentStock,
        minLevel: created.minReorderLevel,
        maxLevel: 500,
        lastAudited: new Date().toISOString().split('T')[0],
        status: created.currentStock <= created.minReorderLevel ? 'Low Stock' : 'In Stock',
      };

      set((state) => ({
        products: [created, ...state.products],
        storeItems: [newStoreItem, ...state.storeItems],
      }));
      showAppToast(`Product ${created.name} cataloged`, 'success');
    } catch (err: any) {
      showAppToast('Error saving product: ' + err.message, 'error');
    }
  },

  addSalesOrder: async (so) => {
    try {
      const res = await fetch('/api/erp/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(so),
      });
      if (!res.ok) throw new Error('Failed to create sales order');
      const created = await res.json();
      set((state) => ({ salesOrders: [created, ...state.salesOrders] }));
      showAppToast(`Sales Order ${created.orderNumber} confirmed`, 'success');
    } catch (err: any) {
      showAppToast('Error creating sales order: ' + err.message, 'error');
    }
  },

  addInvoice: async (inv) => {
    try {
      const res = await fetch('/api/erp/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inv),
      });
      if (!res.ok) throw new Error('Failed to create invoice');
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
        body: JSON.stringify(po),
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
        body: JSON.stringify(dc),
      });
      if (!res.ok) throw new Error('Failed to generate delivery challan');
      const created = await res.json();
      set((state) => ({ deliveryChallans: [created, ...state.deliveryChallans] }));
      showAppToast(`Delivery Challan ${created.dcNumber} created`, 'success');
    } catch (err: any) {
      showAppToast('Error creating delivery challan: ' + err.message, 'error');
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
      const updated = await res.json();

      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? { ...p, currentStock: updated.availableStock } : p
        ),
        storeItems: state.storeItems.map((st) =>
          st.productId === productId
            ? { ...st, availableStock: updated.availableStock, status: updated.status }
            : st
        ),
      }));
      showAppToast('Store stock balance updated', 'success');
    } catch (err: any) {
      showAppToast('Error adjusting stock: ' + err.message, 'error');
    }
  },
}));
