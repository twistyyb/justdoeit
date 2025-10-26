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
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const { user, userProfile } = useAuth();
  const { gradient, name, textColor } = useTimeBasedGradient();
  
  // Preload session data as soon as the page loads
  const { 
    locations: preloadedLocations, 
    users: preloadedUsers, 
    isLoading: isPreloadingData,
    error: preloadError,
    isPreloaded,
    addLocation 
  } = useSessionDataPreload();

  const handleCardExpand = (locationId: string) => {
    setExpandedCardId(locationId);
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

        // Fetch favorite location name
        if (data.favorite_location) {
          try {
            const locationResponse = await fetch(
              `http://127.0.0.1:5002/location_details/${data.favorite_location}`
            );
            if (locationResponse.ok) {
              const locationData = await locationResponse.json();
              setFavoriteLocationName(locationData.name);
            }
          } catch (error) {
            console.error(`Error fetching favorite location ${data.favorite_location}:`, error);
            setFavoriteLocationName(null);
          }
        } else {
          setFavoriteLocationName(null);
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

      {/* Header with user profile */}
      <div className="absolute bottom-4 left-4 z-20 flex justify-start">
        {user ? (
          <UserProfile />
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 font-bold py-2 px-4 rounded-full text-sm shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Main grid layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-4 md:p-8 min-h-screen">
        {/* Left sidebar - Recommendations */}
        <div className="md:col-span-1 flex flex-col">
          <div className="flex flex-col bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-3xl p-5">
            <h2 className={`text-xl md:text-2xl font-bold ${textColor} mb-4`}>
              Recommendations
            </h2>

            {isPreloadingData ? (
              <div className={`text-sm ${textColor} opacity-80 text-center py-4`}>
                Loading recommendations...
              </div>
            ) : preloadedLocations.length > 0 ? (
              <>
                {/* Show either recommendation cards or mini map, not both */}
                {!showLocationMap ? (
                  <div className="flex flex-col gap-4 mb-4">
                    {preloadedLocations.slice(0, 3).map((location) => (
                      <RecommendationCard
                        key={location.id}
                        locationId={location.id}
                        spotName={location.name}
                        address={location.shortloc}
                        description={location.summary || "No description available"}
                        textColor={textColor}
                        imageUrl={location.image}
                        isExpanded={expandedCardId === location.id}
                        onExpand={handleCardExpand}
                      />
                    ))}
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
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-white/30 ${textColor} font-semibold transition-all hover:bg-white/10 hover:border-white/50`}
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
        <div className="md:col-span-1 flex flex-col justify-center items-center">
          <div className="text-center space-y-6">
            <div>
              {/* Time of day indicator */}
              <div className="mb-4 inline-block">
                <span className="text-white/60 text-xs font-medium px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  {name} ✨
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
                Welcome {userProfile?.name || 'there'},<br />
                <span className="text-white/90">study today?</span>
              </h1>
              <p className="text-white/80 text-sm md:text-base">
                {isLoadingAnalytics ? (
                  "Loading your study stats..."
                ) : userAnalytics ? (
                  `You studied ${userAnalytics.streak} days in a row, ${Math.round(userAnalytics.total_study_time / 60)} hours total!`
                ) : (
                  "Start logging sessions to see your stats!"
                )}
              </p>
            </div>

            <div className="flex flex-col gap-4 items-center">
              {/* Main CTA Button */}
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
            </div>
          </div>
        </div>

        {/* Right sidebar - Analytics */}
        <div className="md:col-span-1 flex flex-col">
          <div className="space-y-3 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-3xl p-6">
            <h2 className={`text-xl md:text-2xl font-bold ${textColor} mb-6`}>
              Personal Analytics
            </h2>

            <StudyContributionGraph textColor={textColor} />

            {/* Most Productive Location Statistic */}
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
                  <div className="opacity-75">Avg Rating: {userAnalytics.most_productive_location.average_rating.toFixed(1)}/5</div>
                </div>
              ) : (
                <div className={`text-xs ${textColor} opacity-80`}>
                  Log some sessions to see your most productive spot!
                </div>
              )}
            </div>

            {/* Most Frequently Visited Location Statistic */}
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
