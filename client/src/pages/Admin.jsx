import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  ShoppingBag,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  LogOut,
  CreditCard,
  Settings,
  ShieldCheck,
  ExternalLink,
  Search,
  Filter,
  Copy,
  Check,
  Eye,
  EyeOff,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Database,
  ArrowUpRight,
  Layers,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Lock,
  Globe,
  Sliders,
  DollarSign,
  Key,
  Code2,
  Trash2,
  Send,
  Terminal
} from 'lucide-react';
import { companyInfo } from '../data/company';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [inquirySearch, setInquirySearch] = useState('');

  // Settings State
  const [settings, setSettings] = useState({
    merchantId: '',
    username: '',
    password: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    merchantDomain: '',
    databaseType: '',
    tokenStatus: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Payment Test Form State
  const [testForm, setTestForm] = useState({
    amount: '1.00',
    name: 'Puskar Roy',
    email: 'modevianine@gmail.com',
    phone: '8777342997'
  });
  const [testSubmitting, setTestSubmitting] = useState(false);

  // Bridge API State
  const [merchants, setMerchants] = useState([]);
  const [bridgeOrders, setBridgeOrders] = useState([]);
  const [newMerchant, setNewMerchant] = useState({ name: '', webhookUrl: '', returnUrl: '' });
  const [creatingMerchant, setCreatingMerchant] = useState(false);
  const [selectedMerchantKey, setSelectedMerchantKey] = useState('');
  const [codeLang, setCodeLang] = useState('curl');
  const [revealedKeys, setRevealedKeys] = useState({});
  const [bridgeTestForm, setBridgeTestForm] = useState({
    amount: '10.00',
    returnUrl: (typeof window !== 'undefined' ? window.location.origin : '') + '/?bridge_test=success',
    clientOrderId: `TEST_ORD_${Date.now()}`
  });
  const [bridgeTestSubmitting, setBridgeTestSubmitting] = useState(false);
  const [bridgeTestResult, setBridgeTestResult] = useState(null);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('modevia_admin_token');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('modevia_admin_token');
    localStorage.removeItem('modevia_admin_user');
    navigate('/admin/login');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, messagesRes, settingsRes, merchantsRes, bridgeOrdersRes] = await Promise.all([
        api.get('/api/orders').catch(() => ({ data: { data: [] } })),
        api.get('/api/contact').catch(() => ({ data: { data: [] } })),
        api.get('/api/admin/settings').catch(() => ({ data: { data: {} } })),
        api.get('/api/admin/merchants').catch(() => ({ data: { data: [] } })),
        api.get('/api/admin/bridge-orders').catch(() => ({ data: { data: [] } }))
      ]);
      setOrders(ordersRes.data?.data || []);
      setMessages(messagesRes.data?.data || []);
      if (settingsRes.data?.data) {
        setSettings(settingsRes.data.data);
      }
      const mList = merchantsRes.data?.data || [];
      setMerchants(mList);
      if (mList.length > 0 && !selectedMerchantKey) {
        setSelectedMerchantKey(mList[0].apiKey);
      }
      setBridgeOrders(bridgeOrdersRes.data?.data || []);
    } catch (err) {
      console.error(err);
      showToast('Error refreshing data from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${key} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      showToast(`Order ${orderId} marked as ${newStatus}`);
      fetchData();
    } catch (err) {
      showToast('Failed to update order status', 'error');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const res = await api.post('/api/admin/settings', settings);
      if (res.data?.success) {
        showToast('Airpay gateway credentials updated and saved to .env!');
        fetchData();
      } else {
        throw new Error(res.data?.message || 'Failed to save settings');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Error saving settings', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleTestPayment = async (e) => {
    e.preventDefault();
    setTestSubmitting(true);
    try {
      const res = await api.post('/api/admin/test-payment', testForm);
      if (res.data?.success && res.data.hostedPayload) {
        const payload = res.data.hostedPayload;
        showToast(`Redirecting to Airpay for ₹${res.data.amount}...`);
        // Auto-create form and submit to Airpay in new tab
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payload.actionUrl;
        form.target = '_blank';
        for (const [key, val] of Object.entries(payload.fields)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = val;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } else {
        throw new Error(res.data?.message || 'Failed to initiate test payment');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Error launching test transaction', 'error');
    } finally {
      setTestSubmitting(false);
    }
  };

  const handleCreateMerchant = async (e) => {
    e.preventDefault();
    if (!newMerchant.name.trim()) {
      showToast('Merchant Name is required', 'error');
      return;
    }
    setCreatingMerchant(true);
    try {
      const res = await api.post('/api/admin/merchants', newMerchant);
      if (res.data?.success) {
        showToast('New Merchant API Key created!');
        setNewMerchant({ name: '', webhookUrl: '', returnUrl: '' });
        fetchData();
      } else {
        throw new Error(res.data?.message || 'Failed to create merchant');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Error creating merchant', 'error');
    } finally {
      setCreatingMerchant(false);
    }
  };

  const handleDeleteMerchant = async (id, name) => {
    if (!window.confirm(`Are you sure you want to revoke API Key for "${name}"? External apps using this key will immediately lose access.`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/merchants/${id}`);
      showToast('API Key revoked successfully');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Error revoking API key', 'error');
    }
  };

  const handleTestBridgeOrder = async (e) => {
    e.preventDefault();
    setBridgeTestSubmitting(true);
    setBridgeTestResult(null);
    try {
      const activeKey = selectedMerchantKey || merchants[0]?.apiKey;
      if (!activeKey) {
        throw new Error('Please create or select an API key first');
      }
      const res = await api.post('/api/v1/bridge/orders', {
        api_key: activeKey,
        amount: bridgeTestForm.amount,
        return_url: bridgeTestForm.returnUrl,
        client_order_id: bridgeTestForm.clientOrderId
      });
      if (res.data?.success) {
        setBridgeTestResult(res.data);
        showToast('Bridge Order created successfully! Click the checkout link below.');
        fetchData();
      } else {
        throw new Error(res.data?.message || 'Failed to create bridge order');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Bridge order creation failed', 'error');
    } finally {
      setBridgeTestSubmitting(false);
    }
  };

  const toggleRevealKey = (id) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const successful = orders.filter(o => o.status === 'success');
    const pending = orders.filter(o => o.status === 'pending');
    const failed = orders.filter(o => o.status === 'failed');
    const revenue = successful.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    return {
      total,
      revenue,
      successfulCount: successful.length,
      pendingCount: pending.length,
      failedCount: failed.length
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const query = orderSearch.toLowerCase();
      const matchesSearch =
        !query ||
        o.orderId?.toLowerCase().includes(query) ||
        o.customerName?.toLowerCase().includes(query) ||
        o.customerEmail?.toLowerCase().includes(query) ||
        o.customerPhone?.toLowerCase().includes(query) ||
        o.serviceTitle?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Filtered Inquiries
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const query = inquirySearch.toLowerCase();
      return (
        !query ||
        m.name?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query) ||
        m.phone?.toLowerCase().includes(query) ||
        m.message?.toLowerCase().includes(query)
      );
    });
  }, [messages, inquirySearch]);

  const navItems = [
    { id: 'orders', label: 'Orders & Payments', icon: ShoppingBag, count: orders.length },
    { id: 'inquiries', label: 'Contact Inquiries', icon: MessageSquare, count: messages.length },
    { id: 'gateway', label: 'Payment Gateway', icon: Settings, badge: 'Airpay' },
    { id: 'test', label: 'Airpay Test Suite', icon: CreditCard, badge: '₹ Live' },
    { id: 'bridge', label: 'API Bridge & Docs', icon: Globe }
  ];

  return (
    <div className="flex h-screen bg-[#F6F8FC] text-[#0F172A] font-sans antialiased overflow-hidden">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* ========================================================= */}
      {/* SIDEBAR NAVIGATION (Desktop + Mobile Drawer)              */}
      {/* ========================================================= */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:w-[76px]' : 'lg:w-[260px]'
        } ${mobileMenuOpen ? 'translate-x-0 w-[270px]' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center p-1 shrink-0 overflow-hidden">
              <img
                src={companyInfo.logo}
                alt={companyInfo.name}
                className="h-full w-full object-contain"
              />
            </div>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm text-slate-900 leading-tight truncate tracking-tight">
                  MODEVIA NINE HERTZ
                </span>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Fintech Dashboard
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`group relative flex items-center w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full" />
                )}
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {(!sidebarCollapsed || mobileMenuOpen) && (
                  <span className="ml-3 truncate">{item.label}</span>
                )}
                {(!sidebarCollapsed || mobileMenuOpen) && item.count !== undefined && (
                  <span
                    className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                      isActive ? 'bg-indigo-100/70 text-indigo-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
                {(!sidebarCollapsed || mobileMenuOpen) && item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Database & Environment Status Badge */}
        {(!sidebarCollapsed || mobileMenuOpen) && (
          <div className="px-4 py-3 mx-3 mb-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Database className="h-3 w-3 text-emerald-500" /> Database
              </span>
              <span className="font-semibold text-slate-700 font-mono">
                {settings.databaseType || 'MariaDB'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-indigo-500" /> Gateway
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>
          </div>
        )}

        {/* Bottom User Profile Card */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 border border-slate-100">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-lg bg-indigo-600/10 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200/50">
                AD
              </div>
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-semibold text-slate-800 truncate">Administrator</span>
                  <span className="text-[11px] text-slate-400 truncate">modevianine@gmail.com</span>
                </div>
              )}
            </div>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* RIGHT COLUMN (FIXED TOPBAR + SCROLLABLE WORKSPACE)        */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header - Always 64px, pinned outside scroll container so width and layout never shift between tabs */}
        <header className="h-16 min-h-[64px] max-h-16 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <Sliders className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 whitespace-nowrap">
              <span className="text-slate-500">Dashboard</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
              <span className="text-indigo-600 font-semibold capitalize">
                {activeTab === 'gateway' ? 'Payment Gateway' : activeTab === 'test' ? 'Airpay Test Suite' : activeTab === 'bridge' ? 'API Bridge & Integration Docs' : activeTab}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/70 text-xs text-slate-600 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-700">Production</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500">{settings.databaseType || 'MariaDB'}</span>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs whitespace-nowrap"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 transition-all whitespace-nowrap"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Website</span>
            </a>
          </div>
        </header>

        {/* Dashboard Workspace - Scrollable with stable gutter */}
        <main className="flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* ========================================================= */}
          {/* 4 FINTECH KPI METRIC CARDS                                */}
          {/* ========================================================= */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Orders Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Orders
                </span>
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {metrics.total}
                </span>
                <span className="text-xs text-slate-400 font-medium">all-time</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{metrics.successfulCount} completed checkouts</span>
              </div>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Revenue
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  ₹{metrics.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-400 font-medium">
                <span>Processed via official Airpay gateway</span>
              </div>
            </div>

            {/* Pending Checkouts Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Checkouts
                </span>
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600 tabular-nums">
                  {metrics.pendingCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">orders pending</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600/90 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>Awaiting customer payment</span>
              </div>
            </div>

            {/* Gateway Health Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Gateway Status
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-lg font-bold text-slate-900">
                  Airpay Live
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>MID: {settings.merchantId || '363996'}</span>
                <span className="text-emerald-600 font-semibold font-sans">Token Active</span>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* TAB 1: ORDERS MANAGEMENT TABLE                           */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Controls: Search & Status Filter */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by Order ID, customer name, email, or plan..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  {orderSearch && (
                    <button
                      onClick={() => setOrderSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-slate-500">Status:</span>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Orders ({orders.length})</option>
                      <option value="success">Success ({metrics.successfulCount})</option>
                      <option value="pending">Pending ({metrics.pendingCount})</option>
                      <option value="failed">Failed ({metrics.failedCount})</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Orders Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                {filteredOrders.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">No orders match your criteria</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {orderSearch || orderStatusFilter !== 'all'
                        ? 'Try adjusting your search query or status filter above.'
                        : 'Customer checkouts will automatically appear here once initiated.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-5">Order ID</th>
                          <th className="py-3 px-5">Customer</th>
                          <th className="py-3 px-5">Service / Plan</th>
                          <th className="py-3 px-5 text-right">Amount</th>
                          <th className="py-3 px-5">Status</th>
                          <th className="py-3 px-5">Created Date</th>
                          <th className="py-3 px-5 text-center">Update</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredOrders.map((order) => {
                          const initials = (order.customerName || 'Customer')
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                          return (
                            <tr key={order.orderId || order.id || order._id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Order ID */}
                              <td className="py-3.5 px-5 font-mono font-semibold text-slate-800 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5">
                                  {order.orderId}
                                  <button
                                    onClick={() => handleCopy(order.orderId, order.orderId)}
                                    title="Copy Order ID"
                                    className="text-slate-300 hover:text-slate-600 transition-colors"
                                  >
                                    {copiedKey === order.orderId ? (
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </span>
                              </td>

                              {/* Customer Avatar & Contact */}
                              <td className="py-3.5 px-5">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                    {initials}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900 leading-tight">
                                      {order.customerName}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      {order.customerEmail} • {order.customerPhone}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Service Plan */}
                              <td className="py-3.5 px-5">
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-800">{order.serviceTitle}</span>
                                  <span className="text-[11px] font-semibold text-indigo-600">{order.planName}</span>
                                </div>
                              </td>

                              {/* Amount */}
                              <td className="py-3.5 px-5 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                                ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-5 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight capitalize ${
                                    order.status === 'success'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                                      : order.status === 'pending'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                                  }`}
                                >
                                  {order.status === 'success' && <CheckCircle2 className="h-3 w-3" />}
                                  {order.status === 'pending' && <Clock className="h-3 w-3" />}
                                  {order.status === 'failed' && <XCircle className="h-3 w-3" />}
                                  {order.status}
                                </span>
                              </td>

                              {/* Date */}
                              <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap text-[11px]">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>

                              {/* Status Dropdown */}
                              <td className="py-3.5 px-5 text-center whitespace-nowrap">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateStatus(order.orderId, e.target.value)}
                                  className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="success">Success</option>
                                  <option value="failed">Failed</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CONTACT INQUIRIES                                  */}
          {/* ========================================================= */}
          {activeTab === 'inquiries' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                    placeholder="Search inquiries by name, email, phone, or keyword..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {filteredMessages.length} Messages
                </span>
              </div>

              {/* Messages Grid */}
              {filteredMessages.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center space-y-3">
                  <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">No contact inquiries found</p>
                  <p className="text-xs text-slate-400">
                    Customer queries submitted through your website's contact form will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMessages.map((item, index) => {
                    const initials = (item.name || 'User')
                      .split(' ')
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={index}
                        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                                {initials}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 text-sm leading-tight">
                                  {item.name}
                                </h3>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 mb-3 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item.email}</span>
                            </div>
                            {item.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{item.phone}</span>
                              </div>
                            )}
                          </div>

                          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-xs text-slate-700 leading-relaxed italic">
                            "{item.message}"
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                          <button
                            onClick={() => handleCopy(item.email, `Email-${index}`)}
                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy Email</span>
                          </button>
                          {item.phone && (
                            <a
                              href={`tel:${item.phone}`}
                              className="text-slate-500 hover:text-slate-800 font-medium"
                            >
                              Call Customer
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PAYMENT GATEWAY (AIRPAY CREDENTIALS)               */}
          {/* ========================================================= */}
          {activeTab === 'gateway' && (
            <div className="w-full space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-2">
                        <Settings className="h-3 w-3" /> Airpay Configuration
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        Payment Gateway Credentials & Domain
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Updates here automatically save into your server's <code className="text-indigo-600 font-mono font-semibold">.env</code> and take effect immediately.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-700">Gateway Active</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveSettings} className="p-6 sm:p-8 space-y-8">
                  {/* Section 1: Merchant Credentials */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Building className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        1. Airpay Merchant Credentials
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Merchant ID (MID) *
                        </label>
                        <input
                          type="text"
                          value={settings.merchantId}
                          onChange={(e) => setSettings({ ...settings, merchantId: e.target.value })}
                          required
                          placeholder="363996"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Your registered Airpay Merchant ID</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Airpay Username *
                        </label>
                        <input
                          type="text"
                          value={settings.username}
                          onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                          required
                          placeholder="e.g. 4kBRe5wGYp"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Airpay API username for key derivation</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Airpay Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={settings.password}
                            onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                            required
                            placeholder="••••••••"
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Password for AES-256 key generation</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          API Key / Secret *
                        </label>
                        <input
                          type="text"
                          value={settings.apiKey}
                          onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                          required
                          placeholder="e.g. YPjbMKJcQ2z8MeEF"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Private key token used for request signatures</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: OAuth 2.0 Credentials */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Lock className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        2. Airpay OAuth 2.0 Credentials
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          OAuth Client ID *
                        </label>
                        <input
                          type="text"
                          value={settings.clientId}
                          onChange={(e) => setSettings({ ...settings, clientId: e.target.value })}
                          required
                          placeholder="e.g. fJb4JW"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          OAuth Client Secret *
                        </label>
                        <div className="relative">
                          <input
                            type={showSecret ? 'text' : 'password'}
                            value={settings.clientSecret}
                            onChange={(e) => setSettings({ ...settings, clientSecret: e.target.value })}
                            required
                            placeholder="••••••••"
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Whitelisted Domain Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Globe className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        3. Registered Whitelisted Domain
                      </h3>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Domain URL (Matches Airpay Firewall) *
                      </label>
                      <input
                        type="url"
                        value={settings.merchantDomain}
                        onChange={(e) => setSettings({ ...settings, merchantDomain: e.target.value })}
                        required
                        placeholder="https://www.modevianinehertz.in/"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Must match the URL whitelisted by Airpay operations. Base64 <code className="text-indigo-600">mer_dom</code> is computed from this exact string.
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Changes update live in memory and overwrite <code className="text-slate-600 font-mono">server/.env</code>
                    </span>
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {settingsLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Save Airpay Credentials</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: AIRPAY TEST SUITE (MANUAL AMOUNT TEST CONSOLE)     */}
          {/* ========================================================= */}
          {activeTab === 'test' && (
            <div className="w-full space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Panel: Payment Configuration (3 cols) */}
                <div className="lg:col-span-3 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-2">
                      <CreditCard className="h-3 w-3" /> Live Test Console
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Manual Amount Test Form
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Type any custom amount to launch Airpay's official checkout and verify end-to-end payment routing.
                    </p>
                  </div>

                  <form onSubmit={handleTestPayment} className="space-y-5">
                    {/* Amount Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Test Amount (INR) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="1.00"
                          value={testForm.amount}
                          onChange={(e) => setTestForm({ ...testForm, amount: e.target.value })}
                          required
                          placeholder="1.00"
                          className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
                        />
                      </div>

                      {/* Quick Amount Chips */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-[11px] text-slate-400 font-medium">Quick select:</span>
                        {['1.00', '5.00', '10.00', '100.00'].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setTestForm({ ...testForm, amount: amt })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              testForm.amount === amt
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Buyer Name
                        </label>
                        <input
                          type="text"
                          value={testForm.name}
                          onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Buyer Phone
                        </label>
                        <input
                          type="tel"
                          value={testForm.phone}
                          onChange={(e) => setTestForm({ ...testForm, phone: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Buyer Email
                        </label>
                        <input
                          type="email"
                          value={testForm.email}
                          onChange={(e) => setTestForm({ ...testForm, email: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={testSubmitting}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {testSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Generating Encrypted Payload...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4" />
                          <span>Launch Airpay Checkout (₹{testForm.amount})</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Right Panel: Gateway Inspector & Verification Checklist (2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Gateway Inspector
                    </h3>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400">Merchant ID</span>
                        <span className="font-mono font-bold text-slate-800">{settings.merchantId || '363996'}</span>
                      </div>

                      <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400">Domain Parameter</span>
                        <span className="font-mono font-semibold text-indigo-600 truncate max-w-[170px]" title={settings.merchantDomain}>
                          {settings.merchantDomain || 'https://www.modevianinehertz.in/'}
                        </span>
                      </div>

                      <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400">Channel Mode</span>
                        <span className="font-semibold text-slate-700">UPI, QR, Cards, NetBanking</span>
                      </div>

                      <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400">Endpoint</span>
                        <span className="font-mono text-slate-500">payments.airpay.co.in/pay/v4/</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 text-xs text-indigo-950 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                      <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                      How It Works
                    </div>
                    <p className="text-indigo-800/90 leading-relaxed text-[11px]">
                      When you click <strong>Launch Airpay Checkout</strong>, our backend signs a live OAuth2 token with Airpay, encrypts your custom amount and buyer details via AES-256-CBC, computes the SHA-256 checksum, and auto-submits directly to Airpay's secure payment hosted page in a separate tab.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: API BRIDGE & EXTERNAL INTEGRATION DOCS             */}
          {/* ========================================================= */}
          {activeTab === 'bridge' && (
            <div className="space-y-6">
              {/* Header Hero */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <Globe className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        Payment Gateway Bridge (External API)
                      </h2>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-0.5">
                        Multi-Site Whitelist Proxy
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 max-w-3xl leading-relaxed">
                    Make payments through Modevia's whitelisted Airpay Gateway from any other server, website, or mobile application. Modevia acts as the secure intermediary broker, submits requests with the whitelisted domain (<code className="font-mono text-indigo-600 font-semibold">{settings.merchantDomain || 'https://www.modevianinehertz.in'}</code>), and automatically redirects users back to your satellite store after payment.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Bridge Active & Whitelisted</span>
                  </div>
                </div>
              </div>

              {/* Grid 1: API Keys Management & Generator */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create New Key Form (1 col) */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Generate New API Key</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Create an API key for a satellite store, mobile app, or external backend server.
                  </p>

                  <form onSubmit={handleCreateMerchant} className="space-y-3.5 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Client / Website Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newMerchant.name}
                        onChange={(e) => setNewMerchant({ ...newMerchant, name: e.target.value })}
                        placeholder="e.g. My WordPress Store"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Default Return URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={newMerchant.returnUrl}
                        onChange={(e) => setNewMerchant({ ...newMerchant, returnUrl: e.target.value })}
                        placeholder="https://myshop.com/payment-result"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Can also be passed dynamically per-order.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Default Webhook URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={newMerchant.webhookUrl}
                        onChange={(e) => setNewMerchant({ ...newMerchant, webhookUrl: e.target.value })}
                        placeholder="https://myshop.com/api/payment-webhook"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={creatingMerchant}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {creatingMerchant ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating Key...</span>
                        </>
                      ) : (
                        <>
                          <Key className="h-3.5 w-3.5" />
                          <span>Generate API Key</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Active API Keys List (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">Active Bridge API Keys</h3>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {merchants.length} Keys
                    </span>
                  </div>

                  {merchants.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                      No API keys generated yet. Use the form on the left to create your first client API key.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                      {merchants.map((m) => {
                        const isRevealed = !!revealedKeys[m.id];
                        return (
                          <div
                            key={m.id || m.merchantId}
                            className={`p-4 rounded-xl border transition-all ${
                              selectedMerchantKey === m.apiKey
                                ? 'bg-indigo-50/40 border-indigo-200'
                                : 'bg-slate-50/50 border-slate-200/70 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <div>
                                <span className="font-bold text-xs text-slate-900">{m.name}</span>
                                <span className="text-[10px] text-slate-400 ml-2 font-mono">ID: {m.merchantId}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedMerchantKey(m.apiKey)}
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition ${
                                    selectedMerchantKey === m.apiKey
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {selectedMerchantKey === m.apiKey ? 'Selected for Snippets' : 'Select'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteMerchant(m.id || m.merchantId, m.name)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
                                  title="Revoke API Key"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Key display with copy & reveal */}
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200/90 font-mono text-xs text-slate-800">
                              <span className="flex-1 truncate">
                                {isRevealed ? m.apiKey : m.apiKey.substring(0, 12) + '••••••••••••••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealKey(m.id)}
                                className="text-slate-400 hover:text-slate-700 p-1"
                                title={isRevealed ? 'Hide Key' : 'Reveal Key'}
                              >
                                {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(m.apiKey, `${m.name} API Key`)}
                                className="text-indigo-600 hover:text-indigo-800 p-1"
                                title="Copy API Key"
                              >
                                {copiedKey === `${m.name} API Key` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>

                            {m.returnUrl && (
                              <div className="mt-2 text-[10px] text-slate-400 truncate">
                                <strong>Default Return:</strong> {m.returnUrl}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 2: Integration Endpoints & Code Snippets */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Endpoint References (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">API Endpoints Reference</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Base URL */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Base URL</span>
                      <div className="flex items-center justify-between font-mono font-semibold text-slate-800 text-[11px]">
                        <span>{typeof window !== 'undefined' ? window.location.origin : 'https://www.modevianinehertz.in'}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(typeof window !== 'undefined' ? window.location.origin : 'https://www.modevianinehertz.in', 'Base URL')}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Endpoint 1: Create Order */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          POST
                        </span>
                        <span className="font-mono text-slate-800 font-semibold text-[11px]">
                          /api/v1/bridge/orders
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Initiates payment session. Customer details are 100% optional!
                      </p>
                    </div>

                    {/* Endpoint 2: Hosted Payment */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-100 text-blue-800">
                          GET
                        </span>
                        <span className="font-mono text-slate-800 font-semibold text-[11px]">
                          /bridge/pay/:bridge_order_id
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        The URL you redirect your customer to. Modevia bridges them into Airpay.
                      </p>
                    </div>

                    {/* Endpoint 3: Status Check */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-100 text-blue-800">
                          GET
                        </span>
                        <span className="font-mono text-slate-800 font-semibold text-[11px]">
                          /api/v1/bridge/orders/:bridge_order_id
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Verify order status server-to-server anytime.
                      </p>
                    </div>
                  </div>

                  {/* Return URL query parameters */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-950 space-y-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-indigo-900">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      Return Redirection Parameters
                    </span>
                    <p className="text-indigo-800 leading-relaxed text-[10px]">
                      After payment, customer is redirected back to your <code className="font-mono font-semibold">return_url</code> with:
                    </p>
                    <code className="block p-2 rounded bg-white/80 font-mono text-[10px] text-slate-800 break-all border border-indigo-200/50">
                      ?status=success&bridge_order_id=BR_...&client_order_id=...&amount=500.00
                    </code>
                  </div>
                </div>

                {/* Right: Code Snippets (3 cols) */}
                <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Integration Code Snippets</h3>
                    </div>

                    {/* Language selector tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {['curl', 'node', 'php', 'python'].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setCodeLang(lang)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition capitalize ${
                            codeLang === lang
                              ? 'bg-white text-indigo-600 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {lang === 'node' ? 'Node / Fetch' : lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic snippet based on selected merchant key */}
                  {(() => {
                    const activeKey = selectedMerchantKey || merchants[0]?.apiKey || 'mod_live_your_key_here';
                    const activeBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.modevianinehertz.in';

                    let snippetCode = '';
                    if (codeLang === 'curl') {
                      snippetCode = `curl -X POST ${activeBaseUrl}/api/v1/bridge/orders \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "${activeKey}",
    "amount": 250.00,
    "return_url": "https://myshop.com/payment-result",
    "client_order_id": "ORDER_1001"
  }'`;
                    } else if (codeLang === 'node') {
                      snippetCode = `// 1. Create order from your Node.js / Express backend
const response = await fetch("${activeBaseUrl}/api/v1/bridge/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    api_key: "${activeKey}",
    amount: 250.00,
    return_url: "https://myshop.com/payment-result",
    client_order_id: "ORDER_1001"
    // customer details are optional!
  })
});

const data = await response.json();
if (data.success) {
  // 2. Redirect customer browser to the bridge checkout page
  console.log("Customer Checkout URL:", data.checkout_url);
}`;
                    } else if (codeLang === 'php') {
                      snippetCode = `<?php
// Call Modevia Bridge API from PHP
$payload = [
    "api_key" => "${activeKey}",
    "amount" => 250.00,
    "return_url" => "https://myshop.com/payment-result",
    "client_order_id" => "ORDER_1001"
];

$ch = curl_init("${activeBaseUrl}/api/v1/bridge/orders");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);

$res = curl_exec($ch);
curl_close($ch);

$data = json_decode($res, true);
if (!empty($data['success'])) {
    header("Location: " . $data['checkout_url']);
    exit;
}`;
                    } else if (codeLang === 'python') {
                      snippetCode = `import requests

# Create payment session via Modevia Bridge
res = requests.post(
    "${activeBaseUrl}/api/v1/bridge/orders",
    json={
        "api_key": "${activeKey}",
        "amount": 250.00,
        "return_url": "https://myshop.com/payment-result",
        "client_order_id": "ORDER_1001"
    }
)

data = res.json()
if data.get("success"):
    print("Redirect user to:", data["checkout_url"])`;
                    }

                    return (
                      <div className="relative">
                        <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                          {snippetCode}
                        </pre>
                        <button
                          type="button"
                          onClick={() => handleCopy(snippetCode, `${codeLang} Code Snippet`)}
                          className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
                        >
                          {copiedKey === `${codeLang} Code Snippet` ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Grid 3: Interactive Live API Tester & Simulator */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      Live API Simulator & Sandbox
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Simulate calling <code className="font-mono text-indigo-600">POST /api/v1/bridge/orders</code> directly in the browser.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleTestBridgeOrder} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select API Key</label>
                    <select
                      value={selectedMerchantKey}
                      onChange={(e) => setSelectedMerchantKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {merchants.map((m) => (
                        <option key={m.id || m.merchantId} value={m.apiKey}>
                          {m.name} ({m.apiKey.substring(0, 14)}...)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹ INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={bridgeTestForm.amount}
                      onChange={(e) => setBridgeTestForm({ ...bridgeTestForm, amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Return URL</label>
                    <input
                      type="url"
                      required
                      value={bridgeTestForm.returnUrl}
                      onChange={(e) => setBridgeTestForm({ ...bridgeTestForm, returnUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={bridgeTestSubmitting || merchants.length === 0}
                      className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 h-[38px]"
                    >
                      {bridgeTestSubmitting ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Send Test API Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Test Result Display */}
                {bridgeTestResult && (
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Bridge Order Created: {bridgeTestResult.bridge_order_id}
                      </span>
                      <a
                        href={bridgeTestResult.checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-2xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open Checkout Link in New Tab</span>
                      </a>
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto">
                      {JSON.stringify(bridgeTestResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Grid 4: Bridge Orders Ledger */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Bridge Orders Ledger</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {bridgeOrders.length} Transactions Recorded
                  </span>
                </div>

                {bridgeOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                    No orders have been routed through the bridge yet. Use the Simulator above or call the API to create your first order!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="pb-3 pl-2">Bridge Order ID</th>
                          <th className="pb-3">Client Order ID</th>
                          <th className="pb-3">Merchant</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Return URL</th>
                          <th className="pb-3 pr-2">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bridgeOrders.map((bo) => {
                          const isSuccess = bo.status === 'success';
                          const isPending = bo.status === 'pending';
                          return (
                            <tr key={bo.id || bo.bridgeOrderId} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 pl-2 font-mono font-bold text-slate-800">
                                {bo.bridgeOrderId}
                              </td>
                              <td className="py-3 font-mono text-slate-500">
                                {bo.clientOrderId || '-'}
                              </td>
                              <td className="py-3 text-slate-700 font-medium">
                                {bo.customerName || bo.merchantId}
                              </td>
                              <td className="py-3 font-bold text-slate-900">
                                ₹{Number(bo.amount || 0).toFixed(2)}
                              </td>
                              <td className="py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    isSuccess
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : isPending
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {bo.status}
                                </span>
                              </td>
                              <td className="py-3 text-slate-500 max-w-[200px] truncate" title={bo.returnUrl}>
                                {bo.returnUrl}
                              </td>
                              <td className="py-3 pr-2 text-slate-400 whitespace-nowrap text-[11px]">
                                {new Date(bo.createdAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  </div>
);
}
