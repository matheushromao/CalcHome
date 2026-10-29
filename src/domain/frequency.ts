import type { Period } from "./types";

/** Converte uma frequência informada em um período para o total no período simulado. */
export function usesInSimulation(uses: number, period: Period, days: number): number {
  switch (period) {
    case "day":
      return uses * days;
    case "week":
      return (uses * days) / 7;
    case "month":
      return (uses * days) / 30;
  }
}

/** Máximo de utilizações possível no período (usado em "dias de uso"). */
export function maxDaysInPeriod(period: Period): number {
  switch (period) {
    case "day":
      return 1;
    case "week":
      return 7;
    case "month":
      return 31;
  }
}
