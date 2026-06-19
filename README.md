# AutoML Platform

> Visual drag-and-drop ML pipeline builder — ähnlich wie Camunda, aber für Machine Learning.

![Stack](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)
![Stack](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Stack](https://img.shields.io/badge/React_Flow-12-FF0072?style=flat)
![Stack](https://img.shields.io/badge/Optuna-4.0-blue?style=flat)

## Features

- **Visual Node Editor** — Drag-and-drop Nodes auf einem Canvas (React Flow)
- **Node-Typen:** Dataset, Preprocessors (Scaler, Imputer, PCA, …), Modelle (XGBoost, RF, SVM, …), Optuna Tuner
- **Live-Training** — WebSocket-Stream für Echtzeit-Logs während des Trainings
- **Optuna Hyperparameter-Tuning** — Bayesian Search über alle tunable Parameter
- **Experiment-Tracking** — SQLite-basiert, alle Läufe mit Metriken gespeichert
- **REST API** — vollständige FastAPI-Dokumentation auf `/docs`

## Schnellstart

```bash
# 1. Repo klonen
git clone https://github.com/yourname/automl-platform
cd automl-platform

# 2. Mit Docker starten (empfohlen)
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Lokale Entwicklung (ohne Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (neues Terminal)
cd frontend
npm install
npm run dev
```

## Workflow

```
Dataset Node → Preprocessor(s) → Model Node → [Optuna Tuner] → Run ▶
```

1. **CSV hochladen** — im Dataset-Node, dann Zielspalte wählen
2. **Nodes verbinden** — Pfeil von rechtem Handle zu linkem Handle ziehen
3. **Params anpassen** — Node anklicken → Parameter inline editieren
4. **Pipeline speichern & ausführen** — oben rechts auf "Run pipeline"
5. **Ergebnisse** — Live-Logs und Metriken im rechten Panel

## Projektstruktur

```
automl-platform/
├── backend/
│   ├── app/
│   │   ├── api/           # REST endpoints (datasets, pipelines, experiments)
│   │   ├── core/          # Settings (pydantic-settings)
│   │   ├── db/            # SQLAlchemy models + session
│   │   ├── ml/
│   │   │   ├── node_registry.py   # Single source of truth für alle Nodes
│   │   │   ├── pipeline_builder.py # Graph → sklearn Pipeline
│   │   │   └── tuner.py           # Optuna integration
│   │   └── schemas/       # Pydantic request/response schemas
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/           # Axios client
        ├── store/         # Zustand global state
        └── components/
            ├── nodes/     # Custom React Flow nodes
            ├── PipelineCanvas.jsx
            ├── NodeSidebar.jsx
            ├── ResultsPanel.jsx
            └── Toolbar.jsx
```

## Nodes hinzufügen

Nur in `backend/app/ml/node_registry.py` einen Eintrag ergänzen:

```python
"mein_modell": {
    "category": "model",
    "label": "Mein Modell",
    "description": "Kurzbeschreibung",
    "sklearn_class": "sklearn.svm.SVR",
    "params": {"C": 1.0, "kernel": "rbf"},
    "task": "regression",
    "tunable": {
        "C": {"type": "float", "low": 0.01, "high": 100, "log": True},
    },
},
```

→ Node erscheint automatisch im Frontend-Panel. Kein weiterer Code nötig.

## Nächste Schritte

- [ ] Feature Importance Charts (SHAP)
- [ ] Multi-Pipeline Vergleich
- [ ] Pipeline Export (joblib / ONNX)
- [ ] Auth + Multi-User-Support
- [ ] Ensemble / Stacking Node
- [ ] Konfusionsmatrix & ROC-Kurve in Results Panel
