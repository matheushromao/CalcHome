import { calculateItem } from "./calculate";
import { energyCost, waterCost } from "./tariffs";
import type { Domain, EnergyTariff, Item, ItemResult, Settings, WaterTariff } from "./types";

export interface RankedItem {
  item: Item;
  result: ItemResult;
  monthly: number;
  /** Participação no total calculado (null quando o total é zero). */
  share: number | null;
}

export interface DomainTotals {
  domain: Domain;
  results: Map<string, ItemResult>;
  /** Soma apenas dos itens calculáveis. */
  monthly: number;
  daily: number;
  calculated: number;
  pending: number;
  ranking: RankedItem[];
  cost: number | null;
}

export function domainTotals(
  domain: Domain,
  items: Item[],
  settings: Settings,
  tariff: EnergyTariff | WaterTariff,
): DomainTotals {
  const results = new Map<string, ItemResult>();
  let monthly = 0;
  let calculated = 0;
  let pending = 0;
  const rows: { item: Item; result: ItemResult; monthly: number }[] = [];

  for (const item of items.filter((i) => i.domain === domain)) {
    const result = calculateItem(item, settings);
    results.set(item.id, result);
    if (result.monthly === null) {
      pending++;
      continue;
    }
    calculated++;
    monthly += result.monthly;
    rows.push({ item, result, monthly: result.monthly });
  }

  const ranking = rows
    .sort((a, b) => b.monthly - a.monthly)
    .map((row) => ({ ...row, share: monthly > 0 ? row.monthly / monthly : null }));

  const cost =
    calculated === 0
      ? null
      : domain === "energy"
        ? energyCost(monthly, tariff as EnergyTariff)
        : waterCost(monthly / 1000, tariff as WaterTariff);

  return { domain, results, monthly, daily: monthly / settings.days, calculated, pending, ranking, cost };
}

export interface HouseholdSummary {
  energy: DomainTotals;
  water: DomainTotals;
  /** Soma dos custos disponíveis; null se nenhum custo puder ser calculado. */
  costSum: number | null;
  /** true quando falta algum custo ou existem itens pendentes. */
  costIsPartial: boolean;
}

export function householdSummary(
  items: Item[],
  settings: Settings,
  energyTariff: EnergyTariff,
  waterTariff: WaterTariff,
): HouseholdSummary {
  const energy = domainTotals("energy", items, settings, energyTariff);
  const water = domainTotals("water", items, settings, waterTariff);
  const costs = [energy, water].filter((d) => d.calculated > 0);
  const available = costs.filter((d) => d.cost !== null);
  const costSum = available.length > 0 ? available.reduce((sum, d) => sum + (d.cost ?? 0), 0) : null;
  const costIsPartial =
    costSum !== null && (available.length < costs.length || energy.pending > 0 || water.pending > 0);
  return { energy, water, costSum, costIsPartial };
}
