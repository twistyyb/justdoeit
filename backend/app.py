from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Just Doe It API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello World!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Add a catch-all route for socket.io requests to prevent 404s
@app.get("/{path:path}")
def catch_all(path: str):
    if "socket.io" in path:
        return {"error": "Socket.io not implemented", "path": path}
    return {"error": "Not found", "path": path}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)
