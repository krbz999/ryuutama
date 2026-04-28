export {};

import "./active-effect/_types";
import "./actor/_types";
import "./chat-message/_types";
import "./combat/_types";
import "./combatant/_types";
import "./item/_types";
import "./journal-entry-page/_types";

declare module "./ability-model.mjs" {
  export default interface AbilityModel {
    value: number;
  }
}

/* -------------------------------------------------- */

declare module "./actions-model.mjs" {
  export default interface ActionsModel {
    damage: {
      formula: string;
      properties: Set<string>;
    }
    healing: {
      formula: string;
      properties: Set<string>;
    }
  }
}

/* -------------------------------------------------- */

declare module "./attack-model.mjs" {
  export default interface AttackModel {
    accuracy: {
      die1: string | null;
      die2: string | null;
      bonus: number | null;
    }
    damage: {
      die: string | null;
      bonus: number | null;
    }
  }
}
