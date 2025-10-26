import anthropic

from dotenv import load_dotenv
import os

load_dotenv()
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

# Initialize the client (API key will be read from ANTHROPIC_API_KEY environment variable)
client = anthropic.Anthropic(api_key=anthropic_api_key)


def get_study_recommendation_with_full_context(location_info, sessions_info):
    system_context = f"""
    You are an AI study location recommendation system for students.
    Students across the platform are queried for their preferences immediately after a study session.

    All locations are given here:
    {location_info}

    User's study history is given here:
    {sessions_info}

    Take into account the user's entire study history and come to an educated decision on the next location the user should try.
    Choose the three best study locations the user should try. Under all circumstances, you must choose exactly three.
    The recommendations must:
    - Be untried by the user, unless the user has already tried all the locations.
    - Match user's most visited locations' productivity rating.
    - Match user's most visited locations' cleanliness rating.
    - Match user's most visited locations' crowdedness rating.
    - Match user's most visited locations' outlet availability.
    - Take into account user's comments on the location.
    - Take into account the description of the location.

    You must respond in a stringified JSON format. This is the only format of your response. Do not respond with anything else.
    The JSON must be in the following format:
    
    """+ """
    ```json
    {
        "recommendations": [
            {
                "rank": 1,
                "location_id": "string"
                "reasoning": "string"
            },
            {
                "rank": 2,
                "location_id": "string"
                "reasoning": "string"
            },
            {
                "rank": 3,
                "location_id": "string"
                "reasoning": "string"
            }
        ]
    }
    
    The reasoning must be a short, concise explanation of why the location was chosen. 16 words or less. Must be 16 words or less. do not fabricate reasoning and only reference what portions match with user's preferences.
    The location_id must be the ID of the location in the database.
    Order the recommendations by rank, from 1 to 3.
    """
    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[{"role": "user", "content": system_context}]
    )
    
    print(f"claude response: {response.content[0].text}")
    return response.content[0].text