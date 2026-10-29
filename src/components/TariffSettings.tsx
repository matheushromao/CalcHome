import { energyTariffErrors, waterTariffErrors } from "@/domain/tariffs";
import type { EnergyTariff, SewerMode, WaterTariff } from "@/domain/types";
import { validateMoney } from "@/domain/validation";
import type { Action, Mode } from "@/state/simulation";
import { FieldInput } from "./FieldInput";

const user = (value: number | null) => ({ value, origin: "user" as const });

export function EnergyTariffSettings({ tariff, mode, dispatch }: { tariff: EnergyTariff; mode: Mode; dispatch: (a: Action) => void }) {
  const set = (patch: Partial<EnergyTariff>) => dispatch({ type: "setEnergyTariff", tariff: patch });
  const errors = energyTariffErrors(tariff);
  return (
    <details className="card tariff" open={tariff.rate !== null || undefined}>
      <summary>
        Tarifa de energia <span className="muted">(opcional)</span>
      </summary>
      <p className="muted">Consulte o valor por kWh na sua conta de energia. Sem tarifa, mostramos só o consumo em kWh.</p>
      <div className="field-grid">
        <FieldInput id="energy-rate" label="Tarifa" unit="R$/kWh" field={user(tariff.rate)} onChange={(rate) => set({ rate })} error={validateMoney("Tarifa", tariff.rate)} />
        {mode === "detailed" && (
          <>
            <FieldInput id="energy-extra" label="Valor adicional por kWh" unit="R$/kWh" field={user(tariff.extraPerKWh)} onChange={(extraPerKWh) => set({ extraPerKWh })} error={validateMoney("Valor adicional", tariff.extraPerKWh)} hint="Ex.: bandeira tarifária. Não inclua o que já está na tarifa." />
            <FieldInput id="energy-fixed" label="Valor fixo mensal" unit="R$" field={user(tariff.fixed)} onChange={(fixed) => set({ fixed })} error={validateMoney("Valor fixo", tariff.fixed)} />
          </>
        )}
      </div>
      {errors.length > 0 && <p className="warning">Corrija a tarifa para calcular o custo.</p>}
    </details>
  );
}

export function WaterTariffSettings({ tariff, mode, dispatch }: { tariff: WaterTariff; mode: Mode; dispatch: (a: Action) => void }) {
  const set = (patch: Partial<WaterTariff>) => dispatch({ type: "setWaterTariff", tariff: patch });
  const errors = waterTariffErrors(tariff);
  return (
    <details className="card tariff" open={tariff.rate !== null || undefined}>
      <summary>
        Tarifa de água <span className="muted">(opcional)</span>
      </summary>
      <p className="muted">Consulte o valor por m³ na sua conta de água. Sem tarifa, mostramos só o consumo em litros e m³.</p>
      <div className="field-grid">
        <FieldInput id="water-rate" label="Tarifa" unit="R$/m³" field={user(tariff.rate)} onChange={(rate) => set({ rate })} error={validateMoney("Tarifa", tariff.rate)} />
        {mode === "detailed" && (
          <>
            <FieldInput id="water-extra" label="Custo adicional por m³" unit="R$/m³" field={user(tariff.extraPerM3)} onChange={(extraPerM3) => set({ extraPerM3 })} error={validateMoney("Custo adicional", tariff.extraPerM3)} />
            <div className="field">
              <label htmlFor="water-sewer-mode" className="field__label">
                Cobrança de esgoto
              </label>
              <select id="water-sewer-mode" value={tariff.sewerMode} onChange={(event) => set({ sewerMode: event.target.value as SewerMode })}>
                <option value="none">Não incluir / não sei</option>
                <option value="perM3">Valor por m³</option>
                <option value="percent">Percentual sobre a água</option>
              </select>
            </div>
            {tariff.sewerMode !== "none" && (
              <FieldInput
                id="water-sewer"
                label="Esgoto"
                unit={tariff.sewerMode === "percent" ? "%" : "R$/m³"}
                field={user(tariff.sewerValue)}
                onChange={(sewerValue) => set({ sewerValue })}
                error={validateMoney("Esgoto", tariff.sewerValue)}
                hint="Use a regra que aparece na sua conta; ela varia entre regiões."
              />
            )}
            <FieldInput id="water-fixed" label="Valor fixo mensal" unit="R$" field={user(tariff.fixed)} onChange={(fixed) => set({ fixed })} error={validateMoney("Valor fixo", tariff.fixed)} />
          </>
        )}
      </div>
      {errors.length > 0 && <p className="warning">Corrija a tarifa para calcular o custo.</p>}
    </details>
  );
}
