export {};

import AbilityModel from "../../ability-model.mjs";

type ResourceData = {
  bonuses: {
    flat: number | null;
    level: number | null;
  };
  max: number;
  spent: number;
  value: number;
}

/* -------------------------------------------------- */

declare module "./base.mjs" {
  export default interface BaseData {}
}

/* -------------------------------------------------- */

declare module "./creature.mjs" {
  export default interface CreatureData {
    abilities: {
      strength: AbilityModel;
      dexterity: AbilityModel;
      intelligence: AbilityModel;
      spirit: AbilityModel;
    }
    condition: {
      immunities: Set<string>;
      statuses: {
        injury: number;
        poison: number;
        sickness: number;
        exhaustion: number;
        muddled: number;
        shock: number;
      }
      travel: boolean;
      value: number;
    }
    defense: {
      armor: number | null;
      modifiers: {
        magical: number | null;
        physical: number | null;
      }
    }
    properties: {
      weaponGrace: Set<string>;
    }
    resources: {
      mental: ResourceData;
      stamina: ResourceData;
    }
    source: {
      book: string;
      custom: string;
    }
  }
}
