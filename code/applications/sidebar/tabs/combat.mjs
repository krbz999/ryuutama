export default class RyuutamaCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {
  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      addObjects: RyuutamaCombatTracker.#addObjects,
      toggleObject: RyuutamaCombatTracker.#toggleObject,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    const combat = game.combats.viewed;
    if (combat?.system._onRender instanceof Function) {
      await combat.system._onRender(this.element);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getEntryContextOptions() {
    const options = super._getEntryContextOptions();
    const index = options.findIndex(o => o.name === "COMBAT.CombatantReroll");
    if (index !== -1) options.splice(index + 1, 0, {
      name: "RYUUTAMA.COMBAT.rollDelayed",
      icon: "<i class='fa-solid fa-dice-d20'></i>",
      callback: li => {
        const combatant = this.viewed.combatants.get(li.dataset.combatantId);
        combatant.actor?.system.rollInitiative({ initiative: { delayed: true } });
      },
    });
    return options;
  }

  /* -------------------------------------------------- */

  /**
   * Add a new set of 5 objects to the combat.
   * @param {PointerEvent} event    Initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static #addObjects(event, target) {
    const combat = game.combats.viewed;
    if (combat?.type !== "standard") return;
    combat.system.addObjects(5);
  }

  /* -------------------------------------------------- */

  /**
   * Toggle the disabled state of an object.
   * @param {PointerEvent} event    Initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static #toggleObject(event, target) {
    const combat = game.combats.viewed;
    if (combat?.type !== "standard") return;
    const id = target.closest("[data-object-id]").dataset.objectId;
    combat.system.toggleObject(id);
  }
}
