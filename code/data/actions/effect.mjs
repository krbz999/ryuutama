import Action from "./action.mjs";

/**
 * @import RyuutamaActiveEffect from "../../documents/active-effect.mjs";
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

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ACTION.EFFECT",
  ];

  /* -------------------------------------------------- */

  /**
   * The effects of this item that can be applied by this action.
   * @type {RyuutamaActiveEffect[]}
   */
  get applicableEffects() {
    return this.document.effects.filter(effect => this.effects.ids.has(effect.id));
  }

  /* -------------------------------------------------- */

  /** @override */
  async use() {
    const effects = this.applicableEffects;
    if (!effects.length) {
      ui.notifications.error("RYUUTAMA.ITEM.SPELL.warnNoApplicableEffects", { localize: true });
      return null;
    }
    return {
      type: "effect",
      effects: effects.map(e => e.uuid),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareSheetContext(context) {
    super.prepareSheetContext(context);
    context.actionTemplate = "item-action-effect";
    context.actionEffectIds = this.document.effects.map(e => ({ value: e.id, label: e.name }));
  }
}
