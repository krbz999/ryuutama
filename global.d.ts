import "./code/_types.d.ts";
import "@client/global.d.mts";
import "@common/global.d.mts";
import "@common/primitives/global.d.mts";
import "@common/primitives/global.mjs";

import CurrentHabitat from "./code/applications/ui/current-habitat.mjs";

declare global {
  /**
   * A simple event framework used throughout Foundry Virtual Tabletop.
   * When key actions or events occur, a "hook" is defined where user-defined callback functions can execute.
   * This class manages the registration and execution of hooked callback functions.
   */
  class Hooks extends foundry.helpers.Hooks {}
  const fromUuid = foundry.utils.fromUuid;
  const fromUuidSync = foundry.utils.fromUuidSync;
  const getDocumentClass = foundry.utils.getDocumentClass;

  namespace ui {
    let habitat: CurrentHabitat;
  }
}
