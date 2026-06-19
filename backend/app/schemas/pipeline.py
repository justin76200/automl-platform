from __future__ import annotations
from pydantic import BaseModel
from typing import Any
from datetime import datetime


# ── Dataset ─────────────────────────────────────────────────────────

class DatasetResponse(BaseModel):
    id: str
    name: str
    rows: int | None
    columns: int | None
    column_names: list[str] | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Pipeline ─────────────────────────────────────────────────────────

class NodeData(BaseModel):
    label: str
    node_type: str
    params: dict[str, Any] = {}


class FlowNode(BaseModel):
    id: str
    type: str
    position: dict[str, float]
    data: NodeData


class FlowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: str | None = None
    targetHandle: str | None = None


class PipelineCreate(BaseModel):
    name: str
    description: str | None = None
    nodes: list[FlowNode]
    edges: list[FlowEdge]
    target_column: str = ""
    task_type: str = "classification"
    dataset_id: str | None = None


class PipelineResponse(BaseModel):
    id: str
    name: str
    description: str | None
    nodes: list[dict]
    edges: list[dict]
    target_column: str | None
    task_type: str | None
    dataset_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Experiment ───────────────────────────────────────────────────────

class ExperimentResponse(BaseModel):
    id: str
    pipeline_id: str
    status: str
    metrics: dict | None
    best_params: dict | None
    log: str | None
    duration_s: float | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}
