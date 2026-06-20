import mongoose, { Schema, Document, Model } from 'mongoose';

export type DonationStatus =
  | 'available' | 'claimed' | 'in_transit'
  | 'delivered' | 'expired' | 'cancelled';

export type FoodCategory =
  | 'cooked_meals' | 'raw_ingredients' | 'bakery'
  | 'beverages'    | 'fruits_vegetables' | 'dairy'
  | 'packaged_food'| 'other';

export interface IDonation extends Document {
  donor:                  mongoose.Types.ObjectId;
  claimedBy?:             mongoose.Types.ObjectId;
  volunteer?:             mongoose.Types.ObjectId;
  title:                  string;
  description:            string;
  category:               FoodCategory;
  quantity:               number;
  unit:                   string;
  servings?:              number;
  expiryTime:             Date;
  pickupDeadline:         Date;
  images?:                string[];
  address: {
    street?:  string;
    city?:    string;
    state?:   string;
    country?: string;
    zipCode?: string;
  };
  location: {
    type:        'Point';
    coordinates: [number, number];
  };
  status:                  DonationStatus;
  isEmergency:             boolean;
  allergens?:              string[];
  specialInstructions?:    string;
  temperatureRequirements?: 'ambient' | 'refrigerated' | 'frozen';
  claimedAt?:              Date;
  pickedUpAt?:             Date;
  deliveredAt?:            Date;
  createdAt:               Date;
  updatedAt:               Date;
}

type DonationModel = Model<IDonation>;

// ==========================================
// Donation Schema
// ==========================================
const DonationSchema = new Schema<IDonation, DonationModel>(
  {
    donor:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    claimedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    volunteer: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    title:       { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },

    category: {
      type:     String,
      enum:     ['cooked_meals','raw_ingredients','bakery','beverages',
                 'fruits_vegetables','dairy','packaged_food','other'],
      required: true,
    },

    quantity: { type: Number, required: true, min: 0.1 },
    unit: {
      type:    String,
      required: true,
      enum:    ['kg','lbs','portions','boxes','bags','liters','pieces'],
      default: 'kg',
    },
    servings: { type: Number, min: 1 },

    expiryTime:     { type: Date, required: true },
    pickupDeadline: { type: Date, required: true },
    images:         { type: [String], default: [] },

    address: {
      street:  { type: String, trim: true },
      city:    { type: String, trim: true },
      state:   { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      zipCode: { type: String, trim: true },
    },

    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },

    status: {
      type:    String,
      enum:    ['available','claimed','in_transit','delivered','expired','cancelled'],
      default: 'available',
    },

    isEmergency:             { type: Boolean, default: false },
    allergens:               { type: [String], default: [] },
    specialInstructions:     { type: String, maxlength: 500 },
    temperatureRequirements: {
      type:    String,
      enum:    ['ambient','refrigerated','frozen'],
      default: 'ambient',
    },

    claimedAt:   { type: Date },
    pickedUpAt:  { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals:  true,
      transform: (_doc: unknown, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ==========================================
// Indexes
// ==========================================
DonationSchema.index({ 'location': '2dsphere' });
DonationSchema.index({ status: 1 });
DonationSchema.index({ donor: 1 });
DonationSchema.index({ claimedBy: 1 });
DonationSchema.index({ volunteer: 1 });
DonationSchema.index({ expiryTime: 1 });
DonationSchema.index({ createdAt: -1 });
DonationSchema.index({ isEmergency: 1, status: 1 });

// ==========================================
// Pre-save: Auto-expire
// ==========================================
DonationSchema.pre('save', function (next) {
  if (this.status === 'available' && new Date() > this.expiryTime) {
    this.status = 'expired';
  }
  next();
});

const Donation = mongoose.model<IDonation, DonationModel>('Donation', DonationSchema);
export default Donation;
