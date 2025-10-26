import anthropic

from dotenv import load_dotenv
import os

load_dotenv()
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

# Initialize the client (API key will be read from ANTHROPIC_API_KEY environment variable)
client = anthropic.Anthropic(api_key=anthropic_api_key)

# Create a chat completion
message = client.messages.create(
    model="claude-sonnet-4-5-20250929",  # Or your desired Claude model
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"},
        {"role": "assistant", "content": "Hello! How can I assist you today?"},
        {"role": "user", "content": "Can you tell me a fun fact about space?"}
    ]
)



# Print the assistant's response
print(message.content)



def get_study_recommendation_with_full_context(location_info, sessions_info):
    system_context = f"""
    You are an AI study location recommendation system for students.
    Students across the platform are queried for their preferences immediately after a study session.

    All locations are given here:
    {location_info}

    
    {sessions_info}
    - Average rating is a user's PRODUCTIVENESS evaluation of the location.

    Choose the three best study locations the user should try. Under all circumstances, you must choose exactly three.
    The recommendations must:
    - Be untried by the user, unless the user has already tried all the locations.
    - Match user's most visited locations' productivity rating.
    - Match user's most visited locations' cleanliness rating.
    - Match user's most visited locations' crowdedness rating.
    - Match user's most visited locations' outlet availability.
    - Take into account user's comments on the location.
    - Take into account the description of the location.

    
    """
    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[{"role": "system", "content": system_context}, {"role": "user", "content": user_query}]
    )
    return response.content[0].text