import React from 'react';
import { companyInfo } from '../data/company';

export default function Cancellation() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-hero-gradient py-16 text-center text-primary-foreground">
        <div className="container">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Cancellation Policy</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-3xl space-y-6 text-muted-foreground leading-relaxed">
          <p><strong className="text-foreground">Last updated:</strong> April 2026</p>
          <p>
            You may cancel your service subscription or project engagement with {companyInfo.name} under the following conditions.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Subscription Services</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Monthly subscriptions can be cancelled with 30 days written notice</li>
            <li>Cancellation takes effect at the end of the current billing cycle</li>
            <li>No partial refunds for unused days within a billing cycle</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Project-Based Services</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Projects can be cancelled before work commences for a full refund</li>
            <li>Once work has started, cancellation fees apply based on work completed</li>
            <li>All completed deliverables up to the cancellation date will be provided</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">How to Cancel</h2>
          <p>
            To cancel a service, please contact us at <a href={`mailto:${companyInfo.email}`} className="text-primary hover:underline">{companyInfo.email}</a> or call <a href={`tel:${companyInfo.phone}`} className="text-primary hover:underline">{companyInfo.phone}</a>. Include your account details and reason for cancellation.
          </p>
        </div>
      </section>
    </div>
  );
}
