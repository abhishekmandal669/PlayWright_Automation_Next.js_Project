import mongoose from 'mongoose';

const DriverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Driver email is required'],
      lowercase: true,
      trim: true,
      unique: true,
    },
    phone: {
      type: String,
      required: [true, 'Driver contact phone is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      default: '',
      trim: true,
    },
    vehicleNumber: {
      type: String,
      default: '',
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['Delivery Van', 'Light Truck', 'Heavy Freight', 'Air Cargo Shuttle', 'Bike Courier'],
      default: 'Delivery Van',
    },
    status: {
      type: String,
      enum: ['Active', 'On Route', 'Off Duty', 'Inactive'],
      default: 'Active',
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 4.9,
    },
    currentOrderId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'drivers',
  }
);

DriverSchema.index({ status: 1 });

export default mongoose.models.Driver || mongoose.model('Driver', DriverSchema);
