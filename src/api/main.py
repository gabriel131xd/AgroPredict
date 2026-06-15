from datetime import date, datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from mlflow.tracking import MlflowClient
from pydantic import BaseModel, Field
from src.data.open_meteo import (
    OpenMeteoError,
    buscar_intervalo_open_meteo,
)


app = FastAPI(
    title="AgroPredict API",
    description="API de previsao de irrigacao agricola para Petrolina/PE",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


RAIZ_PROJETO = Path(__file__).resolve().parents[2]
CAMINHO_DADOS = RAIZ_PROJETO / "data" / "final" / "petrolina_dataset_final.csv"
CAMINHO_MODELO = RAIZ_PROJETO / "models" / "modelo_irrigacao.pkl"
CAMINHO_MLFLOW = RAIZ_PROJETO / "mlflow.db"

FEATURES_MODELO = [
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

COLUNAS_CLIMATICAS = [
    "data",
    *FEATURES_MODELO,
    "precisa_irrigar",
]

VARIAVEIS_PERMITIDAS = set(COLUNAS_CLIMATICAS) - {"data"}
COLUNAS_UNIFICADAS = ["data", *FEATURES_MODELO, "fonte"]
FUSO_PETROLINA = ZoneInfo("America/Sao_Paulo")


class DadosClimaticos(BaseModel):
    temperatura_maxima: float
    temperatura_minima: float
    precipitacao: float = Field(ge=0)
    vento_maximo: float = Field(ge=0)
    umidade_media: float = Field(ge=0, le=100)
    radiacao_solar: float = Field(ge=0)
    evapotranspiracao: float = Field(ge=0)
    mes: int = Field(ge=1, le=12)
    amplitude_termica: float
    media_temperatura: float
    indice_seca: float


@lru_cache(maxsize=1)
def carregar_dados() -> pd.DataFrame:
    if not CAMINHO_DADOS.exists():
        raise FileNotFoundError(f"Dataset nao encontrado: {CAMINHO_DADOS}")

    df = pd.read_csv(CAMINHO_DADOS)
    colunas_ausentes = set(COLUNAS_CLIMATICAS) - set(df.columns)
    if colunas_ausentes:
        raise ValueError(
            "Dataset sem as colunas obrigatorias: "
            + ", ".join(sorted(colunas_ausentes))
        )

    df["data"] = pd.to_datetime(df["data"], errors="raise")
    return df.sort_values("data").reset_index(drop=True)


@lru_cache(maxsize=1)
def carregar_modelo():
    if not CAMINHO_MODELO.exists():
        raise FileNotFoundError(f"Modelo nao encontrado: {CAMINHO_MODELO}")
    return joblib.load(CAMINHO_MODELO)


def obter_dados() -> pd.DataFrame:
    try:
        return carregar_dados().copy()
    except (FileNotFoundError, ValueError, pd.errors.ParserError) as erro:
        raise HTTPException(status_code=503, detail=str(erro)) from erro


def serializar_registros(df: pd.DataFrame) -> list[dict[str, Any]]:
    serializado = df.copy()
    if "data" in serializado.columns:
        serializado["data"] = serializado["data"].dt.strftime("%Y-%m-%d")
    serializado = serializado.where(pd.notna(serializado), None)
    return serializado.to_dict(orient="records")


def executar_previsao(entrada: pd.DataFrame) -> dict[str, Any]:
    try:
        modelo = carregar_modelo()
    except FileNotFoundError as erro:
        raise HTTPException(status_code=503, detail=str(erro)) from erro

    previsao = modelo.predict(entrada[FEATURES_MODELO])[0]
    resposta: dict[str, Any] = {"precisa_irrigar": bool(previsao)}
    if hasattr(modelo, "predict_proba"):
        probabilidades = modelo.predict_proba(entrada[FEATURES_MODELO])[0]
        classes = list(modelo.classes_)
        indice_positivo = classes.index(1) if 1 in classes else int(previsao)
        probabilidade = round(
            float(probabilidades[indice_positivo]),
            4,
        )
        resposta["probabilidade"] = probabilidade
        resposta["probabilidade_irrigacao"] = probabilidade
    resposta["explicacao"] = (
        "O modelo recomenda irrigação para as condições climáticas informadas."
        if resposta["precisa_irrigar"]
        else "O modelo não recomenda irrigação para as condições climáticas informadas."
    )
    return resposta


def validar_periodo_unificado(inicio: date, fim: date) -> None:
    if inicio > fim:
        raise HTTPException(
            status_code=422,
            detail="A data inicial deve ser anterior ou igual a data final.",
        )
    hoje = datetime.now(FUSO_PETROLINA).date()
    limite_futuro = hoje + timedelta(days=5)
    if fim > limite_futuro:
        raise HTTPException(
            status_code=422,
            detail=(
                "Previsões futuras estão disponíveis somente até 5 dias à frente. "
                f"Selecione uma data até {limite_futuro.isoformat()}."
            ),
        )


def agrupar_datas_contiguas(datas: list[date]) -> list[tuple[date, date]]:
    if not datas:
        return []
    grupos: list[tuple[date, date]] = []
    inicio_grupo = datas[0]
    fim_grupo = datas[0]
    for data_atual in datas[1:]:
        if data_atual == fim_grupo + timedelta(days=1):
            fim_grupo = data_atual
            continue
        grupos.append((inicio_grupo, fim_grupo))
        inicio_grupo = data_atual
        fim_grupo = data_atual
    grupos.append((inicio_grupo, fim_grupo))
    return grupos


def resolver_periodo_unificado(inicio: date, fim: date) -> tuple[pd.DataFrame, str]:
    validar_periodo_unificado(inicio, fim)
    hoje = datetime.now(FUSO_PETROLINA).date()
    df_local = obter_dados()
    mascara_local = (
        (df_local["data"].dt.date >= inicio)
        & (df_local["data"].dt.date <= fim)
    )
    local = df_local.loc[mascara_local, ["data", *FEATURES_MODELO]].copy()
    local["fonte"] = "local"

    datas_solicitadas = list(pd.date_range(inicio, fim, freq="D").date)
    datas_locais = set(local["data"].dt.date)
    datas_externas = [data_item for data_item in datas_solicitadas if data_item not in datas_locais]

    partes = [local] if not local.empty else []
    try:
        for inicio_grupo, fim_grupo in agrupar_datas_contiguas(datas_externas):
            externo = buscar_intervalo_open_meteo(
                inicio_grupo,
                fim_grupo,
                hoje,
            )
            externo = externo[["data", *FEATURES_MODELO]].copy()
            externo["fonte"] = externo["data"].dt.date.map(
                lambda data_item: "forecast" if data_item > hoje else "open-meteo"
            )
            partes.append(externo)
    except OpenMeteoError as erro:
        raise HTTPException(status_code=503, detail=str(erro)) from erro

    if not partes:
        raise HTTPException(
            status_code=404,
            detail="Nenhum dado climatico foi encontrado para o periodo solicitado.",
        )

    combinado = (
        pd.concat(partes, ignore_index=True)
        .drop_duplicates(subset=["data"], keep="first")
        .sort_values("data")
        .reset_index(drop=True)
    )
    combinado[FEATURES_MODELO] = combinado[FEATURES_MODELO].round(4)
    fontes = set(combinado["fonte"])
    if fontes == {"local"}:
        origem = "Base histórica local"
    elif "local" in fontes:
        origem = "Base histórica + Open-Meteo"
    else:
        origem = "Open-Meteo"
    return combinado, origem


def resposta_previsao_por_data(data_consulta: date) -> dict[str, Any]:
    df, origem = resolver_periodo_unificado(data_consulta, data_consulta)
    registro = df.iloc[[0]]
    resultado = executar_previsao(registro)
    dados = serializar_registros(registro[COLUNAS_UNIFICADAS])[0]
    hoje = datetime.now(FUSO_PETROLINA).date()
    tipo = (
        "histórico"
        if dados["fonte"] == "local"
        else "previsão futura"
        if data_consulta > hoje
        else "atual ou recente"
    )
    return {
        "dados_climaticos": dados,
        "origem": origem,
        "tipo": tipo,
        "precisa_irrigar": resultado["precisa_irrigar"],
        "probabilidade": resultado.get("probabilidade"),
        "explicacao": resultado["explicacao"],
    }


@app.get("/")
def home():
    return {
        "status": "online",
        "mensagem": "AgroPredict API funcionando",
        "documentacao": "/docs",
    }


@app.get("/health")
def health():
    dataset_disponivel = CAMINHO_DADOS.exists()
    modelo_disponivel = CAMINHO_MODELO.exists()
    return {
        "status": "healthy" if dataset_disponivel and modelo_disponivel else "degraded",
        "dataset": dataset_disponivel,
        "modelo": modelo_disponivel,
        "mlflow": CAMINHO_MLFLOW.exists(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/dados/resumo")
def resumo_dados():
    df = obter_dados()
    return {
        "total_dias_analisados": int(len(df)),
        "dias_com_necessidade_irrigacao": int(df["precisa_irrigar"].sum()),
        "temperatura_maxima_media": round(float(df["temperatura_maxima"].mean()), 2),
        "chuva_acumulada": round(float(df["precipitacao"].sum()), 2),
        "umidade_media": round(float(df["umidade_media"].mean()), 2),
        "evapotranspiracao_media": round(float(df["evapotranspiracao"].mean()), 2),
        "periodo_inicial": df["data"].min().strftime("%Y-%m-%d"),
        "periodo_final": df["data"].max().strftime("%Y-%m-%d"),
        "localizacao": "Petrolina/PE",
    }


@app.get("/dados/climaticos")
def dados_climaticos(
    mes: int | None = Query(default=None, ge=1, le=12),
    inicio: date | None = None,
    fim: date | None = None,
    variavel: str | None = None,
):
    if (inicio is None) != (fim is None):
        raise HTTPException(
            status_code=422,
            detail="Informe as datas inicial e final para consultar um periodo.",
        )
    if variavel and variavel not in VARIAVEIS_PERMITIDAS:
        raise HTTPException(
            status_code=422,
            detail=f"Variavel invalida. Opcoes: {', '.join(sorted(VARIAVEIS_PERMITIDAS))}",
        )

    if inicio is not None and fim is not None:
        df, origem = resolver_periodo_unificado(inicio, fim)
    elif mes is not None:
        df = obter_dados()[["data", *FEATURES_MODELO]].copy()
        df = df[df["data"].dt.month == mes]
        df["fonte"] = "local"
        origem = "Base histórica local"
    else:
        df = obter_dados()[["data", *FEATURES_MODELO]].copy()
        df["fonte"] = "local"
        origem = "Base histórica local"

    periodo_inicial = (
        df["data"].min().strftime("%Y-%m-%d") if not df.empty else None
    )
    periodo_final = (
        df["data"].max().strftime("%Y-%m-%d") if not df.empty else None
    )
    return {
        "total": int(len(df)),
        "origem": origem,
        "periodo_inicial": periodo_inicial,
        "periodo_final": periodo_final,
        "dados": serializar_registros(df[COLUNAS_UNIFICADAS]),
    }


@app.get("/dados/dia")
def dados_dia(data: date = Query(...)):
    df, origem = resolver_periodo_unificado(data, data)
    resposta = serializar_registros(df[COLUNAS_UNIFICADAS])[0]
    resposta["origem"] = origem
    return resposta


@app.get("/previsao/data")
def previsao_por_data(data: date = Query(...)):
    return resposta_previsao_por_data(data)


@app.get("/drift")
def drift():
    df = obter_dados()
    ponto_divisao = len(df) // 2
    referencia = df.iloc[:ponto_divisao]
    atual = df.iloc[ponto_divisao:]

    variaveis = [
        "temperatura_maxima",
        "precipitacao",
        "umidade_media",
        "radiacao_solar",
        "evapotranspiracao",
        "indice_seca",
    ]
    resultados = []
    for variavel in variaveis:
        media_referencia = float(referencia[variavel].mean())
        media_atual = float(atual[variavel].mean())
        diferenca = (
            ((media_atual - media_referencia) / abs(media_referencia)) * 100
            if media_referencia != 0
            else 0.0
        )
        resultados.append(
            {
                "variavel": variavel,
                "media_referencia": round(media_referencia, 4),
                "media_atual": round(media_atual, 4),
                "diferenca_percentual": round(diferenca, 2),
                "status": "DRIFT DETECTADO" if abs(diferenca) > 20 else "OK",
            }
        )

    return {
        "periodo_referencia": {
            "inicio": referencia["data"].min().strftime("%Y-%m-%d"),
            "fim": referencia["data"].max().strftime("%Y-%m-%d"),
        },
        "periodo_atual": {
            "inicio": atual["data"].min().strftime("%Y-%m-%d"),
            "fim": atual["data"].max().strftime("%Y-%m-%d"),
        },
        "resultados": resultados,
    }


@app.get("/mlflow/experimentos")
def experimentos_mlflow():
    if not CAMINHO_MLFLOW.exists():
        raise HTTPException(status_code=501, detail="Endpoint ainda nao implementado")

    try:
        tracking_uri = f"sqlite:///{CAMINHO_MLFLOW.as_posix()}"
        client = MlflowClient(tracking_uri=tracking_uri)
        experiment = client.get_experiment_by_name("AgroPredict")
        if experiment is None:
            return {"total": 0, "experimentos": []}

        runs = client.search_runs(
            experiment_ids=[experiment.experiment_id],
            order_by=["attributes.start_time DESC"],
            max_results=100,
        )
        experimentos = [
            {
                "run_id": run.info.run_id,
                "status": run.info.status,
                "accuracy": run.data.metrics.get("accuracy"),
                "modelo": run.data.params.get("modelo"),
                "n_estimators": run.data.params.get("n_estimators"),
                "start_time": (
                    datetime.fromtimestamp(
                        run.info.start_time / 1000,
                        tz=timezone.utc,
                    ).isoformat()
                    if run.info.start_time
                    else None
                ),
            }
            for run in runs
        ]
        return {"total": len(experimentos), "experimentos": experimentos}
    except Exception as erro:
        raise HTTPException(
            status_code=503,
            detail=f"Nao foi possivel consultar o MLflow: {erro}",
        ) from erro


@app.post("/predict")
def prever(dados: DadosClimaticos):
    entrada = pd.DataFrame([dados.model_dump()], columns=FEATURES_MODELO)
    return executar_previsao(entrada)
