import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { defaultServices } from '../data/services';
import { ArrowLeft, Check, Loader2, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
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
          paymentUrl: res.data.paymentUrl
        });

        // If Airpay gateway provided an external redirect URL, automatically redirect
        if (res.data.paymentUrl && res.data.paymentUrl.startsWith('http')) {
          window.location.href = res.data.paymentUrl;
        } else if (res.data.qrString && res.data.qrString.startsWith('http')) {
          window.location.href = res.data.qrString;
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
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center max-w-lg mx-auto animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Order Initiated!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Order ID: <span className="font-mono font-semibold text-foreground">{paymentResult.order.orderId}</span>
            </p>
            <div className="my-6 p-4 rounded-lg bg-secondary/50 border border-border text-left">
              <p className="text-sm font-medium text-foreground"><strong>Service:</strong> {service.title}</p>
              <p className="text-sm text-muted-foreground"><strong>Plan:</strong> {plan.name}</p>
              <p className="text-sm text-muted-foreground"><strong>Amount:</strong> {plan.price}</p>
              <p className="text-sm text-muted-foreground"><strong>Customer:</strong> {formData.name} ({formData.phone})</p>
            </div>

            {paymentResult.qrString && (
              <div className="space-y-4">
                <a
                  href={paymentResult.qrString}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-accent transition-colors shadow-md"
                >
                  <QrCode className="h-4 w-4" /> Pay with UPI / Open App
                </a>
                <p className="text-xs text-muted-foreground">
                  Saved to database. You can track this order in the Admin dashboard.
                </p>
              </div>
            )}

            <div className="mt-6 border-t border-border pt-4">
              <Link to="/">
                <button className="text-sm text-primary font-medium hover:underline">
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
                      placeholder="your@email.com"
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
                      placeholder="+91 9876543210"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Your organization"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-accent transition-colors disabled:opacity-50 mt-6"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing Order...
                      </>
                    ) : (
                      "Proceed to Payment"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-display font-semibold text-foreground text-base">
                  {service.title}
                </h3>
                <p className="text-sm text-primary font-medium mt-0.5">
                  {plan.name} Plan
                </p>

                <div className="my-5 border-y border-border/60 py-4 flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total Due:</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-xs text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Included in this plan:
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
