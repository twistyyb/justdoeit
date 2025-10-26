import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import type { Location, User } from "../../shared/api";

interface SessionDataPreloadState {
  locations: Location[];
  users: User[];
  isLoading: boolean;
  error: string | null;
  isPreloaded: boolean;
}

/**
 * Custom hook to preload session data (locations and users) for the LogSessionModal.
 * This hook fetches data as soon as the component mounts, making the modal feel instant.
 */
export function useSessionDataPreload() {
  const [state, setState] = useState<SessionDataPreloadState>({
    locations: [],
    users: [],
    isLoading: false,
    error: null,
    isPreloaded: false,
  });

  useEffect(() => {
    const preloadData = async () => {
      console.log("🔄 Starting session data preload...");
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Fetch both locations and users in parallel for maximum efficiency
        const [locations, users] = await Promise.all([
          apiClient.getLocations(),
          apiClient.getUsers()
        ]);
        
        console.log("✅ Session data preloaded successfully:", { 
          locationsCount: locations.length, 
          usersCount: users.length 
        });
        
        // Add a small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setState({
          locations,
          users,
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
  }, [state.isPreloaded, state.isLoading]);

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
