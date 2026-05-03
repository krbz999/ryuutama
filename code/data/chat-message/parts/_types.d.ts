export {};

import { BaseRoll, DamageRoll, HealingRoll } from "../../../dice/_module.mjs";

declare module "./base.mjs" {
  export default interface MessagePart {
    type: "check" | "damage" | "effect" | "healing" | "request" | "roll";
    rolls: BaseRoll[];
    flavor: string;
  }
}

/* -------------------------------------------------- */

declare module "./check.mjs" {
  export default interface CheckPart {
    grantedFumble: boolean;
  }
}

/* -------------------------------------------------- */

declare module "./damage.mjs" {
  export default interface DamagePart {
    rolls: DamageRoll[];
  }
}

/* -------------------------------------------------- */

declare module "./effect.mjs" {
  export default interface EffectPart {
    itemUuid: string;
  }
}

/* -------------------------------------------------- */

declare module "./healing.mjs" {
  export default interface HealingPart {
    rolls: HealingRoll[];
  }
}

/* -------------------------------------------------- */

declare module "./request.mjs" {
  export default interface RequestPart {
    check: {
      configuration: object;
    }
    results: { actorUuid: string, result: number, actor: RyuutamaActor }[];
  }
}

/* -------------------------------------------------- */

declare module "./roll.mjs" {
  export default interface RollPart {}
}
