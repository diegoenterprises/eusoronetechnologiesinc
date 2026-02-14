/**
 * BID MANAGEMENT INTERFACE - REAL-TIME
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Comprehensive bid management for shippers and catalysts with real-time
 * notifications, bid comparison, and acceptance workflow.
 */

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, TrendingDown, CheckCircle, XCircle, Clock, AlertCircle,
  DollarSign, Users, MapPin, Zap, Filter, SortAsc, MessageSquare,
  Phone, Mail, Star, Shield, Truck
} from 'lucide-react';

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN';

export interface Bid {
  id: string;
  loadId: string;
  catalystId: string;
  catalystName: string;
  catalystRating: number;
  catalystReviews: number;
  rate: number;
  estimatedPickup: Date;
  estimatedDelivery: Date;
  status: BidStatus;
  submittedAt: Date;
  expiresAt: Date;
  vehicleType: string;
  driverCount: number;
  insuranceIncluded: boolean;
  specialCapabilities?: string[];
  notes?: string;
  contactPhone?: string;
  contactEmail?: string;
}

interface BidManagementInterfaceProps {
  loadId: string;
  bids: Bid[];
  userRole?: 'SHIPPER' | 'CATALYST';
  onAcceptBid?: (bidId: string) => void;
  onRejectBid?: (bidId: string) => void;
  onWithdrawBid?: (bidId: string) => void;
  onContactCatalyst?: (catalystId: string) => void;
}

type SortOption = 'rate-asc' | 'rate-desc' | 'rating' | 'newest';
type FilterOption = 'all' | 'pending' | 'accepted' | 'rejected' | 'expired';

export const BidManagementInterface: React.FC<BidManagementInterfaceProps> = ({
  loadId,
  bids,
  userRole = 'SHIPPER',
  onAcceptBid,
  onRejectBid,
  onWithdrawBid,
  onContactCatalyst,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('rate-asc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [expandedBid, setExpandedBid] = useState<string | null>(null);

  // Filter bids
  const filteredBids = useMemo(() => {
    return bids.filter(bid => {
      if (filterBy === 'all') return true;
      return bid.status.toLowerCase() === filterBy;
    });
  }, [bids, filterBy]);

  // Sort bids
  const sortedBids = useMemo(() => {
    const sorted = [...filteredBids];
    
    switch (sortBy) {
      case 'rate-asc':
        return sorted.sort((a, b) => a.rate - b.rate);
      case 'rate-desc':
        return sorted.sort((a, b) => b.rate - a.rate);
      case 'rating':
        return sorted.sort((a, b) => b.catalystRating - a.catalystRating);
      case 'newest':
        return sorted.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      default:
        return sorted;
    }
  }, [filteredBids, sortBy]);

  const getStatusColor = (status: BidStatus): string => {
    const colors: Record<BidStatus, string> = {
      PENDING: 'bg-yellow-600',
      ACCEPTED: 'bg-green-600',
      REJECTED: 'bg-red-600',
      EXPIRED: 'bg-gray-600',
      WITHDRAWN: 'bg-gray-600',
    };
    return colors[status] || 'bg-gray-600';
  };

  const getStatusIcon = (status: BidStatus) => {
    const icons: Record<BidStatus, React.ComponentType<any>> = {
      PENDING: Clock,
      ACCEPTED: CheckCircle,
      REJECTED: XCircle,
      EXPIRED: AlertCircle,
      WITHDRAWN: XCircle,
    };
    return icons[status] || Clock;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRateComparison = (rate: number): { avgRate: number; difference: number; percentDiff: number } => {
    const avgRate = filteredBids.reduce((sum, bid) => sum + bid.rate, 0) / (filteredBids.length || 1);
    const difference = rate - avgRate;
    const percentDiff = (difference / avgRate) * 100;
    return { avgRate, difference, percentDiff };
  };

  const getTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = new Date(expiresAt).getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return 'Expired';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Bid Management</h2>
        <p className="text-gray-400">
          {sortedBids.length} bid{sortedBids.length !== 1 ? 's' : ''} received
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterBy}
            onChange={e => setFilterBy(e.target.value as FilterOption)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Bids</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <SortAsc size={16} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="rate-asc">Rate (Low to High)</option>
            <option value="rate-desc">Rate (High to Low)</option>
            <option value="rating">Catalyst Rating</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Bids List */}
      {sortedBids.length === 0 ? (
        <Card className="bg-gray-900 border-gray-700 p-8 text-center">
          <AlertCircle size={32} className="text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No bids found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedBids.map(bid => {
            const comparison = getRateComparison(bid.rate);
            const isExpanded = expandedBid === bid.id;
            const isSelected = selectedBid === bid.id;
            const StatusIcon = getStatusIcon(bid.status);
            const timeRemaining = getTimeRemaining(bid.expiresAt);

            return (
              <Card
                key={bid.id}
                className={`bg-gray-900 border-2 transition cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/50'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setSelectedBid(bid.id)}
              >
                <div className="p-4">
                  {/* Main bid info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Catalyst info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{bid.catalystName}</h3>
                          <div className={`${getStatusColor(bid.status)} rounded-full px-2 py-1 flex items-center gap-1`}>
                            <StatusIcon size={14} className="text-white" />
                            <span className="text-xs font-semibold text-white">{bid.status}</span>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < Math.floor(bid.catalystRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-400">
                            {bid.catalystRating.toFixed(1)} ({bid.catalystReviews} reviews)
                          </span>
                        </div>

                        {/* Quick info */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Truck size={14} className="text-blue-400" />
                            {bid.vehicleType}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Users size={14} className="text-green-400" />
                            {bid.driverCount} driver{bid.driverCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Rate */}
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-400 mb-1">
                          {formatCurrency(bid.rate)}
                        </p>
                        <div className={`text-sm font-semibold flex items-center justify-end gap-1 ${
                          comparison.difference < 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {comparison.difference < 0 ? (
                            <TrendingDown size={14} />
                          ) : (
                            <TrendingUp size={14} />
                          )}
                          {Math.abs(comparison.percentDiff).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Expand button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setExpandedBid(isExpanded ? null : bid.id);
                      }}
                      className="ml-4 p-2 hover:bg-gray-800 rounded transition"
                    >
                      <Zap size={20} className={`transition ${isExpanded ? 'text-blue-400' : 'text-gray-400'}`} />
                    </button>
                  </div>

                  {/* Timeline info */}
                  <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-700">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Pickup</p>
                      <p className="text-sm font-medium text-white">{formatDate(bid.estimatedPickup)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Delivery</p>
                      <p className="text-sm font-medium text-white">{formatDate(bid.estimatedDelivery)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Expires In</p>
                      <p className={`text-sm font-medium ${
                        bid.status === 'EXPIRED' ? 'text-red-400' : 'text-white'
                      }`}>
                        {timeRemaining}
                      </p>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="space-y-4 mb-4 pb-4 border-b border-gray-700">
                      {/* Capabilities */}
                      {bid.specialCapabilities && bid.specialCapabilities.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-2">Special Capabilities</p>
                          <div className="flex flex-wrap gap-2">
                            {bid.specialCapabilities.map(cap => (
                              <span key={cap} className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded border border-blue-700/50">
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Insurance */}
                      {bid.insuranceIncluded && (
                        <div className="flex items-center gap-2 text-green-400">
                          <Shield size={16} />
                          <span className="text-sm">Insurance Included</span>
                        </div>
                      )}

                      {/* Notes */}
                      {bid.notes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-1">Notes</p>
                          <p className="text-sm text-gray-300 bg-gray-800 p-2 rounded">{bid.notes}</p>
                        </div>
                      )}

                      {/* Contact info */}
                      {(bid.contactPhone || bid.contactEmail) && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-2">Contact Information</p>
                          <div className="space-y-1">
                            {bid.contactPhone && (
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Phone size={14} className="text-blue-400" />
                                {bid.contactPhone}
                              </div>
                            )}
                            {bid.contactEmail && (
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Mail size={14} className="text-blue-400" />
                                {bid.contactEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {userRole === 'SHIPPER' && bid.status === 'PENDING' && (
                      <>
                        <Button
                          onClick={() => onAcceptBid?.(bid.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle size={16} className="mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => onRejectBid?.(bid.id)}
                          variant="outline"
                          className="flex-1 text-gray-300"
                        >
                          <XCircle size={16} className="mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {userRole === 'CATALYST' && bid.status === 'PENDING' && (
                      <Button
                        onClick={() => onWithdrawBid?.(bid.id)}
                        variant="outline"
                        className="flex-1 text-gray-300"
                      >
                        <XCircle size={16} className="mr-1" />
                        Withdraw
                      </Button>
                    )}

                    {bid.status !== 'REJECTED' && bid.status !== 'EXPIRED' && (
                      <Button
                        onClick={() => onContactCatalyst?.(bid.catalystId)}
                        variant="outline"
                        className="flex-1 text-gray-300"
                      >
                        <MessageSquare size={16} className="mr-1" />
                        Contact
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary stats */}
      {sortedBids.length > 0 && (
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Lowest Rate</p>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(Math.min(...sortedBids.map(b => b.rate)))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Highest Rate</p>
              <p className="text-lg font-bold text-red-400">
                {formatCurrency(Math.max(...sortedBids.map(b => b.rate)))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Average Rate</p>
              <p className="text-lg font-bold text-blue-400">
                {formatCurrency(sortedBids.reduce((sum, b) => sum + b.rate, 0) / sortedBids.length)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Avg Rating</p>
              <p className="text-lg font-bold text-yellow-400">
                {(sortedBids.reduce((sum, b) => sum + b.catalystRating, 0) / sortedBids.length).toFixed(1)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BidManagementInterface;

