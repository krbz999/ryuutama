export type AbilityData = {
  die: string;
  faces: number;
  // The die size of the ability.
  value: number;
};

/* -------------------------------------------------- */

export type ResourceData = {
  advancement?: number;
  bonuses: {
    flat: number | null;
    level: number | null;
  };
  gear?: number;
  pct: number;
  max: number;
  negative: boolean;
  spent: number;
  typeBonus?: number;
  value: number;
};

/* -------------------------------------------------- */

declare module "./base.mjs" {
  export default interface BaseData {
    source: {
      book: string;
      custom: string;
    };
  }
}

/* -------------------------------------------------- */

declare module "./creature.mjs" {
  export default interface CreatureData {
    condition: {
      immunities: Set<string>;
      rationing: number;
      shape: {
        high: string;
      };
      statuses: Record<string, number>;
      value: number;
    };
    defense: {
      // Baseline defense/armor.
      armor: number | null;
      modifiers: {
        // Damage modification to magical damage received.
        magical: number | null;
        // Damage modification to physical damage received.
        physical: number | null;
      };
    };
    resources: {
      mental: ResourceData;
      stamina: ResourceData;
    };
  }
}
