import MessagePart from "./base.mjs";

export default class HealingPart extends MessagePart {
  static {
    Object.defineProperty(this, "TYPE", { value: "healing" });
  }

  /* -------------------------------------------------- */

  /** @override */
  static ACTIONS = {
    applyHealing: HealingPart.#applyHealing,
  };

  /* -------------------------------------------------- */

  /** @override */
  static TEMPLATE = "systems/ryuutama/templates/chat/parts/healing.hbs";

  /* -------------------------------------------------- */

  /**
   * The healing configs that will be applied by this message part.
   * @type {{ value: number, options: object }[]}
   */
  get healings() {
    return this.rolls.map(roll => {
      return {
        value: roll.total,
        options: {},
      };
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareData() {
    super.prepareData();
    this.rolls = this.rolls.filter(roll => roll instanceof ryuutama.dice.HealingRoll);
    this.flavor ||= _loc("RYUUTAMA.CHAT.HEALING.defaultRollFlavor");
  }

  /* -------------------------------------------------- */

  /**
   * Apply healing from this part.
   * @this HealingPart
   * @param {PointerEvent} event    Initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #applyHealing(event, target) {
    const configs = this.healings;
    const section = target.closest("[data-message-part]");
    for (const actorElement of section.querySelectorAll("healing-tray [data-actor-uuid]")) {
      const actor = fromUuidSync(actorElement.dataset.actorUuid);
      actor.system.applyHealing(configs);
    }
  }
}
