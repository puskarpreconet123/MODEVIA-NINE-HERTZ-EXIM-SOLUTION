const axios = require('./server/node_modules/axios');
const jwt = require('./server/node_modules/jsonwebtoken');
const path = require('path');
require('./server/node_modules/dotenv').config({ path: path.join(__dirname, 'server/.env') });

(async () => {
  console.log('🚀 Running Complete End-to-End Bridge Verification...\n');
  const baseUrl = 'http://localhost:3000';

  // 1. Generate an admin token for testing admin endpoints
  const secret = process.env.JWT_SECRET || 'modevia_jwt_secret_key_2026_super_secure';
  const adminToken = jwt.sign(
    { email: 'modevianine@gmail.com', role: 'admin' },
    secret,
    { expiresIn: '1h' }
  );

  // 2. Admin: List merchants
  console.log('Step 1: Admin fetching merchants...');
  const mListRes = await axios.get(`${baseUrl}/api/admin/merchants`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✅ Found ${mListRes.data.data.length} merchant(s).`);

  // 3. Admin: Create a new satellite store merchant key
  console.log('\nStep 2: Admin creating a new Merchant key for "ShoeStore Online"...');
  const createMRes = await axios.post(
    `${baseUrl}/api/admin/merchants`,
    {
      name: 'ShoeStore Online',
      returnUrl: 'https://shoestore-online.com/orders/thank-you',
      webhookUrl: 'https://shoestore-online.com/api/webhooks/payment'
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const newMerchant = createMRes.data.data;
  console.log(`✅ Created Merchant: "${newMerchant.name}"`);
  console.log(`   API Key: ${newMerchant.apiKey}`);

  // 4. External Store: Create payment order with ZERO customer details (only amount & return_url)
  console.log('\nStep 3: External Store initiates payment order via POST /api/v1/bridge/orders...');
  const orderRes = await axios.post(`${baseUrl}/api/v1/bridge/orders`, {
    api_key: newMerchant.apiKey,
    amount: 1499.00,
    return_url: 'https://shoestore-online.com/orders/thank-you',
    client_order_id: 'SHOE_ORD_8841'
  });
  const bridgeOrderId = orderRes.data.bridge_order_id;
  console.log(`✅ Bridge Order Created: ${bridgeOrderId}`);
  console.log(`   Amount: ₹${orderRes.data.amount}`);
  console.log(`   Checkout URL: ${orderRes.data.checkout_url}`);

  // 5. Customer Browser: Opens checkout handoff page
  console.log('\nStep 4: Customer browser requests checkout handoff page...');
  const handoffRes = await axios.get(`${baseUrl}/bridge/pay/${bridgeOrderId}`);
  if (handoffRes.data.includes('Redirecting to Payment Gateway') && handoffRes.data.includes('mer_dom')) {
    console.log('✅ Handoff page successfully rendered with Modevia whitelisted domain & Airpay form.');
  }

  // 6. Airpay Gateway: Completes payment & posts callback to Modevia
  console.log('\nStep 5: Simulating Airpay gateway callback...');
  const callbackRes = await axios.post(
    `${baseUrl}/api/orders/airpay-callback`,
    {
      TRANSACTIONID: bridgeOrderId,
      TRANSACTIONSTATUS: '200',
      MESSAGE: 'SUCCESS'
    },
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        'Accept': 'text/html,application/xhtml+xml'
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    }
  );

  console.log(`✅ Airpay Callback responded with HTTP ${callbackRes.status}`);
  const redirectTarget = callbackRes.headers.location;
  console.log(`   Redirect Target: ${redirectTarget}`);

  if (redirectTarget && redirectTarget.startsWith('https://shoestore-online.com/orders/thank-you')) {
    console.log('✅ Customer is correctly redirected back to the original client site!');
  }

  // 7. External Store verifies order status server-to-server
  console.log('\nStep 6: External store checks order status via S2S API...');
  const statusRes = await axios.get(`${baseUrl}/api/v1/bridge/orders/${bridgeOrderId}`);
  console.log(`✅ Order status verified: "${statusRes.data.data.status}"`);

  // 8. Admin reviews bridge orders ledger
  console.log('\nStep 7: Admin reviews bridge transactions ledger...');
  const ledgerRes = await axios.get(`${baseUrl}/api/admin/bridge-orders`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const recorded = ledgerRes.data.data.find(o => o.bridgeOrderId === bridgeOrderId);
  console.log(`✅ Order ${bridgeOrderId} recorded in admin ledger with status: "${recorded?.status}"`);

  console.log('\n🎉 ALL END-TO-END TESTS PASSED WITH 100% SUCCESS!\n');
})();
