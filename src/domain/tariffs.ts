import type { EnergyTariff, WaterTariff } from "./types";
import { validateMoney } from "./validation";

export const EMPTY_ENERGY_TARIFF: EnergyTariff = { rate: null, extraPerKWh: null, fixed: null };
export const EMPTY_WATER_TARIFF: WaterTariff = {
  rate: null,
  extraPerM3: null,
  sewerMode: "none",
  sewerValue: null,
  fixed: null,
};

export function energyTariffErrors(t: EnergyTariff): string[] {
  return [
    validateMoney("Tarifa de energia", t.rate),
    validateMoney("Valor adicional por kWh", t.extraPerKWh),
    validateMoney("Valor fixo mensal", t.fixed),
  ].filter((e): e is string => e !== null);
}

export function waterTariffErrors(t: WaterTariff): string[] {
  return [
    validateMoney("Tarifa de água", t.rate),
    validateMoney("Custo adicional por m³", t.extraPerM3),
    validateMoney("Esgoto", t.sewerValue),
    validateMoney("Valor fixo mensal", t.fixed),
  ].filter((e): e is string => e !== null);
}

/**
 * Custo de energia: kWh × (tarifa + adicional por kWh) + valor fixo.
 * Retorna null quando a tarifa não foi informada ou é inválida — nunca um custo inventado.
 */
export function energyCost(kWh: number, t: EnergyTariff): number | null {
  if (t.rate === null || energyTariffErrors(t).length > 0) return null;
  return kWh * (t.rate + (t.extraPerKWh ?? 0)) + (t.fixed ?? 0);
}

/**
 * Custo de água: m³ × (tarifa + adicional por m³) + esgoto + valor fixo.
 * O esgoto só entra quando o usuário escolhe a regra (R$/m³ ou % sobre o valor da água).
 */
export function waterCost(m3: number, t: WaterTariff): number | null {
  if (t.rate === null || waterTariffErrors(t).length > 0) return null;
  const water = m3 * (t.rate + (t.extraPerM3 ?? 0));
  let sewer = 0;
  if (t.sewerMode === "perM3") sewer = m3 * (t.sewerValue ?? 0);
  if (t.sewerMode === "percent") sewer = water * ((t.sewerValue ?? 0) / 100);
  return water + sewer + (t.fixed ?? 0);
}
