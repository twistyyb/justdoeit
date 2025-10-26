import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import type { Location, User, Recommendation } from "../../shared/api";

interface SessionDataPreloadState {
  locations: Location[];
  users: User[];
  recommendations: Recommendation[];
  isLoading: boolean;
  error: string | null;
  isPreloaded: boolean;
}

/**
 * Custom hook to preload session data (locations, users, and recommendations) for the LogSessionModal.
 * This hook fetches data as soon as the component mounts, making the modal feel instant.
 */
export function useSessionDataPreload(userId?: string) {
  const [state, setState] = useState<SessionDataPreloadState>({
    locations: [],
    users: [],
    recommendations: [],
    isLoading: false,
    error: null,
    isPreloaded: false,
  });

  useEffect(() => {
    const preloadData = async () => {
      console.log("🔄 Starting session data preload...");
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Fetch locations and users in parallel
        const [locations, users] = await Promise.all([
          apiClient.getLocations(),
          apiClient.getUsers()
        ]);
        
        // Fetch recommendations separately if we have a userId
        let recommendations: Recommendation[] = [];
        if (userId) {
          try {
            const recommendationResponse = await apiClient.getRecommendations(userId);
            recommendations = recommendationResponse.data?.recommendations || [];
          } catch (error) {
            console.warn("Failed to fetch recommendations:", error);
            // Continue without recommendations if they fail
          }
        }
        
        console.log("✅ Session data preloaded successfully:", { 
          locationsCount: locations.length, 
          usersCount: users.length,
          recommendationsCount: recommendations.length
        });
        
        // Add a small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setState({
          locations,
          users,
          recommendations,
          isLoading: false,
          error: null,
          isPreloaded: true,
        });
      } catch (error) {
        console.error("❌ Error preloading session data:", error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: "Failed to preload session data",
          isPreloaded: false,
        }));
      }
    };

    // Only preload if we haven't already loaded the data
    if (!state.isPreloaded && !state.isLoading) {
      preloadData();
    }
  }, [state.isPreloaded, state.isLoading, userId]);

  // Function to add a new location to the preloaded data
  const addLocation = (newLocation: Location) => {
    setState(prev => ({
      ...prev,
      locations: [...prev.locations, newLocation],
    }));
  };

  // Function to refresh the preloaded data
  const refreshData = async () => {
    setState(prev => ({ ...prev, isPreloaded: false, isLoading: false }));
  };

  return {
    ...state,
    addLocation,
    refreshData,
  };
}
