"""
Aven FastAPI Backend — Main entry point
Serves: session management, RoBERTa classifier, LLM character engine, CBT reports, progress tracking
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from routers import classifier, llm, scenario, therapist, biomarker
from config import settings
from database import engine, Base


import subprocess
import logging

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Check for ffmpeg
    try:
        subprocess.run(["ffmpeg", "-version"], check=True, capture_output=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        logging.warning("WARNING: ffmpeg not found in PATH. Voice biomarker extraction will fail!")

    # Initialize Database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown placeholder


app = FastAPI(
    title="Aven API",
    description="Social Anxiety CBT Training Platform — Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classifier.router, prefix="/classify", tags=["Classifier"])
app.include_router(llm.router, prefix="/llm", tags=["LLM"])
app.include_router(scenario.router, prefix="/scenario", tags=["Scenario"])
app.include_router(therapist.router, prefix="/therapist", tags=["Therapist"])
app.include_router(biomarker.router, prefix="/biomarker", tags=["Biomarker"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
