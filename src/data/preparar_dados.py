from pathlib import Path

import pandas as pd


RAIZ_PROJETO = Path(__file__).resolve().parents[2]

ARQUIVO_ENTRADA = (
    RAIZ_PROJETO
    / "data"
    / "raw"
    / "dados_climaticos_petrolina.csv"
)

ARQUIVO_SAIDA = (
    RAIZ_PROJETO
    / "data"
    / "processed"
    / "petrolina_clima_tratado.csv"
)


def preparar_dados():
    df = pd.read_csv(ARQUIVO_ENTRADA)

    df = df.rename(
    columns={
        "time": "data",
        "temperature_2m_max": "temperatura_maxima",
        "temperature_2m_min": "temperatura_minima",
        "precipitation_sum": "precipitacao",
        "wind_speed_10m_max": "vento_maximo",
        "relative_humidity_2m_mean": "umidade_media",
        "shortwave_radiation_sum": "radiacao_solar",
        "et0_fao_evapotranspiration": "evapotranspiracao",
    }
)

    df["data"] = pd.to_datetime(df["data"])

    df = df.sort_values("data")

    df = df.drop_duplicates()

    print(df.head())

    print("\nInformações:")
    print(df.info())

    ARQUIVO_SAIDA.parent.mkdir(parents=True, exist_ok=True)

    df.to_csv(ARQUIVO_SAIDA, index=False)

    print(f"\nArquivo salvo em: {ARQUIVO_SAIDA}")


if __name__ == "__main__":
    preparar_dados()