import os
import uuid

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import get_db
from app.db.models import Dataset
from app.schemas.pipeline import DatasetResponse

router = APIRouter()


@router.post("/upload", response_model=DatasetResponse, summary="Upload a CSV dataset")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB} MB limit.",
        )

    file_id = str(uuid.uuid4())
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}.csv")

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        df = pd.read_csv(file_path)
    except Exception as exc:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}")

    dataset = Dataset(
        id=file_id,
        name=file.filename,
        file_path=file_path,
        rows=len(df),
        columns=len(df.columns),
        column_names=df.columns.tolist(),
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("/", response_model=list[DatasetResponse], summary="List all datasets")
def list_datasets(db: Session = Depends(get_db)):
    return db.query(Dataset).order_by(Dataset.created_at.desc()).all()


@router.get("/{dataset_id}/preview", summary="Preview first N rows of a dataset")
def preview_dataset(dataset_id: str, rows: int = 10, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    df = pd.read_csv(dataset.file_path, nrows=rows)
    return {
        "columns": df.columns.tolist(),
        "dtypes": df.dtypes.astype(str).to_dict(),
        "data": df.to_dict(orient="records"),
    }


@router.delete("/{dataset_id}", summary="Delete a dataset")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    if os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)
    db.delete(dataset)
    db.commit()
    return {"ok": True}
