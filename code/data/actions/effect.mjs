import Action from "./action.mjs";

/**
 * @import RyuutamaActiveEffect from "../../documents/active-effect.mjs";
 * @import RyuutamaChatMessage from "../../documents/chat-message.mjs";
 */

const { NumberField, SchemaField, SetField, StringField, TypedObjectField } = foundry.data.fields;

export default class EffectAction extends Action {
  static {
    Object.defineProperty(this, "TYPE", { value: "effect" });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      effects: new SchemaField({
        ids: new SetField(new StringField()),
        statuses: new TypedObjectField(new SchemaField({
          strength: new NumberField({ integer: true, initial: 6, min: 1, max: 30, nullable: false }),
        }), { validateKey: key => key in ryuutama.config.statusEffects }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /**
   * The effects of this item that can be applied by this action.
   * @type {RyuutamaActiveEffect[]}
   */
  get applicableEffects() {
    return this.document.effects.filter(effect => this.effects.ids.has(effect.id));
  }

  /* -------------------------------------------------- */

  /**
   * Use this action.
   * @returns {Promise<RyuutamaChatMessage>}
   */
  async use() {
    const Cls = getDocumentClass("ChatMessage");
    return Cls.create({
      type: "effect",
      speaker: Cls.getSpeaker({ actor: this.actor }),
      "system.effects": this.applicableEffects.map(e => e.uuid),
    });
  }
}
