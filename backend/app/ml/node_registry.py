"""
Node registry: maps node_type keys to sklearn classes, default params, and
Optuna search spaces. This is the single source of truth for the frontend
node palette and the backend pipeline builder.
"""

NODE_REGISTRY: dict = {

    # ── Preprocessors ────────────────────────────────────────────────
    "standard_scaler": {
        "category": "preprocessor",
        "label": "Standard Scaler",
        "description": "Zero mean, unit variance (Z-score)",
        "sklearn_class": "sklearn.preprocessing.StandardScaler",
        "params": {},
    },
    "minmax_scaler": {
        "category": "preprocessor",
        "label": "MinMax Scaler",
        "description": "Scales features to the [0, 1] range",
        "sklearn_class": "sklearn.preprocessing.MinMaxScaler",
        "params": {},
    },
    "robust_scaler": {
        "category": "preprocessor",
        "label": "Robust Scaler",
        "description": "Scaler robust to outliers (uses median/IQR)",
        "sklearn_class": "sklearn.preprocessing.RobustScaler",
        "params": {},
    },
    "simple_imputer": {
        "category": "preprocessor",
        "label": "Imputer",
        "description": "Fill missing values",
        "sklearn_class": "sklearn.impute.SimpleImputer",
        "params": {"strategy": "mean"},
        "param_options": {"strategy": ["mean", "median", "most_frequent"]},
    },
    "pca": {
        "category": "preprocessor",
        "label": "PCA",
        "description": "Dimensionality reduction",
        "sklearn_class": "sklearn.decomposition.PCA",
        "params": {"n_components": 0.95},
        "tunable": {
            "n_components": {"type": "float", "low": 0.7, "high": 0.99},
        },
    },
    "polynomial_features": {
        "category": "preprocessor",
        "label": "Polynomial Features",
        "description": "Generate interaction + polynomial terms",
        "sklearn_class": "sklearn.preprocessing.PolynomialFeatures",
        "params": {"degree": 2, "include_bias": False},
    },

    # ── Classification models ─────────────────────────────────────────
    "logistic_regression": {
        "category": "model",
        "label": "Logistic Regression",
        "description": "Linear probabilistic classifier",
        "sklearn_class": "sklearn.linear_model.LogisticRegression",
        "params": {"C": 1.0, "max_iter": 1000, "random_state": 42},
        "task": "classification",
        "tunable": {
            "C": {"type": "float", "low": 1e-4, "high": 100.0, "log": True},
        },
    },
    "random_forest_clf": {
        "category": "model",
        "label": "Random Forest",
        "description": "Ensemble of decision trees",
        "sklearn_class": "sklearn.ensemble.RandomForestClassifier",
        "params": {"n_estimators": 100, "random_state": 42},
        "task": "classification",
        "tunable": {
            "n_estimators": {"type": "int", "low": 50, "high": 500},
            "max_depth": {"type": "int", "low": 2, "high": 20},
            "min_samples_split": {"type": "int", "low": 2, "high": 20},
        },
    },
    "gradient_boosting_clf": {
        "category": "model",
        "label": "XGBoost",
        "description": "Gradient boosted trees (XGBoost)",
        "sklearn_class": "xgboost.XGBClassifier",
        "params": {
            "n_estimators": 100,
            "learning_rate": 0.1,
            "random_state": 42,
            "eval_metric": "logloss",
            "verbosity": 0,
        },
        "task": "classification",
        "tunable": {
            "n_estimators": {"type": "int", "low": 50, "high": 500},
            "learning_rate": {"type": "float", "low": 0.01, "high": 0.3, "log": True},
            "max_depth": {"type": "int", "low": 3, "high": 10},
            "subsample": {"type": "float", "low": 0.6, "high": 1.0},
        },
    },
    "svm_clf": {
        "category": "model",
        "label": "SVM",
        "description": "Support vector machine (RBF kernel)",
        "sklearn_class": "sklearn.svm.SVC",
        "params": {"C": 1.0, "kernel": "rbf", "probability": True, "random_state": 42},
        "task": "classification",
        "tunable": {
            "C": {"type": "float", "low": 0.01, "high": 100.0, "log": True},
            "gamma": {"type": "float", "low": 1e-4, "high": 1.0, "log": True},
        },
    },

    # ── Regression models ─────────────────────────────────────────────
    "ridge_regression": {
        "category": "model",
        "label": "Ridge Regression",
        "description": "L2-regularised linear regression",
        "sklearn_class": "sklearn.linear_model.Ridge",
        "params": {"alpha": 1.0},
        "task": "regression",
        "tunable": {
            "alpha": {"type": "float", "low": 1e-4, "high": 100.0, "log": True},
        },
    },
    "random_forest_reg": {
        "category": "model",
        "label": "RF Regressor",
        "description": "Random forest for regression tasks",
        "sklearn_class": "sklearn.ensemble.RandomForestRegressor",
        "params": {"n_estimators": 100, "random_state": 42},
        "task": "regression",
        "tunable": {
            "n_estimators": {"type": "int", "low": 50, "high": 300},
            "max_depth": {"type": "int", "low": 2, "high": 20},
        },
    },
    "gradient_boosting_reg": {
        "category": "model",
        "label": "XGBoost Regressor",
        "description": "Gradient boosted trees for regression",
        "sklearn_class": "xgboost.XGBRegressor",
        "params": {
            "n_estimators": 100,
            "learning_rate": 0.1,
            "random_state": 42,
            "verbosity": 0,
        },
        "task": "regression",
        "tunable": {
            "n_estimators": {"type": "int", "low": 50, "high": 400},
            "learning_rate": {"type": "float", "low": 0.01, "high": 0.3, "log": True},
            "max_depth": {"type": "int", "low": 3, "high": 10},
        },
    },

    # ── Tuner ─────────────────────────────────────────────────────────
    "optuna_tuner": {
        "category": "tuner",
        "label": "Optuna Tuner",
        "description": "Bayesian hyperparameter optimisation",
        "params": {"n_trials": 30, "cv_folds": 5},
    },
}


def get_registry() -> dict:
    return NODE_REGISTRY
