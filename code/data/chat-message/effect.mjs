import MessageData from "./templates/message.mjs";

/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import RyuutamaActiveEffect from "../../documents/active-effect.mjs";
 */

const { ArrayField, DocumentUUIDField } = foundry.data.fields;

export default class EffectData extends MessageData {
  /** @inheritdoc */
  static PARTS = {
    ...super.PARTS,
    effectList: "systems/ryuutama/templates/chat/effect-list.hbs",
    effectTray: "systems/ryuutama/templates/chat/effect-tray.hbs",
  };

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return {
      effects: new ArrayField(new DocumentUUIDField({ embedded: true, type: "ActiveEffect" })),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.CHAT.EFFECT",
  ];

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
  async _prepareContext(context) {
    context.effects = this.appliedEffects.map(effect => {
      return {
        effect,
        checked: this.#checkedEffects.get(effect.uuid) ?? true,
      };
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  _attachPartListeners(partId, element, context) {
    if (partId === "effectTray") {
      element.querySelector("[data-action=applyEffects]")?.addEventListener("click", EffectData.#applyEffects.bind(this));
    }

    if (partId === "effectList") {
      for (const input of element.querySelectorAll("input[type=checkbox]")) {
        input.addEventListener("change", () => {
          this.#checkedEffects.set(input.closest("[data-effect-uuid]").dataset.effectUuid, input.checked);
        });
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * @this EffectData
   */
  static #applyEffects(event) {
    const element = event.currentTarget.closest("[data-message-id]");
    const effects = this.appliedEffects.filter(effect => this.#checkedEffects.get(effect.uuid) !== false);
    for (const actorElement of element.querySelectorAll("effect-tray [data-actor-uuid]")) {
      const actor = fromUuidSync(actorElement.dataset.actorUuid);
      EffectData.applyEffects(actor, effects);
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
