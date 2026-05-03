import MessagePart from "./base.mjs";

/**
 * @import RyuutamaItem from "../../../documents/item.mjs";
 */

const { DocumentUUIDField } = foundry.data.fields;

export default class EffectPart extends MessagePart {
  static {
    Object.defineProperty(this, "TYPE", { value: "effect" });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static ACTIONS = {
    applyEffects: EffectPart.#applyEffects,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TEMPLATE = "systems/ryuutama/templates/chat/parts/effect.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      itemUuid: new DocumentUUIDField({ type: "Item", embedded: true }),
    });
  }

  /* -------------------------------------------------- */

  /**
   * The item used.
   * @type {RyuutamaItem|null}
   */
  get item() {
    return fromUuidSync(this.itemUuid);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get visible() {
    return game.user.isGM || (this.item?.system.actions.effects.config.self ?? false);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);
    const item = this.item;
    const { statuses, config } = item?.system.actions.effects ?? {};
    context.ctx.showTray = !!item && (!config.self || !foundry.utils.isEmpty(statuses));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _addListeners(html, context) {
    super._addListeners(html, context);
  }

  /* -------------------------------------------------- */

  /**
   * Apply effects from this part.
   * @this EffectPart
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #applyEffects(event, target) {
    const item = this.item;
    item.system.actions.applyEffects();
  }
}
