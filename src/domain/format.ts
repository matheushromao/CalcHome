const nf = (digits: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: digits });

/** Arredonda conforme a magnitude, evitando precisão que não existe. */
export function formatQuantity(value: number): string {
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 100) return nf(0).format(value);
  if (abs >= 10) return nf(1).format(value);
  if (abs >= 1) return nf(2).format(value);
  return nf(3).format(value);
}

export function formatKWh(value: number): string {
  return `${formatQuantity(value)} kWh`;
}

export function formatLiters(value: number): string {
  return `${formatQuantity(value)} L`;
}

export function formatM3(value: number): string {
  return `${formatQuantity(value)} m³`;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatMoney(value: number): string {
  return brl.format(value);
}

export function formatPercent(share: number): string {
  return `${nf(share < 0.1 ? 1 : 0).format(share * 100)}%`;
}
