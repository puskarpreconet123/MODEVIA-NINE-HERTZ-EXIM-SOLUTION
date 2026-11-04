import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { defaultServices } from '../data/services';
import { 
  ArrowLeft, 
  Check, 
  Loader2, 
  QrCode, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Smartphone, 
  ShieldCheck, 
  ExternalLink,
  Zap 
} from 'lucide-react';
import api from '../api/client';

export default function Checkout() {
  const { serviceId, planName } = useParams();
  const decodedPlanName = decodeURIComponent(planName || '');

  const [service, setService] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Find service and plan
    api.get(`/api/services/${serviceId}`)
      .then(res => {
        const s = res.data?.data || defaultServices.find(item => item.id === serviceId);
        setService(s);
        const p = s?.pricing?.find(item => item.name === decodedPlanName);
        setPlan(p);
      })
      .catch(() => {
        const s = defaultServices.find(item => item.id === serviceId);
        setService(s);
        const p = s?.pricing?.find(item => item.name === decodedPlanName);
        setPlan(p);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [serviceId, decodedPlanName]);

  const handleCopyVpa = (vpa) => {
    if (!vpa) return;
    navigator.clipboard.writeText(vpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const submitAirpayHostedForm = (hostedPayload) => {
    if (!hostedPayload?.actionUrl || !hostedPayload?.fields) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = hostedPayload.actionUrl;
    for (const [key, val] of Object.entries(hostedPayload.fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = val;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Email, Phone).');
      return;
    }

    try {
      setSubmitting(true);
      const cleanPrice = plan.price.replace(/[^\d]/g, '');

      // Call our Express MERN backend
      const res = await api.post('/api/orders/create', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        serviceId: service.id,
        serviceTitle: service.title,
        planName: plan.name,
        amount: cleanPrice
      });

      if (res.data?.success) {
        setPaymentResult({
          order: res.data.data,
          qrString: res.data.qrString,
          paymentUrl: res.data.paymentUrl,
          hostedPayload: res.data.hostedPayload,
          airpay: res.data.airpay
        });

        // 1. If Airpay gateway provided an external redirect URL, automatically redirect
        if (res.data.paymentUrl && res.data.paymentUrl.startsWith('http')) {
          window.location.href = res.data.paymentUrl;
        } 
        // 2. On mobile devices, automatically invoke the UPI Intent if returned by Airpay
        else if (res.data.qrString && res.data.qrString.startsWith('upi://')) {
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          if (isMobile) {
            window.location.href = res.data.qrString;
          }
        }
      } else {
        throw new Error(res.data?.message || 'Payment initiation failed');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Something went wrong during checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOneRupeeTest = async () => {
    setErrorMessage('');
    const testName = formData.name.trim() || 'Test Customer';
    const testEmail = formData.email.trim() || 'test@example.com';
    const testPhone = formData.phone.trim() || '9876543210';

    try {
      setSubmitting(true);
      const res = await api.post('/api/orders/create', {
        name: testName,
        email: testEmail,
        phone: testPhone,
        serviceId: service.id,
        serviceTitle: `${service.title} (₹1 Test)`,
        planName: `${plan.name} (Test Mode)`,
        amount: '1'
      });

      if (res.data?.success) {
        setPaymentResult({
          order: res.data.data,
          qrString: res.data.qrString,
          paymentUrl: res.data.paymentUrl,
          hostedPayload: res.data.hostedPayload,
          airpay: res.data.airpay
        });

        // Auto-launch on mobile devices if Airpay returns UPI intent
        if (res.data.paymentUrl && res.data.paymentUrl.startsWith('http')) {
          window.location.href = res.data.paymentUrl;
        } else if (res.data.qrString && res.data.qrString.startsWith('upi://')) {
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          if (isMobile) {
            window.location.href = res.data.qrString;
          }
        }
      } else {
        throw new Error(res.data?.message || 'Payment initiation failed');
      }
    } catch (err) {
      console.error('Test payment error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Something went wrong during ₹1 test checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-24 text-center">
        <Loader2 className="inline-block h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  if (!service || !plan) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Plan Not Found</h1>
        <p className="mt-2 text-muted-foreground">The selected plan could not be located.</p>
        <Link to="/">
          <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Back to Home
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl">
        <Link
          to={`/service/${service.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {service.title}
        </Link>

        {paymentResult ? (
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-lg max-w-lg mx-auto animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground text-center">Order Created</h2>
            <p className="mt-1 text-xs text-muted-foreground text-center">
              Airpay Order ID: <span className="font-mono font-semibold text-foreground">{paymentResult.order.orderId}</span>
            </p>

            {/* Order Details */}
            <div className="my-5 p-4 rounded-xl bg-secondary/40 border border-border text-left space-y-1.5 text-xs md:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-semibold text-foreground">{service.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium text-foreground">{plan.name}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm md:text-base font-bold">
                <span className="text-foreground">Total Payable:</span>
                <span className="text-primary">
                  {paymentResult.order?.amount ? `₹${paymentResult.order.amount}` : plan.price}
                </span>
              </div>
            </div>

            {/* Airpay Gateway Section */}
            {paymentResult.hostedPayload && (
              <div className="my-5 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Airpay Official Payment Gateway</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Merchant ID: <span className="font-mono font-semibold text-foreground">{paymentResult.hostedPayload.fields.merchant_id}</span>
                </p>
                <button
                  type="button"
                  onClick={() => submitAirpayHostedForm(paymentResult.hostedPayload)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]"
                >
                  <ExternalLink className="h-4 w-4" /> Pay with Airpay (UPI, Cards, NetBanking)
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Direct encrypted connection to Airpay gateway.
                </p>
              </div>
            )}

            {/* Airpay Dynamic QR Code (if returned by Airpay Seamless) */}
            {paymentResult.qrString && (
              <div className="my-5 rounded-xl border border-border/80 bg-background/80 p-5 text-center">
                <div className="inline-block p-3 bg-white rounded-xl shadow-inner border border-border">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentResult.qrString)}`}
                    alt="Airpay QR Code"
                    className="w-48 h-48 md:w-52 md:h-52 object-contain mx-auto"
                  />
                </div>
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  Scan Airpay dynamic QR with Google Pay, PhonePe, Paytm, or BHIM
                </p>
                <div className="mt-3">
                  <a
                    href={paymentResult.qrString}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <Smartphone className="h-3.5 w-3.5" /> Open UPI App Intent
                  </a>
                </div>
              </div>
            )}

            {/* Airpay Notice if Seamless returned status */}
            {paymentResult.airpay?.data?.message && (
              <div className="my-4 rounded-lg border border-border bg-secondary/30 p-3 text-left text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>Airpay Gateway Status:</span>
                </div>
                <p className="text-muted-foreground font-mono text-[11px]">
                  {paymentResult.airpay.data.message}
                </p>
              </div>
            )}

            <div className="mt-6 border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-green-600" /> 256-bit Secure Checkout
              </span>
              <Link to="/">
                <button className="text-primary font-medium hover:underline">
                  Return to Home
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-5">
            {/* Form Section */}
            <div className="md:col-span-3">
              <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                {errorMessage && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Company / Organization (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Your company name"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-md active:scale-[0.99]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Initiating Payment...
                        </>
                      ) : (
                        `Proceed to Pay ${plan.price}`
                      )}
                    </button>

                    {/* ₹1 Test Payment Integration Button */}
                    <button
                      type="button"
                      onClick={handleOneRupeeTest}
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-emerald-500/80 bg-emerald-50/70 dark:bg-emerald-950/30 py-2.5 px-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 transition-all active:scale-[0.99] shadow-sm"
                    >
                      <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                      <span>⚡ Pay ₹1 (Test Payment Integration)</span>
                    </button>
                    <p className="text-[11px] text-center text-muted-foreground">
                      Use the ₹1 button to safely test live UPI Intent & Airpay gateway checkout.
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Plan Summary Section */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">{service.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{service.shortDescription}</p>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-medium text-foreground">{plan.name} Plan</span>
                    <span className="text-lg font-bold text-primary">{plan.price}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{plan.billing}</span>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Included Features:
                  </h4>
                  <ul className="space-y-1.5">
                    {plan.features?.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground border border-border">
                  <p>🔒 <strong>Secure Payment:</strong> Instant UPI Intent, QR Code & Net Banking with Airpay.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
