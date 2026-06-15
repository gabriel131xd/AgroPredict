from pathlib import Path

import pandas as pd
import requests


RAIZ_PROJETO = Path(__file__).resolve().parents[2]

PASTA_RAW = RAIZ_PROJETO / "data" / "raw"
ARQUIVO_SAIDA = PASTA_RAW / "dados_climaticos_petrolina.csv"

URL = (
    "https://archive-api.open-meteo.com/v1/archive?"
    "latitude=-9.38&longitude=-40.50"
    "&start_date=2025-01-01"
    "&end_date=2025-12-31"
    "&daily=temperature_2m_max,"
    "temperature_2m_min,"
    "precipitation_sum,"
    "wind_speed_10m_max,"
    "relative_humidity_2m_mean,"
    "shortwave_radiation_sum,"
    "et0_fao_evapotranspiration"
    "&timezone=America/Sao_Paulo"
)


def coletar_dados():
    resposta = requests.get(URL, timeout=60)
    resposta.raise_for_status()

    dados = resposta.json()

    df = pd.DataFrame(dados["daily"])

    PASTA_RAW.mkdir(parents=True, exist_ok=True)

    df.to_csv(ARQUIVO_SAIDA, index=False)

    print(df.head())
    print(f"\nArquivo salvo em: {ARQUIVO_SAIDA}")


if __name__ == "__main__":
    coletar_dados()