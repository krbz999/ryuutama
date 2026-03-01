import "./code/_types.d.ts";
import "@client/global.mjs";
import "@common/primitives/global.d.mts";
import "@common/primitives/global.mjs";

import CurrentHabitat from "./code/applications/ui/current-habitat.mjs";

// Foundry's use of `Object.assign(globalThis)` means many globally available objects are not read as such
// This declare global hopefully fixes that
declare global {
  // not a real extension of course but simplest way for this to work with the intellisense.
  /**
   * A simple event framework used throughout Foundry Virtual Tabletop.
   * When key actions or events occur, a "hook" is defined where user-defined callback functions can execute.
   * This class manages the registration and execution of hooked callback functions.
   */
  class Hooks extends foundry.helpers.Hooks {}
  const fromUuid = foundry.utils.fromUuid;
  const fromUuidSync = foundry.utils.fromUuidSync;
  const getDocumentClass = foundry.utils.getDocumentClass;
  const _del = new foundry.data.operators.ForcedDeletion();
  const _replace = new foundry.data.operators.ForcedReplacement();

  namespace ui {
    let habitat: CurrentHabitat;
  }
}
