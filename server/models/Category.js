import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default',
      unique: true,
      index: true,
    },
    income: {
      type: [String],
      default: [
        'Event Payment',
        'Advance Payment',
        'Balance Payment',
        'Extra Order',
        'Additional Decoration',
        'Other',
      ],
    },
    expense: {
      type: [String],
      default: [
        'Food & Meat',
        'Vegetables & Provisions',
        'Staff & Labor',
        'Transportation & Fuel',
        'Decoration & Rentals',
        'Gas & Utilities',
        'Ice & Beverages',
        'Disposables & Cleaning',
        'Other',
      ],
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    versionKey: false,
  }
);

const Category = mongoose.model('Category', categorySchema);

export default Category;
