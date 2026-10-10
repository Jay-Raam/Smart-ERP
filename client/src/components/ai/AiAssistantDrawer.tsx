import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Check,
  FileText,
  FileCheck,
  Mail,
  AlertCircle,
  Key,
  Copy,
  CheckCircle2,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  History,
  Plus,
  Trash2,
  MessageSquare,
  Search,
} from 'lucide-react';
import { useErpStore } from '../../store/erpStore';
import { useNotificationStore } from '../../store/notificationStore';

interface AiStatus {
  configured: boolean;
  model: string;
  provider: string;
  keyHelp: {
    configFile: string;
    envVar: string;
    freeTierUrl: string;
    recommendedModel: string;
  };
  capabilities: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pendingAction?: any;
  actionExecuted?: boolean;
  actionResult?: any;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
  onNavigateModule?: (module: string) => void;
}

const SESSIONS_STORAGE_KEY = 'smart_erp_copilot_sessions_v2';

const createDefaultWelcomeMessage = (): Message => ({
  id: `welcome_${Date.now()}`,
  role: 'assistant',
  content:
    '👋 Welcome! I am your **Autonomous ERP Assistant**.\n\nYou can ask me to **create invoices**, **generate purchase orders (POs)**, **dispatch automated emails**, or **query inventory and financial telemetry**.\n\nType a request below or try one of the quick suggestions!',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
});

const loadStoredSessions = (): ChatSession[] => {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Storage read error fallback
  }
  return [
    {
      id: 'sess_default',
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [createDefaultWelcomeMessage()],
    },
  ];
};

const generateChatTitle = (text: string): string => {
  const clean = text.replace(/^(create|show|send|draft|make)\s+/i, '').trim();
  if (text.toLowerCase().includes('invoice')) {
    const cust = text.match(/(?:for|to)\s+([A-Za-z0-9\s]+?)(?::|,|$)/i);
    return cust ? `Invoice: ${cust[1].trim().slice(0, 22)}` : 'Tax Invoice Draft';
  }
  if (text.toLowerCase().includes('purchase order') || text.toLowerCase().includes('po')) {
    const vend = text.match(/(?:for|to)\s+([A-Za-z0-9\s]+?)(?::|,|$)/i);
    return vend ? `PO: ${vend[1].trim().slice(0, 22)}` : 'Purchase Order Draft';
  }
  if (text.toLowerCase().includes('stock') || text.toLowerCase().includes('inventory')) {
    return 'Low Stock Alerts';
  }
  if (text.toLowerCase().includes('email') || text.toLowerCase().includes('reminder')) {
    return 'Payment Reminder Email';
  }
  return clean.slice(0, 26) + (clean.length > 26 ? '...' : '');
};

const formatSessionTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  onNavigateModule,
}) => {
  const { activeOrganisationId, activeBranchId, activeFinancialYear, fetchBootstrap } = useErpStore();
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadStoredSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const stored = loadStoredSessions();
    return stored[0]?.id || 'sess_default';
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [showKeyInstructions, setShowKeyInstructions] = useState(false);
  const [copiedKeyText, setCopiedKeyText] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active session and its messages
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || {
      id: 'sess_default',
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [createDefaultWelcomeMessage()],
    };
  }, [sessions, activeSessionId]);

  const messages = activeSession.messages;

  // Persist sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // Storage quota or privacy fallback
    }
  }, [sessions]);

  const updateActiveSessionMessages = (updater: (prevMessages: Message[]) => Message[]) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const newMessages = updater(s.messages);
          let newTitle = s.title;
          if (s.title === 'New Conversation' || s.title.startsWith('New Chat')) {
            const firstUserMsg = newMessages.find((m) => m.role === 'user');
            if (firstUserMsg) {
              newTitle = generateChatTitle(firstUserMsg.content);
            }
          }
          return {
            ...s,
            title: newTitle,
            updatedAt: Date.now(),
            messages: newMessages,
          };
        }
        return s;
      })
    );
  };

  const handleCreateNewChat = () => {
    const newSessionId = `sess_${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [createDefaultWelcomeMessage()],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setIsHistoryOpen(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      const freshSession: ChatSession = {
        id: `sess_${Date.now()}`,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [createDefaultWelcomeMessage()],
      };
      setSessions([freshSession]);
      setActiveSessionId(freshSession.id);
      return;
    }
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const filteredSessions = useMemo(() => {
    if (!historySearchQuery.trim()) return sessions;
    const q = historySearchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [sessions, historySearchQuery]);

  const handleSelectSuggestion = (suggestionText: string) => {
    setInputValue(suggestionText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }, 50);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/ai/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Offline or dev server starting
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    updateActiveSessionMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const tenantContext = {
        organisationId: activeOrganisationId || localStorage.getItem('OrganizationId') || undefined,
        branchId: activeBranchId || localStorage.getItem('Branch') || undefined,
        financialYear: activeFinancialYear || localStorage.getItem('FinancialYear') || undefined,
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          context: tenantContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        pendingAction: data.pendingAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      updateActiveSessionMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      updateActiveSessionMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Failed to communicate with assistant service: ${err.message}. Please verify the backend is running.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (messageId: string, action: any) => {
    setExecutingActionId(action.id);
    try {
      const tenantContext = {
        organisationId: activeOrganisationId || localStorage.getItem('OrganizationId') || undefined,
        branchId: activeBranchId || localStorage.getItem('Branch') || undefined,
        financialYear: activeFinancialYear || localStorage.getItem('FinancialYear') || undefined,
      };

      const res = await fetch('/api/ai/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          context: tenantContext,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Execution failed');
      }

      updateActiveSessionMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            return {
              ...m,
              actionExecuted: true,
              actionResult: result,
            };
          }
          return m;
        })
      );

      // Immediately sync created record to in-memory store so it displays instantly in lists
      if (result.type === 'PURCHASE_ORDER' && result.record) {
        useErpStore.setState((state) => ({
          purchaseOrders: [result.record, ...state.purchaseOrders.filter((p) => p.id !== result.record.id)],
        }));
        // Push notification into notification store
        useNotificationStore.getState().addNotification({
          category: 'order',
          priority: 'high',
          title: `Purchase Order #${result.recordNumber || 'New'} Approved`,
          message: `Autonomous PO created for ${action.previewData?.vendorName || 'Supplier'} (Total: ₹${action.previewData?.totalAmount?.toLocaleString('en-IN')})`,
          branchCode: activeBranchId || 'HQ',
          branchName: 'Main Branch',
          actionModule: 'purchase',
          actionLabel: 'View in POs',
        });
      } else if (result.type === 'INVOICE' && result.record) {
        useErpStore.setState((state) => ({
          invoices: [result.record, ...state.invoices.filter((i) => i.id !== result.record.id)],
        }));
        // Push notification into notification store
        useNotificationStore.getState().addNotification({
          category: 'invoice',
          priority: 'high',
          title: `Tax Invoice #${result.recordNumber || 'New'} Registered`,
          message: `Sales tax invoice issued for ${action.previewData?.customerName || 'Customer'} (Total: ₹${action.previewData?.totalAmount?.toLocaleString('en-IN')})`,
          branchCode: activeBranchId || 'HQ',
          branchName: 'Main Branch',
          actionModule: 'invoices',
          actionLabel: 'View in Invoices',
        });
      } else if (result.type === 'EMAIL') {
        useNotificationStore.getState().addNotification({
          category: 'system',
          priority: 'success',
          title: 'Automated Email Dispatched',
          message: `Email notification sent to ${action.previewData?.recipientEmail}`,
          branchCode: 'GLOBAL',
          branchName: 'All Branches',
        });
      }

      // Trigger full background bootstrap refresh
      try {
        await fetchBootstrap(
          tenantContext.organisationId,
          tenantContext.branchId,
          tenantContext.financialYear
        );
      } catch {
        // Non-fatal if background refresh is silent
      }

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      alert(`Action Execution Error: ${err.message}`);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleDiscardAction = (messageId: string) => {
    updateActiveSessionMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            pendingAction: null,
          };
        }
        return m;
      })
    );
  };

  const copyConfigSnippet = () => {
    navigator.clipboard.writeText(`OPENROUTER_API_KEY=your_key_here\nOPENROUTER_MODEL=openrouter/free`);
    setCopiedKeyText(true);
    setTimeout(() => setCopiedKeyText(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200 z-10">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Autonomous ERP Copilot
                </h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                  <Sparkles className="h-2.5 w-2.5" />
                  Agentic
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Natural Language Invoices, POs & Automation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchStatus}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Refresh connection status"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Session Switcher & History Bar */}
        <div className="px-3 py-1.5 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-medium text-[11px] transition cursor-pointer ${
                isHistoryOpen
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title="View conversation history"
            >
              <History className="h-3 w-3" />
              <span>History</span>
              <span className="px-1 py-0.2 rounded-full text-[9px] bg-slate-200/80 dark:bg-slate-600 font-mono">
                {sessions.length}
              </span>
            </button>
            <span className="text-slate-400 dark:text-slate-500 text-[10px]">|</span>
            <span
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[170px]"
              title={activeSession?.title || 'Current Chat'}
            >
              {activeSession?.title || 'Current Chat'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCreateNewChat}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer shrink-0"
            title="Start fresh conversation"
          >
            <Plus className="h-3 w-3" />
            <span>New Chat</span>
          </button>
        </div>

        {/* History Slide-Over Panel */}
        {isHistoryOpen && (
          <div className="absolute inset-x-0 top-[96px] bottom-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col border-b border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* History Header & Search */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/80 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800 dark:text-slate-100">
                  <History className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Conversation History</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({sessions.length} sessions)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCreateNewChat}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    New
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Search previous chats..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredSessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {historySearchQuery ? 'No matching conversations found' : 'No saved conversations'}
                </div>
              ) : (
                filteredSessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const messageCount = s.messages.filter((m) => m.role === 'user').length;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        setIsHistoryOpen(false);
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        isActive
                          ? 'border-indigo-500/60 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1 pr-2">
                        <MessageSquare
                          className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-xs leading-snug">
                            {s.title}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{formatSessionTime(s.updatedAt)}</span>
                            <span>•</span>
                            <span>{messageCount} {messageCount === 1 ? 'prompt' : 'prompts'}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Auto-saved in local storage
              </span>
              <button
                type="button"
                onClick={handleCreateNewChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Start Fresh Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* Status / Model Connection Pill Banner */}
        <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  status?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {status?.configured ? (
                  <>Connected: <code className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">{status.model}</code></>
                ) : (
                  <>Setup Mode: <span className="text-amber-600 dark:text-amber-400 font-medium">Local Engine Active</span></>
                )}
              </span>
            </div>
            <button
              onClick={() => setShowKeyInstructions(!showKeyInstructions)}
              className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Key className="h-3 w-3" />
              {showKeyInstructions ? 'Hide setup' : 'API Key Setup'}
              {showKeyInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {/* Expandable Key Setup Banner */}
          {showKeyInstructions && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-[11px] animate-in fade-in duration-150">
              <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  To use live OpenRouter models for free, add your key to{' '}
                  <strong className="text-slate-800 dark:text-white font-mono">server/.env</strong>:
                </span>
              </div>
              <div className="relative font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300">
                <code>
                  OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx...<br />
                  OPENROUTER_MODEL=openrouter/free
                </code>
                <button
                  onClick={copyConfigSnippet}
                  className="absolute right-1.5 top-1.5 p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
                  title="Copy snippet"
                >
                  {copiedKeyText ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Free models like <code className="font-mono">openrouter/free</code> require zero credit card.
              </p>
            </div>
          )}
        </div>

        {/* Chat Message Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {Boolean(msg.content && msg.content.trim()) && (
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div
                    className={`mt-1 text-[9px] text-right ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              )}

              {/* Render Pending Action Approval Card if generated */}
              {msg.pendingAction && (
                <div className="w-full max-w-md mt-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-linear-to-b from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-800/80 p-3.5 shadow-md">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      {msg.pendingAction.type === 'CREATE_INVOICE' && (
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                      {msg.pendingAction.type === 'CREATE_PO' && (
                        <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {msg.pendingAction.type === 'SEND_EMAIL' && (
                        <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      )}
                      <span className="text-xs font-semibold text-slate-800 dark:text-white">
                        {msg.pendingAction.title}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Draft Preview
                    </span>
                  </div>

                  {/* Card Details Body */}
                  <div className="py-2.5 space-y-2 text-xs">
                    {msg.pendingAction.type === 'CREATE_INVOICE' && (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400">Customer:</span>{' '}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {msg.pendingAction.previewData.customerName}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400">State:</span>{' '}
                            <span className="text-slate-700 dark:text-slate-300">
                              {msg.pendingAction.previewData.customerState}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Invoice Date:</span>{' '}
                            <span className="text-slate-700 dark:text-slate-300">
                              {msg.pendingAction.previewData.invoiceDate}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Due Date:</span>{' '}
                            <span className="text-slate-700 dark:text-slate-300">
                              {msg.pendingAction.previewData.dueDate}
                            </span>
                          </div>
                        </div>

                        {/* Line items preview */}
                        <div className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-[11px]">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500">
                              <tr>
                                <th className="p-1.5 font-medium">Item</th>
                                <th className="p-1.5 font-medium text-center">Qty</th>
                                <th className="p-1.5 font-medium text-right">Rate</th>
                                <th className="p-1.5 font-medium text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {msg.pendingAction.previewData.items?.map((it: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="p-1.5 font-medium text-slate-800 dark:text-slate-200">{it.productName}</td>
                                  <td className="p-1.5 text-center">{it.quantity}</td>
                                  <td className="p-1.5 text-right">₹{it.unitPrice?.toLocaleString('en-IN')}</td>
                                  <td className="p-1.5 text-right font-medium">₹{it.totalAmount?.toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* GST Breakdown */}
                        <div className="flex justify-between items-center pt-1 text-[11px]">
                          <span className="text-slate-500">
                            Subtotal: ₹{msg.pendingAction.previewData.subtotal?.toLocaleString('en-IN')} | GST: ₹{msg.pendingAction.previewData.taxAmount?.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            Grand Total: ₹{msg.pendingAction.previewData.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </>
                    )}

                    {msg.pendingAction.type === 'CREATE_PO' && (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400">Vendor:</span>{' '}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {msg.pendingAction.previewData.vendorName}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Expected:</span>{' '}
                            <span className="text-slate-700 dark:text-slate-300">
                              {msg.pendingAction.previewData.expectedDate}
                            </span>
                          </div>
                        </div>

                        {/* PO Line Items */}
                        <div className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-[11px]">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500">
                              <tr>
                                <th className="p-1.5 font-medium">Item</th>
                                <th className="p-1.5 font-medium text-center">Qty</th>
                                <th className="p-1.5 font-medium text-right">Cost</th>
                                <th className="p-1.5 font-medium text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {msg.pendingAction.previewData.items?.map((it: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="p-1.5 font-medium text-slate-800 dark:text-slate-200">{it.productName}</td>
                                  <td className="p-1.5 text-center">{it.quantity}</td>
                                  <td className="p-1.5 text-right">₹{it.unitPrice?.toLocaleString('en-IN')}</td>
                                  <td className="p-1.5 text-right font-medium">₹{it.totalAmount?.toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex justify-end pt-1">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            PO Total: ₹{msg.pendingAction.previewData.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </>
                    )}

                    {msg.pendingAction.type === 'SEND_EMAIL' && (
                      <div className="space-y-1.5 text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div>
                          <span className="text-slate-400">To:</span>{' '}
                          <code className="text-purple-600 dark:text-purple-400 font-mono">
                            {msg.pendingAction.previewData.recipientEmail}
                          </code>
                        </div>
                        <div>
                          <span className="text-slate-400">Subject:</span>{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {msg.pendingAction.previewData.subject}
                          </strong>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 italic border-l-2 border-purple-400 pl-2 mt-1 whitespace-pre-wrap">
                          {msg.pendingAction.previewData.body}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Confirmation Footer */}
                  {msg.actionExecuted ? (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-emerald-700 dark:text-emerald-300 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{msg.actionResult?.message || 'Action executed successfully in ERP!'}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {msg.pendingAction.type === 'CREATE_PO' && onNavigateModule && (
                          <button
                            type="button"
                            onClick={() => {
                              onNavigateModule('purchase');
                              onClose();
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg transition shrink-0 cursor-pointer shadow-xs"
                          >
                            View in Purchase Orders →
                          </button>
                        )}
                        {msg.pendingAction.type === 'CREATE_INVOICE' && onNavigateModule && (
                          <button
                            type="button"
                            onClick={() => {
                              onNavigateModule('invoices');
                              onClose();
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg transition shrink-0 cursor-pointer shadow-xs"
                          >
                            View in Invoices →
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 pt-2 border-t border-indigo-100 dark:border-slate-700/60 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDiscardAction(msg.id)}
                        disabled={executingActionId === msg.pendingAction.id}
                        className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition"
                      >
                        Discard
                      </button>
                      <button
                        onClick={() => handleExecuteAction(msg.id, msg.pendingAction)}
                        disabled={executingActionId === msg.pendingAction.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition active:scale-95 disabled:opacity-50"
                      >
                        {executingActionId === msg.pendingAction.id ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3" />
                            Confirm & Execute
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
              <Bot className="h-4 w-4 text-indigo-500 animate-spin" />
              <span>Thinking and orchestrating ERP workflow...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-semibold text-slate-400 shrink-0 uppercase tracking-wider">
            Templates:
          </span>
          <button
            type="button"
            onClick={() =>
              handleSelectSuggestion(
                'Create invoice for Acme Technologies: 5 Workstations at 45,000 INR and 5 Monitors at 12,000 INR'
              )
            }
            title="Click to load invoice prompt into input box for customization"
            className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-300 transition border border-slate-200/60 dark:border-slate-700 cursor-pointer"
          >
            + New Invoice (Acme)
          </button>
          <button
            type="button"
            onClick={() =>
              handleSelectSuggestion(
                'Create purchase order for Steel Direct: 50 structural beams at 2,400 INR'
              )
            }
            title="Click to load PO prompt into input box for customization"
            className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 text-slate-600 dark:text-slate-300 transition border border-slate-200/60 dark:border-slate-700 cursor-pointer"
          >
            + New PO (Steel Direct)
          </button>
          <button
            type="button"
            onClick={() =>
              handleSelectSuggestion(
                'Send payment reminder email to billing@clientcorp.com for pending invoice INV-2026-001'
              )
            }
            title="Click to load email reminder prompt into input box for customization"
            className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-600 text-slate-600 dark:text-slate-300 transition border border-slate-200/60 dark:border-slate-700 cursor-pointer"
          >
            + Email Reminder
          </button>
          <button
            type="button"
            onClick={() => handleSelectSuggestion('Show low stock inventory alerts')}
            title="Click to load inventory query into input box"
            className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:text-amber-600 text-slate-600 dark:text-slate-300 transition border border-slate-200/60 dark:border-slate-700 cursor-pointer"
          >
            📦 Check Stock
          </button>
        </div>

        {/* Bottom Input Field */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Click a template above to edit products/quantities, or type here... [Enter to send]"
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="h-10 px-3.5 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 active:scale-95 transition disabled:opacity-40 shadow-xs cursor-pointer flex items-center justify-center shrink-0"
              title="Send message (Enter)"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-slate-400">
            <span>Press <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">Enter</kbd> to send, <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">Shift+Enter</kbd> for newline</span>
            <span>Shortcut: Ctrl+J</span>
          </div>
        </div>
      </div>
    </div>
  );
};
