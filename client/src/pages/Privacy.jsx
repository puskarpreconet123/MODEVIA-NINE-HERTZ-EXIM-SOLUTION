import React from 'react';
import { companyInfo } from '../data/company';

export default function Privacy() {
  return (
    <div className="bg-background">
      <section className="bg-hero-gradient py-16 text-center text-primary-foreground">
        <div className="container">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Privacy Policy</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-3xl space-y-6 text-muted-foreground leading-relaxed">
          <p><strong className="text-foreground">Last updated:</strong> April 2026</p>
          <p>
            {companyInfo.name} ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Personal information (name, email, phone number, company name)</li>
            <li>Payment and billing information</li>
            <li>Usage data and analytics</li>
            <li>Communication records</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>To provide and maintain our services</li>
            <li>To process transactions and send related information</li>
            <li>To communicate with you about services, updates, and promotions</li>
            <li>To improve our services and customer experience</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Contact Us</h2>
          <p>
            For privacy-related inquiries, contact us at <a href={`mailto:${companyInfo.email}`} className="text-primary hover:underline">{companyInfo.email}</a> or call <a href={`tel:${companyInfo.phone}`} className="text-primary hover:underline">{companyInfo.phone}</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
