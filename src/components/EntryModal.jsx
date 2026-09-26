import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Check, Calculator, Sparkles } from 'lucide-react';
import { calculateEntryAmount, formatINR } from '../utils/currency';
import { generateUniqueId } from '../utils/idGenerator';

const QUICK_INCOME_ITEMS = [
  'Event Payment',
  'Advance Payment',
  'Balance Payment',
  'Extra Food Order',
  'Additional Decoration',
  'Transportation Reimbursement',
  'VIP Lounge Service',
  'Dessert Station Add-on',
];

const QUICK_EXPENSE_ITEMS = [
  'Chicken',
  'Mutton',
  'Fish & Seafood',
  'Vegetables & Provisions',
  'Biryani Rice (Jeerakasala)',
  'Staff Payment (Chefs & Stewards)',
  'Transportation & Logistics',
  'Cooking Gas Cylinders',
  'Ice & Chilling Blocks',
  'Decoration Materials & Lighting',
  'Disposables, Plates & Napkins',
  'Kitchen Fuel & Generator',
];

const COMMON_UNITS = ['Plate', 'KG', 'Litre', 'Persons', 'Hours', 'Cylinders', 'Trips', 'Lots', 'Bags', 'Packets'];

export default function EntryModal({
  isOpen,
  onClose,
  type = 'income', // 'income' | 'expense'
  editEntry = null, // null for new entry, object for editing
  defaultDate = '',
  categories = [],
  onSaveEntry,
}) {
  const isIncome = type === 'income';
  const isEdit = Boolean(editEntry);

  const [item, setItem] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [rate, setRate] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [isManualAmount, setIsManualAmount] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const itemInputRef = useRef(null);

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    if (editEntry) {
      setItem(editEntry.item || '');
      setDescription(editEntry.description || '');
      setQuantity(editEntry.quantity ?? '');
      setUnit(editEntry.unit || '');
      setRate(editEntry.rate ?? '');
      setAmount(editEntry.amount ?? '');
      setDate(editEntry.date || defaultDate || new Date().toISOString().slice(0, 10));
      setCategory(editEntry.category || '');
      setNotes(editEntry.notes || '');
      setIsManualAmount(!(editEntry.quantity && editEntry.rate));
    } else {
      setItem('');
      setDescription('');
      setQuantity('');
      setUnit('');
      setRate('');
      setAmount('');
      setDate(defaultDate || new Date().toISOString().slice(0, 10));
      setCategory('');
      setNotes('');
      setIsManualAmount(false);
    }

    setTimeout(() => {
      itemInputRef.current?.focus();
    }, 100);
  }, [isOpen, editEntry, defaultDate]);

  // Automatic calculation of Quantity * Rate
  const handleQuantityChange = (val) => {
    setQuantity(val);
    const q = parseFloat(val);
    const r = parseFloat(rate);
    if (!isNaN(q) && q > 0 && !isNaN(r) && r > 0) {
      setAmount(Math.round(q * r * 100) / 100);
      setIsManualAmount(false);
    }
  };

  const handleRateChange = (val) => {
    setRate(val);
    const q = parseFloat(quantity);
    const r = parseFloat(val);
    if (!isNaN(q) && q > 0 && !isNaN(r) && r > 0) {
      setAmount(Math.round(q * r * 100) / 100);
      setIsManualAmount(false);
    }
  };

  const handleAmountChange = (val) => {
    setAmount(val);
    setIsManualAmount(true);
  };

  const handleSelectQuickItem = (quickName) => {
    setItem(quickName);
    itemInputRef.current?.focus();
  };

  const handleSubmit = (e, addAnother = false) => {
    if (e) e.preventDefault();

    if (!item.trim()) {
      alert(`Please enter a valid ${isIncome ? 'income' : 'expense'} item name.`);
      itemInputRef.current?.focus();
      return;
    }

    const calculatedFinalAmount = isManualAmount
      ? parseFloat(amount) || 0
      : calculateEntryAmount(quantity, rate, amount);

    if (calculatedFinalAmount <= 0 && !amount) {
      alert('Please enter an amount or provide quantity and rate.');
      return;
    }

    const entryData = {
      id: editEntry?.id || generateUniqueId(isIncome ? 'inc' : 'exp'),
      item: item.trim(),
      description: description.trim(),
      quantity: quantity ? parseFloat(quantity) : null,
      unit: unit.trim(),
      rate: rate ? parseFloat(rate) : null,
      amount: calculatedFinalAmount,
      date: date || new Date().toISOString().slice(0, 10),
      category: showCustomCategory && customCategoryInput.trim() ? customCategoryInput.trim() : category,
      notes: notes.trim(),
    };

    onSaveEntry(entryData, isIncome, isEdit);

    if (addAnother && !isEdit) {
      // Clear form and refocus for next entry
      setItem('');
      setDescription('');
      setQuantity('');
      setUnit('');
      setRate('');
      setAmount('');
      setNotes('');
      setIsManualAmount(false);
      itemInputRef.current?.focus();
    } else {
      onClose();
    }
  };

  // Keyboard shortcut listener (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickItems = isIncome ? QUICK_INCOME_ITEMS : QUICK_EXPENSE_ITEMS;
  const headerTheme = isIncome 
    ? 'bg-[#1F3D2B] text-white' 
    : 'bg-[#181E1B] text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-[#E7E9E7] w-full max-w-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-2 ${headerTheme}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">
              {isIncome ? '₹+' : '₹-'}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold tracking-tight truncate">
                {isEdit ? `Edit ${isIncome ? 'Income' : 'Expense'} Entry` : `Add Custom ${isIncome ? 'Income' : 'Expense'}`}
              </h2>
              <p className="text-[11px] sm:text-xs text-white/70 truncate">
                {isIncome ? 'Record client payments, advances, or custom earnings' : 'Record raw materials, staff pay, fuel, or custom expenses'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-sm flex-1">
          
          {/* Quick Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#161B18] uppercase tracking-wider">
                {isIncome ? 'Income Item Name' : 'Expense Item Name'} <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#9D8050]" /> Quick suggestions
              </span>
            </div>

            <input
              ref={itemInputRef}
              type="text"
              required
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder={isIncome ? 'e.g., Event Payment, Advance, Extra Food Order' : 'e.g., Chicken, Transportation, Staff Payment, Ice, Gas'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] focus:border-transparent text-sm font-medium placeholder-gray-400"
            />

            {/* Quick Item Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickItems.slice(0, 6).map((qi) => (
                <button
                  key={qi}
                  type="button"
                  onClick={() => handleSelectQuickItem(qi)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                    item === qi
                      ? 'bg-[#1F3D2B] text-white border-[#1F3D2B]'
                      : 'bg-[#F9F6F0] text-[#4B5563] border-[#E5E7EB] hover:bg-[#EAE2D2] hover:text-[#161B18]'
                  }`}
                >
                  + {qi}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#161B18] uppercase tracking-wider mb-1.5">
                Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specific details, vendor name, etc."
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#161B18] uppercase tracking-wider">
                  Category <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomCategory(!showCustomCategory)}
                  className="text-[11px] text-[#9D8050] hover:underline font-medium"
                >
                  {showCustomCategory ? 'Pick existing' : '+ New Category'}
                </button>
              </div>

              {showCustomCategory ? (
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  placeholder="Type custom category name"
                  className="w-full px-3 py-2 rounded-xl border border-[#9D8050] focus:outline-none focus:ring-2 focus:ring-[#9D8050] text-sm"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm bg-white"
                >
                  <option value="">-- No Category --</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Calculation Block: Quantity x Rate -> Amount */}
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E7E9E7] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#161B18] uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#9D8050]" />
                Calculation Options
              </span>
              <span className="text-[11px] text-[#6B7280]">
                Qty & Rate are optional
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quantity */}
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="e.g., 50 or 30"
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm bg-white"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  list="unit-suggestions"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Plate, KG, etc."
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm bg-white"
                />
                <datalist id="unit-suggestions">
                  {COMMON_UNITS.map(u => <option key={u} value={u} />)}
                </datalist>
              </div>

              {/* Rate */}
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                  Rate per Unit (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={rate}
                  onChange={(e) => handleRateChange(e.target.value)}
                  placeholder="e.g., 200 or 180"
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm bg-white"
                />
              </div>
            </div>

            {/* Direct / Calculated Amount */}
            <div className="pt-2 border-t border-[#E7E9E7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-[#161B18] uppercase tracking-wider mb-1">
                  Final Amount (₹) <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-500">
                  {quantity && rate ? 'Auto-calculated: Qty × Rate' : 'Enter simple custom amount directly'}
                </p>
              </div>

              <div className="sm:w-56 relative">
                <span className="absolute left-3 top-2.5 text-base font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-3 py-2 rounded-xl border text-base font-bold focus:outline-none focus:ring-2 ${
                    isIncome 
                      ? 'border-emerald-300 text-[#1F3D2B] focus:ring-[#1F3D2B]' 
                      : 'border-red-300 text-red-700 focus:ring-red-600'
                  }`}
                />
              </div>
            </div>

            {amount ? (
              <div className="text-right text-xs font-medium text-gray-500">
                Formatted: <span className="font-bold text-[#161B18]">{formatINR(amount)}</span>
              </div>
            ) : null}
          </div>

          {/* Date & Notes Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#161B18] uppercase tracking-wider mb-1.5">
                Entry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#161B18] uppercase tracking-wider mb-1.5">
                Notes / Reference <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment mode, bill number, etc."
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm"
              />
            </div>
          </div>

        </form>

        {/* Modal Footer / Fast Action Buttons */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E7E9E7] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#161B18] hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel (Esc)
          </button>

          <div className="flex items-center gap-2">
            {!isEdit && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-4 py-2 text-xs font-semibold text-[#1F3D2B] bg-[#EBF5EE] hover:bg-[#D7EBDD] rounded-xl transition-colors border border-[#1F3D2B]/20 flex items-center gap-1.5"
                title="Save this entry and immediately open blank form for next item"
              >
                <Plus className="w-3.5 h-3.5" />
                Save & Add Another
              </button>
            )}

            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                isIncome 
                  ? 'bg-[#1F3D2B] hover:bg-[#14281C]' 
                  : 'bg-[#181E1B] hover:bg-black'
              }`}
            >
              <Check className="w-4 h-4" />
              {isEdit ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

