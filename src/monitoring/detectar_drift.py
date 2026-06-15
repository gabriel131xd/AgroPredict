from pathlib import Path

import pandas as pd


RAIZ_PROJETO = Path(__file__).resolve().parents[2]

ARQUIVO_DADOS = (
    RAIZ_PROJETO
    / "data"
    / "final"
    / "petrolina_dataset_final.csv"
)


def calcular_drift():
    df = pd.read_csv(ARQUIVO_DADOS)

    df["data"] = pd.to_datetime(df["data"])

    base_referencia = df[df["data"].dt.month <= 6]

    base_atual = df[df["data"].dt.month > 6]

    colunas_monitoradas = [
        "temperatura_maxima",
        "precipitacao",
        "umidade_media",
        "radiacao_solar",
        "evapotranspiracao",
        "indice_seca",
    ]

    print("Monitoramento simples de drift climático\n")

    for coluna in colunas_monitoradas:
        media_referencia = base_referencia[coluna].mean()
        media_atual = base_atual[coluna].mean()

        diferenca_percentual = (
            (media_atual - media_referencia)
            / media_referencia
        ) * 100

        status = "DRIFT DETECTADO" if abs(diferenca_percentual) > 20 else "OK"

        print(f"Variável: {coluna}")
        print(f"Referência: {media_referencia:.2f}")
        print(f"Atual: {media_atual:.2f}")
        print(f"Diferença: {diferenca_percentual:.2f}%")
        print(f"Status: {status}")
        print("-" * 40)


if __name__ == "__main__":
    calcular_drift()