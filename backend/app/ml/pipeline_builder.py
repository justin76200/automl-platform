"""
pipeline_builder.py
───────────────────
Converts a React Flow node/edge graph → sklearn Pipeline, then evaluates it.
"""

from __future__ import annotations

import importlib
import logging
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    roc_auc_score,
)
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline

from app.ml.node_registry import NODE_REGISTRY

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _import_class(dotted: str):
    """Dynamically import a class given its full dotted path."""
    module_path, class_name = dotted.rsplit(".", 1)
    return getattr(importlib.import_module(module_path), class_name)


def _topological_sort(nodes: list[dict], edges: list[dict]) -> list[dict]:
    """
    Walk the React Flow graph in source → target order.
    Skips dataset nodes (they're metadata, not sklearn steps).
    """
    adj: dict[str, str] = {e["source"]: e["target"] for e in edges}
    targets: set[str] = {e["target"] for e in edges}
    id_to_node: dict[str, dict] = {n["id"]: n for n in nodes}

    # Find entry point (no incoming edges, not a dataset)
    candidates = [
        n for n in nodes
        if n["id"] not in targets and n.get("type") != "dataset"
    ]
    if not candidates:
        # Fallback: just sort by node order
        candidates = [n for n in nodes if n.get("type") != "dataset"]

    ordered: list[dict] = []
    current_id: str | None = candidates[0]["id"] if candidates else None

    while current_id:
        node = id_to_node.get(current_id)
        if node and node.get("type") != "dataset":
            ordered.append(node)
        current_id = adj.get(current_id)

    return ordered


# ── Pipeline builder ──────────────────────────────────────────────────────────

def build_sklearn_pipeline(
    nodes: list[dict],
    edges: list[dict],
) -> tuple[Pipeline, str]:
    """
    Build a sklearn Pipeline from the React Flow graph.

    Returns
    -------
    pipeline : sklearn.pipeline.Pipeline
    task_type : "classification" | "regression"
    """
    ordered = _topological_sort(nodes, edges)

    steps: list[tuple[str, Any]] = []
    task_type = "classification"

    for node in ordered:
        node_type_key: str = node["data"].get("node_type", "")
        meta = NODE_REGISTRY.get(node_type_key)
        if not meta:
            logger.warning("Unknown node type '%s', skipping.", node_type_key)
            continue

        category = meta["category"]
        if category == "tuner":
            continue  # Optuna tuner is handled separately

        # Merge registry defaults with user-supplied overrides
        params: dict = {**meta.get("params", {}), **node["data"].get("params", {})}

        cls = _import_class(meta["sklearn_class"])
        steps.append((f"{node_type_key}_{node['id'][:6]}", cls(**params)))

        if category == "model":
            task_type = meta.get("task", "classification")

    if not steps:
        raise ValueError("No executable steps found in the pipeline graph.")

    return Pipeline(steps), task_type


# ── Evaluation ────────────────────────────────────────────────────────────────

def evaluate_pipeline(
    pipeline: Pipeline,
    X: pd.DataFrame,
    y: pd.Series,
    task_type: str,
    cv_folds: int = 5,
) -> dict[str, Any]:
    """
    Fit the pipeline and compute train/test + cross-validation metrics.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if task_type == "classification" else None
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    metrics: dict[str, Any] = {}

    if task_type == "classification":
        metrics["accuracy"] = round(float(accuracy_score(y_test, y_pred)), 4)
        metrics["f1_macro"] = round(
            float(f1_score(y_test, y_pred, average="macro", zero_division=0)), 4
        )

        if hasattr(pipeline, "predict_proba"):
            try:
                y_prob = pipeline.predict_proba(X_test)
                n_classes = len(np.unique(y_test))
                if n_classes == 2:
                    metrics["roc_auc"] = round(
                        float(roc_auc_score(y_test, y_prob[:, 1])), 4
                    )
                else:
                    metrics["roc_auc_ovr"] = round(
                        float(roc_auc_score(y_test, y_prob, average="macro", multi_class="ovr")), 4
                    )
            except Exception as exc:
                logger.debug("Could not compute ROC-AUC: %s", exc)

        cv = cross_val_score(pipeline, X_train, y_train, cv=cv_folds, scoring="accuracy")
        metrics["cv_accuracy_mean"] = round(float(cv.mean()), 4)
        metrics["cv_accuracy_std"] = round(float(cv.std()), 4)

    else:
        metrics["r2"] = round(float(r2_score(y_test, y_pred)), 4)
        metrics["mae"] = round(float(mean_absolute_error(y_test, y_pred)), 4)
        metrics["rmse"] = round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4)

        cv = cross_val_score(pipeline, X_train, y_train, cv=cv_folds, scoring="r2")
        metrics["cv_r2_mean"] = round(float(cv.mean()), 4)
        metrics["cv_r2_std"] = round(float(cv.std()), 4)

    return metrics
