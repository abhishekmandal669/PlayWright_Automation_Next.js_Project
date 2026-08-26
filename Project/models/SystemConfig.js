import mongoose from 'mongoose';

const SystemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'freight_rates',
    },
    basePrice: {
      type: Number,
      default: 25.0,
    },
    pricePerKg: {
      type: Number,
      default: 12.5,
    },
    volumetricDivisor: {
      type: Number,
      default: 5000,
    },
    fragileFee: {
      type: Number,
      default: 15.0,
    },
    expressFee: {
      type: Number,
      default: 35.0,
    },
    insurancePercentage: {
      type: Number,
      default: 1.5,
    },
    fuelSurchargePercent: {
      type: Number,
      default: 4.5,
    },
    updatedBy: {
      type: String,
      default: 'System Admin',
    },
  },
  {
    timestamps: true,
    collection: 'system_configs',
  }
);

export default mongoose.models.SystemConfig || mongoose.model('SystemConfig', SystemConfigSchema);
