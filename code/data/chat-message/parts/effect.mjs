import MessagePart from "./base.mjs";

/**
 * @import RyuutamaActor from "../../../documents/actor.mjs";
 * @import RyuutamaActiveEffect from "../../../documents/active-effect.mjs";
 */

const { ArrayField, DocumentUUIDField } = foundry.data.fields;

export default class EffectPart extends MessagePart {
  static {
    Object.defineProperty(this, "TYPE", { value: "effect" });
  }

  /* -------------------------------------------------- */

  /** @override */
  static ACTIONS = {
    applyEffects: EffectPart.#applyEffects,
  };

  /* -------------------------------------------------- */

  /**
   * The template used for rendering this part in a chat message.
   * @type {string}
   */
  static TEMPLATE = "systems/ryuutama/templates/chat/parts/effect.hbs";

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      effects: new ArrayField(new DocumentUUIDField({ embedded: true, type: "ActiveEffect" })),
    });
  }

  /* -------------------------------------------------- */

  /**
   * The damage configs that will be applied by this message.
   * @type {RyuutamaActiveEffect[]}
   */
  get appliedEffects() {
    return this.effects.map(uuid => fromUuidSync(uuid)).filter(_ => _);
  }

  /* -------------------------------------------------- */

  /**
   * Effects whose checkboxes have been modified.
   * If the uuid of an effect does not exist here, it is assumed to be checked.
   * @type {Map<string, boolean>}
   */
  #checkedEffects = new Map();

  /* -------------------------------------------------- */

  /** @override */
  get visible() {
    return game.user.isGM;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);
    context.ctx.effects = this.appliedEffects.map(effect => {
      return {
        effect,
        checked: this.#checkedEffects.get(effect.uuid) ?? true,
      };
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _addListeners(html, context) {
    super._addListeners(html, context);

    for (const input of html.querySelectorAll("input[type=checkbox]")) {
      input.addEventListener("change", () => {
        this.#checkedEffects.set(input.closest("[data-effect-uuid]").dataset.effectUuid, input.checked);
      });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Apply effects from this part.
   * @this EffectPart
   * @param {PointerEvent} event    Initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #applyEffects(event, target) {
    const element = target.closest("[data-message-part]");
    const effects = this.appliedEffects.filter(effect => this.#checkedEffects.get(effect.uuid) !== false);
    for (const actorElement of element.querySelectorAll("effect-tray [data-actor-uuid]")) {
      const actor = fromUuidSync(actorElement.dataset.actorUuid);
      EffectPart.applyEffects(actor, effects);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Apply effects to one actor.
   * @param {RyuutamaActor} actor
   * @param {RyuutamaActiveEffect[]} effects
   * @returns {Promise}
   */
  static async applyEffects(actor, effects) {
    const toDelete = [];
    const toCreate = [];

    for (const effect of effects) {
      const existing = actor.effects.find(e => e.origin === effect.uuid);
      if (existing) toDelete.push(existing.id);

      const data = effect.toObject();
      data.origin = effect.uuid;
      toCreate.push(data);
    }

    return Promise.all([
      foundry.utils.isEmpty(toDelete) ? null : actor.deleteEmbeddedDocuments("ActiveEffect", toDelete),
      foundry.utils.isEmpty(toCreate) ? null : actor.createEmbeddedDocuments("ActiveEffect", toCreate),
    ]);
  }
}
