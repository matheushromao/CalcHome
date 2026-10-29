import { useState } from "react";
import { originLabel } from "@/domain/calculate";
import { formatKWh, formatLiters, formatM3, formatQuantity } from "@/domain/format";
import type { CatalogEntry } from "@/domain/items";
import {
  DETAILED_PARAMS,
  DURATION_UNIT_LABEL,
  METHOD_LABEL,
  PARAM_META,
  PERIOD_LABEL,
  requiredParams,
  usesLabel,
} from "@/domain/params";
import type { Item, ItemResult, Method, ParamKey, Period } from "@/domain/types";
import { validateValue } from "@/domain/validation";
import type { Action, Mode } from "@/state/simulation";
import { FieldInput } from "./FieldInput";

const ENERGY_METHODS: Method[] = ["power", "cycle", "daily", "monthly"];
const WATER_METHODS: Method[] = ["flow", "volume", "cycle"];

export const STATUS_LABEL: Record<ItemResult["status"], string> = {
  estimated: "Estimado",
  custom: "Personalizado",
  pending: "Pendente",
};

const STATUS_ICON: Record<ItemResult["status"], string> = {
  estimated: "≈",
  custom: "✓",
  pending: "!",
};

interface Props {
  item: Item;
  result: ItemResult;
  entry?: CatalogEntry;
  mode: Mode;
  dispatch: (action: Action) => void;
  initiallyOpen?: boolean;
}

export function ItemCard({ item, result, entry, mode, dispatch, initiallyOpen = false }: Props) {
  const [open, setOpen] = useState(initiallyOpen);
  const detailed = mode === "detailed";
  const isEnergy = item.domain === "energy";
  const editorId = `editor-${item.id}`;

  const methods: Method[] = detailed
    ? isEnergy
      ? ENERGY_METHODS
      : WATER_METHODS
    : [entry?.method ?? item.method, ...(entry?.alternatives ?? [])];
  if (!methods.includes(item.method)) methods.unshift(item.method);

  const fieldError = (key: ParamKey) =>
    result.issues.find((issue) => issue.field === key)?.message ?? validateValue(key, item.params[key]?.value ?? null);
  const set = (key: ParamKey) => (value: number | null) => dispatch({ type: "setParam", id: item.id, key, value });
  const fid = (key: string) => `${item.id}-${key}`;

  const periodSelect = (
    <select
      aria-label="Período da frequência"
      value={item.period}
      onChange={(event) => dispatch({ type: "setPeriod", id: item.id, period: event.target.value as Period })}
    >
      {(Object.keys(PERIOD_LABEL) as Period[]).map((period) => (
        <option key={period} value={period}>
          {PERIOD_LABEL[period]}
        </option>
      ))}
    </select>
  );

  const durationUnitSelect = (
    <select
      aria-label="Unidade do tempo"
      value={item.durationUnit}
      onChange={(event) =>
        dispatch({ type: "setDurationUnit", id: item.id, unit: event.target.value as Item["durationUnit"] })
      }
    >
      <option value="min">{DURATION_UNIT_LABEL.min}</option>
      <option value="h">{DURATION_UNIT_LABEL.h}</option>
    </select>
  );

  const renderField = (key: ParamKey) => {
    const meta = PARAM_META[key];
    if (key === "duration")
      return (
        <FieldInput key={key} id={fid(key)} label={meta.label} field={item.params[key]} onChange={set(key)} error={fieldError(key)} addon={durationUnitSelect} />
      );
    if (key === "uses")
      return (
        <FieldInput
          key={key}
          id={fid(key)}
          label={usesLabel(item.method)}
          unit={item.method === "daily" ? "dias" : "vezes"}
          field={item.params[key]}
          onChange={set(key)}
          error={fieldError(key)}
          addon={periodSelect}
          hint={item.scope === "perPerson" ? "Por pessoa." : undefined}
        />
      );
    return (
      <FieldInput
        key={key}
        id={fid(key)}
        label={meta.label}
        unit={meta.unit}
        field={item.params[key]}
        onChange={set(key)}
        error={fieldError(key)}
        max={meta.max}
        step={meta.step ?? "any"}
      />
    );
  };

  const required = requiredParams(item.domain, item.method);
  const multipliers: ParamKey[] = item.method === "monthly" || item.method === "daily" ? ["quantity"] : item.scope === "perPerson" ? ["people", "quantity"] : ["quantity"];
  const extra = detailed ? DETAILED_PARAMS[item.method] ?? [] : [];
  const lowPrecision = entry?.lowPrecision?.includes(item.method);
  const unitLabel = isEnergy ? formatKWh : formatLiters;

  return (
    <article className={`item-card item-card--${result.status}`} aria-label={item.name}>
      <header className="item-card__header">
        <span className="item-card__icon" aria-hidden="true">
          {item.icon}
        </span>
        <div className="item-card__title">
          <h3>{item.name}</h3>
          <span className={`status status--${result.status}`}>
            <span aria-hidden="true">{STATUS_ICON[result.status]}</span> {STATUS_LABEL[result.status]}
          </span>
        </div>
        <div className="item-card__value" aria-live="polite">
          {result.monthly !== null ? (
            <>
              <strong>{unitLabel(result.monthly)}</strong>
              <span>por mês{result.status === "estimated" ? " (estimativa)" : ""}</span>
            </>
          ) : (
            <span className="muted">Dados insuficientes</span>
          )}
        </div>
      </header>

      {result.status === "pending" && (
        <ul className="item-card__issues">
          {result.issues.map((issue, index) => (
            <li key={index}>{issue.message}</li>
          ))}
        </ul>
      )}

      <div className="item-card__actions">
        <button type="button" className="btn btn--ghost" aria-expanded={open} aria-controls={editorId} onClick={() => setOpen(!open)}>
          {open ? "Fechar edição" : "Editar"}
        </button>
        <button type="button" className="btn btn--ghost btn--danger" onClick={() => dispatch({ type: "removeItem", id: item.id })}>
          Remover
        </button>
      </div>

      {open && (
        <div id={editorId} className="item-card__editor">
          {entry?.hint && <p className="hint">{entry.hint}</p>}

          {detailed && (
            <div className="field">
              <label htmlFor={fid("name")} className="field__label">
                Nome
              </label>
              <input id={fid("name")} type="text" value={item.name} onChange={(event) => dispatch({ type: "rename", id: item.id, name: event.target.value })} />
            </div>
          )}

          {methods.length > 1 && (
            <div className="field">
              <label htmlFor={fid("method")} className="field__label">
                Como calcular
              </label>
              <select
                id={fid("method")}
                value={item.method}
                onChange={(event) => dispatch({ type: "setMethod", id: item.id, method: event.target.value as Method, entry })}
              >
                {[...new Set(methods)].map((method) => (
                  <option key={method} value={method}>
                    {METHOD_LABEL[method]}
                    {entry?.lowPrecision?.includes(method) ? " (baixa precisão)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {lowPrecision && (
            <p className="warning">Estimativa de baixa precisão. Se possível, use o consumo informado pelo fabricante.</p>
          )}

          <div className="field-grid">
            {required.map(renderField)}
            {multipliers.map(renderField)}
            {extra.map(renderField)}
          </div>

          {detailed && item.method !== "daily" && item.method !== "monthly" && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={item.scope === "perPerson"}
                onChange={(event) =>
                  dispatch({ type: "setScope", id: item.id, scope: event.target.checked ? "perPerson" : "household" })
                }
              />
              Frequência informada por pessoa (multiplica pelo número de pessoas)
            </label>
          )}

          <CalculationDetails item={item} result={result} />
        </div>
      )}
    </article>
  );
}

function CalculationDetails({ item, result }: { item: Item; result: ItemResult }) {
  if (result.monthly === null) return null;
  return (
    <details className="calc-details">
      <summary>Ver cálculo</summary>
      <ul>
        {result.steps.map((step, index) => (
          <li key={index}>
            <span>{step.label}:</span> <strong>{formatQuantity(step.value)} {step.unit}</strong>{" "}
            <span className={`origin origin--${step.origin}`}>{originLabel(step.origin)}</span>
          </li>
        ))}
      </ul>
      <p className="formula">
        <span>Fórmula:</span> {result.formula}
      </p>
      <p>
        Resultado: <strong>{item.domain === "energy" ? formatKWh(result.monthly) : `${formatLiters(result.monthly)} (${formatM3(result.monthly / 1000)})`}</strong>{" "}
        no período · {item.domain === "energy" ? formatKWh(result.daily!) : formatLiters(result.daily!)} por dia
      </p>
    </details>
  );
}
