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
    <div className="filter-toolbar-container">
      {/* Top Search & Sort Row */}
      <div className="filter-search-row">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by Order # (e.g. 1001), Tracking ID, Package title, Customer email, Route..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => onSearchChange('')}>
              ✕
            </button>
          )}
        </div>

        <div className="sort-controls">
          <label className="sort-label">Sort by:</label>
          <select
            className="sort-select"
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
      <div className="status-tabs-row">
        <div className="status-tabs-scroll">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              className={`status-tab-btn ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => onStatusFilterChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="total-badge-indicator">
          Showing <strong>{totalCount}</strong> Shipments
        </div>
      </div>
    </div>
  );
}
