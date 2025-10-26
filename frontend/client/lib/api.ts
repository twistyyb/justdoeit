/**
 * Centralized API client for all backend requests
 * Backend API: http://127.0.0.1:5002
 */

import {
  Location,
  CreateLocationRequest,
  CreateLocationResponse,
  LocationDetailsResponse,
  User,
  SearchUsersRequest,
  Session,
  CreateSessionRequest,
  CreateSessionResponse,
  RecommendationResponse,
} from "../../shared/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5002";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new Error(error.detail || `API error: ${response.status}`);
      }

      if (response.status === 204) {
        return null as unknown as T;
      }

      return response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // === Location Endpoints ===

  async getLocations(userId: string): Promise<Location[]> {
    // Endpoint: GET /location_names
    // Backend returns: { locations: [...] }
    const response = await this.request<{ locations: Location[] }>(`/location_names/`);
    return response.locations;
  }

  async createLocation(data: CreateLocationRequest): Promise<CreateLocationResponse> {
    // Endpoint: POST /create_location
    // Backend expects: { name, shortloc, coordinate_x?, coordinate_y?, summary? }
    const response = await this.request<{ message: string; data: any[] }>("/create_location", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Backend returns: { message: "Location created", data: [...] }
    // Extract the created location from the data array
    return response.data[0];
  }

  async getLocationDetails(locationId: string): Promise<LocationDetailsResponse> {
    // Endpoint: GET /location_details/{location_id}
    // Returns detailed location information including ratings and crowdedness data
    return this.request<LocationDetailsResponse>(`/location_details/${locationId}`);
  }

  // === User Endpoints (if implemented) ===

  async getUsers(): Promise<User[]> {
    // Endpoint: GET /users
    // Backend returns: { users: [...] }
    const response = await this.request<{ users: User[] }>("/users");
    return response.users;
  }

  async getUser(userId: string): Promise<User> {
    // Endpoint: GET /users/{id}
    return this.request<User>(`/users/${userId}`);
  }

  // === Session Endpoints ===

  async getSessions(): Promise<Session[]> {
    // Endpoint: GET /sessions
    return this.request<Session[]>("/sessions");
  }

  async getSession(sessionId: string): Promise<Session> {
    // Endpoint: GET /sessions/{id}
    return this.request<Session>(`/sessions/${sessionId}`);
  }

  async createSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
    // Endpoint: POST /create_session
    // Input format:
    // {
    //   creators: List[uuid] (including self),
    //   locationid: uuid,
    //   inputtime: isoformat with timezone,
    //   duration: int (mins),
    //   rating: double (1-5),
    //   cleanliness: int (1-5),
    //   comment: str,
    //   outletavailability: bool  (LOWERCASE!)
    // }
    // Output: {"message": "Session created", "data": {...}}
    return this.request<CreateSessionResponse>("/create_session", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // === Recommendation Endpoints ===

  async getRecommendations(userId: string): Promise<Location[]> {
    // Endpoint: GET /get_recommendation/{user_id}
    // Returns AI-generated study location recommendations with reasoning
    // Backend returns: { locations: [...] }
    const response = await this.request<{ locations: Location[] }>(`/get_recommendation/${userId}`);
    return response.locations;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing with custom base URL
export { ApiClient };
