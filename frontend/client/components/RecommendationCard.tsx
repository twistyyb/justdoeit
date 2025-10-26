import { useState } from "react";
import { apiClient } from "@/lib/api";
import { LocationDetailsResponse } from "../../shared/api";

interface RecommendationCardProps {
  locationId: string;
  spotName: string;
  address: string;
  description: string;
  textColor: string;
  imageUrl?: string;
}

interface BusynessHistogramProps {
  crowdednessData: Record<string, { binname: string; avg: number }>;
  textColor: string;
  showExpandedContent?: boolean;
}

function BusynessHistogram({ crowdednessData, textColor, showExpandedContent = true }: BusynessHistogramProps) {
  const bins = Object.values(crowdednessData);
  const hasData = bins.some(bin => bin.avg > 0);
  
  // Log the raw histogram data
  console.log('📊 BusynessHistogram raw data:', {
    crowdednessData,
    bins,
    hasData,
    binCount: bins.length
  });
  
  if (!hasData) {
    console.log('📊 No busyness data available');
    return (
      <div className="space-y-2">
        <div className={`text-xs font-semibold ${textColor} opacity-90`}>
          Busyness by Time
        </div>
        <div className={`text-xs ${textColor} opacity-70 text-center py-4`}>
          No data yet
        </div>
      </div>
    );
  }
  
  const maxCrowdedness = Math.max(...bins.map(bin => bin.avg), 1);
  
  console.log('📊 Histogram rendering:', {
    maxCrowdedness,
    binsWithHeights: bins.map(bin => ({
      binname: bin.binname,
      avg: bin.avg,
      height: (bin.avg / maxCrowdedness) * 100
    }))
  });
  
  return (
    <div className="space-y-2">
      <div className={`text-xs font-semibold ${textColor} opacity-90`}>
        Busyness by Time
      </div>
      <div className="flex items-end justify-between gap-1">
        {bins.map((bin, index) => {
          const height = (bin.avg / maxCrowdedness) * 100;
          const isCurrentTime = false; // Could be enhanced to show current time
          
          console.log(`📊 Bin ${index}:`, {
            binname: bin.binname,
            avg: bin.avg,
            height: `${height}%`,
            isCurrentTime
          });
          
          return (
            <div key={index} className="flex flex-col items-center space-y-1 flex-1">
              <div className="relative w-full h-16 bg-white/10 rounded-sm overflow-hidden">
                <div 
                  className={`absolute bottom-0 w-full rounded-sm transition-all duration-500 ${
                    isCurrentTime ? 'bg-yellow-400' : 'bg-white/60'
                  }`}
                  style={{ 
                    height: `${height}%`,
                    transitionDelay: `${400 + index * 100}ms`,
                    opacity: showExpandedContent ? 1 : 0,
                    transform: showExpandedContent ? 'scaleY(1)' : 'scaleY(0)',
                    transformOrigin: 'bottom'
                  }}
                />
              </div>
              <div className={`text-[10px] ${textColor} opacity-70 text-center leading-tight transition-all duration-300 ${
                showExpandedContent ? 'opacity-70 translate-y-0' : 'opacity-0 translate-y-2'
              }`} style={{ transitionDelay: `${500 + index * 100}ms` }}>
                {bin.binname.split('-')[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RecommendationCard({
  locationId,
  spotName,
  address,
  description,
  textColor,
  imageUrl,
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [locationDetails, setLocationDetails] = useState<LocationDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExpandedContent, setShowExpandedContent] = useState(false);

  const fetchLocationDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const details = await apiClient.getLocationDetails(locationId);
      console.log('📍 Location details fetched:', {
        locationId,
        name: details.name,
        average_rating: details.average_rating,
        average_cleanliness: details.average_cleanliness,
        crowdedness_vs_time: details.crowdedness_vs_time,
        fullDetails: details
      });
      setLocationDetails(details);
      return details;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load location details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault(); // Prevent any default behavior
    console.log('🔄 Refreshing location data for:', locationId);
    await fetchLocationDetails();
  };

  const handleCardClick = async (e: React.MouseEvent) => {
    // Don't close if clicking on interactive elements
    if (isExpanded && (e.target as HTMLElement).closest('button')) {
      return;
    }

    if (isExpanded) {
      setShowExpandedContent(false);
      // Wait for content to fade out before collapsing
      setTimeout(() => {
        setIsExpanded(false);
      }, 200);
      return;
    }

    if (locationDetails) {
      setIsExpanded(true);
      // Wait for card to stretch before showing content
      setTimeout(() => {
        setShowExpandedContent(true);
      }, 300);
      return;
    }

    await fetchLocationDetails();
    setIsExpanded(true);
    // Wait for card to stretch before showing content
    setTimeout(() => {
      setShowExpandedContent(true);
    }, 300);
  };

  return (
    <div className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${
      isExpanded ? 'z-50 fixed inset-0 flex items-center justify-center p-4' : 'relative'
    }`}>
      {/* Backdrop for expanded view */}
      {isExpanded && (
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {/* Card with image as background */}
      <div 
        className={`relative overflow-hidden border border-white/20 rounded-2xl flex-1 flex flex-col justify-between transition-all duration-700 ease-out cursor-pointer ${
          isExpanded 
            ? 'w-full max-w-2xl h-auto max-h-[90vh] p-8 shadow-2xl' 
            : 'p-5'
        }`}
        onClick={handleCardClick}
      >
        {/* Background image with different opacity based on state */}
        {imageUrl && (
          <div 
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
              isExpanded ? 'opacity-40' : 'opacity-20'
            }`}
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}
        
        {/* Backdrop blur overlay */}
        <div className={`absolute inset-0 backdrop-blur-sm transition-all duration-500 ${
          isExpanded ? 'bg-white/10' : 'bg-white/5'
        }`} />
        
        {/* Content layer */}
        <div className="relative z-10 flex flex-col justify-center h-full">
          {isExpanded && locationDetails ? (
            // Expanded view with fade-in animation
            <div className={`space-y-6 transition-all duration-500 ease-out ${
              showExpandedContent 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}>
              <div className="text-center relative">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className={`absolute top-0 right-0 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    showExpandedContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                  style={{ transitionDelay: '100ms' }}
                  title="Refresh data"
                >
                  <svg 
                    className={`w-4 h-4 ${textColor} transition-transform duration-300 ${isLoading ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                </button>
                <h3 className={`text-3xl font-bold ${textColor} mb-2 transition-all duration-500 delay-100 ${
                  showExpandedContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}>
                  {locationDetails.name}
                </h3>
                <div className={`text-lg font-semibold ${textColor} opacity-90 transition-all duration-500 delay-150 ${
                  showExpandedContent ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-2'
                }`}>
                  📍 {address}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 transition-all duration-500 delay-200 ${
                  showExpandedContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  <div className={`text-sm font-bold ${textColor} mb-2`}>
                    Productivity Rating
                  </div>
                  {locationDetails.average_rating > 0 ? (
                    <>
                      <div className={`text-2xl font-bold ${textColor}`}>
                        {locationDetails.average_rating.toFixed(1)}/5
                      </div>
                      <div className="flex space-x-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                              i < Math.round(locationDetails.average_rating)
                                ? 'bg-yellow-400'
                                : 'bg-white/20'
                            }`}
                            style={{ 
                              transitionDelay: `${300 + i * 50}ms`,
                              opacity: showExpandedContent ? 1 : 0,
                              transform: showExpandedContent ? 'scale(1)' : 'scale(0.8)'
                            }}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={`text-sm ${textColor} opacity-70`}>
                      No data yet
                    </div>
                  )}
                </div>
                
                <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 transition-all duration-500 delay-250 ${
                  showExpandedContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  <div className={`text-sm font-bold ${textColor} mb-2`}>
                    Cleanliness Rating
                  </div>
                  {locationDetails.average_cleanliness > 0 ? (
                    <>
                      <div className={`text-2xl font-bold ${textColor}`}>
                        {locationDetails.average_cleanliness.toFixed(1)}/5
                      </div>
                      <div className="flex space-x-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                              i < Math.round(locationDetails.average_cleanliness)
                                ? 'bg-green-400'
                                : 'bg-white/20'
                            }`}
                            style={{ 
                              transitionDelay: `${350 + i * 50}ms`,
                              opacity: showExpandedContent ? 1 : 0,
                              transform: showExpandedContent ? 'scale(1)' : 'scale(0.8)'
                            }}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={`text-sm ${textColor} opacity-70`}>
                      No data yet
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 transition-all duration-500 delay-300 ${
                showExpandedContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <BusynessHistogram 
                  crowdednessData={locationDetails.crowdedness_vs_time}
                  textColor={textColor}
                  showExpandedContent={showExpandedContent}
                />
              </div>
              
              <div className={`text-sm ${textColor} opacity-80 text-center transition-all duration-500 delay-400 ${
                showExpandedContent ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                Click anywhere to close
              </div>
            </div>
          ) : (
            // Collapsed view with fade-out animation when expanding
            <div className={`transition-all duration-300 ease-out ${
              isExpanded ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}>
              <h3 className={`text-lg md:text-xl font-bold ${textColor} mb-3`}>
                {spotName}
              </h3>
              
              <div className={`text-sm font-semibold ${textColor} opacity-90 mb-2`}>
                📍 {address}
              </div>
              <div className={`text-sm ${textColor} opacity-80 line-clamp-3`}>
                {description}
              </div>
              
              {isLoading && (
                <div className={`text-xs ${textColor} opacity-70 mt-2`}>
                  Loading details...
                </div>
              )}
              
              {error && (
                <div className={`text-xs text-red-300 mt-2`}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
