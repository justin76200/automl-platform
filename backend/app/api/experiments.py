"""
experiments.py
──────────────
• POST /run/{pipeline_id}   → kick off an experiment in a background thread
• GET  /                    → list experiments
• GET  /{id}                → get one experiment
• WS   /ws/{id}             → stream real-time logs + final result
"""

from __future__ import annotations

import asyncio
import time
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import joblib
from pathlib import Path

from app.db.base import SessionLocal, get_db
from app.db.models import Dataset, Experiment, Pipeline
from app.ml.node_registry import NODE_REGISTRY
from app.ml.pipeline_builder import build_sklearn_pipeline, evaluate_pipeline
from app.ml.tuner import tune_pipeline
from app.schemas.pipeline import ExperimentResponse

MODELS_DIR = Path("models")
MODELS_DIR.mkdir(exist_ok=True)

router = APIRouter()

# In-memory log buffer  {experiment_id: [line, ...]}
_logs: dict[str, list[str]] = {}


def _log(exp_id: str, msg: str) -> None:
    _logs.setdefault(exp_id, []).append(msg)


# ── Background worker ─────────────────────────────────────────────────────────

def _run_experiment(experiment_id: str, pipeline_id: str) -> None:
    db = SessionLocal()
    try:
        experiment: Experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        pipeline: Pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()

        experiment.status = "running"
        db.commit()

        _log(experiment_id, "▶ Starting experiment…")
        t0 = time.time()

        # ── Load data ──────────────────────────────────────────────────
        if not pipeline.dataset_id:
            raise ValueError("No dataset linked to this pipeline.")

        dataset: Dataset = db.query(Dataset).filter(Dataset.id == pipeline.dataset_id).first()
        if not dataset:
            raise ValueError("Dataset record not found.")

        _log(experiment_id, f"📂 Loading dataset: {dataset.name} ({dataset.rows} rows)")
        df = pd.read_csv(dataset.file_path)

        target = pipeline.target_column
        if target not in df.columns:
            raise ValueError(f"Target column '{target}' not found in dataset.")

        X = df.drop(columns=[target]).select_dtypes(include=["number"])
        y = df[target]
        task_type: str = pipeline.task_type or "classification"
        nodes: list[dict] = pipeline.nodes
        edges: list[dict] = pipeline.edges

        _log(experiment_id, f"🔢 Features: {X.shape[1]} numeric  |  Target: '{target}'  |  Task: {task_type}")

        # ── Check for Optuna tuner node ────────────────────────────────
        tuner_node = next(
            (
                n for n in nodes
                if NODE_REGISTRY.get(n["data"].get("node_type", ""), {}).get("category") == "tuner"
            ),
            None,
        )

        if tuner_node:
            n_trials: int = tuner_node["data"].get("params", {}).get("n_trials", 30)
            cv_folds: int = tuner_node["data"].get("params", {}).get("cv_folds", 5)

            _log(experiment_id, f"🔬 Optuna tuning: {n_trials} trials, {cv_folds}-fold CV…")

            def on_trial(num: int, total: int, score: float) -> None:
                _log(experiment_id, f"   trial {num:>3}/{total}  score={score:.4f}")

            best_params, tune_summary = tune_pipeline(
                nodes, edges, X, y, task_type,
                n_trials=n_trials, cv_folds=cv_folds,
                progress_cb=on_trial,
            )

            _log(experiment_id, f"✅ Best params: {best_params}")

            # Apply best params and do final evaluation
            patched_nodes = [
                {**n, "data": {**n["data"], "params": {**n["data"].get("params", {}), **best_params}}}
                if NODE_REGISTRY.get(n["data"].get("node_type", ""), {}).get("category") == "model"
                else n
                for n in nodes
            ]

            sklearn_pipe, _ = build_sklearn_pipeline(patched_nodes, edges)
            metrics = evaluate_pipeline(sklearn_pipe, X, y, task_type)
            metrics.update(tune_summary)
            experiment.best_params = best_params

        else:
            _log(experiment_id, "🔧 Building sklearn pipeline…")
            sklearn_pipe, _ = build_sklearn_pipeline(nodes, edges)

            _log(experiment_id, "📊 Evaluating pipeline…")
            metrics = evaluate_pipeline(sklearn_pipe, X, y, task_type)

        # ── Persist results ────────────────────────────────────────────
        _log(experiment_id, f"🎉 Done!  metrics={metrics}")

        experiment.status = "completed"
        experiment.metrics = metrics
        experiment.duration_s = round(time.time() - t0, 2)
        experiment.completed_at = datetime.utcnow()
        experiment.log = "\n".join(_logs.get(experiment_id, []))
        db.commit()

        # ── Save model ─────────────────────────────────────────────────
        joblib.dump(sklearn_pipe, MODELS_DIR / f"{experiment_id}.pkl")

    except Exception as exc:
        _log(experiment_id, f"❌ ERROR: {exc}")
        exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        if exp:
            exp.status = "failed"
            exp.log = "\n".join(_logs.get(experiment_id, []))
            db.commit()
    finally:
        db.close()


# ── REST endpoints ────────────────────────────────────────────────────────────

@router.post("/run/{pipeline_id}", response_model=ExperimentResponse, status_code=202)
def run_pipeline(
    pipeline_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found.")

    experiment = Experiment(pipeline_id=pipeline_id)
    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    background_tasks.add_task(_run_experiment, experiment.id, pipeline_id)
    return experiment


@router.get("/", response_model=list[ExperimentResponse])
def list_experiments(db: Session = Depends(get_db)):
    return db.query(Experiment).order_by(Experiment.created_at.desc()).all()


@router.get("/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    return exp

@router.get("/download/{experiment_id}")
def download_model(experiment_id: str):
    model_path = MODELS_DIR / f"{experiment_id}.pkl"
    if not model_path.exists():
        raise HTTPException(status_code=404, detail="Modell nicht gefunden – Experiment erst ausführen")
    return FileResponse(
        path=model_path,
        filename=f"model_{experiment_id}.pkl",
        media_type="application/octet-stream",
    )


# ── WebSocket live log stream ─────────────────────────────────────────────────

@router.websocket("/ws/{experiment_id}")
async def experiment_ws(websocket: WebSocket, experiment_id: str):
    """Streams log lines and emits a final 'done' event."""
    await websocket.accept()
    db = SessionLocal()
    sent = 0

    try:
        while True:
            lines = _logs.get(experiment_id, [])
            if len(lines) > sent:
                for line in lines[sent:]:
                    await websocket.send_json({"type": "log", "message": line})
                sent = len(lines)

            exp: Experiment | None = (
                db.query(Experiment).filter(Experiment.id == experiment_id).first()
            )
            # Refresh to pick up changes from background thread
            if exp:
                db.refresh(exp)

            if exp and exp.status in ("completed", "failed"):
                payload = {
                    "type": "done",
                    "status": exp.status,
                    "metrics": exp.metrics,
                    "experiment_id": experiment_id,
                    "best_params": exp.best_params,
                    "duration_s": exp.duration_s,
                }
                print(f"[WS SEND] {payload}", flush=True)   # ← Debug
                await websocket.send_json(payload)
                break

            await asyncio.sleep(0.5)

    except WebSocketDisconnect:
        pass
    finally:
        db.close()
