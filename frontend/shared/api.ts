/**
 * Shared types between client and server
 * Matches backend API at http://127.0.0.1:5002
 */

// === Location Types ===

export interface Location {
  id: string;        // uuid
  name: string;
  shortloc: string;
  summary?: string;
  image?: string;
}

export interface CreateLocationRequest {
  name: string;
  shortloc: string;      // Required by backend
  summary?: string;      // Optional
  coordinate_x?: number; // Optional
  coordinate_y?: number; // Optional
}

export interface CreateLocationResponse {
  id: string;
  name: string;
  shortloc: string;
  summary?: string;
  coordinate_x?: number;
  coordinate_y?: number;
}

// === User Types ===

export interface User {
  id: string;
  name: string;
}

export interface SearchUsersRequest {
  query?: string;
  limit?: number;
}

// === Session Types ===

export interface Session {
  id: string;
  userId: string;
  locationId: string;
  createdAt: string;
  inputtime: string;  // ISO format with timezone
  duration: number;   // in minutes
  rating: number;     // 1-5 (double)
  cleanliness: number; // 1-5 (int)
  comment: string;
  outletAvailability: boolean;
  creators: string[]; // UUIDs including self
}

// Backend API request format for POST /create_session
export interface CreateSessionRequest {
  creators: string[];        // List[uuid] including self
  locationid: string;        // uuid from dropdown
  inputtime: string;         // ISO format with timezone
  duration: number;          // int (mins)
  rating: number;            // double (1-5)
  cleanliness: number;       // int (1-5)
  comment: string;
  outletavailability: boolean; // IMPORTANT: all lowercase, not camelCase!
}

// Backend API response format
export interface CreateSessionResponse {
  confirmation?: string;
  [key: string]: any; // Allow for flexible response structure
}

// === Error Response ===

export interface ErrorResponse {
  detail: string;
  status: number;
}

// === Pagination ===

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// === Study Analytics Types ===

export interface SessionTimeDuration {
  inputtime: string | null;
  duration: number | null; // in minutes
}

export interface UserSessionsTimeResponse {
  sessions: SessionTimeDuration[];
}

export interface SessionDetails {
  id: string;
  locationid: string;
  location_name: string;
  inputtime: string | null;
  duration: number | null;
  rating: number;
  cleanliness: number;
  comment: string | null;
  outletavailability: boolean | null;
  creators: string[] | null;
  crowdedness: number | null;
}

export interface UserRecentSessionsResponse {
  sessions: SessionDetails[];
}

// === API Utility Types ===

export type ApiEndpoint = 
  | "GET /location_names"
  | "POST /location_names"
  | "GET /users"
  | "GET /sessions"
  | "POST /create_session"
  | "GET /sessions/:id"
  | "GET /user_sessions_time/:user_id";
