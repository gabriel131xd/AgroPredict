from pathlib import Path

import pandas as pd


RAIZ_PROJETO = Path(__file__).resolve().parents[2]

ARQUIVO_ENTRADA = (
    RAIZ_PROJETO
    / "data"
    / "processed"
    / "petrolina_clima_tratado.csv"
)

ARQUIVO_SAIDA = (
    RAIZ_PROJETO
    / "data"
    / "final"
    / "petrolina_dataset_final.csv"
)


def criar_features():
    df = pd.read_csv(ARQUIVO_ENTRADA)

    df["data"] = pd.to_datetime(df["data"])

    df["mes"] = df["data"].dt.month

    df["amplitude_termica"] = (
        df["temperatura_maxima"]
        - df["temperatura_minima"]
    )

    df["media_temperatura"] = (
        df["temperatura_maxima"]
        + df["temperatura_minima"]
    ) / 2

    df["precisa_irrigar"] = (
    (df["precipitacao"] < 2)
        & (df["temperatura_maxima"] > 32)
        & (df["umidade_media"] < 55)
        & (df["evapotranspiracao"] > 6)
    ).astype(int)

    df["indice_seca"] = (
        df["temperatura_maxima"]
        * df["evapotranspiracao"]
    ) / (df["umidade_media"] + 1)

    print(df.head())

    print("\nDistribuição target:")
    print(df["precisa_irrigar"].value_counts())

    ARQUIVO_SAIDA.parent.mkdir(parents=True, exist_ok=True)

    df.to_csv(ARQUIVO_SAIDA, index=False)

    print(f"\nArquivo salvo em: {ARQUIVO_SAIDA}")


if __name__ == "__main__":
    criar_features()