import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { RecommendationCache } from "@/lib/recommendationCache";
import type { Location, LocationDetailsResponse } from "../../shared/api";

interface RecommendationsState {
  recommendations: Location[];
  isLoading: boolean;
  error: string | null;
  hasGenerated: boolean;
  preloadedDetails: Map<string, LocationDetailsResponse>;
}

/**
 * Custom hook for managing AI recommendations
 * Handles caching, loading states, and generation
 */
export function useRecommendations(userId?: string) {
  const [state, setState] = useState<RecommendationsState>({
    recommendations: [],
    isLoading: false,
    error: null,
    hasGenerated: false,
    preloadedDetails: new Map(),
  });

  // Preload location details for all recommendations
  const preloadLocationDetails = useCallback(async (recs: Location[]) => {
    console.log("🔄 Preloading location details for", recs.length, "recommendations");
    
    try {
      // Fetch all location details in parallel
      const detailsPromises = recs.map(async (rec) => {
        try {
          const details = await apiClient.getLocationDetails(rec.id);
          return { locationId: rec.id, details };
        } catch (err) {
          console.error(`Failed to preload details for ${rec.id}:`, err);
          return null;
        }
      });

      const results = await Promise.all(detailsPromises);
      
      // Update state with preloaded details
      setState(prev => {
        const newMap = new Map(prev.preloadedDetails);
        results.forEach(result => {
          if (result) {
            newMap.set(result.locationId, result.details);
          }
        });
        console.log("✅ Preloaded", newMap.size, "location details");
        return { ...prev, preloadedDetails: newMap };
      });
    } catch (error) {
      console.error("❌ Error preloading location details:", error);
    }
  }, []);

  const generateRecommendations = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, error: "No user ID provided" }));
      return;
    }

    console.log("🔄 Generating recommendations...");
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check cache first
      const cachedRecs = RecommendationCache.get(userId);
      
      if (cachedRecs) {
        console.log("📦 Using cached recommendations");
        setState({
          recommendations: cachedRecs,
          isLoading: false,
          error: null,
          hasGenerated: true,
          preloadedDetails: new Map(),
        });
        // Preload details for cached recommendations
        preloadLocationDetails(cachedRecs);
        return;
      }

      // Fetch fresh recommendations from API
      console.log("🔄 Fetching fresh recommendations from API");
      const freshRecs = await apiClient.getRecommendations(userId);
      
      // Cache the fresh recommendations
      RecommendationCache.set(userId, freshRecs);
      
      setState({
        recommendations: freshRecs,
        isLoading: false,
        error: null,
        hasGenerated: true,
        preloadedDetails: new Map(),
      });
      
      // Preload location details for all recommendations
      preloadLocationDetails(freshRecs);
      
      console.log("✅ Recommendations generated successfully");
    } catch (error) {
      console.error("❌ Error generating recommendations:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to generate recommendations",
      }));
    }
  }, [userId, preloadLocationDetails]);

  const refreshRecommendations = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, error: "No user ID provided" }));
      return;
    }

    console.log("🔄 Refreshing recommendations...");
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Clear local cache to force fresh fetch
      RecommendationCache.clear(userId);
      
      // Fetch fresh recommendations from API (will use backend cache or generate new)
      const freshRecs = await apiClient.getRecommendations(userId);
      
      // Cache the fresh recommendations
      RecommendationCache.set(userId, freshRecs);
      
      setState({
        recommendations: freshRecs,
        isLoading: false,
        error: null,
        hasGenerated: true,
        preloadedDetails: new Map(),
      });
      
      // Preload location details for all recommendations
      preloadLocationDetails(freshRecs);
      
      console.log("✅ Recommendations refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing recommendations:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to refresh recommendations",
      }));
    }
  }, [userId, preloadLocationDetails]);

  const clearRecommendations = useCallback(() => {
    if (userId) {
      RecommendationCache.clear(userId);
    }
    setState({
      recommendations: [],
      isLoading: false,
      error: null,
      hasGenerated: false,
      preloadedDetails: new Map(),
    });
  }, [userId]);

  return {
    ...state,
    generateRecommendations,
    refreshRecommendations,
    clearRecommendations,
    hasValidCache: userId ? RecommendationCache.hasValidCache(userId) : false,
  };
}
