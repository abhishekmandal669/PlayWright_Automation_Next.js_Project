'use client';

export default function OrderFilterToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  totalCount = 0,
}) {
  const statusTabs = [
    { key: 'ALL', label: 'All Orders' },
    { key: 'PICKUP_PENDING', label: 'Pickup Pending' },
    { key: 'WAREHOUSE_ARRIVED', label: 'In Warehouse' },
    { key: 'DISPATCHED', label: 'Dispatched' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  return (
    <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-3 sm:p-4 space-y-3 font-['IBM_Plex_Sans'] shadow-sm">
      {/* Top Search & Sort Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-3 text-xs text-[var(--muted)] pointer-events-none">🔍</span>
          <input
            type="text"
            className="w-full pl-8 pr-8 py-2 text-xs sm:text-[13px] bg-[var(--paper)] border border-[var(--line)] rounded-lg text-[var(--ink)] placeholder-[var(--muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 transition-all"
            placeholder="Search by Order # (e.g. 1001), Tracking ID, Package, Email, Route..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute right-2.5 text-xs text-[var(--muted)] hover:text-[var(--ink)] font-bold p-1"
              onClick={() => onSearchChange('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] whitespace-nowrap">Sort:</label>
          <select
            className="text-xs sm:text-[13px] bg-[var(--paper)] border border-[var(--line)] rounded-lg px-2.5 py-2 text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--blue)]"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="newest">🕒 Newest First</option>
            <option value="oldest">⏳ Oldest First</option>
            <option value="price_high">💰 Price (High → Low)</option>
            <option value="price_low">💵 Price (Low → High)</option>
            <option value="weight_high">⚖️ Weight (Heavy → Light)</option>
          </select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2 border-t border-[var(--line)]">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-all border ${
                statusFilter === tab.key
                  ? 'bg-[var(--chip-bg)] text-[var(--chip-text)] border-[var(--chip-text)]/30 font-semibold shadow-sm'
                  : 'bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--paper)] hover:text-[var(--ink)]'
              }`}
              onClick={() => onStatusFilterChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-[var(--muted)] font-medium self-end sm:self-auto whitespace-nowrap">
          Showing <strong className="text-[var(--ink)]">{totalCount}</strong> Shipments
        </div>
      </div>
    </div>
  );
}
