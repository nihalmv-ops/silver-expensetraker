/**
 * Indian Rupee (INR) currency formatting and parsing utilities.
 * Follows Indian number numbering system (Lakhs, Crores):
 * e.g., ₹1,500.00, ₹10,000.00, ₹1,25,000.00, ₹12,50,000.00
 */

export function formatINR(amount, options = {}) {
  const {
    includeSymbol = true,
    showSign = false,
    fractionDigits = 2,
    fallback = '₹0.00'
  } = options;

  if (amount === undefined || amount === null || isNaN(amount)) {
    return fallback;
  }

  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(absNum);

  const prefix = includeSymbol ? '₹' : '';

  if (isNegative) {
    return `-${prefix}${formatted}`;
  }

  if (showSign && num > 0) {
    return `+${prefix}${formatted}`;
  }

  return `${prefix}${formatted}`;
}

export function parseNumber(value) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  // Strip out currency symbols, commas and extra spaces
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function calculateEntryAmount(quantity, rate, manualAmount) {
  const q = parseNumber(quantity);
  const r = parseNumber(rate);

  if (q > 0 && r > 0) {
    return Math.round(q * r * 100) / 100;
  }

  return parseNumber(manualAmount);
}

