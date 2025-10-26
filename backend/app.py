from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client
from typing import List
from models import SessionCreate, SessionResponse, LocationCreate, LocationResponse, LocationSummary, LocationsListResponse, LocationDetailsResponse, CrowdednessBin, UserSummary, UsersListResponse, UserAnalyticsResponse, SessionTimeDuration, UserSessionsTimeResponse, SessionDetails, UserRecentSessionsResponse
from pydantic import BaseModel
import logging
from uuid import UUID
from datetime import datetime, timezone, timedelta
import pytz
from collections import Counter
from startSupa import get_supabase
from models import UserProfileCreate, UserProfileResponse, UserProfileGetResponse
# from claude import create_claude_message_with_context, create_structured_context, get_study_recommendation_with_full_context


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
    """Get all location names, IDs, shortloc, summary, and image for dropdown/selection"""
    response = supabase.table("locations").select("id", "name", "shortloc", "summary", "image").execute()
    
    # Convert Supabase data to our Pydantic model
    locations = [LocationSummary(**item) for item in response.data]
    
    return LocationsListResponse(locations=locations)


@app.get("/users", response_model=UsersListResponse)
async def get_users():
    """Get all users with their IDs and names for dropdown/selection"""
    response = supabase.table("user_profiles").select("id", "name").execute()
    
    # Convert Supabase data to our Pydantic model
    users = [UserSummary(**item) for item in response.data]
    
    return UsersListResponse(users=users)

@app.get("/all_location_info")
async def get_all_location_info():
    """Get all location info with detailed information for each location"""
    # Get all locations from the database
    response = supabase.table("locations").select("*").execute()
    locations = response.data
    
    # Create a dictionary mapping UUID to location details
    location_details_map = {}
    
    # For each location, call the location_details logic
    for location in locations:
        location_id = location['id']
        
        try:
            # Convert to UUID for the location_details function
            from uuid import UUID
            location_uuid = UUID(location_id)
            
            # Call the location_details endpoint logic
            location_details = await get_location_details(location_uuid)
            
            # Add to the mapping
            location_details_map[location_id] = location_details.model_dump()
            
        except Exception as e:
            logger.error(f"Error getting details for location {location_id}: {e}")
            # If there's an error, still include the basic location info
            location_details_map[location_id] = {
                "name": location.get('name', ''),
                "summary": location.get('summary', ''),
                "coordinate_x": location.get('coordinate_x', 0.0),
                "coordinate_y": location.get('coordinate_y', 0.0),
                "average_rating": 0.0,
                "average_cleanliness": 0.0,
                "crowdedness_vs_time": {},
                "error": str(e)
            }
    
    return location_details_map

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
    pacific_tz = pytz.timezone('America/Los_Angeles')
    bins = {i: [] for i in range(8)}
    bin_names = [
        "00:00-03:00", "03:00-06:00", "06:00-09:00", "09:00-12:00",
        "12:00-15:00", "15:00-18:00", "18:00-21:00", "21:00-24:00"
    ]
    
    # Step 6: Group sessions by time bin (in Pacific time)
    for session in sessions:
        if not session.get('inputtime'):
            continue
            
        # Parse timestamp (handles ISO format with timezone)
        try:
            if isinstance(session['inputtime'], str):
                input_time = datetime.fromisoformat(session['inputtime'].replace('Z', '+00:00'))
            else:
                input_time = session['inputtime']
            
            # Ensure timezone-aware and convert to Pacific time
            if input_time.tzinfo is None:
                input_time = input_time.replace(tzinfo=timezone.utc)
            # Convert to Pacific timezone
            input_time_pacific = input_time.astimezone(pacific_tz)
            
            # Get hour (0-23) in Pacific time
            hour = input_time_pacific.hour
            
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
        summary=location.get('summary', ''),
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
            most_productive_location=None,
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
    logger.info(f"📍 Favorite location: {favorite_location} (from {location_counts})")
    
    # Step 2.5: Calculate most productive location (highest average rating per location)
    location_ratings = {}  # {location_id: [ratings]}
    for session in user_sessions:
        locationid = session.get('locationid')
        rating = session.get('rating')
        if locationid and rating is not None:
            if locationid not in location_ratings:
                location_ratings[locationid] = []
            location_ratings[locationid].append(rating)
    
    # Calculate average rating per location and find max
    most_productive_location_id = None
    most_productive_avg_rating = 0.0
    
    for location_id, ratings_list in location_ratings.items():
        if len(ratings_list) >= 1:  # Require at least 1 rating
            avg_rating = sum(ratings_list) / len(ratings_list)
            # In case of tie, prefer location with more sessions
            if avg_rating > most_productive_avg_rating or \
               (avg_rating == most_productive_avg_rating and len(ratings_list) > len(location_ratings.get(most_productive_location_id, []))):
                most_productive_avg_rating = avg_rating
                most_productive_location_id = location_id
    
    logger.info(f"🏆 Most productive location: {most_productive_location_id} (avg rating: {most_productive_avg_rating})")
    
    # Get location name and shortloc for most productive location
    most_productive_location_name = None
    most_productive_location_shortloc = None
    if most_productive_location_id:
        try:
            loc_response = supabase.table("locations").select("name, shortloc").eq("id", most_productive_location_id).execute()
            if loc_response.data:
                most_productive_location_name = loc_response.data[0].get('name')
                most_productive_location_shortloc = loc_response.data[0].get('shortloc')
        except Exception as e:
            logger.warning(f"Error fetching most productive location details: {e}")
    
    # Step 3: Calculate total study time (sum of durations)
    total_study_time = sum(s.get('duration', 0) or 0 for s in user_sessions)
    logger.info(f"⏱️ Total study time: {total_study_time} minutes")
    
    # Step 4: Calculate average rating
    ratings = [s.get('rating') for s in user_sessions if s.get('rating') is not None]
    average_rating = sum(ratings) / len(ratings) if ratings else 0.0
    logger.info(f"⭐ Average rating: {average_rating} (from {len(ratings)} sessions with ratings)")
    
    # Step 5: Calculate streak
    # Extract unique dates from sessions (converted to Pacific time)
    pacific_tz = pytz.timezone('America/Los_Angeles')
    unique_dates = set()
    for session in user_sessions:
        if session.get('inputtime'):
            try:
                if isinstance(session['inputtime'], str):
                    input_time = datetime.fromisoformat(session['inputtime'].replace('Z', '+00:00'))
                else:
                    input_time = session['inputtime']
                # Ensure timezone-aware and convert to Pacific time
                if input_time.tzinfo is None:
                    input_time = input_time.replace(tzinfo=timezone.utc)
                # Convert to Pacific timezone
                input_time_pacific = input_time.astimezone(pacific_tz)
                unique_dates.add(input_time_pacific.date())
            except Exception as e:
                logger.error(f"Error parsing date for streak: {e}")
                continue
    
    if not unique_dates:
        streak = 0
    else:
        # Sort dates descending
        sorted_dates = sorted(unique_dates, reverse=True)
        most_recent_date = sorted_dates[0]
        # Get today and yesterday in Pacific time
        today_pacific = datetime.now(pacific_tz).date()
        yesterday_pacific = today_pacific - timedelta(days=1)
        
        # Calculate streak (all in Pacific time)
        if most_recent_date == today_pacific:
            # Most recent is today - count backwards from today
            current_date = today_pacific
            streak = 0
            for date in sorted_dates:
                if date == current_date:
                    streak += 1
                    current_date -= timedelta(days=1)
                else:
                    break
        elif most_recent_date == yesterday_pacific:
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
        
        logger.info(f"🔥 Streak calculation (Pacific): most_recent={most_recent_date}, today={today_pacific}, streak={streak}, sorted_dates={sorted_dates}")
    
    # Step 6: Calculate study buddies (top 3) with session counts
    all_buddies = []
    for session in user_sessions:
        creators = session.get('creators', [])
        if creators:
            for creator_id in creators:
                if creator_id != user_id_str:  # Exclude self
                    all_buddies.append(creator_id)
    
    # Count occurrences and get top 3 with counts
    buddy_counts = Counter(all_buddies)
    top_3_buddies_with_counts = [
        {"user_id": buddy_id, "session_count": count} 
        for buddy_id, count in buddy_counts.most_common(3)
    ]
    logger.info(f"👥 Study buddies: {top_3_buddies_with_counts} (from {buddy_counts})")
    
    # Build most productive location object
    most_productive_location_obj = None
    if most_productive_location_id and most_productive_location_name:
        from models import MostProductiveLocation
        most_productive_location_obj = MostProductiveLocation(
            location_id=most_productive_location_id,
            location_name=most_productive_location_name,
            shortloc=most_productive_location_shortloc,
            average_rating=round(most_productive_avg_rating, 2)
        )
    
    # Build final response
    response_data = UserAnalyticsResponse(
        favorite_location=favorite_location,
        most_productive_location=most_productive_location_obj,
        total_study_time=total_study_time,
        average_rating=round(average_rating, 2),
        streak=streak,
        study_buddies=top_3_buddies_with_counts
    )
    
    logger.info(f"✅ Final analytics response for user {user_id_str}:")
    logger.info(f"   - Favorite location: {favorite_location}")
    logger.info(f"   - Most productive location: {most_productive_location_obj}")
    logger.info(f"   - Total study time: {total_study_time} minutes")
    logger.info(f"   - Average rating: {round(average_rating, 2)}")
    logger.info(f"   - Streak: {streak} days")
    logger.info(f"   - Study buddies: {top_3_buddies_with_counts}")
    
    return response_data


@app.get("/user_sessions_time/{user_id}", response_model=UserSessionsTimeResponse)
async def get_user_sessions_time(user_id: UUID):
    """
    Get all study sessions for a user with their input times and durations.
    Returns a list of sessions containing only inputtime and duration fields.
    """
    # Convert UUID to string
    user_id_str = str(user_id)
    
    # Step 1: Check if user exists first
    try:
        profile_response = supabase.table("user_profiles").select("id").eq("id", user_id_str).execute()
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Error checking user profile: {e}")
        # If profile check fails, continue (maybe user exists but not in profiles yet)
    
    # Step 2: Fetch sessions where user is in creators array
    try:
        sessions_response = supabase.table("sessions")\
            .select("inputtime", "duration")\
            .contains("creators", [user_id_str])\
            .execute()
        user_sessions = sessions_response.data
        logger.info(f"Found {len(user_sessions)} sessions for user {user_id_str}")
    except Exception as e:
        # Fallback: If array filter doesn't work, fetch all and filter in Python
        logger.warning(f"Array filter failed: {e}, falling back to Python filtering")
        sessions_response = supabase.table("sessions").select("inputtime", "duration", "creators").execute()
        user_sessions = []
        for session in sessions_response.data:
            creators = session.get('creators')
            if creators:
                creators_list = list(creators) if not isinstance(creators, list) else creators
                creators_str = [str(c) for c in creators_list]
                if user_id_str in creators_str:
                    # Only include inputtime and duration fields
                    user_sessions.append({
                        "inputtime": session.get("inputtime"),
                        "duration": session.get("duration")
                    })
        logger.info(f"Found {len(user_sessions)} sessions for user {user_id_str} using Python filter")
    
    # Step 3: Convert to Pydantic models
    session_objects = []
    for session in user_sessions:
        # Parse inputtime if it's a string
        inputtime = session.get('inputtime')
        if inputtime and isinstance(inputtime, str):
            try:
                inputtime = datetime.fromisoformat(inputtime.replace('Z', '+00:00'))
            except Exception as e:
                logger.error(f"Error parsing inputtime: {e}")
                inputtime = None
        
        session_objects.append(SessionTimeDuration(
            inputtime=inputtime,
            duration=session.get('duration')
        ))
    
    return UserSessionsTimeResponse(sessions=session_objects)


@app.get("/user_recent_sessions/{user_id}", response_model=UserRecentSessionsResponse)
async def get_user_recent_sessions(user_id: UUID, limit: int = 10):
    """
    Get recent study sessions for a user with full details including location names.
    Returns sessions ordered by input time (most recent first).
    """
    user_id_str = str(user_id)
    
    # Step 1: Check if user exists
    try:
        profile_response = supabase.table("user_profiles").select("id").eq("id", user_id_str).execute()
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Error checking user profile: {e}")
    
    # Step 2: Fetch sessions where user is in creators array
    try:
        sessions_response = supabase.table("sessions")\
            .select("*")\
            .contains("creators", [user_id_str])\
            .order("inputtime", desc=True)\
            .limit(limit)\
            .execute()
        user_sessions = sessions_response.data
        logger.info(f"Found {len(user_sessions)} recent sessions for user {user_id_str}")
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
        
        # Sort by inputtime descending and limit
        user_sessions.sort(key=lambda s: s.get('inputtime', ''), reverse=True)
        user_sessions = user_sessions[:limit]
        logger.info(f"Found {len(user_sessions)} recent sessions for user {user_id_str} using Python filter")
    
    # Step 3: Fetch location names for all sessions
    location_names = {}
    location_ids = set(s.get('locationid') for s in user_sessions if s.get('locationid'))
    
    for location_id in location_ids:
        try:
            location_response = supabase.table("locations").select("id", "name").eq("id", location_id).execute()
            if location_response.data:
                location_names[location_id] = location_response.data[0].get('name', 'Unknown Location')
        except Exception as e:
            logger.error(f"Error fetching location {location_id}: {e}")
            location_names[location_id] = 'Unknown Location'
    
    # Step 4: Convert to SessionDetails models
    session_details = []
    for session in user_sessions:
        # Parse inputtime if it's a string
        inputtime = session.get('inputtime')
        if inputtime and isinstance(inputtime, str):
            try:
                inputtime = datetime.fromisoformat(inputtime.replace('Z', '+00:00'))
            except Exception as e:
                logger.error(f"Error parsing inputtime: {e}")
                inputtime = None
        
        location_id = session.get('locationid', '')
        location_name = location_names.get(location_id, 'Unknown Location')
        
        session_details.append(SessionDetails(
            id=session.get('id', ''),
            locationid=location_id,
            location_name=location_name,
            inputtime=inputtime,
            duration=session.get('duration'),
            rating=session.get('rating', 0),
            cleanliness=session.get('cleanliness', 0),
            comment=session.get('comment'),
            outletavailability=session.get('outletavailability'),
            creators=session.get('creators'),
            crowdedness=session.get('crowdedness')
        ))
    
    return UserRecentSessionsResponse(sessions=session_details)


@app.get("/user_sessions_aggregate/{user_id}")
async def get_user_sessions_aggregate(user_id: UUID):
    """
    Get comprehensive aggregation of all user session information in a single JSON response.
    This includes:
    - All session details with location names
    - User analytics (favorite location, total study time, etc.)
    - Session time/duration data
    - Summary statistics
    """
    user_id_str = str(user_id)
    
    # Step 1: Check if user exists
    try:
        profile_response = supabase.table("user_profiles").select("id", "name").eq("id", user_id_str).execute()
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        user_profile = profile_response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Error checking user profile: {e}")
        user_profile = {"id": user_id_str, "name": "Unknown User"}
    
    # Step 2: Get all user sessions (reuse logic from user_analytics)
    try:
        sessions_response = supabase.table("sessions")\
            .select("*")\
            .contains("creators", [user_id_str])\
            .execute()
        user_sessions = sessions_response.data
        logger.info(f"Found {len(user_sessions)} sessions for user {user_id_str}")
    except Exception as e:
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
    
    # Step 3: Get user analytics
    try:
        analytics = await get_user_analytics(user_id)
        analytics_data = analytics.model_dump()
    except Exception as e:
        logger.error(f"Error getting user analytics: {e}")
        analytics_data = {
            "favorite_location": None,
            "most_productive_location": None,
            "total_study_time": 0,
            "average_rating": 0.0,
            "streak": 0,
            "study_buddies": []
        }
    
    # Step 4: Get session time/duration data
    session_time_objects = []
    for session in user_sessions:
        inputtime = session.get('inputtime')
        if inputtime and isinstance(inputtime, str):
            try:
                inputtime = datetime.fromisoformat(inputtime.replace('Z', '+00:00'))
            except Exception as e:
                logger.error(f"Error parsing inputtime: {e}")
                inputtime = None
        
        session_time_objects.append({
            "inputtime": inputtime.isoformat() if inputtime else None,
            "duration": session.get('duration')
        })
    
    # Step 5: Get detailed session information with location names
    location_names = {}
    location_ids = set(s.get('locationid') for s in user_sessions if s.get('locationid'))
    
    for location_id in location_ids:
        try:
            location_response = supabase.table("locations").select("id", "name", "shortloc").eq("id", location_id).execute()
            if location_response.data:
                location_names[location_id] = location_response.data[0]
        except Exception as e:
            logger.error(f"Error fetching location {location_id}: {e}")
            location_names[location_id] = {"id": location_id, "name": "Unknown Location", "shortloc": "Unknown"}
    
    # Step 6: Build detailed session information
    detailed_sessions = []
    for session in user_sessions:
        inputtime = session.get('inputtime')
        if inputtime and isinstance(inputtime, str):
            try:
                inputtime = datetime.fromisoformat(inputtime.replace('Z', '+00:00'))
            except Exception as e:
                logger.error(f"Error parsing inputtime: {e}")
                inputtime = None
        
        location_id = session.get('locationid', '')
        location_info = location_names.get(location_id, {"name": "Unknown Location", "shortloc": "Unknown"})
        
        detailed_sessions.append({
            "id": session.get('id', ''),
            "locationid": location_id,
            "location_name": location_info.get('name', 'Unknown Location'),
            "location_shortloc": location_info.get('shortloc', 'Unknown'),
            "inputtime": inputtime.isoformat() if inputtime else None,
            "duration": session.get('duration'),
            "rating": session.get('rating', 0),
            "cleanliness": session.get('cleanliness', 0),
            "comment": session.get('comment'),
            "outletavailability": session.get('outletavailability'),
            "creators": session.get('creators'),
            "crowdedness": session.get('crowdedness'),
            "created_at": session.get('created_at')
        })
    
    # Step 7: Build comprehensive response (without location details)
    aggregate_response = {
        "user_profile": user_profile,
        "session_count": len(user_sessions),
        "analytics": analytics_data,
        "session_time_data": session_time_objects,
        "detailed_sessions": detailed_sessions,
        "summary": {
            "total_sessions": len(user_sessions),
            "total_study_time_minutes": analytics_data.get("total_study_time", 0),
            "average_rating": analytics_data.get("average_rating", 0.0),
            "current_streak": analytics_data.get("streak", 0),
            "unique_locations_visited": len(location_ids),
            "favorite_location": analytics_data.get("favorite_location"),
            "most_productive_location": analytics_data.get("most_productive_location"),
            "study_buddies_count": len(analytics_data.get("study_buddies", []))
        }
    }
    
    logger.info(f"✅ Generated comprehensive session aggregate for user {user_id_str}")
    logger.info(f"   - Sessions: {len(user_sessions)}")
    logger.info(f"   - Unique locations: {len(location_ids)}")
    logger.info(f"   - Total study time: {analytics_data.get('total_study_time', 0)} minutes")
    
    return aggregate_response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)
