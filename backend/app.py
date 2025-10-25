from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client
from database import get_database, get_supabase, db_manager
from models import LocationCreate, LocationResponse, SessionCreate, SessionResponse, SessionWithLocation
from typing import List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Just Doe It API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database connections on startup"""
    try:
        # Initialize Supabase
        if db_manager.initialize_supabase():
            logger.info("Supabase initialized successfully")
        else:
            logger.warning("Supabase initialization failed")
        
        # Test connection
        if db_manager.test_connection():
            logger.info("Database connection test successful")
        else:
            logger.warning("Database connection test failed")
            
    except Exception as e:
        logger.error(f"Startup error: {e}")

@app.get("/")
def read_root():
    return {"message": "Just Doe It API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

# Location endpoints
@app.post("/locations/", response_model=LocationResponse)
async def create_location(location: LocationCreate, supabase: Client = Depends(get_supabase)):
    """Create a new location"""
    try:
        result = supabase.table("locations").insert(location.dict()).execute()
        return result.data[0]
    except Exception as e:
        logger.error(f"Error creating location: {e}")
        raise HTTPException(status_code=500, detail="Failed to create location")

@app.get("/locations/", response_model=List[LocationResponse])
async def get_locations(supabase: Client = Depends(get_supabase)):
    """Get all locations"""
    try:
        result = supabase.table("locations").select("*").execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching locations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch locations")

@app.get("/locations/{location_id}", response_model=LocationResponse)
async def get_location(location_id: str, supabase: Client = Depends(get_supabase)):
    """Get a specific location by ID"""
    try:
        result = supabase.table("locations").select("*").eq("id", location_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Location not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching location: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch location")

# Session endpoints
@app.post("/sessions/", response_model=SessionResponse)
async def create_session(session: SessionCreate, supabase: Client = Depends(get_supabase)):
    """Create a new session"""
    try:
        result = supabase.table("sessions").insert(session.dict()).execute()
        return result.data[0]
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create session")

@app.get("/sessions/", response_model=List[SessionResponse])
async def get_sessions(supabase: Client = Depends(get_supabase)):
    """Get all sessions"""
    try:
        result = supabase.table("sessions").select("*").execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")

@app.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, supabase: Client = Depends(get_supabase)):
    """Get a specific session by ID"""
    try:
        result = supabase.table("sessions").select("*").eq("id", session_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Session not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching session: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch session")

@app.get("/locations/{location_id}/sessions", response_model=List[SessionResponse])
async def get_sessions_by_location(location_id: str, supabase: Client = Depends(get_supabase)):
    """Get all sessions for a specific location"""
    try:
        result = supabase.table("sessions").select("*").eq("location_id", location_id).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching sessions for location: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sessions for location")

# Legacy endpoint for backward compatibility
@app.post("/respond")
async def respond(request: Request):
    data = await request.json()
    print(data)
    
    # Extract name from the JSON data
    name = data.get("name", "")
    
    # Return in the format {hi: name}
    return {"hi": name}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)
