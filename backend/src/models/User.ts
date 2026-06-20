import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ==========================================
// Interfaces
// ==========================================
export type UserRole   = 'hotel' | 'ngo' | 'volunteer' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUser extends Document, IUserMethods {
  name:               string;
  email:              string;
  password:           string;
  role:               UserRole;
  status:             UserStatus;
  avatar?:            string;
  phone?:             string;
  address?: {
    street?:  string;
    city?:    string;
    state?:   string;
    country?: string;
    zipCode?: string;
  };
  location?: {
    type:        'Point';
    coordinates: [number, number];
  };
  organizationName?:   string;
  organizationType?:   string;
  registrationNumber?: string;
  bio?:                string;
  rating?:             number;
  totalDonations?:     number;
  totalPickups?:       number;
  totalReceived?:      number;
  isVerified:          boolean;
  emailVerified:       boolean;
  lastLogin?:          Date;
  refreshToken?:       string;
  createdAt:           Date;
  updatedAt:           Date;
}

type UserModel = Model<IUser, {}, IUserMethods>;

// ==========================================
// Sub-Schemas
// ==========================================
const AddressSchema = new Schema(
  {
    street:  { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
    zipCode: { type: String, trim: true },
  },
  { _id: false }
);

const LocationSchema = new Schema(
  {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  { _id: false }
);

// ==========================================
// Main User Schema
// ==========================================
const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      lowercase: true,
      trim:     true,
      match:    [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false,
    },
    role: {
      type:     String,
      enum:     ['hotel', 'ngo', 'volunteer', 'admin'],
      required: [true, 'Role is required'],
    },
    status: {
      type:    String,
      enum:    ['active', 'inactive', 'pending', 'suspended'],
      default: 'active',
    },
    avatar:  { type: String, default: '' },
    phone:   { type: String, trim: true },
    address: AddressSchema,
    location: {
      type:  LocationSchema,
      index: '2dsphere' as unknown as boolean,
    },
    organizationName:   { type: String, trim: true, maxlength: 200 },
    organizationType:   { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    bio:                { type: String, maxlength: 500 },
    rating:             { type: Number, min: 0, max: 5, default: 0 },
    totalDonations:     { type: Number, default: 0 },
    totalPickups:       { type: Number, default: 0 },
    totalReceived:      { type: Number, default: 0 },
    isVerified:         { type: Boolean, default: false },
    emailVerified:      { type: Boolean, default: false },
    lastLogin:          { type: Date },
    refreshToken:       { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals:  true,
      transform: (_doc: unknown, ret: Record<string, unknown>) => {
        delete ret.__v;
        delete ret.password;
        delete ret.refreshToken;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ==========================================
// Indexes
// ==========================================
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

// ==========================================
// Pre-save: Hash password
// ==========================================
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const saltRounds = 12;
    this.password    = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ==========================================
// Instance Method: Compare password
// ==========================================
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

// ==========================================
// Virtual: Display name
// ==========================================
UserSchema.virtual('displayName').get(function (this: IUser) {
  return this.organizationName || this.name;
});

const User = mongoose.model<IUser, UserModel>('User', UserSchema);
export default User;
