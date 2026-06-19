from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import datasets, experiments, pipelines
from app.core.config import settings
from app.db.base import engine
from app.db import models as db_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AutoML Platform",
    description="Visual drag-and-drop ML pipeline builder",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets.router,    prefix="/api/datasets",    tags=["Datasets"])
app.include_router(pipelines.router,   prefix="/api/pipelines",   tags=["Pipelines"])
app.include_router(experiments.router, prefix="/api/experiments", tags=["Experiments"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": app.version}
