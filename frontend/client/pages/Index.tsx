import { useState } from "react";
import { LogSessionModal } from "@/components/LogSessionModal";
import { RecentSessionsModal } from "@/components/RecentSessionsModal";
import { RecommendationCard } from "@/components/RecommendationCard";
import { AnalyticsCard } from "@/components/AnalyticsCard";
import { useTimeBasedGradient } from "@/hooks/useTimeBasedGradient";

export default function Index() {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const { gradient, name } = useTimeBasedGradient();

  return (
    <div
      className="min-h-screen w-full overflow-hidden transition-all duration-[3000ms] ease-in-out"
      style={{
        backgroundImage: gradient,
      }}
    >
      {/* Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none"></div>

      {/* Main grid layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-4 md:p-8 min-h-screen">
        {/* Left sidebar - Recommendations */}
        <div className="md:col-span-1 flex flex-col">
          <div className="space-y-6 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-3xl p-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Recommendations
            </h2>

            <RecommendationCard
              spotName="Main stacks"
              address="1526A Oxford Street, UC Berkeley"
              description="Perfect for solo work. Quiet study area with limited distractions. Usually less crowded in the afternoon."
            />

            <RecommendationCard
              spotName="Café Saint Frank"
              address="2450 Mission Street, San Francisco"
              description="Casual study café with good coffee. Tends to be busy around lunch time. Great for collaborative studying."
            />

            <RecommendationCard
              spotName="The Study Spot"
              address="45 Park Avenue, New York"
              description="Modern co-working space with excellent amenities. Quieter in mornings. Good outlet availability throughout."
            />
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
                Welcome Joyce,<br />
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
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
              Personal Analytics
            </h2>

            <AnalyticsCard
              title="Github graph of study time density"
              subtitle="(Placeholder - would show actual chart)"
              content="📊 Study intensity visualization"
            />

            <div className="bg-orange-200/70 backdrop-blur-sm border-2 border-orange-400 rounded-2xl p-4 mb-4">
              <div className="text-sm font-bold text-gray-900 mb-2">
                You were most productive studying at...
              </div>
              <div className="text-xs text-gray-700">
                <div className="font-semibold">Café Saint Frank</div>
                <div className="mt-1">SF</div>
                <div className="mt-2 text-gray-600">
                  Usually busy around this time
                </div>
              </div>
            </div>

            <div className="bg-orange-200/70 backdrop-blur-sm border-2 border-orange-400 rounded-2xl p-4">
              <div className="text-sm font-bold text-gray-900 mb-3">
                Your favorite collaborators were:
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-orange-300 hover:bg-orange-400 text-gray-900 font-semibold py-2 px-3 rounded-lg transition-colors text-sm">
                  User Bryan
                </button>
                <button className="flex-1 bg-orange-300 hover:bg-orange-400 text-gray-900 font-semibold py-2 px-3 rounded-lg transition-colors text-sm">
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
      />
      <RecentSessionsModal
        isOpen={showRecentModal}
        onClose={() => setShowRecentModal(false)}
      />
    </div>
  );
}
