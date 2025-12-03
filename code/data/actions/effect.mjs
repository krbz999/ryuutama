import Action from "./action.mjs";

/**
 * @import RyuutamaActiveEffect from "../../documents/active-effect.mjs";
 */

const { BooleanField, NumberField, SchemaField, SetField, StringField, TypedObjectField } = foundry.data.fields;

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
          enabled: new BooleanField(),
          strength: new NumberField({ integer: true, initial: 4, min: 2, max: 20, nullable: false }),
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
    if (!effects.length && !Object.values(this.effects.statuses).some(k => k.enabled)) {
      ui.notifications.error("RYUUTAMA.ITEM.SPELL.warnNoApplicableEffects", { localize: true });
      return null;
    }
    return {
      type: "effect",
      effects: effects.map(e => e.uuid),
      statuses: Object.fromEntries(
        Object.entries(this.effects.statuses)
          .filter(s => s[1].enabled)
          .map(([k, v]) => [k, v.strength]),
      ),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareSheetContext(context) {
    super.prepareSheetContext(context);
    context.actionTemplate = "item-action-effect";
    context.actionEffectIds = this.document.effects.map(e => ({ value: e.id, label: e.name }));
    context.actionStatuses = Object.entries(ryuutama.config.statusEffects)
      .map(([k, v]) => ({
        status: k,
        label: v.name,
        strength: this.effects.statuses[k]?.strength,
        enabled: this.effects.statuses[k]?.enabled,
        namePrefix: `system.action.effects.statuses.${k}.`,
        strengthField: this.schema.getField("effects.statuses.element.strength"),
        enabledField: this.schema.getField("effects.statuses.element.enabled"),
      }));
  }
}
