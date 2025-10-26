import { useState, useEffect, useRef } from "react";
import { Plus, X, Search } from "lucide-react";
import { apiClient } from "@/lib/api";
import type { Location } from "../../shared/api";

interface LocationSelectorProps {
  selectedLocation: string | null;
  onLocationSelect: (locationId: string) => void;
  preloadedLocations?: Location[];
  onLocationCreated?: (newLocation: Location) => void;
}

export function LocationSelector({
  selectedLocation,
  onLocationSelect,
  preloadedLocations,
  onLocationCreated,
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationShortloc, setNewLocationShortloc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use preloaded locations or fetch from backend
  useEffect(() => {
    if (preloadedLocations && preloadedLocations.length > 0) {
      // Use preloaded data
      console.log("Using preloaded locations:", preloadedLocations);
      setLocations(preloadedLocations);
      setIsLoading(false);
      setError(null);
    } else {
      // Fetch locations from backend: GET http://127.0.0.1:5002/location_names
      const fetchLocations = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const data = await apiClient.getLocations();
          console.log("Fetched locations:", data);
          setLocations(data);
        } catch (err) {
          console.error("Error fetching locations:", err);
          setError("Failed to load locations");
          // Fallback to empty array
          setLocations([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchLocations();
    }
  }, [preloadedLocations]);

  // Filter locations based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      // Filter by search query
      const filtered = locations.filter((loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.shortloc && loc.shortloc.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredLocations(filtered);
      // Only show dropdown if it's already open (user has focused the input)
      if (showDropdown) {
        setShowDropdown(true);
      }
    } else {
      // Show all locations when search is empty (limit to 10 for visual purposes)
      setFilteredLocations(locations.slice(0, 10));
      // Don't automatically show dropdown - only when user focuses input
    }
  }, [searchQuery, locations, showDropdown]);

  // Initialize filtered locations when component loads
  useEffect(() => {
    if (locations.length > 0) {
      setFilteredLocations(locations.slice(0, 10));
    }
  }, [locations]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectLocation = (locationId: string) => {
    onLocationSelect(locationId);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim() || !newLocationShortloc.trim()) {
      alert("Please enter both location name and short location");
      return;
    }

    setIsCreating(true);
    try {
      // POST /create_location
      // Backend expects: { name, shortloc, summary?, coordinate_x?, coordinate_y? }
      const newLoc = await apiClient.createLocation({ 
        name: newLocationName,
        shortloc: newLocationShortloc
      });
      console.log("Created location:", newLoc);

      // Update local state
      const updatedLocations = [...locations, newLoc];
      setLocations(updatedLocations);
      
      // Notify parent component to update preloaded data
      if (onLocationCreated) {
        onLocationCreated(newLoc);
      }
      
      onLocationSelect(newLoc.id);
      setNewLocationName("");
      setNewLocationShortloc("");
      setShowNewLocation(false);
    } catch (err) {
      console.error("Error creating location:", err);
      alert("Failed to create location. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const selectedLocationDetails = locations.find((loc) => loc.id === selectedLocation);

  return (
    <div className="mb-6" ref={dropdownRef}>
      {error && (
        <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}

      {!showNewLocation ? (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={selectedLocationDetails ? `${selectedLocationDetails.name} ${selectedLocationDetails.shortloc ? `(${selectedLocationDetails.shortloc})` : ""}` : searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setShowDropdown(true);
                  // Clear the input to show search functionality when focused
                  if (selectedLocationDetails) {
                    setSearchQuery("");
                  }
                  // Ensure we have the latest filtered locations when focusing
                  if (!searchQuery.trim()) {
                    setFilteredLocations(locations.slice(0, 10));
                  }
                }}
                placeholder={isLoading ? "Loading locations..." : "Search locations or click to see all..."}
                disabled={isLoading}
                className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-4 py-3 text-gray-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Dropdown results */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-300 rounded-lg mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc.id)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-semibold text-gray-900">{loc.name}</div>
                      {loc.shortloc && (
                        <div className="text-sm text-gray-500">{loc.shortloc}</div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    {searchQuery.trim() ? "No locations found matching your search" : "No locations available"}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowNewLocation(true)}
            className="border-2 border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-semibold">New</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            placeholder="Location name (e.g., Cafe Strada)"
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
            autoFocus
          />
          <input
            type="text"
            value={newLocationShortloc}
            onChange={(e) => setNewLocationShortloc(e.target.value)}
            placeholder="Short location (e.g., Berkeley)"
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddLocation}
              disabled={isCreating || !newLocationName.trim() || !newLocationShortloc.trim()}
              className="flex-1 bg-primary text-white rounded-lg px-4 py-3 hover:bg-opacity-90 disabled:opacity-50 transition-all font-semibold"
            >
              {isCreating ? "Adding..." : "Add Location"}
            </button>
            <button
              onClick={() => {
                setShowNewLocation(false);
                setNewLocationName("");
                setNewLocationShortloc("");
              }}
              className="border-2 border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
