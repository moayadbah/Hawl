import { AisAccount, BankId } from "../types";
import { ScenarioId, isScenarioId, DEFAULT_SCENARIO } from "../scenarios";

import ahmedAlinma from "../../data/ahmed/alinma.json";
import ahmedRajhi from "../../data/ahmed/rajhi.json";
import ahmedSnb from "../../data/ahmed/snb.json";

const cast = (x: unknown) => x as unknown as AisAccount;

const DATA: Record<ScenarioId, Record<BankId, AisAccount>> = {
  ahmed: { alinma: cast(ahmedAlinma), rajhi: cast(ahmedRajhi), snb: cast(ahmedSnb) },
};

export const ALL_BANKS: BankId[] = ["alinma", "rajhi", "snb"];

export function isBankId(x: unknown): x is BankId {
  return x === "alinma" || x === "rajhi" || x === "snb";
}

export function resolveScenario(x: unknown): ScenarioId {
  return isScenarioId(x) ? x : DEFAULT_SCENARIO;
}

export function getAccount(scenario: ScenarioId, bank: BankId): AisAccount {
  return DATA[scenario][bank];
}

export function getAccounts(scenario: ScenarioId, banks: BankId[]): AisAccount[] {
  return banks.filter(isBankId).map((b) => DATA[scenario][b]);
}
