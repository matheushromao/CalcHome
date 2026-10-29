import type { ReactNode } from "react";
import type { Field } from "@/domain/types";

const ORIGIN_BADGE: Record<Field["origin"], { text: string; title: string }> = {
  reference: { text: "referência", title: "Valor de referência aproximado — não é uma medição real. Edite se souber o valor." },
  user: { text: "seu valor", title: "Informado por você" },
  default: { text: "padrão", title: "Valor padrão" },
};

interface Props {
  id: string;
  label: string;
  unit?: string;
  field?: Field;
  onChange: (value: number | null) => void;
  error?: string | null;
  hint?: string;
  min?: number;
  max?: number;
  step?: number | "any";
  /** Controle extra ao lado do campo (ex.: unidade ou período). */
  addon?: ReactNode;
}

export function parseNumber(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized === "") return null;
  const value = Number(normalized);
  return Number.isNaN(value) ? null : value;
}

export function FieldInput({ id, label, unit, field, onChange, error, hint, min = 0, max, step = "any", addon }: Props) {
  const badge = field && field.value !== null ? ORIGIN_BADGE[field.origin] : null;
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {badge && (
          <span className={`origin origin--${field!.origin}`} title={badge.title}>
            {badge.text}
          </span>
        )}
      </label>
      <div className="field__control">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={field?.value ?? ""}
          onChange={(event) => onChange(parseNumber(event.target.value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {unit && <span className="field__unit">{unit}</span>}
        {addon}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
