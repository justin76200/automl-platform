import uuid
from datetime import datetime
from sqlalchemy import Column, String, JSON, DateTime, Integer, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    rows = Column(Integer)
    columns = Column(Integer)
    column_names = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    pipelines = relationship("Pipeline", back_populates="dataset")


class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    nodes = Column(JSON, nullable=False, default=list)   # React Flow nodes
    edges = Column(JSON, nullable=False, default=list)   # React Flow edges
    target_column = Column(String, nullable=True)
    task_type = Column(String, default="classification") # classification | regression
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="pipelines")
    experiments = relationship("Experiment", back_populates="pipeline", cascade="all, delete")


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String, primary_key=True, default=_uuid)
    pipeline_id = Column(String, ForeignKey("pipelines.id"), nullable=False)
    status = Column(String, default="pending")    # pending | running | completed | failed
    metrics = Column(JSON, nullable=True)
    best_params = Column(JSON, nullable=True)
    log = Column(Text, nullable=True)
    duration_s = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    pipeline = relationship("Pipeline", back_populates="experiments")
