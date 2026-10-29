import { formatKWh, formatLiters, formatM3, formatMoney, formatPercent } from "@/domain/format";
import type { DomainTotals } from "@/domain/totals";

export const PENDING_WARNING =
  "Este resultado considera apenas os itens calculáveis. Existem itens pendentes que podem aumentar o consumo total.";

export function ResultsPanel({ totals, days }: { totals: DomainTotals; days: number }) {
  const isEnergy = totals.domain === "energy";
  const fmt = isEnergy ? formatKWh : formatLiters;
  const pendingNote = totals.pending > 0;

  return (
    <section className={`results results--${totals.domain}`} aria-labelledby={`results-${totals.domain}`} aria-live="polite">
      <h2 id={`results-${totals.domain}`}>Resultado {isEnergy ? "de energia" : "de água"}</h2>
      <p className="muted">
        {totals.calculated} {totals.calculated === 1 ? "item calculado" : "itens calculados"} · {totals.pending}{" "}
        {totals.pending === 1 ? "pendente" : "pendentes"} · período de {days} dias
      </p>

      {pendingNote && (
        <p className="warning" role="status">
          {PENDING_WARNING}
        </p>
      )}

      {totals.calculated === 0 ? (
        <p className="muted">Nenhum item calculável ainda. Complete os dados dos itens pendentes ou adicione outro item.</p>
      ) : (
        <>
          <dl className="stats">
            <div>
              <dt>Consumo diário estimado</dt>
              <dd>{fmt(totals.daily)}</dd>
            </div>
            <div>
              <dt>Consumo mensal estimado{pendingNote ? " (parcial)" : ""}</dt>
              <dd>{fmt(totals.monthly)}</dd>
            </div>
            {!isEnergy && (
              <div>
                <dt>Consumo mensal em m³</dt>
                <dd>{formatM3(totals.monthly / 1000)}</dd>
              </div>
            )}
            <div>
              <dt>Custo mensal estimado</dt>
              <dd>
                {totals.cost !== null ? (
                  <>
                    {formatMoney(totals.cost)}
                    {pendingNote && <small> (parcial)</small>}
                  </>
                ) : (
                  <small className="muted">
                    Informe a tarifa {isEnergy ? "(R$/kWh) da sua conta de energia" : "(R$/m³) da sua conta de água"} para ver o custo.
                  </small>
                )}
              </dd>
            </div>
          </dl>

          <h3>Maiores consumidores</h3>
          <ol className="ranking">
            {totals.ranking.map(({ item, monthly, share }) => (
              <li key={item.id}>
                <div className="ranking__label">
                  <span>
                    <span aria-hidden="true">{item.icon}</span> {item.name}
                  </span>
                  <span>
                    {fmt(monthly)}
                    {share !== null && <> · {formatPercent(share)}</>}
                  </span>
                </div>
                <div className="bar" aria-hidden="true">
                  <div className="bar__fill" style={{ width: `${share !== null ? Math.max(share * 100, 1) : 0}%` }} />
                </div>
              </li>
            ))}
          </ol>
          {totals.cost !== null && (
            <p className="disclaimer">
              {isEnergy
                ? "O valor pode divergir da fatura real por impostos, bandeiras tarifárias, custo de disponibilidade e outras cobranças."
                : "O valor pode divergir da fatura real por faixas de consumo, tarifa mínima, impostos e outras cobranças."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
