import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { LocationDetailsResponse } from "../../shared/api";

interface RecommendationCardProps {
  locationId: string;
  spotName: string;
  address: string;
  description: string;
  textColor: string;
  imageUrl?: string;
  isExpanded?: boolean;
  onExpand?: (locationId: string) => void;
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
              <div className="relative w-full h-12 bg-white/10 rounded-sm overflow-hidden">
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
              <div className={`text-[9px] ${textColor} opacity-70 text-center leading-tight transition-all duration-300 ${
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
  isExpanded = false,
  onExpand,
}: RecommendationCardProps) {
  const [locationDetails, setLocationDetails] = useState<LocationDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExpandedContent, setShowExpandedContent] = useState(false);

  // Handle showExpandedContent when isExpanded changes
  useEffect(() => {
    if (isExpanded) {
      // Wait for card to stretch before showing content
      setTimeout(() => {
        setShowExpandedContent(true);
      }, 300);
    } else {
      setShowExpandedContent(false);
    }
  }, [isExpanded]);

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

  const handleCardClick = async (e: React.MouseEvent) => {
    if (isExpanded) {
      // Wait for content to fade out before collapsing
      setTimeout(() => {
        onExpand?.('');
      }, 200);
      return;
    }

    // Always refresh data when opening the card
    console.log('🔄 Refreshing location data for:', locationId);
    await fetchLocationDetails();
    onExpand?.(locationId);
  };

  return (
    <div className="flex-1 flex flex-col transition-all duration-500 ease-in-out relative">
      {/* Card with image as background */}
      <div 
        className={`relative overflow-hidden border border-white/20 rounded-2xl flex flex-col justify-between transition-all duration-700 ease-out cursor-pointer ${
          isExpanded 
            ? 'h-[250%] p-6 shadow-xl' 
            : 'p-5'
        }`}
        onClick={handleCardClick}
      >
        {/* Background image with different opacity based on state */}
        {imageUrl && (
          <div 
            className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${
              isExpanded ? 'opacity-20' : 'opacity-25'
            }`}
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}
        
        {/* Backdrop blur overlay */}
        <div className={`absolute inset-0 backdrop-blur-sm transition-all duration-500 ${
          isExpanded ? 'bg-white/10' : 'bg-white/5'
        }`} />
        
        {/* Content layer */}
        <div className="relative z-10 flex flex-col h-full">
          {isExpanded && locationDetails ? (
            // Expanded view with fade-in animation
            <div className={`space-y-4 transition-all duration-500 ease-out ${
              showExpandedContent 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}>
              <div className="text-center relative">
                <h3 className={`text-2xl font-bold ${textColor} mb-2 transition-all duration-500 delay-100 ${
                  showExpandedContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}>
                  {locationDetails.name}
                </h3>
                <div className={`text-base font-semibold ${textColor} opacity-90 transition-all duration-500 delay-150 ${
                  showExpandedContent ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-2'
                }`}>
                  📍 {address}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 transition-all duration-500 delay-200 ${
                  showExpandedContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  <div className={`text-xs font-bold ${textColor} mb-1`}>
                    Productivity Rating
                  </div>
                  {locationDetails.average_rating > 0 ? (
                    <>
                      <div className={`text-lg font-bold ${textColor}`}>
                        {locationDetails.average_rating.toFixed(1)}/5
                      </div>
                      <div className="flex space-x-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
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
                    <div className={`text-xs ${textColor} opacity-70`}>
                      No data yet
                    </div>
                  )}
                </div>
                
                <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 transition-all duration-500 delay-250 ${
                  showExpandedContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  <div className={`text-xs font-bold ${textColor} mb-1`}>
                    Cleanliness Rating
                  </div>
                  {locationDetails.average_cleanliness > 0 ? (
                    <>
                      <div className={`text-lg font-bold ${textColor}`}>
                        {locationDetails.average_cleanliness.toFixed(1)}/5
                      </div>
                      <div className="flex space-x-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
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
                    <div className={`text-xs ${textColor} opacity-70`}>
                      No data yet
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 transition-all duration-500 delay-300 ${
                showExpandedContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <BusynessHistogram 
                  crowdednessData={locationDetails.crowdedness_vs_time}
                  textColor={textColor}
                  showExpandedContent={showExpandedContent}
                />
              </div>
              
              <div className={`text-xs ${textColor} opacity-80 text-center transition-all duration-500 delay-400 ${
                showExpandedContent ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                Click to collapse
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
