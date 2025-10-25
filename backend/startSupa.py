import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

print(f"SUPABASE_URL: {os.environ.get('SUPABASE_URL')}")
print(f"SUPABASE_KEY: {os.environ.get('SUPABASE_KEY')}")

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(url, key)

print(supabase.table("locations").select("*").execute())

# def get_supabase():
#     return supabase



# if __name__ == "__main__":
#     print(get_supabase().table("locations").select("*").execute())