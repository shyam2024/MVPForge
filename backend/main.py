"""
FastAPI & LangGraph
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from starlette.middleware.gzip import GZIPMiddleware
from contextlib import asynccontextmanager

import logging

from config.settings import settings
from app.routes import auth_router, projects_router, stage_1_router, stage_2_router, stage_3_router, stage_4_router, stage_5_router, stage_6_router, stage_7_router, users_router
from app.database import connect_db, close_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

#Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

# Create FastAPI app
app = FastAPI(
    title="MVPForge API",
    description="AI-powered MVP generation platform with 7-stage engineering workflow",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Gzip compression middleware
# app.add_middleware(GZIPMiddleware, minimum_size=1000)

# API routes
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(stage_1_router, prefix="/api")
app.include_router(stage_2_router, prefix="/api")
app.include_router(stage_3_router, prefix="/api")
app.include_router(stage_4_router, prefix="/api")
app.include_router(stage_5_router, prefix="/api")
app.include_router(stage_6_router, prefix="/api")
app.include_router(stage_7_router, prefix="/api")
# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "MVPForge Backend",
        "environment": settings.ENVIRONMENT
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to MVPForge API",
        "docs": "/docs",
        "version": "0.1.0"
    }

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
