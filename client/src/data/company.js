export const companyInfo = {
  name: import.meta.env.VITE_COMPANY_NAME || "MODEVIA NINE HERTZ EXIM SOLUTION",
  phone: import.meta.env.VITE_COMPANY_PHONE || "8777342997",
  address: import.meta.env.VITE_COMPANY_ADDRESS || "MODEVIA NINE HERTZ EXIM SOLUTION, HOLDING NO-516, RN Guha Road, Sagnik Plaza, South Dum Dum, Kolkata, West Bengal - 700074",
  email: import.meta.env.VITE_COMPANY_EMAIL || "modevianine@gmail.com",
  logo: "/logo-BEXcf6aR.png"
};

export const faqs = [
  {
    q: "How long does project delivery take?",
    a: "Most projects are delivered within 3–10 business days depending on complexity."
  },
  {
    q: "Do you provide ongoing support?",
    a: "Yes, we provide support based on the selected pricing plan."
  },
  {
    q: "Can I upgrade my plan later?",
    a: "Yes, you can upgrade your plan anytime by contacting our team."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI, bank transfer, and online payments."
  }
];

export const heroStats = [
  { value: "200+", label: "Projects Delivered" },
  { value: "50+", label: "Global Clients" },
  { value: "13+", label: "Service Offerings" },
  { value: "99%", label: "Client Satisfaction" }
];
