from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# Sessions Models
class SessionCreate(BaseModel):
    """Model for creating a study session"""
    # Auto-generated UUID we never pass in a session_id through the form we let supabase auto generate it
    locationid: str  # Required
    inputtime: Optional[str] = Field(None, format="iso8601")
    duration: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)  # Required, 1-5
    cleanliness: int = Field(..., ge=1, le=5)  # Required, 1-5
    comment: Optional[str] = None
    outletavailability: Optional[bool] = None
    creators: Optional[List[str]] = None
    crowdedness: Optional[int] = Field(None, ge=1, le=5)

class SessionResponse(BaseModel):
    """Model for returning a session"""
    id: str # expecting to get the string auto generated uuid by supabase
    locationid: str
    inputtime: Optional[datetime] = None
    duration: Optional[int] = None
    rating: float
    cleanliness: int
    comment: Optional[str] = None
    outletavailability: Optional[bool] = None
    creators: Optional[List[str]] = None
    crowdedness: Optional[int] = Field(None, ge=1, le=5)

# Locations Models
class LocationCreate(BaseModel):
    """Model for creating a location"""
    # Auto-generated UUID we never pass in a location_id through the form we let supabase auto generate it
    name: str = Field(..., max_length=255)  # Required
    shortloc: str = Field(..., max_length=100)  # Required
    summary: Optional[str] = None
    coordinate_x: Optional[float] = None
    coordinate_y: Optional[float] = None

class LocationSummary(BaseModel):
    """Model for location summary (dropdown/list)"""
    id: str
    name: str
    shortloc: str

class LocationsListResponse(BaseModel):
    """Model for locations list endpoint response"""
    locations: List[LocationSummary]

class LocationResponse(BaseModel):
    """Model for returning a full location"""
    id: str # expecting to get the string auto generated uuid by supabase
    name: str
    shortloc: str
    summary: Optional[str] = None
    coordinate_x: Optional[float] = None
    coordinate_y: Optional[float] = None

class CrowdednessBin(BaseModel):
    """Model for a single crowdedness time bin"""
    binname: str
    avg: float

class LocationDetailsResponse(BaseModel):
    """Model for location details endpoint"""
    name: str
    coordinate_x: float
    coordinate_y: float
    average_rating: float
    average_cleanliness: float
    crowdedness_vs_time: Dict[str, CrowdednessBin]