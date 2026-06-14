import mongoose, { Schema } from "mongoose";

// Standard JSON / Object serialization options to map _id to id
const serializeOptions = {
  virtuals: true,
  transform: (doc: unknown, ret: Record<string, unknown>) => {
    const r = ret as Record<string, unknown> & {
      id: string;
      _id: unknown;
      __v: unknown;
    };
    r.id = String(r._id);
    delete r._id;
    delete r.__v;
    return r;
  },
};

// 1. Equipment Schema
const EquipmentSchema = new Schema(
  {
    _id: { type: String, required: true }, // custom e.g., "eq-1"
    name: { type: String, required: true },
    category: { type: String, required: true },
    dailyRate: { type: Number, required: true },
    weeklyRate: { type: Number, required: true },
    totalStock: { type: Number, required: true },
    rentedCount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ["Available", "Out of Stock", "Maintenance"],
      default: "Available",
    },
    model: { type: String, required: false },
    serial: { type: String, required: false },
    maintenanceStatus: {
      type: String,
      required: true,
      enum: ["Good", "Requires Service", "Under Repair"],
      default: "Good",
    },
    description: { type: String, required: false },
    imageUrl: { type: String },
  },
  {
    timestamps: true,
    toJSON: serializeOptions,
    toObject: serializeOptions,
  },
);

// 2. Customer Schema
const CustomerSchema = new Schema(
  {
    _id: { type: String, required: true }, // custom e.g., "cust-1"
    name: { type: String, required: true },
    company: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    activeRentalsCount: { type: Number, required: true, default: 0 },
    totalSpend: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
    toJSON: serializeOptions,
    toObject: serializeOptions,
  },
);

// 3. Booking Schema
const BookingSchema = new Schema(
  {
    _id: { type: String, required: true }, // custom e.g., "bk-1"
    items: [
      {
        equipmentId: { type: String, required: true, ref: "Equipment" },
        equipmentName: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    equipmentId: { type: String },
    equipmentName: { type: String },
    customerId: { type: String, required: true, ref: "Customer" },
    customerName: { type: String, required: true },
    companyName: { type: String, required: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, required: true }, // YYYY-MM-DD
    actualReturnDate: { type: String }, // YYYY-MM-DD
    totalCost: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Completed", "Overdue", "Reserved"],
      default: "Active",
    },
  },
  {
    timestamps: true,
    toJSON: serializeOptions,
    toObject: serializeOptions,
  },
);

// 4. MaintenanceLog Schema
const MaintenanceLogSchema = new Schema(
  {
    _id: { type: String, required: true }, // custom e.g., "maint-1"
    equipmentId: { type: String, required: true, ref: "Equipment" },
    equipmentName: { type: String, required: true },
    description: { type: String, required: true },
    cost: { type: Number, required: true },
    reportedDate: { type: String, required: true }, // YYYY-MM-DD
    completedDate: { type: String }, // YYYY-MM-DD
    status: {
      type: String,
      required: true,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
    technician: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: serializeOptions,
    toObject: serializeOptions,
  },
);

export const EquipmentModel =
  mongoose.models.Equipment || mongoose.model("Equipment", EquipmentSchema);
export const CustomerModel =
  mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
export const BookingModel =
  mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
export const MaintenanceLogModel =
  mongoose.models.MaintenanceLog ||
  mongoose.model("MaintenanceLog", MaintenanceLogSchema);

// 5. AuditLog Schema
const AuditLogSchema = new Schema(
  {
    _id: { type: String, required: true }, // custom ID e.g., "audit-123456"
    action: { type: String, required: true }, // e.g. "Booking Created"
    entityId: { type: String, required: true }, // e.g. "bk-1029", "cust-4920"
    entityType: {
      type: String,
      required: true,
      enum: ["Booking", "Customer", "Equipment", "Maintenance"],
    },
    description: { type: String, required: true },
    operator: { type: String, required: true, default: "Mahesh Verma" },
    details: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: serializeOptions,
    toObject: serializeOptions,
  },
);

export const AuditLogModel =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
