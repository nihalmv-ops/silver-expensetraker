import React, { useState } from 'react';
import { Search, Filter, Calendar, X, Tag } from 'lucide-react';

export default function SearchAndFilterBar({
  searchQuery,
  onSearchChange,
  activeTypeTab, // 'all' | 'income' | 'expense'
  onTypeTabChange,
  dateFilter, // 'all' | 'today' | 'week' | 'month' | 'custom'
  onDateFilterChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  categoryFilter,
  onCategoryFilterChange,
  availableCategories = [],
  incomeCount = 0,
  expenseCount = 0,
}) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasActiveFilters = searchQuery || dateFilter !== 'all' || categoryFilter;

  const handleClearAll = () => {
    onSearchChange('');
    onDateFilterChange('all');
    onCategoryFilterChange('');
    if (onCustomStartDateChange) onCustomStartDateChange('');
    if (onCustomEndDateChange) onCustomEndDateChange('');
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E7E9E7] shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-6 space-y-3">
      
      {/* Top Row: Search Input + Type Tabs + Filter Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search entries by item name, description, category..."
            className="w-full pl-9.5 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] bg-[#FAF9F6] focus:bg-white transition-all placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* View / Type Tabs */}
          <div className="grid grid-cols-3 sm:flex items-center bg-[#F3F4F6] p-1 rounded-xl flex-1 sm:flex-initial">
            <button
              onClick={() => onTypeTabChange('all')}
              className={`px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                activeTypeTab === 'all'
                  ? 'bg-white text-[#161B18] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              All ({incomeCount + expenseCount})
            </button>

            <button
              onClick={() => onTypeTabChange('income')}
              className={`px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                activeTypeTab === 'income'
                  ? 'bg-[#1F3D2B] text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Income ({incomeCount})
            </button>

            <button
              onClick={() => onTypeTabChange('expense')}
              className={`px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                activeTypeTab === 'expense'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Expense ({expenseCount})
            </button>
          </div>

          {/* Advanced Filters Toggle Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all shrink-0 cursor-pointer ${
              showAdvancedFilters || hasActiveFilters
                ? 'bg-[#FAF6EE] text-[#9D8050] border-[#9D8050]/40'
                : 'bg-white text-gray-600 border-[#E5E7EB] hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#9D8050]" />
            )}
          </button>
        </div>

      </div>

      {/* Advanced Filter Drawer / Options */}
      {showAdvancedFilters && (
        <div className="pt-3 border-t border-[#F0F2F0] grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
          
          {/* Date Filter Quick Choices */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#9D8050]" /> Date Filter
            </label>
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F3D2B]"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#9D8050]" /> Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F3D2B]"
            >
              <option value="">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearAll}
                className="w-full py-1.5 px-3 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
              >
                Clear All Filters
              </button>
            ) : (
              <span className="text-[11px] text-gray-400 italic py-2">
                No filters currently applied
              </span>
            )}
          </div>

          {/* Custom Date Range Pickers if selected */}
          {dateFilter === 'custom' && (
            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate || ''}
                  onChange={(e) => onCustomStartDateChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate || ''}
                  onChange={(e) => onCustomEndDateChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs bg-white"
                />
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

