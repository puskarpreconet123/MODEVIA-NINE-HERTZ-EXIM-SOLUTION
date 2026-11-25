const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/modevia_ninehertz';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
    isConnected = true;
    console.log(`✅ Server Database Connected (MongoDB): ${conn.connection.host}:${conn.connection.port || 27017}/${conn.connection.name}`);
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️  Database Connection Notice: ${error.message}`);
    console.warn(`ℹ️  Attempted URI: ${uri.replace(/\/\/[^@]+@/, '//***:***@')}`);
    console.warn('ℹ️  Running with persistent in-memory fallback until local MongoDB is started.');
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('⚠️  MongoDB disconnected. Will reconnect automatically when database service resumes.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('✅ MongoDB reconnected successfully.');
  });
};

const getDBStatus = () => isConnected;

module.exports = { connectDB, getDBStatus };
