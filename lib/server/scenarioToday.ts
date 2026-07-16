import { AisAccount } from "../types";
import { aggregateDaily } from "../zakat";
import { firstCompletion } from "../simEngine";
import { getNisabSeries } from "./silverPrice";

/**
 * The scenario's canonical "today" (first hawl completion), computed from ALL of
 * its accounts regardless of which subset the caller is actually connecting —
 * so a single bank's displayed balance always matches its contribution to the
 * canonical as-of-today total, no matter the connection order.
 */
export async function getScenarioToday(accounts: AisAccount[]): Promise<string> {
  const raw = aggregateDaily(accounts);
  if (!raw.length) return "";
  const nis = await getNisabSeries(raw[0].date, raw[raw.length - 1].date);
  const priced = raw.map((d) => ({ ...d, nisab: nis.byDate[d.date] }));
  return firstCompletion(priced) ?? raw[raw.length - 1].date;
}
