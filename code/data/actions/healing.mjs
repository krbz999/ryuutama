import Action from "./action.mjs";

const { SchemaField, SetField, StringField } = foundry.data.fields;

export default class HealingAction extends Action {
  static {
    Object.defineProperty(this, "TYPE", { value: "healing" });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      healing: new SchemaField({
        formula: new ryuutama.data.fields.FormulaField(),
        properties: new SetField(new StringField()),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ACTION.HEALING",
  ];

  /* -------------------------------------------------- */

  /** @override */
  async use() {
    const formula = this.healing.formula;
    if (!formula) {
      ui.notifications.error("RYUUTAMA.ITEM.SPELL.warnNoHealingFormula", { localize: true });
      return null;
    }

    const options = Object.fromEntries(Array.from(this.getHealingOptions()).map(k => [k, true]));
    const roll = new ryuutama.dice.HealingRoll(formula, this.actor.getRollData(), options);
    await roll.evaluate();
    return { type: "healing", rolls: [roll] };
  }

  /* -------------------------------------------------- */

  /**
   * Gather the roll properties.
   * @returns {Set<string>}
   */
  getHealingOptions() {
    const properties = new Set();
    return properties;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareSheetContext(context) {
    super.prepareSheetContext(context);
    context.actionTemplate = "item-action-healing";
    context.actionProperties = Object.entries(ryuutama.config.healingRollProperties).map(([k, v]) => ({
      value: k,
      label: v.label,
    }));
  }
}
