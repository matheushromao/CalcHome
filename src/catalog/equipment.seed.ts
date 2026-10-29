import type { CatalogEntry } from "@/domain/items";

type Entry = Omit<CatalogEntry, "domain" | "scope" | "durationUnit" | "period"> &
  Partial<Pick<CatalogEntry, "scope" | "durationUnit" | "period">>;

const e = (entry: Entry): CatalogEntry => ({
  domain: "energy",
  scope: "household",
  durationUnit: "h",
  period: "day",
  ...entry,
});

const FRIDGE_HINT =
  "Prefira o consumo da etiqueta do fabricante (kWh/mês). A estimativa por potência é de baixa precisão, pois o compressor liga e desliga.";
const LAMP_HINT = "Use Quantidade para o número de lâmpadas iguais.";

/** Valores de referência aproximados — não são medições reais e podem ser editados. */
export const EQUIPMENT: CatalogEntry[] = [
  // Cozinha
  e({ id: "geladeira", name: "Geladeira", icon: "🧊", category: "Cozinha", method: "monthly", alternatives: ["daily", "power"], lowPrecision: ["power"], hint: FRIDGE_HINT, defaults: { kWhPerMonth: 35, kWhPerDay: 1.2, powerW: 150, duration: 24, uses: 1, usageFactor: 0.35 } }),
  e({ id: "freezer", name: "Freezer", icon: "❄️", category: "Cozinha", method: "monthly", alternatives: ["daily", "power"], lowPrecision: ["power"], hint: FRIDGE_HINT, defaults: { kWhPerMonth: 45, kWhPerDay: 1.5, powerW: 200, duration: 24, uses: 1, usageFactor: 0.4 } }),
  e({ id: "micro-ondas", name: "Micro-ondas", icon: "📡", category: "Cozinha", method: "power", durationUnit: "min", defaults: { powerW: 1200, duration: 10, uses: 2 } }),
  e({ id: "forno-eletrico", name: "Forno elétrico", icon: "🍞", category: "Cozinha", method: "power", durationUnit: "min", period: "week", defaults: { powerW: 1750, duration: 30, uses: 3 } }),
  e({ id: "air-fryer", name: "Air fryer", icon: "🍟", category: "Cozinha", method: "power", durationUnit: "min", defaults: { powerW: 1500, duration: 20, uses: 1 } }),
  e({ id: "fogao-inducao", name: "Fogão de indução", icon: "🍳", category: "Cozinha", method: "power", durationUnit: "min", hint: "A potência varia conforme a intensidade usada; o valor sugerido é uma média por boca.", defaults: { powerW: 1500, duration: 40, uses: 2 } }),
  e({ id: "liquidificador", name: "Liquidificador", icon: "🥤", category: "Cozinha", method: "power", durationUnit: "min", defaults: { powerW: 600, duration: 5, uses: 1 } }),
  e({ id: "cafeteira", name: "Cafeteira", icon: "☕", category: "Cozinha", method: "power", durationUnit: "min", defaults: { powerW: 800, duration: 10, uses: 1 } }),
  e({ id: "lava-loucas", name: "Lava-louças", icon: "🍽️", category: "Cozinha", method: "cycle", period: "week", defaults: { kWhPerCycle: 1, uses: 5 } }),

  // Climatização
  e({ id: "ar-condicionado", name: "Ar-condicionado", icon: "🌬️", category: "Climatização", method: "power", alternatives: ["monthly"], hint: "Use a potência elétrica média, não a nominal: aparelhos inverter não operam o tempo todo na potência máxima. Se souber o consumo da etiqueta (kWh/mês), prefira-o.", defaults: { powerW: 900, duration: 8, uses: 1 } }),
  e({ id: "ventilador", name: "Ventilador", icon: "🌀", category: "Climatização", method: "power", defaults: { powerW: 100, duration: 8, uses: 1 } }),
  e({ id: "climatizador", name: "Climatizador", icon: "💨", category: "Climatização", method: "power", defaults: { powerW: 150, duration: 6, uses: 1 } }),
  e({ id: "aquecedor", name: "Aquecedor elétrico", icon: "🔥", category: "Climatização", method: "power", defaults: { powerW: 1500, duration: 4, uses: 1 } }),

  // Entretenimento e informática
  e({ id: "televisao", name: "Televisão", icon: "📺", category: "Entretenimento e informática", method: "power", defaults: { powerW: 100, duration: 5, uses: 1 } }),
  e({ id: "desktop", name: "Computador desktop", icon: "🖥️", category: "Entretenimento e informática", method: "power", defaults: { powerW: 200, duration: 4, uses: 1 } }),
  e({ id: "notebook", name: "Notebook", icon: "💻", category: "Entretenimento e informática", method: "power", defaults: { powerW: 50, duration: 6, uses: 1 } }),
  e({ id: "monitor", name: "Monitor", icon: "🖥️", category: "Entretenimento e informática", method: "power", defaults: { powerW: 25, duration: 6, uses: 1 } }),
  e({ id: "videogame", name: "Videogame", icon: "🎮", category: "Entretenimento e informática", method: "power", defaults: { powerW: 150, duration: 2, uses: 1 } }),
  e({ id: "roteador", name: "Roteador Wi-Fi", icon: "📶", category: "Entretenimento e informática", method: "power", defaults: { powerW: 10, duration: 24, uses: 1 } }),
  e({ id: "impressora", name: "Impressora", icon: "🖨️", category: "Entretenimento e informática", method: "power", durationUnit: "min", period: "week", defaults: { powerW: 300, duration: 5, uses: 3 } }),

  // Lavanderia e limpeza
  e({ id: "maquina-lavar", name: "Máquina de lavar roupas", icon: "🧺", category: "Lavanderia e limpeza", method: "cycle", period: "week", hint: "O consumo por ciclo consta na etiqueta ou no manual. Ciclos com água quente gastam bem mais.", defaults: { kWhPerCycle: 0.3, uses: 3 } }),
  e({ id: "secadora", name: "Secadora", icon: "🌡️", category: "Lavanderia e limpeza", method: "cycle", period: "week", defaults: { kWhPerCycle: 3, uses: 2 } }),
  e({ id: "ferro", name: "Ferro de passar", icon: "👕", category: "Lavanderia e limpeza", method: "power", durationUnit: "min", period: "week", defaults: { powerW: 1000, duration: 30, uses: 2 } }),
  e({ id: "aspirador", name: "Aspirador de pó", icon: "🧹", category: "Lavanderia e limpeza", method: "power", durationUnit: "min", period: "week", defaults: { powerW: 1000, duration: 30, uses: 2 } }),

  // Banheiro
  e({ id: "chuveiro", name: "Chuveiro elétrico", icon: "🚿", category: "Banheiro", method: "power", durationUnit: "min", scope: "perPerson", hint: "A frequência é por pessoa. Informe quantas pessoas tomam banho.", defaults: { powerW: 5500, duration: 10, uses: 1 } }),
  e({ id: "secador", name: "Secador de cabelo", icon: "💇", category: "Banheiro", method: "power", durationUnit: "min", defaults: { powerW: 1200, duration: 10, uses: 1 } }),
  e({ id: "chapinha", name: "Chapinha", icon: "✨", category: "Banheiro", method: "power", durationUnit: "min", period: "week", defaults: { powerW: 50, duration: 20, uses: 3 } }),

  // Iluminação
  e({ id: "lampada-led", name: "Lâmpadas LED", icon: "💡", category: "Iluminação", method: "power", hint: LAMP_HINT, defaults: { powerW: 9, duration: 5, uses: 1 } }),
  e({ id: "lampada-fluorescente", name: "Lâmpadas fluorescentes", icon: "💡", category: "Iluminação", method: "power", hint: LAMP_HINT, defaults: { powerW: 15, duration: 5, uses: 1 } }),
  e({ id: "lampada-incandescente", name: "Lâmpadas incandescentes", icon: "💡", category: "Iluminação", method: "power", hint: LAMP_HINT, defaults: { powerW: 60, duration: 5, uses: 1 } }),

  // Outros
  e({ id: "equipamento-personalizado", name: "Equipamento personalizado", icon: "🔌", category: "Outros", method: "power", alternatives: ["cycle", "daily", "monthly"], hint: "Sem valores de referência: informe a potência (na etiqueta ou no manual) e o tempo de uso.", defaults: {} }),
];
