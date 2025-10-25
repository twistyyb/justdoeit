from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client
from database import get_database, get_supabase, db_manager
from models import LocationCreate, LocationResponse, SessionCreate, SessionResponse, SessionWithLocation
from typing import List
import logging
from supabase import get_supabase


supabase = get_supabase()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Just Doe It API", version="1.0.0")




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







if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)
