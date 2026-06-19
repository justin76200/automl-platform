"""
tuner.py
─────────
Runs an Optuna study over the tunable parameters of the model node(s)
in a React Flow graph.
"""

from __future__ import annotations

import logging
from typing import Callable

import optuna
import pandas as pd
from sklearn.model_selection import cross_val_score

from app.ml.node_registry import NODE_REGISTRY
from app.ml.pipeline_builder import build_sklearn_pipeline

optuna.logging.set_verbosity(optuna.logging.WARNING)
logger = logging.getLogger(__name__)


def tune_pipeline(
    nodes: list[dict],
    edges: list[dict],
    X: pd.DataFrame,
    y: pd.Series,
    task_type: str,
    n_trials: int = 30,
    cv_folds: int = 5,
    progress_cb: Callable[[int, int, float], None] | None = None,
) -> tuple[dict, dict]:
    """
    Run Bayesian hyperparameter optimisation via Optuna.

    Parameters
    ----------
    progress_cb : callable(trial_num, total_trials, score) – optional
        Called after each trial so callers can stream progress.

    Returns
    -------
    best_params : dict
    summary     : dict  {"metric": value, "n_trials": int}
    """
    id_to_node: dict[str, dict] = {n["id"]: n for n in nodes}

    # Locate the (first) model node and its tunable search space
    model_node_id: str | None = None
    model_node_type: str | None = None

    for node in nodes:
        nt: str = node["data"].get("node_type", "")
        meta = NODE_REGISTRY.get(nt, {})
        if meta.get("category") == "model":
            model_node_id = node["id"]
            model_node_type = nt
            break

    if model_node_id is None:
        raise ValueError("No model node found in the pipeline graph.")

    meta = NODE_REGISTRY[model_node_type]
    tunable: dict = meta.get("tunable", {})

    if not tunable:
        raise ValueError(f"Node '{model_node_type}' has no tunable parameters defined.")

    scoring = "accuracy" if task_type == "classification" else "r2"
    primary_metric = "accuracy" if task_type == "classification" else "r2"

    def objective(trial: optuna.Trial) -> float:
        sampled: dict = {}
        for param, spec in tunable.items():
            if spec["type"] == "float":
                sampled[param] = trial.suggest_float(
                    param, spec["low"], spec["high"], log=spec.get("log", False)
                )
            elif spec["type"] == "int":
                sampled[param] = trial.suggest_int(param, spec["low"], spec["high"])
            elif spec["type"] == "categorical":
                sampled[param] = trial.suggest_categorical(param, spec["choices"])

        # Patch the model node with the sampled params
        patched_nodes = [
            {**n, "data": {**n["data"], "params": {**n["data"].get("params", {}), **sampled}}}
            if n["id"] == model_node_id else n
            for n in nodes
        ]

        try:
            pipeline, _ = build_sklearn_pipeline(patched_nodes, edges)
            cv_scores = cross_val_score(pipeline, X, y, cv=cv_folds, scoring=scoring)
            score = float(cv_scores.mean())
        except Exception as exc:
            logger.warning("Trial %d failed: %s", trial.number, exc)
            return float("-inf")

        if progress_cb:
            progress_cb(trial.number + 1, n_trials, score)

        return score

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials, show_progress_bar=False)

    best_params = study.best_params
    best_value = round(study.best_value, 4)

    return best_params, {primary_metric: best_value, "n_trials": n_trials}
