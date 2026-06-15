from pathlib import Path

import joblib
import mlflow
import mlflow.sklearn
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split


RAIZ_PROJETO = Path(__file__).resolve().parents[2]

ARQUIVO_DADOS = (
    RAIZ_PROJETO
    / "data"
    / "final"
    / "petrolina_dataset_final.csv"
)

ARQUIVO_MODELO = (
    RAIZ_PROJETO
    / "models"
    / "modelo_irrigacao.pkl"
)


def treinar_modelo():
    df = pd.read_csv(ARQUIVO_DADOS)

    features = [
    "temperatura_maxima",
    "temperatura_minima",
    "precipitacao",
    "vento_maximo",
    "umidade_media",
    "radiacao_solar",
    "evapotranspiracao",
    "mes",
    "amplitude_termica",
    "media_temperatura",
    "indice_seca",
]

    alvo = "precisa_irrigar"

    X = df[features]
    y = df[alvo]

    X_treino, X_teste, y_treino, y_teste = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    mlflow.set_experiment("AgroPredict")

    with mlflow.start_run():

        modelo = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
        )

        modelo.fit(X_treino, y_treino)

        previsoes = modelo.predict(X_teste)

        acuracia = accuracy_score(y_teste, previsoes)

        print(f"\nAcurácia: {acuracia:.4f}")

        print("\nRelatório de classificação:")
        print(classification_report(y_teste, previsoes))

        mlflow.log_param("modelo", "RandomForest")

        mlflow.log_param("n_estimators", 100)

        mlflow.log_metric("accuracy", acuracia)

        mlflow.sklearn.log_model(
            modelo,
            artifact_path="modelo",
        )

        ARQUIVO_MODELO.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        joblib.dump(modelo, ARQUIVO_MODELO)

        print(f"\nModelo salvo em: {ARQUIVO_MODELO}")

        print("\nMLflow registrou o experimento.")


if __name__ == "__main__":
    treinar_modelo()