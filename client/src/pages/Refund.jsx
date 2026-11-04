import React from 'react';
import { companyInfo } from '../data/company';

export default function Refund() {
  return (
    <div className="bg-background">
      <section className="bg-hero-gradient py-16 text-center text-primary-foreground">
        <div className="container">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Refund Policy</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-3xl space-y-6 text-muted-foreground leading-relaxed">
          <p><strong className="text-foreground">Last updated:</strong> April 2026</p>
          <p>
            {companyInfo.name} strives for complete customer satisfaction. This refund policy outlines the conditions under which refunds may be issued.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Eligibility for Refund</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Refund requests must be made within 7 days of payment</li>
            <li>Services not yet commenced are eligible for a full refund</li>
            <li>Partially delivered services may be eligible for a pro-rata refund</li>
            <li>Custom development work already completed is non-refundable</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Refund Process</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Submit a refund request via email to <a href={`mailto:${companyInfo.email}`} className="text-primary hover:underline">{companyInfo.email}</a></li>
            <li>Include your order details and reason for the refund</li>
            <li>Refunds are processed within 7-10 business days</li>
            <li>Refunds are credited to the original payment method</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Non-Refundable Items</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Consultation fees for completed sessions</li>
            <li>Third-party software or service purchases made on your behalf</li>
            <li>Ad spend and media buying costs</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
