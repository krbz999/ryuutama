export {};

import { ActiveEffectChangeData } from "@client/documents/_types.mjs";

declare module "./standard.mjs" {
  export default interface StandardData {
    changes: ActiveEffectChangeData[];
  }
}

/* -------------------------------------------------- */

declare module "./status.mjs" {
  export default interface StatusData {
    strength: {
      /** Does this bypass the target's condition? */
      bypass: boolean;
      /** The strength of the status. */
      value: number;
    }
  }
}
