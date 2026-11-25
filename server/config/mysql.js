const mysql = require('mysql2/promise');

let pool = null;
let isConnected = false;

const initMySQL = async () => {
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE;
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);

  if (!user || !database) {
    console.log('ℹ️  MySQL credentials not provided in .env. Skipping MySQL initialization.');
    return false;
  }

  // MilesWeb connection candidates:
  // 1. Unix Socket (MilesWeb default: /run/mysqld/mysqld.sock)
  // 2. MilesWeb internal TCP (10.169.2.148 or process.env.MYSQL_HOST)
  // 3. Fallback TCP (127.0.0.1)
  const configsToTry = [];

  const socketPath = process.env.MYSQL_SOCKET || '/run/mysqld/mysqld.sock';
  configsToTry.push({
    name: `Unix Socket (${socketPath})`,
    config: { socketPath, user, password, database }
  });

  const tcpHost = process.env.MYSQL_HOST && process.env.MYSQL_HOST !== 'localhost'
    ? process.env.MYSQL_HOST
    : '10.169.2.148';
  configsToTry.push({
    name: `TCP (${tcpHost}:${port})`,
    config: { host: tcpHost, port, user, password, database }
  });

  if (tcpHost !== '127.0.0.1') {
    configsToTry.push({
      name: `TCP Loopback (127.0.0.1:${port})`,
      config: { host: '127.0.0.1', port, user, password, database }
    });
  }

  let lastError = null;

  for (const item of configsToTry) {
    try {
      pool = mysql.createPool({
        ...item.config,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // Test connection
      const connection = await pool.getConnection();
      isConnected = true;
      console.log(`✅ Server Database Connected (cPanel MariaDB/MySQL) via ${item.name} -> ${user}@${database}`);

      // Auto-create orders table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          orderId VARCHAR(100) UNIQUE NOT NULL,
          clientId VARCHAR(100),
          customerName VARCHAR(255),
          customerEmail VARCHAR(255),
          customerPhone VARCHAR(50),
          serviceId VARCHAR(100),
          serviceTitle VARCHAR(255),
          planName VARCHAR(100),
          amount DECIMAL(10,2),
          currency VARCHAR(10) DEFAULT 'INR',
          status VARCHAR(50) DEFAULT 'pending',
          qrString TEXT,
          payeeVPA VARCHAR(100),
          gatewayResponse LONGTEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Auto-create contacts table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS contacts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          message TEXT,
          status VARCHAR(50) DEFAULT 'new',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Auto-create merchants table for API Bridge
      await connection.query(`
        CREATE TABLE IF NOT EXISTS merchants (
          id INT AUTO_INCREMENT PRIMARY KEY,
          merchantId VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          apiKey VARCHAR(100) UNIQUE NOT NULL,
          webhookUrl VARCHAR(500),
          returnUrl VARCHAR(500),
          isActive TINYINT(1) DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Auto-create bridge_orders table for API Bridge
      await connection.query(`
        CREATE TABLE IF NOT EXISTS bridge_orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          bridgeOrderId VARCHAR(100) UNIQUE NOT NULL,
          merchantId VARCHAR(100) NOT NULL,
          clientOrderId VARCHAR(100),
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'INR',
          customerName VARCHAR(255),
          customerEmail VARCHAR(255),
          customerPhone VARCHAR(50),
          returnUrl VARCHAR(1000) NOT NULL,
          webhookUrl VARCHAR(1000),
          status VARCHAR(50) DEFAULT 'pending',
          gatewayResponse LONGTEXT,
          webhookStatus VARCHAR(50) DEFAULT 'pending',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_bo_merchant (merchantId),
          INDEX idx_bo_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Seed default merchant if none exists
      try {
        const [existing] = await connection.query('SELECT COUNT(*) as count FROM merchants');
        if (existing[0]?.count === 0) {
          const defaultKey = 'mod_live_master_' + Math.random().toString(36).substring(2, 10);
          await connection.query(
            'INSERT INTO merchants (merchantId, name, apiKey, isActive) VALUES (?, ?, ?, 1)',
            ['mch_default', 'Modevia Default Partner', defaultKey]
          );
          console.log(`🔑 Seeded default bridge merchant key: ${defaultKey}`);
        }
      } catch (seedErr) {
        console.warn('Notice seeding default merchant:', seedErr.message);
      }

      console.log('✅ MySQL tables verified / auto-initialized (orders, contacts, merchants, bridge_orders).');
      connection.release();
      return true;
    } catch (err) {
      lastError = err;
      if (pool) {
        try { await pool.end(); } catch (e) {}
      }
    }
  }

  isConnected = false;
  console.warn(`⚠️  cPanel MariaDB/MySQL Notice: [${lastError?.code || 'ERROR'}] ${lastError?.sqlMessage || lastError?.message}`);
  return false;
};

const getMySQLStatus = () => isConnected;
const getPool = () => pool;

// Order helper methods
const saveOrder = async (orderData) => {
  if (!isConnected || !pool) return null;
  const sql = `
    INSERT INTO orders 
      (orderId, clientId, customerName, customerEmail, customerPhone, serviceId, serviceTitle, planName, amount, currency, status, qrString, payeeVPA, gatewayResponse)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      gatewayResponse = VALUES(gatewayResponse),
      updatedAt = CURRENT_TIMESTAMP
  `;
  const values = [
    orderData.orderId,
    orderData.clientId || null,
    orderData.customerName,
    orderData.customerEmail,
    orderData.customerPhone,
    orderData.serviceId || 'general',
    orderData.serviceTitle || 'Service Plan',
    orderData.planName || 'Standard',
    orderData.amount,
    orderData.currency || 'INR',
    orderData.status || 'pending',
    orderData.qrString || null,
    orderData.payeeVPA || null,
    typeof orderData.gatewayResponse === 'object' ? JSON.stringify(orderData.gatewayResponse) : (orderData.gatewayResponse || null)
  ];
  await pool.execute(sql, values);
  return orderData;
};

const updateOrderStatus = async (orderId, status, gatewayResponse) => {
  if (!isConnected || !pool) return null;
  const sql = `
    UPDATE orders 
    SET status = ?, gatewayResponse = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE orderId = ?
  `;
  const gResp = typeof gatewayResponse === 'object' ? JSON.stringify(gatewayResponse) : (gatewayResponse || null);
  await pool.execute(sql, [status, gResp, orderId]);
};

const getAllOrders = async () => {
  if (!isConnected || !pool) return null;
  const [rows] = await pool.query('SELECT * FROM orders ORDER BY createdAt DESC');
  return rows.map(r => {
    try { r.gatewayResponse = JSON.parse(r.gatewayResponse); } catch (e) {}
    return r;
  });
};

const getOrderByOrderId = async (orderId) => {
  if (!isConnected || !pool) return null;
  const [rows] = await pool.execute('SELECT * FROM orders WHERE orderId = ? LIMIT 1', [orderId]);
  if (!rows.length) return null;
  const r = rows[0];
  try { r.gatewayResponse = JSON.parse(r.gatewayResponse); } catch (e) {}
  return r;
};

// Contact helper methods
const saveContact = async (contactData) => {
  if (!isConnected || !pool) return null;
  const sql = `
    INSERT INTO contacts (name, email, phone, message, status)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [
    contactData.name,
    contactData.email,
    contactData.phone || '',
    contactData.message,
    contactData.status || 'new'
  ];
  const [result] = await pool.execute(sql, values);
  return { id: result.insertId, ...contactData };
};

const getAllContacts = async () => {
  if (!isConnected || !pool) return null;
  const [rows] = await pool.query('SELECT * FROM contacts ORDER BY createdAt DESC');
  return rows;
};

// ==================== Bridge Merchant & Order Helpers ====================

const saveMerchant = async (merchantData) => {
  if (!isConnected || !pool) return null;
  const sql = `
    INSERT INTO merchants (merchantId, name, apiKey, webhookUrl, returnUrl, isActive)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      webhookUrl = VALUES(webhookUrl),
      returnUrl = VALUES(returnUrl),
      isActive = VALUES(isActive),
      updatedAt = CURRENT_TIMESTAMP
  `;
  const values = [
    merchantData.merchantId,
    merchantData.name,
    merchantData.apiKey,
    merchantData.webhookUrl || '',
    merchantData.returnUrl || '',
    merchantData.isActive !== undefined ? merchantData.isActive : 1
  ];
  await pool.execute(sql, values);
  return merchantData;
};

const getMerchantByApiKey = async (apiKey) => {
  if (!isConnected || !pool) return null;
  const [rows] = await pool.execute('SELECT * FROM merchants WHERE apiKey = ? AND isActive = 1 LIMIT 1', [apiKey]);
  return rows.length ? rows[0] : null;
};

const getAllMerchants = async () => {
  if (!isConnected || !pool) return null;
  const [rows] = await pool.query('SELECT * FROM merchants ORDER BY createdAt DESC');
  return rows;
};

const deleteMerchant = async (id) => {
  if (!isConnected || !pool) return null;
  await pool.execute('DELETE FROM merchants WHERE id = ? OR merchantId = ?', [id, id]);
  return true;
};

const saveBridgeOrder = async (orderData) => {
  if (!isConnected || !pool) return null;
  const sql = `
    INSERT INTO bridge_orders 
      (bridgeOrderId, merchantId, clientOrderId, amount, currency, customerName, customerEmail, customerPhone, returnUrl, webhookUrl, status, gatewayResponse, webhookStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      gatewayResponse = VALUES(gatewayResponse),
      webhookStatus = VALUES(webhookStatus),
      updatedAt = CURRENT_TIMESTAMP
  `;
  const values = [
    orderData.bridgeOrderId,
    orderData.merchantId,
    orderData.clientOrderId || null,
    orderData.amount,
    orderData.currency || 'INR',
    orderData.customerName || null,
    orderData.customerEmail || null,
    orderData.customerPhone || null,
    orderData.returnUrl,
    orderData.webhookUrl || null,
    orderData.status || 'pending',
    typeof orderData.gatewayResponse === 'object' ? JSON.stringify(orderData.gatewayResponse) : (orderData.gatewayResponse || null),
    orderData.webhookStatus || 'pending'
  ];
  await pool.execute(sql, values);
  return orderData;
};

const updateBridgeOrderStatus = async (bridgeOrderId, status, gatewayResponse, webhookStatus) => {
  if (!isConnected || !pool) return null;
  let sql = 'UPDATE bridge_orders SET status = ?, updatedAt = CURRENT_TIMESTAMP';
  const params = [status];

  if (gatewayResponse !== undefined) {
    sql += ', gatewayResponse = ?';
    params.push(typeof gatewayResponse === 'object' ? JSON.stringify(gatewayResponse) : (gatewayResponse || null));
  }
  if (webhookStatus !== undefined) {
    sql += ', webhookStatus = ?';
    params.push(webhookStatus);
  }

  sql += ' WHERE bridgeOrderId = ?';
  params.push(bridgeOrderId);

  await pool.execute(sql, params);
};

const getBridgeOrderByOrderId = async (bridgeOrderId) => {
  if (!isConnected || !pool) return null;
  const [rows] = await pool.execute('SELECT * FROM bridge_orders WHERE bridgeOrderId = ? LIMIT 1', [bridgeOrderId]);
  if (!rows.length) return null;
  const r = rows[0];
  try { r.gatewayResponse = JSON.parse(r.gatewayResponse); } catch (e) {}
  return r;
};

const getAllBridgeOrders = async () => {
  if (!isConnected || !pool) return null;
  const [rows] = await pool.query('SELECT * FROM bridge_orders ORDER BY createdAt DESC');
  return rows.map(r => {
    try { r.gatewayResponse = JSON.parse(r.gatewayResponse); } catch (e) {}
    return r;
  });
};

module.exports = {
  initMySQL,
  getMySQLStatus,
  getPool,
  saveOrder,
  updateOrderStatus,
  getAllOrders,
  getOrderByOrderId,
  saveContact,
  getAllContacts,
  saveMerchant,
  getMerchantByApiKey,
  getAllMerchants,
  deleteMerchant,
  saveBridgeOrder,
  updateBridgeOrderStatus,
  getBridgeOrderByOrderId,
  getAllBridgeOrders
};
