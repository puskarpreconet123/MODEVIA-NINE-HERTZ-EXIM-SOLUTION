import React from 'react';
import { companyInfo } from '../data/company';

export default function Terms() {
  return (
    <div className="bg-background">
      <section className="bg-hero-gradient py-16 text-center text-primary-foreground">
        <div className="container">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Terms & Conditions</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-3xl space-y-6 text-muted-foreground leading-relaxed">
          <p><strong className="text-foreground">Last updated:</strong> April 2026</p>
          <p>
            These Terms and Conditions govern your use of the services provided by {companyInfo.name}. By engaging our services, you agree to these terms.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Services</h2>
          <p>
            We provide IT solutions, trade facilitation, and digital marketing services as described on our website. The specific scope of services will be outlined in your service agreement.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Payment Terms</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Payment is due as per the agreed schedule in your service contract</li>
            <li>Late payments may incur additional charges</li>
            <li>All prices are in INR unless otherwise specified</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Intellectual Property</h2>
          <p>
            All deliverables created by us become your property upon full payment unless otherwise agreed. Our proprietary tools and methodologies remain our intellectual property.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Limitation of Liability</h2>
          <p>
            Our liability shall not exceed the total amount paid by you for the specific service in question. We are not liable for indirect, incidental, or consequential damages.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground pt-4">Governing Law</h2>
          <p>
            These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Noida, Uttar Pradesh.
          </p>
        </div>
      </section>
    </div>
  );
}
