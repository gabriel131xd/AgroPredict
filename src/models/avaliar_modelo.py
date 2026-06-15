from pathlib import Path

import joblib
import pandas as pd

from sklearn.metrics import classification_report, confusion_matrix


RAIZ_PROJETO = Path(__file__).resolve().parents[2]

ARQUIVO_DADOS = RAIZ_PROJETO / "data" / "final" / "petrolina_dataset_final.csv"
ARQUIVO_MODELO = RAIZ_PROJETO / "models" / "modelo_irrigacao.pkl"


def avaliar_modelo():
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
    
    X = df[features]
    y = df["precisa_irrigar"]

    modelo = joblib.load(ARQUIVO_MODELO)

    previsoes = modelo.predict(X)

    print("Matriz de confusão:")
    print(confusion_matrix(y, previsoes))

    print("\nRelatório de classificação:")
    print(classification_report(y, previsoes))


if __name__ == "__main__":
    avaliar_modelo()