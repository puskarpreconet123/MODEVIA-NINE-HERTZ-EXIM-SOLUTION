import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Package, MessageSquare, RefreshCw, CheckCircle, Clock, XCircle, LogOut, ShieldCheck } from 'lucide-react';

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verify JWT token exists
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
      const [ordersRes, messagesRes] = await Promise.all([
        api.get('/api/orders').catch(() => ({ data: { data: [] } })),
        api.get('/api/contact').catch(() => ({ data: { data: [] } }))
      ]);
      setOrders(ordersRes.data?.data || []);
      setMessages(messagesRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-border gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              MERN Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live orders and customer inquiries stored in MongoDB
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 px-4 py-2 text-sm font-semibold hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
            >
              <LogOut className="h-4 w-4" /> Log Out
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            <Package className="h-4 w-4" />
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'messages'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Contact Inquiries ({messages.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'orders' ? (
            orders.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-base font-medium">No orders yet</p>
                <p className="text-sm">Initiate a checkout from the services page to see live orders here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Service & Plan</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((o) => (
                      <tr key={o.orderId || o._id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{o.orderId}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{o.customerName}</div>
                          <div className="text-xs text-muted-foreground">{o.customerEmail} • {o.customerPhone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{o.serviceTitle}</span>
                          <span className="ml-1 text-xs text-primary font-semibold">({o.planName})</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-foreground">₹{o.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            o.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : o.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {o.status === 'success' ? <CheckCircle className="h-3 w-3" /> :
                             o.status === 'failed' ? <XCircle className="h-3 w-3" /> :
                             <Clock className="h-3 w-3" />}
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o.orderId, e.target.value)}
                            className="rounded border border-input bg-background px-2 py-1 text-xs font-medium"
                          >
                            <option value="pending">Pending</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            messages.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-base font-medium">No contact messages yet</p>
                <p className="text-sm">Inquiries submitted on the contact form will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {messages.map((m, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground text-sm">{m.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-primary font-medium">{m.email} {m.phone && `• ${m.phone}`}</p>
                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg">
                      "{m.message}"
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
