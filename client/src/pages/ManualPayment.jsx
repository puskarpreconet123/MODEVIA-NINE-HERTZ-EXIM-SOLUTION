import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  RefreshCw, 
  Info, 
  Download, 
  Edit3 
} from 'lucide-react';
import { 
  GooglePayIcon, 
  PhonePeIcon, 
  PaytmIcon, 
  BhimIcon, 
  CredIcon, 
  UpiLogoIcon 
} from '../components/UpiIcons';

const UPI_ID = 'abhijithalde363996.aps@sbi';
const PAYEE_NAME = 'MODEVIA NINE HERTZ EXIM SOLUTION';

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

export default function ManualPayment() {
  const [amount, setAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentStep, setPaymentStep] = useState(1); // 1 = Enter amount, 2 = Pay options, 3 = Receipt
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState('apps'); // 'apps' | 'qr'
  
  // UTR / Confirmation State
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');
  const [confirmedTime, setConfirmedTime] = useState(null);

  // Clean numerical amount
  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const formattedAmount = isValidAmount ? parsedAmount.toFixed(2) : '0.00';

  // Construct Standard UPI Intent URI
  // upi://pay?pa=<upi_id>&pn=<payee_name>&am=<amount>&cu=INR&tn=<note>
  const noteParam = paymentNote.trim() 
    ? encodeURIComponent(paymentNote.trim()) 
    : encodeURIComponent(`Payment from ${payerName.trim() || 'Customer'}`);
  
  const upiIntentUri = isValidAmount
    ? `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${formattedAmount}&cu=INR&tn=${noteParam}`
    : `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&cu=INR&tn=${noteParam}`;

  // Direct app URIs
  const gpayUri = `gpay://upi/pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${formattedAmount}&cu=INR&tn=${noteParam}`;
  const phonepeUri = `phonepe://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${formattedAmount}&cu=INR&tn=${noteParam}`;
  const paytmUri = `paytmmp://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${formattedAmount}&cu=INR&tn=${noteParam}`;
  const bhimUri = `bhim://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${formattedAmount}&cu=INR&tn=${noteParam}`;
  const credUri = `cred://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${formattedAmount}&cu=INR&tn=${noteParam}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiIntentUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleProceedToPay = (e) => {
    e.preventDefault();
    if (isValidAmount) {
      setPaymentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // If on mobile device, trigger generic UPI intent automatically
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = upiIntentUri;
      }
    }
  };

  const handleReset = () => {
    setPaymentStep(1);
    setAmount('');
    setPayerName('');
    setPaymentNote('');
    setUtrNumber('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmUTR = (e) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      setUtrError('Please enter the 12-digit UPI reference number (UTR).');
      return;
    }
    if (cleanUtr.length < 6) {
      setUtrError('UTR number must be at least 6 digits (usually 12 digits).');
      return;
    }
    setUtrError('');
    setConfirmedTime(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    setPaymentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-secondary/30 via-background to-background py-5 sm:py-10">
      <div className="w-full max-w-lg mx-auto px-3 sm:px-4">
        
        {/* Top Header & Security Badge */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Home</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 text-[11px] sm:text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span>Verified SBI UPI Merchant</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* STEP 3: PAYMENT CONFIRMED / RECEIPT VIEW                       */}
        {/* ============================================================== */}
        {paymentStep === 3 && (
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-lg text-center animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Payment Recorded
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Direct UPI transfer acknowledgement receipt
            </p>

            {/* Receipt Details Card */}
            <div className="mt-5 rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-left text-xs sm:text-sm space-y-2.5">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Payee</span>
                <span className="font-semibold text-foreground text-right">{PAYEE_NAME}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">UPI ID</span>
                <span className="font-mono font-medium text-foreground text-right">{UPI_ID}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-base sm:text-lg font-bold text-emerald-600">₹{formattedAmount}</span>
              </div>
              {payerName.trim() && (
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Payer</span>
                  <span className="font-medium text-foreground text-right">{payerName.trim()}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground">UTR / Ref #</span>
                <span className="font-mono font-bold text-foreground bg-card px-2 py-0.5 rounded border border-border">
                  {utrNumber}
                </span>
              </div>
              <div className="flex justify-between items-center pt-0.5 text-[11px] text-muted-foreground">
                <span>Date & Time</span>
                <span>{confirmedTime || 'Just now'}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" /> Print / Save Slip
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                <RefreshCw className="h-4 w-4" /> New Payment
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: ENTER AMOUNT & DETAILS                                 */}
        {/* ============================================================== */}
        {paymentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            {/* Payee Info Header Card */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-lg">
                  ₹
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">
                    Direct UPI Payment
                  </h1>
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                    {PAYEE_NAME}
                  </p>
                </div>
              </div>

              {/* UPI ID Pill with 1-tap copy */}
              <div className="mt-3.5 flex items-center justify-between rounded-xl bg-muted/60 p-2.5 sm:p-3 border border-border/80">
                <div className="min-w-0 pr-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    UPI VPA
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-foreground break-all">
                    {UPI_ID}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm border border-border"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Amount Form Card */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
              <form onSubmit={handleProceedToPay} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Enter Amount to Pay *
                  </label>
                  <div className="relative rounded-xl border-2 border-input focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all bg-background">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-foreground/70 font-bold text-2xl">
                      ₹
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="block w-full rounded-xl bg-transparent py-3 pl-9 pr-3 text-2xl sm:text-3xl font-extrabold text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Amount Selector Chips */}
                <div>
                  <div className="text-[11px] font-medium text-muted-foreground mb-1.5">
                    Popular amounts:
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {QUICK_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt.toString())}
                        className={`rounded-lg py-2 px-1 text-xs font-semibold transition-all border text-center ${
                          amount === amt.toString()
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-secondary/60 text-secondary-foreground border-border/80 hover:bg-secondary'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Details */}
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Your Name <span className="text-[10px] text-muted-foreground/70">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Payment Note / Purpose <span className="text-[10px] text-muted-foreground/70">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Service payment"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isValidAmount}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white py-3.5 px-4 text-base font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Zap className="h-5 w-5 fill-current" />
                  <span>Proceed to Pay {isValidAmount ? `₹${formattedAmount}` : ''}</span>
                </button>
              </form>
            </div>

            {/* Safe & Direct Note */}
            <div className="rounded-xl bg-secondary/40 border border-border p-3 text-[11px] text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>Direct SBI merchant account payment. No extra transaction charges.</span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: PAY VIA APP / SCAN QR                                  */}
        {/* ============================================================== */}
        {paymentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Amount Summary Header Bar with Edit Button */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Total Payable
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  ₹{formattedAmount}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentStep(1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Change</span>
              </button>
            </div>

            {/* Mode Switcher Segmented Tabs (Full Width, No Cramping) */}
            <div className="rounded-xl border border-border bg-muted/70 p-1 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('apps')}
                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'apps'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Pay by App</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'qr'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <QrCode className="h-4 w-4 shrink-0 text-primary" />
                <span>Scan QR</span>
              </button>
            </div>

            {/* TAB CONTENT: PAY BY APP */}
            {activeTab === 'apps' && (
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
                
                {/* Master 1-Tap Generic UPI Intent Button */}
                <a
                  href={upiIntentUri}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-3.5 px-4 text-base shadow-lg shadow-emerald-600/25 transition-all text-center"
                >
                  <Zap className="h-5 w-5 fill-current shrink-0" />
                  <span>Pay ₹{formattedAmount} with Any UPI App</span>
                </a>

                <p className="text-center text-[11px] text-muted-foreground">
                  Tap above to auto-launch your installed UPI app (Android & iOS)
                </p>

                {/* Direct App Grid (Clean 2-Column Responsive Grid) */}
                <div className="pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5 text-center">
                    Or select your UPI app:
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Google Pay */}
                    <a
                      href={gpayUri}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-background hover:bg-secondary/40 hover:border-primary/40 active:scale-[0.98] transition-all font-semibold text-xs shadow-sm group"
                    >
                      <GooglePayIcon className="w-7 h-7 shrink-0" />
                      <span className="truncate text-foreground group-hover:text-primary">Google Pay</span>
                    </a>

                    {/* PhonePe */}
                    <a
                      href={phonepeUri}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-background hover:bg-secondary/40 hover:border-primary/40 active:scale-[0.98] transition-all font-semibold text-xs shadow-sm group"
                    >
                      <PhonePeIcon className="w-7 h-7 shrink-0" />
                      <span className="truncate text-foreground group-hover:text-primary">PhonePe</span>
                    </a>

                    {/* Paytm */}
                    <a
                      href={paytmUri}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-background hover:bg-secondary/40 hover:border-primary/40 active:scale-[0.98] transition-all font-semibold text-xs shadow-sm group"
                    >
                      <PaytmIcon className="w-7 h-7 shrink-0" />
                      <span className="truncate text-foreground group-hover:text-primary">Paytm</span>
                    </a>

                    {/* BHIM UPI */}
                    <a
                      href={bhimUri}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-background hover:bg-secondary/40 hover:border-primary/40 active:scale-[0.98] transition-all font-semibold text-xs shadow-sm group"
                    >
                      <BhimIcon className="w-7 h-7 shrink-0" />
                      <span className="truncate text-foreground group-hover:text-primary">BHIM UPI</span>
                    </a>

                    {/* CRED */}
                    <a
                      href={credUri}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-background hover:bg-secondary/40 hover:border-primary/40 active:scale-[0.98] transition-all font-semibold text-xs shadow-sm group"
                    >
                      <CredIcon className="w-7 h-7 shrink-0" />
                      <span className="truncate text-foreground group-hover:text-primary">CRED</span>
                    </a>

                    {/* YONO / Bank Apps */}
                    <a
                      href={upiIntentUri}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-background hover:bg-secondary/40 hover:border-primary/40 active:scale-[0.98] transition-all font-semibold text-xs shadow-sm group"
                    >
                      <UpiLogoIcon className="w-7 h-7 shrink-0" />
                      <span className="truncate text-foreground group-hover:text-primary">Any UPI App</span>
                    </a>
                  </div>
                </div>

                {/* Copy Deep-Link button */}
                <div className="pt-1 flex justify-center">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy UPI Intent Deep-Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SCAN QR */}
            {activeTab === 'qr' && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm text-center">
                <div className="p-3 sm:p-4 bg-white rounded-2xl shadow-inner border border-slate-100 inline-block">
                  <QRCodeSVG
                    value={upiIntentUri}
                    size={190}
                    level="M"
                    includeMargin={false}
                    fgColor="#0f172a"
                  />
                </div>

                <div className="mt-3">
                  <div className="text-base font-bold text-foreground">
                    Scan to Pay ₹{formattedAmount}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs mx-auto">
                    Scan with Google Pay, PhonePe, Paytm, or BHIM scanner
                  </p>
                </div>

                <div className="mt-3 inline-flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg border border-border text-xs">
                  <span className="text-muted-foreground">UPI:</span>
                  <span className="font-mono font-bold text-foreground text-[11px] sm:text-xs">{UPI_ID}</span>
                </div>
              </div>
            )}

            {/* Step 3: Enter UTR Confirmation Box */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                  ✓
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground">
                  Already paid in your UPI app?
                </h3>
              </div>

              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                Enter your 12-digit UPI Reference Number / UTR from your bank SMS or app to get your receipt.
              </p>

              <form onSubmit={handleConfirmUTR} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter 12-digit UPI Ref / UTR"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value.replace(/\s+/g, ''));
                      if (utrError) setUtrError('');
                    }}
                    className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-2.5 px-5 text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                    <span className="text-white font-bold">Verify & Get Slip</span>
                  </button>
                </div>
                {utrError && (
                  <p className="text-xs text-rose-500 font-medium animate-fade-in">
                    {utrError}
                  </p>
                )}
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
