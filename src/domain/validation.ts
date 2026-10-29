import { PARAM_META } from "./params";
import type { Field, Issue, ParamKey } from "./types";

/** Valida um valor numérico isolado. Retorna a mensagem de erro, se houver. */
export function validateValue(key: ParamKey, value: number | null): string | null {
  if (value === null) return null;
  const meta = PARAM_META[key];
  if (!Number.isFinite(value)) return `${meta.label}: informe um número válido.`;
  if (value < meta.min) return `${meta.label} não pode ser negativo(a).`;
  if (meta.max !== undefined && value > meta.max)
    return `${meta.label} deve ser no máximo ${meta.max}.`;
  return null;
}

/**
 * Verifica um campo indispensável. Ausente ou com zero que bloqueia o cálculo
 * geram um aviso explicando o que falta e por quê.
 */
export function checkRequired(key: ParamKey, field: Field | undefined, unit?: string): Issue | null {
  const meta = { ...PARAM_META[key], ...(unit ? { unit } : {}) };
  const value = field?.value ?? null;
  if (value === null) return { field: key, message: `Falta ${meta.label.toLowerCase()} (${meta.unit}). ${meta.why}` };
  const invalid = validateValue(key, value);
  if (invalid) return { field: key, message: invalid };
  if (value === 0 && meta.zeroBlocks)
    return { field: key, message: `${meta.label} igual a zero impede o cálculo. ${meta.why}` };
  return null;
}

/** Valida tarifas e valores monetários: opcionais, mas nunca negativos. */
export function validateMoney(label: string, value: number | null): string | null {
  if (value === null) return null;
  if (!Number.isFinite(value)) return `${label}: informe um número válido.`;
  if (value < 0) return `${label} não pode ser negativo(a).`;
  return null;
}

export function validateDays(days: number): string | null {
  if (!Number.isInteger(days) || days < 1 || days > 31) return "O período deve ter entre 1 e 31 dias.";
  return null;
}
