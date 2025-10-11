import MessageData from "./templates/message.mjs";

/**
 * @import { DamageConfiguration } from "../actor/templates/_types.mjs";
 */

export default class DamageData extends MessageData {
  /** @inheritdoc */
  static PARTS = {
    ...super.PARTS,
    damageRolls: "systems/ryuutama/templates/chat/damage-rolls.hbs",
    damageTray: "systems/ryuutama/templates/chat/damage-tray.hbs",
  };

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return {};
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.CHAT.DAMAGE",
  ];

  /* -------------------------------------------------- */

  /**
   * The damage configs that will be applied by this message.
   * @type {DamageConfiguration[]}
   */
  get damages() {
    return this.parent.rolls.map(roll => {
      return {
        value: roll.total,
        magical: roll.isMagical,
      };
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  async _prepareContext(context) {
    context.rolls = await Promise.all(this.parent.rolls.map(roll => roll.render()));
  }

  /* -------------------------------------------------- */

  /** @override */
  _attachPartListeners(partId, element, context) {
    if (partId !== "damageTray") return;

    element.querySelector("[data-action=applyDamage]").addEventListener("click", DamageData.#applyDamage.bind(this));
  }

  /* -------------------------------------------------- */

  /**
   * @this DamageData
   */
  static #applyDamage(event) {
    const element = event.currentTarget.closest("[data-message-id]");
    const damages = this.damages;
    for (const actorElement of element.querySelectorAll("damage-tray [data-actor-uuid]")) {
      const actor = fromUuidSync(actorElement.dataset.actorUuid);
      actor.system.applyDamage(damages);
    }
  }
}
