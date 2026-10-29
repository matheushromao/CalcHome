import { usesInSimulation, maxDaysInPeriod } from "./frequency";
import { PARAM_META, PERIOD_LABEL, multiplierParams, requiredParams, usesLabel } from "./params";
import type { Field, Issue, Item, ItemResult, ItemStatus, Origin, ParamKey, Settings, Step } from "./types";
import { checkRequired, validateValue } from "./validation";

/**
 * Função única de cálculo por item, usada pelos modos simples e detalhado.
 * Retorna kWh (energia) ou litros (água) no período simulado.
 */
export function calculateItem(item: Item, settings: Settings): ItemResult {
  const { days } = settings;
  const required = requiredParams(item.domain, item.method);
  const issues: Issue[] = [];

  for (const key of required) {
    const issue = checkRequired(key, item.params[key]);
    if (issue) issues.push(issue);
  }
  for (const key of optionalKeys(item)) {
    const message = validateValue(key, item.params[key]?.value ?? null);
    if (message) issues.push({ field: key, message });
  }

  const v = (key: ParamKey, fallback: number) => item.params[key]?.value ?? fallback;
  const formula = formulaFor(item);

  if (issues.length === 0) {
    const frequencyIssue = checkFrequency(item, days);
    if (frequencyIssue) issues.push(frequencyIssue);
  }
  if (issues.length > 0) {
    return { status: "pending", issues, monthly: null, daily: null, steps: [], formula };
  }

  const quantity = v("quantity", 1);
  const people = item.scope === "perPerson" ? v("people", 1) : 1;
  const uses = v("uses", 0);
  const usesTotal = usesInSimulation(uses, item.period, days);
  const steps: Step[] = [];
  const add = (key: ParamKey, label = PARAM_META[key].label, unit = PARAM_META[key].unit) => {
    const field = item.params[key];
    steps.push({ label, value: field?.value ?? 1, unit, origin: field?.origin ?? "default" });
  };
  const addUses = () =>
    steps.push({
      label: usesLabel(item.method),
      value: uses,
      unit: PERIOD_LABEL[item.period],
      origin: item.params.uses?.origin ?? "default",
    });
  const addMultipliers = () => {
    add("quantity");
    if (item.scope === "perPerson") add("people");
  };
  const durationUnit = item.durationUnit;

  let monthly: number;
  switch (item.method) {
    case "power": {
      const powerW = v("powerW", 0);
      const hoursPerUse = toHours(v("duration", 0), durationUnit);
      const factor = v("usageFactor", 1);
      const standbyW = v("standbyW", 0);
      add("powerW");
      add("duration", "Tempo por uso", durationUnit);
      addUses();
      addMultipliers();
      if (item.params.usageFactor?.value != null) add("usageFactor");
      monthly = (powerW / 1000) * hoursPerUse * usesTotal * people * quantity * factor;
      if (standbyW > 0) {
        // Standby só nas horas em que o aparelho não está em uso, sem contar o mesmo período duas vezes.
        const hoursInUsePerDay = (hoursPerUse * usesTotal * people) / days;
        const standbyHoursPerDay = Math.max(0, 24 - hoursInUsePerDay);
        add("standbyW");
        steps.push({ label: "Horas em espera por dia", value: standbyHoursPerDay, unit: "h", origin: "calculated" });
        monthly += (standbyW / 1000) * standbyHoursPerDay * days * quantity;
      }
      break;
    }
    case "cycle": {
      if (item.domain === "energy") {
        add("kWhPerCycle");
        addUses();
        addMultipliers();
        monthly = v("kWhPerCycle", 0) * usesTotal * people * quantity;
      } else {
        add("litersPerCycle");
        addUses();
        addMultipliers();
        monthly = v("litersPerCycle", 0) * usesTotal * people * quantity;
      }
      break;
    }
    case "daily": {
      add("kWhPerDay");
      addUses();
      add("quantity");
      monthly = v("kWhPerDay", 0) * usesTotal * quantity;
      break;
    }
    case "monthly": {
      add("kWhPerMonth");
      add("quantity");
      monthly = v("kWhPerMonth", 0) * (days / 30) * quantity;
      break;
    }
    case "flow": {
      add("flowLpm");
      add("duration", "Tempo por uso", durationUnit);
      addUses();
      addMultipliers();
      monthly = v("flowLpm", 0) * toMinutes(v("duration", 0), durationUnit) * usesTotal * people * quantity;
      break;
    }
    case "volume": {
      add("litersPerUse");
      addUses();
      addMultipliers();
      monthly = v("litersPerUse", 0) * usesTotal * people * quantity;
      break;
    }
  }

  steps.push({ label: "Período simulado", value: days, unit: "dias", origin: "user" });

  return {
    status: statusOf(item, required),
    issues: [],
    monthly,
    daily: monthly / days,
    steps,
    formula,
  };
}

function toHours(value: number, unit: Item["durationUnit"]) {
  return unit === "h" ? value : value / 60;
}

function toMinutes(value: number, unit: Item["durationUnit"]) {
  return unit === "h" ? value * 60 : value;
}

function optionalKeys(item: Item): ParamKey[] {
  const keys = new Set<ParamKey>(multiplierParams(item.scope));
  if (item.method === "power") {
    keys.add("usageFactor");
    keys.add("standbyW");
  }
  return [...keys];
}

/** Detecta frequências impossíveis (ex.: mais de 24 h de uso por dia, 8 dias por semana). */
function checkFrequency(item: Item, days: number): Issue | null {
  const uses = item.params.uses?.value ?? 0;
  if (item.method === "daily" && uses > maxDaysInPeriod(item.period)) {
    return {
      field: "uses",
      message: `Frequência impossível: no máximo ${maxDaysInPeriod(item.period)} dia(s) ${PERIOD_LABEL[item.period]}.`,
    };
  }
  if (item.method === "power" || item.method === "flow") {
    const duration = item.params.duration?.value ?? 0;
    const usesTotal = usesInSimulation(uses, item.period, days);
    // Para itens por pessoa, as pessoas compartilham o mesmo ponto de uso.
    const people = item.scope === "perPerson" ? item.params.people?.value ?? 1 : 1;
    const hoursPerDay = (toHours(duration, item.durationUnit) * usesTotal * people) / days;
    if (hoursPerDay > 24 + 1e-9) {
      return {
        field: "uses",
        message: "Frequência impossível: o tempo total de uso passa de 24 horas por dia em cada aparelho ou ponto.",
      };
    }
  }
  return null;
}

/** Estimado se algum dado indispensável vem de referência; personalizado caso contrário. */
function statusOf(item: Item, required: ParamKey[]): ItemStatus {
  const relevant: (Field | undefined)[] = required.map((key) => item.params[key]);
  if (item.method === "power" && item.params.usageFactor?.value != null) relevant.push(item.params.usageFactor);
  return relevant.some((field) => field?.origin === "reference") ? "estimated" : "custom";
}

function formulaFor(item: Item): string {
  const mult = item.scope === "perPerson" ? " × Pessoas × Quantidade" : " × Quantidade";
  switch (item.method) {
    case "power":
      return `Potência (W) ÷ 1.000 × Horas por uso × Utilizações no período${mult} × Fator de utilização (+ standby nas horas sem uso)`;
    case "cycle":
      return item.domain === "energy"
        ? `Consumo por ciclo (kWh) × Ciclos no período${mult}`
        : `Litros por ciclo × Ciclos no período${mult}`;
    case "daily":
      return "Consumo diário (kWh) × Dias de uso no período × Quantidade";
    case "monthly":
      return "Consumo mensal da etiqueta (kWh) × Dias simulados ÷ 30 × Quantidade";
    case "flow":
      return `Vazão (L/min) × Minutos por uso × Utilizações no período${mult}`;
    case "volume":
      return `Litros por uso × Utilizações no período${mult}`;
  }
}

/** Define um valor informado pelo usuário, sempre marcando a origem como "user". */
export function userField(value: number | null): Field {
  return { value, origin: "user" };
}

export function originLabel(origin: Origin | "calculated"): string {
  switch (origin) {
    case "user":
      return "Informado por você";
    case "reference":
      return "Valor de referência";
    case "default":
      return "Padrão";
    case "calculated":
      return "Calculado";
  }
}
