/**
 * Shared types between client and server
 */

// === Response Types ===

export interface DemoResponse {
  message: string;
}

// === Location Types ===

export interface Location {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateLocationRequest {
  name: string;
}

export interface CreateLocationResponse {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
}

// === User Types ===

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
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
  inputTime: string;
  duration: number; // in minutes
  rating: number; // 0-5, can be 0.5 increments
  cleanliness: number; // 0-5
  comment: string;
  outletAvailability: boolean;
  collaborators: string[]; // UUIDs of collaborating users
}

export interface CreateSessionRequest {
  locationid: string; // UUID
  inputTime: string; // ISO 8601 format
  duration: number; // minutes
  rating: number; // 0-5
  cleanliness: number; // 0-5
  comment: string;
  outletAvailability: boolean;
  collaborators: string[]; // UUIDs
}

export interface CreateSessionResponse {
  id: string;
  userId: string;
  locationId: string;
  createdAt: string;
  inputTime: string;
  duration: number;
  rating: number;
  cleanliness: number;
  comment: string;
  outletAvailability: boolean;
  collaborators: string[];
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

// === API Utility Types ===

export type ApiEndpoint = 
  | "GET /api/locations"
  | "POST /api/locations"
  | "GET /api/users"
  | "GET /api/sessions"
  | "POST /api/create_sesh"
  | "GET /api/sessions/:id";
