# Roadmap

## Phase 1 – MVP · Core Platform ✅

Grundgerüst der Platform – vollständig umgesetzt.

- [x] Visual Pipeline Builder (React Flow, Drag & Drop)
- [x] Node Registry (Scaler, Imputer, RandomForest, XGBoost, SVM, …)
- [x] Optuna Tuner Node (Bayesian Hyperparameter Search)
- [x] Dataset Upload (CSV direkt in der App)
- [x] Live Logs via WebSocket (Echtzeit-Fortschritt)
- [x] Experiment Tracking (Metriken in SQLite)

---

## Phase 2 – Insights · Erklärbarkeit & Visualisierung 🔄

Nächste Schritte – macht die Platform von "es funktioniert" zu "ich verstehe was passiert".

- [ ] SHAP Feature Importance (welche Features zählen am meisten)
- [ ] Konfusionsmatrix (Klassifikationsfehler visualisiert)
- [ ] ROC Kurve & AUC (Modellvergleich)
- [ ] Dataset Explorer (Histogramme, Korrelationsmatrix nach Upload)
- [ ] Performance over Time (Metriken aller Experimente im Linechart)
- [ ] Modell Export als `.pkl` (Download-Button nach Training)

---

## Phase 3 – Power Features · ML Erweiterungen 🛠️

Mittelfristig – erweitert die ML-Fähigkeiten der Platform deutlich.

- [ ] Auto Feature Engineering Node (Interaktionen, Polynome automatisch)
- [ ] Class Balancing Node (SMOTE, Over- & Undersampling)
- [ ] Feature Selection Node (irrelevante Features automatisch entfernen)
- [ ] Batch Prediction (CSV hochladen → Vorhersage-CSV herunterladen)
- [ ] Pipeline Templates (Titanic, Churn, Housing per Klick laden)
- [ ] Pipeline-Vergleich (mehrere Experimente nebeneinander)

---

## Phase 4 – Production · Deployment & KI 🚀

Langfristig – macht aus dem Tool eine echte MLOps-Platform.

- [ ] One-Click Installer (Setup-Skript für Windows, Mac & Linux – kein manuelles Konfigurieren)
- [ ] KI Pipeline-Assistent (Problem beschreiben → Pipeline baut sich automatisch auf)
- [ ] Live Prediction UI (Werte eingeben → Vorhersage sofort sehen)
- [ ] ONNX Export (universelles Modell-Format, läuft überall)
- [ ] Docker Microservice Export (Modell als fertiger REST-Endpoint)
- [ ] Data Drift Detection (Warnung wenn Produktionsdaten ≠ Trainingsdaten)
- [ ] Multi-User & Auth (Login, Teams, geteilte Pipelines)

---

## Ideen & Diskussion

Neue Feature-Ideen gerne als [GitHub Issue](../../issues) einreichen.
