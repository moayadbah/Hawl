// Single demo scenario. Kept as a tiny module so the API/data layer can stay
// scenario-addressable if more are added later.

export type ScenarioId = "ahmed";

export const DEFAULT_SCENARIO: ScenarioId = "ahmed";

export function isScenarioId(x: unknown): x is ScenarioId {
  return x === "ahmed";
}
