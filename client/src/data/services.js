import {
  Shield,
  Code,
  Cloud,
  Lock,
  Lightbulb,
  Ship,
  FileText,
  Search,
  Share2,
  MousePointer,
  PenTool,
  PanelsTopLeft,
  Mail
} from 'lucide-react';

export const iconMap = {
  Shield,
  Code,
  Cloud,
  Lock,
  Lightbulb,
  Ship,
  FileText,
  Search,
  Share2,
  MousePointer,
  PenTool,
  PanelsTopLeft,
  Mail
};

export const defaultServices = [
  {
    id: "managed-it",
    title: "Managed IT Services",
    description: "Affordable IT monitoring and support for small businesses",
    icon: "Shield",
    services: [
      {
        title: "System Monitoring",
        points: [
          "Basic system monitoring",
          "Remote issue resolution",
          "Monthly maintenance check"
        ]
      }
    ],
    pricing: [
      {
        name: "Basic",
        price: "₹999",
        period: "/mo",
        features: ["Monitoring", "Email support"]
      },
      {
        name: "Standard",
        price: "₹2,499",
        period: "/mo",
        features: ["24/7 monitoring", "Remote support", "Monthly report"],
        popular: true
      },
      {
        name: "Advanced",
        price: "₹4,999",
        period: "/mo",
        features: ["Priority support", "Backup setup", "Security check"]
      }
    ]
  },
  {
    id: "software-development",
    title: "Software Development",
    description: "Budget-friendly websites and small applications",
    icon: "Code",
    services: [
      {
        title: "Development",
        points: [
          "Single-page websites",
          "Small business websites",
          "Basic web apps"
        ]
      }
    ],
    pricing: [
      {
        name: "Starter Website",
        price: "₹3,000",
        period: " one-time",
        features: ["1 page", "Responsive", "Contact form"]
      },
      {
        name: "Business Website",
        price: "₹4,500",
        period: " one-time",
        features: ["Up to 5 pages", "Basic SEO"],
        popular: true
      },
      {
        name: "Mini Web App",
        price: "₹5,000",
        period: " one-time",
        features: ["Admin panel", "Basic dashboard", "1 month support"]
      }
    ]
  },
  {
    id: "cloud-services",
    title: "Cloud Services",
    description: "Simple cloud setup and migration support",
    icon: "Cloud",
    services: [
      {
        title: "Cloud",
        points: [
          "Basic cloud deployment",
          "Website migration",
          "Performance setup"
        ]
      }
    ],
    pricing: [
      {
        name: "Setup",
        price: "₹1,500",
        period: " one-time",
        features: ["Cloud deployment", "Email support"]
      },
      {
        name: "Migration",
        price: "₹3,500",
        period: " one-time",
        features: ["Website migration", "Optimization"],
        popular: true
      },
      {
        name: "Cloud Care",
        price: "₹4,999",
        period: "/mo",
        features: ["Monitoring", "Monthly report"]
      }
    ]
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity Services",
    description: "Affordable website and system protection",
    icon: "Lock",
    services: [
      {
        title: "Security",
        points: [
          "Basic vulnerability scan",
          "Firewall setup",
          "Malware protection"
        ]
      }
    ],
    pricing: [
      {
        name: "Basic Scan",
        price: "₹999",
        period: " one-time",
        features: ["Security scan", "Report"]
      },
      {
        name: "Protection",
        price: "₹2,999",
        period: "/mo",
        features: ["Firewall", "Monitoring"],
        popular: true
      },
      {
        name: "Advanced",
        price: "₹4,999",
        period: "/mo",
        features: ["Full protection", "Priority support"]
      }
    ]
  },
  {
    id: "it-consulting",
    title: "IT Consulting",
    description: "Low-cost business and technology consultation",
    icon: "Lightbulb",
    services: [
      {
        title: "Consulting",
        points: [
          "Business tech guidance",
          "Digital roadmap",
          "Process advice"
        ]
      }
    ],
    pricing: [
      {
        name: "Consult Call",
        price: "₹500",
        period: "/hr",
        features: ["Strategy discussion"]
      },
      {
        name: "Business Plan",
        price: "₹3,000",
        period: " one-time",
        features: ["Roadmap", "Tech suggestions"],
        popular: true
      },
      {
        name: "Monthly Advisory",
        price: "₹4,999",
        period: "/mo",
        features: ["Ongoing support"]
      }
    ]
  },
  {
    id: "export-services",
    title: "Export Services",
    description: "Basic documentation and logistics support",
    icon: "Ship",
    services: [
      {
        title: "Export",
        points: [
          "Invoice help",
          "Shipping documentation",
          "Basic logistics guidance"
        ]
      }
    ],
    pricing: [
      {
        name: "Docs Support",
        price: "₹1,500",
        period: " per shipment",
        features: ["Invoice + packing list"]
      },
      {
        name: "Complete Help",
        price: "₹3,999",
        period: " per shipment",
        features: ["Full documentation", "Logistics help"],
        popular: true
      },
      {
        name: "Monthly Support",
        price: "₹5,000",
        period: "/mo",
        features: ["Documentation guidance"]
      }
    ]
  },
  {
    id: "import-services",
    title: "Import Services",
    description: "Affordable sourcing and compliance help",
    icon: "FileText",
    services: [
      {
        title: "Import",
        points: [
          "Supplier sourcing",
          "Custom clearance help",
          "Compliance guidance"
        ]
      }
    ],
    pricing: [
      {
        name: "Basic Help",
        price: "₹1,500",
        period: " per shipment",
        features: ["Customs guidance"]
      },
      {
        name: "Sourcing Support",
        price: "₹3,999",
        period: " per shipment",
        features: ["Supplier sourcing", "Basic QC"],
        popular: true
      },
      {
        "name": "Import Care",
        "price": "₹5,000",
        "period": "/mo",
        "features": ["Compliance support"]
      }
    ]
  },
  {
    id: "seo",
    title: "Search Engine Optimization",
    description: "Affordable SEO for startups",
    icon: "Search",
    services: [
      {
        title: "SEO",
        points: [
          "Keyword research",
          "On-page optimization",
          "Basic technical audit"
        ]
      }
    ],
    pricing: [
      {
        name: "Starter",
        price: "₹1,500",
        period: "/mo",
        features: ["5 keywords"]
      },
      {
        name: "Growth",
        price: "₹3,500",
        period: "/mo",
        features: ["15 keywords", "Reports"],
        popular: true
      },
      {
        name: "Advanced",
        price: "₹5,000",
        period: "/mo",
        features: ["Full optimization"]
      }
    ]
  },
  {
    id: "social-media",
    title: "Social Media Marketing",
    description: "Low-budget social media growth",
    icon: "Share2",
    services: [
      {
        title: "SMM",
        points: [
          "Post creation",
          "Basic ads",
          "Monthly analytics"
        ]
      }
    ],
    pricing: [
      {
        name: "Basic",
        price: "₹1,200",
        period: "/mo",
        features: ["1 platform", "8 posts"]
      },
      {
        name: "Growth",
        price: "₹3,000",
        period: "/mo",
        features: ["3 platforms", "Ad setup"],
        popular: true
      },
      {
        name: "Premium",
        price: "₹5,000",
        period: "/mo",
        features: ["All platforms", "Ad management"]
      }
    ]
  },
  {
    id: "ppc",
    title: "Pay-Per-Click Advertising",
    description: "Affordable ad campaign management",
    icon: "MousePointer",
    services: [
      {
        title: "PPC",
        points: [
          "Google Ads setup",
          "Campaign monitoring",
          "Basic ROI tracking"
        ]
      }
    ],
    pricing: [
      {
        name: "Starter",
        price: "₹1,000",
        period: "/mo + ad spend",
        features: ["1 campaign"]
      },
      {
        name: "Professional",
        price: "₹3,000",
        period: "/mo + ad spend",
        features: ["3 campaigns"],
        popular: true
      },
      {
        name: "Advanced",
        price: "₹5,000",
        period: "/mo + ad spend",
        features: ["Full funnel ads"]
      }
    ]
  },
  {
    id: "content-marketing",
    title: "Content Marketing",
    description: "Simple content creation for startups",
    icon: "PenTool",
    services: [
      {
        title: "Content",
        points: [
          "Blog writing",
          "Basic video content",
          "Content planning"
        ]
      }
    ],
    pricing: [
      {
        name: "Basic",
        price: "₹1,500",
        period: "/mo",
        features: ["2 blogs"]
      },
      {
        name: "Standard",
        price: "₹3,500",
        period: "/mo",
        features: ["4 blogs"],
        popular: true
      },
      {
        name: "Premium",
        price: "₹5,000",
        period: "/mo",
        features: ["6 blogs"]
      }
    ]
  },
  {
    id: "web-design",
    title: "Website Design & Development",
    description: "Affordable websites for small businesses",
    icon: "PanelsTopLeft",
    services: [
      {
        title: "Web Design",
        points: [
          "Responsive design",
          "Lead forms",
          "Basic SEO setup"
        ]
      }
    ],
    pricing: [
      {
        name: "Single Page",
        price: "₹3,000",
        period: " one-time",
        features: ["Responsive page"]
      },
      {
        name: "Business Site",
        price: "₹4,500",
        period: " one-time",
        features: ["5 pages"],
        popular: true
      },
      {
        name: "Mini Store",
        price: "₹5,000",
        period: " one-time",
        features: ["Product listing", "Payment setup"]
      }
    ]
  },
  {
    id: "email-marketing",
    title: "Email Marketing",
    description: "Budget email campaigns and automation",
    icon: "Mail",
    services: [
      {
        title: "Email",
        points: [
          "Campaign setup",
          "Basic automation",
          "Analytics"
        ]
      }
    ],
    pricing: [
      {
        name: "Starter",
        price: "₹800",
        period: "/mo",
        features: ["1,000 subscribers"]
      },
      {
        name: "Growth",
        price: "₹2,500",
        period: "/mo",
        features: ["Automation"],
        popular: true
      },
      {
        name: "Advanced",
        price: "₹5,000",
        period: "/mo",
        features: ["Unlimited campaigns"]
      }
    ]
  }
];
