import MessagePart from "./base.mjs";

/**
 * @import { DamageConfiguration } from "../../actor/templates/_types.mjs";
 */

export default class DamagePart extends MessagePart {
  static {
    Object.defineProperty(this, "TYPE", { value: "damage" });
  }

  /* -------------------------------------------------- */

  /** @override */
  static ACTIONS = {
    applyDamage: DamagePart.#applyDamage,
  };

  /* -------------------------------------------------- */

  /**
   * The template used for rendering this part in a chat message.
   * @type {string}
   */
  static TEMPLATE = "systems/ryuutama/templates/chat/parts/damage.hbs";

  /* -------------------------------------------------- */

  /**
   * The damage configs that will be applies by this message part.
   * @type {DamageConfiguration[]}
   */
  get damages() {
    return this.rolls.map(roll => {
      return {
        value: roll.total,
        options: {
          defenseless: roll.isDefenseless,
          magical: roll.isMagical,
          mythril: roll.isMythril,
          orichalcum: roll.isOrichalcum,
        },
      };
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareData() {
    super.prepareData();
    this.rolls = this.rolls.filter(roll => roll instanceof ryuutama.dice.DamageRoll);
  }

  /* -------------------------------------------------- */

  /**
   * Apply damage from this part.
   * @this DamagePart
   * @param {PointerEvent} event    Initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #applyDamage(event, target) {
    const damages = this.damages;
    const section = target.closest("[data-message-part]");
    for (const actorElement of section.querySelectorAll("damage-tray [data-actor-uuid]")) {
      const actor = fromUuidSync(actorElement.dataset.actorUuid);
      actor.system.applyDamage(damages);
    }
  }
}
