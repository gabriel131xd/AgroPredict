import type { ClimateVariableKey } from "@/lib/data"

export interface Resumo {
  total_dias_analisados: number
  dias_com_necessidade_irrigacao: number
  temperatura_maxima_media: number
  chuva_acumulada: number
  umidade_media: number
  evapotranspiracao_media: number
  periodo_inicial: string
  periodo_final: string
  localizacao: string
}

export interface DadosDia {
  data: string
  temperatura_maxima: number
  temperatura_minima: number
  precipitacao: number
  vento_maximo: number
  umidade_media: number
  radiacao_solar: number
  evapotranspiracao: number
  mes: number
  amplitude_termica: number
  media_temperatura: number
  indice_seca: number
  fonte: "local" | "open-meteo" | "forecast"
  origem?: DataOrigin
}

export type DataOrigin =
  | "Base histórica local"
  | "Open-Meteo"
  | "Base histórica + Open-Meteo"

export interface ClimateResponse {
  total: number
  origem: DataOrigin
  periodo_inicial: string | null
  periodo_final: string | null
  dados: DadosDia[]
}

export interface ClimateFilters {
  mes?: number
  inicio?: string
  fim?: string
  variavel?: ClimateVariableKey
}

export interface PredictPayload {
  temperatura_maxima: number
  temperatura_minima: number
  precipitacao: number
  vento_maximo: number
  umidade_media: number
  radiacao_solar: number
  evapotranspiracao: number
  mes: number
  amplitude_termica: number
  media_temperatura: number
  indice_seca: number
}

export interface PredictResponse {
  precisa_irrigar: boolean
  probabilidade?: number
  probabilidade_irrigacao?: number
  explicacao: string
}

export interface PredictionByDateResponse {
  dados_climaticos: DadosDia
  origem: DataOrigin
  tipo: "histórico" | "atual ou recente" | "previsão futura"
  precisa_irrigar: boolean
  probabilidade?: number | null
  explicacao: string
}

export interface DriftResult {
  variavel: ClimateVariableKey
  media_referencia: number
  media_atual: number
  diferenca_percentual: number
  status: "OK" | "DRIFT DETECTADO"
}

export interface DriftResponse {
  periodo_referencia: { inicio: string; fim: string }
  periodo_atual: { inicio: string; fim: string }
  resultados: DriftResult[]
}

export interface MlflowExperiment {
  run_id: string
  status: string
  accuracy: number | null
  modelo: string | null
  n_estimators: string | null
  start_time: string | null
}

export interface MlflowResponse {
  total: number
  experimentos: MlflowExperiment[]
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function getApiUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL não está configurada. Consulte o arquivo .env.local.example.",
    )
  }
  return url.replace(/\/$/, "")
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError("Não foi possível conectar à API do AgroPredict.")
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail =
      typeof body?.detail === "string"
        ? body.detail
        : `A API respondeu com status ${response.status}.`
    throw new ApiError(detail, response.status)
  }

  return response.json() as Promise<T>
}

export function getResumo() {
  return request<Resumo>("/dados/resumo")
}

export function getDadosClimaticos(filters: ClimateFilters = {}) {
  const params = new URLSearchParams()
  const hasDateRange = Boolean(filters.inicio && filters.fim)

  if (hasDateRange) {
    params.set("inicio", filters.inicio!)
    params.set("fim", filters.fim!)
  } else if (filters.mes) {
    params.set("mes", String(filters.mes))
  }

  if (filters.variavel) params.set("variavel", filters.variavel)
  const query = params.toString()
  return request<ClimateResponse>(`/dados/climaticos${query ? `?${query}` : ""}`)
}

export function getDadosDia(data: string) {
  return request<DadosDia>(`/dados/dia?data=${encodeURIComponent(data)}`)
}

export function getPrevisaoPorData(data: string) {
  return request<PredictionByDateResponse>(
    `/previsao/data?data=${encodeURIComponent(data)}`,
  )
}

export function predict(payload: PredictPayload) {
  return request<PredictResponse>("/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getDrift() {
  return request<DriftResponse>("/drift")
}

export function getExperimentosMlflow() {
  return request<MlflowResponse>("/mlflow/experimentos")
}
