import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { companyInfo } from '../data/company';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src={companyInfo.logo}
                alt={companyInfo.name}
                className="h-8 w-8 object-contain"
              />
              <span className="font-display font-bold text-foreground text-sm">
                {companyInfo.name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Comprehensive solutions for your business growth in the digital age.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3">
              Quick Links
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "About Us", to: "/about" },
                { label: "Contact", to: "/contact" },
                { label: "FAQs", to: "/#faqs" }
              ].map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3">
              Legal
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "Privacy Policy", to: "/privacy" },
                { label: "Terms & Conditions", to: "/terms" },
                { label: "Refund Policy", to: "/refund" },
                { label: "Cancellation Policy", to: "/cancellation" }
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3">
              Contact
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href={`tel:${companyInfo.phone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{companyInfo.phone}</span>
              </a>
              <a
                href={`mailto:${companyInfo.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="break-all">{companyInfo.email}</span>
              </a>
              <p className="flex items-start gap-2 text-sm text-muted-foreground leading-snug">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span>{companyInfo.address}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {companyInfo.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
