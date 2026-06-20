import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User';
import Donation from '../models/Donation';
import { config } from '../config/env';

// ==========================================
// Sample Users Data
// ==========================================
const sampleUsers = [
  // Admin
  {
    name: 'FoodLink Admin',
    email: 'admin@foodlink.com',
    password: 'Admin@1234',
    role: 'admin',
    status: 'active',
    isVerified: true,
    emailVerified: true,
    bio: 'Platform administrator',
  },
  // Hotels/Restaurants
  {
    name: 'Raj Kumar',
    email: 'hotel@grandpalace.com',
    password: 'Hotel@1234',
    role: 'hotel',
    organizationName: 'Grand Palace Hotel',
    organizationType: 'Luxury Hotel',
    phone: '+91-9876543210',
    status: 'active',
    isVerified: true,
    emailVerified: true,
    address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    location: { type: 'Point', coordinates: [72.8777, 19.0760] },
  },
  {
    name: 'Priya Sharma',
    email: 'info@spicegardenrestaurant.com',
    password: 'Hotel@1234',
    role: 'hotel',
    organizationName: 'Spice Garden Restaurant',
    organizationType: 'Restaurant',
    phone: '+91-9765432101',
    status: 'active',
    isVerified: true,
    emailVerified: true,
    address: { city: 'Delhi', state: 'Delhi', country: 'India' },
    location: { type: 'Point', coordinates: [77.2090, 28.6139] },
  },
  {
    name: 'Arun Mehta',
    email: 'manager@sunriseinn.com',
    password: 'Hotel@1234',
    role: 'hotel',
    organizationName: 'Sunrise Inn & Suites',
    organizationType: 'Hotel',
    phone: '+91-9654321012',
    status: 'active',
    isVerified: false,
    emailVerified: true,
    address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
  },
  // NGOs
  {
    name: 'Sunita Patel',
    email: 'contact@feedthehungry.org',
    password: 'NGO@1234',
    role: 'ngo',
    organizationName: 'Feed The Hungry Foundation',
    organizationType: 'Food Bank',
    phone: '+91-9543210123',
    status: 'active',
    isVerified: true,
    emailVerified: true,
    registrationNumber: 'NGO/MH/2018/00123',
    address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    location: { type: 'Point', coordinates: [72.8516, 19.0176] },
    totalReceived: 45,
  },
  {
    name: 'Deepak Singh',
    email: 'info@annapoornaseva.org',
    password: 'NGO@1234',
    role: 'ngo',
    organizationName: 'Annapoorna Seva Trust',
    organizationType: 'Community Kitchen',
    phone: '+91-9432101234',
    status: 'active',
    isVerified: true,
    emailVerified: true,
    registrationNumber: 'NGO/DL/2015/00456',
    address: { city: 'Delhi', state: 'Delhi', country: 'India' },
    location: { type: 'Point', coordinates: [77.1025, 28.7041] },
    totalReceived: 78,
  },
  {
    name: 'Meera Iyer',
    email: 'support@smilefoundation.ngo',
    password: 'NGO@1234',
    role: 'ngo',
    organizationName: 'Smile Foundation',
    organizationType: 'Shelter & Food',
    phone: '+91-9321012345',
    status: 'active',
    isVerified: true,
    emailVerified: true,
    registrationNumber: 'NGO/KA/2019/00789',
    address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    location: { type: 'Point', coordinates: [77.6408, 12.9352] },
    totalReceived: 32,
  },
  // Volunteers
  {
    name: 'Veda',
    email: 'veda@gmail.com',
    password: 'veda2606',
    role: 'volunteer',
    phone: '+91-9111111121',
    status: 'active',
    isVerified: true,
    emailVerified: true,
    address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    location: { type: 'Point', coordinates: [77.5800, 12.9800] },
    rating: 4,
    totalPickups: 9,
  },
  {
    name: 'Amit Verma',
    email: 'amit.volunteer@gmail.com',
    password: 'Vol@1234',
    role: 'volunteer',
    phone: '+91-9210123456',
    status: 'active',
    isVerified: true,
    emailVerified: true,
    address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    location: { type: 'Point', coordinates: [72.8347, 19.0330] },
    rating: 4.8,
    totalPickups: 23,
  },
  
  {
    name: 'Ravi Nair',
    email: 'ravi.volunteer@gmail.com',
    password: 'Vol@1234',
    role: 'volunteer',
    phone: '+91-9012345678',
    status: 'active',
    isVerified: false,
    emailVerified: true,
    address: { city: 'Delhi', state: 'Delhi', country: 'India' },
    location: { type: 'Point', coordinates: [77.2300, 28.6500] },
    rating: 4.3,
    totalPickups: 8,
  },
];

// ==========================================
// Seed function
// ==========================================
const seedDB = async (): Promise<void> => {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Donation.deleteMany({}),
    ]);

    // Create users
    console.log('👥 Creating sample users...');
    const createdUsers = await User.create(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Get reference IDs
    const hotel1 = createdUsers.find(u => u.email === 'hotel@grandpalace.com');
    const hotel2 = createdUsers.find(u => u.email === 'info@spicegardenrestaurant.com');
    const ngo1 = createdUsers.find(u => u.email === 'contact@feedthehungry.org');
    const volunteer1 = createdUsers.find(u => u.email === 'veda@gmail.com');

    if (!hotel1 || !hotel2 || !ngo1 || !volunteer1) {
      throw new Error('Failed to find seeded users');
    }

    // Create sample donations
    const sampleDonations = [
      {
        donor: hotel1._id,
        title: 'Fresh Biryani - 50 Portions',
        description: 'Freshly cooked chicken biryani from our lunch service. Well packed in food-grade containers.',
        category: 'cooked_meals',
        quantity: 25,
        unit: 'kg',
        servings: 50,
        expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        pickupDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
        address: { street: 'Marine Drive', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
        location: { type: 'Point', coordinates: [72.8777, 19.0760] },
        status: 'available',
        temperatureRequirements: 'ambient',
      },
      {
        donor: hotel2._id,
        title: 'Surplus Bread & Baked Goods',
        description: 'Assorted bread loaves, rolls, and pastries from today\'s bakery. Perfect for immediate distribution.',
        category: 'bakery',
        quantity: 15,
        unit: 'kg',
        servings: 40,
        expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        pickupDeadline: new Date(Date.now() + 3 * 60 * 60 * 1000),
        address: { street: 'Connaught Place', city: 'Delhi', state: 'Delhi', country: 'India' },
        location: { type: 'Point', coordinates: [77.2090, 28.6139] },
        status: 'claimed',
        claimedBy: ngo1._id,
        claimedAt: new Date(Date.now() - 30 * 60 * 1000),
        volunteer: volunteer1._id,
        temperatureRequirements: 'ambient',
      },
      {
        donor: hotel1._id,
        title: 'Mixed Vegetable Curry - Emergency',
        description: 'Large quantity of fresh mixed vegetable curry. URGENT pickup needed!',
        category: 'cooked_meals',
        quantity: 30,
        unit: 'kg',
        servings: 60,
        expiryTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        pickupDeadline: new Date(Date.now() + 1 * 60 * 60 * 1000),
        address: { street: 'Juhu Beach Road', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
        location: { type: 'Point', coordinates: [72.8296, 19.1075] },
        status: 'available',
        isEmergency: true,
        temperatureRequirements: 'ambient',
      },
      {
        donor: hotel2._id,
        title: 'Fresh Fruits & Vegetables',
        description: 'End-of-day fresh produce - tomatoes, cucumbers, leafy greens, apples, bananas.',
        category: 'fruits_vegetables',
        quantity: 20,
        unit: 'kg',
        servings: 35,
        expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        pickupDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
        address: { street: 'Lajpat Nagar', city: 'Delhi', state: 'Delhi', country: 'India' },
        location: { type: 'Point', coordinates: [77.2439, 28.5672] },
        status: 'delivered',
        claimedBy: ngo1._id,
        volunteer: volunteer1._id,
        claimedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        pickedUpAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        temperatureRequirements: 'refrigerated',
      },
    ];

    console.log(' Creating sample donations...');
    await Donation.create(sampleDonations);
    console.log(`✅ Created ${sampleDonations.length} donations`);

    console.log('\nDatabase seeded successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('─────────────────────────────────────');
    console.log('👑 Admin:     admin@foodlink.com / Admin@1234');
    console.log('🏨 Hotel:     hotel@grandpalace.com / Hotel@1234');
    console.log('🏨 Hotel 2:   info@spicegardenrestaurant.com / Hotel@1234');
    console.log('🏛️  NGO:       contact@feedthehungry.org / NGO@1234');
    console.log('🏛️  NGO 2:     info@annapoornaseva.org / NGO@1234');
    console.log('🚗 Volunteer: veda@gmail.com / veda2606');
    console.log('─────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedDB();
