/**
 * Order Model — MongoDB Schema
 *
 * Professional freight/proxy shipping order design:
 * - 7-Stage pipeline tracking
 * - Volumetric weight pricing
 * - Full audit trail with timestamps at each stage
 */

import mongoose from 'mongoose';

// ── Sub-schemas ─────────────────────────────────────────────

const DimensionsSchema = new mongoose.Schema(
  {
    length: { type: Number, default: 0 },  // cm
    width:  { type: Number, default: 0 },  // cm
    height: { type: Number, default: 0 },  // cm
  },
  { _id: false }
);

const PipelineSchema = new mongoose.Schema(
  {
    pickupScheduledDate:  { type: String, default: 'Pending' },
    pickedUpDate:         { type: String, default: 'Pending' },
    warehouseArrivalDate: { type: String, default: 'Pending' },
    dispatchScheduledDate:{ type: String, default: 'Pending' },
    dispatchedDate:       { type: String, default: 'Pending' },
    deliveryScheduledDate:{ type: String, default: 'Pending' },
    deliveredDate:        { type: String, default: 'Pending' },
  },
  { _id: false }
);

// ── Main Order Schema ────────────────────────────────────────

const OrderSchema = new mongoose.Schema(
  {
    // Tracking Identifier
    trackingId: {
      type: String,
      unique: true,
      required: true,
    },

    // Customer reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },

    // Shipment Details
    packageName: {
      type: String,
      required: [true, 'Package description is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },

    // Physical Properties
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0.1, 'Weight must be greater than 0'],
    }, // kg
    dimensions: {
      type: DimensionsSchema,
      default: () => ({}),
    },
    volumetricWeight: {
      type: Number,
      default: 0,
    }, // (L x W x H) / 5000
    chargeableWeight: {
      type: Number,
      default: 0,
    }, // max(weight, volumetricWeight)

    // Route
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },

    // Options
    fragile: {
      type: Boolean,
      default: false,
    },
    express: {
      type: Boolean,
      default: false,
    },
    insured: {
      type: Boolean,
      default: false,
    },

    // Pricing Breakdown
    pricing: {
      basePrice:    { type: Number, default: 25.00 },
      weightFee:    { type: Number, default: 0 },
      fragileFee:   { type: Number, default: 0 },
      expressFee:   { type: Number, default: 0 },
      insuranceFee: { type: Number, default: 0 },
      totalPrice:   { type: Number, default: 0 },
      currency:     { type: String, default: 'USD' },
    },

    // 7-Stage Pipeline Status
    status: {
      type: String,
      enum: [
        'PICKUP_PENDING',         // Stage 1 — order placed
        'PICKUP_SCHEDULED',       // Stage 2 — pickup time set
        'PICKED_UP',              // Stage 3 — package collected
        'RECEIVED_AT_WAREHOUSE',  // Stage 4 — at sorting facility
        'DISPATCH_SCHEDULED',     // Stage 5 — dispatch date confirmed
        'OUT_FOR_DELIVERY',       // Stage 6 — in final delivery
        'DELIVERED',              // Stage 7 — complete
        'CANCELLED',              // Terminal — cancelled
        'RETURNED',               // Terminal — returned
      ],
      default: 'PICKUP_PENDING',
    },

    // Pipeline Timestamp Trail
    pipeline: {
      type: PipelineSchema,
      default: () => ({}),
    },

    // Manager/Admin Notes
    notes: {
      type: String,
      default: '',
    },

    // Handler reference
    assignedManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    collection: 'orders',
  }
);

// ── Indexes ─────────────────────────────────────────────────
OrderSchema.index({ userEmail: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 }); // newest first
OrderSchema.index({ userEmail: 1, status: 1, createdAt: -1 }); // high-performance compound query index

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
