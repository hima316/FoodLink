import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'donation_available' | 'donation_claimed'
  | 'donation_picked_up' | 'donation_delivered'
  | 'donation_expired'   | 'emergency_request'
  | 'volunteer_assigned' | 'system_alert';

export interface INotification extends Document {
  recipient:  mongoose.Types.ObjectId;
  sender?:    mongoose.Types.ObjectId;
  type:       NotificationType;
  title:      string;
  message:    string;
  isRead:     boolean;
  data?:      Record<string, unknown>;
  createdAt:  Date;
  updatedAt:  Date;
}

type NotificationModel = Model<INotification>;

const NotificationSchema = new Schema<INotification, NotificationModel>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type:     String,
      enum:     ['donation_available','donation_claimed','donation_picked_up',
                 'donation_delivered','donation_expired','emergency_request',
                 'volunteer_assigned','system_alert'],
      required: true,
    },
    title:   { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    isRead:  { type: Boolean, default: false },
    data:    { type: Schema.Types.Mixed, default: {} },
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
  }
);

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
// Auto-delete notifications older than 30 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

const Notification = mongoose.model<INotification, NotificationModel>(
  'Notification',
  NotificationSchema
);
export default Notification;
