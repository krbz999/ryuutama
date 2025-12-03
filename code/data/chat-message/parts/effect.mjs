import MessagePart from "./base.mjs";

/**
 * @import RyuutamaActor from "../../../documents/actor.mjs";
 * @import RyuutamaActiveEffect from "../../../documents/active-effect.mjs";
 */

const { ArrayField, DocumentUUIDField, NumberField, TypedObjectField } = foundry.data.fields;

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

  /** @override */
  static TEMPLATE = "systems/ryuutama/templates/chat/parts/effect.hbs";

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      effects: new ArrayField(new DocumentUUIDField({ embedded: true, type: "ActiveEffect" })),
      statuses: new TypedObjectField(
        new NumberField({ min: 2, max: 20, integer: true, nullable: false, initial: 4 }),
        { validateKey: key => key in ryuutama.config.statusEffects },
      ),
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
   * The statuses to be applied.
   * @type {Record<string, number>}
   */
  get appliedStatuses() {
    return foundry.utils.deepClone(this.statuses);
  }

  /* -------------------------------------------------- */

  /**
   * Effects and statuses to ignore. Storing either uuids or status ids.
   * @type {Set<string>}
   */
  #ignoredEffects = new Set();

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
        checked: !this.#ignoredEffects.has(effect.uuid),
      };
    });
    context.ctx.statuses = Object.entries(this.appliedStatuses).map(([statusId, strength]) => {
      return {
        statusId, strength,
        label: ryuutama.config.statusEffects[statusId].name,
        icon: ryuutama.config.statusEffects[statusId].img,
        checked: !this.#ignoredEffects.has(statusId),
      };
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _addListeners(html, context) {
    super._addListeners(html, context);

    for (const input of html.querySelectorAll("input[type=checkbox]")) {
      input.addEventListener("change", () => {
        const div = input.closest(".effect");
        const id = div.dataset.effectUuid ?? div.dataset.statusId;
        if (input.checked) this.#ignoredEffects.delete(id);
        else this.#ignoredEffects.add(id);
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
    const effects = this.appliedEffects.filter(effect => !this.#ignoredEffects.has(effect.uuid));
    const statuses = this.appliedStatuses;
    for (const k in statuses) if (this.#ignoredEffects.has(k)) delete statuses[k];
    for (const actorElement of element.querySelectorAll("effect-tray [data-actor-uuid]")) {
      const actor = fromUuidSync(actorElement.dataset.actorUuid);
      EffectPart.applyEffects(actor, effects, statuses);
    }
  }

  /* -------------------------------------------------- */

  /**
   * Apply effects to one actor.
   * @param {RyuutamaActor} actor
   * @param {RyuutamaActiveEffect[]} effects
   * @param {Record<string, number>} statuses
   * @returns {Promise}
   */
  static async applyEffects(actor, effects, statuses) {
    const toDelete = [];
    const toCreate = [];

    for (const effect of effects) {
      const existing = actor.effects.find(e => e.origin === effect.uuid);
      if (existing) toDelete.push(existing.id);

      const data = effect.toObject();
      data.origin = effect.uuid;
      toCreate.push(data);
    }

    await Promise.all([
      foundry.utils.isEmpty(toDelete) ? null : actor.deleteEmbeddedDocuments("ActiveEffect", toDelete),
      foundry.utils.isEmpty(toCreate) ? null : actor.createEmbeddedDocuments("ActiveEffect", toCreate),
    ]);

    for (const [statusId, strength] of Object.entries(statuses)) {
      const effect = await getDocumentClass("ActiveEffect").fromStatusEffect(statusId, { strength });
      if (actor.effects.has(effect.id)) {
        await actor.effects.get(effect.id).update(effect.toObject(), { diff: false, recursive: false });
      } else {
        await actor.createEmbeddedDocuments("ActiveEffect", [effect.toObject()], { keepId: true });
      }
    }
  }
}
