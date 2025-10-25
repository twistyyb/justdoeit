import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

interface Location {
  id: string;
  name: string;
}

interface LocationSelectorProps {
  selectedLocation: string | null;
  onLocationSelect: (locationId: string) => void;
}

export function LocationSelector({
  selectedLocation,
  onLocationSelect,
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([
    { id: "1", name: "Main stacks UC Berkeley" },
    { id: "2", name: "Café Saint Frank SF" },
    { id: "3", name: "Prince Street Pizza NYC" },
  ]);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // In production, fetch from /api/locations
  useEffect(() => {
    // dummy fetch: const res = await fetch('/api/locations');
    // const data = await res.json();
    // setLocations(data);
  }, []);

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;

    setIsCreating(true);
    try {
      // dummy endpoint: POST /api/locations
      // const res = await fetch('/api/locations', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name: newLocationName })
      // });
      // const newLoc = await res.json();

      const newLoc = {
        id: `loc-${Date.now()}`,
        name: newLocationName,
      };

      setLocations([...locations, newLoc]);
      onLocationSelect(newLoc.id);
      setNewLocationName("");
      setShowNewLocation(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mb-6">
      {!showNewLocation ? (
        <div className="flex gap-2">
          <select
            value={selectedLocation || ""}
            onChange={(e) => onLocationSelect(e.target.value)}
            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-semibold bg-white cursor-pointer"
          >
            <option value="">Select a location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
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
        <div className="flex gap-2">
          <input
            type="text"
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            placeholder="Enter location name..."
            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
            autoFocus
          />
          <button
            onClick={handleAddLocation}
            disabled={isCreating || !newLocationName.trim()}
            className="bg-primary text-white rounded-lg px-4 py-3 hover:bg-opacity-90 disabled:opacity-50 transition-all font-semibold"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowNewLocation(false);
              setNewLocationName("");
            }}
            className="border-2 border-gray-300 rounded-lg px-3 py-3 hover:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
