import mongoose from 'mongoose';
import { config } from './env';

// MongoDB connection options
const mongoOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10,        // Maximum connection pool size
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Socket timeout
};

// Track connection state
let isConnected = false;

/**
 * Connect to MongoDB Atlas
 * Uses connection pooling for optimal performance
 */
export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri, mongoOptions);
    isConnected = true;

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    // Exit process with failure on initial connection error
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 * Used for graceful shutdown
 */
export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) return;

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('✅ MongoDB connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

export default connectDB;
