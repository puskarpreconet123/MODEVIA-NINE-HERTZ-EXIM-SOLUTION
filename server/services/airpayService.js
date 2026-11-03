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
 * Airpay OAuth2 Flow:
 * Fetches an access token from https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/
 */
async function getAirpayAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const merchantId = process.env.AIRPAY_MERCHANT_ID || '';
  const clientId = process.env.AIRPAY_CLIENT_ID || '';
  const clientSecret = process.env.AIRPAY_CLIENT_SECRET || '';
  const secretKey = getEncryptionKey();
  const oauthUrl = process.env.AIRPAY_OAUTH_URL || 'https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/';

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
      cachedToken = tokenData.access_token || tokenData.token;
      const expiresInSec = tokenData.expires_in || 3600;
      tokenExpiry = Date.now() + expiresInSec * 1000;
      return cachedToken;
    } else if (res.data?.access_token) {
      cachedToken = res.data.access_token;
      return cachedToken;
    }
    return process.env.AIRPAY_ACCESS_TOKEN || '';
  } catch (err) {
    console.warn('Airpay OAuth2 notice:', err.response?.data || err.message);
    return process.env.AIRPAY_ACCESS_TOKEN || '';
  }
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
    buyer_address: customerAddress || process.env.AIRPAY_DEFAULT_BUYER_ADDRESS || 'Holding No-516, RN Guha Road, Sagnik Plaza',
    buyer_city: customerCity || process.env.AIRPAY_DEFAULT_BUYER_CITY || 'Kolkata',
    buyer_state: customerState || process.env.AIRPAY_DEFAULT_BUYER_STATE || 'West Bengal',
    buyer_country: customerCountry || process.env.AIRPAY_DEFAULT_BUYER_COUNTRY || 'India',
    buyer_pincode: customerPincode || process.env.AIRPAY_DEFAULT_BUYER_PINCODE || '700074',
    orderid: orderId,
    amount: numericAmount,
    channel: channel || process.env.AIRPAY_CHANNEL || 'pg',
    bank_code: bankCode || 'XYZ'
  };

  const encdata = encrypt(JSON.stringify(data), secretKey);
  const check = checksum(data);
  const privatekey = getPrivateKey();

  const payload = {
    merchant_id: merchantId,
    encdata: encdata,
    checksum: check,
    privatekey: privatekey
  };

  // Get OAuth token automatically
  const token = await getAirpayAccessToken();
  const endpoint = token ? `${seamlessBaseUrl}?token=${encodeURIComponent(token)}` : seamlessBaseUrl;

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
    if (response.data?.response && typeof response.data.response === 'string') {
      try {
        decryptedResponse = JSON.parse(decrypt(response.data.response, secretKey));
      } catch (e) {
        decryptedResponse = response.data.response;
      }
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
    const errorMsg = error.response?.data || error.message;
    console.warn('Airpay Seamless API notice:', errorMsg);
    return {
      success: false,
      error: errorMsg,
      payloadSent: {
        merchant_id: merchantId,
        orderid: orderId,
        amount: numericAmount,
        checksum: check
      }
    };
  }
}

module.exports = {
  checksum,
  encrypt,
  decrypt,
  getPrivateKey,
  getEncryptionKey,
  getAirpayAccessToken,
  initiateAirpayOrder
};
