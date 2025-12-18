import Action from "./action.mjs";

const { SchemaField, SetField, StringField } = foundry.data.fields;

export default class DamageAction extends Action {
  static {
    Object.defineProperty(this, "TYPE", { value: "damage" });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      damage: new SchemaField({
        formula: new ryuutama.data.fields.FormulaField(),
        properties: new SetField(new StringField()),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ACTION.DAMAGE",
  ];

  /* -------------------------------------------------- */

  /** @override */
  async use() {
    const formula = this.damage.formula;
    if (!formula) {
      ui.notifications.error("RYUUTAMA.ITEM.SPELL.warnNoDamageFormula", { localize: true });
      return null;
    }

    const options = Object.fromEntries(Array.from(this.getRollOptions("damage")).map(k => [k, true]));
    const roll = new ryuutama.dice.DamageRoll(formula, this.actor.getRollData(), options);
    await roll.evaluate();
    return { type: "damage", rolls: [roll] };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareSheetContext(context) {
    super.prepareSheetContext(context);
    context.actionTemplate = "item-action-damage";
    context.actionProperties = Object.entries(ryuutama.config.damageRollProperties)
      .filter(([k, v]) => v.visible !== false)
      .map(([k, v]) => ({ value: k, label: v.label }));
  }
}
