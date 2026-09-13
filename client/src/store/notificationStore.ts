import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationItem {
  id: string;
  category: 'order' | 'invoice' | 'stock' | 'delivery' | 'system';
  priority: 'critical' | 'high' | 'normal' | 'success';
  title: string;
  message: string;
  branchCode: string;
  branchName: string;
  time: string;
  read: boolean;
  actionModule?: string;
  actionLabel?: string;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    category: 'stock',
    priority: 'critical',
    title: 'Low Inventory Reorder Notice',
    message: 'Platinized Titanium Mesh Anode Grade 1 (SMART-PLT-303) has only 8 units remaining in Central Store (Min Reorder Level: 10).',
    branchCode: 'BR-CHN-01',
    branchName: 'Chennai HQ',
    time: '12m ago',
    read: false,
    actionModule: 'purchase',
    actionLabel: 'Create PO',
  },
  {
    id: 'n-2',
    category: 'invoice',
    priority: 'success',
    title: 'Payment Received for INV-2026-001',
    message: 'Bharat Heavy Electricals Ltd (BHEL) settled ₹3,39,840 against Tax Invoice #INV-2026-001 via NEFT (#UTR-2026-8841).',
    branchCode: 'BR-CHN-01',
    branchName: 'Chennai HQ',
    time: '35m ago',
    read: false,
    actionModule: 'invoices',
    actionLabel: 'View Invoice',
  },
  {
    id: 'n-3',
    category: 'order',
    priority: 'high',
    title: 'New Confirmed Sales Order #SO-2026-084',
    message: 'Ashok Leyland Defence & Commercial issued production release for 1 unit MMO Titanium Anodes (₹2,95,000 incl. 18% GST).',
    branchCode: 'BR-CHN-01',
    branchName: 'Chennai HQ',
    time: '2h ago',
    read: true,
    actionModule: 'sales',
    actionLabel: 'View Order',
  },
  {
    id: 'n-4',
    category: 'delivery',
    priority: 'normal',
    title: 'Delivery Challan #DC-2026-002 Dispatched',
    message: 'Consignment handed over to VRL Logistics for transit to Tata Motors Heavy Vehicle Division. E-Way Bill is active.',
    branchCode: 'BR-CHN-01',
    branchName: 'Chennai HQ',
    time: '4h ago',
    read: true,
    actionModule: 'delivery',
    actionLabel: 'Track DC',
  },
  {
    id: 'n-5',
    category: 'system',
    priority: 'normal',
    title: 'MongoDB Atlas Cloud Snapshot Verified',
    message: 'Automated continuous telemetry backup and multi-branch replica sync verified on Atlas cluster.',
    branchCode: 'GLOBAL',
    branchName: 'All Branches',
    time: '6h ago',
    read: true,
  },
  {
    id: 'n-6',
    category: 'stock',
    priority: 'success',
    title: 'PO-2026-015 Inward Verified',
    message: '150 Kgs Titanium Seamless Industrial Pipe inward received, inspected, and stock ledger updated at Coimbatore Works.',
    branchCode: 'BR-CBE-02',
    branchName: 'Coimbatore',
    time: '1d ago',
    read: true,
    actionModule: 'store',
    actionLabel: 'Inspect Stock',
  },
];

interface NotificationState {
  notifications: NotificationItem[];
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  toggleReadStatus: (id: string) => void;
  markAllAsRead: () => void;
  markAllAsUnread: () => void;
  deleteNotification: (id: string) => void;
  resetNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: INITIAL_NOTIFICATIONS,
      markAsRead: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAsUnread: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: false } : n
          ),
        })),
      toggleReadStatus: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: !n.read } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      markAllAsUnread: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: false })),
        })),
      deleteNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      resetNotifications: () => set({ notifications: INITIAL_NOTIFICATIONS }),
    }),
    {
      name: 'smart_erp_notifications_storage_v1',
    }
  )
);
