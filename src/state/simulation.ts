import { createItem, setParam, type CatalogEntry } from "@/domain/items";
import { EMPTY_ENERGY_TARIFF, EMPTY_WATER_TARIFF } from "@/domain/tariffs";
import type {
  DurationUnit,
  EnergyTariff,
  Item,
  Method,
  ParamKey,
  Period,
  Scope,
  WaterTariff,
} from "@/domain/types";

export type Mode = "simple" | "detailed";

export interface SimulationState {
  mode: Mode;
  days: number;
  items: Item[];
  energyTariff: EnergyTariff;
  waterTariff: WaterTariff;
  /** Salvar a simulação no armazenamento local do navegador. */
  persist: boolean;
}

export const INITIAL_STATE: SimulationState = {
  mode: "simple",
  days: 30,
  items: [],
  energyTariff: EMPTY_ENERGY_TARIFF,
  waterTariff: EMPTY_WATER_TARIFF,
  persist: true,
};

export type Action =
  | { type: "setMode"; mode: Mode }
  | { type: "setDays"; days: number }
  | { type: "addItem"; entry: CatalogEntry; id?: string }
  | { type: "removeItem"; id: string }
  | { type: "setParam"; id: string; key: ParamKey; value: number | null }
  | { type: "setMethod"; id: string; method: Method; entry?: CatalogEntry }
  | { type: "setPeriod"; id: string; period: Period }
  | { type: "setScope"; id: string; scope: Scope }
  | { type: "setDurationUnit"; id: string; unit: DurationUnit }
  | { type: "rename"; id: string; name: string }
  | { type: "setEnergyTariff"; tariff: Partial<EnergyTariff> }
  | { type: "setWaterTariff"; tariff: Partial<WaterTariff> }
  | { type: "setPersist"; persist: boolean }
  | { type: "hydrate"; state: SimulationState }
  | { type: "reset" };

function updateItem(state: SimulationState, id: string, fn: (item: Item) => Item): SimulationState {
  return { ...state, items: state.items.map((item) => (item.id === id ? fn(item) : item)) };
}

export function reducer(state: SimulationState, action: Action): SimulationState {
  switch (action.type) {
    case "setMode":
      // Os dois modos editam o mesmo estado: alternar nunca descarta valores.
      return { ...state, mode: action.mode };
    case "setDays":
      return { ...state, days: action.days };
    case "addItem":
      return { ...state, items: [...state.items, createItem(action.entry, action.id)] };
    case "removeItem":
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case "setParam":
      return updateItem(state, action.id, (item) => setParam(item, action.key, action.value));
    case "setMethod":
      return updateItem(state, action.id, (item) => {
        // Preenche referências do novo método apenas em campos ainda vazios; valores do usuário são mantidos.
        const params = { ...item.params };
        for (const [key, value] of Object.entries(action.entry?.defaults ?? {}) as [ParamKey, number][]) {
          if (params[key]?.value == null) params[key] = { value, origin: "reference" };
        }
        return { ...item, method: action.method, params };
      });
    case "setPeriod":
      return updateItem(state, action.id, (item) => ({ ...item, period: action.period }));
    case "setScope":
      return updateItem(state, action.id, (item) => ({
        ...item,
        scope: action.scope,
        params: {
          ...item.params,
          people: item.params.people ?? { value: 1, origin: "default" },
        },
      }));
    case "setDurationUnit":
      return updateItem(state, action.id, (item) => ({ ...item, durationUnit: action.unit }));
    case "rename":
      return updateItem(state, action.id, (item) => ({ ...item, name: action.name }));
    case "setEnergyTariff":
      return { ...state, energyTariff: { ...state.energyTariff, ...action.tariff } };
    case "setWaterTariff":
      return { ...state, waterTariff: { ...state.waterTariff, ...action.tariff } };
    case "setPersist":
      return { ...state, persist: action.persist };
    case "hydrate":
      return action.state;
    case "reset":
      return { ...INITIAL_STATE, persist: state.persist };
  }
}

const STORAGE_KEY = "consumo-em-casa:v1";

export function loadState(): SimulationState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SimulationState>;
    if (!Array.isArray(parsed.items)) return null;
    return { ...INITIAL_STATE, ...parsed };
  } catch {
    return null;
  }
}

export function saveState(state: SimulationState) {
  try {
    if (state.persist) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sem armazenamento disponível: a aplicação continua funcionando sem persistência.
  }
}

export function clearStorage() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorado
  }
}
