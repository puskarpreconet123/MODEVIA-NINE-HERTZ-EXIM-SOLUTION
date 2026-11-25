const crypto = require('crypto');
const axios = require('axios');

// In-memory cache for OAuth token
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Get Airpay Encryption Key:
 * 1. AIRPAY_SECRET_KEY (if 32 chars)
 * 2. AIRPAY_API_KEY (if 32 chars)
 * 3. md5(username . "~:~" . password) (standard Airpay derivation)
 */
function getEncryptionKey() {
  if (process.env.AIRPAY_SECRET_KEY && process.env.AIRPAY_SECRET_KEY.length === 32) {
    return process.env.AIRPAY_SECRET_KEY;
  }
  if (process.env.AIRPAY_API_KEY && process.env.AIRPAY_API_KEY.length === 32) {
    return process.env.AIRPAY_API_KEY;
  }
  const username = process.env.AIRPAY_USERNAME || '';
  const password = process.env.AIRPAY_PASSWORD || '';
  return crypto.createHash('md5').update(`${username}~:~${password}`).digest('hex');
}

/**
 * Generate Private Key:
 * hash('sha256', secret . '@' . username . ':|:' . password)
 * (Uses AIRPAY_SECRET or AIRPAY_API_KEY)
 */
function getPrivateKey() {
  const secret = process.env.AIRPAY_SECRET || process.env.AIRPAY_API_KEY || '';
  const username = process.env.AIRPAY_USERNAME || '';
  const password = process.env.AIRPAY_PASSWORD || '';
  return crypto.createHash('sha256').update(`${secret}@${username}:|:${password}`).digest('hex');
}

/**
 * Airpay Checksum function:
 * function checksum($data) {
 *     ksort($data);
 *     $checksumdata = '';
 *     foreach ($data as $key => $value) {
 *         $checksumdata .= $value;
 *     }
 *     return hash('SHA256', $checksumdata.date('Y-m-d'));
 * }
 */
function checksum(dataObject) {
  const sortedKeys = Object.keys(dataObject).sort();
  let checksumdata = '';
  for (const key of sortedKeys) {
    if (dataObject[key] !== undefined && dataObject[key] !== null) {
      checksumdata += String(dataObject[key]);
    }
  }
  const dateStr = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(checksumdata + dateStr).digest('hex');
}

/**
 * Airpay Encryption function:
 * function encrypt($data, $encryptionkey) {
 *     $iv = bin2hex(openssl_random_pseudo_bytes(8));
 *     $raw = openssl_encrypt($data, 'AES-256-CBC', $encryptionkey, OPENSSL_RAW_DATA, $iv);
 *     $encryptedata = $iv . base64_encode($raw);
 *     return $encryptedata;
 * }
 */
function encrypt(dataString, encryptionKey) {
  const key = encryptionKey || getEncryptionKey();
  const iv = crypto.randomBytes(8).toString('hex'); // 16-char hex string
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'));
  const raw = Buffer.concat([cipher.update(dataString, 'utf8'), cipher.final()]);
  return iv + raw.toString('base64');
}

/**
 * Airpay Decryption function:
 * function decrypt($response, $secretKey)
 */
function decrypt(encdata, encryptionKey) {
  const key = encryptionKey || getEncryptionKey();
  const iv = encdata.substring(0, 16);
  const raw = Buffer.from(encdata.substring(16), 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'));
  const decrypted = Buffer.concat([decipher.update(raw), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Helper to extract descriptive error details from Axios errors (network, timeout, DNS, HTTP error)
 */
function formatAxiosError(err) {
  if (err.response) {
    const dataPreview = typeof err.response.data === 'string'
      ? err.response.data.slice(0, 300)
      : JSON.stringify(err.response.data);
    return `HTTP ${err.response.status} ${err.response.statusText || ''} | Response: ${dataPreview}`;
  } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return `Network Timeout (10s exceeded) - Airpay server took too long to respond`;
  } else if (err.code === 'ENOTFOUND') {
    return `DNS Resolution Failed - cannot resolve hostname (${err.hostname || 'Airpay domain'})`;
  } else if (err.code === 'ECONNREFUSED') {
    return `Connection Refused - host rejected connection`;
  } else if (err.request) {
    return `Network Error: ${err.code || 'NO_RESPONSE'} (${err.message})`;
  }
  return `Error: ${err.message}`;
}

/**
 * Airpay OAuth2 Flow:
 * Fetches an access token from https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/
 */
async function getAirpayAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    console.log(`[Airpay OAuth] Using cached token: ${cachedToken.substring(0, 8)}... (valid for ${Math.round((tokenExpiry - Date.now()) / 1000)}s)`);
    return cachedToken;
  }

  const merchantId = process.env.AIRPAY_MERCHANT_ID || '';
  const clientId = process.env.AIRPAY_CLIENT_ID || '';
  const clientSecret = process.env.AIRPAY_CLIENT_SECRET || '';
  const secretKey = getEncryptionKey();
  const oauthUrl = process.env.AIRPAY_OAUTH_URL || 'https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/';

  console.log(`[Airpay OAuth] Requesting fresh token from ${oauthUrl} (Merchant: ${merchantId}, Client: ${clientId})`);

  const data = {
    client_id: clientId,
    client_secret: clientSecret,
    merchant_id: merchantId,
    grant_type: 'client_credentials'
  };

  const encdata = encrypt(JSON.stringify(data), secretKey);
  const check = checksum(data);

  const payload = {
    merchant_id: merchantId,
    encdata: encdata,
    checksum: check
  };

  try {
    const res = await axios.post(
      oauthUrl,
      new URLSearchParams(payload).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      }
    );

    const encryptedResponse = res.data?.response || res.data;
    if (typeof encryptedResponse === 'string') {
      const decryptedStr = decrypt(encryptedResponse, secretKey);
      const tokenData = JSON.parse(decryptedStr);
      cachedToken = tokenData.data?.access_token || tokenData.access_token || tokenData.token;
      const expiresInSec = tokenData.data?.expires_in || tokenData.expires_in || 360;
      tokenExpiry = Date.now() + expiresInSec * 1000;
      console.log(`[Airpay OAuth] ✅ Token received successfully: ${cachedToken.substring(0, 10)}... (expires in ${expiresInSec}s)`);
      return cachedToken;
    } else if (res.data?.access_token) {
      cachedToken = res.data.access_token;
      console.log(`[Airpay OAuth] ✅ Token received (plaintext): ${cachedToken.substring(0, 10)}...`);
      return cachedToken;
    }
    console.warn('[Airpay OAuth] ⚠️ Unexpected response format:', res.data);
    return process.env.AIRPAY_ACCESS_TOKEN || '';
  } catch (err) {
    console.error('[Airpay OAuth] ❌ Failed to get access token:', formatAxiosError(err));
    return process.env.AIRPAY_ACCESS_TOKEN || '';
  }
}

/**
 * Get Base64 encoded merchant domain for Airpay mer_dom validation
 */
function getMerchantDomainBase64() {
  const domain = process.env.AIRPAY_MERCHANT_DOMAIN || process.env.CLIENT_URL || 'https://www.modevianinehertz.in/';
  return Buffer.from(domain.trim()).toString('base64');
}

/**
 * Split Full Name into First and Last Name
 */
function splitName(fullName) {
  const parts = (fullName || 'Customer').trim().split(/\s+/);
  const firstName = parts[0] || 'Customer';
  const lastName = parts.slice(1).join(' ') || 'User';
  return { firstName, lastName };
}

/**
 * Create Airpay Seamless Order
 */
async function initiateAirpayOrder({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  customerCity,
  customerState,
  customerCountry,
  customerPincode,
  bankCode,
  channel
}) {
  const merchantId = process.env.AIRPAY_MERCHANT_ID || '';
  const secretKey = getEncryptionKey();
  const seamlessBaseUrl = process.env.AIRPAY_SEAMLESS_URL || 'https://kraken.airpay.co.in/airpay/pay/v4/api/seamless/';
  const { firstName, lastName } = splitName(customerName);

  const numericAmount = parseFloat(String(amount).replace(/[^\d.]/g, '') || '0').toFixed(2);

  const data = {
    buyer_email: customerEmail || 'customer@example.com',
    buyer_phone: String(customerPhone || '9999999999').replace(/[^\d]/g, '').slice(-10),
    buyer_firstname: firstName,
    buyer_lastname: lastName,
    buyer_address: customerAddress || process.env.AIRPAY_DEFAULT_BUYER_ADDRESS || '',
    buyer_city: customerCity || process.env.AIRPAY_DEFAULT_BUYER_CITY || '',
    buyer_state: customerState || process.env.AIRPAY_DEFAULT_BUYER_STATE || '',
    buyer_country: customerCountry || process.env.AIRPAY_DEFAULT_BUYER_COUNTRY || 'India',
    buyer_pincode: customerPincode || process.env.AIRPAY_DEFAULT_BUYER_PINCODE || '',
    orderid: orderId,
    amount: numericAmount,
    currency: '356',
    isocurrency: 'INR',
    currency_code: '356',
    iso_currency: 'INR',
    mer_dom: getMerchantDomainBase64()
  };

  // Only filter chmod if explicitly set (e.g., 'upi', 'card', 'netbanking');
  // Omit when unset or 'all' so Airpay displays ALL channels: Cards, Net Banking, UPI, Wallets
  if (process.env.AIRPAY_CHMOD && process.env.AIRPAY_CHMOD.trim() && process.env.AIRPAY_CHMOD.trim() !== 'all') {
    data.chmod = process.env.AIRPAY_CHMOD.trim();
  }

  if (channel && channel !== 'pg') {
    data.channel = channel;
  }
  if (bankCode && bankCode !== 'XYZ') {
    data.bank_code = bankCode;
  }

  const encdata = encrypt(JSON.stringify(data), secretKey);
  const check = checksum(data);
  const privatekey = getPrivateKey();

  const payload = {
    merchant_id: merchantId,
    encdata: encdata,
    checksum: check,
    privatekey: privatekey,
    mer_dom: getMerchantDomainBase64()
  };

  // Get OAuth token automatically
  const token = await getAirpayAccessToken();
  const endpoint = token ? `${seamlessBaseUrl}?token=${encodeURIComponent(token)}` : seamlessBaseUrl;

  console.log(`[Airpay Seamless] Sending order ${orderId} (₹${numericAmount}) to ${endpoint}`);

  try {
    const response = await axios.post(
      endpoint,
      new URLSearchParams(payload).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      }
    );

    let decryptedResponse = response.data;
    if (typeof response.data === 'string' && response.data.includes('<RESPONSE>')) {
      const msgMatch = response.data.match(/<MESSAGE><!\[CDATA\[(.*?)\]\]><\/MESSAGE>/i) || response.data.match(/<MESSAGE>(.*?)<\/MESSAGE>/i);
      const statusMatch = response.data.match(/<TRANSACTIONSTATUS><!\[CDATA\[(.*?)\]\]><\/TRANSACTIONSTATUS>/i) || response.data.match(/<TRANSACTIONSTATUS>(.*?)<\/TRANSACTIONSTATUS>/i);
      const message = msgMatch?.[1] || 'Airpay response received';
      const isSuccess = statusMatch?.[1] === '200';
      decryptedResponse = {
        status: isSuccess ? 'success' : 'fail',
        message: message,
        statusCode: statusMatch?.[1] || null,
        rawXml: response.data
      };

      if (isSuccess) {
        console.log(`[Airpay Seamless] ✅ Order ${orderId} initiated successfully.`);
      } else {
        console.warn(`[Airpay Seamless] ⚠️ Airpay Gateway Notice for ${orderId}: "${message}" (Status Code: ${statusMatch?.[1] || 'N/A'})`);
        if (/domain/i.test(message)) {
          console.warn(`[Airpay Seamless] 🛑 DOMAIN MISMATCH: Airpay rejected domain "${process.env.AIRPAY_MERCHANT_DOMAIN || process.env.CLIENT_URL}". Ensure this domain is whitelisted in your Airpay Merchant Dashboard.`);
        } else if (/checksum/i.test(message)) {
          console.warn(`[Airpay Seamless] 🛑 CHECKSUM ERROR: Airpay rejected checksum calculation.`);
        }
      }
    } else if (response.data?.response && typeof response.data.response === 'string') {
      try {
        decryptedResponse = JSON.parse(decrypt(response.data.response, secretKey));
        console.log(`[Airpay Seamless] Decrypted JSON response for ${orderId}:`, decryptedResponse);
      } catch (e) {
        decryptedResponse = response.data.response;
        console.log(`[Airpay Seamless] Response for ${orderId}:`, decryptedResponse);
      }
    } else {
      console.log(`[Airpay Seamless] Direct response for ${orderId}:`, response.data);
    }

    return {
      success: true,
      data: decryptedResponse,
      raw: response.data,
      payloadSent: {
        merchant_id: merchantId,
        orderid: orderId,
        amount: numericAmount,
        checksum: check
      }
    };
  } catch (error) {
    const errorDetails = formatAxiosError(error);
    console.error(`[Airpay Seamless] ❌ Network/Gateway Error for ${orderId}: ${errorDetails}`);
    return {
      success: false,
      error: errorDetails,
      payloadSent: {
        merchant_id: merchantId,
        orderid: orderId,
        amount: numericAmount,
        checksum: check
      }
    };
  }
}

/**
 * Prepare Airpay Hosted Payment Payload:
 * Returns the exact form action and hidden fields to redirect the browser to Airpay's hosted checkout.
 */
async function prepareAirpayHostedPayload({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  customerCity,
  customerState,
  customerCountry,
  customerPincode,
  channel,
  bankCode
}) {
  const merchantId = process.env.AIRPAY_MERCHANT_ID || '';
  const secretKey = getEncryptionKey();
  const hostedUrl = process.env.AIRPAY_HOSTED_URL || 'https://payments.airpay.co.in/pay/v4/';
  const { firstName, lastName } = splitName(customerName);
  const numericAmount = parseFloat(String(amount).replace(/[^\d.]/g, '') || '0').toFixed(2);
  const merDomBase64 = getMerchantDomainBase64();
  const domainText = process.env.AIRPAY_MERCHANT_DOMAIN || process.env.CLIENT_URL || 'https://www.modevianinehertz.in/';

  console.log(`[Airpay Hosted] Preparing checkout form for order ${orderId} (₹${numericAmount})`);
  console.log(`[Airpay Hosted] Merchant: ${merchantId} | Domain: "${domainText}" (Base64: ${merDomBase64})`);

  const data = {
    buyer_email: customerEmail || 'customer@example.com',
    buyer_phone: String(customerPhone || '9999999999').replace(/[^\d]/g, '').slice(-10),
    buyer_firstname: firstName,
    buyer_lastname: lastName,
    buyer_address: customerAddress || process.env.AIRPAY_DEFAULT_BUYER_ADDRESS || '',
    buyer_city: customerCity || process.env.AIRPAY_DEFAULT_BUYER_CITY || '',
    buyer_state: customerState || process.env.AIRPAY_DEFAULT_BUYER_STATE || '',
    buyer_country: customerCountry || process.env.AIRPAY_DEFAULT_BUYER_COUNTRY || 'India',
    buyer_pincode: customerPincode || process.env.AIRPAY_DEFAULT_BUYER_PINCODE || '',
    orderid: orderId,
    amount: numericAmount,
    currency: '356',
    isocurrency: 'INR',
    currency_code: '356',
    iso_currency: 'INR',
    mer_dom: merDomBase64
  };

  // Only filter chmod if explicitly set (e.g., 'upi', 'card', 'netbanking');
  // Omit when unset or 'all' so Airpay displays ALL channels: Cards, Net Banking, UPI, Wallets
  if (process.env.AIRPAY_CHMOD && process.env.AIRPAY_CHMOD.trim() && process.env.AIRPAY_CHMOD.trim() !== 'all') {
    data.chmod = process.env.AIRPAY_CHMOD.trim();
  }

  if (channel && channel !== 'pg') {
    data.channel = channel;
  }
  if (bankCode && bankCode !== 'XYZ') {
    data.bank_code = bankCode;
  }

  const encdata = encrypt(JSON.stringify(data), secretKey);
  const check = checksum(data);
  const privatekey = getPrivateKey();
  const token = await getAirpayAccessToken();
  const actionUrl = token ? `${hostedUrl}?token=${encodeURIComponent(token)}` : hostedUrl;

  console.log(`[Airpay Hosted] ✅ Form payload ready. Action URL: ${actionUrl}`);

  return {
    actionUrl,
    token,
    fields: {
      merchant_id: merchantId,
      encdata: encdata,
      checksum: check,
      privatekey: privatekey,
      mer_dom: merDomBase64
    }
  };
}

module.exports = {
  checksum,
  encrypt,
  decrypt,
  getPrivateKey,
  getEncryptionKey,
  getAirpayAccessToken,
  initiateAirpayOrder,
  prepareAirpayHostedPayload
};
