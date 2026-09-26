/**
 * LocalStorage management for Silver Catering Event Income & Expense Calculator
 */

const STORAGE_KEY_EVENTS = 'silver_catering_events_v1';
const STORAGE_KEY_CATEGORIES = 'silver_catering_categories_v1';

export const DEFAULT_INCOME_CATEGORIES = [
  'Event Payment',
  'Advance Payment',
  'Balance Payment',
  'Extra Order',
  'Additional Decoration',
  'Other',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
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

// Initial seed data based on the prompt's examples
const INITIAL_SEED_EVENTS = [
  {
    id: 'EVT-2026-0001',
    name: 'Wedding Catering',
    clientName: 'ABC Family',
    date: '2026-09-25',
    venue: 'Valanchery',
    contactNumber: '+91 98464 15767',
    referenceNumber: 'REF-WED-0926',
    notes: 'Premium evening wedding dinner reception for 600 guests.',
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-09-23T12:00:00.000Z',
    incomeEntries: [
      {
        id: 'inc_seed_1',
        item: 'Advance Payment',
        description: 'Initial booking advance via NEFT',
        quantity: null,
        unit: '',
        rate: null,
        amount: 50000,
        date: '2026-09-15',
        category: 'Advance Payment',
        notes: 'Transaction ref #TXN882910',
      },
      {
        id: 'inc_seed_2',
        item: 'Extra Food Order',
        description: 'Additional banquet plates requested for VIP lounge',
        quantity: 50,
        unit: 'Plate',
        rate: 200,
        amount: 10000,
        date: '2026-09-25',
        category: 'Extra Order',
        notes: '50 plates @ ₹200',
      },
      {
        id: 'inc_seed_3',
        item: 'Balance Payment',
        description: 'Final event stage settlement',
        quantity: null,
        unit: '',
        rate: null,
        amount: 28000,
        date: '2026-09-25',
        category: 'Balance Payment',
        notes: 'Received in cash at venue',
      },
    ],
    expenseEntries: [
      {
        id: 'exp_seed_1',
        item: 'Transportation',
        description: 'Refrigerated van logistics to Valanchery venue',
        quantity: null,
        unit: '',
        rate: null,
        amount: 3500,
        date: '2026-09-24',
        category: 'Transportation & Fuel',
        notes: '2 round trips from main kitchen',
      },
      {
        id: 'exp_seed_2',
        item: 'Chicken',
        description: 'Fresh dressed poultry for Malabar Dum Biryani',
        quantity: 30,
        unit: 'KG',
        rate: 180,
        amount: 5400,
        date: '2026-09-24',
        category: 'Food & Meat',
        notes: '30 KG @ ₹180/KG',
      },
      {
        id: 'exp_seed_3',
        item: 'Staff Payment',
        description: 'Service stewards, head chefs and kitchen assistants',
        quantity: 12,
        unit: 'Persons',
        rate: 1500,
        amount: 18000,
        date: '2026-09-25',
        category: 'Staff & Labor',
        notes: '12 team members',
      },
      {
        id: 'exp_seed_4',
        item: 'Vegetables & Provisions',
        description: 'Fresh vegetables, onions, mint, and spices from market',
        quantity: null,
        unit: '',
        rate: null,
        amount: 6500,
        date: '2026-09-24',
        category: 'Vegetables & Provisions',
        notes: '',
      },
      {
        id: 'exp_seed_5',
        item: 'Gas Cylinders',
        description: 'Commercial cooking gas cylinders',
        quantity: 2,
        unit: 'Cylinders',
        rate: 1800,
        amount: 3600,
        date: '2026-09-24',
        category: 'Gas & Utilities',
        notes: '',
      },
      {
        id: 'exp_seed_6',
        item: 'Ice & Cold Storage Blocks',
        description: 'Food grade ice cubes & preservation blocks',
        quantity: null,
        unit: '',
        rate: null,
        amount: 2000,
        date: '2026-09-25',
        category: 'Ice & Beverages',
        notes: '',
      },
    ],
  },
];

export function getStoredEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (!raw || raw === '[]') {
      // Seed with initial realistic event data
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(INITIAL_SEED_EVENTS));
      return INITIAL_SEED_EVENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(INITIAL_SEED_EVENTS));
      return INITIAL_SEED_EVENTS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load events from LocalStorage:', err);
    return INITIAL_SEED_EVENTS;
  }
}

export function saveStoredEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events to LocalStorage:', err);
  }
}

export function getStoredCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) {
      const initial = {
        income: DEFAULT_INCOME_CATEGORIES,
        expense: DEFAULT_EXPENSE_CATEGORIES,
      };
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load categories:', err);
    return {
      income: DEFAULT_INCOME_CATEGORIES,
      expense: DEFAULT_EXPENSE_CATEGORIES,
    };
  }
}

export function saveStoredCategories(categories) {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories:', err);
  }
}

export function exportBackupData() {
  const events = getStoredEvents();
  const categories = getStoredCategories();
  const backup = {
    app: 'Silver Catering Event Calculator',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    events,
    categories,
  };
  return JSON.stringify(backup, null, 2);
}

export function importBackupData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data && Array.isArray(data.events)) {
      saveStoredEvents(data.events);
      if (data.categories) {
        saveStoredCategories(data.categories);
      }
      return { success: true, count: data.events.length };
    }
    return { success: false, error: 'Invalid backup format. "events" array is missing.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

