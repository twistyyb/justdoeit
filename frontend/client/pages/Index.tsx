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
import { useRecommendations } from "@/hooks/useRecommendations";
import { ChevronDown, ChevronUp, RefreshCw, Clock, Sparkles } from "lucide-react";
import type { StudyBuddy } from "../../shared/api";

// Types are now defined in the useSessionDataPreload hook

export default function Index() {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string>('');
  const { user, userProfile } = useAuth();
  const { gradient, name, textColor } = useTimeBasedGradient();
  
  // Preload session data and analytics
  const { 
    locations: preloadedLocations, 
    users: preloadedUsers, 
    userAnalytics,
    studyBuddyData,
    favoriteLocationName,
    mostProductiveLocationData,
    mostVisitedLocationData,
    isLoading: isPreloadingData,
    error: preloadError,
    isPreloaded,
    addLocation
  } = useSessionDataPreload(user?.id);

  // Separate recommendations system
  const {
    recommendations,
    isLoading: isGeneratingRecommendations,
    error: recommendationsError,
    hasGenerated,
    generateRecommendations,
    refreshRecommendations,
    hasValidCache,
    preloadedDetails
  } = useRecommendations(user?.id);

  const handleCardExpand = (locationId: string) => {
    setExpandedCardId(locationId);
  };

  const handleGenerateRecommendations = async () => {
    if (user?.id) {
      if (hasGenerated) {
        console.log("🔄 Refreshing AI recommendations...");
        await refreshRecommendations();
      } else {
        console.log("✨ Generating AI recommendations...");
        await generateRecommendations();
      }
    }
  };

  // User analytics are now loaded via the useSessionDataPreload hook

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
        <div className="md:col-span-3 flex flex-col h-full">
          <div className="flex flex-col bg-white/10 backdrop-blur-md border-2 border-white/10 rounded-3xl p-5 h-full">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className={`text-xl md:text-2xl font-bold ${textColor}`}>
                  Recommendations
                </h2>
              </div>
              {user && (
                <button
                  onClick={handleGenerateRecommendations}
                  disabled={isGeneratingRecommendations}
                  className={`p-2 rounded-lg border border-white/30 ${textColor} transition-all hover:bg-white/10 hover:border-white/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={hasGenerated ? "Refresh AI recommendations" : "Generate AI recommendations"}
                >
                  {hasGenerated ? (
                    <RefreshCw className={`w-4 h-4 ${isGeneratingRecommendations ? 'animate-spin' : ''}`} />
                  ) : (
                    <Sparkles className={`w-4 h-4 ${isGeneratingRecommendations ? 'animate-pulse' : ''}`} />
                  )}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {isGeneratingRecommendations ? (
                <div className={`text-sm ${textColor} opacity-80 text-center py-4`}>
                  Generating AI recommendations...
                </div>
              ) : recommendationsError ? (
                <div className={`text-sm ${textColor} opacity-80 text-center py-4`}>
                  Error: {recommendationsError}
                </div>
              ) : hasGenerated && recommendations.length > 0 ? (
                <>
                  {/* Show either recommendation cards or mini map, not both */}
                  {!showLocationMap ? (
                    <div className="flex flex-col gap-4 mb-4 pr-1">
                      {/* Show AI recommendations */}
                      {recommendations.slice(0, 3).map((item) => {
                        console.log("Recommendation item:", item);
                        // All recommendation items are now Location objects with reasoning in summary
                        const locationId = item.id;
                        const spotName = item.name;
                        const address = item.shortloc || 'Unknown';
                        const description = item.summary || "No description available";
                        const imageUrl = item.image || '';
                        const preloadedData = preloadedDetails.get(locationId);
                        console.log("imageUrl", imageUrl);
                        return (
                          <RecommendationCard
                            key={locationId}
                            locationId={locationId}
                            spotName={spotName}
                            address={address}
                            description={description}
                            textColor={textColor}
                            imageUrl={imageUrl}
                            isExpanded={expandedCardId === locationId}
                            onExpand={handleCardExpand}
                            preloadedDetails={preloadedData}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mb-4 animate-in slide-in-from-top-4 duration-300 pr-1">
                      <LocationMiniMap 
                        locations={preloadedLocations} 
                        textColor={textColor} 
                      />
                    </div>
                  )}

                  {/* See All Locations Toggle Button */}
                  <div className="flex-shrink-0 pt-2">
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
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className={`text-sm ${textColor} opacity-80 mb-4`}>
                    No recommendations yet
                  </div>
                  <div className={`text-xs ${textColor} opacity-60 mb-6`}>
                    Press the button above to generate AI-powered study location recommendations
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${textColor} opacity-50`}>
                    <Sparkles className={`w-3 h-3 ${textColor}`} />
                    <span>Powered by Claude</span>
                  </div>
                </div>
              )}
            </div>
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
                  isPreloadingData ? (
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
                {isPreloadingData ? (
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
                {isPreloadingData ? (
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
                {isPreloadingData ? (
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
