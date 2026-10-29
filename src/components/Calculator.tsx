"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ENERGY_CATEGORIES, WATER_CATEGORIES } from "@/catalog";
import { formatKWh, formatLiters, formatM3, formatMoney } from "@/domain/format";
import type { CatalogEntry } from "@/domain/items";
import { householdSummary } from "@/domain/totals";
import type { Domain } from "@/domain/types";
import { validateDays } from "@/domain/validation";
import { INITIAL_STATE, clearStorage, loadState, reducer, saveState, type SimulationState } from "@/state/simulation";
import { FieldInput } from "./FieldInput";
import { ItemCard } from "./ItemCard";
import { Library } from "./Library";
import { ResultsPanel } from "./ResultsPanel";
import { EnergyTariffSettings, WaterTariffSettings } from "./TariffSettings";

interface Props {
  catalog: CatalogEntry[];
  initialState?: SimulationState;
  /** Desativa o localStorage (usado nos testes). */
  storage?: boolean;
}

export function Calculator({ catalog, initialState = INITIAL_STATE, storage = true }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tab, setTab] = useState<Domain>("energy");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [daysDraft, setDaysDraft] = useState<number | null>(initialState.days);
  const hydrated = useRef(!storage);

  useEffect(() => {
    if (!storage) return;
    const saved = loadState();
    if (saved) {
      dispatch({ type: "hydrate", state: saved });
      setDaysDraft(saved.days);
    }
    hydrated.current = true;
  }, [storage]);

  useEffect(() => {
    if (storage && hydrated.current) saveState(state);
  }, [state, storage]);

  const entries = useMemo(() => new Map(catalog.map((entry) => [entry.id, entry])), [catalog]);
  const settings = { days: state.days };
  const summary = useMemo(
    () => householdSummary(state.items, { days: state.days }, state.energyTariff, state.waterTariff),
    [state.items, state.days, state.energyTariff, state.waterTariff],
  );

  const closeLibrary = useCallback(() => setLibraryOpen(false), []);
  const addEntry = (entry: CatalogEntry) => {
    const id = `${entry.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    dispatch({ type: "addItem", entry, id });
    setJustAdded(id);
    setLibraryOpen(false);
  };

  const domainItems = state.items.filter((item) => item.domain === tab);
  const totals = tab === "energy" ? summary.energy : summary.water;
  const daysError = daysDraft === null ? "Informe o número de dias." : validateDays(daysDraft);
  const detailed = state.mode === "detailed";

  const missing: string[] = [];
  const pendingCount = summary.energy.pending + summary.water.pending;
  if (state.items.length === 0) missing.push("Adicione pelo menos um aparelho ou atividade.");
  if (pendingCount > 0) missing.push(`${pendingCount} ${pendingCount === 1 ? "item pendente precisa" : "itens pendentes precisam"} de dados.`);
  const estimatedCount = state.items.filter((item) => summary.energy.results.get(item.id)?.status === "estimated" || summary.water.results.get(item.id)?.status === "estimated").length;
  if (estimatedCount > 0) missing.push(`${estimatedCount} ${estimatedCount === 1 ? "item usa" : "itens usam"} valores de referência — informe os dados reais para mais precisão.`);
  if (summary.energy.calculated > 0 && state.energyTariff.rate === null) missing.push("Tarifa de energia não informada (custo não calculado).");
  if (summary.water.calculated > 0 && state.waterTariff.rate === null) missing.push("Tarifa de água não informada (custo não calculado).");
  const totalItems = state.items.length;
  const calculatedItems = summary.energy.calculated + summary.water.calculated;

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>
            <span aria-hidden="true">🏠</span> Consumo em Casa
          </h1>
          <p className="muted">
            Estime o consumo de energia elétrica e de água da sua casa. Comece com valores de referência e ajuste o que souber.
          </p>
        </div>
        <div className="mode-toggle" role="group" aria-label="Modo de cálculo">
          <button type="button" aria-pressed={!detailed} onClick={() => dispatch({ type: "setMode", mode: "simple" })}>
            Modo simples
          </button>
          <button type="button" aria-pressed={detailed} onClick={() => dispatch({ type: "setMode", mode: "detailed" })}>
            Modo detalhado
          </button>
        </div>
      </header>

      <section className="summary card" aria-labelledby="summary-title">
        <h2 id="summary-title">Resumo da casa</h2>
        <div className="summary__grid">
          <div className="summary__item summary__item--energy">
            <span className="summary__label">⚡ Energia por mês</span>
            <strong>{summary.energy.calculated > 0 ? formatKWh(summary.energy.monthly) : "—"}</strong>
            <span className="muted">
              {summary.energy.cost !== null ? `${formatMoney(summary.energy.cost)} estimados` : summary.energy.calculated > 0 ? "Custo: informe a tarifa" : "Sem itens calculados"}
            </span>
          </div>
          <div className="summary__item summary__item--water">
            <span className="summary__label">💧 Água por mês</span>
            <strong>
              {summary.water.calculated > 0 ? `${formatLiters(summary.water.monthly)} · ${formatM3(summary.water.monthly / 1000)}` : "—"}
            </strong>
            <span className="muted">
              {summary.water.cost !== null ? `${formatMoney(summary.water.cost)} estimados` : summary.water.calculated > 0 ? "Custo: informe a tarifa" : "Sem itens calculados"}
            </span>
          </div>
          <div className="summary__item">
            <span className="summary__label">Custos disponíveis</span>
            <strong>{summary.costSum !== null ? formatMoney(summary.costSum) : "—"}</strong>
            <span className="muted">
              {summary.costSum === null ? "Informe as tarifas para estimar custos" : summary.costIsPartial ? "Soma parcial: falta custo ou há itens pendentes" : "Estimativa mensal"}
            </span>
          </div>
        </div>
        <div className="progress" aria-label="Preenchimento da simulação">
          <div className="progress__head">
            <span>
              {calculatedItems} de {totalItems} {totalItems === 1 ? "item calculado" : "itens calculados"}
            </span>
          </div>
          <div className="bar" aria-hidden="true">
            <div className="bar__fill" style={{ width: `${totalItems ? (calculatedItems / totalItems) * 100 : 0}%` }} />
          </div>
          {missing.length > 0 && (
            <ul className="progress__list">
              {missing.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="tabs" role="tablist" aria-label="O que calcular">
        <button type="button" role="tab" id="tab-energy" aria-selected={tab === "energy"} aria-controls="panel" className="tab tab--energy" onClick={() => setTab("energy")}>
          ⚡ Energia elétrica
        </button>
        <button type="button" role="tab" id="tab-water" aria-selected={tab === "water"} aria-controls="panel" className="tab tab--water" onClick={() => setTab("water")}>
          💧 Água
        </button>
      </div>

      <div id="panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className={`panel panel--${tab}`}>
        <div className="panel__main">
          <button type="button" className={`btn btn--primary btn--${tab}`} onClick={() => setLibraryOpen(true)}>
            + {tab === "energy" ? "Adicionar aparelho" : "Adicionar atividade"}
          </button>

          {domainItems.length === 0 ? (
            <div className="empty card">
              <h2>Como começar</h2>
              <ol>
                <li>Toque em “{tab === "energy" ? "Adicionar aparelho" : "Adicionar atividade"}”.</li>
                <li>Escolha um item da biblioteca — ele já vem com valores de referência.</li>
                <li>Ajuste o que você souber (potência, tempo, frequência…).</li>
                <li>Veja a estimativa atualizar na hora.</li>
              </ol>
            </div>
          ) : (
            <div className="items">
              {domainItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  result={totals.results.get(item.id)!}
                  entry={entries.get(item.catalogId)}
                  mode={state.mode}
                  dispatch={dispatch}
                  initiallyOpen={item.id === justAdded}
                />
              ))}
            </div>
          )}

          {tab === "energy" ? (
            <EnergyTariffSettings tariff={state.energyTariff} mode={state.mode} dispatch={dispatch} />
          ) : (
            <WaterTariffSettings tariff={state.waterTariff} mode={state.mode} dispatch={dispatch} />
          )}
        </div>

        <aside className="panel__side">
          {domainItems.length > 0 ? (
            <ResultsPanel totals={totals} days={settings.days} />
          ) : (
            <section className="results card">
              <p className="muted">Os resultados aparecem aqui assim que você adicionar um item.</p>
            </section>
          )}
        </aside>
      </div>

      <section className="card settings" aria-labelledby="settings-title">
        <h2 id="settings-title">Configurações</h2>
        <div className="field-grid">
          <FieldInput
            id="days"
            label="Dias da simulação"
            unit="dias"
            step={1}
            min={1}
            max={31}
            field={{ value: daysDraft, origin: "user" }}
            onChange={(value) => {
              setDaysDraft(value);
              if (value !== null && validateDays(value) === null) dispatch({ type: "setDays", days: value });
            }}
            error={daysError}
            hint="Período usado para converter frequências e somar o consumo (padrão: 30)."
          />
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={state.persist} onChange={(event) => dispatch({ type: "setPersist", persist: event.target.checked })} />
          Salvar a simulação neste navegador (os dados nunca saem do seu aparelho)
        </label>
        <button
          type="button"
          className="btn btn--ghost btn--danger"
          onClick={() => {
            if (window.confirm("Apagar todos os itens e tarifas desta simulação?")) {
              clearStorage();
              dispatch({ type: "reset" });
              setDaysDraft(INITIAL_STATE.days);
            }
          }}
        >
          Limpar dados
        </button>
      </section>

      <footer className="app__footer muted">
        Todos os valores são estimativas. Valores de referência são aproximados e não substituem a medição ou a conta real.
      </footer>

      {libraryOpen && (
        <Library
          domain={tab}
          entries={catalog}
          categories={tab === "energy" ? ENERGY_CATEGORIES : WATER_CATEGORIES}
          onAdd={addEntry}
          onClose={closeLibrary}
        />
      )}
    </div>
  );
}
