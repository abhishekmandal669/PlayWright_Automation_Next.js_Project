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

const ActivityLogSchema = new mongoose.Schema(
  {
    stage: { type: Number, default: null },
    action: { type: String, required: true },
    status: { type: String, default: '' },
    actor: { type: String, default: 'System Dispatcher' },
    actorRole: { type: String, default: 'System' },
    location: { type: String, default: '' },
    details: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    hash: { type: String, default: '' },
  },
  { _id: true }
);

// ── Main Order Schema ────────────────────────────────────────

const OrderSchema = new mongoose.Schema(
  {
    // Tracking Identifier (Barcode Consignment Ref)
    trackingId: {
      type: String,
      unique: true,
      required: true,
    },

    // Sequential Order ID (e.g. ORD-1001, ORD-1002)
    orderId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    orderNumber: {
      type: Number,
      index: true,
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
        'DRIVER_ASSIGNED',        // Stage 2.5 — driver & truck allocated
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

    // Cancellation Details
    cancellationReason: {
      type: String,
      default: '',
    },

    // Parent / Child Order Hierarchy
    isChildOrder: {
      type: Boolean,
      default: false,
    },
    parentOrderNumber: {
      type: Number,
      default: null,
      index: true,
    },
    parentOrderId: {
      type: String,
      default: null,
    },
    parentTrackingId: {
      type: String,
      default: null,
    },
    childOrders: {
      type: [
        {
          orderNumber: Number,
          orderId: String,
          trackingId: String,
          packageName: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    // Driver & Fleet Assignment Details
    assignedDriver: {
      driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        default: null,
      },
      driverName: {
        type: String,
        default: '',
      },
      driverPhone: {
        type: String,
        default: '',
      },
      vehicleNumber: {
        type: String,
        default: '',
      },
      vehicleType: {
        type: String,
        default: '',
      },
      assignedAt: {
        type: Date,
        default: null,
      },
    },

    // Inbound Hub & Ingestion Details
    hubDetails: {
      receivingHubName: {
        type: String,
        default: '',
      },
      sortingLane: {
        type: String,
        default: '',
      },
      ingestedAt: {
        type: Date,
        default: null,
      },
    },

    // Proof of Delivery (POD)
    deliveryProof: {
      receiverName: {
        type: String,
        default: '',
      },
      deliveredAt: {
        type: Date,
        default: null,
      },
      notes: {
        type: String,
        default: '',
      },
      otpVerified: {
        type: Boolean,
        default: false,
      },
    },

    // Activity & Audit Logs
    activityLogs: {
      type: [ActivityLogSchema],
      default: [],
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
if (mongoose.models && mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
