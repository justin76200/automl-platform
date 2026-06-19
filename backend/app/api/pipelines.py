from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import Pipeline
from app.ml.node_registry import get_registry
from app.schemas.pipeline import PipelineCreate, PipelineResponse

router = APIRouter()


@router.get("/nodes", summary="List all available node types")
def list_nodes():
    """Returns the full node registry consumed by the frontend palette."""
    return get_registry()


@router.post("/", response_model=PipelineResponse, status_code=201)
def create_pipeline(body: PipelineCreate, db: Session = Depends(get_db)):
    pipeline = Pipeline(
        name=body.name,
        description=body.description,
        nodes=[n.model_dump() for n in body.nodes],
        edges=[e.model_dump() for e in body.edges],
        target_column=body.target_column,
        task_type=body.task_type,
        dataset_id=body.dataset_id,
    )
    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.get("/", response_model=list[PipelineResponse])
def list_pipelines(db: Session = Depends(get_db)):
    return db.query(Pipeline).order_by(Pipeline.created_at.desc()).all()


@router.get("/{pipeline_id}", response_model=PipelineResponse)
def get_pipeline(pipeline_id: str, db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found.")
    return pipeline


@router.put("/{pipeline_id}", response_model=PipelineResponse)
def update_pipeline(
    pipeline_id: str,
    body: PipelineCreate,
    db: Session = Depends(get_db),
):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found.")
    pipeline.name = body.name
    pipeline.description = body.description
    pipeline.nodes = [n.model_dump() for n in body.nodes]
    pipeline.edges = [e.model_dump() for e in body.edges]
    pipeline.target_column = body.target_column
    pipeline.task_type = body.task_type
    pipeline.dataset_id = body.dataset_id
    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.delete("/{pipeline_id}")
def delete_pipeline(pipeline_id: str, db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found.")
    db.delete(pipeline)
    db.commit()
    return {"ok": True}
