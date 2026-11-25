import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Menu, X } from 'lucide-react';
import { companyInfo } from '../data/company';

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Services", to: "/#services" },
  { label: "Pay via UPI", to: "/manual-payment" },
  { label: "Contact", to: "/contact" }
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleServicesClick = (e, to) => {
    if (to === "/#services") {
      if (location.pathname === "/") {
        e.preventDefault();
        const el = document.getElementById("services");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={companyInfo.logo}
            alt={companyInfo.name}
            className="h-10 w-10 object-contain"
          />
          <span className="font-display text-base sm:text-lg font-bold text-foreground tracking-tight">
            {companyInfo.name}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={(e) => handleServicesClick(e, link.to)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <a href={`tel:${companyInfo.phone}`}>
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-accent transition-colors">
              <Phone className="h-4 w-4" />
              Call Us
            </button>
          </a>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={(e) => {
                handleServicesClick(e, link.to);
                setIsOpen(false);
              }}
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`tel:${companyInfo.phone}`}
            className="mt-3 block"
            onClick={() => setIsOpen(false)}
          >
            <button className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-accent">
              <Phone className="h-4 w-4" />
              Call Us
            </button>
          </a>
        </div>
      )}
    </header>
  );
}
