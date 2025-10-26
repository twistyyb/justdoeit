import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Location } from "shared/api";
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

  return (
    <div className="relative w-full">
      {/* Map Container */}
      <div className="relative border-2 border-white/30 rounded-2xl overflow-hidden shadow-2xl h-[400px] max-h-[50vh]">
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
            >
              {/* Mini-message board popup */}
              <Popup className="custom-popup" maxWidth={500} minWidth={400} autoPan={true}>
                <div className="popup-content">
                  {/* Left side: Emoji badge */}
                  <div className="emoji-badge">
                    📍
                  </div>
                  
                  {/* Right side: Content */}
                  <div className="popup-text">
                    <h3 className="location-name">
                      {location.name}
                    </h3>
                    
                    {location.shortloc && (
                      <p className="location-address">
                        {location.shortloc}
                      </p>
                    )}
                    
                    {location.summary && (
                      <p className="location-summary">
                        {location.summary}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className={`mt-3 text-xs ${textColor} opacity-60 text-center`}>
        🗺️ Click on markers to see details • Use mouse wheel or +/- to zoom • Drag to pan
      </div>
      
      {/* Additional styling for custom popups */}
      <style>{`
        /* Popup container styling */
        .leaflet-popup-content-wrapper {
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
          padding: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,250,250,0.98) 100%);
          backdrop-filter: blur(10px);
          overflow: hidden;
        }
        
        .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }
        
        .leaflet-popup-tip {
          background: rgba(255,255,255,0.98);
        }
        
        /* Popup content layout - horizontal */
        .popup-content {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
        }
        
        /* Emoji badge - left side */
        .emoji-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          min-width: 52px;
          font-size: 26px;
          background: linear-gradient(135deg, #fb923c 0%, #ec4899 100%);
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
        }
        
        /* Text content - right side */
        .popup-text {
          flex: 1;
          min-width: 0;
        }
        
        /* Location name */
        .location-name {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        
        /* Location address */
        .location-address {
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          margin: 0 0 8px 0;
          line-height: 1.2;
        }
        
        /* Location summary */
        .location-summary {
          font-size: 13px;
          color: #374151;
          line-height: 1.4;
          margin: 0;
          padding-top: 8px;
          border-top: 1px solid rgba(0,0,0,0.08);
        }
        
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
        
        /* Close button styling */
        .leaflet-popup-close-button {
          font-size: 22px !important;
          padding: 8px !important;
          width: 32px !important;
          height: 32px !important;
          color: #9ca3af !important;
          font-weight: 300 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
          right: 6px !important;
          top: 6px !important;
        }
        
        .leaflet-popup-close-button:hover {
          color: #111827 !important;
          background: rgba(0,0,0,0.05) !important;
          transform: scale(1.1) !important;
        }
      `}</style>
    </div>
  );
}

