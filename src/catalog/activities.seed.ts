import type { CatalogEntry } from "@/domain/items";

type Entry = Omit<CatalogEntry, "domain" | "scope" | "durationUnit" | "period"> &
  Partial<Pick<CatalogEntry, "scope" | "durationUnit" | "period">>;

const a = (entry: Entry): CatalogEntry => ({
  domain: "water",
  scope: "household",
  durationUnit: "min",
  period: "day",
  ...entry,
});

/** Valores de referência aproximados — não são medições reais e podem ser editados. */
export const ACTIVITIES: CatalogEntry[] = [
  // Banheiro
  a({ id: "banho", name: "Banho", icon: "🚿", category: "Banheiro", method: "flow", scope: "perPerson", hint: "A frequência é por pessoa. Chuveiros elétricos costumam ter vazão menor que os a gás.", defaults: { flowLpm: 6, duration: 10, uses: 1 } }),
  a({ id: "descarga", name: "Descarga sanitária", icon: "🚽", category: "Banheiro", method: "volume", scope: "perPerson", hint: "Caixas acopladas modernas usam cerca de 6 L; válvulas antigas podem gastar bem mais.", defaults: { litersPerUse: 6, uses: 4 } }),
  a({ id: "torneira-banheiro", name: "Torneira da pia", icon: "🚰", category: "Banheiro", method: "flow", scope: "perPerson", defaults: { flowLpm: 6, duration: 2, uses: 3 } }),

  // Cozinha
  a({ id: "louca", name: "Lavagem de louça", icon: "🍽️", category: "Cozinha", method: "flow", defaults: { flowLpm: 6, duration: 15, uses: 2 } }),
  a({ id: "torneira-cozinha", name: "Torneira da cozinha", icon: "🚰", category: "Cozinha", method: "flow", defaults: { flowLpm: 6, duration: 5, uses: 3 } }),
  a({ id: "alimentos", name: "Preparação de alimentos", icon: "🥕", category: "Cozinha", method: "volume", defaults: { litersPerUse: 10, uses: 1 } }),

  // Lavanderia
  a({ id: "maquina-lavar-agua", name: "Máquina de lavar", icon: "🧺", category: "Lavanderia", method: "cycle", period: "week", hint: "Litros por ciclo constam no manual ou na etiqueta da máquina.", defaults: { litersPerCycle: 100, uses: 3 } }),
  a({ id: "roupa-manual", name: "Lavagem manual de roupas", icon: "🫧", category: "Lavanderia", method: "volume", period: "week", defaults: { litersPerUse: 60, uses: 1 } }),

  // Limpeza
  a({ id: "pisos", name: "Limpeza de pisos", icon: "🧽", category: "Limpeza", method: "volume", period: "week", hint: "Um balde comum tem cerca de 10 L.", defaults: { litersPerUse: 20, uses: 2 } }),
  a({ id: "area-externa", name: "Lavagem de áreas externas", icon: "🏡", category: "Limpeza", method: "flow", period: "week", alternatives: ["volume"], hint: "Mangueira gasta muito mais que balde e vassoura.", defaults: { flowLpm: 12, duration: 20, uses: 1 } }),
  a({ id: "veiculo", name: "Lavagem de veículos", icon: "🚗", category: "Limpeza", method: "flow", period: "month", alternatives: ["volume"], defaults: { flowLpm: 12, duration: 30, uses: 2 } }),

  // Jardim
  a({ id: "irrigacao", name: "Irrigação", icon: "🌱", category: "Jardim", method: "flow", period: "week", defaults: { flowLpm: 12, duration: 15, uses: 3 } }),
  a({ id: "plantas", name: "Rega de plantas", icon: "🪴", category: "Jardim", method: "volume", period: "week", defaults: { litersPerUse: 10, uses: 3 } }),

  // Outros
  a({ id: "atividade-personalizada", name: "Atividade personalizada", icon: "💧", category: "Outros", method: "volume", alternatives: ["flow", "cycle"], hint: "Sem valores de referência: informe o volume por uso ou a vazão e a duração.", defaults: {} }),
];
