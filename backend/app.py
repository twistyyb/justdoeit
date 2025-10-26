from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client
from typing import List
from models import SessionCreate, SessionResponse, LocationCreate, LocationResponse, LocationSummary, LocationsListResponse
import logging
from startSupa import get_supabase


supabase = get_supabase()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Just Doe It API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Just Doe It API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}




# Legacy endpoint for backward compatibility
@app.post("/respond")
async def respond(request: Request):
    data = await request.json()
    print(data)
    
    # Extract name from the JSON data
    name = data.get("name", "")
    
    # Return in the format {hi: name}
    return {"hi": name}


@app.post("/create_session")
async def create_session(session: SessionCreate): #data validated by pydantic model
    data = session.model_dump() # Convert Pydantic model to Python dict to insert into Supabase table as a row
    response = supabase.table("sessions").insert(data).execute()
    return response[0]


@app.post("/create_location")
async def create_location(location: LocationCreate):
    data = location.model_dump()
    response = supabase.table("locations").insert(data).execute()
    return response[0]


@app.get("/location_names", response_model=LocationsListResponse)
async def location_names():
    """Get all location names, IDs, and shortloc for dropdown/selection"""
    response = supabase.table("locations").select("id", "name", "shortloc").execute()
    
    # Convert Supabase data to our Pydantic model
    locations = [LocationSummary(**item) for item in response.data]
    
    return LocationsListResponse(locations=locations)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)
