/**
 * ZEUN MECHANICS™ PROVIDER NETWORK
 * Find and connect with repair facilities nationwide
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  MessageSquare,
  Star,
  Clock,
  DollarSign,
  Wrench,
  Navigation,
  AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ZeunProviderNetwork() {
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [maxDistance, setMaxDistance] = useState(50);
  const [serviceType, setServiceType] = useState("MOBILE_REPAIR");
  const [searched, setSearched] = useState(false);

  const providersQuery = trpc.zeunMechanics.findProviders.useQuery(
    { latitude, longitude, providerType: serviceType, radiusMiles: maxDistance },
    { enabled: searched }
  );

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      });
    }
  };

  const handleSearch = () => {
    if (latitude && longitude) {
      setSearched(true);
    }
  };

  const providers = providersQuery.data || [];

  const serviceTypeLabels: Record<string, string> = {
    ROADSIDE_ASSISTANCE: "Roadside Assistance",
    MOBILE_REPAIR: "Mobile Repair",
    TOW_SERVICE: "Tow Service",
    HEAVY_DUTY_TOW: "Heavy Duty Tow",
    DEALER_SERVICE: "Dealer Service",
    INDEPENDENT_SHOP: "Independent Shop",
    TIRE_SERVICE: "Tire Service",
    ALIGNMENT_SERVICE: "Alignment",
    PM_SERVICE: "Preventive Maintenance",
    DIAGNOSTIC: "Diagnostic",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Provider Network</h1>
        <p className="text-gray-400 mt-1">Find repair facilities and service providers nationwide</p>
      </div>

      {/* Search Section */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Search Providers</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              <option value="MOBILE_REPAIR">Mobile Repair</option>
              <option value="ROADSIDE_ASSISTANCE">Roadside Assistance</option>
              <option value="TOW_SERVICE">Tow Service</option>
              <option value="HEAVY_DUTY_TOW">Heavy Duty Tow</option>
              <option value="DEALER_SERVICE">Dealer Service</option>
              <option value="INDEPENDENT_SHOP">Independent Shop</option>
              <option value="TIRE_SERVICE">Tire Service</option>
              <option value="DIAGNOSTIC">Diagnostic</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Latitude</label>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                placeholder="e.g., 29.7604"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Longitude</label>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                placeholder="e.g., -95.3698"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Max Distance</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="200"
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-white font-bold w-16">{maxDistance} mi</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGetLocation}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Navigation size={16} className="mr-2" />
              Use My Location
            </Button>
            <Button
              onClick={handleSearch}
              disabled={!latitude || !longitude}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50"
            >
              Search Providers
            </Button>
          </div>
        </div>
      </Card>

      {/* Providers List */}
      {searched && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            {providers.length > 0
              ? `Found ${providers.length} Provider${providers.length !== 1 ? "s" : ""}`
              : "No Providers Found"}
          </h2>

          {providers.length > 0 ? (
            <div className="space-y-4">
              {providers.map((provider: any, idx: number) => (
                <Card key={idx} className="bg-slate-800 border-slate-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{provider.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin size={16} className="text-blue-400" />
                        <span className="text-sm text-gray-400">
                          {provider.distance} miles away
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Star size={18} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xl font-bold text-white">{provider.rating}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Rating</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-700">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Availability</p>
                      <p className="text-sm text-white font-semibold">{provider.availability}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Est. Wait Time</p>
                      <p className="text-sm text-white font-semibold">
                        {provider.estimatedWaitTime} min
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-2">Services Offered</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.serviceTypes?.map((type: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-300"
                        >
                          {serviceTypeLabels[type] || type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                      <Phone size={16} className="mr-2" />
                      Call Now
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      <MessageSquare size={16} className="mr-2" />
                      Message
                    </Button>
                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                      <Navigation size={16} className="mr-2" />
                      Directions
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-yellow-900/20 border-yellow-700 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-yellow-500" />
                <p className="text-yellow-300">
                  No providers found in this area. Try increasing the search distance.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white">Total Providers</h3>
            <Wrench size={20} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-white">10,000+</p>
          <p className="text-xs text-gray-400 mt-1">Across all 50 states</p>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white">Avg. Rating</h3>
            <Star size={20} className="text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-white">4.7</p>
          <p className="text-xs text-gray-400 mt-1">Out of 5 stars</p>
        </Card>

        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white">24/7 Support</h3>
            <Clock size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-white">Always</p>
          <p className="text-xs text-gray-400 mt-1">Available when you need us</p>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-900/20 border-blue-700 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-300 mb-1">Network Coverage</h3>
            <p className="text-sm text-blue-200">
              Our provider network includes authorized dealers, independent shops, mobile repair
              units, and 24/7 roadside assistance across the entire continental United States.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

