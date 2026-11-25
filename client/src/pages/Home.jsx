import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, Check, CheckCircle2, XCircle, X, QrCode, Zap, Shield } from 'lucide-react';
import { heroStats, faqs } from '../data/company';
import { defaultServices, iconMap } from '../data/services';
import api from '../api/client';

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null);
  const [services, setServices] = useState(defaultServices);
  const [searchParams, setSearchParams] = useSearchParams();

  // Payment Result Modal State
  const [paymentModal, setPaymentModal] = useState({
    show: false,
    status: '',
    orderId: ''
  });

  useEffect(() => {
    const payment = searchParams.get('payment');
    const orderId = searchParams.get('orderId');

    if (payment) {
      setPaymentModal({
        show: true,
        status: payment.toLowerCase(),
        orderId: orderId || ''
      });
    }
  }, [searchParams]);

  const handleClosePaymentModal = () => {
    setPaymentModal({ show: false, status: '', orderId: '' });
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('payment');
    newParams.delete('orderId');
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    // Attempt to fetch fresh services from Express API / MongoDB
    api.get('/api/services')
      .then(res => {
        if (res.data?.success && res.data?.data?.length > 0) {
          setServices(res.data.data);
        }
      })
      .catch(() => {
        // Fall back gracefully to bundled defaultServices
      });
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-gradient py-24 md:py-36 text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.12),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-primary-foreground/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-primary-foreground/5 translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="container relative z-10 text-center max-w-4xl mx-auto">
          <span className="inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs sm:text-sm font-medium mb-6 animate-fade-in">
            🚀 Trusted by businesses across India & worldwide
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight animate-fade-in">
            Comprehensive Solutions
            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground via-primary-foreground/90 to-primary-foreground/75">
              For Your Business
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-primary-foreground/85 leading-relaxed">
            We deliver tailored solutions across IT, international trade, and digital marketing to help your business grow and thrive in the digital age.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/contact">
              <button className="inline-flex items-center gap-2 rounded-lg bg-card px-8 py-3.5 text-base font-semibold text-primary shadow-lg hover:bg-card/90 transition-all hover:scale-105">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link to="/manual-payment">
              <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 text-base font-semibold shadow-lg transition-all hover:scale-105 border border-emerald-400/30">
                <QrCode className="h-4 w-4" />
                Pay via UPI
              </button>
            </Link>
            <a href="#services">
              <button className="inline-flex items-center rounded-lg border border-primary-foreground/30 px-8 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 transition-colors">
                Explore Services
              </button>
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto border-t border-primary-foreground/15 pt-8">
            {heroStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-primary-foreground tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs sm:text-sm text-primary-foreground/70 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manual UPI Payment Banner */}
      <section className="py-8 bg-secondary/50 border-b border-border">
        <div className="container max-w-4xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 bg-card p-6 sm:p-7 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <QrCode className="h-7 w-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full mb-1">
                  <Zap className="h-3 w-3 fill-current" /> Manual Direct Payment
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                  Pay Directly via UPI
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Instant mobile transfer to <span className="font-mono font-semibold text-foreground">abhijithalde363996.aps@sbi</span> with GPay, PhonePe, Paytm, or BHIM.
                </p>
              </div>
            </div>
            <Link to="/manual-payment" className="shrink-0 w-full sm:w-auto">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 text-sm font-semibold shadow-md transition-all hover:scale-[1.02]">
                <QrCode className="h-4 w-4" />
                Pay via UPI Now
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section id="services" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <span className="inline-block rounded-full bg-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground mb-3">
              OUR DIFFERENCE
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Our Services
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-base">
              Explore our comprehensive range of services designed to accelerate your business.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const IconComponent = iconMap[service.icon] || Shield;
              const points = service.services?.[0]?.points || [];

              return (
                <Link
                  key={service.id}
                  to={`/service/${service.id}`}
                  className="group block rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-border/50 pt-4">
                    {points.slice(0, 3).map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
                    View Pricing
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-20 bg-secondary/30">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to know about our services and delivery
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-card overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-4 sm:p-5 text-left font-medium text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-base font-semibold pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="rounded-2xl bg-hero-gradient p-10 md:p-14 text-center text-primary-foreground shadow-xl">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Ready to Transform Your Business?
            </h2>
            <p className="mt-4 text-base md:text-lg text-primary-foreground/85 max-w-xl mx-auto leading-relaxed">
              Get in touch today for a free consultation and let's discuss how we can help you achieve your goals.
            </p>
            <Link to="/contact">
              <button className="mt-8 rounded-lg bg-card px-8 py-3.5 text-base font-semibold text-primary shadow-md hover:bg-card/90 transition-all hover:scale-105">
                Contact Us Today
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Payment Confirmation Modal */}
      {paymentModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center border border-slate-100 text-slate-800">
            <button
              onClick={handleClosePaymentModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {paymentModal.status === 'success' ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Payment Successful! 🎉
                </h3>
                <p className="text-slate-600 text-sm mb-5 leading-relaxed">
                  Thank you for your business. Your payment has been received and confirmed by the payment gateway.
                </p>

                {paymentModal.orderId && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-6 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Order Reference:</span>
                    <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      {paymentModal.orderId}
                    </span>
                  </div>
                )}

                <div className="space-y-2.5">
                  <button
                    onClick={handleClosePaymentModal}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all hover:scale-[1.01]"
                  >
                    Done & Return to Site
                  </button>
                  <Link
                    to="/contact"
                    onClick={handleClosePaymentModal}
                    className="block w-full py-2 px-4 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors"
                  >
                    Questions? Contact Our Team
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
                  <XCircle className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Payment Incomplete / Cancelled
                </h3>
                <p className="text-slate-600 text-sm mb-5 leading-relaxed">
                  The transaction was not completed or was declined. If any amount was deducted from your account, it will automatically reverse within 3-5 working days.
                </p>

                {paymentModal.orderId && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-6 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Order Reference:</span>
                    <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      {paymentModal.orderId}
                    </span>
                  </div>
                )}

                <div className="space-y-2.5">
                  <button
                    onClick={handleClosePaymentModal}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all"
                  >
                    Dismiss
                  </button>
                  <Link
                    to="/contact"
                    onClick={handleClosePaymentModal}
                    className="block w-full py-2 px-4 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors"
                  >
                    Contact Support for Assistance
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
