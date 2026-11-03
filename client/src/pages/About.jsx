import React from 'react';
import { companyInfo } from '../data/company';
import { Phone, Mail, MapPin, CheckCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen">
      <section className="bg-hero-gradient py-16 text-primary-foreground text-center">
        <div className="container">
          <h1 className="font-display text-3xl font-bold md:text-4xl">About Us</h1>
          <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
            Learn more about {companyInfo.name} and our mission
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container max-w-3xl space-y-6 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">MODEVIANINE HERTZ EXIM SOLUTION</strong> is a leading technology and business solutions company headquartered in Noida, Uttar Pradesh. We specialize in IT services, international trade solutions, and digital marketing, helping businesses of all sizes navigate the complexities of the modern digital landscape.
          </p>
          <p>
            Our team of experienced professionals brings together expertise in software development, cybersecurity, cloud computing, import/export management, and comprehensive digital marketing strategies. We believe in building long-term partnerships with our clients, delivering solutions that drive measurable results.
          </p>

          <h2 className="font-display text-2xl font-bold text-foreground pt-4">Our Mission</h2>
          <p>
            To empower businesses with innovative technology solutions and strategic consulting that enables sustainable growth and competitive advantage in the global marketplace.
          </p>

          <h2 className="font-display text-2xl font-bold text-foreground pt-4">Our Vision</h2>
          <p>
            To be the most trusted partner for businesses seeking digital transformation, trade facilitation, and marketing excellence across India and beyond.
          </p>

          <h2 className="font-display text-2xl font-bold text-foreground pt-4">Why Choose Us?</h2>
          <ul className="space-y-2.5">
            {[
              "Industry-leading expertise across IT, trade, and marketing",
              "Tailored solutions designed for your specific business needs",
              "Transparent pricing with no hidden costs",
              "Dedicated support team available when you need us",
              "Proven track record of delivering results"
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-foreground">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-border bg-card p-6 mt-8 shadow-sm">
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Our Office</h3>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 mt-1 text-primary" />
              <span>{companyInfo.address}</span>
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">Phone:</span>
              <a href={`tel:${companyInfo.phone}`} className="text-primary hover:underline font-medium">
                {companyInfo.phone}
              </a>
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">Email:</span>
              <a href={`mailto:${companyInfo.email}`} className="text-primary hover:underline font-medium">
                {companyInfo.email}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
