import type { DurationUnit, Field, Item, Method, ParamKey, Params, Period, Scope } from "./types";
import type { Domain } from "./types";

/** Entrada do catálogo de referência (aparelho ou atividade). */
export interface CatalogEntry {
  id: string;
  domain: Domain;
  name: string;
  icon: string;
  category: string;
  method: Method;
  /** Métodos alternativos oferecidos ao usuário (ex.: etiqueta do fabricante). */
  alternatives?: Method[];
  period: Period;
  scope: Scope;
  durationUnit: DurationUnit;
  /** Valores de referência aproximados. Campos ausentes ficam em branco (sem inventar dados). */
  defaults: Partial<Record<ParamKey, number>>;
  /** Métodos cuja estimativa é de baixa precisão. */
  lowPrecision?: Method[];
  hint?: string;
}

let counter = 0;
function newId() {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}`;
}

/** Cria um item a partir do catálogo, preenchendo valores de referência identificados como tal. */
export function createItem(entry: CatalogEntry, id = newId()): Item {
  const params: Params = {};
  for (const [key, value] of Object.entries(entry.defaults) as [ParamKey, number][]) {
    params[key] = { value, origin: "reference" };
  }
  params.quantity = { value: 1, origin: "default" };
  if (entry.scope === "perPerson") params.people = { value: 1, origin: "default" };
  return {
    id,
    domain: entry.domain,
    catalogId: entry.id,
    name: entry.name,
    icon: entry.icon,
    category: entry.category,
    method: entry.method,
    period: entry.period,
    scope: entry.scope,
    durationUnit: entry.durationUnit,
    params,
  };
}

export function setParam(item: Item, key: ParamKey, value: number | null): Item {
  const field: Field = { value, origin: "user" };
  return { ...item, params: { ...item.params, [key]: field } };
}
