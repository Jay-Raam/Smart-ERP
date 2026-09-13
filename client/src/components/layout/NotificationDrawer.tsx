import React, { useState } from 'react';
import { X, CheckCheck, AlertCircle, ShoppingCart, Receipt, Package, Truck, Clock } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'order' | 'invoice' | 'stock' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateModule?: (module: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateModule,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'system'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      type: 'stock',
      title: 'Low Stock Threshold Reached',
      message: 'Electrolyzer Sub-assembly Mesh (Item #TI-RAW-001) is down to 8 units in Central Store.',
      time: '12 mins ago',
      read: false,
    },
    {
      id: 'n-2',
      type: 'invoice',
      title: 'Payment Received for INV-2026-089',
      message: 'Adani Green Energy Ltd. settled ₹1,85,000 via NEFT reference #UTR9847120.',
      time: '45 mins ago',
      read: false,
    },
    {
      id: 'n-3',
      type: 'order',
      title: 'New High-Priority Sales Order #SO-2026-042',
      message: 'Tata Projects dispatched purchase approval for 10 units MMO Titanium Anodes.',
      time: '2 hours ago',
      read: true,
    },
    {
      id: 'n-4',
      type: 'system',
      title: 'PostgreSQL Isolated Schema Backup',
      message: 'Automated snapshot backup completed for schema tenant_acme.',
      time: '5 hours ago',
      read: true,
    },
    {
      id: 'n-5',
      type: 'stock',
      title: 'PO-2026-015 Inward Delivery Accepted',
      message: '150 Kgs Titanium Seamless Pipe inward verified at Coimbatore Works.',
      time: '1 day ago',
      read: true,
    },
  ]);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'system') return n.type === 'system';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markItemAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'stock':
        return <Package className="h-4 w-4 text-amber-500" />;
      case 'invoice':
        return <Receipt className="h-4 w-4 text-emerald-500" />;
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'system':
      default:
        return <AlertCircle className="h-4 w-4 text-violet-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-white shadow-2xl transition ease-in-out duration-300 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/80">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time activity across branches & operations
              </p>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Read all</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 px-5 pt-2 gap-4 bg-white text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-2.5 transition border-b-2 cursor-pointer ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              All Activity ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`pb-2.5 transition border-b-2 cursor-pointer ${
                activeTab === 'unread'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('system')}
              className={`pb-2.5 transition border-b-2 cursor-pointer ${
                activeTab === 'system'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              System Logs
            </button>
          </div>

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-400">
                <CheckCheck className="h-8 w-8 mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No notifications</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You are all caught up with your operational alerts!
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markItemAsRead(item.id)}
                  className={`flex gap-3 p-3.5 rounded-xl transition cursor-pointer ${
                    item.read
                      ? 'bg-white hover:bg-slate-50/80 text-slate-600'
                      : 'bg-blue-50/40 hover:bg-blue-50/80 text-slate-900 border-l-2 border-blue-600'
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold truncate text-slate-800">
                        {item.title}
                      </p>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                        <Clock className="h-3 w-3" />
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4 bg-slate-50 text-center">
            <p className="text-[11px] text-slate-400">
              Synced with Cloud Notification Queue &bull; Socket Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
