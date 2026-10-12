import express from 'express';
import Category from '../models/Category.js';

const router = express.Router();

const DEFAULT_INCOME_CATEGORIES = [
  'Event Payment',
  'Advance Payment',
  'Balance Payment',
  'Extra Order',
  'Additional Decoration',
  'Other',
];

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Meat',
  'Vegetables & Provisions',
  'Staff & Labor',
  'Transportation & Fuel',
  'Decoration & Rentals',
  'Gas & Utilities',
  'Ice & Beverages',
  'Disposables & Cleaning',
  'Other',
];

/**
 * GET /api/categories
 * Returns categories for income and expense
 */
router.get('/', async (req, res) => {
  try {
    let cat = await Category.findOne({ key: 'default' }).lean();
    if (!cat) {
      cat = await Category.create({
        key: 'default',
        income: DEFAULT_INCOME_CATEGORIES,
        expense: DEFAULT_EXPENSE_CATEGORIES,
      });
    }
    return res.json({
      success: true,
      data: {
        income: cat.income,
        expense: cat.expense,
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/categories
 * Save or update categories
 */
router.post('/', async (req, res) => {
  try {
    const { income, expense } = req.body;
    const updateData = {
      updatedAt: new Date().toISOString(),
    };
    if (Array.isArray(income)) updateData.income = income;
    if (Array.isArray(expense)) updateData.expense = expense;

    const saved = await Category.findOneAndUpdate(
      { key: 'default' },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      data: {
        income: saved.income,
        expense: saved.expense,
      },
    });
  } catch (error) {
    console.error('Error updating categories:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/categories/sync
 * Merges local categories with database categories
 */
router.post('/sync', async (req, res) => {
  try {
    const { income = [], expense = [] } = req.body;
    let cat = await Category.findOne({ key: 'default' });

    if (!cat) {
      cat = await Category.create({
        key: 'default',
        income: income.length > 0 ? income : DEFAULT_INCOME_CATEGORIES,
        expense: expense.length > 0 ? expense : DEFAULT_EXPENSE_CATEGORIES,
      });
    } else {
      // Merge unique entries
      const mergedIncome = Array.from(new Set([...cat.income, ...income]));
      const mergedExpense = Array.from(new Set([...cat.expense, ...expense]));
      cat.income = mergedIncome;
      cat.expense = mergedExpense;
      cat.updatedAt = new Date().toISOString();
      await cat.save();
    }

    return res.json({
      success: true,
      data: {
        income: cat.income,
        expense: cat.expense,
      },
    });
  } catch (error) {
    console.error('Error syncing categories:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

