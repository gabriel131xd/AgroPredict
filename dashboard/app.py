from pathlib import Path

import gradio as gr
import joblib
import mlflow
import pandas as pd
import plotly.express as px


RAIZ_PROJETO = Path(__file__).resolve().parents[1]

ARQUIVO_DADOS = RAIZ_PROJETO / "data" / "final" / "petrolina_dataset_final.csv"
ARQUIVO_MODELO = RAIZ_PROJETO / "models" / "modelo_irrigacao.pkl"

modelo = joblib.load(ARQUIVO_MODELO)


def carregar_dados():
    df = pd.read_csv(ARQUIVO_DADOS)
    df["data"] = pd.to_datetime(df["data"])
    return df


def filtrar_por_mes(df, mes):
    if mes == "Ano inteiro":
        return df

    numero_mes = int(mes.split(" - ")[0])
    return df[df["data"].dt.month == numero_mes]


def gerar_grafico(coluna, mes, tipo_grafico):
    df = carregar_dados()
    df_filtrado = filtrar_por_mes(df, mes)

    nomes = {
        "temperatura_maxima": "Temperatura máxima",
        "temperatura_minima": "Temperatura mínima",
        "precipitacao": "Precipitação",
        "vento_maximo": "Vento máximo",
        "umidade_media": "Umidade média",
        "radiacao_solar": "Radiação solar",
        "evapotranspiracao": "Evapotranspiração",
        "indice_seca": "Índice de seca",
        "precisa_irrigar": "Necessidade de irrigação",
    }

    titulo = f"{nomes.get(coluna, coluna)} — {mes}"

    if tipo_grafico == "Colunas":
        fig = px.bar(
            df_filtrado,
            x="data",
            y=coluna,
            title=titulo,
            labels={
                "data": "Data",
                coluna: nomes.get(coluna, coluna),
            },
        )
    else:
        fig = px.line(
            df_filtrado,
            x="data",
            y=coluna,
            title=titulo,
            labels={
                "data": "Data",
                coluna: nomes.get(coluna, coluna),
            },
            markers=True,
        )

    fig.update_layout(
        template="plotly_dark",
        height=520,
        title_x=0.5,
        hovermode="x unified",
        margin=dict(l=40, r=40, t=80, b=40),
    )

    if tipo_grafico == "Linha":
        fig.update_traces(line=dict(width=3), marker=dict(size=6))

    return fig


def resumo_dados(mes):
    df = carregar_dados()
    df_filtrado = filtrar_por_mes(df, mes)

    total_dias = len(df_filtrado)
    dias_irrigacao = int(df_filtrado["precisa_irrigar"].sum())
    media_temp = round(df_filtrado["temperatura_maxima"].mean(), 2)
    chuva_total = round(df_filtrado["precipitacao"].sum(), 2)
    media_umidade = round(df_filtrado["umidade_media"].mean(), 2)
    media_evapo = round(df_filtrado["evapotranspiracao"].mean(), 2)

    return (
        f"Período analisado: {mes}\n"
        f"Total de dias analisados: {total_dias}\n"
        f"Dias com necessidade de irrigação: {dias_irrigacao}\n"
        f"Temperatura máxima média: {media_temp} °C\n"
        f"Chuva acumulada: {chuva_total} mm\n"
        f"Umidade média: {media_umidade}%\n"
        f"Evapotranspiração média: {media_evapo}"
    )


def prever_por_data(data_escolhida):
    df = carregar_dados()

    df["data"] = pd.to_datetime(df["data"]).dt.strftime("%Y-%m-%d")

    data = str(data_escolhida).strip()

    registro = df[df["data"] == data]

    if registro.empty:
        return (
            "Data não encontrada na base.",
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        )

    linha = registro.iloc[0]

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

    entrada = pd.DataFrame([linha[features]])

    previsao = modelo.predict(entrada)[0]

    resultado = (
        "SIM, há necessidade de irrigação."
        if previsao == 1
        else "NÃO, não há necessidade forte de irrigação."
    )

    return (
        resultado,
        float(linha["temperatura_maxima"]),
        float(linha["temperatura_minima"]),
        float(linha["precipitacao"]),
        float(linha["vento_maximo"]),
        float(linha["umidade_media"]),
        float(linha["radiacao_solar"]),
        float(linha["evapotranspiracao"]),
        float(linha["indice_seca"]),
        int(linha["precisa_irrigar"]),
    )

def carregar_mlflow():
    try:
        runs = mlflow.search_runs(experiment_names=["AgroPredict"])

        if runs.empty:
            return pd.DataFrame({"mensagem": ["Nenhum experimento encontrado no MLflow."]})

        colunas = [
            "run_id",
            "status",
            "metrics.accuracy",
            "params.modelo",
            "params.n_estimators",
            "start_time",
        ]

        colunas_existentes = [coluna for coluna in colunas if coluna in runs.columns]

        df_runs = runs[colunas_existentes].head(10)

        df_runs = df_runs.rename(
            columns={
                "run_id": "ID da execução",
                "status": "Status",
                "metrics.accuracy": "Acurácia",
                "params.modelo": "Modelo",
                "params.n_estimators": "Árvores",
                "start_time": "Data do treino",
            }
        )

        return df_runs

    except Exception as erro:
        return pd.DataFrame({"erro": [str(erro)]})


MESES = [
    "Ano inteiro",
    "1 - Janeiro",
    "2 - Fevereiro",
    "3 - Março",
    "4 - Abril",
    "5 - Maio",
    "6 - Junho",
    "7 - Julho",
    "8 - Agosto",
    "9 - Setembro",
    "10 - Outubro",
    "11 - Novembro",
    "12 - Dezembro",
]


with gr.Blocks(title="AgroPredict") as app:
    gr.Markdown("# AgroPredict — Predição Inteligente de Irrigação")
    gr.Markdown(
        "Dashboard com dados climáticos reais de Petrolina, previsão por data e acompanhamento de experimentos MLflow."
    )

    with gr.Tab("Resumo dos Dados"):
        mes_resumo = gr.Dropdown(
            choices=MESES,
            value="Ano inteiro",
            label="Período",
        )
        botao_resumo = gr.Button("Gerar resumo")
        saida_resumo = gr.Textbox(label="Resumo climático de Petrolina", lines=8)
        botao_resumo.click(resumo_dados, inputs=mes_resumo, outputs=saida_resumo)

    with gr.Tab("Gráficos Climáticos"):
        coluna = gr.Dropdown(
            choices=[
                "temperatura_maxima",
                "temperatura_minima",
                "precipitacao",
                "vento_maximo",
                "umidade_media",
                "radiacao_solar",
                "evapotranspiracao",
                "indice_seca",
                "precisa_irrigar",
            ],
            value="temperatura_maxima",
            label="Variável climática",
        )

        mes_grafico = gr.Dropdown(
            choices=MESES,
            value="Ano inteiro",
            label="Período",
        )

        tipo_grafico = gr.Dropdown(
            choices=["Linha", "Colunas"],
            value="Linha",
            label="Tipo de gráfico",
        )

        botao_grafico = gr.Button("Gerar gráfico")
        grafico = gr.Plot(label="Gráfico climático")

        botao_grafico.click(
            gerar_grafico,
            inputs=[coluna, mes_grafico, tipo_grafico],
            outputs=grafico,
        )

    with gr.Tab("Previsão de Irrigação"):
        data_escolhida = gr.Textbox(
            label="Digite uma data da base (YYYY-MM-DD)",
            value="2025-01-01",
        )

        botao_prever = gr.Button("Prever irrigação para a data selecionada")

        resultado = gr.Textbox(label="Resultado")
        temperatura_maxima = gr.Number(label="Temperatura máxima")
        temperatura_minima = gr.Number(label="Temperatura mínima")
        precipitacao = gr.Number(label="Precipitação")
        vento_maximo = gr.Number(label="Vento máximo")
        umidade_media = gr.Number(label="Umidade média")
        radiacao_solar = gr.Number(label="Radiação solar")
        evapotranspiracao = gr.Number(label="Evapotranspiração")
        indice_seca = gr.Number(label="Índice de seca")
        target_real = gr.Number(label="Classe gerada no dataset")

        botao_prever.click(
            prever_por_data,
            inputs=data_escolhida,
            outputs=[
                resultado,
                temperatura_maxima,
                temperatura_minima,
                precipitacao,
                vento_maximo,
                umidade_media,
                radiacao_solar,
                evapotranspiracao,
                indice_seca,
                target_real,
            ],
        )

    with gr.Tab("MLflow"):
        gr.Markdown(
            "Esta aba mostra os experimentos registrados no MLflow: cada linha representa uma execução de treinamento do modelo."
        )
        botao_mlflow = gr.Button("Carregar experimentos")
        tabela_mlflow = gr.Dataframe(label="Experimentos registrados")
        botao_mlflow.click(carregar_mlflow, outputs=tabela_mlflow)


if __name__ == "__main__":
    app.launch(theme=gr.themes.Soft())