const mongoose = require('mongoose');

// In-memory fallback store when MongoDB is disconnected or unavailable
const memoryStore = {
  logs: [],
  settings: {
    alertThreshold: 70,
    smsEnabled: true,
    phoneNumber: '+15005550006'
  }
};

let isConnectedToMongo = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceguard';
  
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000 // Fast timeout to fallback if no Mongo daemon
    });
    isConnectedToMongo = true;
    console.log(`[MongoDB] Connected successfully to ${mongoURI}`);
  } catch (err) {
    isConnectedToMongo = false;
    console.warn(`[MongoDB Warning] Could not connect to MongoDB (${err.message}). Using high-performance in-memory log store for demo.`);
  }
};

const getIsConnected = () => isConnectedToMongo;
const getMemoryStore = () => memoryStore;

module.exports = { connectDB, getIsConnected, getMemoryStore };
