import React, { useState } from 'react';

const AdminFilterBar = ({ 
  onSearch, 
  onFilterChange, 
  searchPlaceholder = "Search...",
  filters = [],
  showDateRange = false,
  showStatusFilter = false,
  statusOptions = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...selectedFilters, [filterKey]: value };
    setSelectedFilters(newFilters);
    if (onFilterChange) onFilterChange(newFilters);
  };

  const handleDateChange = (type, value) => {
    const newDateRange = { ...dateRange, [type]: value };
    setDateRange(newDateRange);
    if (onFilterChange) onFilterChange({ ...selectedFilters, dateRange: newDateRange });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFilters({});
    setDateRange({ start: '', end: '' });
    if (onSearch) onSearch('');
    if (onFilterChange) onFilterChange({});
  };

  const hasActiveFilters = searchTerm || Object.keys(selectedFilters).length > 0 || dateRange.start || dateRange.end;

  return (
    <div className="bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-700 mb-6 shadow-lg">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              className="w-full px-4 py-3 pl-12 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-transparent transition-all"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
              🔍
            </span>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  if (onSearch) onSearch('');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Custom Filters */}
        {filters.map((filter) => (
          <div key={filter.key} className="lg:w-48">
            <select
              value={selectedFilters[filter.key] || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-transparent cursor-pointer"
            >
              <option value="">All {filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Status Filter */}
        {showStatusFilter && statusOptions.length > 0 && (
          <div className="lg:w-48">
            <select
              value={selectedFilters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-transparent cursor-pointer"
            >
              <option value="">All Status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range */}
        {showDateRange && (
          <>
            <div className="lg:w-40">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-transparent"
                placeholder="Start Date"
              />
            </div>
            <div className="lg:w-40">
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-transparent"
                placeholder="End Date"
              />
            </div>
          </>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 rounded-lg transition-colors font-medium whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="px-3 py-1 bg-success-500/20 text-success-400 rounded-full text-sm flex items-center gap-2">
              Search: "{searchTerm}"
              <button
                onClick={() => {
                  setSearchTerm('');
                  if (onSearch) onSearch('');
                }}
                className="hover:text-success-300"
              >
                ✕
              </button>
            </span>
          )}
          {Object.entries(selectedFilters).map(([key, value]) => {
            if (!value || key === 'dateRange') return null;
            const filter = filters.find(f => f.key === key);
            const option = filter?.options.find(o => o.value === value);
            return (
              <span key={key} className="px-3 py-1 bg-success-500/20 text-success-400 rounded-full text-sm flex items-center gap-2">
                {filter?.label}: {option?.label || value}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="hover:text-success-300"
                >
                  ✕
                </button>
              </span>
            );
          })}
          {(dateRange.start || dateRange.end) && (
            <span className="px-3 py-1 bg-success-500/20 text-success-400 rounded-full text-sm flex items-center gap-2">
              Date: {dateRange.start || '...'} to {dateRange.end || '...'}
              <button
                onClick={() => {
                  setDateRange({ start: '', end: '' });
                  if (onFilterChange) onFilterChange({ ...selectedFilters, dateRange: { start: '', end: '' } });
                }}
                className="hover:text-success-400"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFilterBar;

