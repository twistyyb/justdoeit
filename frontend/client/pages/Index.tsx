import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogSessionModal } from "@/components/LogSessionModal";
import { RecentSessionsModal } from "@/components/RecentSessionsModal";
import { RecommendationCard } from "@/components/RecommendationCard";
import { StudyContributionGraph } from "@/components/StudyContributionGraph";
import { LocationMiniMap } from "@/components/LocationMiniMap";
import { AuthModal } from "@/components/AuthModal";
import { UserProfile } from "@/components/UserProfile";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useTimeBasedGradient } from "@/hooks/useTimeBasedGradient";
import { useSessionDataPreload } from "@/hooks/useSessionDataPreload";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import type { StudyBuddy } from "../../shared/api";

// Type for user analytics response
interface MostProductiveLocation {
  location_id: string | null;
  location_name: string | null;
  shortloc: string | null;
  average_rating: number;
}

interface UserAnalytics {
  favorite_location: string | null;
  most_productive_location: MostProductiveLocation | null;
  total_study_time: number;
  average_rating: number;
  streak: number;
  study_buddies: StudyBuddy[];
}

export default function Index() {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string>('');
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [studyBuddyData, setStudyBuddyData] = useState<{name: string, sessionCount: number}[]>([]);
  const [favoriteLocationName, setFavoriteLocationName] = useState<string | null>(null);
  const [mostProductiveLocationData, setMostProductiveLocationData] = useState<{image: string, name: string, shortloc: string} | null>(null);
  const [mostVisitedLocationData, setMostVisitedLocationData] = useState<{image: string, name: string, shortloc: string} | null>(null);
  const { user, userProfile } = useAuth();
  const { gradient, name, textColor } = useTimeBasedGradient();
  
  // Preload session data as soon as the page loads
  const { 
    locations: preloadedLocations, 
    users: preloadedUsers, 
    isLoading: isPreloadingData,
    error: preloadError,
    isPreloaded,
    addLocation,
    refreshData
  } = useSessionDataPreload(user?.id);

  const handleCardExpand = (locationId: string) => {
    setExpandedCardId(locationId);
  };

  const handleReloadRecommendations = async () => {
    if (user?.id) {
      console.log("🔄 Reloading AI recommendations...");
      await refreshData();
    }
  };

  // Fetch user analytics when user is available
  useEffect(() => {
    if (!user?.id) {
      setUserAnalytics(null);
      return;
    }

    const fetchUserAnalytics = async () => {
      setIsLoadingAnalytics(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:5002/user_analytics/${user.id}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.status}`);
        }
        
        const data: UserAnalytics = await response.json();
        setUserAnalytics(data);

        // Fetch study buddy names and session counts
        if (data.study_buddies.length > 0) {
          const buddyData: {name: string, sessionCount: number}[] = [];
          for (const buddy of data.study_buddies) {
            try {
              const buddyResponse = await fetch(
                `http://127.0.0.1:5002/user_profile/${buddy.user_id}`
              );
              if (buddyResponse.ok) {
                const buddyProfile = await buddyResponse.json();
                buddyData.push({
                  name: buddyProfile.name || 'Unknown User',
                  sessionCount: buddy.session_count
                });
              }
            } catch (error) {
              console.error(`Error fetching buddy ${buddy.user_id}:`, error);
              buddyData.push({
                name: 'Unknown User',
                sessionCount: buddy.session_count
              });
            }
          }
          setStudyBuddyData(buddyData);
        }

        // Fetch most productive location image using location_id
        if (data.most_productive_location?.location_id) {
          try {
            // Get all locations with images from location_names endpoint
            const locationsResponse = await fetch(
              `http://127.0.0.1:5002/location_names`
            );
            if (locationsResponse.ok) {
              const locationsData = await locationsResponse.json();
              const location = locationsData.locations.find(
                (loc: any) => loc.id === data.most_productive_location?.location_id
              );
              if (location) {
                setMostProductiveLocationData({
                  image: location.image || '',
                  name: data.most_productive_location.location_name || '',
                  shortloc: data.most_productive_location.shortloc || ''
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching most productive location:`, error);
          }
        }

        // Fetch favorite location image using favorite_location (which is location_id)
        if (data.favorite_location) {
          try {
            // Get location details to get the name
            const locationResponse = await fetch(
              `http://127.0.0.1:5002/location_details/${data.favorite_location}`
            );
            if (locationResponse.ok) {
              const locationData = await locationResponse.json();
              setFavoriteLocationName(locationData.name);
              
              // Get all locations to find the image
              const locationsResponse = await fetch(
                `http://127.0.0.1:5002/location_names`
              );
              if (locationsResponse.ok) {
                const locationsData = await locationsResponse.json();
                const location = locationsData.locations.find(
                  (loc: any) => loc.id === data.favorite_location
                );
                if (location && location.image) {
                  setMostVisitedLocationData({
                    image: location.image,
                    name: locationData.name,
                    shortloc: location.shortloc
                  });
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching favorite location:`, error);
            setFavoriteLocationName(null);
          }
        } else {
          setFavoriteLocationName(null);
          setMostVisitedLocationData(null);
        }
      } catch (error) {
        console.error("Error fetching user analytics:", error);
        setUserAnalytics(null);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    fetchUserAnalytics();
  }, [user?.id]);

  return (
    <>
      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isPreloadingData} />
      
      <div
        className="min-h-screen w-full overflow-hidden transition-all duration-[3000ms] ease-in-out"
        style={{
          backgroundImage: gradient,
        }}
      >
        {/* Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none"></div>

      {/* Header with user profile - only show when authenticated */}
      {user && (
        <div className="absolute bottom-4 right-4 md:right-8 z-20 flex justify-end">
          <UserProfile />
        </div>
      )}

      {/* Main grid layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 p-4 md:p-8 min-h-screen">
        {/* Left sidebar - Recommendations */}
        <div className="md:col-span-3 flex flex-col">
          <div className="flex flex-col bg-white/10 backdrop-blur-md border-2 border-white/10 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl md:text-2xl font-bold ${textColor}`}>
                Recommendations
              </h2>
              {user && (
                <button
                  onClick={handleReloadRecommendations}
                  disabled={isPreloadingData}
                  className={`p-2 rounded-lg border border-white/30 ${textColor} transition-all hover:bg-white/10 hover:border-white/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Reload AI recommendations"
                >
                  <RefreshCw className={`w-4 h-4 ${isPreloadingData ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {isPreloadingData ? (
              <div className={`text-sm ${textColor} opacity-80 text-center py-4`}>
                Loading recommendations...
              </div>
            ) : (preloadedLocations.length > 0) ? (
              <>
                {/* Show either recommendation cards or mini map, not both */}
                {!showLocationMap ? (
                  <div className="flex flex-col gap-4 mb-4">
                    {/* Use AI recommendations if available, otherwise fall back to first 3 locations */}
                    {(preloadedLocations.slice(0, 3)).map((item) => {
                      console.log(item);
                      // Handle both recommendation objects and location objects
                      const locationId = 'location_id' in item ? item.location_id : item.id;
                      const spotName = 'location_name' in item ? item.location_name || 'Unknown Location' : item.name;
                      const address = 'shortloc' in item ? item.shortloc || 'Unknown' : '';
                      const description = 'reasoning' in item ? item.reasoning : (item.summary || "No description available");
                      const imageUrl = 'image' in item ? item.image : '';
                      
                      return (
                        <RecommendationCard
                          locationId={locationId}
                          spotName={spotName}
                          address={address}
                          description={description}
                          textColor={textColor}
                          imageUrl={imageUrl}
                          isExpanded={expandedCardId === locationId}
                          onExpand={handleCardExpand}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="mb-4 animate-in slide-in-from-top-4 duration-300">
                    <LocationMiniMap 
                      locations={preloadedLocations} 
                      textColor={textColor} 
                    />
                  </div>
                )}

                {/* See All Locations Toggle Button */}
                <button
                  onClick={() => setShowLocationMap(!showLocationMap)}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-white/20 ${textColor} font-semibold transition-all hover:bg-white/10 hover:border-white/50`}
                >
                  <span>{showLocationMap ? 'Show Recommendations' : 'See All Locations'}</span>
                  {showLocationMap ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </>
            ) : (
              <div className={`text-sm ${textColor} opacity-80 text-center py-4`}>
                No recommendations available
              </div>
            )}
          </div>
        </div>

        {/* Center - Welcome & CTA */}
        <div className="md:col-span-6 flex flex-col justify-center items-center">
          <div className="text-center space-y-6 w-full">
            <div className="w-full">
              {/* Time of day indicator */}
              <div className="mb-4 inline-block">
                <span className="text-white/60 text-xs font-medium px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  {name} ✨
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-3 w-full">
                {user ? (
                  <>
                    Welcome {userProfile?.name || 'there'},<br />
                    <span className="text-white/90">study today?</span>
                  </>
                ) : (
                  <>
                    Welcome to<br />
                    <span className="text-white/90">JustDoeIt</span>
                  </>
                )}
              </h1>
              <p className="text-white/80 text-sm md:text-base w-full">
                {user ? (
                  isLoadingAnalytics ? (
                    "Loading your study stats..."
                  ) : userAnalytics ? (
                    <>
                      You studied {userAnalytics.streak} days in a <strong>row</strong>, {Math.round(userAnalytics.total_study_time / 60)} hours <strong>total</strong>!
                    </>
                  ) : (
                    "Start logging sessions to see your stats!"
                  )
                ) : (
                  "Sign in to start tracking your study sessions and discover the best study spots!"
                )}
              </p>
            </div>

            <div className="flex flex-col gap-4 items-center">
              {user ? (
                <>
                  {/* Main CTA Button - only show when authenticated */}
                  <button
                    onClick={() => setShowLogModal(true)}
                    className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all hover:shadow-xl hover:scale-105"
                  >
                    Log a session
                  </button>

                  {/* Secondary link */}
                  <button
                    onClick={() => setShowRecentModal(true)}
                    className="text-white/80 hover:text-white text-sm font-semibold transition-colors"
                  >
                    View recent sessions →
                  </button>
                </>
              ) : (
                <>
                  {/* Sign In Button - only show when not authenticated */}
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all hover:shadow-xl hover:scale-105"
                  >
                    Sign In
                  </button>

                  {/* Secondary text */}
                  <p className="text-white/60 text-sm">
                    Join thousands of students tracking their study habits
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar - Analytics */}
        <div className="md:col-span-3 flex flex-col">
          <div className="space-y-3 bg-white/10 backdrop-blur-md border-2 border-white/10 rounded-3xl p-6">
            <h2 className={`text-xl md:text-2xl font-bold ${textColor} mb-6`}>
              Personal Analytics
            </h2>

            <StudyContributionGraph textColor={textColor} />

            {/* Most Productive Location Statistic */}
            {mostProductiveLocationData?.image ? (
              <div className="relative overflow-hidden border border-white/20 rounded-2xl mb-4" style={{ height: '120px' }}>
                {/* Background image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-20"
                  style={{ backgroundImage: `url(${mostProductiveLocationData.image})` }}
                />
                
                {/* Blur overlay */}
                <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-b from-transparent to-black/40" />
                
                {/* Content */}
                <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                  <div className={`text-xs font-bold ${textColor} opacity-90 uppercase tracking-wide`}>
                    Most Productive Location
                  </div>
                  <div className="space-y-1">
                    <div className={`font-bold ${textColor} text-lg`}>
                      {mostProductiveLocationData.name}
                    </div>
                    <div className={`text-sm ${textColor} opacity-75 flex items-center gap-1`}>
                      <span>📍</span> {mostProductiveLocationData.shortloc}
                    </div>
                    <div className={`text-sm ${textColor} opacity-75`}>
                      No yap sessions here
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4">
                <div className={`text-sm font-bold ${textColor} mb-2`}>
                  Most Productive Location
                </div>
                {isLoadingAnalytics ? (
                  <div className={`text-xs ${textColor} opacity-90`}>Loading...</div>
                ) : userAnalytics?.most_productive_location?.location_id ? (
                  <div className={`text-xs ${textColor} opacity-90`}>
                    <div className="font-semibold">{userAnalytics.most_productive_location.location_name}</div>
                    <div className="opacity-75">{userAnalytics.most_productive_location.shortloc}</div>
                    <div className="opacity-75">No yap sessions here</div>
                  </div>
                ) : (
                  <div className={`text-xs ${textColor} opacity-80`}>
                    Log some sessions to see your most productive spot!
                  </div>
                )}
              </div>
            )}

            {/* Most Frequently Visited Location Statistic */}
            {mostVisitedLocationData?.image ? (
              <div className="relative overflow-hidden border border-white/20 rounded-2xl mb-4" style={{ height: '120px' }}>
                {/* Background image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-20"
                  style={{ backgroundImage: `url(${mostVisitedLocationData.image})` }}
                />
                
                {/* Blur overlay */}
                <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-b from-transparent to-black/40" />
                
                {/* Content */}
                <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                  <div className={`text-xs font-bold ${textColor} opacity-90 uppercase tracking-wide`}>
                    Most Visited Location
                  </div>
                  <div className="space-y-1">
                    <div className={`font-bold ${textColor} text-lg`}>
                      {mostVisitedLocationData.name}
                    </div>
                    <div className={`text-sm ${textColor} opacity-75 flex items-center gap-1`}>
                      <span>📍</span> {mostVisitedLocationData.shortloc}
                    </div>
                    <div className={`text-sm ${textColor} opacity-75`}>
                      Your go-to study spot
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4">
                <div className={`text-sm font-bold ${textColor} mb-2`}>
                  Most Visited Location
                </div>
                {isLoadingAnalytics ? (
                  <div className={`text-xs ${textColor} opacity-90`}>Loading...</div>
                ) : userAnalytics?.favorite_location && favoriteLocationName ? (
                  <div className={`text-xs ${textColor} opacity-90`}>
                    <div className="font-semibold">{favoriteLocationName}</div>
                    <div className="opacity-75">Your go-to study spot</div>
                  </div>
                ) : userAnalytics?.favorite_location ? (
                  <div className={`text-xs ${textColor} opacity-90`}>
                    <div className="font-semibold">Loading location name...</div>
                    <div className="opacity-75">Your go-to study spot</div>
                  </div>
                ) : (
                  <div className={`text-xs ${textColor} opacity-80`}>
                    Log some sessions to see your favorite spot!
                  </div>
                )}
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className={`text-sm font-bold ${textColor} mb-3`}>
                Your favorite collaborators were:
              </div>
              <div className="flex gap-2">
                {isLoadingAnalytics ? (
                  <div className={`${textColor} opacity-80 text-sm`}>Loading...</div>
                ) : studyBuddyData.length > 0 ? (
                  studyBuddyData.slice(0, 2).map((buddy, index) => (
                    <button 
                      key={index}
                      className={`flex-1 bg-white/10 hover:bg-white/20 ${textColor} font-semibold py-2 px-3 rounded-lg transition-colors text-sm border border-white/20`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{buddy.name}</span>
                        <span className="text-xs opacity-75">
                          {buddy.sessionCount} session{buddy.sessionCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className={`${textColor} opacity-80 text-sm`}>
                    Study with others to see your collaborators!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LogSessionModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        preloadedLocations={preloadedLocations}
        preloadedUsers={preloadedUsers}
        onLocationCreated={addLocation}
      />
      <RecentSessionsModal
        isOpen={showRecentModal}
        onClose={() => setShowRecentModal(false)}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      </div>
    </>
  );
}
