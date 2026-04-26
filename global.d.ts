import "./code/_types";
import "@client/global.mjs";
import "@common/global.mjs";
import "@common/primitives/global.mjs";

import CurrentHabitat from "./code/applications/ui/current-habitat.mjs";
import RyuutamaActorsDirectory from "./code/applications/sidebar/tabs/actors.mjs";
import RyuutamaCombatTracker from "./code/applications/sidebar/tabs/combats.mjs";
import RyuutamaCompendiumDirectory from "./code/applications/sidebar/tabs/compendium.mjs";
import RyuutamaGamePause from "./code/applications/ui/game-pause.mjs";
import RyuutamaItemsDirectory from "./code/applications/sidebar/tabs/items.mjs";

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
    let actors: RyuutamaActorsDirectory;
    let combats: RyuutamaCombatTracker;
    let compendium: RyuutamaCompendiumDirectory;
    let habitat: CurrentHabitat;
    let items: RyuutamaItemsDirectory;
    let pause: RyuutamaGamePause;
  }
}
