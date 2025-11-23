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

  /** @override */
  async use() {
    const formula = this.damage.formula || "@stats.spirit";
    const roll = new ryuutama.dice.DamageRoll(formula, this.actor.getRollData());
    await roll.evaluate();
    const Cls = getDocumentClass("ChatMessage");
    return Cls.create({
      type: "damage",
      speaker: Cls.getSpeaker({ actor: this.actor }),
      rolls: [roll],
      sound: null,
    });
  }
}
