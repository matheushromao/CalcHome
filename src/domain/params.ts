import type { DurationUnit, Method, ParamKey, Period, Scope } from "./types";

export interface ParamMeta {
  label: string;
  unit: string;
  /** Explica por que o dado é necessário (mostrado quando ele falta). */
  why: string;
  min: number;
  max?: number;
  /** Zero é aceito pelo campo, mas impede o cálculo. */
  zeroBlocks?: boolean;
  step?: number;
}

export const PARAM_META: Record<ParamKey, ParamMeta> = {
  powerW: {
    label: "Potência",
    unit: "W",
    why: "A potência indica quanta energia o aparelho usa enquanto está ligado.",
    min: 0,
    zeroBlocks: true,
  },
  duration: {
    label: "Tempo por uso",
    unit: "min",
    why: "Sem o tempo de uso não é possível saber por quanto tempo o consumo acontece.",
    min: 0,
    zeroBlocks: true,
  },
  uses: {
    label: "Frequência",
    unit: "vezes",
    why: "A frequência indica quantas vezes o item é usado no período.",
    min: 0,
  },
  quantity: {
    label: "Quantidade",
    unit: "un.",
    why: "Quantidade de aparelhos ou pontos de consumo iguais.",
    min: 0,
    step: 1,
  },
  people: {
    label: "Pessoas",
    unit: "pessoas",
    why: "A frequência foi informada por pessoa, então é preciso saber quantas pessoas usam.",
    min: 0,
    step: 1,
  },
  usageFactor: {
    label: "Fator de utilização",
    unit: "0 a 1",
    why: "Fração do tempo em que o aparelho opera na potência informada (ex.: compressor que liga e desliga).",
    min: 0,
    max: 1,
    zeroBlocks: true,
  },
  standbyW: {
    label: "Consumo em espera (standby)",
    unit: "W",
    why: "Consumo enquanto o aparelho está desligado, mas conectado à tomada.",
    min: 0,
  },
  kWhPerCycle: {
    label: "Consumo por ciclo",
    unit: "kWh",
    why: "Energia gasta em cada ciclo completo (consta no manual ou etiqueta do aparelho).",
    min: 0,
    zeroBlocks: true,
  },
  kWhPerDay: {
    label: "Consumo diário",
    unit: "kWh/dia",
    why: "Energia gasta por dia, conforme informação do fabricante.",
    min: 0,
    zeroBlocks: true,
  },
  kWhPerMonth: {
    label: "Consumo mensal do fabricante",
    unit: "kWh/mês",
    why: "Consumo mensal informado na etiqueta de eficiência energética.",
    min: 0,
    zeroBlocks: true,
  },
  flowLpm: {
    label: "Vazão",
    unit: "L/min",
    why: "A vazão indica quantos litros saem por minuto.",
    min: 0,
    zeroBlocks: true,
  },
  litersPerUse: {
    label: "Volume por uso",
    unit: "L",
    why: "Quantidade de água gasta em cada utilização.",
    min: 0,
    zeroBlocks: true,
  },
  litersPerCycle: {
    label: "Água por ciclo",
    unit: "L",
    why: "Litros de água usados em cada ciclo da máquina.",
    min: 0,
    zeroBlocks: true,
  },
};

export const METHOD_LABEL: Record<Method, string> = {
  power: "Potência e tempo de uso",
  cycle: "Consumo por ciclo",
  daily: "Consumo diário",
  monthly: "Consumo mensal (etiqueta)",
  flow: "Vazão e duração",
  volume: "Volume por uso",
};

export const PERIOD_LABEL: Record<Period, string> = {
  day: "por dia",
  week: "por semana",
  month: "por mês",
};

export const DURATION_UNIT_LABEL: Record<DurationUnit, string> = {
  min: "min",
  h: "h",
};

/** Campos indispensáveis para cada método. */
export const REQUIRED_PARAMS: Record<Method, ParamKey[]> = {
  power: ["powerW", "duration", "uses"],
  cycle: ["kWhPerCycle", "uses"],
  daily: ["kWhPerDay", "uses"],
  monthly: ["kWhPerMonth"],
  flow: ["flowLpm", "duration", "uses"],
  volume: ["litersPerUse", "uses"],
};

/** Campos de cálculo que só aparecem no modo detalhado. */
export const DETAILED_PARAMS: Partial<Record<Method, ParamKey[]>> = {
  power: ["usageFactor", "standbyW"],
};

/** Campos multiplicadores que assumem 1 por padrão. */
export function multiplierParams(scope: Scope): ParamKey[] {
  return scope === "perPerson" ? ["quantity", "people"] : ["quantity"];
}

/** Rótulo do parâmetro "uses" conforme o método. */
export function usesLabel(method: Method): string {
  switch (method) {
    case "cycle":
      return "Ciclos";
    case "daily":
      return "Dias de uso";
    default:
      return "Utilizações";
  }
}

/** Para água, o "cycle" usa litros por ciclo em vez de kWh. */
export function requiredParams(domain: "energy" | "water", method: Method): ParamKey[] {
  if (domain === "water" && method === "cycle") return ["litersPerCycle", "uses"];
  return REQUIRED_PARAMS[method];
}
