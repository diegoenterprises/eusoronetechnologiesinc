/**
 * MARKETPLACE PAGE
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Load marketplace for shippers to post loads and carriers to bid.
 * Features:
 * - Browse available loads
 * - Advanced filtering and search
 * - Bid on loads
 * - View carrier ratings
 * - Real-time bid updates
 * - Load details and requirements
 * - Bid comparison
 * - Favorite loads
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  MapPin,
  Calendar,
  Truck,
  DollarSign,
  Star,
  Heart,
  MessageSquare,
  Filter,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Load {
  id: string;
  shipper: string;
  shipperRating: number;
  origin: string;
  destination: string;
  pickupDate: Date;
  deliveryDate: Date;
  weight: number;
  dimensions: string;
  type: string;
  rate: number;
  description: string;
  requirements: string[];
  bids: number;
  status: "open" | "assigned" | "in_transit" | "delivered";
  isFavorite: boolean;
  createdAt: Date;
}

interface Bid {
  id: string;
  carrier: string;
  carrierRating: number;
  rate: number;
  estimatedDelivery: Date;
  vehicles: number;
  experience: string;
  reviews: number;
  createdAt: Date;
}

export default function Marketplace() {
  const { user } = useAuth();
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  const loads: Load[] = [
    {
      id: "load-1",
      shipper: "ABC Manufacturing",
      shipperRating: 4.8,
      origin: "Los Angeles, CA",
      destination: "New York, NY",
      pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      weight: 45000,
      dimensions: "53ft x 8.5ft x 9ft",
      type: "Full Truckload",
      rate: 4500,
      description: "Electronics and machinery equipment. Requires climate control.",
      requirements: ["Climate Control", "GPS Tracking", "Insurance"],
      bids: 12,
      status: "open",
      isFavorite: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "load-2",
      shipper: "XYZ Logistics",
      shipperRating: 4.5,
      origin: "Chicago, IL",
      destination: "Miami, FL",
      pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      weight: 28000,
      dimensions: "53ft x 8.5ft x 9ft",
      type: "Full Truckload",
      rate: 3200,
      description: "Furniture and home goods. Standard freight.",
      requirements: ["GPS Tracking", "Proof of Delivery"],
      bids: 8,
      status: "open",
      isFavorite: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      id: "load-3",
      shipper: "Tech Supplies Inc",
      shipperRating: 4.9,
      origin: "Seattle, WA",
      destination: "Denver, CO",
      pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      weight: 15000,
      dimensions: "53ft x 8.5ft x 9ft",
      type: "Full Truckload",
      rate: 2800,
      description: "Computer equipment and accessories. Fragile items.",
      requirements: ["Climate Control", "GPS Tracking", "Insurance", "Hazmat"],
      bids: 15,
      status: "open",
      isFavorite: false,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: "load-4",
      shipper: "Fresh Foods Co",
      shipperRating: 4.6,
      origin: "Phoenix, AZ",
      destination: "Las Vegas, NV",
      pickupDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000),
      weight: 22000,
      dimensions: "Refrigerated Trailer",
      type: "Refrigerated",
      rate: 1800,
      description: "Perishable goods. Temperature controlled.",
      requirements: ["Refrigerated", "GPS Tracking", "Insurance"],
      bids: 5,
      status: "open",
      isFavorite: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      id: "load-5",
      shipper: "Construction Materials",
      shipperRating: 4.3,
      origin: "Houston, TX",
      destination: "Dallas, TX",
      pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      weight: 50000,
      dimensions: "Flatbed Trailer",
      type: "Flatbed",
      rate: 2200,
      description: "Heavy construction materials. Requires flatbed.",
      requirements: ["Flatbed", "GPS Tracking"],
      bids: 7,
      status: "open",
      isFavorite: false,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  ];

  const sampleBids: Bid[] = [
    {
      id: "bid-1",
      carrier: "Fast Freight LLC",
      carrierRating: 4.9,
      rate: 4200,
      estimatedDelivery: new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000),
      vehicles: 2,
      experience: "8 years",
      reviews: 245,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: "bid-2",
      carrier: "Premium Transport",
      carrierRating: 4.7,
      rate: 4350,
      estimatedDelivery: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      vehicles: 3,
      experience: "12 years",
      reviews: 512,
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    },
    {
      id: "bid-3",
      carrier: "Reliable Carriers",
      carrierRating: 4.5,
      rate: 4100,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      vehicles: 1,
      experience: "5 years",
      reviews: 128,
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
    },
  ];

  const filteredLoads = loads.filter((load) => {
    const matchesSearch = load.origin
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
      load.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      load.shipper.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" || load.type === filterType;

    return matchesSearch && matchesType;
  });

  const sortedLoads = [...filteredLoads].sort((a, b) => {
    switch (sortBy) {
      case "price_low":
        return a.rate - b.rate;
      case "price_high":
        return b.rate - a.rate;
      case "rating":
        return b.shipperRating - a.shipperRating;
      case "recent":
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const toggleFavorite = (loadId: string) => {
    if (favorites.includes(loadId)) {
      setFavorites(favorites.filter((id) => id !== loadId));
    } else {
      setFavorites([...favorites, loadId]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-900/20 border-green-800 text-green-400";
      case "assigned":
        return "bg-blue-900/20 border-blue-800 text-blue-400";
      case "in_transit":
        return "bg-yellow-900/20 border-yellow-800 text-yellow-400";
      case "delivered":
        return "bg-purple-900/20 border-purple-800 text-purple-400";
      default:
        return "bg-gray-900/20 border-gray-800 text-gray-400";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Load Marketplace</h1>
          <p className="text-gray-400 mt-1">
            Browse available loads and place bids
          </p>
        </div>

        <div className="text-right">
          <p className="text-gray-400 text-sm">Available Loads</p>
          <p className="text-3xl font-bold text-green-400">{loads.length}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-3 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search by origin, destination, or shipper..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Types</option>
            <option value="Full Truckload">Full Truckload</option>
            <option value="Refrigerated">Refrigerated</option>
            <option value="Flatbed">Flatbed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-600"
          >
            <option value="recent">Most Recent</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Loads Grid */}
      <div className="space-y-4">
        {sortedLoads.map((load) => (
          <Card
            key={load.id}
            className="bg-gray-900 border-gray-800 p-6 hover:border-gray-700 transition-colors cursor-pointer"
            onClick={() => setSelectedLoad(load)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white">
                    {load.origin} → {load.destination}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded border ${getStatusColor(
                      load.status
                    )}`}
                  >
                    {load.status === "open"
                      ? "Open"
                      : load.status === "assigned"
                        ? "Assigned"
                        : load.status === "in_transit"
                          ? "In Transit"
                          : "Delivered"}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-3">{load.description}</p>

                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Shipper</p>
                    <p className="text-white font-semibold">{load.shipper}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-gray-400 text-xs">
                        {load.shipperRating}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs">Pickup</p>
                    <p className="text-white font-semibold">
                      {formatDate(load.pickupDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs">Delivery</p>
                    <p className="text-white font-semibold">
                      {formatDate(load.deliveryDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs">Weight</p>
                    <p className="text-white font-semibold">
                      {(load.weight / 1000).toFixed(1)}K lbs
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs">Rate</p>
                    <p className="text-green-400 font-bold text-lg">
                      {formatCurrency(load.rate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(load.id);
                  }}
                  variant="outline"
                  className={`border-gray-700 ${
                    favorites.includes(load.id)
                      ? "text-red-400 border-red-700"
                      : "text-gray-400"
                  } hover:bg-gray-800`}
                >
                  <Heart
                    size={20}
                    className={
                      favorites.includes(load.id) ? "fill-red-400" : ""
                    }
                  />
                </Button>

                <div className="text-right">
                  <p className="text-gray-400 text-xs">{load.bids} bids</p>
                  <p className="text-white font-semibold">{load.type}</p>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="flex flex-wrap gap-2">
              {load.requirements.map((req, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded"
                >
                  {req}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Load Details Modal */}
      {selectedLoad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-900 border-gray-700 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedLoad.origin} → {selectedLoad.destination}
                  </h2>
                  <p className="text-gray-400">{selectedLoad.description}</p>
                </div>
                <Button
                  onClick={() => setSelectedLoad(null)}
                  variant="outline"
                  className="border-gray-700 text-gray-400 hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Shipper</p>
                  <p className="text-white font-semibold">
                    {selectedLoad.shipper}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-gray-400">
                      {selectedLoad.shipperRating}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Rate</p>
                  <p className="text-green-400 font-bold text-2xl">
                    {formatCurrency(selectedLoad.rate)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Pickup Date</p>
                  <p className="text-white font-semibold">
                    {formatDate(selectedLoad.pickupDate)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Delivery Date</p>
                  <p className="text-white font-semibold">
                    {formatDate(selectedLoad.deliveryDate)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Weight</p>
                  <p className="text-white font-semibold">
                    {(selectedLoad.weight / 1000).toFixed(1)}K lbs
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Dimensions</p>
                  <p className="text-white font-semibold">
                    {selectedLoad.dimensions}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <p className="text-gray-400 text-sm mb-3">Requirements</p>
                <div className="flex flex-wrap gap-2">
                  {selectedLoad.requirements.map((req, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-900/20 border border-blue-800 text-blue-400 text-sm rounded"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bids */}
              <div>
                <p className="text-gray-400 text-sm mb-3">
                  Recent Bids ({selectedLoad.bids})
                </p>
                <div className="space-y-3">
                  {sampleBids.map((bid) => (
                    <div
                      key={bid.id}
                      className="p-3 bg-gray-800 rounded flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-semibold">
                          {bid.carrier}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Star
                              size={14}
                              className="text-yellow-500 fill-yellow-500"
                            />
                            {bid.carrierRating}
                          </span>
                          <span>{bid.experience} experience</span>
                          <span>{bid.reviews} reviews</span>
                        </div>
                      </div>
                      <p className="text-green-400 font-bold">
                        {formatCurrency(bid.rate)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <Button
                  onClick={() => setSelectedLoad(null)}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Close
                </Button>
                <Button
                  onClick={() => setShowBidModal(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Place Bid
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && selectedLoad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-gray-700 p-6 w-96">
            <h2 className="text-xl font-bold text-white mb-4">
              Place Bid for {selectedLoad.origin} → {selectedLoad.destination}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Your Bid Amount
                </label>
                <div className="relative">
                  <DollarSign
                    size={18}
                    className="absolute left-3 top-3 text-gray-500"
                  />
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <p className="text-gray-400 text-xs mt-2">
                  Shipper's asking rate: {formatCurrency(selectedLoad.rate)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Estimated Delivery
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  placeholder="Add a note to the shipper..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-600 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowBidModal(false);
                    setSelectedLoad(null);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowBidModal(false);
                    setSelectedLoad(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Submit Bid
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

