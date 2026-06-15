from datetime import date, timedelta
from typing import Any

import pandas as pd
import requests


OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
LATITUDE_PETROLINA = -9.38
LONGITUDE_PETROLINA = -40.50
TIMEZONE_PETROLINA = "America/Sao_Paulo"

VARIAVEIS_DIARIAS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "wind_speed_10m_max",
    "relative_humidity_2m_mean",
    "shortwave_radiation_sum",
    "et0_fao_evapotranspiration",
]

MAPA_COLUNAS = {
    "time": "data",
    "temperature_2m_max": "temperatura_maxima",
    "temperature_2m_min": "temperatura_minima",
    "precipitation_sum": "precipitacao",
    "wind_speed_10m_max": "vento_maximo",
    "relative_humidity_2m_mean": "umidade_media",
    "shortwave_radiation_sum": "radiacao_solar",
    "et0_fao_evapotranspiration": "evapotranspiracao",
}

COLUNAS_BASE = [
    "data",
    "temperatura_maxima",
    "temperatura_minima",
    "precipitacao",
    "vento_maximo",
    "umidade_media",
    "radiacao_solar",
    "evapotranspiracao",
]


class OpenMeteoError(RuntimeError):
    pass


def consultar_open_meteo(
    *,
    inicio: date | None = None,
    fim: date | None = None,
    past_days: int | None = None,
    forecast_days: int | None = None,
    arquivo_historico: bool = False,
) -> dict[str, Any]:
    parametros: dict[str, Any] = {
        "latitude": LATITUDE_PETROLINA,
        "longitude": LONGITUDE_PETROLINA,
        "daily": ",".join(VARIAVEIS_DIARIAS),
        "timezone": TIMEZONE_PETROLINA,
    }
    if inicio is not None:
        parametros["start_date"] = inicio.isoformat()
    if fim is not None:
        parametros["end_date"] = fim.isoformat()
    if past_days is not None:
        parametros["past_days"] = past_days
    if forecast_days is not None:
        parametros["forecast_days"] = forecast_days

    try:
        url = OPEN_METEO_ARCHIVE_URL if arquivo_historico else OPEN_METEO_URL
        resposta = requests.get(url, params=parametros, timeout=30)
        resposta.raise_for_status()
        dados = resposta.json()
    except requests.RequestException as erro:
        detalhe = ""
        if erro.response is not None:
            try:
                detalhe = erro.response.json().get("reason", "")
            except ValueError:
                detalhe = erro.response.text[:200]
        mensagem = "Nao foi possivel consultar a Open-Meteo."
        if detalhe:
            mensagem = f"{mensagem} {detalhe}"
        raise OpenMeteoError(mensagem) from erro
    except ValueError as erro:
        raise OpenMeteoError("A Open-Meteo retornou uma resposta invalida.") from erro

    if "daily" not in dados:
        raise OpenMeteoError("A Open-Meteo nao retornou dados climaticos diarios.")
    return dados


def processar_dados_diarios(dados: dict[str, Any]) -> pd.DataFrame:
    df = pd.DataFrame(dados["daily"]).rename(columns=MAPA_COLUNAS)
    colunas_ausentes = set(COLUNAS_BASE) - set(df.columns)
    if colunas_ausentes:
        raise OpenMeteoError(
            "Resposta da Open-Meteo sem as variaveis obrigatorias: "
            + ", ".join(sorted(colunas_ausentes))
        )

    df = df[COLUNAS_BASE].copy()
    df["data"] = pd.to_datetime(df["data"], errors="coerce")
    for coluna in COLUNAS_BASE[1:]:
        df[coluna] = pd.to_numeric(df[coluna], errors="coerce")

    df = df.dropna(subset=COLUNAS_BASE).sort_values("data").reset_index(drop=True)
    if df.empty:
        raise OpenMeteoError(
            "A Open-Meteo ainda nao disponibilizou um registro diario completo."
        )

    df["mes"] = df["data"].dt.month
    df["amplitude_termica"] = (
        df["temperatura_maxima"] - df["temperatura_minima"]
    )
    df["media_temperatura"] = (
        df["temperatura_maxima"] + df["temperatura_minima"]
    ) / 2
    df["indice_seca"] = (
        df["temperatura_maxima"] * df["evapotranspiracao"]
    ) / (df["umidade_media"] + 1)
    df["amplitude_termica"] = df["amplitude_termica"].round(4)
    df["media_temperatura"] = df["media_temperatura"].round(4)
    df["indice_seca"] = df["indice_seca"].round(4)
    return df


def buscar_dados_atuais() -> pd.DataFrame:
    dados = consultar_open_meteo(past_days=7, forecast_days=1)
    return processar_dados_diarios(dados)


def buscar_dados_recentes(inicio: date, fim: date) -> pd.DataFrame:
    dados = consultar_open_meteo(inicio=inicio, fim=fim)
    return processar_dados_diarios(dados)


def buscar_intervalo_open_meteo(
    inicio: date,
    fim: date,
    hoje: date,
) -> pd.DataFrame:
    partes: list[pd.DataFrame] = []
    limite_arquivo = hoje - timedelta(days=5)

    if inicio <= limite_arquivo:
        fim_arquivo = min(fim, limite_arquivo)
        dados_arquivo = consultar_open_meteo(
            inicio=inicio,
            fim=fim_arquivo,
            arquivo_historico=True,
        )
        partes.append(processar_dados_diarios(dados_arquivo))

    inicio_forecast = max(inicio, limite_arquivo + timedelta(days=1))
    if inicio_forecast <= fim:
        dados_forecast = consultar_open_meteo(
            inicio=inicio_forecast,
            fim=fim,
        )
        partes.append(processar_dados_diarios(dados_forecast))

    if not partes:
        raise OpenMeteoError("Nenhum dado foi retornado para o periodo solicitado.")

    return (
        pd.concat(partes, ignore_index=True)
        .drop_duplicates(subset=["data"], keep="last")
        .sort_values("data")
        .reset_index(drop=True)
    )
