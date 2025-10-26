import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogSessionModal } from "@/components/LogSessionModal";
import { RecentSessionsModal } from "@/components/RecentSessionsModal";
import { RecommendationCard } from "@/components/RecommendationCard";
import { StudyContributionGraph } from "@/components/StudyContributionGraph";
import { AuthModal } from "@/components/AuthModal";
import { UserProfile } from "@/components/UserProfile";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useTimeBasedGradient } from "@/hooks/useTimeBasedGradient";
import { useSessionDataPreload } from "@/hooks/useSessionDataPreload";

export default function Index() {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
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
        <div className="md:col-span-1 flex flex-col h-full">
          <div className="flex flex-col h-full bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-3xl p-5">
            <h2 className={`text-xl md:text-2xl font-bold ${textColor} mb-4`}>
              Recommendations
            </h2>

            {isPreloadingData ? (
              <div className={`text-sm ${textColor} opacity-80 text-center py-4`}>
                Loading recommendations...
              </div>
            ) : preloadedLocations.length > 0 ? (
              <div className="flex flex-col gap-4 flex-1">
                {preloadedLocations.slice(0, 3).map((location) => (
                  <RecommendationCard
                    key={location.id}
                    spotName={location.name}
                    address={location.shortloc}
                    description={location.summary || "No description available"}
                    textColor={textColor}
                    imageUrl={location.image}
                  />
                ))}
              </div>
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
                You studied 5 days in a row, 200 hours in the past week!
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

            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4">
              <div className={`text-sm font-bold ${textColor} mb-2`}>
                You were most productive studying at...
              </div>
              <div className={`text-xs ${textColor} opacity-90`}>
                <div className="font-semibold">Café Saint Frank</div>
                <div className="mt-1">SF</div>
                <div className={`mt-2 ${textColor} opacity-80`}>
                  Usually busy around this time
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className={`text-sm font-bold ${textColor} mb-3`}>
                Your favorite collaborators were:
              </div>
              <div className="flex gap-2">
                <button className={`flex-1 bg-white/10 hover:bg-white/20 ${textColor} font-semibold py-2 px-3 rounded-lg transition-colors text-sm border border-white/20`}>
                  User Bryan
                </button>
                <button className={`flex-1 bg-white/10 hover:bg-white/20 ${textColor} font-semibold py-2 px-3 rounded-lg transition-colors text-sm border border-white/20`}>
                  User Andrew
                </button>
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
