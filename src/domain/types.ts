/** Origem de um valor usado no cálculo. */
export type Origin = "user" | "reference" | "default";

export interface Field {
  value: number | null;
  origin: Origin;
}

export type Domain = "energy" | "water";

export type EnergyMethod = "power" | "cycle" | "daily" | "monthly";
export type WaterMethod = "flow" | "volume" | "cycle";
export type Method = EnergyMethod | WaterMethod;

/** Período em que a frequência de uso é informada. */
export type Period = "day" | "week" | "month";

/** perPerson: a frequência é por pessoa; household: já representa a residência inteira. */
export type Scope = "perPerson" | "household";

export type DurationUnit = "min" | "h";

export type ParamKey =
  | "powerW"
  | "duration"
  | "uses"
  | "quantity"
  | "people"
  | "usageFactor"
  | "standbyW"
  | "kWhPerCycle"
  | "kWhPerDay"
  | "kWhPerMonth"
  | "flowLpm"
  | "litersPerUse"
  | "litersPerCycle";

export type Params = Partial<Record<ParamKey, Field>>;

export interface Item {
  id: string;
  domain: Domain;
  catalogId: string;
  name: string;
  icon: string;
  category: string;
  method: Method;
  period: Period;
  scope: Scope;
  durationUnit: DurationUnit;
  params: Params;
}

export type ItemStatus = "estimated" | "custom" | "pending";

export interface Issue {
  field?: ParamKey;
  message: string;
}

/** Um passo do detalhamento: parâmetro usado e de onde veio. */
export interface Step {
  label: string;
  value: number;
  unit: string;
  origin: Origin | "calculated";
}

export interface ItemResult {
  status: ItemStatus;
  issues: Issue[];
  /** kWh (energia) ou litros (água) no período da simulação; null se pendente. */
  monthly: number | null;
  daily: number | null;
  steps: Step[];
  formula: string;
}

export interface Settings {
  /** Número de dias do período simulado (padrão 30). */
  days: number;
}

export interface EnergyTariff {
  rate: number | null;
  extraPerKWh: number | null;
  fixed: number | null;
}

export type SewerMode = "none" | "perM3" | "percent";

export interface WaterTariff {
  rate: number | null;
  extraPerM3: number | null;
  sewerMode: SewerMode;
  sewerValue: number | null;
  fixed: number | null;
}
