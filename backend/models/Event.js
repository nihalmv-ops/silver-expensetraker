import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    item: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    quantity: { type: Number, default: null },
    unit: { type: String, default: '', trim: true },
    rate: { type: Number, default: null },
    amount: { type: Number, required: true, default: 0 },
    date: { type: String, default: '' },
    category: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      default: '',
      trim: true,
    },
    contactNumber: {
      type: String,
      default: '',
      trim: true,
    },
    referenceNumber: {
      type: String,
      default: '',
      trim: true,
    },
    coordinator: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    incomeEntries: {
      type: [entrySchema],
      default: [],
    },
    expenseEntries: {
      type: [entrySchema],
      default: [],
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Ensure updatedAt is updated on changes
eventSchema.pre('save', function (next) {
  this.updatedAt = new Date().toISOString();
  next();
});

const Event = mongoose.model('Event', eventSchema);

export default Event;

