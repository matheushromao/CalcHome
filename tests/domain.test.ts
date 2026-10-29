import { calculateItem } from "@/domain/calculate";
import { usesInSimulation } from "@/domain/frequency";
import { createItem, setParam, type CatalogEntry } from "@/domain/items";
import { EMPTY_ENERGY_TARIFF, EMPTY_WATER_TARIFF, energyCost, waterCost } from "@/domain/tariffs";
import { domainTotals, householdSummary } from "@/domain/totals";
import type { Item } from "@/domain/types";

const settings = { days: 30 };

const shower: CatalogEntry = {
  id: "chuveiro",
  domain: "energy",
  name: "Chuveiro elétrico",
  icon: "🚿",
  category: "Banheiro",
  method: "power",
  period: "day",
  scope: "perPerson",
  durationUnit: "min",
  defaults: { powerW: 5500, duration: 10, uses: 1 },
};

const tap: CatalogEntry = {
  id: "banho",
  domain: "water",
  name: "Banho",
  icon: "🚿",
  category: "Banheiro",
  method: "flow",
  period: "day",
  scope: "perPerson",
  durationUnit: "min",
  defaults: { flowLpm: 9, duration: 20, uses: 1 },
};

const custom: CatalogEntry = {
  id: "personalizado",
  domain: "energy",
  name: "Equipamento personalizado",
  icon: "🔌",
  category: "Outros",
  method: "power",
  period: "day",
  scope: "household",
  durationUnit: "h",
  defaults: {},
};

function showerOf20Minutes(): Item {
  return setParam(createItem(shower, "s1"), "duration", 20);
}

describe("energia", () => {
  it("chuveiro de 5.500 W, 20 min/dia por 30 dias", () => {
    const r = calculateItem(showerOf20Minutes(), settings);
    expect(r.status).not.toBe("pending");
    expect(r.daily).toBeCloseTo(1.8333, 3);
    expect(r.monthly).toBeCloseTo(55, 6);
    expect(energyCost(r.monthly!, { ...EMPTY_ENERGY_TARIFF, rate: 0.9 })).toBeCloseTo(49.5, 6);
  });

  it("consumo por ciclo não aplica potência e tempo", () => {
    const item = createItem({ ...shower, method: "cycle", scope: "household", period: "week", defaults: { kWhPerCycle: 0.5, uses: 7, powerW: 9999 } }, "w");
    expect(calculateItem(item, settings).monthly).toBeCloseTo(0.5 * 30, 6);
  });

  it("consumo diário multiplica por dias de uso e quantidade", () => {
    const item = setParam(createItem({ ...custom, method: "daily", period: "week", defaults: { kWhPerDay: 1.2, uses: 7 } }, "g"), "quantity", 2);
    expect(calculateItem(item, settings).monthly).toBeCloseTo(1.2 * 30 * 2, 6);
  });

  it("fator de utilização e standby sem dupla contagem", () => {
    let item = createItem({ ...custom, defaults: { powerW: 100, duration: 6, uses: 1 } }, "tv");
    item = setParam(item, "usageFactor", 0.5);
    item = setParam(item, "standbyW", 1);
    const r = calculateItem(item, settings);
    // 0,1 kW × 6 h × 30 × 0,5 = 9 kWh; standby: 0,001 kW × 18 h × 30 = 0,54 kWh
    expect(r.monthly).toBeCloseTo(9.54, 6);
  });

  it("pessoas multiplicam apenas itens por pessoa", () => {
    const item = setParam(showerOf20Minutes(), "people", 3);
    expect(calculateItem(item, settings).monthly).toBeCloseTo(165, 6);
    const household = setParam({ ...showerOf20Minutes(), scope: "household" }, "people", 3);
    expect(calculateItem(household, settings).monthly).toBeCloseTo(55, 6);
  });
});

describe("água", () => {
  it("vazão de 9 L/min por 20 min/dia durante 30 dias", () => {
    const r = calculateItem(createItem(tap, "b"), settings);
    expect(r.daily).toBeCloseTo(180, 6);
    expect(r.monthly).toBeCloseTo(5400, 6);
    expect(r.monthly! / 1000).toBeCloseTo(5.4, 6);
  });

  it("máquina de lavar: litros por ciclo × ciclos", () => {
    const item = createItem({ ...tap, method: "cycle", scope: "household", period: "week", defaults: { litersPerCycle: 100, uses: 3 } }, "m");
    expect(calculateItem(item, settings).monthly).toBeCloseTo((100 * 3 * 30) / 7, 6);
  });

  it("custo de água com esgoto percentual e valor fixo", () => {
    const t = { ...EMPTY_WATER_TARIFF, rate: 5, sewerMode: "percent" as const, sewerValue: 80, fixed: 10 };
    expect(waterCost(10, t)).toBeCloseTo(50 + 40 + 10, 6);
    expect(waterCost(10, { ...t, sewerMode: "none" })).toBeCloseTo(60, 6);
  });
});

describe("frequência", () => {
  it("converte diária, semanal e mensal para o período simulado", () => {
    expect(usesInSimulation(1, "day", 30)).toBe(30);
    expect(usesInSimulation(7, "week", 28)).toBe(28);
    expect(usesInSimulation(4, "month", 30)).toBe(4);
  });
});

describe("sem tarifa", () => {
  it("calcula consumo físico e não inventa custo", () => {
    const totals = domainTotals("energy", [showerOf20Minutes()], settings, EMPTY_ENERGY_TARIFF);
    expect(totals.monthly).toBeCloseTo(55, 6);
    expect(totals.cost).toBeNull();
    expect(energyCost(55, EMPTY_ENERGY_TARIFF)).toBeNull();
    expect(waterCost(5.4, EMPTY_WATER_TARIFF)).toBeNull();
  });
});

describe("item pendente", () => {
  it("fica pendente e não entra no total como zero", () => {
    const pending = createItem(custom, "p");
    const r = calculateItem(pending, settings);
    expect(r.status).toBe("pending");
    expect(r.monthly).toBeNull();
    expect(r.issues.map((i) => i.field)).toEqual(["powerW", "duration", "uses"]);

    const totals = domainTotals("energy", [showerOf20Minutes(), pending], settings, { ...EMPTY_ENERGY_TARIFF, rate: 0.9 });
    expect(totals.calculated).toBe(1);
    expect(totals.pending).toBe(1);
    expect(totals.monthly).toBeCloseTo(55, 6);
    expect(totals.ranking).toHaveLength(1);

    const summary = householdSummary([showerOf20Minutes(), pending], settings, { ...EMPTY_ENERGY_TARIFF, rate: 0.9 }, EMPTY_WATER_TARIFF);
    expect(summary.costIsPartial).toBe(true);
  });
});

describe("estados", () => {
  it("estimado com referência, personalizado após editar os dados indispensáveis", () => {
    let item = createItem(shower, "x");
    expect(calculateItem(item, settings).status).toBe("estimated");
    item = setParam(item, "powerW", 5500);
    item = setParam(item, "duration", 20);
    item = setParam(item, "uses", 1);
    expect(calculateItem(item, settings).status).toBe("custom");
  });
});

describe("edição", () => {
  it("alterar um parâmetro atualiza o resultado e os totais", () => {
    const before = domainTotals("energy", [showerOf20Minutes()], settings, EMPTY_ENERGY_TARIFF);
    const after = domainTotals("energy", [setParam(showerOf20Minutes(), "powerW", 7500)], settings, EMPTY_ENERGY_TARIFF);
    expect(before.monthly).toBeCloseTo(55, 6);
    expect(after.monthly).toBeCloseTo(75, 6);
  });
});

describe("validação", () => {
  it("rejeita potência, vazão e tarifa negativas", () => {
    expect(calculateItem(setParam(showerOf20Minutes(), "powerW", -1), settings).status).toBe("pending");
    expect(calculateItem(setParam(createItem(tap, "t"), "flowLpm", -2), settings).status).toBe("pending");
    expect(energyCost(10, { ...EMPTY_ENERGY_TARIFF, rate: -0.5 })).toBeNull();
  });

  it("rejeita frequência impossível", () => {
    const item = setParam(createItem({ ...custom, defaults: { powerW: 10, duration: 5, uses: 6 } }, "f"), "uses", 6);
    const r = calculateItem(item, settings);
    expect(r.status).toBe("pending");
    expect(r.issues[0].message).toMatch(/impossível/);
    const days = createItem({ ...custom, method: "daily", period: "week", defaults: { kWhPerDay: 1, uses: 8 } }, "d");
    expect(calculateItem(days, settings).status).toBe("pending");
  });

  it("aceita zero quando faz sentido e explica quando bloqueia", () => {
    expect(calculateItem(setParam(showerOf20Minutes(), "uses", 0), settings).monthly).toBe(0);
    const zeroPower = calculateItem(setParam(showerOf20Minutes(), "powerW", 0), settings);
    expect(zeroPower.status).toBe("pending");
    expect(zeroPower.issues[0].message).toMatch(/zero impede/);
  });
});
