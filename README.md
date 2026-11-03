# MODEVIA NINE HERTZ EXIM SOLUTION — Full MERN Stack Application

A complete **MERN Stack** (MongoDB, Express.js, React 18, Node.js) implementation of **[modevianinehertz.in](https://www.modevianinehertz.in/)**.

---

## 🏗️ Architecture

```
payment clone/
├── server/                       # Node.js & Express REST API Backend
│   ├── config/
│   │   └── db.js                 # MongoDB connection with Mongoose & graceful fallback
│   ├── data/
│   │   └── servicesData.json     # All 13 services & pricing plans catalog
│   ├── models/
│   │   ├── Service.js            # MongoDB Service & Pricing Schema
│   │   ├── Order.js              # MongoDB Order & Payment Transaction Schema
│   │   └── Contact.js            # MongoDB Contact Inquiries Schema
│   ├── routes/
│   │   ├── serviceRoutes.js      # /api/services (list, details, auto-seeding)
│   │   ├── orderRoutes.js        # /api/orders (creation, CloseXPay gateway, UPI QR)
│   │   └── contactRoutes.js      # /api/contact (inquiry submission & admin viewing)
│   ├── server.js                 # Express server entry point
│   ├── .env                      # Server configuration
│   └── package.json
│
├── client/                       # React 18 + Vite + Tailwind CSS Frontend
│   ├── public/
│   │   ├── logo-BEXcf6aR.png     # Official high-resolution logo
│   │   └── placeholder.svg       # SVG assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Sticky header with navigation & Call Us button
│   │   │   ├── Footer.jsx        # Footer with Quick links, Legal, and Contact info
│   │   │   └── ScrollToTop.jsx   # Smooth scroll-to-top button
│   │   ├── data/
│   │   │   ├── company.js        # Company details (Phone, Email, Address, FAQs)
│   │   │   └── services.js       # Complete 13 services & Lucide icons mapping
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Hero with animated stats, 13 services grid, FAQs, CTA
│   │   │   ├── About.jsx         # Mission, Vision, Why Choose Us, Office info
│   │   │   ├── ServiceDetail.jsx # What's Included, Pricing tiers (Starter, Pro, etc.)
│   │   │   ├── Checkout.jsx      # Customer form, UPI QR generation, order initiation
│   │   │   ├── Contact.jsx       # Contact form submitting to MongoDB
│   │   │   ├── Privacy.jsx       # Privacy Policy page
│   │   │   ├── Terms.jsx         # Terms & Conditions page
│   │   │   ├── Refund.jsx        # Refund Policy page
│   │   │   ├── Cancellation.jsx  # Cancellation Policy page
│   │   │   ├── Admin.jsx         # Admin Dashboard for Orders and Inquiries
│   │   │   └── NotFound.jsx      # 404 page
│   │   ├── App.jsx               # Router & layout setup
│   │   ├── main.jsx              # React DOM mounting
│   │   └── index.css             # Tailwind & theme variables
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── package.json                  # Root runner script
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies
You can install everything from the root folder:

```bash
npm run install:all
```

Or individually:
```bash
cd server && npm install
cd ../client && npm install
```

## 🔐 Environment Variables

All API endpoints, database URIs, payment gateway credentials, URLs, and company details are driven by environment variables on both the backend and frontend.

### Backend (`server/.env` & `server/.env.example`)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Database URI (Local or MongoDB Atlas)
MONGO_URI=mongodb://127.0.0.1:27017/modevia_ninehertz

# Client / CORS Allowed Origin
CLIENT_URL=http://localhost:5173

# Payment Gateway API & Credentials
CLOSEXPAY_API_URL=https://banking.closexpay.in/api/add-money/v6/createOrder
CLOSEXPAY_API_TOKEN=dAAoS67NmpGrBKJafeWpCQZAJE9P65GA7pKl5ll6SWk8M7ZX9eIE2uwmneML
PAYEE_VPA=modevia2025@nsdlpbma
PAYEE_NAME=Modevia Nine Hertz
CALLBACK_URL=https://example.com/callback

# Company Contact Information
COMPANY_NAME=MODEVIA NINE HERTZ EXIM SOLUTION
COMPANY_PHONE=8777342997
COMPANY_EMAIL=modevianine@gmail.com
COMPANY_ADDRESS=MODEVIA NINE HERTZ EXIM SOLUTION, HOLDING NO-516, RN Guha Road, Sagnik Plaza, South Dum Dum, Kolkata, West Bengal - 700074
```

### Frontend (`client/.env` & `client/.env.example`)
```env
# API Base URL (empty for same-host proxy or full URL like http://localhost:5000)
VITE_API_BASE_URL=http://localhost:5000

# Company Contact & Profile
VITE_COMPANY_NAME=MODEVIA NINE HERTZ EXIM SOLUTION
VITE_COMPANY_PHONE=8777342997
VITE_COMPANY_EMAIL=modevianine@gmail.com
VITE_COMPANY_ADDRESS=MODEVIA NINE HERTZ EXIM SOLUTION, HOLDING NO-516, RN Guha Road, Sagnik Plaza, South Dum Dum, Kolkata, West Bengal - 700074
```

### 3. Run Development Servers
From the root directory:

```bash
npm run dev
```

This starts:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

---

## 💳 Payment Gateway Integration (Airpay v4 Seamless & UPI)

The application integrates the **Airpay v4 Seamless API** with exact cryptographic specifications:
- **Encryption Algorithm**: AES-256-CBC with PKCS5/7 padding.
- **Key Derivation**: `md5(username . "~:~" . password)` or configured `AIRPAY_SECRET_KEY`.
- **IV Generation**: 16-character hex string (`crypto.randomBytes(8).toString('hex')`) prepended to the Base64-encoded encrypted payload (`$iv . base64_encode($raw)`).
- **Private Key**: `hash('sha256', secret . '@' . username . ':|:' . password)`.
- **Checksum**: Alphabetically sorted key-value pairs concatenated + current date (`YYYY-MM-DD`) hashed with SHA-256.
- **Endpoint**: `https://kraken.airpay.co.in/airpay/pay/v4/api/seamless/?token=<access_token>`.

### Airpay Environment Variables (`server/.env`)
```env
AIRPAY_MERCHANT_ID=456
AIRPAY_USERNAME=your_airpay_username
AIRPAY_PASSWORD=your_airpay_password
AIRPAY_SECRET=your_airpay_secret
AIRPAY_SECRET_KEY=a197b462cb0350a093f34996f698dc94
AIRPAY_ACCESS_TOKEN=your_airpay_access_token
AIRPAY_API_URL=https://kraken.airpay.co.in/airpay/pay/v4/api/seamless/
AIRPAY_CHANNEL=pg
```

## 🔒 Admin Access & JWT Authentication

There are **no public links or shortcuts** to the admin dashboard in the navigation bar or footer. You access it by manually typing the URL into the browser address bar.

### Admin URLs
- **Admin Login**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
- **Admin Dashboard**: [http://localhost:5173/admin](http://localhost:5173/admin) *(Automatically redirects to `/admin/login` if not authenticated)*

### Default Credentials (`server/.env`)
- **Email**: `admin@modevia.com`
- **Password**: `Admin@123456`

### How It Works:
1. When you type `/admin/login`, you enter the admin email and password.
2. The server authenticates credentials and signs a secure **JWT token** (`POST /api/auth/login`).
3. The JWT token is saved in client `localStorage` and sent automatically in the `Authorization: Bearer <token>` header on all protected API requests.
4. Protected API endpoints (`GET /api/orders`, `PATCH /api/orders/:id/status`, `GET /api/contact`) reject unauthorized requests with `401 Unauthorized`.
5. Clicking **Log Out** in the dashboard destroys the token and returns to `/admin/login`.

---

## 📄 Services Included (13 Categories)

1. **Managed IT Services**
2. **Software Development**
3. **Cloud Services**
4. **Cybersecurity Services**
5. **IT Consulting**
6. **Export Services**
7. **Import Services**
8. **Search Engine Optimization (SEO)**
9. **Social Media Marketing**
10. **Pay-Per-Click Advertising (PPC)**
11. **Content Marketing**
12. **Website Design & Development**
13. **Email Marketing**
