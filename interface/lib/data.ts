export const LOCATION = {
  city: "Petrolina",
  state: "PE",
  region: "Vale do São Francisco",
}

export type ClimateVariableKey =
  | "temperatura_maxima"
  | "temperatura_minima"
  | "precipitacao"
  | "vento_maximo"
  | "umidade_media"
  | "radiacao_solar"
  | "evapotranspiracao"
  | "amplitude_termica"
  | "media_temperatura"
  | "indice_seca"

export interface ClimateVariableMeta {
  key: ClimateVariableKey
  label: string
  unit: string
  color: string
}

export const CLIMATE_VARIABLES: ClimateVariableMeta[] = [
  {
    key: "temperatura_maxima",
    label: "Temperatura máxima",
    unit: "°C",
    color: "var(--chart-4)",
  },
  {
    key: "temperatura_minima",
    label: "Temperatura mínima",
    unit: "°C",
    color: "var(--chart-2)",
  },
  {
    key: "precipitacao",
    label: "Precipitação",
    unit: " mm",
    color: "var(--chart-2)",
  },
  {
    key: "vento_maximo",
    label: "Vento máximo",
    unit: " km/h",
    color: "var(--chart-5)",
  },
  {
    key: "umidade_media",
    label: "Umidade média",
    unit: "%",
    color: "var(--chart-5)",
  },
  {
    key: "radiacao_solar",
    label: "Radiação solar",
    unit: " MJ/m²",
    color: "var(--chart-3)",
  },
  {
    key: "evapotranspiracao",
    label: "Evapotranspiração",
    unit: " mm",
    color: "var(--chart-1)",
  },
  {
    key: "amplitude_termica",
    label: "Amplitude térmica",
    unit: "°C",
    color: "var(--chart-4)",
  },
  {
    key: "media_temperatura",
    label: "Temperatura média",
    unit: "°C",
    color: "var(--chart-4)",
  },
  {
    key: "indice_seca",
    label: "Índice de seca",
    unit: "",
    color: "var(--chart-4)",
  },
]

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export function getVariableMeta(key: ClimateVariableKey) {
  return CLIMATE_VARIABLES.find((item) => item.key === key)!
}
