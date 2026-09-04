from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Ensure current and parent directory are on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from backend.routers import market, search, news, llm, corporate_actions
except ImportError:
    from routers import market, search, news, llm, corporate_actions

app = FastAPI(
    title="MarketPulse API",
    description="Backend API for MarketPulse MVP",
    version="1.0.0"
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(market.router)
app.include_router(search.router)
app.include_router(news.router)
app.include_router(llm.router)
app.include_router(corporate_actions.router)

@app.get("/")
def root():
    return {"message": "Welcome to MarketPulse API", "status": "online"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "MarketPulse API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)