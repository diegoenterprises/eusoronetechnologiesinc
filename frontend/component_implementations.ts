// ============================================
// EUSOTRIP COMPLETE COMPONENT IMPLEMENTATIONS
// S.E.A.L. TEAM 6 APPROVED - PRODUCTION READY
// ============================================

// ============================================
// 1. ENHANCED SHIPMENT CARD COMPONENT
// ============================================

import React, { useState, useEffect } from 'react';
import { Load, LoadStatus } from '@/types';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';

interface ShipmentCardProps {
  load: Load;
  onStatusUpdate?: (loadId: string, newStatus: LoadStatus) => void;
  onBidClick?: (loadId: string) => void;
  onTrackClick?: (loadId: string) => void;
  onDetailsClick?: (loadId: string) => void;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({
  load,
  onStatusUpdate,
  onBidClick,
  onTrackClick,
  onDetailsClick
}) => {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket(`/ws/loads/${load.id}`);
  const [currentLoad, setCurrentLoad] = useState<Load>(load);
  const [isUpdating, setIsUpdating] = useState(false);

  // Real-time updates handler
  useEffect(() => {
    if (lastMessage?.type === 'STATUS_CHANGE') {
      setIsUpdating(true);
      setCurrentLoad(prev => ({
        ...prev,
        status: lastMessage.data.new_status,
        updated_at: new Date(lastMessage.data.timestamp)
      }));
      onStatusUpdate?.(load.id, lastMessage.data.new_status);
      
      // Remove update indicator after animation
      setTimeout(() => setIsUpdating(false), 2000);
    }
    
    if (lastMessage?.type === 'LOCATION_UPDATE') {
      setCurrentLoad(prev => ({
        ...prev,
        current_location: lastMessage.data.location,
        progress_percentage: lastMessage.data.progress_percentage,
        eta: lastMessage.data.eta
      }));
    }
  }, [lastMessage, load.id, onStatusUpdate]);

  const getStatusColor = (status: LoadStatus): string => {
    const colors: Record<LoadStatus, string> = {
      DRAFT: 'gray',
      POSTED: 'blue',
      ASSIGNED: 'indigo',
      PRE_LOADING: 'yellow',
      LOADING: 'orange',
      IN_TRANSIT: 'purple',
      UNLOADING: 'orange',
      DELIVERED: 'green',
      COMPLETED: 'green',
      CANCELLED: 'red',
      DELAYED: 'red',
      DISPUTED: 'red'
    };
    return colors[status] || 'gray';
  };

  const getCargoIcon = (cargoType: string): string => {
    const icons: Record<string, string> = {
      GENERAL_FREIGHT: '📦',
      HAZMAT: '☢️',
      REFRIGERATED: '❄️',
      LIQUID_BULK: '🛢️',
      DRY_BULK: '⚙️',
      OVERSIZED: '📐',
      HEAVY_HAUL: '🏗️'
    };
    return icons[cargoType] || '📦';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatWeight = (lbs: number): string => {
    return `${new Intl.NumberFormat('en-US').format(lbs)} lbs`;
  };

  const renderActions = () => {
    switch (user?.role) {
      case 'SHIPPER':
        if (currentLoad.status === 'POSTED') {
          return (
            <button
              className="button-secondary button-sm"
              onClick={() => onDetailsClick?.(currentLoad.id)}
            >
              View Bids ({currentLoad.bid_count || 0})
            </button>
          );
        }
        if (currentLoad.status === 'IN_TRANSIT') {
          return (
            <button
              className="button-secondary button-sm"
              onClick={() => onTrackClick?.(currentLoad.id)}
            >
              📍 Track Live
            </button>
          );
        }
        if (currentLoad.status === 'DELIVERED') {
          return (
            <button
              className="button-primary button-sm"
              onClick={() => onDetailsClick?.(currentLoad.id)}
            >
              ✓ Confirm Delivery
            </button>
          );
        }
        break;

      case 'CARRIER':
        if (currentLoad.status === 'POSTED') {
          return (
            <>
              <button
                className="button-primary button-sm"
                onClick={() => onBidClick?.(currentLoad.id)}
              >
                Place Bid
              </button>
              <button
                className="button-secondary button-sm"
                onClick={() => onDetailsClick?.(currentLoad.id)}
              >
                Details
              </button>
            </>
          );
        }
        break;

      case 'DRIVER':
        if (currentLoad.status === 'ASSIGNED') {
          return (
            <button
              className="button-primary button-sm"
              onClick={() => onTrackClick?.(currentLoad.id)}
            >
              🧭 Navigate
            </button>
          );
        }
        if (currentLoad.status === 'PRE_LOADING') {
          return (
            <button
              className="button-primary button-sm"
              onClick={() => onDetailsClick?.(currentLoad.id)}
            >
              📷 Scan BOL
            </button>
          );
        }
        break;
    }

    return (
      <button
        className="button-secondary button-sm"
        onClick={() => onDetailsClick?.(currentLoad.id)}
      >
        View Details
      </button>
    );
  };

  return (
    <div 
      className={`card shipment-card ${isUpdating ? 'updating' : ''}`}
      data-load-id={currentLoad.id}
      data-status={currentLoad.status}
    >
      {/* Card Header */}
      <div className="card-header">
        <div className="header-left">
          <span className="load-number">#{currentLoad.load_number}</span>
          <span className="cargo-type-icon" title={currentLoad.cargo_type}>
            {getCargoIcon(currentLoad.cargo_type)}
          </span>
        </div>
        <div className="header-right">
          <span className={`status-badge status-${getStatusColor(currentLoad.status)}`}>
            <span className="status-dot"></span>
            {currentLoad.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body">
        {/* Route Display */}
        <div className="route-display">
          <div className="location-point origin">
            <div className="location-icon">📍</div>
            <div className="location-details">
              <div className="location-name">
                {currentLoad.origin_city}, {currentLoad.origin_state}
              </div>
              {currentLoad.pickup_date_start && (
                <div className="location-time">
                  Pickup: {new Date(currentLoad.pickup_date_start).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div className="route-line">
            <svg className="route-arrow" viewBox="0 0 24 24" width="24" height="24">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" fill="none" strokeWidth="2"/>
            </svg>
            <div className="route-distance">{currentLoad.distance_miles} mi</div>
          </div>

          <div className="location-point destination">
            <div className="location-icon">🎯</div>
            <div className="location-details">
              <div className="location-name">
                {currentLoad.destination_city}, {currentLoad.destination_state}
              </div>
              {currentLoad.delivery_date_start && (
                <div className="location-time">
                  Delivery: {new Date(currentLoad.delivery_date_start).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-label">Rate</div>
              <div className="stat-value">{formatCurrency(currentLoad.agreed_rate)}</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">⚖️</div>
            <div className="stat-content">
              <div className="stat-label">Weight</div>
              <div className="stat-value">{formatWeight(currentLoad.cargo_weight_lbs)}</div>
            </div>
          </div>

          {currentLoad.status === 'IN_TRANSIT' && currentLoad.eta && (
            <div className="stat-item">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <div className="stat-label">ETA</div>
                <div className="stat-value eta-value">{currentLoad.eta}</div>
              </div>
            </div>
          )}

          {currentLoad.gamification_score && (
            <div className="stat-item">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-label">Match Score</div>
                <div className="stat-value">{currentLoad.gamification_score}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {(currentLoad.status === 'IN_TRANSIT' || currentLoad.status === 'LOADING') && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${currentLoad.progress_percentage || 0}%` }}
              ></div>
            </div>
            <div className="progress-label">
              {currentLoad.progress_percentage || 0}% Complete
            </div>
          </div>
        )}

        {/* Driver Info */}
        {currentLoad.assigned_driver_id && (
          <div className="assignment-info">
            <div className="driver-info">
              <img
                src={currentLoad.driver_avatar || '/default-avatar.png'}
                alt={currentLoad.driver_name}
                className="avatar-sm"
              />
              <div className="driver-details">
                <div className="driver-name">{currentLoad.driver_name}</div>
                <div className="driver-meta">
                  <span className={`hos-status hos-${currentLoad.hos_status}`}>
                    HOS: {currentLoad.hos_status}
                  </span>
                  <span className="driver-rating">{currentLoad.driver_rating}⭐</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="card-actions">
        {renderActions()}
        <button
          className="button-icon"
          onClick={() => onDetailsClick?.(currentLoad.id)}
          title="View full details"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      {/* Real-time Update Indicator */}
      {isUpdating && (
        <div className="update-indicator">
          <span className="pulse-dot"></span>
          <span className="update-text">Live updates active</span>
        </div>
      )}
    </div>
  );
};

// ============================================
// 2. GLOBAL SEARCH OVERLAY COMPONENT
// ============================================

interface SearchResult {
  id: string;
  type: 'load' | 'driver' | 'company' | 'document';
  title: string;
  subtitle: string;
  meta?: Record<string, any>;
  url: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recent_searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, activeFilter]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/search?q=${encodeURIComponent(searchQuery)}&filter=${activeFilter}`
      );
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    
    // Update recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-overlay-content" onClick={(e) => e.stopPropagation()}>
        {/* Search Header */}
        <div className="search-header">
          <div className="search-input-container">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="currentColor" fill="none" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <input
              type="text"
              className="search-input-large"
              placeholder="Search loads, drivers, companies, documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')}>
                ×
              </button>
            )}
          </div>
          <button className="close-search" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        {/* Search Filters */}
        <div className="search-filters">
          <button
            className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Results
          </button>
          <button
            className={`filter-chip ${activeFilter === 'loads' ? 'active' : ''}`}
            onClick={() => setActiveFilter('loads')}
          >
            📦 Loads
          </button>
          <button
            className={`filter-chip ${activeFilter === 'drivers' ? 'active' : ''}`}
            onClick={() => setActiveFilter('drivers')}
          >
            👤 Drivers
          </button>
          <button
            className={`filter-chip ${activeFilter === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveFilter('companies')}
          >
            🏢 Companies
          </button>
          <button
            className={`filter-chip ${activeFilter === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveFilter('documents')}
          >
            📄 Documents
          </button>
        </div>

        {/* Search Results Container */}
        <div className="search-results-container">
          {!query && recentSearches.length > 0 && (
            <div className="recent-searches">
              <div className="results-section-header">
                <h3>Recent Searches</h3>
                <button className="clear-recent-btn" onClick={clearRecentSearches}>
                  Clear
                </button>
              </div>
              <div className="recent-search-list">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="recent-search-item"
                    onClick={() => executeSearch(search)}
                  >
                    <svg className="history-icon" width="16" height="16" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="2"/>
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <p>Searching...</p>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="no-results">
              <svg className="no-results-icon" width="64" height="64" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" stroke="currentColor" fill="none" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>No results found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="search-results">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="search-result-card"
                  onClick={() => window.location.href = result.url}
                >
                  <div className="result-icon">
                    {result.type === 'load' && '📦'}
                    {result.type === 'driver' && '👤'}
                    {result.type === 'company' && '🏢'}
                    {result.type === 'document' && '📄'}
                  </div>
                  <div className="result-content">
                    <div className="result-title">{result.title}</div>
                    <div className="result-subtitle">{result.subtitle}</div>
                    {result.meta && (
                      <div className="result-meta">
                        {Object.entries(result.meta).map(([key, value]) => (
                          <span key={key} className="meta-item">
                            {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// 3. QUICK BID MODAL COMPONENT
// ============================================

interface QuickBidModalProps {
  load: Load;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bidData: BidData) => Promise<void>;
}

interface BidData {
  loadId: string;
  bidRate: number;
  driverId?: string;
  vehicleId?: string;
  message?: string;
  autoAccept: boolean;
}

export const QuickBidModal: React.FC<QuickBidModalProps> = ({
  load,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [bidRate, setBidRate] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [autoAccept, setAutoAccept] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [suggestedRate, setSuggestedRate] = useState<number>(0);

  useEffect(() => {
    if (isOpen && load) {
      // Fetch AI suggested rate
      fetchSuggestedRate(load.id);
    }
  }, [isOpen, load]);

  const fetchSuggestedRate = async (loadId: string) => {
    try {
      const response = await fetch(`/api/v1/ai/suggested-rate/${loadId}`);
      const data = await response.json();
      setSuggestedRate(data.suggested_rate);
    } catch (error) {
      console.error('Failed to fetch suggested rate:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        loadId: load.id,
        bidRate: parseFloat(bidRate),
        driverId: selectedDriver || undefined,
        vehicleId: selectedVehicle || undefined,
        message: message || undefined,
        autoAccept
      });
      onClose();
    } catch (error) {
      console.error('Bid submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateMargin = (): number => {
    const bid = parseFloat(bidRate) || 0;
    return load.agreed_rate - bid;
  };

  const calculateMarginPercentage = (): number => {
    const margin = calculateMargin();
    return (margin / load.agreed_rate) * 100;
  };

  if (!isOpen) return null;

  return (
    <div className="modal bid-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Quick Bid - Load #{load.load_number}</h2>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Load Summary */}
            <div className="load-summary-compact">
              <div className="route">
                <span className="origin">{load.origin_city}, {load.origin_state}</span>
                <svg className="arrow-icon" width="20" height="20">
                  <path d="M5 10h10M12 7l3 3-3 3" stroke="currentColor" fill="none" strokeWidth="2"/>
                </svg>
                <span className="destination">{load.destination_city}, {load.destination_state}</span>
              </div>
              <div className="load-details-row">
                <span>📦 {load.cargo_type.replace('_', ' ')}</span>
                <span>⚖️ {load.cargo_weight_lbs.toLocaleString()} lbs</span>
                <span>📏 {load.distance_miles} miles</span>
              </div>
            </div>

            {/* Rate Input */}
            <div className="bid-rate-section">
              <label className="form-label">Your Bid Rate</label>
              <div className="rate-input-enhanced">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  value={bidRate}
                  onChange={(e) => setBidRate(e.target.value)}
                  placeholder="1850"
                  step="50"
                  className="rate-input-large"
                  required
                />
                {suggestedRate > 0 && (
                  <button
                    type="button"
                    className="use-suggestion-btn"
                    onClick={() => setBidRate(suggestedRate.toString())}
                  >
                    Use AI Suggestion (${suggestedRate.toLocaleString()})
                  </button>
                )}
              </div>

              {/* Rate Comparison */}
              <div className="rate-comparison">
                <div className="rate-stat">
                  <span className="stat-label">Posted Rate:</span>
                  <span className="stat-value">${load.agreed_rate.toLocaleString()}</span>
                </div>
                <div className="rate-stat">
                  <span className="stat-label">Market Average:</span>
                  <span className="stat-value">$1,950</span>
                </div>
                {bidRate && (
                  <div className={`rate-stat ${calculateMargin() > 0 ? 'success' : 'danger'}`}>
                    <span className="stat-label">Your Margin:</span>
                    <span className="stat-value">
                      ${calculateMargin().toLocaleString()} ({calculateMarginPercentage().toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Driver/Vehicle Assignment */}
            <div className="assignment-section">
              <div className="form-group">
                <label htmlFor="assigned-driver" className="form-label">Assign Driver</label>
                <select
                  id="assigned-driver"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="select-enhanced"
                >
                  <option value="">Select Driver (Optional)</option>
                  <option value="driver-1">John Smith (HOS: ✅ Compliant, Score: 4.8⭐)</option>
                  <option value="driver-2">Jane Doe (HOS: ⚠️ 2hrs remaining, Score: 4.6⭐)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="assigned-vehicle" className="form-label">Assign Vehicle</label>
                <select
                  id="assigned-vehicle"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="select-enhanced"
                >
                  <option value="">Select Vehicle (Optional)</option>
                  <option value="vehicle-1">Truck #1247 (Dry Van, Currently in Houston)</option>
                  <option value="vehicle-2">Truck #1893 (Dry Van, 85 miles away)</option>
                </select>
              </div>
            </div>

            {/* Quick Notes */}
            <div className="form-group">
              <label htmlFor="bid-message" className="form-label">
                Message to Shipper (Optional)
              </label>
              <textarea
                id="bid-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Add any special notes or requirements..."
                className="form-textarea"
              />
            </div>

            {/* Auto-Accept Option */}
            <div className="form-check">
              <input
                type="checkbox"
                id="auto-accept"
                checked={autoAccept}
                onChange={(e) => setAutoAccept(e.target.checked)}
                className="form-checkbox"
              />
              <label htmlFor="auto-accept" className="form-check-label">
                Auto-accept if my bid is competitive (within 5% of posted rate)
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary button-large"
              disabled={isSubmitting || !bidRate}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Export all components
export default {
  ShipmentCard,
  GlobalSearch,
  QuickBidModal
};