import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCheck,
  AlertCircle,
  ShoppingCart,
  Receipt,
  Package,
  Truck,
  Clock,
  Bell,
  Check,
  ArrowRight,
  ShieldCheck,
  Building,
  Radio,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

import {
  NotificationItem,
  useNotificationStore,
} from '../../store/notificationStore';

export type { NotificationItem };

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
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'billing' | 'inventory' | 'system'>('all');
  const notifications = useNotificationStore((state) => state.notifications);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAsUnread = useNotificationStore((state) => state.markAsUnread);
  const toggleReadStatus = useNotificationStore((state) => state.toggleReadStatus);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const markAllAsUnread = useNotificationStore((state) => state.markAllAsUnread);
  const deleteNotification = useNotificationStore((state) => state.deleteNotification);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const categoryCounts = useMemo(() => {
    return {
      billing: notifications.filter((n) => n.category === 'order' || n.category === 'invoice').length,
      inventory: notifications.filter((n) => n.category === 'stock' || n.category === 'delivery').length,
      system: notifications.filter((n) => n.category === 'system').length,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread') return !n.read;
      if (activeTab === 'billing') return n.category === 'order' || n.category === 'invoice';
      if (activeTab === 'inventory') return n.category === 'stock' || n.category === 'delivery';
      if (activeTab === 'system') return n.category === 'system';
      return true;
    });
  }, [notifications, activeTab]);

  if (!isOpen) return null;

  const handleAction = (item: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(item.id);
    if (item.actionModule && onNavigateModule) {
      const targetModule = item.actionModule === 'sales' ? 'invoices' : item.actionModule;
      onNavigateModule(targetModule);
      onClose();
    }
  };

  const getPriorityStyle = (priority: NotificationItem['priority']) => {
    switch (priority) {
      case 'critical':
        return {
          pill: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
          dot: 'bg-rose-500',
          label: 'Critical Alert',
        };
      case 'high':
        return {
          pill: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
          dot: 'bg-amber-500',
          label: 'High Priority',
        };
      case 'success':
        return {
          pill: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
          dot: 'bg-emerald-500',
          label: 'Payment / Verified',
        };
      case 'normal':
      default:
        return {
          pill: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dot: 'bg-blue-500',
          label: 'Operational',
        };
    }
  };

  const getCategoryIcon = (category: NotificationItem['category']) => {
    switch (category) {
      case 'stock':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 shadow-xs">
            <Package className="h-4 w-4" />
          </div>
        );
      case 'invoice':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 shadow-xs">
            <Receipt className="h-4 w-4" />
          </div>
        );
      case 'order':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 shadow-xs">
            <ShoppingCart className="h-4 w-4" />
          </div>
        );
      case 'delivery':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 shadow-xs">
            <Truck className="h-4 w-4" />
          </div>
        );
      case 'system':
      default:
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900/60 text-violet-600 dark:text-violet-400 shadow-xs">
            <ShieldCheck className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Dimmed Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-md transform bg-white dark:bg-slate-900 shadow-2xl transition ease-in-out duration-300 flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Operational Alerts
                    </h2>
                    {unreadCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                        {unreadCount} new
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        All caught up
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time telemetry across operating branches
                  </p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition shadow-xs cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={markAllAsUnread}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition shadow-xs cursor-pointer"
                    title="Mark all as unread"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="hidden sm:inline">Mark unread</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Close Notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Live Sync Status Pill & Test Trigger */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Live Event Stream</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  addNotification({
                    category: 'stock',
                    priority: 'critical',
                    title: 'Live Alert: Cathodic Protection Stock Low',
                    message: 'Automatic Cathodic Protection TR Unit 50V/50A has reached reorder threshold (18 units left).',
                    branchCode: 'BR-CHN-01',
                    branchName: 'Chennai HQ',
                    actionModule: 'purchase',
                    actionLabel: 'Create PO',
                  });
                }}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 transition cursor-pointer border border-blue-200 dark:border-blue-800"
                title="Trigger a live test notification"
              >
                + Test Alert
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'unread'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'billing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Orders & Billing ({categoryCounts.billing})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Stock & Dispatch ({categoryCounts.inventory})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'system'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              System ({categoryCounts.system})
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/40">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-center p-6 text-slate-400">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3 shadow-inner">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {activeTab === 'unread' ? 'No Unread Notifications' : 'No Activity in this Category'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  {activeTab === 'unread'
                    ? 'All operational alerts and transactional updates have been reviewed.'
                    : 'Branch transactions and system logs will appear here in real-time.'}
                </p>
                {activeTab !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    View all activity
                  </button>
                )}
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const priorityInfo = getPriorityStyle(item.priority);
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`group relative flex flex-col gap-2 rounded-2xl border p-3.5 transition shadow-xs cursor-pointer ${
                      item.read
                        ? 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                        : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                    }`}
                  >
                    {/* Top Row: Icon + Title + Timestamp */}
                    <div className="flex items-start gap-3">
                      {getCategoryIcon(item.category)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {!item.read && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600 animate-pulse" />
                            )}
                            <h4
                              className={`text-xs truncate ${
                                item.read
                                  ? 'font-semibold text-slate-800 dark:text-slate-200'
                                  : 'font-bold text-blue-950 dark:text-blue-100'
                              }`}
                            >
                              {item.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                              <Clock className="h-3 w-3" />
                              {item.time}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleReadStatus(item.id);
                              }}
                              className={`p-1 rounded-lg transition cursor-pointer ${
                                item.read
                                  ? 'text-slate-300 dark:text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:bg-blue-100/60 dark:hover:bg-blue-900/60'
                              }`}
                              title={item.read ? 'Mark as unread' : 'Mark as read'}
                            >
                              {item.read ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <CheckCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(item.id);
                              }}
                              className="p-1 rounded-lg text-slate-300 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Delete notification"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Message */}
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Metadata & Action Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 dark:border-slate-700/60 text-[10px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Branch Chip */}
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                          <Building className="h-2.5 w-2.5" />
                          {item.branchCode}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold border ${priorityInfo.pill}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${priorityInfo.dot}`} />
                          {priorityInfo.label}
                        </span>
                      </div>

                      {/* Optional Action Button */}
                      {item.actionLabel && (
                        <button
                          type="button"
                          onClick={(e) => handleAction(item, e)}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition cursor-pointer"
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Live Multi-Branch Alerts
              </span>
            </div>
            <button
              type="button"
              onClick={unreadCount > 0 ? markAllAsRead : markAllAsUnread}
              className={`text-[11px] font-semibold transition cursor-pointer ${
                unreadCount > 0
                  ? 'text-blue-600 dark:text-blue-400 hover:underline'
                  : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline'
              }`}
            >
              {unreadCount > 0 ? 'Clear all unread' : 'Mark all unread'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
