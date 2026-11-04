import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { defaultServices } from '../data/services';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  ExternalLink,
  ShieldCheck
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
    phone: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

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

      // Create order via Airpay API integration
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
          paymentUrl: res.data.paymentUrl,
          hostedPayload: res.data.hostedPayload,
          airpay: res.data.airpay
        });

        // Immediately auto-submit official Airpay Hosted Payment Gateway (UPI Intent, Cards, NetBanking)
        if (res.data.hostedPayload) {
          submitAirpayHostedForm(res.data.hostedPayload);
          return;
        }

        // Direct payment redirect if URL returned
        if (res.data.paymentUrl && res.data.paymentUrl.startsWith('http')) {
          window.location.href = res.data.paymentUrl;
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
    <div className="py-12">
      <div className="container max-w-4xl">
        <Link
          to={`/service/${service.id}`}
          className="inline-flex items-center gap-1 text-sm mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {service.title}
        </Link>

        {paymentResult && !submitting ? (
          <div className="rounded-lg border bg-card text-card-foreground p-6 md:p-8 shadow-sm max-w-lg mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground text-center">Order Initiated</h2>
            <p className="mt-1 text-xs text-muted-foreground text-center">
              Airpay Order ID: <span className="font-mono font-semibold text-foreground">{paymentResult.order.orderId}</span>
            </p>

            <div className="my-6 p-4 rounded-lg bg-muted/40 border text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium text-foreground">{service.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium text-foreground">{plan.name} Plan</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-bold">
                <span className="text-foreground">Total Payable:</span>
                <span className="text-primary">
                  {paymentResult.order?.amount ? `₹${paymentResult.order.amount}` : plan.price}
                </span>
              </div>
            </div>

            {paymentResult.hostedPayload && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => submitAirpayHostedForm(paymentResult.hostedPayload)}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <ExternalLink className="h-4 w-4" /> Open Airpay Payment Gateway
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  Official Airpay Payment Gateway (UPI Intent, NetBanking & Cards)
                </p>
              </div>
            )}

            <div className="mt-6 border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-green-600" /> 256-bit Secure Gateway
              </span>
              <Link to="/" className="text-primary font-medium hover:underline">
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-5">
            {/* Form Section */}
            <div className="md:col-span-3">
              <h1 className="text-2xl font-bold mb-6">Checkout</h1>
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                  {errorMessage && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium leading-none block mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium leading-none block mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium leading-none block mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Proceed to Payment'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Order Summary Section */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{plan.name} Plan</p>
                </div>

                <div className="p-6 pt-0">
                  <div className="mb-4">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>

                  <ul className="space-y-2">
                    {plan.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>{feature}</span>
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
