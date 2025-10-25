# API Integration Documentation

## Overview

The frontend is fully prepared for integration with FastAPI backend and Supabase database. All components use a centralized API client (`client/lib/api.ts`) that makes it easy to switch between development and production environments.

## API Client Usage

The `ApiClient` class in `client/lib/api.ts` handles all HTTP requests with:
- Automatic error handling
- JSON serialization
- Consistent error responses
- Environment-based URL configuration

### Configuration

```typescript
// Uses VITE_API_BASE_URL environment variable
// Defaults to /api if not set
const apiClient = new ApiClient();
```

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000  # Development
VITE_API_BASE_URL=https://api.example.com # Production
```

## API Endpoints Specification

### 1. Locations API

#### GET /api/locations
Fetch all available study locations

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Main stacks UC Berkeley",
    "createdAt": "2025-10-25T10:00:00Z",
    "createdBy": "user-uuid"
  }
]
```

**Usage:**
```typescript
const locations = await apiClient.getLocations();
```

---

#### POST /api/locations
Create a new study location

**Request Body:**
```json
{
  "name": "New Location Name"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "New Location Name",
  "createdAt": "2025-10-25T10:00:00Z",
  "createdBy": "current-user-uuid"
}
```

**Usage:**
```typescript
const newLocation = await apiClient.createLocation({ name: "Café Name" });
```

---

### 2. Users API

#### GET /api/users
Search for users

**Query Parameters:**
- `query` (optional): Search query (name or email)
- `limit` (optional): Max results (default: 10)

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Bryan Chen",
    "email": "bryan@example.com",
    "createdAt": "2025-10-25T10:00:00Z"
  }
]
```

**Usage:**
```typescript
const users = await apiClient.getUsers({ query: "Bryan", limit: 10 });
```

---

#### GET /api/users/{id}
Get specific user details

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Bryan Chen",
  "email": "bryan@example.com",
  "createdAt": "2025-10-25T10:00:00Z"
}
```

**Usage:**
```typescript
const user = await apiClient.getUser("user-uuid");
```

---

### 3. Sessions API

#### GET /api/sessions
Get all sessions for current user

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "userId": "current-user-uuid",
    "locationId": "location-uuid",
    "createdAt": "2025-10-25T10:00:00Z",
    "inputTime": "2025-10-25T14:30:00Z",
    "duration": 120,
    "rating": 4,
    "cleanliness": 4,
    "comment": "Great study spot",
    "outletAvailability": true,
    "collaborators": ["user-uuid-1", "user-uuid-2"]
  }
]
```

**Usage:**
```typescript
const sessions = await apiClient.getSessions();
```

---

#### GET /api/sessions/{id}
Get specific session details

**Response (200 OK):**
```json
{
  "id": "uuid",
  "userId": "current-user-uuid",
  "locationId": "location-uuid",
  "createdAt": "2025-10-25T10:00:00Z",
  "inputTime": "2025-10-25T14:30:00Z",
  "duration": 120,
  "rating": 4,
  "cleanliness": 4,
  "comment": "Great study spot",
  "outletAvailability": true,
  "collaborators": ["user-uuid-1", "user-uuid-2"]
}
```

**Usage:**
```typescript
const session = await apiClient.getSession("session-uuid");
```

---

#### POST /api/create_sesh
Create a new study session

**Request Body:**
```json
{
  "locationid": "location-uuid",
  "inputTime": "2025-10-25T14:30:00Z",
  "duration": 120,
  "rating": 4,
  "cleanliness": 4,
  "comment": "Great study spot",
  "outletAvailability": true,
  "collaborators": ["user-uuid-1", "user-uuid-2"]
}
```

**Response (201 Created):**
```json
{
  "id": "newly-created-uuid",
  "userId": "current-user-uuid",
  "locationId": "location-uuid",
  "createdAt": "2025-10-25T10:00:00Z",
  "inputTime": "2025-10-25T14:30:00Z",
  "duration": 120,
  "rating": 4,
  "cleanliness": 4,
  "comment": "Great study spot",
  "outletAvailability": true,
  "collaborators": ["user-uuid-1", "user-uuid-2"]
}
```

**Usage:**
```typescript
const newSession = await apiClient.createSession({
  locationid: "location-uuid",
  inputTime: "2025-10-25T14:30:00Z",
  duration: 120,
  rating: 4,
  cleanliness: 4,
  comment: "Great study spot",
  outletAvailability: true,
  collaborators: ["user-uuid-1"]
});
```

---

## Error Handling

All API methods throw errors on failure. Handle them like this:

```typescript
try {
  const locations = await apiClient.getLocations();
  setLocations(locations);
} catch (error) {
  console.error("Failed to fetch locations:", error);
  // Show error to user via toast/alert
}
```

## Frontend Components Ready for Integration

### LocationSelector
- **File:** `client/components/LocationSelector.tsx`
- **Ready calls:** 
  - `apiClient.getLocations()` (line 27-32)
  - `apiClient.createLocation()` (line 39-45)

### CollaboratorSelector
- **File:** `client/components/CollaboratorSelector.tsx`
- **Ready call:** `apiClient.getUsers()` (line 31-35)

### LogSessionModal
- **File:** `client/components/LogSessionModal.tsx`
- **Ready call:** `apiClient.createSession()` (line 54-59)

### RecentSessionsModal
- **File:** `client/components/RecentSessionsModal.tsx`
- **Ready call:** `apiClient.getSessions()` (needs implementation)

## Implementation Checklist

### Backend Developer
- [ ] Create FastAPI app with CORS enabled
- [ ] Implement Location endpoints (GET, POST)
- [ ] Implement Users endpoints (GET, GET by ID)
- [ ] Implement Sessions endpoints (GET, POST, GET by ID)
- [ ] Add input validation (Pydantic models)
- [ ] Add error handling with proper HTTP status codes
- [ ] Add database connection (Supabase)
- [ ] Test all endpoints with provided request/response examples

### Database Admin
- [ ] Create `locations` table
  - Columns: id (UUID), name (string), createdAt (timestamp), createdBy (UUID)
- [ ] Create `sessions` table
  - Columns: id, userId, locationId, createdAt, inputTime, duration, rating, cleanliness, comment, outletAvailability, collaborators (JSON/ARRAY)
- [ ] Create `users` table
  - Columns: id, name, email, createdAt
- [ ] Add foreign key constraints
- [ ] Add indexes for performance
- [ ] Set up Row-Level Security (RLS) policies if needed

### Frontend Developer (When Backend Ready)
- [ ] Uncomment API calls in LocationSelector.tsx
- [ ] Uncomment API calls in CollaboratorSelector.tsx
- [ ] Uncomment API calls in LogSessionModal.tsx
- [ ] Implement API calls in RecentSessionsModal.tsx
- [ ] Add loading skeletons to modals
- [ ] Add proper error toasts/alerts
- [ ] Test full integration flow

## Testing the Integration

### Manual Testing Steps

1. **Test Location Fetching:**
   ```typescript
   // In browser console
   import { apiClient } from './client/lib/api'
   apiClient.getLocations().then(console.log)
   ```

2. **Test User Search:**
   ```typescript
   apiClient.getUsers({ query: "Bryan" }).then(console.log)
   ```

3. **Test Session Creation:**
   ```typescript
   apiClient.createSession({
     locationid: "loc-123",
     inputTime: "2025-10-25T14:30:00Z",
     duration: 120,
     rating: 4,
     cleanliness: 4,
     comment: "Test",
     outletAvailability: true,
     collaborators: []
   }).then(console.log)
   ```

## FastAPI Implementation Example

Here's a minimal FastAPI example to guide the backend developer:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
from pydantic import BaseModel
import uuid

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Location(BaseModel):
    id: str
    name: str
    createdAt: str
    createdBy: str

class CreateLocationRequest(BaseModel):
    name: str

@app.get("/api/locations", response_model=List[Location])
async def get_locations():
    # TODO: Fetch from Supabase
    return []

@app.post("/api/locations", response_model=Location)
async def create_location(data: CreateLocationRequest):
    # TODO: Save to Supabase
    return {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "createdAt": datetime.utcnow().isoformat(),
        "createdBy": "current-user-id"  # TODO: Get from auth
    }
```

## Production Deployment

1. Set `VITE_API_BASE_URL` to your FastAPI production URL
2. Ensure CORS is properly configured on FastAPI
3. Add authentication (JWT, etc.) when ready
4. Update API client to include auth headers

---

**Status**: ✅ Frontend ready for backend integration
**Last Updated**: 2025-10-25
**API Client Location**: `client/lib/api.ts`
