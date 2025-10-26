import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import type { Location } from "../../shared/api";

interface LocationSelectorProps {
  selectedLocation: string | null;
  onLocationSelect: (locationId: string) => void;
}

export function LocationSelector({
  selectedLocation,
  onLocationSelect,
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationShortloc, setNewLocationShortloc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch locations from backend: GET http://127.0.0.1:5002/location_names
  useEffect(() => {
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
  }, []);

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

      setLocations([...locations, newLoc]);
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

  return (
    <div className="mb-6">
      {error && (
        <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}
      {!showNewLocation ? (
        <div className="flex gap-2">
          <select
            value={selectedLocation || ""}
            onChange={(e) => {
              console.log("Location selected:", e.target.value);
              if (e.target.value) {
                onLocationSelect(e.target.value);
              }
            }}
            disabled={isLoading}
            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-semibold bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" disabled>
              {isLoading ? "Loading locations..." : "Select a location"}
            </option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} {loc.shortloc ? `(${loc.shortloc})` : ""}
              </option>
            ))}
          </select>
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
