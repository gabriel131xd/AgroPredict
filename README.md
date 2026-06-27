![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python\&logoColor=white)
![Machine Learning](https://img.shields.io/badge/Machine%20Learning-XGBoost-orange)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker\&logoColor=white)
![MLflow](https://img.shields.io/badge/MLflow-Experiment%20Tracking-0194E2)
![Open Meteo](https://img.shields.io/badge/Data-Open--Meteo-00AEEF)
![Agriculture](https://img.shields.io/badge/Smart%20Agriculture-Irrigation-success)

# 🌱 AgroPredict — Predição Inteligente de Irrigação

Sistema inteligente para apoio à irrigação agrícola no Vale do São Francisco, utilizando análise climática, aprendizado de máquina e monitoramento de dados para auxiliar na tomada de decisão sobre irrigação.

---

## 📋 Sobre o Projeto

O AgroPredict foi desenvolvido com o objetivo de prever a necessidade de irrigação com base em dados meteorológicos e ambientais, contribuindo para o uso eficiente dos recursos hídricos e para a agricultura de precisão.

A solução integra:

* Coleta e tratamento de dados climáticos;
* Engenharia de atributos (Feature Engineering);
* Treinamento de modelos de Machine Learning;
* Monitoramento de Drift de Dados;
* Interface Web Interativa;
* API REST para disponibilização das previsões;
* Ambiente totalmente containerizado com Docker.

---

## 🎯 Objetivos

* Auxiliar produtores rurais na tomada de decisão sobre irrigação;
* Reduzir desperdícios de água;
* Utilizar dados climáticos históricos e atuais para gerar previsões;
* Disponibilizar informações de forma simples e acessível através de uma interface web moderna.

---

## 🏗️ Arquitetura da Solução

```text
Frontend (Next.js)
        │
        ▼
API REST (FastAPI)
        │
        ├── Modelo de Machine Learning
        ├── Monitoramento de Drift
        ├── Dados Climáticos
        └── MLflow
```

---

## 🚀 Tecnologias Utilizadas

### Backend

* Python 3.13
* FastAPI
* Pandas
* NumPy
* Scikit-Learn
* XGBoost
* Joblib
* MLflow

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Recharts

### Fontes de Dados

* INMET
* Open-Meteo

---

## 📁 Estrutura do Projeto

```text
AgroPredict
│
├── src/
│   ├── api/
│   ├── data/
│   ├── features/
│   ├── models/
│   └── monitoring/
│
├── interface/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
│
├── models/
│   └── modelo_irrigacao.pkl
│
├── data/
│   └── final/
│
├── dashboard/
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 🤖 Machine Learning

O sistema utiliza algoritmos de aprendizado de máquina para prever a necessidade de irrigação com base em variáveis climáticas.

Exemplos de atributos utilizados:

* Temperatura do ar;
* Umidade relativa;
* Radiação solar;
* Velocidade do vento;
* Precipitação;
* Indicadores derivados por engenharia de atributos.

---

## 📊 Funcionalidades

### API

* Resumo dos dados climáticos;
* Consulta por data;
* Previsão de irrigação;
* Monitoramento de Drift;
* Consulta de experimentos MLflow.

### Interface Web

* Dashboard interativo;
* Visualização de indicadores;
* Análise climática;
* Monitoramento do modelo;
* Consulta de previsões;
* Visualização de culturas agrícolas;

---

## 🐳 Executando com Docker

### Clonar o projeto

```bash
git clone https://github.com/gabriel131xd/AgroPredict.git
cd AgroPredict
```

### Executar

```bash
docker compose up --build
```

### Acessos

Frontend:

```text
http://localhost:3000
```

Documentação da API:

```text
http://localhost:8001/docs
```

---

## 🔌 Principais Endpoints

| Método | Endpoint             | Descrição              |
| ------ | -------------------- | ---------------------- |
| GET    | /                    | Página inicial da API  |
| GET    | /health              | Verificação de saúde   |
| GET    | /dados/resumo        | Resumo dos dados       |
| GET    | /dados/climaticos    | Dados climáticos       |
| GET    | /dados/dia           | Consulta por dia       |
| GET    | /previsao/data       | Previsão por data      |
| POST   | /predict             | Nova previsão          |
| GET    | /drift               | Monitoramento de Drift |
| GET    | /mlflow/experimentos | Experimentos MLflow    |
