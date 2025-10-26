import { useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import type { Location } from "shared/api";
import { RecommendationCard } from "./RecommendationCard";
import "leaflet/dist/leaflet.css";

// Custom marker icon using emoji
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #fb923c 0%, #ec4899 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        border: 2px solid rgba(255,255,255,0.5);
      ">
        📍
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface LocationMiniMapProps {
  locations: Location[];
  textColor: string;
}

export function LocationMiniMap({ locations, textColor }: LocationMiniMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string>('');
  
  // Filter locations with valid coordinates and convert to lat/lng
  const validLocations = locations
    .filter(loc => 
      loc.coordinate_x !== undefined && 
      loc.coordinate_x !== null &&
      loc.coordinate_y !== undefined &&
      loc.coordinate_y !== null &&
      !isNaN(Number(loc.coordinate_x)) &&
      !isNaN(Number(loc.coordinate_y))
    )
    .map(loc => ({
      ...loc,
      lat: Number(loc.coordinate_x), // X is latitude
      lng: Number(loc.coordinate_y), // Y is longitude
    }));

  if (validLocations.length === 0) {
    return (
      <div className={`text-center py-8 ${textColor} opacity-60`}>
        <div className="mb-2">No location coordinates available</div>
        <div className="text-xs opacity-75">
          Found {locations.length} locations, but none have valid coordinates (lat/lng).
        </div>
        <div className="text-xs opacity-75 mt-1">
          Please add coordinates to your locations in the database.
        </div>
      </div>
    );
  }

  // Center on Berkeley, CA coordinates
  const berkeleyCenter = {
    lat: 37.8719,  // Berkeley latitude
    lng: -122.2585  // Berkeley longitude
  };
  
  // Use Berkeley as default center
  const centerLat = berkeleyCenter.lat;
  const centerLng = berkeleyCenter.lng;

  // Determine if card is expanded
  const isExpanded = expandedCardId === selectedLocation?.id;
  
  return (
    <div className="relative w-full">
      {/* Map Container - shrinks when card is expanded */}
      <div className={`relative border-2 border-white/30 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ease-out ${
        isExpanded ? 'h-[150px] max-h-[20vh]' : 'h-[400px] max-h-[50vh]'
      }`}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={14}
          className="h-full w-full"
          scrollWheelZoom={true}
          zoomControl={true}
          whenReady={() => setMapReady(true)}
        >
          {/* Map Tiles - Using OpenStreetMap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Location Markers - All locations with pins */}
          {validLocations.map((location) => (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={createCustomIcon()}
              eventHandlers={{
                click: () => {
                  // Find full location data from original locations array
                  const fullLocation = locations.find(loc => loc.id === location.id);
                  if (fullLocation) {
                    setSelectedLocation(fullLocation);
                  }
                }
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Selected Location Card - shows when a marker is clicked */}
      {selectedLocation && (
        <div className="mt-4 animate-in slide-in-from-top-4 duration-300">
          <RecommendationCard
            locationId={selectedLocation.id}
            spotName={selectedLocation.name}
            address={selectedLocation.shortloc || ''}
            description={selectedLocation.summary || 'No description available'}
            textColor={textColor}
            imageUrl={selectedLocation.image}
            isExpanded={expandedCardId === selectedLocation.id}
            onExpand={(locationId) => {
              setExpandedCardId(locationId);
              // If collapsing, clear selection after animation
              if (!locationId && expandedCardId === selectedLocation.id) {
                setTimeout(() => setSelectedLocation(null), 300);
              }
            }}
          />
          {/* Close button */}
          <button
            onClick={() => {
              setExpandedCardId('');
              setSelectedLocation(null);
            }}
            className={`mt-2 w-full text-xs ${textColor} opacity-70 hover:opacity-100 transition-opacity`}
          >
            ✕ Close
          </button>
        </div>
      )}
      
      {/* Styling for map markers */}
      <style>{`
        /* Map marker styling */
        .custom-map-marker {
          background: transparent;
          border: none;
        }
        
        .custom-map-marker:hover {
          transform: scale(1.15);
          transition: transform 0.2s ease;
        }
        
        /* Leaflet container */
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}

