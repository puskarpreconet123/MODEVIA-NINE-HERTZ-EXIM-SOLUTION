const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/modevia_ninehertz';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️  MongoDB Connection Warning: ${error.message}`);
    console.warn('ℹ️  Running with in-memory fallback. You can connect a real MongoDB in server/.env');
  }
};

const getDBStatus = () => isConnected;

module.exports = { connectDB, getDBStatus };
