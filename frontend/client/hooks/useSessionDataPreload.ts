import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import type { Location, User, StudyBuddy } from "../../shared/api";

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

interface SessionDataPreloadState {
  locations: Location[];
  users: User[];
  userAnalytics: UserAnalytics | null;
  studyBuddyData: {name: string, sessionCount: number}[];
  favoriteLocationName: string | null;
  mostProductiveLocationData: {image: string, name: string, shortloc: string} | null;
  mostVisitedLocationData: {image: string, name: string, shortloc: string} | null;
  isLoading: boolean;
  error: string | null;
  isPreloaded: boolean;
}

/**
 * Custom hook to preload session data including locations, users, and user analytics.
 * This hook fetches all data as soon as the component mounts, making the app feel instant.
 * Note: Recommendations are handled separately by useRecommendations hook.
 */
export function useSessionDataPreload(userId?: string) {
  const [state, setState] = useState<SessionDataPreloadState>({
    locations: [],
    users: [],
    userAnalytics: null,
    studyBuddyData: [],
    favoriteLocationName: null,
    mostProductiveLocationData: null,
    mostVisitedLocationData: null,
    isLoading: false,
    error: null,
    isPreloaded: false,
  });

  const hasStartedLoading = useRef(false);

  useEffect(() => {
    const preloadData = async () => {
      if (!userId) {
        console.log("⏭️ No user ID, skipping data preload");
        return;
      }

      console.log("🔄 Starting comprehensive data preload...");
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Fetch data in parallel (locations, users, analytics)
        const [locations, users, userAnalytics] = await Promise.all([
          apiClient.getLocations(userId),
          apiClient.getUsers(),
          fetchUserAnalytics(userId)
        ]);        
        
        console.log("✅ All data preloaded successfully:", { 
          locationsCount: locations.length, 
          usersCount: users.length,
          hasAnalytics: !!userAnalytics
        });
        
        // Add a small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setState({
          locations,
          users,
          userAnalytics,
          studyBuddyData: userAnalytics?.studyBuddyData || [],
          favoriteLocationName: userAnalytics?.favoriteLocationName || null,
          mostProductiveLocationData: userAnalytics?.mostProductiveLocationData || null,
          mostVisitedLocationData: userAnalytics?.mostVisitedLocationData || null,
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

    // Only preload if we haven't already started loading and have a user ID
    if (!hasStartedLoading.current && userId) {
      hasStartedLoading.current = true;
      preloadData();
    }
  }, [userId]);

  // Helper function to fetch user analytics with all related data
  const fetchUserAnalytics = async (userId: string) => {
    try {
      // Fetch basic analytics
      const response = await fetch(`http://127.0.0.1:5002/user_analytics/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const analytics: UserAnalytics = await response.json();
      
      // Fetch study buddy names and session counts
      const studyBuddyData: {name: string, sessionCount: number}[] = [];
      if (analytics.study_buddies.length > 0) {
        for (const buddy of analytics.study_buddies) {
          try {
            const buddyResponse = await fetch(`http://127.0.0.1:5002/user_profile/${buddy.user_id}`);
            if (buddyResponse.ok) {
              const buddyProfile = await buddyResponse.json();
              studyBuddyData.push({
                name: buddyProfile.name || 'Unknown User',
                sessionCount: buddy.session_count
              });
            }
          } catch (error) {
            console.error(`Error fetching buddy ${buddy.user_id}:`, error);
            studyBuddyData.push({
              name: 'Unknown User',
              sessionCount: buddy.session_count
            });
          }
        }
      }

      // Fetch most productive location image
      let mostProductiveLocationData = null;
      if (analytics.most_productive_location?.location_id) {
        try {
          const locationsResponse = await fetch(`http://127.0.0.1:5002/location_names`);
          if (locationsResponse.ok) {
            const locationsData = await locationsResponse.json();
            const location = locationsData.locations.find(
              (loc: any) => loc.id === analytics.most_productive_location?.location_id
            );
            if (location) {
              mostProductiveLocationData = {
                image: location.image || '',
                name: analytics.most_productive_location.location_name || '',
                shortloc: analytics.most_productive_location.shortloc || ''
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching most productive location:`, error);
        }
      }

      // Fetch favorite location data
      let favoriteLocationName = null;
      let mostVisitedLocationData = null;
      if (analytics.favorite_location) {
        try {
          const locationResponse = await fetch(`http://127.0.0.1:5002/location_details/${analytics.favorite_location}`);
          if (locationResponse.ok) {
            const locationData = await locationResponse.json();
            favoriteLocationName = locationData.name;
            
            const locationsResponse = await fetch(`http://127.0.0.1:5002/location_names`);
            if (locationsResponse.ok) {
              const locationsData = await locationsResponse.json();
              const location = locationsData.locations.find(
                (loc: any) => loc.id === analytics.favorite_location
              );
              if (location && location.image) {
                mostVisitedLocationData = {
                  image: location.image,
                  name: locationData.name,
                  shortloc: location.shortloc
                };
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching favorite location:`, error);
        }
      }

      return {
        ...analytics,
        studyBuddyData,
        favoriteLocationName,
        mostProductiveLocationData,
        mostVisitedLocationData
      };
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      return null;
    }
  };

  // Function to add a new location to the preloaded data
  const addLocation = (newLocation: Location) => {
    setState(prev => ({
      ...prev,
      locations: [...prev.locations, newLocation],
    }));
  };

  return {
    ...state,
    addLocation,
  };
}
