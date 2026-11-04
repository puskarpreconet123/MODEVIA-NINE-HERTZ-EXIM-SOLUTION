import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { defaultServices, iconMap } from '../data/services';
import { ArrowLeft, Check, CreditCard, Shield } from 'lucide-react';
import api from '../api/client';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt API fetch
    api.get(`/api/services/${id}`)
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setService(res.data.data);
        } else {
          const fallback = defaultServices.find(s => s.id === id);
          setService(fallback || null);
        }
      })
      .catch(() => {
        const fallback = defaultServices.find(s => s.id === id);
        setService(fallback || null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground">Loading service details...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">Service Not Found</h1>
        <p className="mt-2 text-muted-foreground">The requested service offering could not be found.</p>
        <Link to="/">
          <button className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-accent transition-colors">
            Back to Home
          </button>
        </Link>
      </div>
    );
  }

  const IconComponent = iconMap[service.icon] || Shield;
  const points = service.services?.[0]?.points || [];

  return (
    <div>
      {/* Service Header */}
      <section className="bg-hero-gradient py-16 text-primary-foreground">
        <div className="container">
          <Link
            to="/#services"
            className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Services
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
              <IconComponent className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">
                {service.title}
              </h1>
              <p className="mt-1 text-primary-foreground/80 text-base">
                {service.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-12 bg-background border-b border-border">
        <div className="container">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">
            What's Included
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {points.map((pt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <span className="text-foreground text-sm font-medium">{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground">
              Choose Your Plan
            </h2>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">
              Select the plan that best fits your business needs
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
            {service.pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-card-hover ${
                  plan.popular
                    ? "border-primary ring-2 ring-primary/20 scale-105 z-10"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground shadow-sm">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="text-center pb-4 border-b border-border/50">
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {plan.name}
                    </h3>
                    <div className="mt-3 flex items-baseline justify-center gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3 mb-8">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => navigate(`/checkout/${service.id}/${encodeURIComponent(plan.name)}`)}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all shadow-sm ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-accent"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
