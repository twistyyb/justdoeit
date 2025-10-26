from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client
from typing import List
from models import SessionCreate, SessionResponse, LocationCreate, LocationResponse, LocationSummary, LocationsListResponse, LocationDetailsResponse, CrowdednessBin, UserAnalyticsResponse
from pydantic import BaseModel
import logging
from uuid import UUID
from datetime import datetime, timezone, timedelta
from collections import Counter
from startSupa import get_supabase
from models import UserProfileCreate, UserProfileResponse, UserProfileGetResponse


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
    data = session.model_dump(mode='json') # Convert Pydantic model to dict with JSON-serializable values (datetime -> str)
    response = supabase.table("sessions").insert(data).execute()
    return {"message": "Session created", "data": response.data}


@app.post("/create_location")
async def create_location(location: LocationCreate):
    data = location.model_dump(mode='json')
    response = supabase.table("locations").insert(data).execute()
    return {"message": "Location created", "data": response.data}


@app.post("/create_user_profile", response_model=UserProfileResponse)
async def create_user_profile(profile: UserProfileCreate):
    """
    Create a user profile in the user_profiles table
    """
    logger.info(f"Creating user profile for user_id: {profile.user_id}, name: {profile.name}")
    
    try:
        # Prepare the data for insertion
        profile_data = {
            "id": profile.user_id,
            "name": profile.name
        }
        
        # Insert into user_profiles table
        response = supabase.table("user_profiles").insert(profile_data).execute()
        
        logger.info(f"User profile created successfully: {response.data}")
        return UserProfileResponse(
            message="User profile created successfully",
            data=response.data[0] if response.data else {}
        )
        
    except Exception as e:
        logger.error(f"Error creating user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user profile: {str(e)}"
        )


@app.get("/user_profile/{user_id}", response_model=UserProfileGetResponse)
async def get_user_profile(user_id: str):
    """
    Get user profile data by user ID
    """
    logger.info(f"Fetching user profile for user_id: {user_id}")
    
    try:
        # Query the user_profiles table
        response = supabase.table("user_profiles").select("*").eq("id", user_id).single().execute()
        
        if not response.data:
            logger.warning(f"No profile found for user_id: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        logger.info(f"User profile fetched successfully: {response.data}")
        return UserProfileGetResponse(**response.data)
        
    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user profile: {str(e)}"
        )


@app.get("/location_names", response_model=LocationsListResponse)
async def location_names():
    """Get all location names, IDs, and shortloc for dropdown/selection"""
    response = supabase.table("locations").select("id", "name", "shortloc").execute()
    
    # Convert Supabase data to our Pydantic model
    locations = [LocationSummary(**item) for item in response.data]
    
    return LocationsListResponse(locations=locations)

@app.get("/location_details/{location_id}", response_model=LocationDetailsResponse)
async def get_location_details(location_id: UUID):
    """
    Get detailed information about a specific location including:
    - Basic info (name, coordinates)
    - Average rating and cleanliness
    - Crowdedness histogram (3-hour bins) abstracted as a dict of binname time and avg crowdedness
    """
    from datetime import datetime
    
    # Convert UUID to string for Supabase
    location_id_str = str(location_id)
    
    # Step 1: Fetch location details
    location_response = supabase.table("locations").select("*").eq("id", location_id_str).execute()
    
    if not location_response.data:
        raise HTTPException(status_code=404, detail="Location not found")
    
    location = location_response.data[0]
    
    # Step 2: Fetch all sessions for this location
    sessions_response = supabase.table("sessions").select("*").eq("locationid", location_id_str).execute()
    sessions = sessions_response.data
    
    # Step 3: Calculate average rating (productivity)
    if sessions:
        avg_rating = sum(s.get('rating', 0) for s in sessions) / len(sessions)
    else:
        avg_rating = 0.0
    
    # Step 4: Calculate average cleanliness
    cleanliness_scores = [s.get('cleanliness') for s in sessions if s.get('cleanliness') is not None]
    if cleanliness_scores:
        avg_cleanliness = sum(cleanliness_scores) / len(cleanliness_scores)
    else:
        avg_cleanliness = 0.0
    
    # Step 5: Create crowdedness histogram
    # Initialize bins for 8 time periods (3 hours each)
    bins = {i: [] for i in range(8)}
    bin_names = [
        "00:00-03:00", "03:00-06:00", "06:00-09:00", "09:00-12:00",
        "12:00-15:00", "15:00-18:00", "18:00-21:00", "21:00-24:00"
    ]
    
    # Step 6: Group sessions by time bin
    for session in sessions:
        if not session.get('inputtime'):
            continue
            
        # Parse timestamp (handles ISO format with timezone)
        try:
            if isinstance(session['inputtime'], str):
                input_time = datetime.fromisoformat(session['inputtime'].replace('Z', '+00:00'))
            else:
                input_time = session['inputtime']
            
            # Get hour (0-23)
            hour = input_time.hour
            
            # Determine which 3-hour bin (0-7)
            bin_num = hour // 3
            
            # Add crowdedness to that bin (if exists)
            if session.get('crowdedness') is not None:
                bins[bin_num].append(session['crowdedness'])
        except Exception as e:
            logger.error(f"Error parsing timestamp: {e}")
            continue
    
    # Step 7: Calculate average crowdedness per bin
    crowdedness_data = {}
    for bin_num in range(8):
        if bins[bin_num]:
            avg = sum(bins[bin_num]) / len(bins[bin_num])
        else:
            avg = 0.0
        
        # Create CrowdednessBin object for validation
        crowdedness_data[str(bin_num)] = CrowdednessBin(
            binname=bin_names[bin_num],
            avg=round(avg, 2)
        )
    
    # Step 8: Return combined response
    return LocationDetailsResponse(
        name=location['name'],
        coordinate_x=location.get('coordinate_x', 0.0),
        coordinate_y=location.get('coordinate_y', 0.0),
        average_rating=round(avg_rating, 2),
        average_cleanliness=round(avg_cleanliness, 2),
        crowdedness_vs_time=crowdedness_data
        
    )


@app.get("/user_analytics/{user_id}", response_model=UserAnalyticsResponse)
async def get_user_analytics(user_id: UUID):
    """
    Get user analytics including favorite location, total study time, average rating, streak, and study buddies.
    """
    # Convert UUID to string
    user_id_str = str(user_id)
    
    # Step 1: Check if user exists first (before querying sessions)
    try:
        profile_response = supabase.table("user_profiles").select("id").eq("id", user_id_str).execute()
        if not profile_response.data:
            # User doesn't exist → 404 immediately
            raise HTTPException(status_code=404, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Error checking user profile: {e}")
        # If profile check fails, continue (maybe user exists but not in profiles yet)
    
    # Step 2: Fetch sessions where user is in creators array (using Supabase array filter)
    # PostgreSQL array contains operator: creators @> ARRAY['user_id']
    try:
        sessions_response = supabase.table("sessions")\
            .select("*")\
            .contains("creators", [user_id_str])\
            .execute()
        user_sessions = sessions_response.data
        logger.info(f"Found {len(user_sessions)} sessions for user {user_id_str} using array filter")
    except Exception as e:
        # Fallback: If array filter doesn't work, fetch all and filter in Python
        logger.warning(f"Array filter failed: {e}, falling back to Python filtering")
        sessions_response = supabase.table("sessions").select("*").execute()
        user_sessions = []
        for session in sessions_response.data:
            creators = session.get('creators')
            if creators:
                creators_list = list(creators) if not isinstance(creators, list) else creators
                creators_str = [str(c) for c in creators_list]
                if user_id_str in creators_str:
                    user_sessions.append(session)
        logger.info(f"Found {len(user_sessions)} sessions for user {user_id_str} using Python filter")
    
    # If no sessions, return empty analytics (user exists, just no data)
    if not user_sessions:
        return UserAnalyticsResponse(
            favorite_location=None,
            total_study_time=0,
            average_rating=0.0,
            streak=0,
            study_buddies=[]
        )
    
    # Step 2: Calculate favorite location (most frequent locationid)
    location_counts = {}
    for session in user_sessions:
        locationid = session.get('locationid')
        if locationid:
            location_counts[locationid] = location_counts.get(locationid, 0) + 1
    
    favorite_location = max(location_counts, key=location_counts.get) if location_counts else None
    
    # Step 3: Calculate total study time (sum of durations)
    total_study_time = sum(s.get('duration', 0) or 0 for s in user_sessions)
    
    # Step 4: Calculate average rating
    ratings = [s.get('rating') for s in user_sessions if s.get('rating') is not None]
    average_rating = sum(ratings) / len(ratings) if ratings else 0.0
    
    # Step 5: Calculate streak
    # Extract unique dates from sessions (UTC)
    unique_dates = set()
    for session in user_sessions:
        if session.get('inputtime'):
            try:
                if isinstance(session['inputtime'], str):
                    input_time = datetime.fromisoformat(session['inputtime'].replace('Z', '+00:00'))
                else:
                    input_time = session['inputtime']
                # Ensure timezone-aware and convert to UTC
                if input_time.tzinfo is None:
                    input_time = input_time.replace(tzinfo=timezone.utc)
                else:
                    input_time = input_time.astimezone(timezone.utc)
                unique_dates.add(input_time.date())
            except Exception as e:
                logger.error(f"Error parsing date for streak: {e}")
                continue
    
    if not unique_dates:
        streak = 0
    else:
        # Sort dates descending
        sorted_dates = sorted(unique_dates, reverse=True)
        most_recent_date = sorted_dates[0]
        today_utc = datetime.now(timezone.utc).date()
        yesterday_utc = today_utc - timedelta(days=1)
        
        # Calculate streak (all in UTC)
        if most_recent_date == today_utc:
            # Most recent is today - count backwards from today
            current_date = today_utc
            streak = 0
            for date in sorted_dates:
                if date == current_date:
                    streak += 1
                    current_date -= timedelta(days=1)
                else:
                    break
        elif most_recent_date == yesterday_utc:
            # Most recent is yesterday - count backwards from yesterday
            current_date = most_recent_date
            streak = 0
            # Check consecutive days backwards from yesterday
            for date in sorted_dates:
                if date == current_date:
                    streak += 1
                    current_date -= timedelta(days=1)
                else:
                    # Gap found - streak breaks
                    break
        else:
            # Most recent is 2+ days ago - streak broken
            streak = 0
        
        logger.info(f"Streak calculation: most_recent={most_recent_date}, today={today_utc}, streak={streak}, sorted_dates={sorted_dates}")
    
    # Step 6: Calculate study buddies (top 3)
    all_buddies = []
    for session in user_sessions:
        creators = session.get('creators', [])
        if creators:
            for creator_id in creators:
                if creator_id != user_id_str:  # Exclude self
                    all_buddies.append(creator_id)
    
    # Count occurrences and get top 3
    buddy_counts = Counter(all_buddies)
    top_3_buddies = [buddy_id for buddy_id, _ in buddy_counts.most_common(3)]
    
    return UserAnalyticsResponse(
        favorite_location=favorite_location,
        total_study_time=total_study_time,
        average_rating=round(average_rating, 2),
        streak=streak,
        study_buddies=top_3_buddies
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)
